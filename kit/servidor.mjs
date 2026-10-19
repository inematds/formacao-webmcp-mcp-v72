// servidor.mjs — o servidor MCP de exemplo do curso (serviço fictício de turmas).
// SDK oficial v2 (@modelcontextprotocol/server 2.3.1, de 05/10/2026), que serve a
// revisão 2026-07-28 do MCP e, pelo mesmo código, clientes da revisão 2025-11-25.
// Não chama modelo nem serviço pago: os dados ficam na memória do processo.
import { McpServer, acceptedContent, inputRequired, inputResponse, requireScopes } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

export const TURMAS = [
  { id: 'html-01', titulo: 'HTML semântico para agentes', vagas: 3 },
  { id: 'mcp-01', titulo: 'Servidor MCP em uma tarde', vagas: 1 },
  { id: 'mcp-02', titulo: 'MCP com autorização', vagas: 0 }
];

const Turma = z.object({ id: z.string(), titulo: z.string(), vagas: z.int() });
const Confirma = z.object({ confirmar: z.boolean().meta({ title: 'Confirmar a reserva' }) });

export function createServer() {
  const server = new McpServer({ name: 'turmas', version: '1.0.0' });

  // 1) Ferramenta só de leitura: o cliente pode aprovar sem perguntar.
  server.registerTool(
    'buscar_turmas',
    {
      title: 'Buscar turmas',
      description: 'Lista turmas cujo título contém o termo. Só leitura: não reserva nada.',
      inputSchema: z.object({
        termo: z.string().min(2).describe('Parte do título, ex.: "mcp"'),
        limite: z.int().min(1).max(20).optional().describe('Máximo de turmas (padrão 5)')
      }),
      outputSchema: z.object({ turmas: z.array(Turma) }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false }
    },
    async ({ termo, limite }) => {
      const t = termo.toLowerCase();
      const turmas = TURMAS.filter(x => x.titulo.toLowerCase().includes(t)).slice(0, limite ?? 5);
      return {
        content: [{ type: 'text', text: turmas.map(x => `${x.id} · ${x.titulo} · ${x.vagas} vagas`).join('\n') || 'nenhuma turma' }],
        structuredContent: { turmas }
      };
    }
  );

  // 2) Ferramenta com consequência: pede confirmação ao usuário no meio da chamada (MRTR).
  server.registerTool(
    'reservar_vaga',
    {
      title: 'Reservar vaga',
      description: 'Reserva uma vaga na turma para o e-mail informado. Tem consequência: pede confirmação antes.',
      inputSchema: z.object({
        turma_id: z.string().describe('Id da turma, ex.: "mcp-01"'),
        email: z.email().describe('E-mail de quem vai fazer a turma')
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      // Com token (http-auth.mjs), exige o escopo turmas:reservar; sem token (stdio), não se aplica.
      scopeChallenge: requireScopes('turmas:reservar')
    },
    async ({ turma_id, email }, ctx) => {
      const turma = TURMAS.find(x => x.id === turma_id);
      if (!turma) return { content: [{ type: 'text', text: `turma ${turma_id} não existe` }], isError: true };
      if (turma.vagas < 1) return { content: [{ type: 'text', text: `turma ${turma_id} sem vagas` }], isError: true };

      const resposta = inputResponse(ctx.mcpReq.inputResponses, 'confirmar');
      if (resposta.kind === 'elicit' && resposta.action !== 'accept') {
        return { content: [{ type: 'text', text: 'reserva cancelada pelo usuário' }], isError: true };
      }
      const ok = acceptedContent(ctx.mcpReq.inputResponses, 'confirmar', Confirma);
      if (ok?.confirmar !== true) {
        return inputRequired({
          inputRequests: {
            confirmar: inputRequired.elicit({ message: `Reservar 1 vaga em "${turma.titulo}" para ${email}?`, requestedSchema: Confirma })
          }
        });
      }
      turma.vagas -= 1;
      return { content: [{ type: 'text', text: `reservado: ${turma_id} para ${email} (restam ${turma.vagas})` }] };
    }
  );

  // 3) Recurso: dado que o cliente lê quando quiser (não é ação).
  server.registerResource(
    'catalogo',
    'turmas://catalogo',
    { title: 'Catálogo de turmas', description: 'Todas as turmas em JSON', mimeType: 'application/json' },
    async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(TURMAS) }] })
  );

  // 4) Prompt: modelo de pedido que o usuário escolhe no cliente.
  server.registerPrompt(
    'convite_turma',
    {
      title: 'Convite para a turma',
      description: 'Monta o pedido de um convite curto para uma turma',
      argsSchema: z.object({ turma_id: z.string() })
    },
    async ({ turma_id }) => ({
      messages: [{ role: 'user', content: { type: 'text', text: `Escreva um convite de 3 linhas para a turma ${turma_id}, usando o recurso turmas://catalogo.` } }]
    })
  );

  return server;
}
