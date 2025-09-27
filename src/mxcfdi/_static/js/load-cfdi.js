
document.addEventListener("DOMContentLoaded",()=>{load_cfdi.init()});

var load_cfdi=
{
    module:"",canrelacionar:"",
    init()
    {
        this.proveedor=document.getElementById("proveedor");
        this.tbl_datail=document.getElementById("tbl_datail");
        this.form_detalle=document.getElementById("form-detalle");
        this.sel_almacen=document.getElementById("sel_almacen");
        this.ik_producto=document.getElementById("ik_producto");
        if(this.ik_producto)this.ik_producto.change_event=(data)=>{this.ProdRelacionar(data);};
        
        if(this.tbl_datail)
        {
            const evt = this.tbl_datail.EdiTable.Const.Events;
            this.tbl_datail.AutoAddRow = false;
            this.tbl_datail.AutoDelRow = false;
            this.tbl_datail.Events[evt.EnterCell] = (e) => 
            {
                let coldef = e.sender.GetColumnDefOfTd(e.td);
                let curr_row = this.tbl_datail.RowIndexOfTd(e.td);
                let curr_col = this.tbl_datail.ColIndexOfTd(e.td);
                let producto = this.tbl_datail.DataArray[curr_row];

                this.tbl_datail.Columns[curr_col].type = this.coldef[curr_col].type;
                if (Object.keys(producto ?? {}).length < this.tbl_datail.Columns.length) return;
                this.disableIncludedRows(curr_col,coldef.field,producto);
            };

            this.LoadColumns();
        }
    },
    LoadColumns()
    {
        this.coldef = JSON.parse(JSON.stringify(this.tbl_datail.Columns));
        if(this.coldef==null || this.coldef.length < 1)setTimeout(() => {this.LoadColumns();}, 100);
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
                    if((item.idrelacionado??0)>0)continue;

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
    Procesar(confirmado=false)
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
        if(this.sel_almacen && Number(this.sel_almacen.value) < 1)
        {
            alert("Debe seleccionar un almacén");
            this.sel_almacen.focus();
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
            detalle:this.tbl_datail.DataArray,
            confirmado:confirmado
        }
        let success=(data)=>
        {
            if(data.confirmar)
            {
                let res=confirm(data.message);
                if(!res)return;
                tools.V12FormBarDisableControls(false,this.form_detalle);
                this.Procesar(true);
            }
            if (!(data?.success??true) || (data?.message??"")!="") 
            {
				tools.FireError(data?.message ?? JSON.stringify(data),this.form_detalle);
				tools.V12FormBarDisableControls(false,this.form_detalle);
				return
			}
			// console.log(data)
			if(data.url_redir)window.location.href = data.url_redir;
        }
        InduxsoftCrudlModel.Submit(this.form_detalle,details,success);
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
    },
    ProdRelacionar(data)
    {
        if(!data || Object.keys(data).length < 1)return;
        this.SetValueRow(data);
    },
    SetValueRow(data)
    {
        let index=this.tbl_datail.CurrentRowIndex();
        let row=this.tbl_datail.DataArray[index];
        if(!row)return;
        
        if(!data || Object.keys(data).length<1)
        {
            row["relproducto"]="";
            row["idrelacionado"]=0;
        }
        else
        {
            row["relproducto"]=(data.codigo??"") +" - "+(data.descripcion??"");
            row["idrelacionado"]=(data.sys_pk??0);
        }
        
        this.tbl_datail._printRows();
        this.tbl_datail.NavTo(index,0);
    },
    Relacionar(codigomd5,codigo,e)
    {
        if(this.canrelacionar!="")
        {
            alert(this.canrelacionar);
            return;
        }
        // let index=this.tbl_datail.CurrentRowIndex();
        // if(index < 0)e.stopPropagation();

        if(!this.ik_producto)
        {
            console.log("No se encontró un elemento input-key");
            return;
        }

        this.ik_producto.searchText(codigo,false)
    },
    Quitar(codigomd5,e)
    {
        //esperar mientras la tabla hace focus a la celda para poder obtener el indeice con CurrentRowIndex()
        setTimeout(() => {this.SetValueRow({});}, 200);
    },
    disableIncludedRows(icol,field,data)
    {
        // Deshabilitar edición a las filas incluidas por un documento tercero.
        if ((data.idrelacionado??0)>0) this.tbl_datail.Columns[icol].type = "NoEditable";
        else this.tbl_datail.Columns[icol].type = this.coldef[icol].type;
    },
}