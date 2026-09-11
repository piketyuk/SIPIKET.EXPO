const SECURE_SALT = new TextEncoder().encode("sipiket-v1-salt-ixf");
let _key = null;
async function getKey() {
  if (_key) return _key;
  const enc = new TextEncoder();
  const mat = await crypto.subtle.importKey(
    "raw",
    enc.encode((location.hostname + "-sipiket-ixf-2026")),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  _key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SECURE_SALT, iterations: 120000, hash: "SHA-256" },
    mat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return _key;
}
function buf2b64(b) {
  return btoa(String.fromCharCode(...new Uint8Array(b)));
}
function b642buf(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
}
async function secureSet(k, v) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(v)),
  );
  localStorage.setItem(
    "enc_" + k,
    JSON.stringify({ iv: buf2b64(iv), ct: buf2b64(ct) }),
  );
}
async function secureGet(k) {
  const raw = localStorage.getItem("enc_" + k);
  if (!raw) return null;
  try {
    const { iv, ct } = JSON.parse(raw);
    const key = await getKey();
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(b642buf(iv)) },
      key,
      b642buf(ct),
    );
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}
function secureRemove(k) {
  localStorage.removeItem("enc_" + k);
}
async function secureSessionSet(k, v) {
  sessionStorage.setItem(k, JSON.stringify(v));
}
