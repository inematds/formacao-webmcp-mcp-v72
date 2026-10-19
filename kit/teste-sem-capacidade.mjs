// teste-sem-capacidade.mjs — erro comum: o cliente não declara que sabe perguntar ao usuário
// (capabilities.elicitation). A ferramenta que pede confirmação não tem como seguir.
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './servidor.mjs';

const handler = createMcpHandler(createServer);
const cliente = new Client({ name: 'sem-capacidade', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
await cliente.connect(new StreamableHTTPClientTransport(new URL('http://teste.local/mcp'),
  { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
try {
  await cliente.callTool({ name: 'reservar_vaga', arguments: { turma_id: 'html-01', email: 'aluno@exemplo.com' } });
  console.log('passou (não deveria)');
} catch (e) {
  console.log(`recusado: ${e.code} ${String(e.message).slice(0, 110)}`);
  process.exitCode = 1;
}
await cliente.close();
await handler.close();
