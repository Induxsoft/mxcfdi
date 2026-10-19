#!/bin/bash
# Corre la prueba de BaseDR/ImporteDR contra un src/mxcfdi dado, sin timbrar ni usar PAC.
# Uso: correr.sh <ruta a src/mxcfdi> <raíz de Devkron> <conexión@grupo> [carpeta de salida]
#   La conexión debe ser una base de V12 con mxcfdi instalado (se crea un emisor ficticio si falta).
#   Ejemplo: correr.sh ~/lab/mxcfdi/src/mxcfdi /srv/v12lab/dkr7 v12r7@v12
set -u
MX=$(readlink -f "$1"); DK=$(readlink -f "$2"); QN="$3"
AQUI=$(dirname "$(readlink -f "$0")")
SAL=${4:-$(mktemp -d)}; mkdir -p "$SAL"
PUERTO=${PUERTO:-18765}
TMP=$(mktemp -d)
ln -s "$MX" "$TMP/mxcfdi"
cp "$AQUI/prueba.dkl" "$TMP/"
# dkl lee connections.xml del directorio actual: se enlaza el de la raíz de Devkron
ln -s "$DK/connections.xml" "$TMP/connections.xml"
[ -f "$DK/adapters.xml" ] && ln -s "$DK/adapters.xml" "$TMP/adapters.xml"
python3 -I "$AQUI/mock_descargar.py" "$PUERTO" "$AQUI/facturas" & MOCK=$!
trap 'kill $MOCK 2>/dev/null; rm -rf "$TMP"' EXIT
sleep 1
fallas=0
for c in "$AQUI"/casos/*.json; do
    k=$(basename "$c" .json)
    (cd "$TMP" && "$DK/dkl" prueba.dkl "qn=$QN" "mock=http://127.0.0.1:$PUERTO/" "caso=$c" "salida=$SAL/$k.xml") > "$SAL/$k.out" 2>&1
    echo "== $k"
    if [ ! -s "$SAL/$k.xml" ]; then
        echo "  ERROR: no se generó el XML"; grep -v "^Iniciado\|^ID de\|^Terminado\|^[0-9:.]*$\|^$" "$SAL/$k.out" | head -5 | sed 's/^/  /'
        fallas=$((fallas+1)); continue
    fi
    python3 -I "$AQUI/validar.py" "$SAL/$k.xml" "$AQUI/facturas" || fallas=$((fallas+1))
done
echo "== casos con falla: $fallas  (XML y salidas en $SAL)"
[ $fallas -eq 0 ]
