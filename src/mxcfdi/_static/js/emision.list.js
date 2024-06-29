var list =
{
    tableId:"", table:null, parameters:{},
    url_preview:"", url_download:"",

    init()
    {
        this.table = document.getElementById(this.tableId);
        const btn_emitir = document.getElementById("btn_emitir");
        const btn_preview = document.getElementById("btn_preview");
        const btn_download = document.getElementById("btn_download");
        const btn_sendmail = document.getElementById("btn_sendmail");
        const btn_cancelar = document.getElementById("btn_cancelar");

        if (btn_emitir) btn_emitir.addEventListener("click", (e) => this.goto(e.target));
        if (btn_sendmail) btn_sendmail.addEventListener("click", (e) => this.goto(e.target));
        if (btn_preview) btn_preview.addEventListener("click", (e) => this.preview(e.target));
        if (btn_download) btn_download.addEventListener("click", (e) => this.download(e.target));
    },

    getCurrentContext()
    {
        const id = ((this.table?.DataArray??[])[this.table.CurrentRowIndex()]?.sys_pk ?? "");
        return { item_id:id, context: {} }
    },

    getEntityId()
    {
        const fil_doctype = document.getElementById("fil_doctype");
        const opt_doctype = fil_doctype.options[fil_doctype.selectedIndex];

        let doctype = opt_doctype.text.toLowerCase();

        if (["facturas","devoluciones"].includes(doctype)) return "ventas";
        if (["cargos","bonificaciones","cobros"].includes(doctype)) return "cxc";
    },

    goto(button)
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

    preview(button)
    {
        if (!this.table) {
            console.warn("La tabla no esta definida.");
            return
        }
        if (this.url_preview.toString().trim() === "") {
            console.warn("endpoint de vista previa no definida.");
            return
        }

        const row = (this.table?.DataArray??[])[this.table.CurrentRowIndex()];

        if (Number(row?.sys_pk??0) <= 0) {
            alert("Se requiere seleccionar un elemento de la lista.");
            return
        }

        button.disabled = true;
        let endpoint = (this.url_preview).replace("@_entity_id",this.getEntityId()).replace("@doc",row.sys_pk);
        fetch(endpoint).then(response => response.json())
        .then(data => {
            if (!(data?.success??true) || (data?.message??"")!=="") {
                alert(data.message ?? JSON.stringify(data));
                button.disabled = false;
                return;
            }
            window.open(data.link,"_blank");
            button.disabled = false;
        })
        .catch(error => {
            console.error(error);
            button.disabled = false;
        });
    },

    download(button)
    {
        if (!this.table) {
            console.warn("La tabla no esta definida.");
            return
        }
        if (this.url_download.toString().trim() === "") {
            console.warn("endpoint de descarga no definida.");
            return
        }

        const row = (this.table?.DataArray??[])[this.table.CurrentRowIndex()];

        if (Number(row?.sys_pk??0) <= 0) {
            alert("Se requiere seleccionar un elemento de la lista.");
            return
        }
        
        button.disabled = true;
        let endpoint = InduxsoftCrudlModel.UrlReplace(this.url_download,{ uuid:row.uf_foliosat });
        fetch(endpoint).then(response => response.json())
        .then(data => {
            if (!(data?.success??true) || (data?.message??"")!=="") {
                alert(data.message ?? JSON.stringify(data));
                button.disabled = false;
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