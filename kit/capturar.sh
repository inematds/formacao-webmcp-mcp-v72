#!/usr/bin/env bash
# capturar.sh — roda cada bloco "Terminal" do curso (kit/blocos/*.sh) e grava a saída em kit/saidas/.
# É daqui que saem as abas "Saída capturada" das aulas. Sem argumento: todos os blocos locais
# (sem rede externa e sem mexer na configuração do Claude Code/Codex).
# Ficam fora e se rodam à mão: a2a-instalar (clone), a8b-claude e a8c-codex (gravam configuração),
# a8d-registry (consulta registry.modelcontextprotocol.io).
# Uso: bash capturar.sh            # blocos locais
#      bash capturar.sh a3-ferramentas
set -uo pipefail
K=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$K/saidas"
alvos=("$@"); [ ${#alvos[@]} -eq 0 ] && alvos=($(cd "$K/blocos" && ls *.sh | grep -v -e a2a- -e a8b- -e a8c- -e a8d- | sed 's/\.sh$//'))
for b in "${alvos[@]}"; do
  ( cd /tmp && bash "$K/blocos/$b.sh" ) > "$K/saidas/$b.txt" 2>&1
  echo "$b: $(wc -l < "$K/saidas/$b.txt") linhas"
done
