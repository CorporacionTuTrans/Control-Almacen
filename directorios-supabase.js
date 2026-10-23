/* Directorios compartidos TUTRANS. No altera cámara, WhatsApp ni borradores. */
(() => {
'use strict';
const BASE='https://xpbmvtainyjgsrwzwylm.supabase.co/rest/v1/';
const KEY='sb_publishable_LYiN60ZEBQbEPlXcBLtKrA_Tjdw6oJY';
const types={nombre:{table:'conductores',key:'tutrans_conductores_v1'},cliente:{table:'comisionistas',key:'tutrans_comisionistas_v1'}};
const status=document.getElementById('estadoDirectorio');
let busy=false;
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ');
async function api(id,method='GET',body=null,query=''){
 const headers={'apikey':KEY,'Content-Type':'application/json'};
 if(method!=='GET')headers.Prefer='return=representation';
 const res=await fetch(BASE+types[id].table+'?'+(query||'select=id,nombre,activo&order=nombre.asc'),{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
 if(!res.ok){const detail=await res.text();throw Error('Supabase '+res.status+': '+detail.slice(0,180))}
 return res.json();
}
async function sync(id){
 const rows=await api(id);
 const names=rows.filter(x=>x.activo).map(x=>x.nombre);
 localStorage.setItem(types[id].key,JSON.stringify(names));
 mostrarNombres(id);
 if(id==='nombre')renderizarDirectorio();
 return names;
}
async function syncAll(){
 if(busy)return;busy=true;
 try{await Promise.all([sync('nombre'),sync('cliente')]);if(status)status.textContent='Directorios sincronizados con Supabase.'}
 catch(e){console.error('Sincronización de directorios:',e);if(status)status.textContent='Sin conexión con el directorio compartido. Se muestran los nombres guardados en este celular.'}
 finally{busy=false}
}
async function add(id,value){
 const nombre=normalize(value);if(nombre.length<2||nombre.length>120){alert('Escribe un nombre de 2 a 120 caracteres.');return false}
 try{
   const rows=await api(id);
   const existing=rows.find(r=>normalize(r.nombre).toLocaleLowerCase('es')===nombre.toLocaleLowerCase('es'));
   if(existing){if(!existing.activo)await api(id,'PATCH',{activo:true},'id=eq.'+existing.id);await sync(id);mostrarNombres(id,existing.nombre);return true}
   await api(id,'POST',{nombre,activo:true},'select=id,nombre,activo');
   await sync(id);mostrarNombres(id,nombre);return true;
 }catch(e){console.error(e);alert('No se pudo guardar en Supabase. Comprueba la conexión y vuelve a intentarlo.');return false}
}
agregarNombre=async function(id){const n=prompt('Escribe el nombre del '+(id==='nombre'?'conductor':'comisionista')+':');if(n&&await add(id,n))document.getElementById(id).dispatchEvent(new Event('change',{bubbles:true}))};
guardarChoferDirectorio=async function(){
 const input=document.getElementById('nuevoChoferDirectorio');
 if(await add('nombre',input.value)){input.value='';if(status)status.textContent='Conductor disponible para todos los celulares.'}
};
eliminarNombre=async function(id){
 const nombre=document.getElementById(id).value;
 if(!nombre){alert('Primero selecciona un nombre.');return}
 if(!confirm('¿Quitar '+nombre+' del directorio compartido de TODOS los celulares?'))return;
 try{const rows=await api(id);const row=rows.find(r=>r.nombre===nombre);if(!row)throw Error('Nombre no encontrado');
 await api(id,'PATCH',{activo:false},'id=eq.'+row.id);await sync(id);mostrarNombres(id,'');
 }catch(e){console.error(e);alert('No se pudo quitar el nombre del directorio compartido.')}
};
document.querySelector('section.panel .hint').textContent='Los conductores guardados estarán disponibles en todos los celulares con este enlace.';
syncAll();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncAll()});
window.addEventListener('focus',syncAll);
setInterval(syncAll,30000);
})();
