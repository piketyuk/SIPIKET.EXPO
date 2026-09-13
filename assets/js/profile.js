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
    if(email){j=await api('/users/me'); // fallback: show own if not found
    // Try fetch specific student via class students? For simplicity show own
    }
    j=await api('/users/me');
  }catch{location.href='login.html';return;}
  document.getElementById('profileAvatar').src=j.avatar_url||'/assets/img/favicon.svg';
  document.getElementById('profileName').textContent=j.display_name;
  document.getElementById('profileRole').textContent=j.role==='guru'?'Guru':'Siswa';
  document.getElementById('profileEmail').textContent=j.email;
  document.getElementById('infoEmail').textContent=j.email;
  document.getElementById('infoFullName').textContent=j.display_name;
  document.getElementById('infoRole').textContent=j.role;
  document.getElementById('infoClass').textContent=j.class_code||'—';
  document.getElementById('infoRegistered').textContent=new Date(j.registered_at).toLocaleString('id-ID');
  if(j.role==='guru') document.getElementById('teacherStats').style.display='block';
  else {
    document.getElementById('studentStats').style.display='block';
    // Load regu info
    if(j.class_code){
      try{
        const regs=await api('/classes/'+j.class_code+'/students');
        // Find which day student is in (need Regu table, for now just show class)
      }catch{}
    }
  }
}
function logout(){localStorage.clear();location.href='login.html'}
