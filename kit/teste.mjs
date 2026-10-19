// teste.mjs — bateria automática do servidor de turmas (node --test teste.mjs).
// Roda sem porta, sem modelo e sem custo: o cliente oficial fala com o handler no mesmo processo.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer, TURMAS } from './servidor.mjs';

const handler = createMcpHandler(createServer);
after(() => handler.close());

async function cliente(modo = 'auto', responde = null) {
  const c = new Client({ name: 'teste', version: '1.0.0' },
    { versionNegotiation: { mode: modo }, capabilities: { elicitation: { form: {} } } });
  if (responde) c.setRequestHandler('elicitation/create', async () => responde);
  await c.connect(new StreamableHTTPClientTransport(new URL('http://teste.local/mcp'),
    { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  return c;
}

test('cliente novo negocia a revisão 2026-07-28 (era modern)', async () => {
  const c = await cliente('auto');
  assert.equal(c.getProtocolEra(), 'modern');
  await c.close();
});

test('cliente antigo (initialize, 2025-11-25) ainda é atendido', async () => {
  const c = await cliente('legacy');
  assert.equal(c.getProtocolEra(), 'legacy');
  const { tools } = await c.listTools();
  assert.ok(tools.some(t => t.name === 'buscar_turmas'));
  await c.close();
});

test('buscar_turmas é só leitura e devolve dado estruturado', async () => {
  const c = await cliente();
  const { tools } = await c.listTools();
  assert.equal(tools.find(t => t.name === 'buscar_turmas').annotations.readOnlyHint, true);
  const r = await c.callTool({ name: 'buscar_turmas', arguments: { termo: 'html' } });
  assert.deepEqual(r.structuredContent.turmas.map(t => t.id), ['html-01']);
  await c.close();
});

test('argumento inválido volta como isError, sem rodar o handler', async () => {
  const c = await cliente();
  const r = await c.callTool({ name: 'buscar_turmas', arguments: { termo: 'x' } });
  assert.equal(r.isError, true);
  await c.close();
});

test('reservar_vaga só reserva depois da confirmação (MRTR)', async () => {
  const antes = TURMAS.find(t => t.id === 'mcp-01').vagas;
  const recusa = await cliente('auto', { action: 'decline' });
  const r1 = await recusa.callTool({ name: 'reservar_vaga', arguments: { turma_id: 'mcp-01', email: 'a@exemplo.com' } });
  assert.equal(r1.isError, true);
  assert.equal(TURMAS.find(t => t.id === 'mcp-01').vagas, antes);
  await recusa.close();
  const aceita = await cliente('auto', { action: 'accept', content: { confirmar: true } });
  const r2 = await aceita.callTool({ name: 'reservar_vaga', arguments: { turma_id: 'mcp-01', email: 'a@exemplo.com' } });
  assert.equal(r2.isError, undefined);
  assert.equal(TURMAS.find(t => t.id === 'mcp-01').vagas, antes - 1);
  await aceita.close();
});

test('turma sem vaga é recusada com isError', async () => {
  const c = await cliente('auto', { action: 'accept', content: { confirmar: true } });
  const r = await c.callTool({ name: 'reservar_vaga', arguments: { turma_id: 'mcp-02', email: 'a@exemplo.com' } });
  assert.equal(r.isError, true);
  await c.close();
});

test('o processo stdio sobe e lista as ferramentas', async () => {
  const c = new Client({ name: 'teste-stdio', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [new URL('./stdio.mjs', import.meta.url).pathname] }));
  const { tools } = await c.listTools();
  assert.deepEqual(tools.map(t => t.name).sort(), ['buscar_turmas', 'reservar_vaga']);
  await c.close();
});
