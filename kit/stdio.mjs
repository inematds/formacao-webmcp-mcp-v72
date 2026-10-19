// stdio.mjs — serve o servidor de turmas por stdio (o cliente inicia este processo).
// stdout é o canal do protocolo: todo log vai para stderr (console.error).
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './servidor.mjs';

serveStdio(createServer);
console.error('turmas: servidor MCP no stdio');
