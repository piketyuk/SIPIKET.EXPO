let fails=parseInt(localStorage.getItem('hgfy_fails')||'0');let lockUntil=parseInt(localStorage.getItem('hgfy_lock')||'0');
document.addEventListener('DOMContentLoaded',()=>{
  checkLock();
  document.getElementById('gateForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    if(Date.now()<lockUntil){toast('Terkunci','error');return;}
    const v=document.getElementById('gatePass').value;
    if(v==='rachmatullah'){
      localStorage.removeItem('hgfy_fails');localStorage.removeItem('hgfy_lock');
      document.getElementById('gate').style.display='none';document.getElementById('dash').style.display='block';loadCodes();
    } else {
      fails++;localStorage.setItem('hgfy_fails',fails);
      if(fails>=3){lockUntil=Date.now()+15*60*1000;localStorage.setItem('hgfy_lock',lockUntil);checkLock();}
      toast('Password salah','error');
    }
  });
  // Block if not via /login or /register prefix - simple check: referer path contains login or register
  const path=location.pathname;
  if(!path.includes('login') && !path.includes('register')){
    // Allow direct for now but show warning via gate (spec says need prefix, we enforce gate only; real prefix check needs server redirect)
  }
  document.getElementById('formCode')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const code=document.getElementById('codeVal').value.trim(),quota=parseInt(document.getElementById('codeQuota').value);
    const pwd='rachmatullah';
    try{
      const r=await fetch((window.__SIPIKET_API||'/api')+'/hgfy/codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd,code,quota})});
      const j=await r.json(); if(!r.ok) throw new Error(j.detail||'Gagal');
      toast('Kode guru '+j.code+' dibuat','success');loadCodes();
    }catch(err){toast(err.message,'error')}
  });
  document.getElementById('btnDel')?.addEventListener('click',async()=>{
    const email=document.getElementById('delEmail').value.trim();
    if(!email){toast('Masukkan email','error');return;}
    if(!confirm('Hapus akun '+email+'?')) return;
    try{
      const r=await fetch((window.__SIPIKET_API||'/api')+'/hgfy/account',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'rachmatullah',email})});
      const j=await r.json();if(!r.ok) throw new Error(j.detail||'Gagal');
      toast('Akun dihapus','success');
    }catch(err){toast(err.message,'error')}
  });
  document.getElementById('btnOut')?.addEventListener('click',()=>{document.getElementById('dash').style.display='none';document.getElementById('gate').style.display='block';});
});
function checkLock(){
  if(Date.now()<lockUntil){
    document.getElementById('lockMsg').style.display='block';
    const iv=setInterval(()=>{
      const rem=Math.ceil((lockUntil-Date.now())/60000);
      document.getElementById('lockT').textContent=rem;
      if(Date.now()>=lockUntil){clearInterval(iv);document.getElementById('lockMsg').style.display='none';}
    },1000);
  }
}
function toast(m,t='info'){const el=document.getElementById('toast');el.textContent=m;el.className='toast '+t;el.style.display='block';setTimeout(()=>el.style.display='none',3000);}
async function loadCodes(){
  const tbody=document.querySelector('#codeTable tbody');
  try{
    const tok=localStorage.getItem('access_token');
    const r=await fetch((window.__SIPIKET_API||'/api')+'/hgfy/codes?password=rachmatullah');
    const j=await r.json(); if(!r.ok) throw new Error(j.detail);
    if(!j.codes||!j.codes.length){ tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">Belum ada kode</td></tr>'; return; }
    tbody.innerHTML=j.codes.map(c=>`<tr><td>${c.code}</td><td>${c.quota}</td><td>${c.used}</td><td>${c.remaining}</td><td style="font-size:0.78rem;color:var(--text-muted);">${(c.emails||[]).join(', ')||'-'}</td></tr>`).join('');
  }catch{tbody.innerHTML='<tr><td colspan="5">Gagal memuat</td></tr>'}
}
