(() => {
const EDIT = document.body.dataset.editable === 'true';
const URL = window.TECHMATE_SUPABASE_URL, KEY = window.TECHMATE_SUPABASE_KEY;
const TABLE = 'techmate_match_records';
const headers = {apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type':'application/json'};
const list = document.getElementById('recordsList');
const form = document.getElementById('recordForm');
const status = document.getElementById('recordStatus');

function ready(){return URL && KEY && !URL.includes('YOUR_') && !KEY.includes('YOUR_');}
function esc(s=''){return TechMatePlayers.escapeHtml(s);}
async function load(){
  try{
    const rows=await TechMatePlayers.getMatches();
    if(!rows.length){list.innerHTML='<div class="empty-records">No matches yet.</div>';return;}
    list.innerHTML=rows.map(x=>`<div class="record-row" data-id="${x.id}">
      <span class="match-name">${esc(x.match_name)}</span><span class="person">${esc(x.player1)}</span><span class="person">${esc(x.player2)}</span>
      <span class="result">${esc(x.result)}</span><span class="date">${esc(x.match_date||'')}</span>
    </div>`).join('');
  }catch(e){list.innerHTML=`<div class="empty-records">${esc(e.message)}</div>`;}
}
async function populatePlayers(){
  const ps=await TechMatePlayers.getPlayers();
  const options=ps.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
  player1.innerHTML=options; player2.innerHTML=options;
  if(ps.length>1) player2.selectedIndex=1;
  if(!ps.length){status.textContent='Add at least two people before saving a match.';}
}
async function addMatch(){
  const data={match_name:matchName.value.trim(),match_date:matchDate.value||null,player1:player1.value,player2:player2.value,result:matchResult.value,note:matchNote.value.trim()};
  if(!data.match_name || !data.player1 || !data.player2){status.textContent='Please enter the match name and choose both players.';return;}
  if(data.player1===data.player2){status.textContent='Player 1 and Player 2 must be different people.';return;}
  status.textContent='Saving...';
  const r=await fetch(`${URL}/rest/v1/${TABLE}`,{method:'POST',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify(data)});
  if(!r.ok){status.textContent=await r.text();return;}
  form.classList.remove('open'); status.textContent='Match saved. Winner +1, draw +0.'; matchName.value='';matchDate.value='';matchNote.value=''; await load();
}
if(EDIT){
  addMatchButton.onclick=async()=>{form.classList.add('open');document.getElementById('personForm')?.classList.remove('open');try{await populatePlayers();}catch(e){status.textContent=e.message;}};
  addPersonButton.onclick=()=>{document.getElementById('personForm').classList.add('open');form.classList.remove('open');};
  cancelMatch.onclick=()=>form.classList.remove('open');
  saveMatch.onclick=async()=>{try{await addMatch();}catch(e){status.textContent=e.message;}};
  savePerson.onclick=async()=>{
    try{
      personStatus.textContent='Saving...';
      await TechMatePlayers.addPlayer(personName.value,personLevel.value);
      personName.value='';personLevel.value='';personStatus.textContent='Person saved and added to the leaderboard.';
      await populatePlayers(); await load();
    }catch(e){personStatus.textContent=e.message;}
  };
  cancelPerson.onclick=()=>document.getElementById('personForm').classList.remove('open');
}
load();
if(EDIT) populatePlayers().catch(()=>{});
setInterval(load,3000);
})();