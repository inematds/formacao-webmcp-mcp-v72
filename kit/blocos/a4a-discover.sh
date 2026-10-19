cd ~/projetos/formacao-webmcp-mcp-v72/kit
PORTA=3333 node http.mjs & PID=$!; sleep 1
curl -s -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: server/discover' \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{
       "io.modelcontextprotocol/protocolVersion":"2026-07-28",
       "io.modelcontextprotocol/clientInfo":{"name":"curl","version":"1.0.0"},
       "io.modelcontextprotocol/clientCapabilities":{}}}}' | grep '"supportedVersions"'
S=$?; kill $PID; wait $PID 2>/dev/null; echo "saída: $S"
