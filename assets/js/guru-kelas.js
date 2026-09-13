const API_BASE = (window.__SIPIKET_API||'/api');
function toast(m,t='info'){const el=document.getElementById('toast');if(!el)return;el.textContent=m;el.className='toast '+t;el.style.display='block';setTimeout(()=>el.style.display='none',3000);}
async function api(path,opts={}){const headers={'Content-Type':'application/json',...(opts.headers||{})};const tok=localStorage.getItem('access_token');if(tok)headers.Authorization='Bearer '+tok;const r=await fetch(API_BASE+path,{...opts,headers});const j=await r.json().catch(()=>({}));if(!r.ok) throw new Error(j.detail||j.error||'Gagal');return j;}
document.addEventListener('DOMContentLoaded',()=>{
  const hamburger=document.getElementById('hamburger'),drawer=document.getElementById('drawer'),overlay=document.getElementById('overlay'),closeDrawer=document.getElementById('closeDrawer');
  function openD(){drawer.hidden=false;overlay.hidden=false;hamburger?.setAttribute('aria-expanded','true')}
  function closeD(){drawer.hidden=true;overlay.hidden=true;hamburger?.setAttribute('aria-expanded','false')}
  hamburger?.addEventListener('click',()=>drawer.hidden?openD():closeD());closeDrawer?.addEventListener('click',closeD);overlay?.addEventListener('click',closeD);
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',e=>{
    const tab=e.currentTarget.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(p=>p.style.display='none');
    document.getElementById('tab-'+tab).style.display='block';
    document.querySelectorAll('[data-tab]').forEach(x=>x.classList?.remove('active'));
  }));
  document.getElementById('profileChip')?.addEventListener('click',()=>location.href='profile.html');
  document.getElementById('settingsBtn')?.addEventListener('click',()=>location.href='pengaturan-akun.html');
  loadProfile();loadKelas();
  document.getElementById('btnBuatKelas')?.addEventListener('click',()=>document.getElementById('formBuatKelas').style.display='grid');
  document.getElementById('formBuatKelas')?.addEventListener('submit',async e=>{
    e.preventDefault();
    try{await api('/classes/',{method:'POST',body:JSON.stringify({code:document.getElementById('newClassCode').value,name:document.getElementById('newClassName').value})});toast('Kelas dibuat','success');loadKelas();}catch(err){toast(err.message,'error')}
  });
  document.getElementById('btnCopyCode')?.addEventListener('click',()=>{navigator.clipboard.writeText(document.getElementById('classCode').value);toast('Kode disalin','success')});
  document.getElementById('btnSaveClass')?.addEventListener('click',saveClass);
  document.getElementById('btnSaveRegu')?.addEventListener('click',saveRegu);
  document.getElementById('btnAddTask')?.addEventListener('click',addTaskPrompt);
  document.getElementById('btnRemoveTask')?.addEventListener('click',removeTaskPrompt);
  document.getElementById('btnAddWebhook')?.addEventListener('click',addWebhookPrompt);
  document.getElementById('formNotif')?.addEventListener('submit',sendNotif);
  loadStudents();loadWebhooks();loadTemplates();
});
async function loadProfile(){
  try{const j=await api('/users/me');document.getElementById('profileName').textContent=j.display_name||j.email;document.getElementById('brandName').textContent=j.display_name||'Sipiket';if(j.avatar_url)document.getElementById('profileAvatar').src=j.avatar_url;}catch{}
}
async function loadKelas(){
  try{const token=localStorage.getItem('access_token');if(!token) return;const payload=JSON.parse(atob(token.split('.')[1]));const email=payload.sub;
  // Try get class from enrollment or created class
  const j=await api('/users/me');const code=j.class_code;if(!code){document.getElementById('panelAwal').style.display='block';document.getElementById('panelSettings').style.display='none';return;}
  document.getElementById('panelAwal').style.display='none';document.getElementById('panelSettings').style.display='block';
  const c=await api('/classes/'+code);document.getElementById('classCode').value=c.code;document.getElementById('className').value=c.name;document.getElementById('maxStudents').value=c.max_students;document.getElementById('classTheme').value=c.theme||'dark';
  }catch(e){console.log(e)}
}
async function saveClass(){
  const code=document.getElementById('classCode').value;
  try{await api('/classes/'+code,{method:'PUT',body:JSON.stringify({name:document.getElementById('className').value,max_students:parseInt(document.getElementById('maxStudents').value),theme:document.getElementById('classTheme').value})});toast('Kelas diperbarui','success')}catch(err){toast(err.message,'error')}
}
async function loadStudents(){
  try{const code=document.getElementById('classCode')?.value;if(!code) return;const j=await api('/classes/'+code+'/students');const el=document.getElementById('studentList');if(!j.students||!j.students.length){document.getElementById('studentEmpty').style.display='block';el.innerHTML='';return;}document.getElementById('studentEmpty').style.display='none';el.innerHTML=j.students.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);"><a href="profile.html?email=${encodeURIComponent(s.email)}" style="display:flex;gap:8px;align-items:center;"><img src="${s.avatar||'/assets/img/favicon.svg'}" width="28" height="28" style="border-radius:50%"><span>${s.name||s.email}</span><small style="color:var(--text-muted);">${s.nickname||''}</small></a><span><button onclick="setAliasPrompt('${s.email}')" style="font-size:12px;">Alias</button> <button onclick="kickStudent('${s.email}')" style="color:var(--danger);font-size:12px;">Kick</button></span></div>`).join('');
  // populate regu selects and notif target
  const sel=document.getElementById('notifTarget');if(sel){sel.innerHTML='<option value="">Pilih siswa</option>'+j.students.map(s=>`<option value="${s.email}">${s.name||s.email}</option>`).join('')}
  buildReguForm(j.students)}catch{}
}
function buildReguForm(students){
  const days=['Senin','Selasa','Rabu','Kamis','Jumat'];const c=document.getElementById('reguForm');if(!c) return;c.innerHTML='';
  days.forEach(day=>{
    const col=document.createElement('div');col.innerHTML=`<strong>${day}</strong>`;
    const sel=document.createElement('select');sel.multiple=true;sel.dataset.day=day;sel.style.cssText='width:100%;height:120px;';
    students.forEach(s=>{const o=document.createElement('option');o.value=s.email;o.textContent=s.name||s.email;sel.appendChild(o)});
    col.appendChild(sel);c.appendChild(col);
  });
}
async function saveRegu(){
  const code=document.getElementById('classCode').value;
  const days=['Senin','Selasa','Rabu','Kamis','Jumat'];
  for(const day of days){
    const sel=document.querySelector(`select[data-day="${day}"]`);
    const members=[...sel.selectedOptions].map(o=>o.value);
    if(members.length===0) continue;
    try{await api(`/classes/${code}/regu`,{method:'POST',body:JSON.stringify({day,member_emails:members})});}catch(err){toast(err.message,'error');return;}
  }
  toast('Regu disimpan','success');
  const names=[...document.querySelectorAll('#reguForm select')].flatMap(s=>[...s.selectedOptions].map(o=>o.textContent));
  document.getElementById('notifNames').innerHTML=names.map(n=>`<li>${n}</li>`).join('');
  document.getElementById('notifEditor').style.display='block';
}
async function kickStudent(email){
  const code=document.getElementById('classCode').value;
  if(!confirm(`Yakin kick ${email}?`)) return;
  try{await api(`/classes/${code}/students/${encodeURIComponent(email)}`,{method:'DELETE'});toast('Siswa dikick','success');loadStudents();}catch(err){toast(err.message,'error')}
}
async function setAliasPrompt(email){
  const alias=prompt(`Nama panggilan untuk ${email}:`);
  if(!alias) return;
  const code=document.getElementById('classCode').value;
  try{await api(`/aliases/${code}/alias?siswa_email=${encodeURIComponent(email)}&alias=${encodeURIComponent(alias)}`,{method:'POST'});toast('Alias disimpan','success');loadStudents();}catch(err){toast(err.message,'error')}
}
async function addTaskPrompt(){
  const title=prompt('Judul tugas:');if(!title) return;
  const desc=prompt('Deskripsi/langkah-langkah (opsional):')||'';
  const code=document.getElementById('classCode').value;
  try{await api('/tasks/',{method:'POST',body:JSON.stringify({class_code:code,title,description:desc})});toast('Tugas ditambahkan','success');loadTasks();}catch(err){toast(err.message,'error')}
}
async function removeTaskPrompt(){
  const id=prompt('ID tugas yang akan dihapus (lihat daftar):');if(!id) return;
  if(!confirm('Hapus tugas ini?')) return;
  try{await api('/tasks/'+id,{method:'DELETE'});toast('Tugas dihapus','success');loadTasks();}catch(err){toast(err.message,'error')}
}
async function loadTasks(){
  const code=document.getElementById('classCode')?.value;if(!code) return;
  try{const j=await api('/tasks/'+code);const el=document.getElementById('taskList');el.innerHTML=j.tasks.map(t=>`<div style="padding:8px;border:1px solid var(--border);border-radius:8px;margin:4px 0;"><label><input type="checkbox" value="${t.id}"> ${t.title}</label><small style="color:var(--text-muted);"> ${t.description||''}</small></div>`).join('')||'<p style="color:var(--text-muted);">Belum ada tugas.</p>';const hist=document.getElementById('historyList');hist.innerHTML=j.tasks.map(t=>`<div style="padding:8px;border-bottom:1px solid var(--border);">${t.title} — <small>${new Date(t.created_at).toLocaleString('id-ID')}</small> <button onclick="deleteTask('${t.id}')" style="float:right;color:var(--danger)">Hapus</button></div>`).join('');}catch{}
}
async function deleteTask(id){if(!confirm('Hapus riwayat ini?')) return;try{await api('/tasks/'+id,{method:'DELETE'});toast('Dihapus','success');loadTasks();}catch(err){toast(err.message,'error')}}
async function addWebhookPrompt(){
  const url=prompt('Masukkan URL Group (https://):');if(!url) return;
  const code=document.getElementById('classCode').value;
  try{await api(`/notifications/${code}/webhooks`,{method:'POST',body:JSON.stringify({url})});toast('Webhook ditambahkan','success');loadWebhooks();}catch(err){toast(err.message,'error')}
}
async function loadWebhooks(){
  const code=document.getElementById('classCode')?.value;if(!code) return;
  try{const j=await api(`/notifications/${code}/webhooks`);const el=document.getElementById('webhookList');el.innerHTML=j.webhooks.map(w=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span style="overflow:hidden;text-overflow:ellipsis;">${w.url}</span><button onclick="delWebhook('${w.id}')" style="color:var(--danger)">Hapus</button></div>`).join('')||'<p style="color:var(--text-muted);">Belum ada webhook.</p>';}catch{document.getElementById('webhookList').innerHTML='<p style="color:var(--text-muted);">Belum ada webhook.</p>'}
}
async function delWebhook(id){
  const code=document.getElementById('classCode').value;
  try{await api(`/notifications/${code}/webhooks/${id}`,{method:'DELETE'});toast('Webhook dihapus','success');loadWebhooks();}catch(err){toast(err.message,'error')}
}
async function loadTemplates(){
  const code=document.getElementById('classCode')?.value;if(!code) return;
  try{const j=await api(`/notifications/${code}/templates`);const sel=document.getElementById('notifTemplate');if(sel)sel.innerHTML='<option value="">— Pilih template —</option>'+j.templates.map(t=>`<option value="${t.id}">${t.context}: ${t.message.slice(0,40)}</option>`).join('');}catch{}
}
async function sendNotif(e){
  e.preventDefault();
  const code=document.getElementById('classCode').value;
  const context=document.getElementById('notifContext').value;
  const target=document.getElementById('notifTarget').value;
  const message=document.getElementById('notifMessage').value;
  const tpl=document.getElementById('notifTemplate').value;
  try{const j=await api(`/notifications/${code}/notify`,{method:'POST',body:JSON.stringify({context,target_email:target,message,use_template:tpl||null})});toast(j.message,'success');}catch(err){toast(err.message,'error')}
}
