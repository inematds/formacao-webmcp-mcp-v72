# PLANO — Curso 1 · Servidor MCP do seu serviço (Formação WebMCP v7.2)

Repo `inematds/formacao-webmcp-mcp-v72`. Público: dev que roda Node (ou Python) e quer um servidor MCP testado e ligado ao Claude Code/Codex. Escrito em 19/10/2026, antes do conteúdo. Fontes: `../wifi/longrun/2026-10-19-formacao-webmcp-v72/{CURRICULO,AUDITORIA-LOCAL,PESQUISA-ESTADO-DA-ARTE,BRIEF-CURSO}.md`.

## Decisão sobre o SDK (risco anotado no CURRICULO)

Conferido em 19/10/2026 no npm e no código dos pacotes:

| pacote | versão (data no npm) | revisão do MCP |
|---|---|---|
| `@modelcontextprotocol/sdk` (linha v1) | 1.32.1 (05/10/2026) | `LATEST_PROTOCOL_VERSION = '2025-11-25'` — **não** implementa a 2026-07-28 |
| `@modelcontextprotocol/server` / `client` (linha v2) | 2.3.1 (05/10/2026) | README: "implementing the 2026-07-28 MCP spec"; `MODERN_PROTOCOL_VERSION = "2026-07-28"`; `server/discover`, `InputRequiredResult`, `Mcp-Method`/`Mcp-Name` no código |
| `@modelcontextprotocol/node` | 2.1.1 (02/10/2026) | adaptador Node (`toNodeHandler`, guardas de Host/Origin) |
| `@modelcontextprotocol/ext-apps` | 2.0.3 (28/09/2026) | MCP Apps (`io.modelcontextprotocol/ui`) |
| `@modelcontextprotocol/inspector` | 2.11.0 (14/10/2026) | modo `--cli` e `--app-info` |
| `mcp` (Python, PyPI) | 2.3.0 | o pacote traz `server/discover` e `InputRequiredResult` (grep no wheel); o curso usa Node |

**Decisão:** ensinar a 2026-07-28 com o SDK oficial **v2** (2.3.1), tudo testado no kit. Nuances que o texto tem de dizer (vêm da doc do próprio SDK, `docs/protocol-versions.md` e `docs/migration/support-2026-07-28.md`, commit 9bc40e9 de 13/10/2026):
- o **cliente** v2 fala 2025 por padrão (`versionNegotiation` ausente = `legacy`); `mode: 'auto'` (sonda `server/discover`) ou `{ pin: '2026-07-28' }` é opção explícita;
- o **servidor** (`serveStdio`, `createMcpHandler`) atende as duas eras pelo mesmo código (cliente antigo com `initialize` continua funcionando);
- `InMemoryTransport.createLinkedPair()` só conecta era 2025: teste moderno usa `handler.fetch` no mesmo processo;
- Roots, Sampling e Logging estão **descontinuados (deprecated)** na 2026-07-28, não removidos do SDK;
- linha v1 (`@modelcontextprotocol/sdk`) fica como "o que você vai achar em tutorial antigo".

Curso em Node (JS puro, `.mjs`, sem build). Python: uma linha na aula 2 dizendo que o `mcp` 2.3.0 também traz a revisão, sem prática.

## Conferência das fontes (passo 0 do BRIEF)

Legenda: **confere** (com a PESQUISA ou com o SDK testado) · **velho** (substituído pelo atual) · **sem confirmação** (fica fora).

| fonte antiga | o que afirma | marca | o que entra no lugar (fonte) |
|---|---|---|---|
| `MCP/curso/trilha5/modulo-5-3` | "A especificação MCP define dois transportes: STDIO e HTTP com SSE"; "a maioria em produção usa HTTP/SSE" | **velho** | stdio + Streamable HTTP sem estado (PESQUISA §2.3; changelog 2026-07-28: sai retomada de SSE e GET/SSE → `subscriptions/listen`). SSE só aparece como "transporte antigo" |
| `MCP/curso/trilha5/modulo-5-3` | "HTTP adiciona 1–5 ms de latência" | **sem confirmação** | fora |
| `MCP/curso/trilha1/modulo-1-1` | "67% das empresas… até 2025", "US$ 45 bilhões até 2027", "12 ferramentas SaaS" | **sem confirmação** | fora |
| `MCP/curso/trilha1/modulo-1-3` | "Claude Desktop roda o Claude localmente" | **velho/incorreto** | host = aplicativo com o modelo (doc do SDK `real-host.md`); exemplos: Claude Code, Codex, VS Code |
| `MCP/` (21 menções) | `@modelcontextprotocol/sdk` + `StdioServerTransport` + `server.tool(` | **velho** | linha v2: `McpServer.registerTool`, `serveStdio`, `createMcpHandler` (doc `first-server.md`, `http.md`) |
| `MCP/` | FastMCP, `mcp.run(transport="http", host="0.0.0.0")` | **velho** (Python, era 2025; bind em 0.0.0.0 sem guarda) | Node v2 em 127.0.0.1 com guardas de Host/Origin (doc `http.md`) |
| `MCP/` | handshake `initialize`, sessão, `Mcp-Session-Id` | **velho** | sem `initialize` e sem sessão; `server/discover`; `_meta` em cada pedido (PESQUISA §2.2; kit a4a/a4c) |
| `MCP/` | Sampling, Roots, elicitation iniciada pelo servidor | **velho** | MRTR (`InputRequiredResult`, `inputRequired.elicit`) (PESQUISA §2.2; doc `input-required.md`; kit a5) |
| `MCP/` | ~639 menções a Claude Desktop / `claude_desktop_config` como cliente principal | **velho** para este público | `claude mcp add` e `codex mcp add` (CLIs locais, conferidos em 19/10) |
| `cerebro-mcp/package.json` | `@modelcontextprotocol/sdk` 1.30.0 | **velho** | 2.3.1 (v2) |
| `webmcp-3-integrator/.../modulo-2-1` | uma responsabilidade por ferramenta, nome/descrição que dizem a intenção, entrada mínima, estado e próxima ação verificáveis | **confere** (princípio estável, PESQUISA "estável") | adaptado ao MCP: `description`, `inputSchema` (Zod → JSON Schema 2020-12), `annotations` (`readOnlyHint`, `destructiveHint`, `idempotentHint`), `outputSchema`/`structuredContent`, `isError` |
| `webmcp-5-expert` (lado MCP) | MCP sem stateless, sem `server/discover`, sem MRTR, sem OAuth com `iss` | **velho** | aulas 4–6 |
| `inema-agent-runtime/runtime/` | capacidades e política de execução | **confere** como ideia (aprovar ferramenta, escopo mínimo) | só citado na aula 8 |
| PESQUISA §2.4 | MCP Apps = 1ª extensão oficial, 26/01/2026, Claude web/desktop, Goose, VS Code Insiders | **confere** (post oficial) | aula 7 |
| PESQUISA §2.5 | Registry "currently in preview" | **confere** (quickstart do registry, commit 11b7b0e de 11/10/2026: "Breaking changes or data resets may occur") | aula 8 com selo "preview" |
| PESQUISA §2.2 | OAuth com `iss` (RFC 9207) | **confere** — no SDK a validação de `iss` é do **cliente** (`finishAuth`, doc `clients/oauth.md`); o servidor (resource server) verifica o token e publica RFC 9728 | aula 6 diz isso; não afirma que o servidor valida `iss` |
| doc do SDK `real-host.md` | "um `console.log` e o host derruba a conexão" | **sem confirmação no nosso teste**: cliente do SDK 2.3.1 e Inspector 2.11.0 pularam a linha suja (19/10/2026) | aula 2: "log em stderr é a regra; não conte com a tolerância do cliente" |

Baseline dos repos de fonte (não alterados), 19/10/2026: webmcp-1-formacao eb037fb · webmcp-2-builder 676c46e · webmcp-3-integrator 1c81fe8 · webmcp-4-agent-developer f4d8c69 · webmcp-5-expert c1ee007 · webmcp-readiness 9ae7d73 · aiv2026 097d98f · astra-computer-use 30ad91a · agi-pratica 03577c0 · MCP 2124c29 · cerebro-mcp e50bfae · inema-agent-runtime 5cb431b.

## Kit (`kit/`)

`package.json` + `package-lock.json` com versões fixas; `servidor.mjs` (fábrica: `buscar_turmas`, `reservar_vaga`, recurso `turmas://catalogo`, prompt `convite_turma`), `stdio.mjs`, `http.mjs`, `http-auth.mjs`, `app.mjs` + `painel.html`, testes (`listar`, `teste-stdio`, `teste-ferramentas`, `teste-confirmacao`, `teste-sem-capacidade`, `teste-auth`, `teste.mjs`), `server.json`, `blocos/*.sh` → `saidas/*.txt` por `capturar.sh`. Nenhum modelo, nenhuma chave, nenhum serviço pago. Dados em memória.

## Aulas

| # | slug | objetivo (≤160) | diagrama | prática · pronto quando |
|---|---|---|---|---|
| 1 | anatomia | Separar ferramenta, recurso e prompt e dizer quem é cliente, servidor e transporte no seu serviço | host → cliente → transporte → servidor → (ferramentas/recursos/prompts) | `node listar.mjs` → `2 ferramentas · 1 recurso · 1 prompt` e `era: modern` |
| 2 | primeiro-servidor | Subir um servidor MCP por stdio com o SDK oficial v2 e chamá-lo por um cliente e pelo Inspector | npm ci → stdio.mjs → cliente/Inspector | `node teste-stdio.mjs` → `era: modern · ferramentas: buscar_turmas, reservar_vaga`; Inspector `--cli` → JSON com `structuredContent` |
| 3 | boa-ferramenta | Escrever nome, descrição, esquema e anotações que deixam o agente escolher certo e o cliente pedir confirmação | intenção → nome → esquema → anotações → resultado | `node teste-ferramentas.mjs` → `0 falhas` |
| 4 | http-sem-estado | Servir o mesmo servidor por Streamable HTTP sem estado e ler `server/discover`, `Mcp-Method` e `Mcp-Name` | pedido com `_meta` → cabeçalhos → fábrica por requisição → resposta | bloco a4a → `"supportedVersions":["2026-07-28"]` · `saída: 0`; a4b sem `Mcp-Name` → `HTTP 400` / `-32020` |
| 5 | confirmacao-mrtr | Fazer a ferramenta com consequência pedir confirmação no meio da chamada com `input_required` (MRTR) | 1ª volta → `input_required` → cliente pergunta → 2ª volta | `node teste-confirmacao.mjs nao` → `isError=true` e `saída: 1`; `sim` → `reservado` |
| 6 | autorizacao | Proteger o servidor HTTP com token: 401 com metadados, escopo mínimo por ferramenta e segredo fora do repositório | cliente → 401 → RFC 9728 → IdP → token → escopo | a6 → `401`, leitura `recusado (Insufficient scope…)`, reserva `reservado` |
| 7 | mcp-apps | Ligar uma interface HTML a uma ferramenta com MCP Apps e conferir o vínculo sem abrir um cliente | ferramenta → `_meta.ui.resourceUri` → recurso `ui://` → iframe no host | a7 → `"hasApp":true,"toolName":"ver_turmas"` |
| 8 | conectar-testar | Ligar o servidor ao Claude Code e ao Codex, rodar a bateria automática e preparar o server.json do Registry | servidor → testes → claude/codex → registry (preview) | `npm test` → `ℹ fail 0`; `claude mcp get turmas` → `Type: stdio`; mapa + gerador |

Quiz: 3–5 perguntas por aula, certa em posições variadas (A/B/C/D) e sem ser a mais longa. Links da aula 8: curso seguinte `https://inematds.github.io/formacao-webmcp-site-v72/`; ameaça a fundo → `formacao-webmcp-seguranca-v72` (aula 5); tríade letal → `loop-r-eng-seguranca-v72`; evals → `loop-r-eng-verificacao-v72`.

## Fora deste curso (dono por link)
WebMCP na página → curso 2 (`formacao-webmcp-site-v72`). Ameaças, prompt injection, tríade letal → curso 4 e LOOP-R. GEO/llms.txt → inemaSEO. Nada de nome de modelo como recomendação.
