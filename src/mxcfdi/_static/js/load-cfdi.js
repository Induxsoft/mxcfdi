
document.addEventListener("DOMContentLoaded",()=>{load_cfdi.init()});

var load_cfdi=
{
    init()
    {
        this.proveedor=document.getElementById("proveedor");
        this.tbl_datail=document.getElementById("tbl_datail");
        this.form_detalle=document.getElementById("form-detalle");
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

        for (let i = 0; i < this.tbl_datail.DataArray.length; i++) 
        {
            var item = this.tbl_datail.DataArray[i];
            if((item.codigo??"").trim()=="")
            {
                alert(`Debe colocar un código del producto, fila ${i+1}`);
                return;
            }
            if((item.descripcion??"").trim()=="")
            {
                alert(`Debe colocar una descripción del producto, fila ${i+1}`);
                return;
            }
            if(typeof item.linea === "undefined" || Number(item.linea)<1)
            {
                alert(`Debe seleccionar una línea, fila ${i+1}`);
                return;
            }
            if(typeof item.divisa === "undefined" || Number(item.divisa)<1)
            {
                alert(`Debe seleccionar una divisa, fila ${i+1}`);
                return;
            }
            if(typeof item.impuesto === "undefined" || Number(item.impuesto)<1)
            {
                alert(`Debe seleccionar un impuesto, fila ${i+1}`);
                return;
            }
            if(typeof item.clase === "undefined" || Number(item.clase)<1)
            {
                alert(`Debe seleccionar una clase, fila ${i+1}`);
                return;
            }
            if(typeof item.tipo === "undefined" || Number(item.tipo)<1)
            {
                alert(`Debe seleccionar un tipo, fila ${i+1}`);
                return;
            }
            if(typeof item.metodovaluacion === "undefined" || Number(item.metodovaluacion)<1)
            {
                alert(`Debe seleccionar un método de valuación, fila ${i+1}`);
                return;
            }
        }

        var details=
        {
            detalle:this.tbl_datail.DataArray
        }

        InduxsoftCrudlModel.Submit(this.form_detalle,details);
    }
}