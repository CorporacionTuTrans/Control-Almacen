(() => {
const ROOT='https://xpbmvtainyjgsrwzwylm.supabase.co';
const KEY='sb_publishable_LYiN60ZEBQbEPlXcBLtKrA_Tjdw6oJY';
let token='',refresh='',admin=false;
const $=id=>document.getElementById(id);
const state=t=>$('adminStatus').textContent=t;
async function call(action,params={}){
 const r=await fetch(ROOT+'/functions/v1/almacen-admin',{method:'POST',headers:{'apikey':KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action,...params})});
 const j=await r.json();if(!r.ok)throw Error(j.error||'Error del servidor');return j;
}
async function login(e){
 e.preventDefault();state('Verificando credenciales...');
 const username=$('adminUser').value.trim().toLowerCase();
 if(!/^[a-z0-9._-]{3,40}$/.test(username)){state('Usuario inválido');return}
 try{
 const r=await fetch(ROOT+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:username+'@admin.tutrans.invalid',password:$('adminPass').value})});
 const data=await r.json();if(!r.ok)throw Error('Usuario o contraseña incorrectos');
 token=data.access_token;refresh=data.refresh_token;await call('check');admin=true;
 $('adminLogin').hidden=true;$('adminManager').hidden=false;$('adminPass').value='';state('Administrador conectado');await load();
 }catch(e){token='';refresh='';admin=false;state(e.message)}
}
async function renew(){
 if(!refresh)return;
 const r=await fetch(ROOT+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})});
 if(!r.ok){logout();return}const d=await r.json();token=d.access_token;refresh=d.refresh_token;
}
function logout(){token='';refresh='';admin=false;$('adminManager').hidden=true;$('adminLogin').hidden=false;state('Sesión cerrada')}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rows=[];
async function load(){
 if(!admin)return;
 try{
 const table=$('adminTable').value;rows=(await call('list',{table})).rows;state('Registros encontrados: '+rows.length+'. Selecciona Editar o Eliminar, o usa Agregar.');
 $('adminRows').innerHTML=rows.map(r=>'<div style="display:flex;gap:7px;align-items:center;justify-content:space-between;border-bottom:1px solid #ddd;padding:7px 0"><span>'+escape(r.nombre||r.placa)+' '+(r.tipo?'('+escape(r.tipo)+')':'')+(r.activo?'':' [Inactivo]')+'</span><span><button type="button" class="mini" data-edit="'+r.id+'">Editar</button> <button type="button" class="mini" data-toggle="'+r.id+'">'+(r.activo?'Eliminar':'Restaurar')+'</button></span></div>').join('');
 }catch(e){state(e.message)}
}
async function save(){
 const table=$('adminTable').value,id=$('adminId').value;
 const params={table,...(table==='vehiculos'?{placa:$('adminName').value,tipo:$('adminType').value}:{nombre:$('adminName').value})};
 if(id)params.id=Number(id);
 try{await call('save',params);$('adminId').value='';$('adminName').value='';state('Registro '+(id?'editado':'agregado')+' correctamente en Supabase');await load();await window.tutransRefreshCatalogs?.()}catch(e){state(e.message)}
}
$('adminLogin').addEventListener('submit',login);
$('adminLogout').addEventListener('click',logout);
$('adminTable').addEventListener('change',()=>{$('adminId').value='';$('adminName').value='';$('adminTypeWrap').hidden=$('adminTable').value!=='vehiculos';load()});
$('adminSave').addEventListener('click',save);
$('adminRows').addEventListener('click',async e=>{
 const edit=e.target.closest('[data-edit]'),toggle=e.target.closest('[data-toggle]');
 if(edit){const r=rows.find(x=>x.id===Number(edit.dataset.edit));if(!r)return;$('adminId').value=r.id;$('adminName').value=r.nombre||r.placa;if(r.tipo)$('adminType').value=r.tipo;return}
 if(toggle){const r=rows.find(x=>x.id===Number(toggle.dataset.toggle));if(!r||!confirm((r.activo?'Eliminar':'Restaurar')+' este registro del directorio compartido? '+(r.activo?'Se ocultará para todos los conductores, pero podrá restaurarse.':'')))return;
 try{await call('toggle',{table:$('adminTable').value,id:r.id,activo:!r.activo});await load();await window.tutransRefreshCatalogs?.()}catch(err){state(err.message)}}
});
setInterval(async()=>{if(admin)await renew()},45*60*1000);
})();