cd "$(mktemp -d)" && cp ~/projetos/formacao-webmcp-mcp-v72/kit/*.mjs ~/projetos/formacao-webmcp-mcp-v72/kit/package.json .
node teste-stdio.mjs 2>&1 | grep -m1 -o "ERR_MODULE_NOT_FOUND\|Cannot find package '[^']*'"; echo "saída: ${PIPESTATUS[0]}"
