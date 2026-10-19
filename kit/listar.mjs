// listar.mjs — liga um cliente MCP ao servidor de turmas, no mesmo processo (sem porta),
// e mostra a anatomia: era do protocolo, ferramentas, recursos e prompts.
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './servidor.mjs';

const handler = createMcpHandler(createServer);
const transporte = new StreamableHTTPClientTransport(new URL('http://teste.local/mcp'), {
  fetch: (url, init) => handler.fetch(new Request(url, init))
});
// mode 'auto': pergunta server/discover; se o servidor for antigo, cai no initialize.
const cliente = new Client({ name: 'listar', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
await cliente.connect(transporte);

const { tools } = await cliente.listTools();
const { resources } = await cliente.listResources();
const { prompts } = await cliente.listPrompts();
console.log(`era: ${cliente.getProtocolEra()}`);
for (const t of tools) console.log(`ferramenta: ${t.name} · readOnlyHint=${t.annotations?.readOnlyHint}`);
for (const r of resources) console.log(`recurso: ${r.uri}`);
for (const p of prompts) console.log(`prompt: ${p.name}`);
console.log(`${tools.length} ferramentas · ${resources.length} recurso · ${prompts.length} prompt`);

await cliente.close();
await handler.close();
