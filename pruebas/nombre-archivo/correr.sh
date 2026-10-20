#!/bin/bash
# Corre la prueba de mxcfdi_nombre_archivo contra un src/mxcfdi y factudesk.api del laboratorio.
# Uso: correr.sh <ruta a src/mxcfdi> <raíz de Devkron> <conexión@grupo> <URL de factudesk.api> <cti> <pwd> [enviar] [carpeta temp.api]
#   enviar=1 manda además un correo por cada patrón (factudesk.api debe apuntar a un SMTP simulado).
#   Con la carpeta de temp.api del laboratorio se lista el contenido de cada ZIP descargado.
#   Ejemplo (VM de clon1): correr.sh src/mxcfdi /srv/v12lab/dkr8 v12r8@v12 http://factudesk.api.lab.localhost/ CTILAB0001 lab-cti 1 /srv/apilab/fs/temp.api
set -u
MX=$(readlink -f "$1"); DK=$(readlink -f "$2"); QN="$3"; FDSK="$4"; CTI="$5"; PWD_="$6"; ENV=${7:-0}; TEMPAPI=${8:-}
AQUI=$(dirname "$(readlink -f "$0")")
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
ln -s "$MX" "$TMP/mxcfdi"
cp "$AQUI/prueba.dkl" "$TMP/"
# dkl lee connections.xml del directorio actual: se enlaza el de la raíz de Devkron
ln -s "$DK/connections.xml" "$TMP/connections.xml"
[ -f "$DK/adapters.xml" ] && ln -s "$DK/adapters.xml" "$TMP/adapters.xml"
cd "$TMP" && "$DK/dkl" prueba.dkl "qn=$QN" "fdsk=$FDSK" "cti=$CTI" "pwd=$PWD_" "enviar=$ENV" "tempapi=$TEMPAPI" 2>&1 | grep -v '^Iniciado\|^ID de\|^Terminado\|^[0-9:.]*$\|^$'
for z in "$TMP"/descarga-*.zip; do
    [ -f "$z" ] && python3 -I -c "import zipfile,sys;print('ZIP', sys.argv[1].split('/')[-1], zipfile.ZipFile(sys.argv[1]).namelist())" "$z"
done
