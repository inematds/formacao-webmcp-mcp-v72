cd ~/projetos/formacao-webmcp-mcp-v72/kit
export TOKEN_LEITURA=$(openssl rand -hex 16) TOKEN_RESERVA=$(openssl rand -hex 16)
node http-auth.mjs & PID=$!; sleep 1
echo "## sem token"
curl -s -o /dev/null -D - -X POST http://127.0.0.1:3334/mcp \
  -H 'Content-Type: application/json' -d '{}' | grep -i -e '^HTTP' -e '^www-authenticate'
echo "## metadados do recurso (RFC 9728)"
curl -s http://127.0.0.1:3334/.well-known/oauth-protected-resource/mcp; echo
echo "## token de leitura"; TOKEN=$TOKEN_LEITURA node teste-auth.mjs
echo "## token de reserva"; TOKEN=$TOKEN_RESERVA node teste-auth.mjs
kill $PID; wait $PID 2>/dev/null
