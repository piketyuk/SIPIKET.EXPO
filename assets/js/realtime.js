function rtSubscribe(table, filter, cb){
 if(typeof supa==="undefined"||!supa) return null;
 return supa.channel(`${table}:${filter||"all"}:${Date.now()}`).on("postgres_changes",{event:"*",schema:"public",table,filter},cb).subscribe();
}
function enableRealtime(classCode){
 if(!classCode||classCode==="—") return;
 rtSubscribe("tasks",`class_code=eq.${classCode}`,(p)=>{
   const st=document.getElementById("taskStatus")||document.getElementById("videoStatus");
   if(st){ st.textContent=`🔄 Baru: ${p.eventType} tasks — ${new Date().toLocaleTimeString("id-ID")}`; st.style.color="var(--orange)"; setTimeout(()=>st.textContent="",3000); }
   if(p.eventType==="INSERT" && p.new){
     const g=document.getElementById("guruGrid")||document.getElementById("reguGrid");
     if(g) g.insertAdjacentHTML("afterbegin", `<article class="card reveal in"><div class="icon">🔄</div><h3>${p.new.title_enc?.slice(0,30)||"Tugas baru"}</h3><p>Realtime</p><span class="badge">Live</span></article>`);
   }
 });
 rtSubscribe("videos",`class_code=eq.${classCode}`,(p)=>{
   const st=document.getElementById("videoStatus");
   if(st && p.eventType==="INSERT"){ st.textContent="🎥 Video baru masuk — realtime"; st.style.color="var(--orange)"; }
 });
 rtSubscribe("classes",`code=eq.${classCode}`,()=>{});
 console.log("[realtime] on", classCode);
}
document.addEventListener("DOMContentLoaded", ()=>{
 const code=sessionStorage.getItem("sipiket_classCode");
 if(code) setTimeout(()=>enableRealtime(code), 900);
});
