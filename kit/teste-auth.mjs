// teste-auth.mjs — chama o servidor com token (http-auth.mjs já rodando) e mostra o que cada token pode.
// Uso: TOKEN=<token> node teste-auth.mjs
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const URL_MCP = new URL(`http://127.0.0.1:${process.env.PORTA ?? 3334}/mcp`);
const cliente = new Client({ name: 'teste-auth', version: '1.0.0' },
  { versionNegotiation: { mode: 'auto' }, capabilities: { elicitation: { form: {} } } });
cliente.setRequestHandler('elicitation/create', async () => ({ action: 'accept', content: { confirmar: true } }));
await cliente.connect(new StreamableHTTPClientTransport(URL_MCP,
  { requestInit: { headers: { Authorization: `Bearer ${process.env.TOKEN}` } } }));

const busca = await cliente.callTool({ name: 'buscar_turmas', arguments: { termo: 'html' } });
console.log(`buscar_turmas: ${busca.isError ? 'erro' : 'ok'}`);
try {
  const r = await cliente.callTool({ name: 'reservar_vaga', arguments: { turma_id: 'html-01', email: 'aluno@exemplo.com' } });
  console.log(`reservar_vaga: ${r.content[0].text}`);
} catch (e) {
  console.log(`reservar_vaga: recusado (${String(e.message).slice(0, 90)})`);
}
await cliente.close();
