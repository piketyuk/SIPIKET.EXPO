function toast(m,t='info'){const el=document.getElementById('toast');el.textContent=m;el.className='toast '+t;el.style.display='block';setTimeout(()=>el.style.display='none',3000);}
async function api(path,opts={}){const h={'Content-Type':'application/json'};const tok=localStorage.getItem('access_token');if(tok)h.Authorization='Bearer '+tok;const r=await fetch((window.__SIPIKET_API||'/api')+path,{...opts,headers:{...h,...(opts.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok) throw new Error(j.detail||j.error||'Gagal');return j;}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.toggle-password').forEach(b=>b.addEventListener('click',()=>{const inp=b.previousElementSibling;inp.type=inp.type==='password'?'text':'password'}));
  loadMe();
  document.getElementById('avatarFile')?.addEventListener('change',uploadAvatar);
  document.getElementById('btnSaveNickname')?.addEventListener('click',saveNick);
  document.getElementById('btnUpdatePassword')?.addEventListener('click',updatePass);
  document.getElementById('btnDeleteAccount')?.addEventListener('click',delAccount);
  document.getElementById('btnLogout')?.addEventListener('click',doLogout);
  const ham=document.getElementById('hamburger'),drawer=document.getElementById('drawer'),overlay=document.getElementById('overlay'),close=document.getElementById('closeDrawer');
  ham?.addEventListener('click',()=>{drawer.hidden=false;overlay.hidden=false});close?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});overlay?.addEventListener('click',()=>{drawer.hidden=true;overlay.hidden=true});
});
async function loadMe(){try{const j=await api('/users/me');document.getElementById('email').value=j.email;document.getElementById('nickname').value=j.nickname||'';if(j.avatar_url)document.getElementById('avatarPreview').src=j.avatar_url;}catch{location.href='login.html'}}
async function uploadAvatar(e){
  const f=e.target.files[0];if(!f) return;
  if(f.size>5*1024*1024){toast('Maks 5MB','error');return;}
  const fd=new FormData();fd.append('file',f);
  try{const tok=localStorage.getItem('access_token');const r=await fetch((window.__SIPIKET_API||'/api')+'/users/avatar',{method:'POST',headers:{Authorization:'Bearer '+tok},body:fd});const j=await r.json();if(!r.ok) throw new Error(j.detail||'Gagal');document.getElementById('avatarPreview').src=j.avatar_url;toast('Foto diperbarui','success')}catch(err){toast(err.message,'error')}
}
async function saveNick(){
  const v=document.getElementById('nickname').value.trim();
  try{await api('/users/profile',{method:'PUT',body:JSON.stringify({nickname:v})});toast('Nama panggilan disimpan','success')}catch(err){toast(err.message,'error')}
}
async function updatePass(){
  const oldP=document.getElementById('oldPassword').value,newP=document.getElementById('newPassword').value,conf=document.getElementById('confirmPassword').value;
  if(newP!==conf){toast('Konfirmasi tidak cocok','error');return;}
  try{await api('/users/password',{method:'PUT',body:JSON.stringify({old_password:oldP,new_password:newP})});toast('Password diubah','success')}catch(err){toast(err.message,'error')}
}
async function delAccount(){
  const pw=document.getElementById('deletePassword').value;
  if(!pw){toast('Masukkan password','error');return;}
  const d=document.getElementById('confirmDialog');document.getElementById('confirmTitle').textContent='Hapus Akun?';document.getElementById('confirmMessage').textContent='Semua data (kelas dll) akan terhapus permanen.';
  d.showModal();
  document.getElementById('btnConfirm').onclick=async()=>{d.close();try{await api('/users/account?password='+encodeURIComponent(pw),{method:'DELETE'});localStorage.clear();location.href='index.html';}catch(err){toast(err.message,'error')}};
  document.getElementById('btnCancel').onclick=()=>d.close();
}
async function doLogout(){
  const d=document.getElementById('confirmDialog');document.getElementById('confirmTitle').textContent='Yakin keluar?';document.getElementById('confirmMessage').textContent='Kamu akan keluar dari akun ini.';
  d.showModal();
  document.getElementById('btnConfirm').onclick=()=>{localStorage.clear();location.href='login.html'};
  document.getElementById('btnCancel').onclick=()=>{d.close();location.href='guru-kelas.html'};
}
