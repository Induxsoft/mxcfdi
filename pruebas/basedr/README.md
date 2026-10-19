# Prueba: BaseDR/ImporteDR del complemento de pago 2.0

Comprueba que `emision.setComplementoP` (`src/mxcfdi/emision/model.dk`) calcula los impuestos de
cada documento relacionado en proporción a lo que **ese** pago cubre de **ese** documento
(`ImpPagado`), y no al `Monto` total del pago. Se valida el XML **antes de timbrar**: no se sella,
no se timbra y no se usa ningún PAC. Todos los datos son ficticios.

## Qué hace
1. `correr.sh` arma una carpeta temporal donde `mxcfdi/` apunta al `src/mxcfdi` que se quiere
   probar, y levanta `mock_descargar.py`, que hace las veces de Factudesk
   (`comprobantes/descargar`) y entrega el XML de `facturas/<uuid>.xml`.
2. Por cada `casos/*.json`, `prueba.dkl` llama al `emision.setComplementoP` real y genera el XML
   con `cfdi40.pago20.dkl`, igual que `emision.generarCFDI`.
3. `validar.py` revisa el XML contra la guía de llenado del SAT (CFDI 4.0, complemento para
   recepción de pagos):
   - **principales** (deciden el resultado): ningún `BaseDR` mayor que el `ImpPagado` de su
     documento; `BaseDR = ImpPagado / Total * Base`; `ImporteDR = BaseDR * TasaOCuotaDR`;
     `Σ(BaseDR + ImporteDR) = ImpPagado`; `Σ ImpPagado / EquivalenciaDR ≤ Monto`;
   - **totales** (se informan aparte): `BaseP`/`ImporteP` en la moneda del pago, `Totales` y
     `MontoTotalPagos` por `TipoCambioP`.

## Casos
| Caso | Qué cubre |
|---|---|
| `c1-dos-facturas-parcial` | pago parcial a dos facturas con IVA 16 % |
| `c2-tres-facturas-0-exenta` | tres facturas: 16 %, tasa 0 % y exenta |
| `c3-liquida-exacto` | el pago liquida exactamente dos facturas |
| `c4-moneda-usd` | pago en MXN a una factura en USD (`EquivalenciaDR` 0.05) y a otra en MXN |
| `c5-una-factura` | control: una sola factura liquidada (pasa también sin la corrección) |
| `c6-tasa-mixta` | una factura con conceptos al 16 % y al 0 % |
| `c7-pago-usd` | pago en USD (`TipoCambioP` 20) a una factura en MXN (`EquivalenciaDR` 20) |

## Cómo correrla
Requiere una base de V12 con `mxcfdi` instalado (si no hay emisor predeterminado en
`mxcfdi_emisor`, `prueba.dkl` crea uno ficticio) y un Devkron con su `connections.xml`:

```
pruebas/basedr/correr.sh <ruta a src/mxcfdi> <raíz de Devkron> <conexión@grupo> [carpeta de salida]
# p. ej. en el laboratorio:
pruebas/basedr/correr.sh src/mxcfdi /srv/v12lab/dkr8 v12r8@v12 /tmp/basedr
```

Sale con 0 si todos los casos pasan las reglas principales. Los XML generados quedan en la carpeta
de salida.
