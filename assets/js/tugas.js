function toast(m,t='info'){const el=document.getElementById('toast');el.textContent=m;el.className='toast '+t;el.style.display='block';setTimeout(()=>el.style.display='none',3000);}
async function api(p,o={}){const h={'Content-Type':'application/json'};const tok=localStorage.getItem('access_token');if(tok)h.Authorization='Bearer '+tok;const r=await fetch((window.__SIPIKET_API||'/api')+p,{...o,headers:{...h,...(o.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok) throw new Error(j.detail||'Gagal');return j;}
let individualDone=0,kelompokDone=0,totalIndividual=0,totalKelompok=0;
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',e=>{
    const tab=e.currentTarget.dataset.tab;
    document.getElementById('tabIndividual').style.display=tab==='individual'?'block':'none';
    document.getElementById('tabKelompok').style.display=tab==='kelompok'?'block':'none';
    document.getElementById('tabIndividualBtn').className=tab==='individual'?'btn-primary':'btn-login';
    document.getElementById('tabKelompokBtn').className=tab==='kelompok'?'btn-primary':'btn-login';
  }));
  const ham=document.getElementById('hamburger'),drawer=document.getElementById('drawer'),overlay=document.getElementById('overlay'),close=document.getElementById('closeDrawer');
  ham?.addEventListener('click',()=>{drawer.hidden=false;overlay.hidden=false});close?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});overlay?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});
  document.getElementById('dropBtn')?.addEventListener('click',()=>{const m=document.getElementById('dropMenu');m.hidden=!m.hidden});
  document.querySelectorAll('#dropMenu button').forEach(b=>b.addEventListener('click',e=>{
    const tab=e.currentTarget.dataset.tab;document.getElementById('tabIndividual').style.display=tab==='individual'?'block':'none';document.getElementById('tabKelompok').style.display=tab==='kelompok'?'block':'none';document.getElementById('dropMenu').hidden=true;
  }));
  loadTasks();
  loadAudit();
  document.getElementById('toKelompokBtn')?.addEventListener('click',()=>{document.getElementById('tabIndividual').style.display='none';document.getElementById('tabKelompok').style.display='block';});
  document.getElementById('toBersamaBtn')?.addEventListener('click',()=>{document.getElementById('bersamaSection').style.display='block';document.getElementById('bersamaSection').scrollIntoView({behavior:'smooth'});});
  document.getElementById('btnAmbilBersama')?.addEventListener('click',startBersama);
});
async function loadTasks(){
  const params=new URLSearchParams(location.search);const code=params.get('code')||localStorage.getItem('sipiket_classCode')||'';
  if(!code){toast('Kode kelas tidak ditemukan','error');return;}
  try{
    const j=await api('/tasks/'+code);
    const ind=document.getElementById('individualGrid'),kel=document.getElementById('kelompokGrid');
    if(!j.tasks.length){document.getElementById('individualEmpty').style.display='block';document.getElementById('kelompokEmpty').style.display='block';return;}
    // Split: half individual, half kelompok for demo (spec says individual first then kelompok)
    const half=Math.ceil(j.tasks.length/2);
    const indTasks=j.tasks.slice(0,half),kelTasks=j.tasks.slice(half);
    totalIndividual=indTasks.length;totalKelompok=kelTasks.length;
    ind.innerHTML=indTasks.map(t=>`<div class="card" style="padding:12px;"><div style="display:flex;gap:8px;align-items:center;"><img src="/assets/img/favicon.svg" width="32" height="32" style="border-radius:50%"><div><strong>${t.title}</strong><br><small style="color:var(--text-muted);">${t.description||''}</small></div></div><div style="display:flex;gap:8px;margin-top:8px;"><button onclick="recordVideo('${t.id}','${code}')" class="btn-primary">Ambil Video</button><button onclick="markDone(this,'individual')" class="btn-login">Selesai</button></div></div>`).join('');
    kel.innerHTML=kelTasks.map(t=>`<div class="card" style="padding:12px;"><div style="display:flex;gap:8px;align-items:center;"><img src="/assets/img/favicon.svg" width="32" height="32" style="border-radius:50%"><div><strong>${t.title}</strong> (2 siswa/tugas)<br><small style="color:var(--text-muted);">${t.description||''}</small></div></div><div style="display:flex;gap:8px;margin-top:8px;"><button onclick="recordVideo('${t.id}','${code}')" class="btn-primary">Ambil Video</button><button onclick="markDone(this,'kelompok')" class="btn-login">Selesai</button></div></div>`).join('');
    if(kelTasks.length===0) document.getElementById('kelompokEmpty').style.display='block';
  }catch(e){toast(e.message,'error')}
}
function markDone(btn,type){
  btn.textContent='✓ Selesai';btn.style.background='var(--success)';btn.style.color='#fff';
  if(type==='individual'){individualDone++;if(individualDone>=totalIndividual) document.getElementById('toKelompokBtn').style.display='inline-flex';}
  else {kelompokDone++;if(kelompokDone>=2 && kelompokDone>=totalKelompok) document.getElementById('toBersamaBtn').style.display='inline-flex';}
}
async function recordVideo(taskId,code){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    const rec=new MediaRecorder(stream,{mimeType:'video/webm'});
    const chunks=[];
    rec.ondataavailable=e=>chunks.push(e.data);
    rec.onstop=async()=>{
      const blob=new Blob(chunks,{type:'video/webm'});
      if(blob.size>50*1024*1024){toast('File terlalu besar','error');return;}
      // check duration via blob
      const fd=new FormData();fd.append('file',blob,'piket.webm');
      try{
        const tok=localStorage.getItem('access_token');
        const r=await fetch((window.__SIPIKET_API||'/api')+'/videos/upload?class_code='+encodeURIComponent(code)+'&task_id='+encodeURIComponent(taskId)+'&duration_seconds=10',{method:'POST',headers:{Authorization:'Bearer '+tok},body:fd});
        const j=await r.json();if(!r.ok) throw new Error(j.detail||'Gagal upload');toast('Video terupload','success');
      }catch(err){toast(err.message,'error')}
      stream.getTracks().forEach(t=>t.stop());
    };
    rec.start();
    toast('Merekam... maks 15 detik','info');
    setTimeout(()=>{if(rec.state==='recording') rec.stop();},10000);
    // Allow manual stop after 3 sec
    setTimeout(()=>{if(confirm('Berhenti rekam?')) rec.stop();},3000);
  }catch(err){toast('Kamera tidak tersedia: '+err.message,'error')}
}
async function loadAudit(){
  const params=new URLSearchParams(location.search);const code=params.get('code')||localStorage.getItem('sipiket_classCode')||'';
  if(!code) return;
  try{
    const j=await api('/classes/'+code+'/students');
    const el=document.getElementById('auditList');
    el.innerHTML=j.students.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border);border-radius:8px;"><span>${s.name||s.email} <small style="color:var(--text-muted);">${s.email}</small></span><span style="display:flex;gap:6px;align-items:center;"><button onclick="doReport('${s.email}','coret')" class="btn-login">Coret</button><button onclick="doReport('${s.email}','laporkan')" class="btn-login" style="color:var(--danger);">Laporkan</button><input id="note-${s.email}" placeholder="Catatan" style="width:120px;"></span></div>`).join('');
  }catch{}
}
async function doReport(email,context){
  const note=document.getElementById('note-'+email).value;
  const code=new URLSearchParams(location.search).get('code')||localStorage.getItem('sipiket_classCode')||'';
  try{await api('/reports/',{method:'POST',body:JSON.stringify({class_code:code,reported_email:email,context,notes:note})});toast('Laporan dikirim','success')}catch(err){toast(err.message,'error')}
}
let bersamaStream=null, bersamaRecorder=null;
async function startBersama(){
  try{
    bersamaStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    const v=document.getElementById('previewBersama');v.srcObject=bersamaStream;v.style.display='block';
    bersamaRecorder=new MediaRecorder(bersamaStream,{mimeType:'video/webm'});const chunks=[];
    bersamaRecorder.ondataavailable=e=>chunks.push(e.data);
    bersamaRecorder.onstop=async()=>{
      const blob=new Blob(chunks,{type:'video/webm'});
      const fd=new FormData();fd.append('file',blob,'bersama.webm');
      const code=new URLSearchParams(location.search).get('code')||localStorage.getItem('sipiket_classCode')||'';
      try{
        const tok=localStorage.getItem('access_token');
        const r=await fetch((window.__SIPIKET_API||'/api')+'/videos/upload?class_code='+encodeURIComponent(code)+'&duration_seconds=10',{method:'POST',headers:{Authorization:'Bearer '+tok},body:fd});
        const j=await r.json();if(!r.ok) throw new Error(j.detail);toast('Video bersama terupload','success');document.getElementById('btnSelesaiBersama').style.display='inline-flex';
      }catch(err){toast(err.message,'error')}
    };
    bersamaRecorder.start();
    document.getElementById('btnAmbilBersama').style.display='none';
    document.getElementById('btnSelesaiBersama').style.display='inline-flex';
    document.getElementById('bersamaStatus').textContent='Merekam...';
    setTimeout(()=>{if(bersamaRecorder.state==='recording') bersamaRecorder.stop();},15000);
  }catch(err){toast(err.message,'error')}
}
document.getElementById('btnSelesaiBersama')?.addEventListener('click',()=>{
  if(bersamaRecorder && bersamaRecorder.state==='recording') bersamaRecorder.stop();
  if(bersamaStream) bersamaStream.getTracks().forEach(t=>t.stop());
  document.getElementById('bersamaStatus').textContent='Video selesai. Piket tuntas.';
});
