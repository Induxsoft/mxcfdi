var fglist = {
    tableId:"", table:null,

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
                alert(error.message ?? "Ha ocurrido un error, no fue posible ejecutar la orden");
                console.error(error);
            },
            "PATCH",false
        );
    },

    cancelarOrden(id)
    {
        if (!id || !confirm("¿Esta seguro en cancelar la orden seleccionada?")) return;

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
                alert(error.message ?? "Ha ocurrido un error, no fue posible cancelar la orden");
                console.error(error);
            },
            "PATCH",false
        );
    },
}