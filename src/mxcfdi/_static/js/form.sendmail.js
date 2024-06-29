var mail =
{
    formId:"", form:null, elem:null,
    url_exit:"/!/mxcfdi/emision/",
    error_timeout:7,

    init()
    {
        this.form = document.getElementById(this.formId);
        this.elem = this.form.elements;
        const btn_submit = document.getElementById("btn_submit");
        const btn_add_mail = document.getElementById("btn_add_mail");
        const btn_del_mail = document.getElementById("btn_del_mail");

        if (btn_submit) btn_submit.addEventListener("click", (e) => this.submit());
        if (btn_add_mail) btn_add_mail.addEventListener("click", (e) => this.agregarCorreos());
        if (btn_del_mail) btn_del_mail.addEventListener("click", (e) => this.removerCorreos());

        if (this.elem["txt_correos"].value != "") {
            this.elem["txt_emails"].value = this.elem["txt_correos"].value;
            this.agregarCorreos();
        }
    },

    submit()
    {
        if (!this.form) return;
        if (!this.form.reportValidity()) return;
        if (this.elem["email_list"].options.length <= 0) {
            alert("Agregue al menos un correo electrónico válido.");
            return
        }

        disableControls(["btn_submit"]);

        let list = [];
        Array.from(this.elem["email_list"]).forEach(opt => {
            list.push(opt.value);
        });

        const fd = new FormData(this.form);
        fd.append("emails",list.join(";"));

        const onSuccess = (data) => {
            if (!(data?.success??true) || (data?.message??"")!=="") {
                alert(data.message ?? JSON.stringify(data));
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

    agregarCorreos()
    {
        const txt_emails = this.elem["txt_emails"];
        let value = (txt_emails.value ?? "").trim();

        if (value === "") return;

        const add = (email) => {
            const select = this.elem["email_list"];
            const option = document.createElement("option");
            option.value = email;
            option.text = email;

            select.appendChild(option);
        }
        
        let list = value.split(";");
        if (list.length > 1)
        {
            let invalidEmail = [];
            for (let i = 0; i < list.length; i++) {
                const email = list[i].trim();
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
            if (!this.isValidEmail(value)) {
                alert("El valor ingresado no corresponde a un correo electrónico válido.");
                return
            }
            add(value);
            txt_emails.value = "";
        }
    },

    removerCorreos()
    {
        const select = this.elem["email_list"];
        for (let i = 0; i < select.options.length; i++) {
            const option = select.options[i];
            if (option.selected) option.remove();
        }
    },

    isValidEmail(email)
    {
        const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email_regex.test(email);
    }
}