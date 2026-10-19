cd ~/projetos/formacao-webmcp-mcp-v72/kit
PORTA=3333 node http.mjs & PID=$!; sleep 1
C=${TMPDIR:-/tmp}/cabecalhos-mcp.txt
# um cliente da revisão 2025-11-25 ainda abre com initialize; o mesmo servidor responde
curl -s -D "$C" -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"antigo","version":"1.0.0"}}}' \
  | grep -o '"protocolVersion":"[^"]*"'
echo "Mcp-Session-Id na resposta: $(grep -ci '^mcp-session-id' "$C")"
rm -f "$C"; kill $PID; wait $PID 2>/dev/null
