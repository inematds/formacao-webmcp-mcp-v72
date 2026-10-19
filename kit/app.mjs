// app.mjs — o servidor de turmas + um MCP App (extensão oficial io.modelcontextprotocol/ui):
// a ferramenta ver_turmas aponta para a interface ui://turmas/painel.html, que o cliente
// desenha num iframe isolado. Cliente sem suporte a MCP Apps recebe o texto normal.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import * as z from 'zod/v4';
import { createServer, TURMAS } from './servidor.mjs';

const URI = 'ui://turmas/painel.html';
// A classe App vem pronta no pacote (app-with-deps.js); a View é um HTML só, sem build.
// Para caber num <script> só, trocamos o "export {… X as App …}" final por "const App = X;".
const bruto = readFileSync(createRequire(import.meta.url).resolve('@modelcontextprotocol/ext-apps/app-with-deps'), 'utf8');
const exporta = bruto.match(/export\s*\{([^}]*)\};?\s*$/);
const nomeApp = exporta[1].match(/(\w+)\s+as\s+App\b/)[1];
const appJs = bruto.slice(0, exporta.index) + `\nconst App = ${nomeApp};\n`;
const html = readFileSync(new URL('./painel.html', import.meta.url), 'utf8').replace('/*APP_JS*/', () => appJs); // função: o bundle tem "$&" que o replace leria como padrão

export function createServerComApp() {
  const server = createServer();
  registerAppTool(server, 'ver_turmas', {
    title: 'Ver turmas (painel)',
    description: 'Mostra as turmas com vagas num painel. Só leitura.',
    inputSchema: z.object({ termo: z.string().min(2) }),
    outputSchema: z.object({ turmas: z.array(z.object({ id: z.string(), titulo: z.string(), vagas: z.int() })) }),
    annotations: { readOnlyHint: true },
    _meta: { ui: { resourceUri: URI } }
  }, async ({ termo }) => {
    const turmas = TURMAS.filter(t => t.titulo.toLowerCase().includes(termo.toLowerCase()));
    return { content: [{ type: 'text', text: `${turmas.length} turmas` }], structuredContent: { turmas } };
  });
  registerAppResource(server, 'Painel de turmas', URI, { description: 'Lista visual das turmas' },
    async () => ({ contents: [{ uri: URI, mimeType: RESOURCE_MIME_TYPE, text: html }] }));
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  serveStdio(createServerComApp);
  console.error('turmas + MCP App: servidor no stdio');
}
