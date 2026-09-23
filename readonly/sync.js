(function(){
  const PAGE_ID=document.body.dataset.page||'home';
  const EDIT_MODE=document.body.dataset.editable==='true';
  const TABLE='techmate_pages';
  const URL=window.TECHMATE_SUPABASE_URL, KEY=window.TECHMATE_SUPABASE_KEY;
  const SELECTORS=['main .badge','main h1','main h2','main h3','main p','main .card-kicker','main .number','main .rank','main .player','main .level','main .score','main .section-kicker','main .section-title','main .button','footer span'];
  const elements=()=>[...new Set(SELECTORS.flatMap(s=>[...document.querySelectorAll(s)]))];
  const ready=()=>URL&&KEY&&!URL.includes('YOUR_')&&!KEY.includes('YOUR_');
  function assignKeys(){elements().forEach((el,i)=>{if(!el.dataset.editKey)el.dataset.editKey=`item-${i}`})}
  async function getPage(){if(!ready())return null;const r=await fetch(`${URL}/rest/v1/${TABLE}?page_id=eq.${encodeURIComponent(PAGE_ID)}&select=content&limit=1`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw new Error(await r.text());const rows=await r.json();return rows[0]?.content||null}
  function apply(data){if(!data)return;assignKeys();const content=data.content||data;const styles=data.styles||{};elements().forEach(el=>{const k=el.dataset.editKey;if(Object.prototype.hasOwnProperty.call(content,k)){const v=content[k];el.innerHTML=typeof v==='string'?v:(v.html||'')}if(styles[k])Object.assign(el.style,styles[k])});if(data.pageStyle){Object.assign(document.documentElement.style,data.pageStyle)}}
  async function load(){try{apply(await getPage())}catch(e){console.warn('TechMate cloud load failed:',e)}}
  window.TechMateCloud={
    getElements:elements,assignKeys,load,
    async save(content,styles,pageStyle){if(!ready())throw new Error('Supabase is not configured.');assignKeys();const payload={content,styles,pageStyle,updated_at:new Date().toISOString()};const r=await fetch(`${URL}/rest/v1/${TABLE}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({page_id:PAGE_ID,content:payload,updated_at:payload.updated_at})});if(!r.ok)throw new Error(await r.text())},
    async reset(){if(!ready())return;const r=await fetch(`${URL}/rest/v1/${TABLE}?page_id=eq.${encodeURIComponent(PAGE_ID)}`,{method:'DELETE',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});if(!r.ok)throw new Error(await r.text());location.reload()}
  };
  assignKeys();load();
})();
