cd ~/projetos/formacao-webmcp-mcp-v72/kit
PORTA=3333 node http.mjs & PID=$!; sleep 1
META='"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"curl","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}'
chamar() {  # $1 = valor do cabeçalho Mcp-Name (vazio = sem o cabeçalho)
  curl -s -w ' [HTTP %{http_code}]\n' -X POST http://127.0.0.1:3333/mcp \
    -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
    -H 'MCP-Protocol-Version: 2026-07-28' -H 'Mcp-Method: tools/call' ${1:+-H "Mcp-Name: $1"} \
    -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"buscar_turmas","arguments":{"termo":"mcp"},'"$META"'}}'
}
echo "## com Mcp-Name"; chamar buscar_turmas
echo "## sem Mcp-Name"; chamar ""
kill $PID; wait $PID 2>/dev/null
