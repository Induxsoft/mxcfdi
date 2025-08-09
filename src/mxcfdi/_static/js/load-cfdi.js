
document.addEventListener("DOMContentLoaded",()=>{load_cfdi.init()});

var load_cfdi=
{
    module:"",
    init()
    {
        this.proveedor=document.getElementById("proveedor");
        this.tbl_datail=document.getElementById("tbl_datail");
        this.form_detalle=document.getElementById("form-detalle");
    },
    ValidateModule()
    {
        switch (load_cfdi.module) 
        {
            case "gasto":
                for (let i = 0; i < this.tbl_datail.DataArray.length; i++)
                {
                    var item = this.tbl_datail.DataArray[i];
                    if((item.referencia??"").trim()=="")
                    {
                        alert(`Debe colocar una referencia, fila ${i+1}`);
                        return false;
                    }
                    if(!item.categoria || (item.categoria??"").trim()=="")
                    {
                        alert(`Debe seleccionar una categoría, fila ${i+1}`);
                        return false;
                    }
                    if(!item.fpago || (item.fpago??"").trim()=="")
                    {
                        alert(`Debe seleccionar una forma de pago, fila ${i+1}`);
                        return false;
                    }
                    
                    if(item.pago==1)
                    {
                        if(!item.documento || (item.documento??"").trim()=="")
                        {
                            alert(`Debe seleccionar un documento, fila ${i+1}`);
                            return false;
                        }
                        if(!item.cuenta || (item.cuenta??"").trim()=="")
                        {
                            alert(`Debe seleccionar una cuenta, fila ${i+1}`);
                            return false;
                        }
                    }
                    else
                    {
                        if(!item.tipo_documento || (item.tipo_documento??"").trim()=="")
                        {
                            alert(`Debe seleccionar un tipo de documento, fila ${i+1}`);
                            return false;
                        }
                    }
                }
                break;
            default:
                for (let i = 0; i < this.tbl_datail.DataArray.length; i++) 
                {
                    var item = this.tbl_datail.DataArray[i];
                    if((item.codigo??"").trim()=="")
                    {
                        alert(`Debe colocar un código del producto, fila ${i+1}`);
                        return false;
                    }
                    if((item.descripcion??"").trim()=="")
                    {
                        alert(`Debe colocar una descripción del producto, fila ${i+1}`);
                        return false;
                    }
                    if(typeof item.linea === "undefined" || Number(item.linea)<1)
                    {
                        alert(`Debe seleccionar una línea, fila ${i+1}`);
                        return false;
                    }
                    if(typeof item.divisa === "undefined" || Number(item.divisa)<1)
                    {
                        alert(`Debe seleccionar una divisa, fila ${i+1}`);
                        return false;
                    }
                    if(typeof item.impuesto === "undefined" || Number(item.impuesto)<1)
                    {
                        alert(`Debe seleccionar un impuesto, fila ${i+1}`);
                        return false;
                    }
                    if(typeof item.clase === "undefined" || Number(item.clase)<1)
                    {
                        alert(`Debe seleccionar una clase, fila ${i+1}`);
                        return false;
                    }
                    if(typeof item.tipo === "undefined" || Number(item.tipo)<1)
                    {
                        alert(`Debe seleccionar un tipo, fila ${i+1}`);
                        return false;
                    }
                    if(typeof item.metodovaluacion === "undefined" || Number(item.metodovaluacion)<1)
                    {
                        alert(`Debe seleccionar un método de valuación, fila ${i+1}`);
                        return false;
                    }
                }
                break;
        }
        return true;
    },
    Procesar()
    {
        if(!this.proveedor)
        {
            alert("Elemento input-key no encontrado");
        }
        if(!this.tbl_datail)
        {
            alert("Tabla no encontrado");
            return;
        }
        

        if (!this.form_detalle.reportValidity()) return;

        var proveedor=this.proveedor.getValue();
        if(proveedor==null || Object.keys(proveedor)<1)
        {
            alert("Debe seleccionar un proveedor");
            return;
        }

        if(!this.ValidateModule())return;

        var details=
        {
            detalle:this.tbl_datail.DataArray
        }
        
        InduxsoftCrudlModel.Submit(this.form_detalle,details);
    },
    Submit(idform,confirmar,confirmado=false)
    {
        let success=null;
        let details={confirmado:confirmado};
        if(confirmar)
        {
            success= (data)=>
            {
                if(data.message)
                {
                    if(!confirm(data.message))
                    {
                        this.DisableControls(idform,false);
                        return;
                    }
                    this.Submit(idform,confirmar,true);
                    return;
                }
                if(data.url_redir)window.location.href = data.url_redir ?? "../";
                else window.location.reload();
            }
        }

        InduxsoftCrudlModel.Submit(idform,details,success);
    },
    DisableControls(formOrId,disable)
    {
        const form = (typeof formOrId === "string") ? document.getElementById(formOrId) : formOrId;

        const v12FormBar = document.getElementById("v12FormBar_content");
        if (v12FormBar) v12FormBar.querySelectorAll("button,a").forEach(v12btn => {
            v12btn.style.pointerEvents = (disable) ? "none" : "";
            v12btn.style.backgroundColor = (disable) ? "#e9ecef" : "";
            v12btn.style.opacity = (disable) ? "1" : "";
        });
        form.querySelectorAll("button").forEach(frmbtn => {
            frmbtn.disabled = disable;
        });
    }
}