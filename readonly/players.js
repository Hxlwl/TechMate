(() => {
const URL = window.TECHMATE_SUPABASE_URL;
const KEY = window.TECHMATE_SUPABASE_KEY;
const PLAYERS_TABLE = 'techmate_players';
const MATCH_TABLE = 'techmate_match_records';
const headers = {apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type':'application/json'};

function ready(){ return URL && KEY && !URL.includes('YOUR_') && !KEY.includes('YOUR_'); }
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

async function request(path, options={}) {
  if(!ready()) throw new Error('Supabase is not configured.');
  const r = await fetch(`${URL}/rest/v1/${path}`, {headers, ...options});
  if(!r.ok) throw new Error(await r.text());
  const text = await r.text();
  return text ? JSON.parse(text) : [];
}

async function getPlayers(){
  return request(`${PLAYERS_TABLE}?select=*&order=name.asc`);
}

async function getMatches(){
  return request(`${MATCH_TABLE}?select=*&order=match_date.desc,created_at.desc`);
}

function calculateLeaderboard(players, matches){
  const key = value => String(value || '').trim().toLowerCase();
  const scores = new Map(players.map(p => [key(p.name), 0]));
  matches.forEach(m => {
    const result = String(m.result || '').trim().toLowerCase();
    if(result === 'player 1 won'){
      const k = key(m.player1);
      if(scores.has(k)) scores.set(k, scores.get(k) + 1);
    }
    if(result === 'player 2 won'){
      const k = key(m.player2);
      if(scores.has(k)) scores.set(k, scores.get(k) + 1);
    }
    // Draw: +0 points for both players.
  });
  return players.map(p => ({...p, score: scores.get(key(p.name)) || 0}))
    .sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
}

async function addPlayer(name, level='Member'){
  const clean = name.trim();
  if(!clean) throw new Error('Please enter a person name.');
  return request(PLAYERS_TABLE, {
    method:'POST',
    headers:{...headers, Prefer:'return=representation'},
    body:JSON.stringify({name:clean, level:level.trim() || 'Member'})
  });
}

async function updatePlayer(id, oldName, name, level){
  const clean = name.trim();
  if(!clean) throw new Error('Please enter a person name.');
  await request(`${PLAYERS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method:'PATCH',
    headers:{...headers, Prefer:'return=minimal'},
    body:JSON.stringify({name:clean, level:level.trim() || 'Member'})
  });
  if(oldName !== clean){
    // Keep historical match records attached to the renamed member.
    await request(`${MATCH_TABLE}?player1=eq.${encodeURIComponent(oldName)}`, {
      method:'PATCH', headers:{...headers, Prefer:'return=minimal'}, body:JSON.stringify({player1:clean})
    });
    await request(`${MATCH_TABLE}?player2=eq.${encodeURIComponent(oldName)}`, {
      method:'PATCH', headers:{...headers, Prefer:'return=minimal'}, body:JSON.stringify({player2:clean})
    });
  }
}

async function deletePlayer(id, name){
  const matches = await request(`${MATCH_TABLE}?or=(player1.eq.${encodeURIComponent(name)},player2.eq.${encodeURIComponent(name)})&select=id&limit=1`);
  if(matches.length) throw new Error('This person has match records. Rename them instead of deleting them, or remove their match records first.');
  await request(`${PLAYERS_TABLE}?id=eq.${encodeURIComponent(id)}`, {method:'DELETE',headers});
}

window.TechMatePlayers = {getPlayers,getMatches,calculateLeaderboard,addPlayer,updatePlayer,deletePlayer,escapeHtml};
})();