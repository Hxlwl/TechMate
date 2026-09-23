(() => {
const U=window.TECHMATE_SUPABASE_URL,K=window.TECHMATE_SUPABASE_KEY,H={apikey:K,Authorization:`Bearer ${K}`,'Content-Type':'application/json'};
const EDIT=false, grid=document.getElementById('memberGrid');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function api(path,opt={}){const r=await fetch(U+'/rest/v1/'+path,{...opt,headers:{...H,...(opt.headers||{})}});const t=await r.text();if(!r.ok)throw Error(t);return t?JSON.parse(t):[]}
async function get(){return api('techmate_players?select=*&order=name.asc')}
function render(ps){grid.innerHTML=ps.length?ps.map(p=>`<article class="club-card">${p.photo?`<img class="club-photo" src="${p.photo}" alt="${esc(p.name)}">`:`<div class="club-placeholder">${esc((p.name||'?')[0].toUpperCase())}</div>`}<h3>${esc(p.name)}</h3><p>${esc(p.level||'Member')}</p>${EDIT?`<div class="card-actions"><button class="small-btn edit-member" data-id="${p.id}">Edit</button><button class="small-btn delete-member" data-id="${p.id}">Delete</button></div>`:''}</article>`).join(''):'<div class="empty">No club members yet.</div>';
 if(EDIT) bind(ps);
}
async function load(){try{render(await get())}catch(e){grid.innerHTML=`<div class="empty">${esc(e.message)}<br><br>Run the latest SETUP_SQL.sql in Supabase.</div>`}}
function resizeImage(file){return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{const max=500,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.82))};img.onerror=reject;img.src=rd.result};rd.onerror=reject;rd.readAsDataURL(file)})}
function bind(ps){
 document.querySelectorAll('.edit-member').forEach(b=>b.onclick=()=>{const p=ps.find(x=>String(x.id)===b.dataset.id);document.getElementById('memberId').value=p.id;document.getElementById('memberName').value=p.name;document.getElementById('memberLevel').value=p.level||'Member';window._oldPhoto=p.photo||'';const im=document.getElementById('photoPreview');im.src=p.photo||'';im.hidden=!p.photo;document.getElementById('memberStatus').textContent='Editing '+p.name;window.scrollTo({top:0,behavior:'smooth'})});
 document.querySelectorAll('.delete-member').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this member? If they have match records, delete those matches first.'))return;try{const p=ps.find(x=>String(x.id)===b.dataset.id);await api(`techmate_players?id=eq.${b.dataset.id}`,{method:'DELETE'});await load()}catch(e){alert(e.message)}});
}
if(EDIT){
 const form=document.getElementById('memberForm'),file=document.getElementById('memberPhoto'),preview=document.getElementById('photoPreview'),status=document.getElementById('memberStatus');
 file.onchange=async()=>{if(file.files[0]){preview.src=await resizeImage(file.files[0]);preview.hidden=false}};
 document.getElementById('removePhoto').onclick=()=>{preview.src='';preview.hidden=true;file.value='';window._removePhoto=true};
 document.getElementById('cancelMember').onclick=()=>{form.reset();document.getElementById('memberId').value='';preview.hidden=true;status.textContent='';window._removePhoto=false};
 form.onsubmit=async e=>{e.preventDefault();const id=document.getElementById('memberId').value,name=document.getElementById('memberName').value.trim(),level=document.getElementById('memberLevel').value.trim()||'Member';if(!name){status.textContent='Enter a name.';return}status.textContent='Saving...';try{let photo=window._removePhoto?'':window._oldPhoto||'';if(file.files[0])photo=await resizeImage(file.files[0]);if(id){await api(`techmate_players?id=eq.${id}`,{method:'PATCH',body:JSON.stringify({name,level,photo})});}else{await api('techmate_players',{method:'POST',body:JSON.stringify({name,level,photo})});}status.textContent='Saved!';form.reset();document.getElementById('memberId').value='';preview.hidden=true;window._oldPhoto='';window._removePhoto=false;await load()}catch(e){status.textContent=e.message}};
}
load();setInterval(load,3000);
})();