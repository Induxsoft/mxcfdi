#!/usr/bin/env python3
"""Servicio simulado de Factudesk 'comprobantes/descargar' para la prueba de BaseDR.

Responde como el real ({"success":true,"data":{"content":<base64 del XML>}}) con el XML
de facturas/<uuid>.xml, donde <uuid> es el campo "doc" de la petición. Solo datos ficticios.
Uso: mock_descargar.py <puerto> <carpeta de facturas>
"""
import base64, json, os, sys, urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

PUERTO = int(sys.argv[1])
CARPETA = sys.argv[2]


class Manejador(BaseHTTPRequestHandler):
    def do_POST(self):
        cuerpo = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8")
        try:
            campos = json.loads(cuerpo)
        except ValueError:
            campos = {k: v[0] for k, v in urllib.parse.parse_qs(cuerpo).items()}
        doc = os.path.basename(str(campos.get("doc", "")))
        ruta = os.path.join(CARPETA, doc + ".xml")
        if os.path.isfile(ruta):
            with open(ruta, "rb") as f:
                r = {"success": True, "data": {"content": base64.b64encode(f.read()).decode()}}
        else:
            r = {"success": False, "message": "No existe la factura de prueba " + doc}
        datos = json.dumps(r).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def log_message(self, *a):
        pass


HTTPServer(("127.0.0.1", PUERTO), Manejador).serve_forever()
