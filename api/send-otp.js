export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).end();
  const {email, otp, name}=req.body||{};
  if(!email||!otp) return res.status(400).json({error:"email+otp required"});
  const apiKey=process.env.RESEND_API_KEY, from=process.env.MAIL_FROM||"SIPIKET.EXPO <noreply@sipiket.my.id>";
  if(!apiKey) return res.status(500).json({error:"RESEND_API_KEY missing — ponytail: set di Vercel env"});
  const html=`<div style="font-family:Inter,system-ui;padding:24px;max-width:520px;margin:auto;border:1px solid #d4e7ff;border-radius:16px"><div style="display:flex;align-items:center;gap:10px"><div style="width:44px;height:44px;border-radius:50%;background:#0f5bff;color:#fff;display:grid;place-items:center;font-weight:800">S</div><b>SIPIKET.EXPO</b><span style="margin-left:auto;color:#5a6b8a;font-size:12px">${new Date().toLocaleString("id-ID")}</span></div><h2 style="margin:16px 0 8px">Verifikasi email kamu</h2><p style="color:#5a6b8a">Halo ${name||email}, kode OTP: <b style="font-size:18px;color:#0f5bff">${otp}</b></p><a href="https://sipiket.my.id/otp.html" style="display:inline-block;background:#0f5bff;color:#fff;padding:12px 20px;border-radius:100px;text-decoration:none;font-weight:700;margin-top:12px">Verifikasi Email Sekarang →</a><p style="font-size:12px;color:#5a6b8a;margin-top:14px">Link berlaku 10 menit. Terenkripsi AES-GCM.</p></div>`;
  const r=await fetch("https://api.resend.com/emails",{method:"POST", headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"}, body:JSON.stringify({from, to:email, subject:`SIPIKET OTP ${otp} — verifikasi`, html})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) return res.status(500).json(j);
  res.json({ok:true, id:j.id});
}
