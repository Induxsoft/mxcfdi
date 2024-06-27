var emision =
{
    formId:"", form:null, elem:null,
    url_exit:"/!/mxcfdi/emision/",
    error_timeout:7, uuid_required:false,

    init()
    {
        this.form = document.getElementById(this.formId);
        this.elem = this.form.elements;
        const sel_metodo_pago = document.getElementById("sel_metodo_pago");
        const txt_cond_pago = document.getElementById("txt_cond_pago");
        const btn_submit = document.getElementById("btn_submit");
        const btn_add_uuid = document.getElementById("btn_add_uuid");
        const btn_del_uuid = document.getElementById("btn_del_uuid");
        const sel_tasa_iva = document.getElementById("sel_tasa_iva");

        if (btn_submit) btn_submit.addEventListener("click", (e) => this.submit());
        if (btn_add_uuid) btn_add_uuid.addEventListener("click", (e) => this.agregarUUID());
        if (btn_del_uuid) btn_del_uuid.addEventListener("click", (e) => this.removerUUID());
        
        if (sel_metodo_pago && txt_cond_pago)
        {
            sel_metodo_pago.addEventListener("change", (e) => {
                const opt_metodo_pago = sel_metodo_pago.options[sel_metodo_pago.selectedIndex];
                txt_cond_pago.value = opt_metodo_pago.textContent.toUpperCase();
            });
            trigger(sel_metodo_pago,"change");
        }
        if (sel_tasa_iva)
        {
            const txt_subtotal = document.getElementById("txt_subtotal");
            const txt_impuesto = document.getElementById("txt_impuesto");
            const txt_total = document.getElementById("txt_total");

            sel_tasa_iva.addEventListener("change", () => {
                let Importe = Number(txt_total.value);

                let TasaOCuota = Math.div(Number(sel_tasa_iva.value)||0, 100);
                let Subtotal = Math.div(Importe,(1+TasaOCuota));
                let Impuesto = Math.mul(Subtotal,TasaOCuota);

                txt_subtotal.value = RoundTo(Subtotal,2);
                txt_impuesto.value = RoundTo(Impuesto,2);
                txt_total.value = RoundTo(Importe,2);
            });
            trigger(sel_tasa_iva,"change");
        }

        if (this.formId === "frm_cobro") this.cobro.init();
    },

    cobro: {
        table_doctos:null, table_traslados:null,
        impuestos_dr:{},
        url_get_impuestos_dr:"",

        init()
        {
            this.table_doctos = document.getElementById("tbl_doctos");
            this.table_traslados = document.getElementById("tbl_trasladosdr");

            this.setTableEvents();
        },

        setTableEvents()
        {
            if (this.table_doctos)
            {
                let table = this.table_doctos;
                let array = table?.DataArray??[];
                const events = table.EdiTable.Const.Events;

                table.AutoAddRow = false;
                table.AutoDelRow = false;
                table.EverMove = false;

                this.verificarFacturasTimbradas(table,array);

                // table.Events[events.ConfirmEdition] = (e) => { this.showImpuestosDR(e,array) };
            }
            if (this.table_traslados)
            {
                let table = this.table_traslados;
                let array = table?.DataArray??[];
                const events = table.EdiTable.Const.Events;

                table.AutoAddRow = false;
                table.AutoDelRow = false;
                table.EverMove = false;
            }
        },

        verificarFacturasTimbradas(table,array)
        {
            let sin_timbrar = 0;
            array.forEach((obj,irow) => {
                if ((obj?.IdDocumento??"").trim() === "")
                {
                    const tr = table.GetTrByIndex(irow);
                    tr.querySelectorAll("td").forEach((td,icol) => {
                        if (td.getAttribute("data-cell") === "IdDocumento")
                        {
                            td.style.backgroundColor = "#DC3545";
                            // td.style.color = "#FFFFFF";
                            td.style.opacity = 1;
                        }
                        if (td.getAttribute("data-cell") === "ObjetoImpDR")
                        {
                            // td.style.pointerEvents = "none"; //Desactivar celda
                            td.style.backgroundColor = "#E9ECEF"; //"#888888";
                            // td.style.color = "#FFFFFF";
                            td.style.opacity = 1;
                            table.Columns[icol].type = "NoEditable"; //Desactivar celda
                        }
                    });
                    sin_timbrar += 1;
                }
            });
            if (sin_timbrar > 0) disableControls(["btn_submit"]);
        },

        showImpuestosDR(e,array)
        {
            let index = e.sender.RowIndexOfTd(e.td);
            let field = e.coldef.field;
            let docto = array[index];

            if (field !== "ObjetoImpDR") return;
            if (docto.ObjetoImpDR !== "02") return;

            this.setImpuestosDR(docto.IdDocumento);
        },

        setImpuestosDR(IdDocumento)
        {
            if (!(Object.keys(this.impuestos_dr)).includes(IdDocumento))
            {
                let url = InduxsoftCrudlModel.UrlReplace(this.url_get_impuestos_dr,{uuid:IdDocumento});
                fetch(url).then(response => response.json())
                .then(data => {
                    if (!(data?.success??true) || (data?.message??"")!=="") {
                        alert(data.message ?? JSON.stringify(data));
                        return;
                    }
                    console.log(data);
                })
                .catch(error => {
                    console.error(error);
                });
            }
        },

        getDoctos()
        {
            return new Promise(resolve => {
                let Doctos = this.table_doctos?.DataArray??[];
                let response =
                {
                    success: true,
                    message: ""
                }
                
                for (let i = 0; i < Doctos.length; i++) {
                    const docto = Doctos[i];
                    
                    if ((docto?.IdDocumento??"").trim()==="") {
                        response.success = false;
                        response.message = "Es necesario timbrar todos los documentos para continuar";
                        break;
                    }
                    if ((docto?.ObjetoImpDR??"").trim()==="") {
                        response.success = false;
                        response.message = "Es necesario seleccionar el 'ObjetoImpDR' de todos los documentos para continuar";
                        this.table_doctos.NavTo(i,9);
                        break;
                    }
                }

                if (response.success) response.data = Doctos;

                resolve(response);
            });
        }
    },

    async submit()
    {
        if (!this.form) return;
        if (!this.form.reportValidity()) return;
        if (this.uuid_required && this.elem["sel_uuid"].options.length <= 0) {
            alert("Es necesario relacionar al menos una factura.");
            return;
        }

        disableControls(["btn_submit"]);

        let rel_uuid = [];
        Array.from(this.elem["sel_uuid"]).forEach(opt => {
            rel_uuid.push(opt.value);
        });

        const fd = new FormData(this.form);
        fd.append("rel_uuid",JSON.stringify(rel_uuid));
        
        if (this.formId === "frm_cobro") {
            const res = await this.cobro.getDoctos();
            if (!res.success) {
                alert(res.message);
                disableControls(["btn_submit"],false);
                return;
            }
            fd.append("doctosrel",JSON.stringify(res.data));
        }

        const onSuccess = (data) => {
            if (!(data?.success??true) || (data?.message??"")!=="") {
                alert(data.message ?? JSON.stringify(data));
                return;
            }
            // console.log(data);

            alert("Comprobante timbrado: "+data.uuid);
            window.location.href = data.url_redir ?? this.url_exit;
        }

        const onFailure = (error) => {
            let message = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts",message,this.error_timeout);
            disableControls(["btn_submit"],false);
        }

        InduxsoftCrudlModel.InvokeService("./", fd, onSuccess, onFailure, "POST", false, true, "", true);
    },

    agregarUUID()
    {
        const txt_uuid = this.elem["txt_uuid"];
        let value = (txt_uuid.value ?? "").trim(); 

        if (value === "") return;
        if (!this.validarUUID(value)) return;

        const select = this.elem["sel_uuid"];
        const option = document.createElement("option");
        option.value = value;
        option.text = value;

        select.appendChild(option);
        txt_uuid.value = "";
    },

    removerUUID()
    {
        const select = this.elem["sel_uuid"];
        for (let i = 0; i < select.options.length; i++) {
            const option = select.options[i];
            if (option.selected) option.remove();
        }
    },

    validarUUID(uuid)
    {
        const uuid_regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let uuid_valid = true;

        if (!uuid_regex.test(uuid)) {
            alert("El valor ingresado no corresponde a un UUID válido. \r\nDebe tener el formato 8-4-4-4-12 con caracteres hexadecimales.");
            uuid_valid = false;
        }
        
        return uuid_valid;
    }
}