var emision =
{
    formId:"", form:null, elem:null,

    init()
    {
        this.form = document.getElementById(this.formId);
        this.elem = this.form.elements;
        const btn_submit = document.getElementById("btn_submit");
        const btn_add_uuid = document.getElementById("btn_add_uuid");
        const btn_del_uuid = document.getElementById("btn_del_uuid");

        if (btn_add_uuid) btn_add_uuid.addEventListener("click", (e) => this.agregarUUID());
        if (btn_del_uuid) btn_del_uuid.addEventListener("click", (e) => this.removerUUID());
    },

    agregarUUID()
    {
        const txt_uuid = this.elem["txt_uuid"];
        let value = (txt_uuid.value ?? "").trim(); 

        if (value === "") return;

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
}