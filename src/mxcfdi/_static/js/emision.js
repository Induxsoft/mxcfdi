var emision =
{
    formId:"", form:null, elem:null,
    url_exit:"/!/mxcfdi/emision/", error_timeout:7,

    init()
    {
        this.form = document.getElementById(this.formId);
        this.elem = this.form.elements;
        const sel_metodo_pago = document.getElementById("sel_metodo_pago");
        const txt_cond_pago = document.getElementById("txt_cond_pago");
        const btn_submit = document.getElementById("btn_submit");
        const btn_add_uuid = document.getElementById("btn_add_uuid");
        const btn_del_uuid = document.getElementById("btn_del_uuid");

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
    },

    submit()
    {
        if (!this.form) return;
        if (!this.form.reportValidity()) return;
        disableControls(["btn_submit"]);

        let rel_uuid = [];
        Array.from(this.elem["sel_uuid"]).forEach(opt => {
            rel_uuid.push(opt.value);
        });

        const fd = new FormData(this.form);
        fd.append("rel_uuid",JSON.stringify(rel_uuid));

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
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