var fglist = {
    tableId:"", table:null,
    acttemp:"",

    init()
    {
        this.table = document.getElementById(this.tableId);
        const filter_date = document.getElementById("filter_date");
        
        if (filter_date) filter_date._btnDone.addEventListener("click", (e) => { document.getElementById("form_filter").submit(); });
    },

    getCurrentContext()
    {
        const id = ((this.table?.DataArray??[])[this.table.CurrentRowIndex()]?.sys_pk ?? "");
        return { item_id:id, context:{} }
    },

    timbrarOrden(id)
    {
        if (!id || !confirm("¿Timbrar orden seleccionada?")) return;

        InduxsoftCrudlModel.InvokeService("/!/mxcfdi/fact-global/"+id+"/ejecutar/",{},
            (data) => {
                if (!(data?.success??true) || (data?.message??"")!="") {
                    alert(data.message ?? JSON.stringify(data));
                    return
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            },
            (error) => {
                alert(error.message ?? "¡Ha ocurrido un error!, no fue posible ejecutar la orden");
                console.error(error);
            },
            "PATCH",false
        );
    },

    verificarOrden(id)
    {
        if (!id) return;
        let index = (this.table?.DataArray ?? []).findIndex(obj => obj.sys_pk == id);
        if (index < 0) return;

        InduxsoftCrudlModel.InvokeService("/!/mxcfdi/fact-global/"+id+"/verificar/",null,
            (data) => {
                if (!(data?.success??true) || (data?.message??"")!="") {
                    alert(data.message ?? JSON.stringify(data));
                    return
                }

                let rowdata = this.table.DataArray[index];
                console.log("Orden de la fila "+ (index+1) +":", data.text_status);
                // if (rowdata.status == data.status) return;

                rowdata.status = data.status;
                rowdata.estado = data.text_status;
                rowdata.token_solicitud = data.token_solicitud;
                rowdata.last_error = data.last_error;
                rowdata._actions = this.table.applyTemplate(this.acttemp,rowdata);

                this.table.UpdateRow(index);
            },
            (error) => {
                alert(error.message ?? "¡Ha ocurrido un error!, no fue posible verificar la orden");
                console.error(error);
            },
            "GET",false
        );
    },

    cancelarOrden(id)
    {
        if (!id || !confirm("¿Seguro que quiere cancelar la orden seleccionada?")) return;

        InduxsoftCrudlModel.InvokeService("/!/mxcfdi/fact-global/"+id+"/cancelar/",{},
            (data) => {
                if (!(data?.success??true) || (data?.message??"")!="") {
                    alert(data.message ?? JSON.stringify(data));
                    return
                }

                if ((data?.url_redir??"") == "") { window.location.reload(); }
                else
                {
                    if (confirm("La orden ha sido cancelada, para cancelar el CFDI dirigase al módulo de <Facturación electrónica>.\r\n¿Ir ahora mismo?"))
                    { window.location.href = data.url_redir || "/!/mxcfdi/emision/"; }
                    else { window.location.reload(); }
                }
            },
            (error) => {
                alert(error.message ?? "¡Ha ocurrido un error!, no fue posible cancelar la orden");
                console.error(error);
            },
            "PATCH",false
        );
    },
}