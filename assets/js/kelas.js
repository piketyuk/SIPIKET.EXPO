function toast(m,t='info'){const el=document.getElementById('toast');el.textContent=m;el.className='toast '+t;el.style.display='block';setTimeout(()=>el.style.display='none',2500);}
async function api(p,o={}){const h={'Content-Type':'application/json'};const tok=localStorage.getItem('access_token');if(tok)h.Authorization='Bearer '+tok;const r=await fetch((window.__SIPIKET_API||'/api')+p,{...o,headers:{...h,...(o.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok) throw new Error(j.detail||'Gagal');return j;}
document.addEventListener('DOMContentLoaded',()=>{
  const ham=document.getElementById('hamburger'),drawer=document.getElementById('drawer'),overlay=document.getElementById('overlay'),close=document.getElementById('closeDrawer');
  ham?.addEventListener('click',()=>{drawer.hidden=false;overlay.hidden=false});close?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});overlay?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});
  init();
});
async function init(){
  const token=localStorage.getItem('access_token');
  let role='siswa',code=localStorage.getItem('sipiket_classCode')||'';
  if(token){try{const payload=JSON.parse(atob(token.split('.')[1]));role=payload.role||'siswa';}catch{}}
  // Try get user to know class_code
  try{const me=await api('/users/me');if(me.class_code) code=me.class_code;role=me.role;}catch{}
  // Buka semua akses setelah login: jangan blok by kode
  if(!code && !localStorage.getItem('sipiket_last_email')){
    document.getElementById('previewBox').style.display='block';
    document.getElementById('btnPreview').onclick=async()=>{
      const c=document.getElementById('previewCode').value.trim().toUpperCase();
      if(!c){toast('Masukkan kode','error');return;}
      try{const j=await api('/classes/'+c);localStorage.setItem('sipiket_classCode',c);location.reload();}catch(err){document.getElementById('previewError').textContent=err.message;document.getElementById('previewError').style.display='block';}
    };
  }
  if(role==='guru'){
    document.getElementById('guruKelas').style.display='block';
    document.getElementById('navBrand').textContent='Kelas Guru';
    loadGuru(code);
  } else {
    document.getElementById('siswaKelas').style.display='block';
    const menu=document.getElementById('drawerMenu');if(menu)menu.innerHTML='<li><a href="kelas.html">Kembali ke Kelas</a></li><li><a href="#hariGrid">Lihat Hari Piket</a></li><li><a href="pengaturan-akun.html">Pengaturan Akun</a></li>';
    document.getElementById('btnBack').style.display='inline-flex';
    document.getElementById('btnBack').onclick=()=>location.href='kelas.html';
    loadSiswa(code);
  }
}
async function loadGuru(code){
  if(!code) return;
  try{const c=await api('/classes/'+code);document.getElementById('guruKelasTitle').textContent=c.name;document.getElementById('themeLabel').textContent=c.theme==='biru'?'Biru':'Dark Glassmorphism';
  document.documentElement.setAttribute('data-theme', c.theme==='biru'?'blue':'dark');
  document.getElementById('guruGrid').innerHTML=`<div class="card">Tema: ${c.theme}</div><div class="card">Kuota: ${c.student_count}/${c.max_students}</div>`;}catch{document.getElementById('guruGrid').innerHTML='<p style="color:var(--text-muted);">Gagal memuat.</p>'}
}
async function loadSiswa(code){
  const grid=document.getElementById('hariGrid');
  const days=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  if(!code){grid.innerHTML='<p style="color:var(--text-muted);">Belum ada kelas. Masukkan kode kelas di pengaturan.</p>';return;}
  try{
    try{ const cc=await api('/classes/'+code); document.documentElement.setAttribute('data-theme', cc.theme==='biru'?'blue':'dark'); }catch{}
    const tasks=await api('/tasks/'+code).catch(()=>({tasks:[]}));
    const regs=await Promise.all(days.slice(0,5).map(async d=>{
      try{return await api('/classes/'+code+'/students');}catch{return null}
    }));
    grid.innerHTML=days.map((day,i)=>{
      const canStart = i<5; // only Mon-Fri have piket
      return `<article class="card"><h3>${day}</h3><button onclick="showAnggota('${code}','${day}')" class="btn-secondary" style="margin:6px 0;">Lihat Anggota</button><button onclick="showHistory('${code}')" class="btn-secondary">History Penyelesaian</button>${canStart?`<button onclick="mulaiPiket('${code}','${day}')" class="btn-primary" style="margin-top:8px;">Mulai Piket</button>`:''}</article>`;
    }).join('');
  }catch{grid.innerHTML='<p>Muat gagal</p>'}
}
function showAnggota(code,day){
  api('/classes/'+code+'/students').then(j=>{
    const d=document.getElementById('anggotaDialog');
    document.getElementById('anggotaTitle').textContent='Anggota '+day;
    document.getElementById('anggotaList').innerHTML=j.students.map(s=>`<div><a href="profile.html?email=${encodeURIComponent(s.email)}">${s.name||s.email}</a> <small>${s.nickname||''}</small></div>`).join('')||'Belum ada';
    d.showModal();
  }).catch(e=>toast(e.message,'error'));
}
function showHistory(code){
  api('/videos/'+code+'/history').then(j=>{
    const d=document.getElementById('anggotaDialog');
    document.getElementById('anggotaTitle').textContent='History Penyelesaian';
    document.getElementById('anggotaList').innerHTML=j.history.map(h=>`<div>${h.uploader_name} — ${h.task_title} — ${new Date(h.recorded_at).toLocaleString('id-ID')} ${h.verified?'✓':''}</div>`).join('')||'Belum ada';
    d.showModal();
  });
}
function mulaiPiket(code,day){
  const now=new Date();const h=now.getHours();
  // Demo: allow any hour, toast only info
  if(h<10 || h>=17){toast('Piket ideal 10-17 (demo allow)','info');}
  location.href='tugas.html?code='+encodeURIComponent(code)+'&day='+encodeURIComponent(day);
}
