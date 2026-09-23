(() => {
const list = document.getElementById('leaderboardList');
const memberList = document.getElementById('memberList');
const form = document.getElementById('memberForm');
const status = document.getElementById('memberStatus');
const editable = document.body.dataset.editable === 'true';
let players = [];

function renderLeaderboard(rows){
  if(!rows.length){ list.innerHTML='<div class="empty-members">No club members yet. Add a person from the editable page.</div>'; return; }
  list.innerHTML = rows.map((p,i)=>`<div class="player-row">
    <span class="rank">${String(i+1).padStart(2,'0')}</span>
    <span class="player"><span class="avatar">${TechMatePlayers.escapeHtml((p.name||'?').charAt(0).toUpperCase())}</span>${TechMatePlayers.escapeHtml(p.name)}</span>
    <span class="level">${TechMatePlayers.escapeHtml(p.level || 'Member')}</span>
    <span class="score">${p.score}</span>
  </div>`).join('');
}
function renderMembers(rows){
  if(!memberList) return;
  if(!rows.length){memberList.innerHTML='<div class="empty-members">No people saved.</div>';return;}
  memberList.innerHTML=rows.map(p=>`<div class="member-item">
    <span class="member-name">${TechMatePlayers.escapeHtml(p.name)}</span>
    <span class="member-level">${TechMatePlayers.escapeHtml(p.level||'Member')}</span>
    <span class="member-actions"><button type="button" data-edit="${p.id}">Edit</button><button type="button" data-delete="${p.id}">Delete</button></span>
  </div>`).join('');
  memberList.querySelectorAll('[data-edit]').forEach(btn=>btn.onclick=()=>startEdit(btn.dataset.edit));
  memberList.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>removeMember(btn.dataset.delete));
}
async function refresh(){
  try{
    const [ps,ms]=await Promise.all([TechMatePlayers.getPlayers(),TechMatePlayers.getMatches()]);
    players=ps;
    const rows=TechMatePlayers.calculateLeaderboard(ps,ms);
    renderLeaderboard(rows);
    renderMembers(ps);
  }catch(e){list.innerHTML=`<div class="empty-members">${TechMatePlayers.escapeHtml(e.message)}</div>`;}
}
function startEdit(id){
  const p=players.find(x=>String(x.id)===String(id)); if(!p) return;
  memberForm.memberId.value=p.id; memberForm.memberOldName.value=p.name; memberForm.memberName.value=p.name; memberForm.memberLevel.value=p.level||'Member'; status.textContent='Editing '+p.name;
  memberForm.scrollIntoView({behavior:'smooth',block:'center'});
}
function clearForm(){memberForm.reset();memberForm.memberId.value='';memberForm.memberOldName.value='';status.textContent='';}
async function removeMember(id){
  const p=players.find(x=>String(x.id)===String(id)); if(!p) return;
  if(!confirm(`Delete ${p.name}?`)) return;
  try{await TechMatePlayers.deletePlayer(p.id,p.name);status.textContent='Person deleted.';await refresh();}catch(e){status.textContent=e.message;}
}
if(editable && form){
  document.getElementById('saveMember').onclick=async()=>{
    try{
      const id=memberId.value;
      if(id) await TechMatePlayers.updatePlayer(id,memberOldName.value,memberName.value,memberLevel.value);
      else await TechMatePlayers.addPlayer(memberName.value,memberLevel.value);
      status.textContent='Saved.';
      clearForm(); await refresh();
    }catch(e){status.textContent=e.message;}
  };
  document.getElementById('cancelMember').onclick=clearForm;
}
refresh();
setInterval(refresh,3000);
})();