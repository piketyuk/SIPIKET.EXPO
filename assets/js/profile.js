async function api(p,o={}){const h={'Content-Type':'application/json'};const tok=localStorage.getItem('access_token');if(tok)h.Authorization='Bearer '+tok;const r=await fetch((window.__SIPIKET_API||'/api')+p,{...o,headers:{...h,...(o.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok) throw new Error(j.detail||'Gagal');return j;}
document.addEventListener('DOMContentLoaded',()=>{
  const ham=document.getElementById('hamburger'),drawer=document.getElementById('drawer'),overlay=document.getElementById('overlay'),close=document.getElementById('closeDrawer');
  ham?.addEventListener('click',()=>{drawer.hidden=false;overlay.hidden=false});close?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});overlay?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});
  loadProfile();
});
async function loadProfile(){
  const params=new URLSearchParams(location.search);const email=params.get('email');
  let j;
  try{
    j=await api('/users/me');
  }catch{location.href='login.html';return;}
  const av=document.getElementById('profileAvatar'); if(av) av.src=j.avatar_url||'/assets/img/favicon.svg';
  const pn=document.getElementById('profileName'); if(pn) pn.textContent=j.display_name||j.email||'—';
  const nickEl=document.getElementById('profileNick'); if(nickEl){ if(j.nickname){ nickEl.textContent='@'+j.nickname; nickEl.style.display='block'; } else nickEl.style.display='none'; }
  const pr=document.getElementById('profileRole'); if(pr) pr.textContent=j.role==='guru'?'Guru':'Siswa';
  const pe=document.getElementById('profileEmail'); if(pe) pe.textContent=j.email||'—';
  const ie=document.getElementById('infoEmail'); if(ie) ie.textContent=j.email||'—';
  const fn=document.getElementById('infoFullName'); if(fn) fn.textContent=j.display_name||'—';
  const inn=document.getElementById('infoNick'); if(inn) inn.textContent=j.nickname||'—';
  const ir=document.getElementById('infoRole'); if(ir) ir.textContent=j.role||'—';
  const ic=document.getElementById('infoClass'); if(ic) ic.textContent=j.class_code||'—';
  const rg=document.getElementById('infoRegistered'); if(rg) rg.textContent=j.registered_at?new Date(j.registered_at).toLocaleString('id-ID'):'—';
  if(j.role==='guru'){ const ts=document.getElementById('teacherStats'); if(ts) ts.hidden=false; if(ts) ts.style.display='grid'; }
  else {
    const ss=document.getElementById('studentStats'); if(ss) ss.hidden=false; if(ss) ss.style.display='grid';
    if(j.class_code){
      try{
        const me=j;
        let reguName='—',day='—';
        try{
          const regs=await api('/classes/'+j.class_code+'/regu');
          if(Array.isArray(regs)){
            for(const r of regs){
              const members=r.members||r.siswa||[];
              if(members.includes(j.email)||members.includes(j.id)){ reguName=r.name||r.id; day=r.day||'—'; break; }
            }
          } else if(regs.regu){
            for(const r of regs.regu){
              const members=r.members||[];
              if(members.includes(j.email)){ reguName=r.name; day=r.day; break; }
            }
          }
        }catch{}
        try{
          const det=await api('/classes/'+j.class_code);
          if(det && det.regu) {}
        }catch{}
        const rn=document.getElementById('infoRegu'); if(rn) rn.textContent=reguName;
        const dy=document.getElementById('infoDay'); if(dy) dy.textContent=day;
      }catch{}
    }
  }
}
