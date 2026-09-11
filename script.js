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
      if (teacherMode)
        b.value = b.value
          .replace(/[^A-Za-z]/g, "")
          .slice(-1)
          .toLowerCase();
      else b.value = b.value.replace(/\D/g, "").slice(-1);
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
  if (!accountHint) return;
  const n = await countSavedAccounts();
  const lastEmail = localStorage.getItem("sipiket_last_email");
  if (n > 0) {
    accountHint.style.display = "block";
    accountHint.innerHTML = lastEmail
      ? `Terdeteksi <b>${n} akun</b> tersimpan. Email terakhir: <b>${lastEmail}</b> — matikan <b>Kode kelas</b> untuk login langsung tanpa kode (auto ke kelas). <a href="#" id="hintReuse" style="color:var(--orange);font-weight:700">Gunakan email ini →</a>`
      : `Terdeteksi <b>${n} akun</b> tersimpan — matikan <b>Kode kelas</b> untuk login langsung tanpa kode (auto ke kelas).`;
    document.getElementById("hintReuse")?.addEventListener("click", (e) => {
      e.preventDefault();
      updateClassEnabled(false);
      document
        .getElementById("googleStep")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  } else accountHint.style.display = "none";
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
            }
          });
        }
      } catch {}
    }
  }
})();

function updateClassEnabled(on) {
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
  if (teacherMode) {
    googleStep.hidden = !classVerified;
    googleStep.style.display = classVerified ? "grid" : "none";
  } else if (!classEnabled) {
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
      on ? "Kode guru 7 huruf" : "Kode kelas 6 digit",
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
  const next = !teacherMode;
  applyTeacherMode(next);
  if (classVerified) resetClass();
  verifyBtn.textContent = "Verifikasi Kode →";
  otpStatus.textContent = next
    ? "Mode kode guru aktif"
    : "Mode kode kelas aktif";
  otpStatus.style.color = "var(--muted)";
  if (next) classBoxes[0]?.focus();
});
teacherToggle?.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    teacherToggle.click();
  }
});
classToggle?.addEventListener("click", () => {
  if (teacherMode) return;
  const next = !classEnabled;
  updateClassEnabled(next);
  if (classVerified) resetClass();
  if (!next) {
    sessionStorage.removeItem("sipiket_classCode");
    otpStatus.textContent =
      "Kode kelas dimatikan — akun lama akan auto ke kelas.";
    otpStatus.style.color = "var(--muted)";
  } else {
    otpStatus.textContent = "Kode kelas diaktifkan";
    otpStatus.style.color = "var(--muted)";
    classBoxes[0]?.focus();
  }
});
classToggle?.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    classToggle.click();
  }
});
if (sessionStorage.getItem("sipiket_teacherMode") === "1")
  applyTeacherMode(true);
updateClassEnabled(true);
termsLink?.addEventListener("click", (e) => {
  e.preventDefault();
  alert(
    "Syarat & Ketentuan: Data terenkripsi AES-GCM, dipakai hanya untuk piket. Google OAuth untuk akun, kode kelas/guru untuk penempatan kelas.",
  );
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
  updateGoogleVisibility();
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
  if (otpSentCard) otpSentCard.hidden = true;
  updateGoogleVisibility();
  syncGoogle();
}
otpForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!classEnabled && !teacherMode) {
    setClassVerified(true);
    return;
  }
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

    otpSentMsg.textContent = `Kode OTP 6 digit telah dikirim ke ${email} (demo: ${emailOtp}). Klik Verifikasi Email untuk konfirmasi terakhir.`;
    if (emailPreviewTo) emailPreviewTo.textContent = `kepada ${email}`;
    otpSentCard.hidden = false;
    if (emailVerifyBtn)
      emailVerifyBtn.href = `otp.html?email=${encodeURIComponent(email)}&t=${Date.now()}`;
    otpSentCard.scrollIntoView({ behavior: "smooth", block: "center" });
    googleBtn.textContent = "Terkirim ✓";
    googleBtn.disabled = true;

    const mailHtml = `<!doctype html><meta charset="utf-8"><div style="font-family:Inter,system-ui;padding:24px;max-width:520px;margin:auto;border:1px solid #ffe0c2;border-radius:16px"><div style="display:flex;align-items:center;gap:10px"><div style="width:44px;height:44px;border-radius:50%;background:#ff6b00;color:#fff;display:grid;place-items:center;font-weight:800">S</div><b>SIPIKET.EXPO</b><span style="margin-left:auto;color:#6b6b6b;font-size:12px">${new Date().toLocaleString("id-ID")}</span></div><h2 style="margin:16px 0 8px">Verifikasi email kamu</h2><p style="color:#6b6b6b">Hai ${name || email}, kode OTP: <b style="font-size:18px;color:#ff6b00">${emailOtp}</b></p><a href="${location.origin}/otp.html?email=${encodeURIComponent(email)}&t=${Date.now()}" style="display:inline-block;background:#ff6b00;color:#fff;padding:12px 20px;border-radius:100px;text-decoration:none;font-weight:700;margin-top:12px">Verifikasi Email Sekarang →</a><p style="font-size:12px;color:#6b6b6b;margin-top:14px">Link berlaku 10 menit. Data terenkripsi AES-GCM.</p></div>`;
    console.log(
      "%c[Email preview — kirim via backend saat production]",
      "color:#ff6b00;font-weight:bold",
      mailHtml,
    );
  } catch (err) {
    otpStatus.textContent = "Gagal memproses akun Google — coba lagi";
    otpStatus.style.color = "#d93025";
  }
};

function triggerGoogleChooser() {
  const id = getGisClientId();
  if (id && typeof google !== "undefined" && google.accounts?.id) {
    try {
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
  const demoEmail =
    "siswa" + Math.floor(Math.random() * 900 + 100) + "@gmail.com";
  const fakeCred = btoa(
    JSON.stringify({ email: demoEmail, name: "Siswa Demo", picture: "" }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  window.onGoogleCredential({
    credential: "eyJhbGciOiJIUzI1NiJ9." + fakeCred + ".sig",
  });
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
  otpSentMsg.textContent = `Kode OTP baru dikirim ke ${email} (demo: ${newOtp}).`;
  if (resendStatus) {
    resendStatus.textContent = "Terkirim! Cek email (demo OTP: " + newOtp + ")";
    resendStatus.style.color = "var(--orange)";
  }
  if (emailVerifyBtn)
    emailVerifyBtn.href = `otp.html?email=${encodeURIComponent(email)}&t=${Date.now()}`;
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
  if (pending) emailHint.textContent += " (demo: " + pending + ")";
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
      "Kode OTP salah — coba lagi (demo: " + expect + ")";
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
