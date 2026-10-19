// Uso: node teste-stdio.mjs [arquivo do servidor, padrão stdio.mjs]
// teste-stdio.mjs — faz o papel do cliente (Claude Code, Codex…): inicia "node stdio.mjs",
// negocia a revisão do protocolo e chama uma ferramenta pelo stdin/stdout do processo.
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const cliente = new Client({ name: 'teste-stdio', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
await cliente.connect(new StdioClientTransport({ command: 'node', args: [process.argv[2] ?? 'stdio.mjs'] }));
const { tools } = await cliente.listTools();
const r = await cliente.callTool({ name: 'buscar_turmas', arguments: { termo: 'mcp' } });
console.log(`era: ${cliente.getProtocolEra()} · ferramentas: ${tools.map(t => t.name).join(', ')}`);
console.log(`buscar_turmas → ${r.structuredContent.turmas.length} turmas`);
await cliente.close();
