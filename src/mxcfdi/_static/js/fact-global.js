
document.addEventListener("DOMContentLoaded",()=>{fglobal.init();});

var fglobal=
{
    text_notas:"",
    default_max_rows:100,
    stop_paging:false,
    page_data:{},
    params:{},

    init()
    {
        this.lbl_general_tab = document.getElementById("lbl-general-tab");
        this.lbl_preferencias_tab = document.getElementById("lbl-preferencias-tab");
        this.check_ticket=document.getElementById("check_ticket");
        this.check_remision=document.getElementById("check_remision");
        this.btn_change=document.getElementById("btn_change");
        this.form_factura_global=document.getElementById("form_factura_global");
        this.fecha_range=document.getElementById("fecha_range");
        this.cconsumo=document.getElementById("cconsumo");
        this.notas=document.getElementById("notas");
        this.btn_save_orden=document.getElementById("btn_save_orden");
        this.check_all=document.getElementById("check_all");
        this.btn_cancel_orden=document.getElementById("btn_cancel_orden");
        this.factura_global_detalle=document.getElementById("factura_global_detalle");
        this.lbl_total=document.getElementById("lbl_total");
        this.divisa=document.getElementById("divisa");
        this.objimp=document.getElementById("objimp");
        this._container_pages=document.getElementById("_container_pages");
        this.container_page=document.getElementById("container_page");
        this.btn_get_data=document.getElementById("btn_get_data");

        this.lbl_general_tab.addEventListener("click", () => {
            this.lbl_general_tab.hidden = true;
            this.lbl_preferencias_tab.hidden = false;
            if (this.btn_save_orden) this.btn_save_orden.hidden = true;
        });
        this.lbl_preferencias_tab.addEventListener("click", () => {
            this.lbl_general_tab.hidden = false;
            this.lbl_preferencias_tab.hidden = true;
            if (this.btn_save_orden) this.btn_save_orden.hidden = false;
        });

        if(this.check_ticket)this.check_ticket.addEventListener("change",()=>
        {
            this.ClickBtnFechaRange();
            this.form_factura_global.submit();
        });

        if(this.check_remision)this.check_remision.addEventListener("change",()=>
        {
            this.ClickBtnFechaRange();
            this.form_factura_global.submit();
        });

        if(this.btn_change)this.btn_change.addEventListener("click",()=>{this.ChangeFilter();});
        if(this.fecha_range)this.fecha_range.onChanging=(oldvalue,newvalue)=>
        {
            if(!newvalue || !this.notas)return;
            this.notas.value=this.text_notas+" "+newvalue.start+ " al " +newvalue.end;
        }
        
        if(this.btn_save_orden)this.btn_save_orden.addEventListener("click",()=>{this.SaveDetalle();});

        if(this.check_all)this.check_all.addEventListener("change",()=>{this.CheckedAll();});
        if(this.btn_cancel_orden)this.btn_cancel_orden.addEventListener("click",()=>{this.CancelOrden();});
        if(this.btn_get_data)this.btn_get_data.addEventListener("click",()=>{this.GetData();});
        
        if (this.factura_global_detalle)
        {
            setTimeout(() => 
            {
                if(this.fecha_range._btnEdit)this.fecha_range._btnEdit.style.cssText="display:none";    
                
                this.fechaini=document.querySelector("input[name='fechaini']");
                this.fechafin=document.getElementById("input[name='fechafin']");
    
                this.factura_global_detalle.Columns[0] = {
                    type: this.factura_global_detalle.EdiTable.Const.Columns.Types.Check,
                    field: "incluir",
                    textalign: "center",
                    default: "No"
                };
    
                this.page_data["p1"] = this.factura_global_detalle.DataArray;
                this.stop_paging = (this.factura_global_detalle.DataArray.length < this.default_max_rows);
                
                this.CollectData();
                this.SetTotales();
            }, 100);
            
            this.SetEvent();
        }
    },
    SetEvent()
    {
        const events=this.factura_global_detalle.EdiTable.Const.Events;

        this.factura_global_detalle.Events[events.FieldUpdated]=(e)=>
        {
            this.SetTotales();
        }
    },
    Enable(enable=true,elements=null)
    {
        if(!this.form_factura_global)return;

        if(!elements) elements=this.form_factura_global.querySelectorAll("input,select,textarea");
        
        for (let i = 0; i < elements.length; i++) 
        {
            const element = elements[i];
            if(element)
            {
                if(enable)
                {
                    element.removeAttribute("disabled");
                    element.removeAttribute("readonly");
                }
                else
                {
                    // element.setAttribute("disabled",true);
                    element.setAttribute("readonly",true);
                }
            }   
        }
    },
    ChangeFilter()
    {
        this.Enable(true,[this.cconsumo,this.fecha_range]);
        this.ClickBtnFechaRange("edit");

        if (this.btn_change)
        {
            if (this.btn_change.textContent.toLocaleLowerCase()=="aplicar")
            {
                if (!this.check_ticket.checked && !this.check_remision.checked) {
                    alert("Es necesario indique al menos un tipo de documento Ticket y/o Remisión.");
                    return;
                }
                const filter = document.getElementById("from-filter");

                filter.value = "true";
                this.ClickBtnFechaRange();
                this.btn_change.type="submit";
            }
            this.btn_change.textContent="Aplicar";
        }
    },
    ClickBtnFechaRange(btn="")
    {
        switch (btn) 
        {
            case "edit":
                if(fglobal.fecha_range._btnEdit)fglobal.fecha_range._btnEdit.click();
                break;
        
            default:
                if(fglobal.fecha_range._btnDone)fglobal.fecha_range._btnDone.click();
                break;
        }
        
    },
    SaveDetalle()
    {
        if (!this.objimp || this.objimp.value == "00")
        {
            alert('No se selecciono el "Objeto de impuesto" para las ventas');
            return
        }
        if(this.fechaini && this.fechaini.value.trim()=="")
        {
            alert("Debe seleccionar una fecha de inicio");
            return;
        }
        if(this.fechafin && this.fechafin.value.trim()=="")
        {
            alert("Debe seleccionar una fecha fin");
            return;
        }
        
        let DataArray = Object.values(this.page_data).flat().filter(item => tools.ParseBool(item?.incluir));
        if(DataArray.length < 1) {
            alert("Debe seleccionar algún documento Ticket o Remisión");
            return
        }
        
        InduxsoftCrudlModel.Submit(this.form_factura_global, {detalle:DataArray});
    },
    _CheckAll()
    {
        let checked = this.check_all.checked;
        
        for (const page in this.page_data) {
            let data = this.page_data[page];
            for (const item of data) {
                item.incluir = (checked) ? "Sí" : "No";
            }
        }

        this.SetTotales();
    },
    CheckedAll()
    {
        let checked = this.check_all.checked;
        for (let i = 0; i < this.factura_global_detalle.DataArray.length; i++) 
        {
            const element = this.factura_global_detalle.DataArray[i];
            element["incluir"] = (checked) ? "Sí" : "No";
        }

        this._CheckAll();
        this.factura_global_detalle._printRows();
    },
    CancelOrden()
    {
        res=confirm("¿Esta seguro de cancelar la orden?");
        if(!res)return;

        InduxsoftCrudlModel.InvokeService("./cancelar/",{},
        (data)=>
        {
            window.location.reload();
        },
        (failure)=>
        {
            alert(failure.message??JSON.stringify(failure));
        },"PATCH",false);
    },
    SetTotales()
    {
        if(!this.lbl_total) return;
        
        let total = 0;
        Object.values(this.page_data).flat().forEach(item => {
            if (tools.ParseBool(item.incluir)) {
                total = Math.add(total, Number(item.total));
            }
        });
        
        let data="";
        if(this.divisa)
        {
            let option = this.divisa.options[this.divisa.selectedIndex];
            data = option.getAttribute("data")??"";
        }
        this.lbl_total.textContent = data + " $" + tools.format(total,2);
    },
    async GetData(start, end)
    {
        try {
            let url = "/!/mxcfdi/fact-global/"+(this.params?._entity_id??"_new")+"/?only-list=true";
            url += "&from-filter=" + tools.ParseBool(this.params?.["from-filter"]);
            url += "&sys_pk=" + (Number(this.params?._entity_id) || 0);
            url += "&fechaini=" + this.params.fechaini;
            url += "&fechafin=" + this.params.fechafin;
            url += "&divisa=" + this.params.divisa;
            url += "&cconsumo=" + this.params.cconsumo;
            url += "&check_ticket=" + this.params.check_ticket;
            url += "&check_remision=" + this.params.check_remision;
            url += "&start=" + start + "&end=" + end;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);
            const data = await response.json();
            return data
        } catch (error) {
            console.log(error);
            return [];
        }
    },
    async GetPage(page)
    {
        if (page < 1) return [];
        else if (this.page_data?.["p"+page]) return this.page_data["p"+page];
        else
        {
            const data = await this.GetData((this.default_max_rows * (page - 1)), this.default_max_rows);
            return data
        }
    },
    async CollectData()
    {
        if (this.stop_paging || (!this.params.divisa || !this.params.cconsumo || !this.params.fechaini || !this.params.fechafin)) return;
        const loading_line = top.document.getElementById("loading_line");
        const last_item = document.getElementById("last-page-item");

        if (loading_line) loading_line.classList.add("loading");
        tools.showModal("waiting-dialog");

        let page = (Object.keys(this.page_data).length + 1);
        while (!this.stop_paging) {
            const data = await this.GetData((this.default_max_rows * (page - 1)), this.default_max_rows);
            if (data.length < this.default_max_rows) this.stop_paging = true;
            if (data.length == 0) break;

            let item = `
            <li class="page-item" page="${page}">
                <button class="page-link no-shadow" type="button" onclick="fglobal.SetPage(${page});">${page}</button>
            </li>
            `;
            last_item.insertAdjacentHTML('beforebegin',item);

            this.page_data["p"+page] = data;
            page++
        }

        tools.hideModal("waiting-dialog");
        if (loading_line) loading_line.classList.remove("loading");
    },
    SetPage(page)
    {
        const loading_line = top.document.getElementById("loading_line");
        const pagination = document.getElementById("pagination");
        const current = document.querySelector("#pagination .page-item.active");
        const target = document.querySelector(`#pagination .page-item[page="${page}"]`);
        if (page < 1 || Number(current.getAttribute("page")) == page) return;

        if (loading_line) loading_line.classList.add("loading");
        console.log("Estableciendo datos...");
        pagination.disabled = true;

        this.GetPage(page).then(data => {
            if (!data || data.length < this.default_max_rows) this.stop_paging = true;
            if (data.length == 0) return;

            if (!this.page_data?.["p"+page]) this.page_data["p"+page] = data;
            this.factura_global_detalle.DataArray = data;
            this.factura_global_detalle._printRows();

            current.classList.remove("active");
            if (target) target.classList.add("active");
            else
            {
                let item = `
                <li class="page-item active" page="${page}">
                    <button class="page-link no-shadow" type="button" onclick="fglobal.SetPage(${page});">${page}</button>
                </li>
                `;
                current.insertAdjacentHTML('afterend',item);
            }

            pagination.disabled = false;
            if (loading_line) loading_line.classList.remove("loading");
        });
    },
    PrevPageData()
    {
        const current = document.querySelector("#pagination .page-item.active");
        let page = Number(current.getAttribute("page")) - 1;
        this.SetPage(page);
    },
    NextPageData()
    {
        const current = document.querySelector("#pagination .page-item.active");
        let page = Number(current.getAttribute("page")) + 1;
        this.SetPage(page);
    }
}