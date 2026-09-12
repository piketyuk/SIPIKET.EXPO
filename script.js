const $ = (s) => document.querySelector(s);
const drawer = $("#drawer"),
  ham = $("#hamburger"),
  ov = $("#overlay"),
  closeD = $("#closeDrawer");
const qm = $("#quickMenu"),
  openM = $("#openMenu"),
  closeQ = $("#closeQm");
function openDrawer() {
  drawer.hidden = false;
  ov.hidden = false;
  ham.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  closeD.focus();
}
function shutDrawer() {
  drawer.hidden = true;
  ov.hidden = true;
  ham.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  ham.focus();
}
ham?.addEventListener("click", () =>
  drawer.hidden ? openDrawer() : shutDrawer(),
);
closeD?.addEventListener("click", shutDrawer);
ov?.addEventListener("click", shutDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !drawer.hidden) shutDrawer();
});
drawer
  ?.querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", shutDrawer));
openM?.addEventListener("click", () => qm.showModal());
closeQ?.addEventListener("click", () => qm.close());
qm?.addEventListener("click", (e) => {
  if (e.target === qm) qm.close();
});
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.14 },
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

async function sha256Hex(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function isTeacherCode(s){return TEACHER_CODE_HASHES.includes(await sha256Hex(s.toLowerCase()));}
const TEACHER_CODE_HASHES = [
  "ee0b1e6ad69be79bbad963014bc6324d4ddfd03f05c4c5c3c4de292b03a089bb",
  "f245c73681ac2149feea5366dc6e4594b01d5c58dc0d299433518ff9c1b72fde",
];
const TEACHER_CODE_LEN = 10;

document.querySelectorAll(".otp-boxes").forEach((g) => {
  if (g.id === "codeGroup") return;
  const boxes = [...g.querySelectorAll(".otp-box")];
  boxes.forEach((b, i) => {
    b.addEventListener("input", () => {
      b.value = b.value.replace(/\D/g, "").slice(-1);
      if (b.value && boxes[i + 1]) boxes[i + 1].focus();
    });
    b.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !b.value && boxes[i - 1])
        boxes[i - 1].focus();
    });
    b.addEventListener("paste", (e) => {
      e.preventDefault();
      const d = (e.clipboardData.getData("text") || "")
        .replace(/\D/g, "")
        .slice(0, boxes.length)
        .split("");
      d.forEach((c, j) => {
        if (boxes[j]) boxes[j].value = c;
      });
      boxes[Math.min(d.length, boxes.length - 1)]?.focus();
    });
  });
});

let classBoxes = [...document.querySelectorAll(".class-code")];
function renderClassInputs(isTeacher) {
  const g = document.getElementById("codeGroup");
  if (!g) return;
  const n = isTeacher ? TEACHER_CODE_LEN : 6;
  g.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const inp = document.createElement("input");
    inp.className = "otp-box class-code";
    inp.type = "text";
    inp.maxLength = 1;
    inp.required = true;
    inp.autocomplete = i === 0 ? "one-time-code" : "off";
    inp.setAttribute(
      "aria-label",
      isTeacher ? "Kode guru digit " + (i + 1) : "Digit " + (i + 1),
    );
    if (isTeacher) {
      inp.inputMode = "text";
      inp.pattern = "[A-Za-z0-9]";
      inp.style.textTransform = "lowercase";
    } else {
      inp.inputMode = "numeric";
      inp.pattern = "[0-9]*";
    }
    g.appendChild(inp);
  }
  classBoxes = [...document.querySelectorAll(".class-code")];
  attachClassHandlers();
}
function attachClassHandlers() {
  classBoxes.forEach((b, i) => {
    b.addEventListener("input", () => {
      if (classVerified) resetClass();
      if (teacherMode)
        b.value = b.value
          .replace(/[^A-Za-z0-9]/g, "")
          .slice(-1)
          .toLowerCase();
      else b.value = b.value.replace(/\D/g, "").slice(-1);
      if (b.value && classBoxes[i + 1]) classBoxes[i + 1].focus();
      // auto-verify off
    });
    b.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !b.value && classBoxes[i - 1])
        classBoxes[i - 1].focus();
    });
    b.addEventListener("paste", (e) => {
      e.preventDefault();
      if (classVerified) resetClass();
      const raw = e.clipboardData.getData("text") || "";
      const d = teacherMode
        ? raw
            .replace(/[^A-Za-z0-9]/g, "")
            .toLowerCase()
            .slice(0, classBoxes.length)
            .split("")
        : raw.replace(/\D/g, "").slice(0, classBoxes.length).split("");
      d.forEach((c, j) => {
        if (classBoxes[j]) classBoxes[j].value = c;
      });
      classBoxes[Math.min(d.length, classBoxes.length - 1)]?.focus();
      // auto-verify off
    });
  });
}
attachClassHandlers();
const otpForm = $("#otpForm"),
  otpStatus = $("#otpStatus"),
  googleBtn = $("#googleBtn"),
  verifyBtn = $("#verifyBtn"),
  termsCheck = $("#termsCheck"),
  termsHint = $("#termsHint"),
  otpSentCard = $("#otpSentCard"),
  otpSentMsg = $("#otpSentMsg");
const teacherToggle = $("#teacherToggle"),
  codeLegend = $("#codeLegend"),
  codeDesc = $("#codeDesc"),
  loginDesc = $("#loginDesc"),
  codeGroup = $("#codeGroup");
const classToggle = null, // removed — exclusive selection
  _classToggle = $("#classToggle"),
  codeFieldset = $("#codeFieldset"),
  classOffHint = $("#classOffHint"),
  accountHint = $("#accountHint"),
  googleStep = $("#googleStep"),
  emailPreviewTo = $("#emailPreviewTo"),
  emailVerifyBtn = $("#emailVerifyBtn"),
  resendEmailBtn = $("#resendEmailBtn"),
  resendStatus = $("#resendStatus"),
  termsLink = $("#termsLink");

let classVerified = false;
let teacherMode = false;
let classEnabled = true;

function encKey(email) {
  return "account_" + email.toLowerCase();
}

async function countSavedAccounts() {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("enc_account_")) n++;
  }
  return n;
}
async function showAccountHint() {
  if (accountHint) accountHint.style.display = "none";
}
showAccountHint();
(function autoRestoreSession() {
  if (!sessionStorage.getItem("sipiket_registered")) {
    const last = localStorage.getItem("sipiket_last_email");
    if (last) {
      const raw = localStorage.getItem("enc_account_" + last.toLowerCase());
      if (raw) {
        try {
          const acc = JSON.parse(atob(JSON.parse(raw).ct ? "" : ""));
        } catch {}
      }
    }
  }
  const last = localStorage.getItem("sipiket_last_email");
  if (last && !sessionStorage.getItem("sipiket_googleEmail")) {
    const enc = localStorage.getItem("enc_account_" + last.toLowerCase());
    if (enc) {
      try {
        const parsed = JSON.parse(enc);
        if (parsed && parsed.ct && typeof secureGet === "function") {
          secureGet("account_" + last.toLowerCase()).then((acc) => {
            if (acc && acc.email) {
              sessionStorage.setItem("sipiket_googleEmail", acc.email);
              sessionStorage.setItem(
                "sipiket_last_account_hint",
                JSON.stringify(acc),
              );
              showAccountHint();
// --- simpan progres login (tidak reset) ---
(function saveProgress(){
  const KEY="sipiket_login_progress";
  function save(){ const data={ classCode: sessionStorage.getItem("sipiket_classCode")||"", teacherMode, classEnabled, terms: !!document.getElementById("termsCheck")?.checked, email: sessionStorage.getItem("sipiket_googleEmail")||"" }; localStorage.setItem(KEY, JSON.stringify(data)); }
  function restore(){ try{ const d=JSON.parse(localStorage.getItem(KEY)||"null"); if(!d) return; if(d.classCode) sessionStorage.setItem("sipiket_classCode", d.classCode); if(typeof d.teacherMode==="boolean") applyTeacherMode(!!d.teacherMode); if(typeof d.classEnabled==="boolean" && !d.classEnabled) updateClassEnabled(false); if(d.terms) { const cb=document.getElementById("termsCheck"); if(cb){ cb.checked=true; }} if(d.email) sessionStorage.setItem("sipiket_googleEmail", d.email); }catch{}
  }
  restore();
  ["change","input"].forEach(ev=> document.addEventListener(ev, save, true));
  setInterval(save, 1200);
})();
            }
          });
        }
      } catch {}
    }
  }
})();

function updateClassEnabled(on) {
  // deprecated wrapper — delegate to exclusive
  if(on) applyTeacherMode(false); else applyTeacherMode(true);
  return;
}
function _updateClassEnabled(on) {
  classEnabled = on;
  if (classToggle) {
    classToggle.setAttribute("aria-checked", String(on));
    classToggle.classList.toggle("is-off", !on);
    classToggle.setAttribute(
      "aria-label",
      on
        ? "Kode kelas aktif"
        : "Kode kelas mati — login tanpa kode (akun lama)",
    );
    classToggle.title = on ? "Kode kelas aktif" : "Kode kelas mati";
  }
  if (codeFieldset) codeFieldset.classList.toggle("is-off", !on);
  classBoxes.forEach(
    (b) => (b.disabled = !on ? true : classVerified ? true : false),
  );
  if (verifyBtn) {
    verifyBtn.style.display = on && !teacherMode ? "" : "none";
    verifyBtn.disabled = !on ? true : classVerified ? true : false;
  }
  if (classOffHint)
    classOffHint.textContent = !on
      ? "Kode kelas dimatikan — langsung centang S&K & Google (akun lama auto ke kelas)."
      : "Matikan kode kelas jika sudah pernah daftar — email akan otomatis ke kelas terkait.";
  updateGoogleVisibility();
  syncGoogle();
}
function updateGoogleVisibility() {
  if (!googleStep) return;
  // exclusive: always require verifikasi, one of the codes
  googleStep.hidden = !classVerified;
  googleStep.style.display = classVerified ? "grid" : "none";
}
function applyTeacherMode(on) {
  // exclusive: guru vs kelas
  classEnabled = !on;
  const ct=document.getElementById('classToggle');
  if(ct){ ct.setAttribute('aria-checked', String(!on)); ct.classList.toggle('is-off', on); ct.title = !on ? 'Kode kelas aktif' : 'Klik untuk kembali ke kode kelas'; }
  const tt=document.getElementById('teacherToggle');
  if(tt){ tt.classList.toggle('is-off', !on); }
  teacherMode = on;
  renderClassInputs(on);
  if (teacherToggle) {
    teacherToggle.setAttribute("aria-checked", String(on));
    teacherToggle.setAttribute(
      "aria-label",
      on
        ? "Kode guru aktif — klik untuk kembali ke kode kelas"
        : "Aktifkan kode guru",
    );
    teacherToggle.title = on ? "Kode guru aktif" : "Kode guru";
  }
  if (classToggle) {
    classToggle.style.display = on ? "none" : "";
    if (on && !classEnabled) updateClassEnabled(true);
  }
  if (codeLegend)
    codeLegend.textContent = on ? "Masukkan Kode Guru" : "Masukkan Kode Kelas";
  if (codeDesc)
    codeDesc.textContent = on
      ? "Bukan kelas — hanya kode untuk guru"
      : "Bukan akun — hanya kode untuk menentukan kelas";
  if (codeGroup)
    codeGroup.setAttribute(
      "aria-label",
      on ? "Kode guru 10 karakter" : "Kode kelas 6 digit",
    );
  if (loginDesc)
    loginDesc.textContent = on
      ? "Kode untuk guru, Google untuk akun. Belum daftar? Otomatis didaftarkan."
      : classEnabled
        ? "Kode kelas untuk masuk kelas, Google untuk akun. Belum terdaftar? Otomatis didaftarkan."
        : "Tanpa kode — Google akan auto ke kelas kamu.";
  sessionStorage.setItem("sipiket_teacherMode", on ? "1" : "0");
  if (!on) sessionStorage.removeItem("sipiket_pendingRole");
  updateGoogleVisibility();
}
teacherToggle?.addEventListener("click", () => {
  if(teacherMode) return;
  applyTeacherMode(true);
  if (classVerified) resetClass();
  verifyBtn.textContent = "Verifikasi Kode →";
  verifyBtn.style.display = "";
  otpStatus.textContent = "Mode kode guru aktif";
  otpStatus.style.color = "var(--muted)";
  classBoxes[0]?.focus();
});
document.getElementById("classToggle")?.addEventListener("click", ()=>{
  if(!teacherMode) return;
  applyTeacherMode(false);
  if(classVerified) resetClass();
  verifyBtn.textContent="Verifikasi Kode →"; verifyBtn.style.display="";
  otpStatus.textContent="Mode kode kelas aktif"; otpStatus.style.color="var(--muted)";
  classBoxes[0]?.focus();
});
teacherToggle?.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    teacherToggle.click();
  }
});


if (sessionStorage.getItem("sipiket_teacherMode") === "1")
  applyTeacherMode(true);
updateClassEnabled(true);
termsLink?.addEventListener("click", (e) => {
  // Allow navigation to syarat-ketentuan.html (real page) — no alert
  // Keep checkbox checked requirement elsewhere
});

function syncGoogle() {
  if (!googleBtn) return;
  const needsCode = teacherMode || classEnabled;
  const ok = (!needsCode || classVerified) && !!termsCheck?.checked;
  googleBtn.disabled = !ok;
  googleBtn.setAttribute("aria-disabled", String(!ok));
  if (needsCode && !classVerified)
    googleBtn.title = teacherMode
      ? "Verifikasi kode guru dulu"
      : "Verifikasi kode kelas dulu";
  else if (!termsCheck.checked)
    googleBtn.title = "Centang Syarat & Ketentuan dulu";
  else googleBtn.title = "Pilih akun Google";
}
function setClassVerified(v) {
  classVerified = v;
  if (v) {
    verifyBtn.style.display = "none";
    verifyBtn.disabled = true;
    classBoxes.forEach((b) => (b.disabled = true));
    otpStatus.textContent = teacherMode
      ? "✓ Kode guru terverifikasi — centang S&K lalu lanjut Google"
      : "✓ Kode kelas terverifikasi — centang S&K lalu lanjut Google";
    otpStatus.style.color = "var(--orange)";
  } else {
    verifyBtn.textContent = "Verifikasi Kode →";
    verifyBtn.style.display = "";
    verifyBtn.disabled = false;
    classBoxes.forEach((b) => (b.disabled = false));
  }
  updateGoogleVisibility();
  syncGoogle();
  if (v) {
    verifyBtn.style.display = "none";
    verifyBtn.disabled = true;
    if (termsCheck) termsCheck.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (googleBtn) googleBtn.scrollIntoView({ behavior: "smooth", block: "center" });
    if (termsCheck?.checked && googleBtn) googleBtn.focus();
  }
}
function resetClass() {
  if (!classVerified) return;
  classVerified = false;
  verifyBtn.textContent = "Verifikasi Kode →";
  verifyBtn.disabled = false;
  classBoxes.forEach((b) => (b.disabled = false));
  otpStatus.textContent = "Kode diubah — verifikasi ulang";
  otpStatus.style.color = "#d93025";
  if (otpSentCard) otpSentCard.hidden = true;
  updateGoogleVisibility();
  syncGoogle();
}
otpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!classEnabled && !teacherMode) {
    setClassVerified(true);
    return;
  }
  if (teacherMode) {
    const code = classBoxes.map((b) => b.value.toLowerCase()).join("");
    if (code.length !== TEACHER_CODE_LEN) {
      otpStatus.textContent =
        "Lengkapi " + TEACHER_CODE_LEN + " karakter kode guru";
      otpStatus.style.color = "#d93025";
      return;
    }
    if (!(await isTeacherCode(code))) {
      otpStatus.textContent = "Kode guru salah — periksa kembali";
      otpStatus.style.color = "#d93025";
      return;
    }
    sessionStorage.setItem("sipiket_classCode", code);
    sessionStorage.setItem("sipiket_pendingRole", "guru");
    setClassVerified(true);
    return;
  }
  const code = classBoxes.map((b) => b.value).join("");
  if (code.length !== 6) {
    otpStatus.textContent = "Lengkapi 6 digit kode kelas";
    otpStatus.style.color = "#d93025";
    return;
  }
  if (/\D/.test(code)) {
    otpStatus.textContent = "Kode hanya angka";
    otpStatus.style.color = "#d93025";
    return;
  }
  sessionStorage.setItem("sipiket_classCode", code);
  sessionStorage.removeItem("sipiket_pendingRole");
  setClassVerified(true);
});
termsCheck?.addEventListener("change", () => {
  termsHint.textContent = termsCheck.checked
    ? ""
    : "Wajib centang Syarat & Ketentuan untuk lanjut";
  syncGoogle();
});

function getGisClientId() {
  const el = document.getElementById("g_id_onload");
  const id = el?.getAttribute("data-client_id") || "";
  return id && !id.includes("__REPLACE") ? id : "";
}
function initGis() {
  const id = getGisClientId();
  if (!id || typeof google === "undefined" || !google.accounts?.id) return;
  try {
    google.accounts.id.initialize({
      client_id: id,
      callback: onGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    const btn = document.querySelector(".g_id_signin");
    if (btn)
      google.accounts.id.renderButton(btn, {
        type: "standard",
        shape: "pill",
        theme: "outline",
        size: "large",
      });
  } catch {}
}
window.addEventListener("load", () => setTimeout(initGis, 600));

async function persistAccount(email, extra) {
  const payload = {
    email,
    classCode:
      extra.classCode || sessionStorage.getItem("sipiket_classCode") || "",
    role: extra.role || (teacherMode ? "guru" : "siswa"),
    displayName: extra.name || "",
    picture: extra.picture || "",
    updatedAt: Date.now(),
  };
  if (typeof secureSet === "function") await secureSet(encKey(email), payload);
  else localStorage.setItem("enc_" + encKey(email), JSON.stringify(payload));
  localStorage.setItem("sipiket_last_email", email);
  sessionStorage.setItem("sipiket_googleEmail", email);
  if (extra.name) sessionStorage.setItem("sipiket_googleName", extra.name);
  if (extra.picture)
    sessionStorage.setItem("sipiket_googlePicture", extra.picture);
}

window.onGoogleCredential = async function (response) {
  try {
    const payload = JSON.parse(
      atob(
        response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
      ),
    );
    const email = payload.email;
    const name = payload.name || "";
    const picture = payload.picture || "";
    if (!email) throw new Error("email missing");
    const _hint2 = sessionStorage.getItem("sipiket_hint_email");
    if(_hint2 && email.toLowerCase() !== _hint2.toLowerCase()){
      otpStatus.textContent = "Pilih akun "+_hint2+" — akun lain tidak diizinkan untuk mode akun terakhir ini";
      otpStatus.style.color="#d93025";
      return;
    }
    if(_hint2) sessionStorage.removeItem("sipiket_hint_email");
    const pendingCode = sessionStorage.getItem("sipiket_classCode") || "";
    const pendingRole =
      sessionStorage.getItem("sipiket_pendingRole") ||
      (teacherMode ? "guru" : "siswa");

    let existing = null;
    if (typeof secureGet === "function")
      existing = await secureGet(encKey(email));
    else {
      try {
        existing = JSON.parse(
          localStorage.getItem("enc_" + encKey(email)) || "null",
        );
      } catch {}
    }

    if (existing && existing.classCode) {
      await persistAccount(email, {
        classCode: existing.classCode,
        role: existing.role || pendingRole,
        name: name || existing.displayName,
        picture: picture || existing.picture,
      });
      sessionStorage.setItem("sipiket_registered", "1");
      sessionStorage.setItem("sipiket_emailVerified", "1");
      sessionStorage.setItem("sipiket_classCode", existing.classCode);
      if ((existing.role || pendingRole) === "guru")
        sessionStorage.setItem("sipiket_role", "guru");
      else sessionStorage.removeItem("sipiket_role");
      const target =
        (existing.role || pendingRole) === "guru"
          ? "guru-kelas.html"
          : "kelas.html";
      otpStatus.textContent = `Selamat kamu masuk sebagai ${existing.role === "guru" ? "guru" : "siswa kelas " + existing.classCode} ✓`;
      otpStatus.style.color = "var(--orange)";
      setTimeout(() => (location.href = target), 500);
      return;
    }

    const classCodeToUse = pendingCode || "";
    if (!classEnabled && !classCodeToUse) {
      otpStatus.textContent =
        "Akun baru tanpa kode — silakan aktifkan Kode kelas dan masukkan kode kelas dulu.";
      otpStatus.style.color = "#d93025";
      updateClassEnabled(true);
      return;
    }

    await persistAccount(email, {
      classCode: classCodeToUse,
      role: pendingRole,
      name,
      picture,
    });
    const emailOtp = String(Math.floor(100000 + Math.random() * 900000));
    sessionStorage.setItem("sipiket_googleEmail", email);
    sessionStorage.setItem("sipiket_googleName", name);
    sessionStorage.setItem("sipiket_googlePicture", picture);
    sessionStorage.setItem("sipiket_emailOtp", emailOtp);
    sessionStorage.setItem("sipiket_classVerified", "1");
    sessionStorage.setItem("sipiket_pendingClassCode", classCodeToUse);
    if (pendingRole === "guru")
      sessionStorage.setItem("sipiket_pendingRole", "guru");
    localStorage.setItem("sipiket_last_email", email);
    // real send via sipiket.co@gmail.com (Drive GmailApp) — khas sipiket.my.id
    if(typeof sendVerificationEmail==="function"){ try{ await sendVerificationEmail(email, emailOtp, name); otpStatus.textContent = `✓ Verifikasi terkirim ke ${email} via sipiket.co@gmail.com — cek inbox (SPAM jika baru)`; otpStatus.style.color="var(--orange)"; }catch(e){ otpStatus.textContent="Email gagal: "+(e.message||e)+" — coba Kirim Ulang"; otpStatus.style.color="#d93025"; } }
    otpSentMsg.textContent = `Kode OTP 6 digit telah dikirim ke ${email} (kode: ${emailOtp}). Klik Verifikasi Email untuk konfirmasi terakhir.`;
    if (emailPreviewTo) emailPreviewTo.textContent = `kepada ${email}`;
    if(otpSentCard) otpSentCard.hidden = true;
    if (emailVerifyBtn) emailVerifyBtn.href = `otp.html`;
    otpSentCard.scrollIntoView({ behavior: "smooth", block: "center" });
    googleBtn.textContent = "Terkirim ✓";
    googleBtn.disabled = true;

    const mailHtml = `<!doctype html><meta charset="utf-8"><div style="font-family:Inter,system-ui;padding:24px;max-width:520px;margin:auto;border:1px solid #ffe0c2;border-radius:16px"><div style="display:flex;align-items:center;gap:10px"><div style="width:44px;height:44px;border-radius:50%;background:#ff6b00;color:#fff;display:grid;place-items:center;font-weight:800">S</div><b>SIPIKET.EXPO</b><span style="margin-left:auto;color:#6b6b6b;font-size:12px">${new Date().toLocaleString("id-ID")}</span></div><h2 style="margin:16px 0 8px">Verifikasi email kamu</h2><p style="color:#6b6b6b">Hai ${name || email}, kode OTP: <b style="font-size:18px;color:#ff6b00">${emailOtp}</b></p><a href="${location.origin}/otp.html" style="display:inline-block;background:#ff6b00;color:#fff;padding:12px 20px;border-radius:100px;text-decoration:none;font-weight:700;margin-top:12px">Verifikasi Email Sekarang →</a><p style="font-size:12px;color:#6b6b6b;margin-top:14px">Link berlaku 10 menit. Data terenkripsi AES-GCM.</p></div>`;
    if(location.hostname==="localhost") console.log(
      "%c[Email preview — dev only]",
      "color:#ff6b00;font-weight:bold",
      mailHtml,
    );
  } catch (err) {
    otpStatus.textContent = "Gagal memproses akun Google — coba lagi";
    otpStatus.style.color = "#d93025";
  }
};

function triggerGoogleChooser() {
  const hint = sessionStorage.getItem("sipiket_hint_email");
  const id = getGisClientId();
  if (id && typeof google !== "undefined" && google.accounts?.id) {
    try {
      if(hint){
        try{ google.accounts.id.initialize({ client_id: id, callback: onGoogleCredential, login_hint: hint, auto_select: false, cancel_on_tap_outside: true }); }catch{}
      }
      google.accounts.id.prompt();
      return;
    } catch {}
  }
  if (!classVerified && (teacherMode || classEnabled)) {
    otpStatus.textContent = teacherMode
      ? "Verifikasi kode guru dulu!"
      : "Verifikasi kode kelas dulu!";
    otpStatus.style.color = "#d93025";
    classBoxes[0]?.focus();
    return;
  }
  if (!termsCheck.checked) {
    termsHint.textContent = "Wajib centang Syarat & Ketentuan dulu!";
    termsCheck.focus();
    return;
  }
  // real mode: no fallback
  otpStatus.textContent =
    "Google login belum terkonfigurasi — periksa Authorized origins di Console (sipiket.my.id)";
  otpStatus.style.color = "#d93025";
  console.error(
    "GIS not configured or origin_mismatch — add https://sipiket.my.id to Authorized JavaScript origins",
  );
}

googleBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (googleBtn.disabled) {
    if (!termsCheck.checked)
      termsHint.textContent = "Wajib centang Syarat & Ketentuan dulu!";
    else if (!classVerified && (teacherMode || classEnabled))
      otpStatus.textContent = teacherMode
        ? "Verifikasi kode guru dulu!"
        : "Verifikasi kode kelas dulu!";
    return;
  }
  triggerGoogleChooser();
});

resendEmailBtn?.addEventListener("click", async () => {
  const email = sessionStorage.getItem("sipiket_googleEmail");
  if (!email) return;
  const newOtp = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem("sipiket_emailOtp", newOtp);
  otpSentMsg.textContent = `Kode OTP baru dikirim ke ${email} (kode: ${newOtp}).`;
  if (resendStatus) {
    resendStatus.textContent = "Terkirim! Cek email (kode OTP: " + newOtp + ")";
    resendStatus.style.color = "var(--orange)";
  }
  if (emailVerifyBtn) emailVerifyBtn.href = `otp.html`;
});

const emailBoxes = [...document.querySelectorAll(".email-otp")];
const emailForm = $("#emailOtpForm"),
  emailStatus = $("#emailOtpStatus"),
  resendBtn = $("#resendBtn"),
  resendHint = $("#resendHint"),
  emailHint = $("#otpEmailHint");
if (emailHint) {
  const em = sessionStorage.getItem("sipiket_googleEmail");
  if (em)
    emailHint.textContent =
      "Kode 6 digit telah dikirim ke " + em + ". Masukkan untuk verifikasi.";
  const pending = sessionStorage.getItem("sipiket_emailOtp");
  if (pending) emailHint.textContent += " (kode: " + pending + ")";
}
let resendTimer = null;
resendBtn?.addEventListener("click", () => {
  const newOtp = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem("sipiket_emailOtp", newOtp);
  resendHint.textContent = " (kode OTP baru: " + newOtp + ")";
  emailStatus.textContent = "Kode baru dikirim!";
  emailStatus.style.color = "var(--orange)";
  resendBtn.disabled = true;
  let n = 30;
  resendBtn.textContent = "Tunggu " + n + "s";
  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    n--;
    resendBtn.textContent = n > 0 ? "Tunggu " + n + "s" : "Kirim ulang";
    if (n <= 0) {
      clearInterval(resendTimer);
      resendBtn.disabled = false;
    }
  }, 1000);
});
emailForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = emailBoxes.map((b) => b.value).join("");
  if (code.length !== 6) {
    emailStatus.textContent = "Lengkapi 6 digit OTP";
    emailStatus.style.color = "#d93025";
    return;
  }
  const expect = sessionStorage.getItem("sipiket_emailOtp");
  if (expect && code !== expect) {
    emailStatus.textContent =
      "Kode OTP salah — coba lagi (kode: " + expect + ")";
    emailStatus.style.color = "#d93025";
    return;
  }
  sessionStorage.setItem("sipiket_emailVerified", "1");
  const email = sessionStorage.getItem("sipiket_googleEmail");
  const pendingCode =
    sessionStorage.getItem("sipiket_pendingClassCode") ||
    sessionStorage.getItem("sipiket_classCode");
  if (email && pendingCode) {
    const role = sessionStorage.getItem("sipiket_pendingRole") || "siswa";
    if (typeof secureSet === "function")
      await secureSet(encKey(email), {
        email,
        classCode: pendingCode,
        role,
        verifiedAt: Date.now(),
      });
    sessionStorage.setItem("sipiket_classCode", pendingCode);
    if (role === "guru") sessionStorage.setItem("sipiket_role", "guru");
    if (sessionStorage.getItem("sipiket_pendingRole") === "guru")
      sessionStorage.setItem("sipiket_role", "guru");
  }
  if (sessionStorage.getItem("sipiket_pendingRole") === "guru")
    sessionStorage.setItem("sipiket_role", "guru");
  emailStatus.textContent =
    "✓ Terverifikasi — konfirmasi terakhir, membuka pengisian profil...";
  emailStatus.style.color = "var(--orange)";
  setTimeout(() => (location.href = "profile.html"), 600);
});

const profileForm = $("#profileForm"),
  fullName = $("#fullName"),
  avatarInput = $("#avatarInput"),
  avatarPrev = $("#avatarPrev"),
  avatarName = $("#avatarName"),
  profileStatus = $("#profileStatus");
avatarInput?.addEventListener("change", () => {
  const f = avatarInput.files[0];
  if (!f) {
    avatarPrev.innerHTML = "📷";
    avatarPrev.classList.remove("has-img");
    avatarName.textContent = "";
    return;
  }
  if (!f.type.startsWith("image/")) {
    profileStatus.textContent = "File harus gambar";
    profileStatus.style.color = "#d93025";
    return;
  }
  avatarName.textContent = f.name;
  const r = new FileReader();
  r.onload = () => {
    avatarPrev.innerHTML = '<img src="' + r.result + '" alt="Preview avatar">';
    avatarPrev.classList.add("has-img");
    sessionStorage.setItem("sipiket_avatar", r.result);
  };
  r.readAsDataURL(f);
});
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = (fullName.value || "").trim();
  if (name.length < 3) {
    profileStatus.textContent = "Nama lengkap minimal 3 huruf";
    profileStatus.style.color = "#d93025";
    fullName.focus();
    return;
  }
  if (!avatarInput.files[0] && !sessionStorage.getItem("sipiket_avatar")) {
    profileStatus.textContent = "Foto profil wajib diisi";
    profileStatus.style.color = "#d93025";
    return;
  }
  sessionStorage.setItem("sipiket_fullName", name);
  sessionStorage.setItem("sipiket_registered", "1");
  sessionStorage.setItem("sipiket_emailVerified", "1");
  const email = sessionStorage.getItem("sipiket_googleEmail");
  const cls =
    sessionStorage.getItem("sipiket_classCode") ||
    sessionStorage.getItem("sipiket_pendingClassCode");
  const role =
    sessionStorage.getItem("sipiket_pendingRole") ||
    sessionStorage.getItem("sipiket_role") ||
    "siswa";
  if (email && typeof secureSet === "function") {
    const existing = (await secureGet(encKey(email))) || {};
    await secureSet(encKey(email), {
      ...existing,
      email,
      classCode: cls || existing.classCode,
      role,
      displayName: name,
      picture: sessionStorage.getItem("sipiket_googlePicture") || "",
      avatar: sessionStorage.getItem("sipiket_avatar") || "",
      registeredAt: Date.now(),
    });
    localStorage.setItem("sipiket_last_email", email);
  }
  if (sessionStorage.getItem("sipiket_pendingRole") === "guru")
    sessionStorage.setItem("sipiket_role", "guru");
  const _role =
    sessionStorage.getItem("sipiket_role") ||
    sessionStorage.getItem("sipiket_pendingRole");
  const _target = _role === "guru" ? "guru-kelas.html" : "kelas.html";
  const clsDisp = cls || sessionStorage.getItem("sipiket_classCode") || "";
  profileStatus.textContent =
    _role === "guru"
      ? "✓ Selamat kamu masuk sebagai guru — membuka " + _target + "..."
      : `✓ Selamat kamu masuk sebagai siswa kelas ${clsDisp} — membuka ${_target}...`;
  profileStatus.style.color = "var(--orange)";
  setTimeout(() => {
    location.href = _target;
  }, 800);
});

document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.clear();
  location.href = "login.html";
});
document.getElementById("logoutGuru")?.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.clear();
  location.href = "login.html";
});

(function kelasBoot() {
  const reguGrid = document.getElementById("reguGrid");
  const guruGrid = document.getElementById("guruGrid");
  const taskForm = document.getElementById("taskForm");
  if (!reguGrid && !guruGrid && !taskForm) return;
  const code = sessionStorage.getItem("sipiket_classCode") || "—";
  const name =
    sessionStorage.getItem("sipiket_fullName") ||
    sessionStorage.getItem("sipiket_googleName") ||
    "Siswa";
  const email = sessionStorage.getItem("sipiket_googleEmail") || "";
  const avatar =
    sessionStorage.getItem("sipiket_avatar") ||
    sessionStorage.getItem("sipiket_googlePicture") ||
    "";
  const role =
    sessionStorage.getItem("sipiket_role") ||
    sessionStorage.getItem("sipiket_pendingRole") ||
    "siswa";
  document.getElementById("kelasCodeBadge") &&
    (document.getElementById("kelasCodeBadge").textContent =
      role === "guru" ? "Guru — Kode " + code : "Kelas " + code);
  document.getElementById("userName") &&
    (document.getElementById("userName").textContent = name);
  document.getElementById("userEmail") &&
    (document.getElementById("userEmail").textContent = email);
  document.getElementById("guruName") &&
    (document.getElementById("guruName").textContent = name);
  document.getElementById("guruEmail") &&
    (document.getElementById("guruEmail").textContent = email);
  if (avatar) {
    const av1 = document.getElementById("userAvatar"),
      av2 = document.getElementById("guruAvatar");
    if (av1) {
      av1.src = avatar;
      av1.style.display = "block";
    }
    if (av2) {
      av2.src = avatar;
      av2.style.display = "block";
    }
  }
  const features = [
    {
      icon: "⚖️",
      title: "Pembagian Tugas",
      desc: "Di dalam regu — otomatis adil / manual oleh guru",
      badge: "Regu",
    },
    {
      icon: "🎥",
      title: "Video Bukti Piket",
      desc: "Di dalam regu — rekam beberapa detik + keliling kelas",
      badge: "Regu",
    },
    {
      icon: "📋",
      title: "Tugas Harian",
      desc: "Di dalam regu — daftar tugas & status selesai",
      badge: "Regu",
    },
  ];
  const targetGrid = reguGrid || guruGrid;
  if (targetGrid) {
    targetGrid.innerHTML = features
      .map(
        (f) =>
          `<article class="card reveal in"><div class="icon">${f.icon}</div><h3>${f.title}</h3><p>${f.desc}</p><span class="badge">${f.badge}</span></article>`,
      )
      .join("");
  }
  const notifToggle = document.getElementById("notifToggle"),
    notifStatus = document.getElementById("notifStatus");
  notifToggle?.addEventListener("change", async () => {
    if (notifToggle.checked && "Notification" in window) {
      const perm = await Notification.requestPermission();
      notifStatus.textContent =
        perm === "granted"
          ? "✓ Notifikasi Senin–Jumat 17:00 aktif (terenkripsi lokal)"
          : "Izin notifikasi ditolak";
    } else
      notifStatus.textContent = notifToggle.checked
        ? "Notifikasi aktif (demo lokal)"
        : "Notifikasi dimatikan";
    if (typeof secureSet === "function")
      await secureSet("notif_enabled", notifToggle.checked);
  });
  (async () => {
    if (typeof secureGet === "function") {
      const v = await secureGet("notif_enabled");
      if (v !== null && notifToggle) notifToggle.checked = !!v;
    }
    if (notifStatus)
      notifStatus.textContent =
        "Pengingat otomatis Senin–Jumat pukul 17:00 — tidak ada alasan lupa";
  })();
  taskForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("taskTitle").value.trim();
    const regu = document.getElementById("taskRegu").value;
    if (!title) return;
    const status = document.getElementById("taskStatus");
    const task = { title, regu, by: email, at: Date.now() };
    if (typeof secureSet === "function") {
      const list = (await secureGet("tasks_" + code)) || [];
      list.push(task);
      await secureSet("tasks_" + code, list);
    }
    status.textContent = `✓ Tugas "${title}" disimpan untuk ${regu === "auto" ? "regu berikutnya (auto)" : "Regu " + regu} — terenkripsi`;
    status.style.color = "var(--orange)";
    taskForm.reset();
    if (guruGrid)
      guruGrid.insertAdjacentHTML(
        "afterbegin",
        `<article class="card reveal in"><div class="icon">✅</div><h3>${title}</h3><p>Regu: ${regu} • oleh ${email}</p><span class="badge">Tersimpan</span></article>`,
      );
  });
})();


// --- last account detection (no re-enter code) — fixed: selalu tampilkan picker Google ---
(function lastAccountBoot(){
  const card = document.getElementById("lastAccountCard");
  if(!card) return;
  async function refresh(){
    const lastEmail = localStorage.getItem("sipiket_last_email");
    if(!lastEmail){ card.hidden=true; card.style.display="none"; return; }
    let acc=null;
    try{
      if(typeof secureGet==="function") acc = await secureGet("account_"+lastEmail.toLowerCase());
      if(!acc) throw 0;
    }catch{
      try{ acc = JSON.parse(localStorage.getItem("enc_account_"+lastEmail.toLowerCase())||"null"); if(acc && acc.ct) acc=null; }catch{}
      if(!acc) acc = {email:lastEmail, classCode: localStorage.getItem("sipiket_last_class")||""};
    }
    if(!acc || !acc.email){ card.hidden=true; card.style.display="none"; return; }
    const avatar=document.getElementById("lastAccAvatar");
    const emailEl=document.getElementById("lastAccEmail");
    if(emailEl) emailEl.textContent=acc.email;
    if(avatar && (acc.avatar||acc.picture)){ avatar.src=acc.avatar||acc.picture; avatar.style.display="block"; }
    card.hidden=false; card.style.display="grid";
    const status=document.getElementById("lastAccStatus");
    if(status) status.textContent="Klik untuk gunakan akun ini — akan membuka pilihan akun Google";
    const btn=document.getElementById("useLastAccBtn");
    if(btn && !btn._bound){
      btn._bound=true;
      btn.addEventListener("click", async()=>{
        const lastEmail2=localStorage.getItem("sipiket_last_email");
        if(!lastEmail2){ status.textContent="Email tidak terdeteksi — tambahkan akun atau buat akun lagi"; status.style.color="#d93025"; return; }
        let acc2=null;
        try{ if(typeof secureGet==="function") acc2=await secureGet("account_"+lastEmail2.toLowerCase()); }catch{}
        if(!acc2 || !acc2.email){
          try{ acc2=JSON.parse(localStorage.getItem("enc_account_"+lastEmail2.toLowerCase())||"null"); if(acc2 && acc2.ct) acc2=null; }catch{}
        }
        if(!acc2) acc2={email:lastEmail2};
        if(!acc2.email){ status.textContent="Email tidak terdeteksi — tambahkan akun atau buat akun lagi"; status.style.color="#d93025"; return; }
        if(!acc2.classCode){ status.textContent="Akun ditemukan tapi kelas kosong — masukkan kode kelas/guru dulu"; status.style.color="#d93025"; return; }
        sessionStorage.setItem("sipiket_googleEmail", acc2.email);
        if(acc2.displayName) sessionStorage.setItem("sipiket_googleName", acc2.displayName);
        if(acc2.picture) sessionStorage.setItem("sipiket_googlePicture", acc2.picture);
        if(acc2.avatar) sessionStorage.setItem("sipiket_avatar", acc2.avatar);
        sessionStorage.setItem("sipiket_classCode", acc2.classCode||"");
        if(acc2.classCode) sessionStorage.setItem("sipiket_pendingClassCode", acc2.classCode);
        if(acc2.role==="guru") sessionStorage.setItem("sipiket_pendingRole","guru"); else sessionStorage.removeItem("sipiket_pendingRole");
        setClassVerified(true);
        const cb=document.getElementById("termsCheck"); if(cb && !cb.checked){ cb.checked=true; cb.dispatchEvent(new Event("change",{bubbles:true})); if(typeof syncGoogle==="function") syncGoogle(); }
        sessionStorage.setItem("sipiket_hint_email", acc2.email);
        status.textContent="✓ Akun terpilih: "+acc2.email+" — membuka pilihan akun Google...";
        status.style.color="var(--orange)";
        // buka picker Google dengan hint
        setTimeout(()=>{
          if(typeof triggerGoogleChooser==="function") triggerGoogleChooser();
          else if(typeof google!=="undefined" && google.accounts?.id) try{ google.accounts.id.prompt(); }catch{}
        }, 300);
      });
    }
  }
  refresh();
  window.addEventListener("storage", refresh);
  setTimeout(refresh, 900);
})();

(function devStackBoot() {
  const stack = document.getElementById("devStack");
  if (!stack) return;
  const hint = document.getElementById("devStackHint");
  const nextBtn = document.getElementById("devStackNext");
  const backBtn = document.getElementById("devBack");
  const devs = [
    {
      name: "Raja",
      role: "Lead Developer & Full Stack Developer",
      img: "images/raja.webp",
      lead: true,
    },
    { name: "Kibi", role: "Assistant & Publisher", img: "images/kibi.jpg" },
    {
      name: "Zanet",
      role: "Social Media & Content Manager",
      img: "images/zanet.jpg",
    },
    {
      name: "Avara",
      role: "Mediator & Project Coordinator",
      img: "images/avara.jpg",
    },
    {
      name: "Surya",
      role: "Creator & Build Script Engineer",
      img: "images/surya.jpg",
    },
    {
      name: "Gabriel",
      role: "Assistant Build Script Engineer",
      img: "images/gabriel.jpg",
    },
  ];
  let idx = 0;
  function render() {
    stack.innerHTML = "";
    for (let k = 0; k < 3; k++) {
      const i = (idx + k) % devs.length;
      const d = devs[i];
      const card = document.createElement("article");
      card.className =
        "stack-card " +
        (k === 0 ? "is-active" : k === 1 ? "is-next" : "is-behind");
      if (d.lead) card.classList.add("dev-card--lead");
      const roleCls = d.lead ? "stack-prof" : "stack-prof";
      card.innerHTML = `<div class="dev-img-wrap"><img src="${d.img}" alt="Foto ${d.name}" loading="lazy" width="200" height="200" /></div><h3 class="${d.lead ? "is-raja" : ""}">${d.name}</h3><p><span class="stack-prof" style="${d.lead ? "background:linear-gradient(135deg,#e01428,#ff3b3b)" : ""}">${d.role}</span></p>`;
      card.style.transform += ` translateZ(0)`;
      stack.appendChild(card);
    }
    if (hint)
      hint.textContent = `${idx + 1} / ${devs.length} — ${devs[idx].name} • ${devs[idx].role} • Next untuk berikut, Kembali untuk sebelumnya`;
  }
  nextBtn?.addEventListener("click", () => {
    idx = (idx + 1) % devs.length;
    render();
  });
  backBtn?.addEventListener("click", () => {
    idx = (idx - 1 + devs.length) % devs.length;
    render();
  });
  render();
})();


// --- login verify/profile views (pindah halaman) ---
function showLoginView(name){
  const form=document.getElementById("otpForm");
  const verifyView=document.getElementById("verifyView");
  const profileView=document.getElementById("profileView");
  const otpCard=document.getElementById("otpSentCard");
  [verifyView,profileView,otpCard].forEach(v=>{ if(v){ v.hidden=true; v.style.display="none"; }});
  if(form) form.style.display=name==="form"?"grid":"none";
  const target=name==="verify"?verifyView:name==="profile"?profileView:null;
  if(target){
    target.hidden=false; target.style.display="grid";
    // guru fields visibility
    const guruFields=document.getElementById("guruClassFields");
    if(guruFields){
      const isGuru = sessionStorage.getItem("sipiket_pendingRole")==="guru" || (typeof teacherMode!=="undefined" && teacherMode);
      guruFields.hidden = !isGuru;
      guruFields.style.display = isGuru ? "grid" : "none";
      // toggle required
      const t=document.getElementById("guruTingkat"), n=document.getElementById("guruNamaKelas");
      if(t) t.required = isGuru;
      if(n) n.required = isGuru;
    }
    window.scrollTo({top:0, behavior:"smooth"});
  }
}

(function verifyViewBoot(){
  const view=document.getElementById("verifyView");
  if(!view) return;
  const emailShow=document.getElementById("verifyEmailShow");
  const nameShow=document.getElementById("verifyNameShow");
  const sendBtn=document.getElementById("sendVerifyBtn");
  const sentBox=document.getElementById("verifySentBox");
  const continueBtn=document.getElementById("verifyContinueBtn");
  const goOtp=document.getElementById("verifyGoOtp");
  function update(){
    const email=sessionStorage.getItem("sipiket_googleEmail")||"";
    const name=sessionStorage.getItem("sipiket_googleName")||email.split("@")[0]||"kamu";
    if(emailShow) emailShow.textContent=email||"— belum dipilih";
    if(nameShow) nameShow.textContent=name||"kamu";
    const desc=document.getElementById("verifyDesc");
    if(desc && email) desc.textContent=`Tekan tombol di bawah untuk mengirim verifikasi ke ${email}. Email terdeteksi otomatis & terenkripsi.`;
  }
  update();
  // after Google credential, trigger view
  const orig = window.onGoogleCredential;
  if(orig && !orig._wrapped){
    const wrapped = async function(r){ await orig.call(this,r); if(!sessionStorage.getItem("sipiket_registered") || !sessionStorage.getItem("sipiket_emailVerified")){ showLoginView("verify"); update(); } };
    wrapped._wrapped=true;
    window.onGoogleCredential = wrapped;
  }
  sendBtn?.addEventListener("click", async ()=>{
    const email=sessionStorage.getItem("sipiket_googleEmail");
    if(!email){ const s=document.getElementById("otpStatus"); if(s){s.textContent="Pilih akun Google dulu"; s.style.color="#d93025";} return; }
    sendBtn.disabled=true; sendBtn.textContent="Mengirim...";
    try{
      const name=sessionStorage.getItem("sipiket_googleName")||email;
      if(typeof sendVerificationEmail==="function") await sendVerificationEmail(email, sessionStorage.getItem("sipiket_emailOtp")||"000000", name);
      if(sentBox){ sentBox.hidden=false; sentBox.style.display="grid"; }
      sendBtn.textContent="Terkirim — cek email";
      setTimeout(()=>{ sendBtn.hidden=true; if(continueBtn){ continueBtn.hidden=false; continueBtn.style.display="grid"; } }, 700);
    }catch(e){
      sendBtn.disabled=false; sendBtn.textContent="Kirim Verifikasi ke Email →";
      const s=document.getElementById("verifyDesc"); if(s) s.textContent="Gagal kirim: "+(e.message||e);
    }
  });
  continueBtn?.addEventListener("click", ()=>{
    showLoginView("profile");
    if(typeof refreshProfileCooldown==="function") refreshProfileCooldown();
  });
  if(goOtp) goOtp.addEventListener("click", (e)=>{ e.preventDefault(); showLoginView("profile"); if(typeof refreshProfileCooldown==="function") refreshProfileCooldown(); });
})();

(function inlineProfileBoot(){
  const pv=document.getElementById("profileView");
  if(!pv) return;
  const nameEl=document.getElementById("inlineName");
  const avatarEl=document.getElementById("inlineAvatar");
  const prevEl=document.getElementById("inlineAvatarPrev");
  const saveBtn=document.getElementById("inlineProfileSave");
  const statusEl=document.getElementById("inlineProfileStatus");
  const cooldownEl=document.getElementById("profileCooldown");
  const tingkatEl=document.getElementById("guruTingkat");
  const namaKelasEl=document.getElementById("guruNamaKelas");
  function isGuru(){ return sessionStorage.getItem("sipiket_pendingRole")==="guru" || (typeof teacherMode!=="undefined" && teacherMode); }
  function validate(){
    const name=(nameEl.value||"").trim();
    const hasAvatar = !!(avatarEl.files[0] || sessionStorage.getItem("sipiket_avatar"));
    let ok = name.length>=3 && hasAvatar;
    if(isGuru()){
      const t=(tingkatEl.value||"").trim();
      const n=(namaKelasEl.value||"").trim();
      ok = ok && t && n;
    }
    saveBtn.disabled = !ok;
    saveBtn.setAttribute("aria-disabled", String(!ok));
    saveBtn.style.opacity = ok ? "1" : "0.5";
  }
  ["input","change"].forEach(ev=>{
    nameEl?.addEventListener(ev, validate);
    tingkatEl?.addEventListener(ev, validate);
    namaKelasEl?.addEventListener(ev, validate);
  });
  avatarEl?.addEventListener("change", ()=>{
    const f=avatarEl.files[0];
    if(!f){ prevEl.innerHTML="👤"; return; }
    if(!f.type.startsWith("image/")){ statusEl.textContent="File harus gambar"; statusEl.style.color="#d93025"; return; }
    const r=new FileReader();
    r.onload=()=>{ prevEl.innerHTML='<img src="'+r.result+'" alt="Foto profil" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'; sessionStorage.setItem("sipiket_avatar", r.result); validate(); };
    r.readAsDataURL(f);
  });
  prevEl?.addEventListener("click", ()=> avatarEl?.click());
  // prefill
  const savedName=sessionStorage.getItem("sipiket_fullName") || sessionStorage.getItem("sipiket_googleName") || "";
  if(savedName && nameEl) nameEl.value=savedName;
  const av=sessionStorage.getItem("sipiket_avatar") || sessionStorage.getItem("sipiket_googlePicture");
  if(av && prevEl) prevEl.innerHTML='<img src="'+av+'" alt="Foto profil" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';

  window.refreshProfileCooldown = function(){
    const last=localStorage.getItem("sipiket_profile_updated_at");
    if(!last){ if(cooldownEl) cooldownEl.textContent="Bisa diganti kapan saja — setelah simpan, cooldown 14 hari."; return; }
    const diff=Date.now()-Number(last);
    const twoWeeks=14*24*60*60*1000;
    if(diff < twoWeeks){ const left=Math.ceil((twoWeeks-diff)/(24*60*60*1000)); if(cooldownEl) cooldownEl.textContent=`Nama & foto terkunci — bisa diganti lagi dalam ${left} hari.`; }
    else { if(cooldownEl) cooldownEl.textContent="Bisa diganti — cooldown telah lewat."; }
  };
  refreshProfileCooldown();
  validate();

  // observer for view shown
  const obs=new MutationObserver(()=>{
    if(!pv.hidden) validate();
  });
  obs.observe(pv, {attributes:true, attributeFilter:["hidden"]});

  saveBtn?.addEventListener("click", async ()=>{
    const name=(nameEl.value||"").trim();
    if(name.length<3){ statusEl.textContent="Nama minimal 3 huruf"; statusEl.style.color="#d93025"; nameEl.focus(); return; }
    if(!avatarEl.files[0] && !sessionStorage.getItem("sipiket_avatar")){ statusEl.textContent="Foto profil wajib"; statusEl.style.color="#d93025"; return; }
    let guruKelas=null;
    if(isGuru()){
      const tingkat=(tingkatEl.value||"").trim();
      const namaK=(namaKelasEl.value||"").trim();
      if(!tingkat || !namaK){ statusEl.textContent="Pilih tingkat 1-12 dan isi nama kelas"; statusEl.style.color="#d93025"; return; }
      guruKelas = `${tingkat}-${namaK}`;
      const existing = localStorage.getItem("sipiket_last_email") ? await (typeof secureGet==="function" ? secureGet("account_"+localStorage.getItem("sipiket_last_email").toLowerCase()) : null) : null;
      // 1 akun guru = 1 kelas: cek sudah punya kelas
      if(existing && existing.classCode && existing.classCode!==sessionStorage.getItem("sipiket_classCode")){
        // still allow but warn overwrite? For now replace
      }
      // simpan kelas master
      if(typeof secureSet==="function"){
        const list=(await secureGet("classes")||[]);
        if(!list.find(c=>c.code===guruKelas)){
          list.push({code:guruKelas, tingkat, nama:namaK, by: sessionStorage.getItem("sipiket_googleEmail")||"", at: Date.now()});
          await secureSet("classes", list);
        }
      }
      sessionStorage.setItem("sipiket_guru_kelas", guruKelas);
      // override classCode with guru's class
      sessionStorage.setItem("sipiket_classCode", guruKelas);
      sessionStorage.setItem("sipiket_pendingClassCode", guruKelas);
    }
    const last=localStorage.getItem("sipiket_profile_updated_at");
    if(last && Date.now()-Number(last) < 14*24*60*60*1000){
      const left=Math.ceil((14*24*60*60*1000 - (Date.now()-Number(last)))/(24*60*60*1000));
      if(!confirm(`Profil baru diganti ${left} hari lalu. Tetap ganti? (Cooldown 14 hari)`)) return;
    }
    const email=sessionStorage.getItem("sipiket_googleEmail");
    const cls=sessionStorage.getItem("sipiket_classCode")||sessionStorage.getItem("sipiket_pendingClassCode")||guruKelas;
    const role=sessionStorage.getItem("sipiket_pendingRole")||sessionStorage.getItem("sipiket_role")|| (isGuru()?"guru":"siswa");
    sessionStorage.setItem("sipiket_fullName", name);
    sessionStorage.setItem("sipiket_registered","1");
    sessionStorage.setItem("sipiket_emailVerified","1");
    if(email && typeof secureSet==="function"){
      const existing=(await secureGet("account_"+email.toLowerCase()))||{};
      await secureSet("account_"+email.toLowerCase(), {...existing, email, classCode: cls||existing.classCode, role, displayName:name, picture: sessionStorage.getItem("sipiket_googlePicture")||"", avatar: sessionStorage.getItem("sipiket_avatar")||"", registeredAt: Date.now(), guruKelas: guruKelas||existing.guruKelas});
      localStorage.setItem("sipiket_last_email", email);
    }
    localStorage.setItem("sipiket_profile_updated_at", String(Date.now()));
    if(role==="guru") sessionStorage.setItem("sipiket_role","guru");
    const target= role==="guru" ? "guru-kelas.html" : "kelas.html";
    statusEl.textContent = role==="guru" ? `✓ Kelas ${guruKelas} terbuat — membuka ${target}...` : `✓ Selamat kamu masuk sebagai siswa kelas ${cls} — membuka ${target}...`;
    statusEl.style.color="var(--orange)";
    refreshProfileCooldown();
    setTimeout(()=> location.href=target, 800);
  });
})();

(function feedbackBoot() {
  const form = document.getElementById("feedbackForm");
  if (!form) return;
  const nameEl = document.getElementById("fbName"),
    emailEl = document.getElementById("fbEmail"),
    kategoriEl = document.getElementById("fbKategori"),
    pesanEl = document.getElementById("fbPesan"),
    countEl = document.getElementById("fbCount"),
    ratingEl = document.getElementById("fbRating"),
    statusEl = document.getElementById("fbStatus"),
    submitBtn = document.getElementById("fbSubmit");
  const starBtns = [...document.querySelectorAll(".stars button")];
  let rating = 0;
  function setStars(v) {
    rating = v;
    ratingEl.value = v ? String(v) : "";
    starBtns.forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.star) <= v)),
    );
  }
  starBtns.forEach((b) =>
    b.addEventListener("click", () => setStars(Number(b.dataset.star))),
  );
  pesanEl?.addEventListener("input", () => {
    if (countEl) countEl.textContent = String(pesanEl.value.length);
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl.value || "").trim(),
      pesan = (pesanEl.value || "").trim(),
      nama = (nameEl.value || "").trim(),
      kategori = (kategoriEl.value || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      statusEl.textContent = "Email tidak valid";
      statusEl.style.color = "#d93025";
      emailEl.focus();
      return;
    }
    if (!pesan || pesan.length < 10) {
      statusEl.textContent = "Pesan minimal 10 karakter";
      statusEl.style.color = "#d93025";
      pesanEl.focus();
      return;
    }
    if (form.querySelector('[name="_honey"]')?.value) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";
    statusEl.textContent = "";
    try {
      const payload = new FormData(form);
      if (!payload.get("rating") && rating)
        payload.set("rating", String(rating));
      payload.set(
        "_subject",
        `[SIPIKET.EXPO] ${kategori || "Feedback"} — Rating ${rating || "-"}/5`,
      );
      const res = await fetch(form.action, {
        method: "POST",
        body: payload,
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Gagal");
      statusEl.textContent =
        "✓ Terima kasih! Feedback terkirim ke sipiket.anchor@gmail.com — format tabel rapi sudah masuk inbox.";
      statusEl.style.color = "var(--orange)";
      form.reset();
      setStars(0);
      if (countEl) countEl.textContent = "0";
    } catch (err) {
      const mailto = `mailto:sipiket.anchor@gmail.com?subject=${encodeURIComponent(`[SIPIKET.EXPO] ${kategori || "Feedback"} — Rating ${rating || "-"}/5`)}&body=${encodeURIComponent(`Nama: ${nama || "-"}\nEmail: ${email}\nKategori: ${kategori || "-"}\nRating: ${rating || "-"}/5\n\nPesan:\n${pesan}\n\n— via sipiket.my.id/feedback`)}`;
      statusEl.innerHTML = `Gagal via form (offline/captcha). <a href="${mailto}" style="color:var(--orange);font-weight:700">Kirim via email langsung →</a>`;
      statusEl.style.color = "#d93025";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim Feedback ✈️";
    }
  });
})();

// video storage real (supabase storage videos bucket)
(function videoBoot(){
  const inp=document.getElementById("videoInput"), prev=document.getElementById("videoPreview"), btn=document.getElementById("uploadVideoBtn"), st=document.getElementById("videoStatus");
  if(!inp||!btn) return;
  inp.addEventListener("change",()=>{
    const f=inp.files[0];
    if(!f){ prev.hidden=true; return; }
    if(!f.type.startsWith("video/")){ st.textContent="File harus video"; st.style.color="#d93025"; return; }
    if(f.size>50*1024*1024){ st.textContent="Maks 50MB"; st.style.color="#d93025"; return; }
    prev.src=URL.createObjectURL(f); prev.style.display="block"; prev.hidden=false;
    st.textContent=`Siap upload: ${f.name} ${(f.size/1024/1024).toFixed(1)}MB — terenkripsi`;
    st.style.color="var(--muted)";
  });
  btn.addEventListener("click", async()=>{
    const f=inp.files[0];
    if(!f){ st.textContent="Pilih video dulu"; st.style.color="#d93025"; return; }
    btn.disabled=true; btn.textContent="Mengupload...";
    try{
      const code=sessionStorage.getItem("sipiket_classCode")||"";
      const email=sessionStorage.getItem("sipiket_googleEmail")||"";
      if(typeof uploadVideo==="function" && typeof supa!=="undefined" && supa){
        const path=await uploadVideo(f,{class_code:code,email, duration:Math.round(prev.duration||5)});
        st.textContent="✓ Terupload: "+path+" — tersimpan terenkripsi";
        st.style.color="var(--orange)";
      } else {
        // fallback local encrypted
        const r=new FileReader();
        await new Promise((res,rej)=>{ r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); });
        const key="video_"+Date.now();
        if(typeof secureSet==="function") await secureSet(key, {name:f.name, data:r.result, class_code:code, at:Date.now()});
        st.textContent="✓ Tersimpan lokal terenkripsi (supabase.js belum diisi) — ponytail: isi SUPABASE_URL/ANON";
        st.style.color="var(--orange)";
      }
    }catch(e){ st.textContent="Gagal: "+(e.message||e); st.style.color="#d93025"; }
    finally{ btn.disabled=false; btn.textContent="Upload ke Storage (real)"; }
  });
})();
