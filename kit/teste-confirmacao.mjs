// teste-confirmacao.mjs — mostra o MRTR (revisão 2026-07-28): a ferramenta reservar_vaga
// devolve resultType "input_required"; o cliente pergunta ao usuário e repete a chamada.
// Uso: node teste-confirmacao.mjs sim   (o "usuário" aceita)
//      node teste-confirmacao.mjs nao   (o "usuário" recusa)
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './servidor.mjs';

const resposta = process.argv[2] === 'nao' ? 'nao' : 'sim';
const handler = createMcpHandler(createServer);
const ligar = async extra => {
  const c = new Client({ name: 'teste-confirmacao', version: '1.0.0' },
    { versionNegotiation: { mode: 'auto' }, capabilities: { elicitation: { form: {} } }, ...extra });
  await c.connect(new StreamableHTTPClientTransport(new URL('http://teste.local/mcp'),
    { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  return c;
};
const args = { turma_id: 'html-01', email: 'aluno@exemplo.com' };

// 1ª volta "na mão": o que chega do servidor antes de o usuário responder.
const cru = await ligar({ inputRequired: { autoFulfill: false } });
const volta1 = await cru.request({ method: 'tools/call', params: { name: 'reservar_vaga', arguments: args } }, { allowInputRequired: true });
console.log(`1ª volta: resultType=${volta1.resultType} · pede: ${Object.keys(volta1.inputRequests ?? {}).join(', ')}`);
await cru.close();

// Fluxo normal: o SDK do cliente chama o seu handler de elicitation e repete a chamada sozinho.
const cliente = await ligar({});
cliente.setRequestHandler('elicitation/create', async req => {
  console.log(`[cliente] pergunta ao usuário: ${req.params.message} → ${resposta}`);
  return resposta === 'sim' ? { action: 'accept', content: { confirmar: true } } : { action: 'decline' };
});
const fim = await cliente.callTool({ name: 'reservar_vaga', arguments: args });
console.log(`resultado: ${fim.content[0].text} · isError=${fim.isError === true}`);
await cliente.close();
await handler.close();
process.exitCode = fim.isError ? 1 : 0;
