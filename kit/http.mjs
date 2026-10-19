// http.mjs — serve o servidor de turmas por Streamable HTTP, sem estado, em 127.0.0.1.
// Cada requisição monta um McpServer novo (createMcpHandler): o protocolo não guarda sessão.
// O dado do seu serviço (aqui, TURMAS no módulo) continua seu: banco, cache, pool ficam fora da fábrica.
// As guardas de Host e Origin barram DNS rebinding (página maliciosa falando com o seu localhost).
import { createServer as criarHttp } from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler, localhostHostValidation, localhostOriginValidation } from '@modelcontextprotocol/node';
import { createServer } from './servidor.mjs';

const PORTA = Number(process.env.PORTA ?? 3333);
const handler = createMcpHandler(createServer);
const node = toNodeHandler(handler);
const hostOk = localhostHostValidation();
const origemOk = localhostOriginValidation();

const http = criarHttp((req, res) => {
  if (!hostOk(req, res) || !origemOk(req, res)) return; // responde 403 sozinho
  if (!req.url.startsWith('/mcp')) { res.writeHead(404).end(); return; }
  void node(req, res);
});
http.listen(PORTA, '127.0.0.1', () => console.error(`turmas: MCP em http://127.0.0.1:${PORTA}/mcp`));

process.on('SIGINT', async () => { await handler.close(); http.close(); process.exit(0); });
process.on('SIGTERM', async () => { await handler.close(); http.close(); process.exit(0); });
