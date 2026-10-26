(()=>{'use strict';
const BASE='https://xpbmvtainyjgsrwzwylm.supabase.co/rest/v1/';
const KEY='sb_publishable_LYiN60ZEBQbEPlXcBLtKrA_Tjdw6oJY';
async function read(table,sort){const r=await fetch(BASE+table+'?select=*&activo=eq.true&order='+sort+'.asc',{headers:{apikey:KEY},cache:'no-store'});if(!r.ok)throw Error('No se pudo actualizar '+table);return r.json()}
async function refresh(){
 try{
 const [conductores,comisionistas,vehiculos]=await Promise.all([read('conductores','nombre'),read('comisionistas','nombre'),read('vehiculos','placa')]);
 for(const [id,rows,key] of [['nombre',conductores,'tutrans_conductores_v1'],['cliente',comisionistas,'tutrans_comisionistas_v1']]){
 localStorage.setItem(key,JSON.stringify(rows.map(r=>r.nombre)));mostrarNombres(id);
 }
 renderizarDirectorio();
 for(const [id,tipo] of [['tracto','TRACTO'],['acoplado','ACOPLADO'],['camion','CAMION']]){
 const selected=document.getElementById(id).value;
 const sel=document.getElementById(id);sel.innerHTML='<option value="">Seleccionar placa</option>';
 vehiculos.filter(r=>r.tipo===tipo).forEach(r=>{const o=document.createElement('option');o.value=r.placa;o.textContent=r.placa;sel.add(o)});
 if([...sel.options].some(o=>o.value===selected))sel.value=selected;
 }
 const tipoSel=document.getElementById('unidadAsignada'),current=tipoSel.value;
 tipoSel.innerHTML='<option value="">Seleccionar unidad</option>';
 vehiculos.filter(r=>r.tipo!=='ACOPLADO').forEach(r=>{const o=document.createElement('option');o.value=r.tipo+'|'+r.placa;o.textContent=r.placa+' · '+(r.tipo==='CAMION'?'Camión':'Tracto');tipoSel.add(o)});
 if([...tipoSel.options].some(o=>o.value===current))tipoSel.value=current;
 document.getElementById('estadoDirectorio').textContent='Directorios actualizados.';
 }catch(e){console.error(e);document.getElementById('estadoDirectorio').textContent='Sin conexión: comprueba internet para actualizar los datos.'}
}
window.tutransRefreshCatalogs=refresh;
document.getElementById('unidadAsignada').addEventListener('change',e=>{
 const [tipo,placa]=e.target.value.split('|');if(!tipo)return;
 document.getElementById('vehiculo').value=tipo;syncVehicle();
 document.getElementById(tipo==='CAMION'?'camion':'tracto').value=placa;render();
});
refresh();setInterval(refresh,30000);window.addEventListener('focus',refresh);
})();