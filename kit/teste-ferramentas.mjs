// teste-ferramentas.mjs — confere o desenho das ferramentas: anotações, argumento válido,
// argumento inválido (o SDK recusa antes do seu código rodar) e resultado estruturado.
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './servidor.mjs';

const handler = createMcpHandler(createServer);
const cliente = new Client({ name: 'teste-ferramentas', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
await cliente.connect(new StreamableHTTPClientTransport(new URL('http://teste.local/mcp'),
  { fetch: (url, init) => handler.fetch(new Request(url, init)) }));

let falhas = 0;
const confere = (ok, msg) => { console.log(`${ok ? 'ok   ' : 'FALHA'} ${msg}`); if (!ok) falhas++; };

const { tools } = await cliente.listTools();
for (const t of tools) {
  confere(t.description?.length >= 20, `${t.name}: descrição com 20+ caracteres`);
  confere(typeof t.annotations?.readOnlyHint === 'boolean', `${t.name}: diz se é só leitura`);
}
const ok = await cliente.callTool({ name: 'buscar_turmas', arguments: { termo: 'mcp', limite: 1 } });
confere(ok.structuredContent?.turmas?.length === 1, 'buscar_turmas devolve structuredContent com 1 turma');
const ruim = await cliente.callTool({ name: 'buscar_turmas', arguments: { termo: 'm' } });
confere(ruim.isError === true, `argumento inválido vira isError: ${ruim.content[0].text.slice(0, 70)}…`);

console.log(`${falhas} falhas`);
await cliente.close();
await handler.close();
process.exitCode = falhas ? 1 : 0;
