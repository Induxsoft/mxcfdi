
document.addEventListener("DOMContentLoaded",()=>{fglobal.init();});

var fglobal=
{
    text_notas:"",
    init()
    {
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
        this._container_pages=document.getElementById("_container_pages");
        this.container_page=document.getElementById("container_page");
        this.btn_get_data=document.getElementById("btn_get_data");

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
        setTimeout(() => 
        {
            if(this.fecha_range._btnEdit)this.fecha_range._btnEdit.style.cssText="display:none";    
            
            this.fechaini=document.querySelector("input[name='fechaini']");
            this.fechafin=document.getElementById("input[name='fechafin']");

            this.factura_global_detalle.Columns[0]={type:this.factura_global_detalle.EdiTable.Const.Columns.Types.Check, field:"field_check",default:"No"};
            
            this.SetTotales();
        }, 100);
        
        this.SetEvent();
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

        if(this.btn_change)
        {
            if(this.btn_change.textContent.toLocaleLowerCase()=="aplicar")
            {
                if(!this.check_ticket.checked && !this.check_remision.checked)
                {
                    alert("Es necesario indique al menos un tipo de documento Ticket y/o Remisión.");
                    return;
                }
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
        
        var Array=[];

        for (let i = 0; i < this.factura_global_detalle.DataArray.length; i++) 
        {
            const element = this.factura_global_detalle.DataArray[i];
            if(element && tools.ParseBool(element.field_check??false))
            {
                var item={venta:element.sys_pk}
                Array.push(item);
            }
        }

        if(Array.length<1)
        {
            alert("Debe seleccionar algún documento Ticket o Remisión");
            return;
        }

        var details=
        {
            detalle:Array
        }
        InduxsoftCrudlModel.Submit(this.form_factura_global,details);
    },
    CheckedAll()
    {
        let checked=this.check_all.checked;
        for (let i = 0; i < this.factura_global_detalle.DataArray.length; i++) 
        {
            const element = this.factura_global_detalle.DataArray[i];
            element["field_check"]=checked?"Sí":"No";
        }
        this.factura_global_detalle._printRows();
        console.log("12121212")
        this.SetTotales();
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
        if(!this.lbl_total)return;
        
        let total=0;
        for (let i = 0; i < this.factura_global_detalle.DataArray.length; i++) 
        {
            const element = this.factura_global_detalle.DataArray[i];
            if(tools.ParseBool(element?.field_check??false))total+=Number(element.total??0);
        }
        
        let data="";
        if(this.divisa)
        {
            let option=this.divisa.options[this.divisa.selectedIndex];
            data=option.getAttribute("data")??"";
        }
        this.lbl_total.textContent=data+" $"+tools.format(total,2);
    },
    GetData()
    {
        
    }
}