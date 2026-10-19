// http-auth.mjs — o mesmo servidor por HTTP, agora como "resource server" OAuth:
// sem token → 401 com WWW-Authenticate; token sem o escopo → 403 insufficient_scope.
// ENSAIO: os tokens vêm de variáveis de ambiente (nunca do repositório). Em produção quem
// emite o token é o seu servidor de autorização (IdP) e aqui você verifica a assinatura
// do JWT (ou faz introspecção RFC 7662), conferindo exp e aud.
import { createServer as criarHttp } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import {
  createMcpHandler, requireBearerAuth, oauthMetadataResponse,
  getOAuthProtectedResourceMetadataUrl, OAuthError, OAuthErrorCode
} from '@modelcontextprotocol/server';
import { toNodeHandler, localhostHostValidation, localhostOriginValidation } from '@modelcontextprotocol/node';
import { createServer } from './servidor.mjs';

const PORTA = Number(process.env.PORTA ?? 3334);
const URL_MCP = new URL(`http://127.0.0.1:${PORTA}/mcp`);
const TOKENS = {
  [process.env.TOKEN_LEITURA ?? '']: { clientId: 'leitor', scopes: ['turmas:ler'] },
  [process.env.TOKEN_RESERVA ?? '']: { clientId: 'atendente', scopes: ['turmas:ler', 'turmas:reservar'] }
};
if (!process.env.TOKEN_LEITURA || !process.env.TOKEN_RESERVA) {
  console.error('defina TOKEN_LEITURA e TOKEN_RESERVA no ambiente'); process.exit(2);
}
const igual = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const verifier = {
  async verifyAccessToken(token) {
    const chave = Object.keys(TOKENS).find(k => k && igual(k, token));
    if (!chave) throw new OAuthError(OAuthErrorCode.InvalidToken, 'token desconhecido');
    return { token, ...TOKENS[chave], expiresAt: Math.floor(Date.now() / 1000) + 3600, resource: URL_MCP };
  }
};
const portao = requireBearerAuth({
  verifier,
  requiredScopes: ['turmas:ler'],
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(URL_MCP),
  expectedResource: URL_MCP
});
// Documento RFC 9728 que o 401 aponta: diz ao cliente qual servidor de autorização usar.
const metadados = {
  oauthMetadata: {
    issuer: 'https://auth.exemplo.com',
    authorization_endpoint: 'https://auth.exemplo.com/authorize',
    token_endpoint: 'https://auth.exemplo.com/token',
    response_types_supported: ['code'],
    authorization_response_iss_parameter_supported: true
  },
  resourceServerUrl: URL_MCP,
  scopesSupported: ['turmas:ler', 'turmas:reservar']
};

const mcp = createMcpHandler(createServer);
const comPortao = {
  async fetch(request) {
    const doc = oauthMetadataResponse(request, metadados);
    if (doc) return doc;
    const auth = await portao(request);
    if (auth instanceof Response) return auth; // 401 ou 403 pronto
    return mcp.fetch(request, { authInfo: auth });
  }
};
const node = toNodeHandler(comPortao);
const hostOk = localhostHostValidation();
const origemOk = localhostOriginValidation();
const http = criarHttp((req, res) => {
  if (!hostOk(req, res) || !origemOk(req, res)) return;
  void node(req, res);
});
http.listen(PORTA, '127.0.0.1', () => console.error(`turmas (com token): ${URL_MCP}`));
process.on('SIGTERM', async () => { await mcp.close(); http.close(); process.exit(0); });
