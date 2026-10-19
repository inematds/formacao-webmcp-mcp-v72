cd ~/projetos/formacao-webmcp-mcp-v72/kit
npx -y @modelcontextprotocol/inspector@2.11.0 --cli node stdio.mjs \
  --method tools/call --tool-name buscar_turmas --tool-arg termo=html
echo "saída: $?"
