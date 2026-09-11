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
const TEACHER_CODE = "raandki";
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
  const n = isTeacher ? TEACHER_CODE.length : 6;
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
      inp.pattern = "[A-Za-z]";
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
      if (teacherMode) {
        b.value = b.value
          .replace(/[^A-Za-z]/g, "")
          .slice(-1)
          .toLowerCase();
      } else {
        b.value = b.value.replace(/\D/g, "").slice(-1);
      }
      if (b.value && classBoxes[i + 1]) classBoxes[i + 1].focus();
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
            .replace(/[^A-Za-z]/g, "")
            .toLowerCase()
            .slice(0, classBoxes.length)
            .split("")
        : raw.replace(/\D/g, "").slice(0, classBoxes.length).split("");
      d.forEach((c, j) => {
        if (classBoxes[j]) classBoxes[j].value = c;
      });
      classBoxes[Math.min(d.length, classBoxes.length - 1)]?.focus();
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
const classToggle = $("#classToggle"),
  codeFieldset = $("#codeFieldset"),
  classOffHint = $("#classOffHint"),
  accountHint = $("#accountHint"),
  googleStep = $("#googleStep"),
  emailPreview = $("#emailPreview"),
  emailPreviewTo = $("#emailPreviewTo"),
  emailVerifyBtn = $("#emailVerifyBtn"),
  resendEmailBtn = $("#resendEmailBtn"),
  resendStatus = $("#resendStatus"),
  termsLink = $("#termsLink");
let classVerified = false;
let teacherMode = false;
let classEnabled = true;
async function countSavedAccounts(){
  let n=0;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k && k.startsWith("enc_account_")) n++;
  }
  return n;
}
async function showAccountHint(){
  if(!accountHint) return;
  const n = await countSavedAccounts();
  const lastEmail = localStorage.getItem("sipiket_last_email");
  if(n>0){
    accountHint.style.display="block";
    accountHint.textContent = lastEmail
      ? `Terdeteksi ${n} akun tersimpan. Email terakhir: ${lastEmail} — matikan Kode kelas untuk login langsung tanpa kode.`
      : `Terdeteksi ${n} akun tersimpan — matikan Kode kelas untuk login langsung tanpa kode (auto ke kelas).`;
  } else {
    accountHint.style.display="none";
  }
}
showAccountHint();
function updateClassEnabled(on){
  classEnabled = on;
  if(classToggle){
    classToggle.setAttribute("aria-checked", String(on));
    classToggle.classList.toggle("is-off", !on);
    classToggle.setAttribute("aria-label", on ? "Kode kelas aktif" : "Kode kelas mati — login tanpa kode (akun lama)");
    classToggle.title = on ? "Kode kelas aktif" : "Kode kelas mati";
  }
  if(codeFieldset) codeFieldset.classList.toggle("is-off", !on);
  classBoxes.forEach(b=> b.disabled = !on ? true : classVerified ? true : false);
  if(verifyBtn){
    verifyBtn.style.display = on && !teacherMode ? "" : "none";
    verifyBtn.disabled = !on ? true : classVerified ? true : false;
  }
  if(classOffHint) classOffHint.textContent = !on ? "Kode kelas dimatikan — langsung centang S&K & Google (akun lama auto ke kelas)." : "Matikan kode kelas jika sudah pernah daftar — email akan otomatis ke kelas terkait.";
  updateGoogleVisibility();
  syncGoogle();
}
function updateGoogleVisibility(){
  if(!googleStep) return;
  if(teacherMode){
    googleStep.hidden = !classVerified;
    googleStep.style.display = classVerified ? "grid" : "none";
  } else if(!classEnabled){
    googleStep.hidden = false;
    googleStep.style.display = "grid";
  } else {
    googleStep.hidden = !classVerified;
    googleStep.style.display = classVerified ? "grid" : "none";
  }
}
function applyTeacherMode(on) {
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
    teacherToggle.classList.toggle("is-off", false);
  }
  if(classToggle){
    classToggle.style.display = on ? "none" : "";
    if(on && !classEnabled) updateClassEnabled(true);
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
      on ? "Kode guru 7 huruf" : "Kode kelas 6 digit",
    );
  if (loginDesc)
    loginDesc.textContent = on
      ? "Kode untuk guru, Google untuk akun. Belum daftar? Otomatis didaftarkan."
      : classEnabled ? "Kode kelas untuk masuk kelas, Google untuk akun. Belum terdaftar? Otomatis didaftarkan." : "Tanpa kode — Google akan auto ke kelas kamu.";
  sessionStorage.setItem("sipiket_teacherMode", on ? "1" : "0");
  if (!on) sessionStorage.removeItem("sipiket_pendingRole");
  updateGoogleVisibility();
}
teacherToggle?.addEventListener("click", () => {
  const next = !teacherMode;
  applyTeacherMode(next);
  if (classVerified) resetClass();
  verifyBtn.textContent = "Verifikasi Kode →";
  otpStatus.textContent = next
    ? "Mode kode guru aktif"
    : "Mode kode kelas aktif";
  otpStatus.style.color = "var(--muted)";
  if(next) classBoxes[0]?.focus();
});
teacherToggle?.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    teacherToggle.click();
  }
});
classToggle?.addEventListener("click", ()=>{
  const next = !classEnabled;
  if(teacherMode) return;
  updateClassEnabled(next);
  if(classVerified) resetClass();
  if(!next){
    sessionStorage.removeItem("sipiket_classCode");
    otpStatus.textContent = "Kode kelas dimatikan — akun lama akan auto ke kelas.";
    otpStatus.style.color = "var(--muted)";
  } else {
    otpStatus.textContent = "Kode kelas diaktifkan";
    otpStatus.style.color = "var(--muted)";
    classBoxes[0]?.focus();
  }
});
classToggle?.addEventListener("keydown", (e)=>{
  if(e.key===" "||e.key==="Enter"){ e.preventDefault(); classToggle.click(); }
});
if (sessionStorage.getItem("sipiket_teacherMode") === "1")
  applyTeacherMode(true);
updateClassEnabled(true);
termsLink?.addEventListener("click",(e)=>{ e.preventDefault(); alert('Syarat & Ketentuan: Data terenkripsi AES-GCM, dipakai hanya untuk piket. Google OAuth untuk akun, kode kelas/guru untuk penempatan kelas.'); });
function syncGoogle() {
  if (!googleBtn) return;
  const ok = classVerified && !!termsCheck?.checked;
  googleBtn.disabled = !ok;
  googleBtn.setAttribute("aria-disabled", String(!ok));
  if (!classVerified)
    googleBtn.title = teacherMode
      ? "Verifikasi kode guru dulu"
      : "Verifikasi kode kelas dulu";
  else if (!termsCheck.checked)
    googleBtn.title = "Centang Syarat & Ketentuan dulu";
  else googleBtn.title = "Lanjutkan login dengan Google";
}
function setClassVerified(v) {
  classVerified = v;
  if (v) {
    verifyBtn.textContent = "Terverifikasi ✓";
    verifyBtn.disabled = true;
    classBoxes.forEach((b) => (b.disabled = true));
    otpStatus.textContent = teacherMode
      ? "✓ Kode guru terverifikasi — centang S&K lalu lanjut Google"
      : "✓ Kode kelas terverifikasi — centang S&K lalu lanjut Google";
    otpStatus.style.color = "var(--orange)";
  } else {
    verifyBtn.textContent = "Verifikasi Kode →";
    verifyBtn.disabled = false;
    classBoxes.forEach((b) => (b.disabled = false));
  }
  syncGoogle();
  if (v && termsCheck?.checked) googleBtn.focus();
}
function resetClass() {
  if (!classVerified) return;
  classVerified = false;
  verifyBtn.textContent = "Verifikasi Kode →";
  verifyBtn.disabled = false;
  classBoxes.forEach((b) => (b.disabled = false));
  otpStatus.textContent = "Kode diubah — verifikasi ulang";
  otpStatus.style.color = "#d93025";
  otpSentCard.hidden = true;
  syncGoogle();
}
otpForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (teacherMode) {
    const code = classBoxes.map((b) => b.value.toLowerCase()).join("");
    if (code.length !== TEACHER_CODE.length) {
      otpStatus.textContent =
        "Lengkapi " + TEACHER_CODE.length + " huruf kode guru";
      otpStatus.style.color = "#d93025";
      return;
    }
    if (code !== TEACHER_CODE) {
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
  setClassVerified(true);
});
termsCheck?.addEventListener("change", () => {
  termsHint.textContent = termsCheck.checked
    ? ""
    : "Wajib centang Syarat & Ketentuan untuk lanjut";
  syncGoogle();
});
googleBtn?.addEventListener("click", (e) => {
  if (!classVerified) {
    e.preventDefault();
    otpStatus.textContent = teacherMode
      ? "Verifikasi kode guru dulu!"
      : "Verifikasi kode kelas dulu!";
    otpStatus.style.color = "#d93025";
    classBoxes[0]?.focus();
    return;
  }
  if (!termsCheck.checked) {
    e.preventDefault();
    termsHint.textContent = "Wajib centang Syarat & Ketentuan dulu!";
    termsCheck.focus();
    return;
  }
  const code =
    sessionStorage.getItem("sipiket_classCode") ||
    classBoxes.map((b) => b.value).join("");
  const fakeEmail =
    "siswa" + Math.floor(Math.random() * 900 + 100) + "@gmail.com";
  const emailOtp = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem("sipiket_googleEmail", fakeEmail);
  sessionStorage.setItem("sipiket_emailOtp", emailOtp);
  sessionStorage.setItem("sipiket_classVerified", "1");
  otpSentMsg.textContent =
    "Kode OTP 6 digit telah dikirim ke " +
    fakeEmail +
    " (demo: " +
    emailOtp +
    "). Klik Cek Kode OTP untuk melanjutkan pendaftaran.";
  otpSentCard.hidden = false;
  otpSentCard.scrollIntoView({ behavior: "smooth", block: "center" });
  googleBtn.textContent = "Terkirim ✓";
  googleBtn.disabled = true;
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
  if (!sessionStorage.getItem("sipiket_classCode"))
    emailHint.textContent +=
      " (demo: OTP " +
      (sessionStorage.getItem("sipiket_emailOtp") || "123456") +
      ")";
  else
    emailHint.textContent +=
      " (demo: " +
      (sessionStorage.getItem("sipiket_emailOtp") || "123456") +
      ")";
}
let resendTimer = null;
resendBtn?.addEventListener("click", () => {
  const newOtp = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem("sipiket_emailOtp", newOtp);
  resendHint.textContent = " (demo OTP baru: " + newOtp + ")";
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
emailForm?.addEventListener("submit", (e) => {
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
      "Kode OTP salah — coba lagi (demo: " + expect + ")";
    emailStatus.style.color = "#d93025";
    return;
  }
  sessionStorage.setItem("sipiket_emailVerified", "1");
  if (sessionStorage.getItem("sipiket_pendingRole") === "guru")
    sessionStorage.setItem("sipiket_role", "guru");
  emailStatus.textContent = "✓ Terverifikasi — membuka pengisian profil...";
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
profileForm?.addEventListener("submit", (e) => {
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
  if (sessionStorage.getItem("sipiket_pendingRole") === "guru")
    sessionStorage.setItem("sipiket_role", "guru");
  profileStatus.textContent =
    "✓ Pendaftaran berhasil — masuk ke kelas " +
    (sessionStorage.getItem("sipiket_classCode") || "") +
    " sebagai " +
    name;
  profileStatus.style.color = "var(--orange)";
  const _role = sessionStorage.getItem("sipiket_role") || sessionStorage.getItem("sipiket_pendingRole");
  const _target = _role === "guru" ? "guru-kelas.html" : "kelas.html";
  profileStatus.textContent = "✓ Pendaftaran berhasil — membuka " + _target + "...";
  profileStatus.style.color = "var(--orange)";
  setTimeout(() => { location.href = _target; }, 700);
});
