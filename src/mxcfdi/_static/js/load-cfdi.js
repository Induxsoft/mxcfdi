
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

        var proveedor=this.proveedor.getData();
        if(proveedor==null || Object.keys(proveedor)<1)
        {
            alert("Debe seleccionar un proveedor");
            return;
        }

        for (let i = 0; i < this.tbl_datail.DataArray.length; i++) 
        {
            var item = array[i];
            if((item.codigo??"").trim()=="")
            {
                alert(`Debe colocar un código del producto, fila ${i+1}`);
            }
            if((item.descripcion??"").trim()=="")
            {
                alert(`Debe colocar una descripción del producto, fila ${i+1}`);
            }
            if(Number(item.linea)<1)
            {
                alert(`Debe seleccionar una línea, fila ${i+1}`);
            }
            if(Number(item.divisa)<1)
            {
                alert(`Debe seleccionar una divisa, fila ${i+1}`);
            }
            if(Number(item.impuesto)<1)
            {
                alert(`Debe seleccionar una divisa, fila ${i+1}`);
            }
            if(Number(item.clase)<1)
            {
                alert(`Debe seleccionar una clase, fila ${i+1}`);
            }
            if(Number(item.tipo)<1)
            {
                alert(`Debe seleccionar un tipo, fila ${i+1}`);
            }
            if(Number(item.metodovaluacion)<1)
            {
                alert(`Debe seleccionar un método de valuación, fila ${i+1}`);
            }
        }

        var details=
        {
            detalle:this.tbl_datail.DataArray
        }

        InduxsoftCrudlModel.Submit(this.form_detalle,details);
    }
}