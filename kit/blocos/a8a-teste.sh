cd ~/projetos/formacao-webmcp-mcp-v72/kit
npm test 2>&1 | grep -E "^(✔|✖|ℹ (tests|pass|fail))"; echo "saída: ${PIPESTATUS[0]}"
