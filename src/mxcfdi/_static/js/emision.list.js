var list =
{
    tableId:"", table:null,
    url_download:"",

    init()
    {
        this.table = document.getElementById(this.tableId);
        const btn_emitir = document.getElementById("btn_emitir");
        const btn_download = document.getElementById("btn_download");

        if (btn_emitir) btn_emitir.addEventListener("click", (e) => this.emitir(e.target));
        if (btn_download) btn_download.addEventListener("click", (e) => this.descargar(e.target));
    },

    getCurrentContext()
    {
        const id = ((this.table?.DataArray??[])[this.table.CurrentRowIndex()]?.sys_pk ?? "");
        return { item_id:id, context: {} }
    },

    emitir(button)
    {
        let href = button.getAttribute("data-href");
        let context = this.getCurrentContext();
        let item_id = (context.item_id || "");

        if ((typeof item_id === "string" && item_id.trim() === "") || (typeof item_id === "number" && item_id <= 0)) {
            alert("Se requiere seleccionar un elemento de la lista.");
            return;
        }

        window.location.href = href.replace("@_src_context_item_id",item_id);
    },

    descargar(button)
    {
        if (!this.table) {
            console.warn("La tabla no esta definida.");
            return
        }
        if (this.url_download.toString().trim() === "") {
            console.warn("endpoint de descarga no definido.");
            return
        }

        button.disabled = true;
        const row = (this.table?.DataArray??[])[this.table.CurrentRowIndex()];
        
        let endpoint = InduxsoftCrudlModel.UrlReplace(this.url_download,{uuid:row.uf_foliosat});
        fetch(endpoint).then(response => response.json())
        .then(data => {
            if (!(data?.success??true) || (data?.message??"")!=="") {
                alert(data.message ?? JSON.stringify(data));
                return;
            }
            window.location.href = data.link;
            button.disabled = false;
        })
        .catch(error => {
            console.error(error);
            button.disabled = false;
        });
    },
}