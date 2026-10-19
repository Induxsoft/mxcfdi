#!/usr/bin/env python3
"""Valida BaseDR/ImporteDR de un complemento de pago 2.0 generado por la prueba (sin timbrar).

Uso: validar.py <xml del pago> <carpeta de facturas>
Sale con 0 si pasan las reglas principales; imprime cada falla.

Reglas principales (Guía de llenado del SAT, complemento para recepción de pagos, CFDI 4.0):
  P1 ningún BaseDR supera el ImpPagado de su documento;
  P2 BaseDR = ImpPagado / Total de la factura * Base del traslado de la factura (proporcional a
     lo que ESTE pago cubre de ESTE documento, no al Monto del pago);
  P3 ImporteDR = BaseDR * TasaOCuotaDR;
  P4 la suma de BaseDR + ImporteDR del documento es igual a su ImpPagado (las facturas de
     prueba solo tienen traslados);
  P5 la suma de ImpPagado / EquivalenciaDR no excede el Monto del pago.
Reglas de totales (se informan aparte, no cambian el código de salida):
  T1 BaseP / ImporteP = suma de BaseDR / ImporteDR (convertidos con EquivalenciaDR) por impuesto y tasa;
  T2 TotalTrasladosBase/ImpuestoIVA* = BaseP / ImporteP registrados * TipoCambioP;
  T3 MontoTotalPagos = Monto * TipoCambioP.
"""
import os, sys
import xml.etree.ElementTree as ET

NS = {"cfdi": "http://www.sat.gob.mx/cfd/4", "pago20": "http://www.sat.gob.mx/Pagos20"}
TOL = 0.011


def n(el, attr, pred=0.0):
    v = el.get(attr)
    return float(v) if v not in (None, "") else pred


def factura(carpeta, uuid):
    raiz = ET.parse(os.path.join(carpeta, uuid + ".xml")).getroot()
    imp = raiz.find("cfdi:Impuestos", NS)
    tras = {}
    for t in imp.find("cfdi:Traslados", NS):
        tras[(t.get("Impuesto"), t.get("TipoFactor"), t.get("TasaOCuota") or "")] = n(t, "Base")
    return n(raiz, "Total"), tras


def clave_tasa(v):
    return "" if v in (None, "") else "%.6f" % float(v)


def main():
    xml, carpeta = sys.argv[1], sys.argv[2]
    raiz = ET.parse(xml).getroot()
    fallas, avisos = [], []
    pago = raiz.find(".//pago20:Pago", NS)
    monto = n(pago, "Monto")
    tcp = n(pago, "TipoCambioP", 1)
    suma_pagado = 0.0
    grupos = {}
    for dr in pago.findall("pago20:DoctoRelacionado", NS):
        uuid = dr.get("IdDocumento")
        pagado = n(dr, "ImpPagado")
        equiv = n(dr, "EquivalenciaDR", 1) or 1
        suma_pagado += pagado / equiv
        total, tras_fac = factura(carpeta, uuid)
        suma_dr = 0.0
        for t in dr.findall(".//pago20:TrasladoDR", NS):
            base = n(t, "BaseDR")
            importe = n(t, "ImporteDR")
            tasa = n(t, "TasaOCuotaDR")
            clave = (t.get("ImpuestoDR"), t.get("TipoFactorDR"), clave_tasa(t.get("TasaOCuotaDR")))
            et = "%s %s %s" % (uuid[-1], clave[1], clave[2])
            if base > pagado + TOL:
                fallas.append("P1 %s: BaseDR %.6f > ImpPagado %.2f" % (et, base, pagado))
            fbase = tras_fac.get((clave[0], clave[1], clave[2]))
            if fbase is None:
                fallas.append("P2 %s: la factura no tiene ese traslado" % et)
            else:
                esperado = pagado / total * fbase
                if abs(base - esperado) > TOL:
                    fallas.append("P2 %s: BaseDR %.6f, esperado %.6f" % (et, base, esperado))
            if abs(importe - base * tasa) > TOL:
                fallas.append("P3 %s: ImporteDR %.6f, esperado %.6f" % (et, importe, base * tasa))
            suma_dr += base + importe
            g = grupos.setdefault(clave, [0.0, 0.0])
            g[0] += base / equiv
            g[1] += importe / equiv
        if dr.find(".//pago20:TrasladoDR", NS) is not None and abs(suma_dr - pagado) > TOL:
            fallas.append("P4 %s: suma BaseDR+ImporteDR %.6f != ImpPagado %.2f" % (uuid[-1], suma_dr, pagado))
    if suma_pagado > monto + TOL:
        fallas.append("P5 suma ImpPagado/EquivalenciaDR %.2f > Monto %.2f" % (suma_pagado, monto))

    for t in pago.findall("pago20:ImpuestosP/pago20:TrasladosP/pago20:TrasladoP", NS):
        clave = (t.get("ImpuestoP"), t.get("TipoFactorP"), clave_tasa(t.get("TasaOCuotaP")))
        g = grupos.get(clave, [0.0, 0.0])
        if abs(n(t, "BaseP") - g[0]) > TOL:
            avisos.append("T1 BaseP %s %s: %.2f, esperado %.2f" % (clave[1], clave[2], n(t, "BaseP"), g[0]))
        if abs(n(t, "ImporteP") - g[1]) > TOL:
            avisos.append("T1 ImporteP %s %s: %.2f, esperado %.2f" % (clave[1], clave[2], n(t, "ImporteP"), g[1]))
    # T2: la guía pide el redondeo de BaseP/ImporteP (tal como se registraron) por TipoCambioP
    registrados = {}
    for t in pago.findall("pago20:ImpuestosP/pago20:TrasladosP/pago20:TrasladoP", NS):
        registrados[(t.get("ImpuestoP"), t.get("TipoFactorP"), clave_tasa(t.get("TasaOCuotaP")))] = [n(t, "BaseP"), n(t, "ImporteP")]
    tot = raiz.find(".//pago20:Totales", NS)
    for campo, clave, i in [("TotalTrasladosBaseIVA16", ("002", "Tasa", "0.160000"), 0),
                            ("TotalTrasladosImpuestoIVA16", ("002", "Tasa", "0.160000"), 1),
                            ("TotalTrasladosBaseIVA0", ("002", "Tasa", "0.000000"), 0),
                            ("TotalTrasladosBaseIVAExento", ("002", "Exento", ""), 0)]:
        esperado = round(registrados.get(clave, [0.0, 0.0])[i] * tcp, 2)
        if abs(n(tot, campo) - esperado) > TOL:
            avisos.append("T2 %s: %.2f, esperado %.2f" % (campo, n(tot, campo), esperado))

    if abs(n(tot, "MontoTotalPagos") - round(monto * tcp, 2)) > TOL:
        avisos.append("T3 MontoTotalPagos: %.2f, esperado %.2f" % (n(tot, "MontoTotalPagos"), monto * tcp))

    for f in fallas:
        print("  FALLA " + f)
    for a in avisos:
        print("  TOTALES " + a)
    print("  resultado: %s (%d fallas principales, %d de totales)" %
          ("PASA" if not fallas else "FALLA", len(fallas), len(avisos)))
    sys.exit(1 if fallas else 0)


main()
