# Prueba: `mxcfdi_nombre_archivo` (nombre de los archivos del CFDI)

Comprueba la variable `mxcfdi_nombre_archivo` (rama `nombre-archivo`): el patrón con el que mxcfdi pide a
Factudesk que nombre el XML y el PDF (`nombre_archivo` en `comprobantes/descargar/` y `comprobantes/enviar/`,
propuesta en `factudesk.api.induxsoft.net_qa/propuestas/nombre-archivo/`). Todos los datos son ficticios.

## Qué hace `prueba.dkl`
1. **Instalación:** sin la variable, `emision.nombreArchivo` devuelve `""` (no se manda `nombre_archivo`); la
   instala con `dbr.vars.define` y la entrada de `_install/app_info/vars.json`, igual que el instalador de V12, y
   comprueba el valor predeterminado `{uuid}`.
2. **Patrones** sobre tres CFDI ficticios que crea y luego borra (`sys_guid` con prefijo `NA-PRUEBA`):
   un cargo de CxC con serie `F` y folio `1024` (`ut_cfd` → `dcxc` → `foliosdocumentos` → `blockdocumentos`),
   uno sin serie ni folio y uno con solo el XML guardado (`uf_xmlcfdi`, serie `A`, folio `77`).
3. **De punta a punta** contra factudesk.api del laboratorio (con la propuesta): `emision.cfdi.download`
   (`ziplnk`) y, con `enviar=1`, `emision.cfdi.sendmail` (correo al SMTP simulado del laboratorio). Cambia por
   un momento la CTI del emisor predeterminado y deja todo como estaba (variable, emisor y datos).

## Cómo correrla
```
pruebas/nombre-archivo/correr.sh <src/mxcfdi> <raíz de Devkron> <conexión@grupo> <URL de factudesk.api> <cti> <pwd> [enviar] [carpeta temp.api]
# en la VM de clon1 (laboratorio de fenix3_qa/lab):
pruebas/nombre-archivo/correr.sh src/mxcfdi /srv/v12lab/dkr8 v12r8@v12 http://factudesk.api.lab.localhost/ CTILAB0001 lab-cti 1 /srv/apilab/fs/temp.api
```

## Resultado (2026-10-20, VM de clon1)
```
SIN VARIABLE: ""
INSTALADA: valor="{uuid}"
PREDETERMINADO: ""
PATRON "":  aaaa0001=""  aaaa0001=""  bbbb0001=""
PATRON "{uuid}":  aaaa0001=""  aaaa0001=""  bbbb0001=""
PATRON "{serie}{folio}":  aaaa0001="F1024"  aaaa0001=""  bbbb0001="A77"
PATRON "{rfc_emisor}_{serie}{folio}":  aaaa0001="XIA010101AA1_F1024"  aaaa0001=""  bbbb0001="XIA010101AA1_A77"
PATRON "{serie}{folio}_{uuid8}":  aaaa0001="F1024_aaaa0001"  aaaa0001=""  bbbb0001="A77_bbbb0001"
PATRON "Factura {serie}-{folio}":  aaaa0001="Factura F-1024"  aaaa0001=""  bbbb0001="Factura A-77"
DOWNLOAD {uuid} -> {"link":"https://temp.api.induxsoft.net/aaaa0001-0001-4000-8000-000000000001.zip"}
SENDMAIL {uuid} -> {"link":"https://temp.api.induxsoft.net/aaaa0001-0001-4000-8000-000000000001.zip",…}
DOWNLOAD {serie}{folio} -> {"link":"https://temp.api.induxsoft.net/aaaa0001-0001-4000-8000-000000000001.zip"}
…
ZIP descarga-0.zip ['aaaa0001-0001-4000-8000-000000000001.pdf', 'aaaa0001-0001-4000-8000-000000000001.xml']
ZIP descarga-1.zip ['F1024.pdf', 'F1024.xml']
ZIP descarga-2.zip ['XIA010101AA1_F1024.pdf', 'XIA010101AA1_F1024.xml']
```
Correos recibidos por el SMTP simulado: adjuntos `aaaa0001-…-000000000001.zip`, `F1024.zip` y
`XIA010101AA1_F1024.zip`, cada uno con el XML y el PDF con ese mismo nombre. El enlace sigue con el UUID.
`pruebas/basedr` (usa `emision.descargar` con `xmlb64`) sigue pasando sus 7 casos.
