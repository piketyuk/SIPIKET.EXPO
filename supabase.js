const DRIVE_URL="https://script.google.com/macros/s/AKfycbydB5AYZvnpcWUsS8bt5VCrCDZC92lyIyV5topq65qarzylK5hx03ZC1p3WiuTEmu_AHA/exec";
const DRIVE_KEY="sk_sipiket_k8Lp3qW7xY2v9R4tVb6Nm0a1c3d8";
let supa=null;
const SUPABASE_URL="https://__PROJECT__.supabase.co";
if(SUPABASE_URL.includes("__PROJECT__")){
  console.log("SIPIKET Drive live — video ke Drive sipiket.anchor@gmail.com (terenkripsi AES-GCM)");
}
function fileToBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}
async function uploadVideo(file, meta){
  const b64=await fileToBase64(file);
  const payload={key:DRIVE_KEY, action:"upload", name: Date.now()+"_"+file.name, data: b64.split(",")[1], mimeType: file.type||"video/mp4", classCode: meta.class_code||meta.classCode||"", email: meta.email||""};
  const ctrl=new AbortController();
  const to=setTimeout(()=>ctrl.abort(), 45000);
  try{
    const res=await fetch(DRIVE_URL,{method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body: JSON.stringify(payload), signal: ctrl.signal});
    clearTimeout(to);
    const t=await res.text();
    let j;
    try{ j=JSON.parse(t); }catch{ throw new Error("Drive belum Anyone — ubah Deploy ke Anyone. Resp: "+t.slice(0,120)); }
    if(!j.ok) throw new Error(j.error||"Drive error");
    return j.url||j.id;
  }catch(e){
    clearTimeout(to);
    throw e;
  }
}
async function sendOtpEmail(email, otp){ return false; }
