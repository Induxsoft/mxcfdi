var mail =
{
    formId:"", form:null, elem:null,
    url_exit:"/!/mxcfdi/emision/",
    error_timeout:7,
    max_adjuntos_mb:10,     // Tamaño máximo total de los adjuntos (debe coincidir con el servidor).
    adjuntos:[],            // Archivos seleccionados (File[]).

    init()
    {
        this.form = document.getElementById(this.formId);
        this.elem = this.form.elements;
        const btn_submit = document.getElementById("btn_submit");
        const btn_add_mail = document.getElementById("btn_add_mail");
        const btn_del_mail = document.getElementById("btn_del_mail");
        const btn_add_cc = document.getElementById("btn_add_cc");
        const btn_del_cc = document.getElementById("btn_del_cc");
        const file_adjuntos = document.getElementById("file_adjuntos");

        if (btn_submit) btn_submit.addEventListener("click", (e) => this.submit());
        if (btn_add_mail) btn_add_mail.addEventListener("click", (e) => this.agregarCorreos("txt_emails","email_list"));
        if (btn_del_mail) btn_del_mail.addEventListener("click", (e) => this.removerCorreos("email_list"));
        // CC reutiliza la misma caja de texto (txt_emails) y agrega a la lista de copia.
        if (btn_add_cc) btn_add_cc.addEventListener("click", (e) => this.agregarCorreos("txt_emails","cc_list"));
        if (btn_del_cc) btn_del_cc.addEventListener("click", (e) => this.removerCorreos("cc_list"));
        if (file_adjuntos) file_adjuntos.addEventListener("change", (e) => this.agregarAdjuntos());

        // Enter en la caja de texto agrega a destinatarios en lugar de enviar el formulario.
        const txt_emails = this.elem["txt_emails"];
        if (txt_emails) txt_emails.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { e.preventDefault(); this.agregarCorreos("txt_emails","email_list"); }
        });

        if (this.elem["txt_correos"].value != "") {
            this.elem["txt_emails"].value = this.elem["txt_correos"].value;
            this.agregarCorreos("txt_emails","email_list");
        }

        this.renderAdjuntos();
    },

    submit()
    {
        if (!this.form) return;
        if (!this.form.reportValidity()) return;
        if (this.elem["email_list"].options.length <= 0) {
            alert("Agregue al menos un correo electrónico válido.");
            return
        }
        if (this.totalAdjuntos() > this.max_adjuntos_mb * 1024 * 1024) {
            alert("Los archivos adjuntos superan el tamaño máximo de " + this.max_adjuntos_mb + " MB.");
            return
        }

        disableControls(["btn_submit"]);

        const fd = new FormData(this.form);
        fd.append("emails", this.valoresLista("email_list").join(";"));
        // cc_list y file_adjuntos solo existen si mxcfdi_modif_data_email está activa.
        if (this.elem["cc_list"]) fd.append("cc", this.valoresLista("cc_list").join(";"));
        // Los archivos viajan en el campo "adjuntos" (input file sincronizado con this.adjuntos).

        const onSuccess = (data) => {
            if (!(data?.success??true) || (data?.message??"")!=="") {
                alert(data.message ?? JSON.stringify(data));
                disableControls(["btn_submit"],false);
                return;
            }
            console.log(data);

            alert("Correos enviados");
            window.location.href = data.url_redir ?? this.url_exit;
        }

        const onFailure = (error) => {
            let message = error.message ?? JSON.stringify(error);
            show_alert("#frm_alerts",message,this.error_timeout);
            disableControls(["btn_submit"],false);
        }

        InduxsoftCrudlModel.InvokeService("./", fd, onSuccess, onFailure, "POST", false, true, "", true);
    },

    // ---------- Correos (Para y CC) ----------

    valoresLista(selectId)
    {
        const select = this.elem[selectId];
        if (!select) return [];
        return Array.from(select.options).map(opt => opt.value);
    },

    agregarCorreos(txtId = "txt_emails", selectId = "email_list")
    {
        const txt_emails = this.elem[txtId];
        const select = this.elem[selectId];
        if (!txt_emails || !select) return;

        let value = (txt_emails.value ?? "").trim();
        if (value === "") return;

        const add = (email) => {
            // Evita duplicados: un correo no puede estar dos veces ni en Correos y CC a la vez.
            const e = email.toLowerCase();
            if (this.valoresLista("email_list").concat(this.valoresLista("cc_list")).some(v => v.toLowerCase() === e)) return;
            const option = document.createElement("option");
            option.value = email;
            option.text = email;
            select.appendChild(option);
        }

        let list = value.split(";").map(v => v.trim()).filter(v => v !== "");
        if (list.length > 1)
        {
            let invalidEmail = [];
            for (let i = 0; i < list.length; i++) {
                const email = list[i];
                if (!this.isValidEmail(email)) invalidEmail.push(email);
                else add(email);
            }

            txt_emails.value = "";

            if (invalidEmail.length > 0) {
                txt_emails.value = invalidEmail.join(";");
                show_alert("#frm_alerts","Los siguientes valores no corresponden a correos electrónicos válidos.",this.error_timeout);
            }
        }
        else
        {
            if (!this.isValidEmail(list[0])) {
                alert("El valor ingresado no corresponde a un correo electrónico válido.");
                return
            }
            add(list[0]);
            txt_emails.value = "";
        }
    },

    removerCorreos(selectId = "email_list")
    {
        const select = this.elem[selectId];
        if (!select) return;
        // Se recorre al revés: al eliminar, los índices siguientes se recorren.
        for (let i = select.options.length - 1; i >= 0; i--) {
            if (select.options[i].selected) select.options[i].remove();
        }
    },

    isValidEmail(email)
    {
        const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email_regex.test(email);
    },

    // ---------- Adjuntos ----------

    agregarAdjuntos()
    {
        const input = this.elem["file_adjuntos"];
        if (!input) return;

        // El input reemplaza su selección en cada apertura; aquí se acumulan.
        Array.from(input.files).forEach(f => {
            const existe = this.adjuntos.some(a => a.name === f.name && a.size === f.size && a.lastModified === f.lastModified);
            if (!existe && f.size > 0) this.adjuntos.push(f);
        });

        if (this.totalAdjuntos() > this.max_adjuntos_mb * 1024 * 1024) {
            show_alert("#frm_alerts","Los archivos adjuntos superan el tamaño máximo de " + this.max_adjuntos_mb + " MB. Elimine alguno antes de enviar.",this.error_timeout);
        }

        this.sincronizarInput();
        this.renderAdjuntos();
    },

    removerAdjunto(index)
    {
        this.adjuntos.splice(index, 1);
        this.sincronizarInput();
        this.renderAdjuntos();
    },

    sincronizarInput()
    {
        // Copia this.adjuntos al input para que FormData(form) los envíe.
        const input = this.elem["file_adjuntos"];
        if (!input) return;
        const dt = new DataTransfer();
        this.adjuntos.forEach(f => dt.items.add(f));
        input.files = dt.files;
    },

    totalAdjuntos()
    {
        return this.adjuntos.reduce((t, f) => t + f.size, 0);
    },

    formatoTamano(bytes)
    {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    },

    renderAdjuntos()
    {
        const ul = document.getElementById("lista_adjuntos");
        const info = document.getElementById("info_adjuntos");
        if (!ul) return;

        ul.replaceChildren();
        this.adjuntos.forEach((f, i) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center px-1 py-1";

            const span = document.createElement("span");
            span.className = "text-truncate";
            span.textContent = f.name + " (" + this.formatoTamano(f.size) + ")";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-sm btn-outline-secondary rounded-0 py-0";
            btn.title = "Quitar archivo";
            btn.textContent = "×";
            btn.addEventListener("click", () => this.removerAdjunto(i));

            li.append(span, btn);
            ul.appendChild(li);
        });

        if (info) {
            const total = this.totalAdjuntos();
            const excedido = total > this.max_adjuntos_mb * 1024 * 1024;
            info.classList.toggle("text-danger", excedido);
            info.textContent = (this.adjuntos.length > 0
                ? this.adjuntos.length + " archivo(s), " + this.formatoTamano(total) + ". "
                : "") + "Tamaño máximo total: " + this.max_adjuntos_mb + " MB.";
        }
    }
}