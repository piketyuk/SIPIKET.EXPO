let fails=parseInt(localStorage.getItem('hgfy_fails')||'0');let lockUntil=parseInt(localStorage.getItem('hgfy_lock')||'0');
document.addEventListener('DOMContentLoaded',()=>{
  checkLock();
  const syncVisible=()=>{
    const av=document.getElementById('adminPassword'),hv=document.getElementById('gatePass');
    if(av&&hv) hv.value=av.value;
    const cv=document.getElementById('guruCodeInput'),hv2=document.getElementById('codeVal');
    if(cv&&hv2) hv2.value=cv.value;
    const qv=document.getElementById('guruQuota'),hv3=document.getElementById('codeQuota');
    if(qv&&hv3&&qv.value) hv3.value=qv.value;
    const de=document.getElementById('deleteEmailInput'),hv4=document.getElementById('delEmail');
    if(de&&hv4) hv4.value=de.value;
  };
  ['adminPassword','guruCodeInput','guruQuota','deleteEmailInput'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input',syncVisible);
    document.getElementById(id)?.addEventListener('change',syncVisible);
  });
  document.getElementById('gateForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    syncVisible();
    if(Date.now()<lockUntil){toast('Terkunci','error');return;}
    const v=(document.getElementById('gatePass')?.value||document.getElementById('adminPassword')?.value||'');
    if(v==='rachmatullah'){
      localStorage.removeItem('hgfy_fails');localStorage.removeItem('hgfy_lock');
      const g=document.getElementById('gate'),pg=document.getElementById('passwordGate'),dash=document.getElementById('dash'),panel=document.getElementById('adminPanel');
      if(g) g.style.display='none'; if(pg) pg.hidden=true; if(dash) dash.style.display='block'; if(panel) panel.hidden=false;
      document.getElementById('passwordGate').style.display='none';document.getElementById('adminPanel').hidden=false;document.getElementById('dash').style.display='block';loadCodes();
    } else {
      fails++;localStorage.setItem('hgfy_fails',fails);
      if(fails>=3){lockUntil=Date.now()+15*60*1000;localStorage.setItem('hgfy_lock',lockUntil);checkLock();}
      toast('Password salah','error');const h=document.getElementById('adminHint');if(h) h.textContent='Password salah';
    }
  });
  document.getElementById('formCode')?.addEventListener('submit',async e=>{
    e.preventDefault();
    syncVisible();
    const code=(document.getElementById('codeVal')?.value||document.getElementById('guruCodeInput')?.value||'').trim(),quota=parseInt(document.getElementById('codeQuota')?.value||document.getElementById('guruQuota')?.value||'0');
    const pwd='rachmatullah';
    if(!code||code.length<3){toast('Kode minimal 3 karakter','error');return;}
    if(!(quota>=1&&quota<=5)){toast('Kuota 1-5','error');return;}
    try{
      const r=await fetch((window.__SIPIKET_API||'/api')+'/hgfy/codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd,code,quota})});
      const j=await r.json(); if(!r.ok) throw new Error(j.detail||'Gagal');
      toast('Kode guru '+j.code+' dibuat','success');const h=document.getElementById('guruCodeHint');if(h) h.textContent='Kode '+j.code+' dibuat';loadCodes();
      document.getElementById('guruCodeInput').value='';document.getElementById('codeVal').value='';document.getElementById('guruQuota').value='';document.getElementById('codeQuota').value='';
    }catch(err){toast(err.message,'error');const h=document.getElementById('guruCodeHint');if(h) h.textContent=err.message;}
  });
  const delHandler=async()=>{
    syncVisible();
    const email=(document.getElementById('delEmail')?.value||document.getElementById('deleteEmailInput')?.value||'').trim();
    if(!email){toast('Masukkan email','error');return;}
    if(!confirm('Hapus akun '+email+'? Benar-benar delete.')) return;
    try{
      const r=await fetch((window.__SIPIKET_API||'/api')+'/hgfy/account',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'rachmatullah',email})});
      const j=await r.json();if(!r.ok) throw new Error(j.detail||'Gagal');
      toast('Akun dihapus','success');const h=document.getElementById('deleteAccountHint');if(h) h.textContent='Akun '+email+' dihapus';
    }catch(err){toast(err.message,'error');const h=document.getElementById('deleteAccountHint');if(h) h.textContent=err.message;}
  };
  document.getElementById('btnDel')?.addEventListener('click',delHandler);
  document.getElementById('deleteAccountBtn')?.addEventListener('click',delHandler);
  document.getElementById('btnOut')?.addEventListener('click',()=>{document.getElementById('dash').style.display='none';document.getElementById('adminPanel').hidden=true;document.getElementById('passwordGate').hidden=false;document.getElementById('passwordGate').style.display='grid';document.getElementById('gate').style.display='block';});
});
function checkLock(){
  const lm=document.getElementById('lockMsg'),lt=document.getElementById('lockT');
  if(Date.now()<lockUntil){
    if(lm) lm.hidden=false; if(lm) lm.style.display='block';
    const iv=setInterval(()=>{
      const rem=Math.ceil((lockUntil-Date.now())/60000);
      if(lt) lt.textContent=rem;
      if(Date.now()>=lockUntil){clearInterval(iv);if(lm) lm.hidden=true; if(lm) lm.style.display='none';}
    },1000);
  } else { if(lm) lm.hidden=true; }
}
function toast(m,t='info'){const el=document.getElementById('toast');if(!el) return;el.textContent=m;el.className='toast '+t;el.style.display='block';setTimeout(()=>el.style.display='none',3000);}
async function loadCodes(){
  const tbody=document.querySelector('#codeTable tbody');
  const list=document.getElementById('guruCodesList');
  const tbl=document.getElementById('codeTable');
  try{
    const r=await fetch((window.__SIPIKET_API||'/api')+'/hgfy/codes?password=rachmatullah');
    const j=await r.json(); if(!r.ok) throw new Error(j.detail);
    if(!j.codes||!j.codes.length){
      if(tbody) tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--muted);">Belum ada kode</td></tr>';
      if(list) list.innerHTML='<p style="text-align:center;font-size:0.82rem;color:rgba(155,161,170,0.9)">Belum ada kode guru</p>';
      if(tbl) tbl.style.display='none';
      return;
    }
    if(tbl) tbl.style.display='table';
    if(tbody) tbody.innerHTML=j.codes.map(c=>`<tr><td>${c.code}</td><td>${c.quota}</td><td>${c.used}</td><td>${c.remaining}</td><td style="font-size:0.78rem;color:var(--muted);">${(c.emails||[]).join(', ')||'-'}</td></tr>`).join('');
    if(list) list.innerHTML=j.codes.map(c=>`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 12px"><div><strong style="color:#fff">${c.code}</strong><div style="font-size:0.76rem;color:rgba(155,161,170,0.9)">kuota ${c.quota} • terpakai ${c.used} • sisa ${c.remaining}</div><div style="font-size:0.72rem;color:rgba(155,161,170,0.7);word-break:break-all">${(c.emails||[]).join(', ')||'belum ada pengguna'}</div></div></div>`).join('');
  }catch(e){
    if(tbody) tbody.innerHTML='<tr><td colspan="5">Gagal memuat</td></tr>';
    if(list) list.innerHTML='<p style="text-align:center;font-size:0.82rem;color:#ff6b6b">Gagal memuat kode</p>';
  }
}
