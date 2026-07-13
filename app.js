// ---------- Helpers ----------
function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const MONATE_KURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseIso(iso) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); }
function fmtDate(iso) {
  if (!ISO_RE.test(iso || "")) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// Anders als beim Vereinskalender ist "bis" hier immer Pflichtfeld (nie
// optional) — ein Einzeltag ist von===bis, keine separate "kein Enddatum"-Logik
// nötig wie dort (kein abwesenheitEndIso()-Wrapper, a.bis direkt verwenden).
function isPast(a) { return a.bis < todayIso(); }
function isUpcoming(a) { return ISO_RE.test(a.von || "") && !isPast(a); }

function sortKey(a) { return `${a.von}_${a.bis}`; }

function monthKey(iso) { return iso.slice(0, 7); }
function monthLabel(iso) { const dt = parseIso(iso); return `${MONATE[dt.getMonth()]} ${dt.getFullYear()}`; }

// Datumsspanne kompakt: "17.08.2026" bzw. "17.–20.08.2026" / "28.02.–02.03.2026".
function abwesenheitDatumLabel(a) {
  const start = a.von, end = a.bis;
  if (end === start) return fmtDate(start);
  const [ys, ms, ds] = start.split("-"), [ye, me, de] = end.split("-");
  if (ys === ye && ms === me) return `${ds}.–${de}.${ms}.${ys}`;
  if (ys === ye) return `${ds}.${ms}.–${de}.${me}.${ys}`;
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}
function wochentagLabel(iso) { return WOCHENTAGE[parseIso(iso).getDay()]; }

function personName(a) {
  return (a.vorname || a.nachname) ? `${a.vorname || ""} ${a.nachname || ""}`.trim() : (a.erstelltVon || "Unbekannt");
}

// ---------- State ----------
let appData = { meta: {}, kategorien: [], abwesenheiten: [] };
let currentUser = null;
let editingId = null;

// ---------- Normalisierung & Lookups ----------
function normalizeData(data) {
  const d = data && typeof data === "object" ? data : {};
  return {
    meta: d.meta && typeof d.meta === "object" ? d.meta : {},
    kategorien: Array.isArray(d.kategorien) && d.kategorien.length ? d.kategorien : DEFAULT_ABWESENHEITSARTEN.slice(),
    abwesenheiten: Array.isArray(d.abwesenheiten) ? d.abwesenheiten.map(normalizeAbwesenheit) : []
  };
}
function normalizeAbwesenheit(a) {
  const d = a && typeof a === "object" ? a : {};
  return {
    id: typeof d.id === "string" && d.id ? d.id : uuid(),
    erstelltVon: typeof d.erstelltVon === "string" ? d.erstelltVon : "",
    vorname: typeof d.vorname === "string" ? d.vorname : "",
    nachname: typeof d.nachname === "string" ? d.nachname : "",
    von: ISO_RE.test(d.von || "") ? d.von : "",
    bis: ISO_RE.test(d.bis || "") ? d.bis : "",
    kategorie: typeof d.kategorie === "string" ? d.kategorie : "",
    notiz: typeof d.notiz === "string" ? d.notiz : "",
    erstelltAm: typeof d.erstelltAm === "string" ? d.erstelltAm : ""
  };
}
function kategorieById(id) { return appData.kategorien.find((k) => k.id === id) || null; }
function katFarbe(id) { const k = kategorieById(id); return k ? k.farbe : "#6b7280"; }
function katName(id) { const k = kategorieById(id); return k ? k.name : "—"; }

// ---------- Rechte / Nutzer ----------
// Bearbeiten-Recht (editGroupIds, serverseitig aufgelöst über fetchMe) erlaubt
// die Verwaltung ALLER Einträge. Alle anderen eingeloggten Nutzer dürfen NUR
// ihre eigenen Einträge anlegen/ändern/löschen (Selbstbedienung) — sehen aber
// (anders als z.B. Fahrtenbuch/Materialbedarf) die komplette Übersicht aller
// Einträge, siehe canManageEintrag/renderTermine. Serverseitig durchgesetzt
// über OWNER_WRITE_APPS in admin-worker.js, siehe persistAbwesenheiten().
function canEdit() {
  if (!currentUser) return false;
  return currentUser.isAdmin || !!currentUser.canEdit;
}
function myUsername() { return currentUser ? currentUser.username : ""; }
function canManageEintrag(a) {
  return canEdit() || !!(a.erstelltVon && a.erstelltVon === myUsername());
}

function renderHeaderUser() {
  const el = document.getElementById("header-user");
  const el2 = document.getElementById("info-user");
  if (!currentUser) { if (el) el.textContent = ""; if (el2) el2.textContent = ""; return; }
  const name = (currentUser.vorname || currentUser.nachname)
    ? `${currentUser.vorname || ""} ${currentUser.nachname || ""}`.trim()
    : currentUser.username;
  const rolle = currentUser.isAdmin ? " (Admin)" : (canEdit() ? " (Bearbeiter)" : "");
  if (el) el.textContent = "👤 " + name + rolle;
  if (el2) el2.textContent = "Angemeldet als " + name + rolle;
}

function applyAdminVisibility() {
  const editable = canEdit();
  document.body.classList.toggle("can-edit", editable);
  document.querySelectorAll(".editor-only").forEach((el) => el.classList.toggle("hidden", !editable));
}

// ---------- Render: Abwesenheiten ----------
function abwesenheitCardHtml(a, isHero) {
  const start = a.von, end = a.bis;
  const dt = parseIso(start);
  const dayBadge = `<span class="tc-day">${dt.getDate()}</span><span class="tc-mon">${MONATE_KURZ[dt.getMonth()]}</span>` +
    (end !== start ? `<span class="tc-range">bis ${fmtDate(end)}</span>` : "");
  const farbe = katFarbe(a.kategorie);
  const notiz = a.notiz ? `<div class="tc-notiz">${escapeHtml(a.notiz)}</div>` : "";
  const eigen = a.erstelltVon === myUsername() ? `<span class="tc-badge tc-badge-own">Eigener Eintrag</span>` : "";
  const mine = canManageEintrag(a);
  return `
    <div class="termin-card${isHero ? " is-hero" : ""}${mine ? " is-mine" : ""}" data-id="${escapeHtml(a.id)}" style="--kat:${escapeHtml(farbe)}">
      ${isHero ? `<div class="hero-label">Nächste Abwesenheit</div>` : ""}
      <div class="tc-inner">
        <div class="tc-date">${dayBadge}</div>
        <div class="tc-body">
          <div class="tc-top">
            <span class="kat-chip"><span class="kat-dot" style="background:${escapeHtml(farbe)}"></span>${escapeHtml(katName(a.kategorie))}</span>
            ${eigen}
          </div>
          <div class="tc-title">${escapeHtml(personName(a))}</div>
          <div class="tc-sub tc-datespan">📅 ${escapeHtml(wochentagLabel(start))}, ${escapeHtml(abwesenheitDatumLabel(a))}</div>
          ${notiz}
        </div>
      </div>
    </div>`;
}

function renderTermine() {
  // Voller Lesezugriff für alle mit Tool-Zugriff -- KEIN Sichtbarkeitsfilter wie
  // Vereinskalenders terminVisibleFor() (bewusst, siehe CLAUDE.md: die ganze App
  // dreht sich darum, dass alle sehen, wer abwesend ist).
  const upcoming = appData.abwesenheiten.filter(isUpcoming).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const heroEl = document.getElementById("hero");
  const listEl = document.getElementById("termin-list");
  const emptyEl = document.getElementById("termine-empty");
  const countEl = document.getElementById("termine-count");
  const weitereEl = document.getElementById("weitere-heading");

  countEl.textContent = upcoming.length
    ? `${upcoming.length} anstehende Abwesenheit${upcoming.length === 1 ? "" : "en"}`
    : "";

  if (upcoming.length === 0) {
    heroEl.innerHTML = "";
    listEl.innerHTML = "";
    weitereEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  heroEl.innerHTML = abwesenheitCardHtml(upcoming[0], true);

  const rest = upcoming.slice(1);
  weitereEl.classList.toggle("hidden", rest.length === 0);

  let html = "";
  let lastMonth = null;
  rest.forEach((a) => {
    const mk = monthKey(a.von);
    if (mk !== lastMonth) {
      html += `<div class="month-heading">${escapeHtml(monthLabel(a.von))}</div>`;
      lastMonth = mk;
    }
    html += abwesenheitCardHtml(a, false);
  });
  listEl.innerHTML = html;
}

function renderVersionInfo() {
  document.querySelectorAll("#version-badge, #version-badge-2").forEach((el) => { if (el) el.textContent = "v" + APP_VERSION; });
  const list = document.getElementById("changelog-list");
  if (!list) return;
  list.innerHTML = APP_CHANGELOG.map((entry) => `
    <div class="changelog-entry">
      <div class="cv">Version ${escapeHtml(entry.version)}</div>
      ${entry.groups.map((g) => `
        <div class="changelog-group">
          <div class="cg-title">${escapeHtml(g.title)}</div>
          <ul class="cg-items">${g.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </div>`).join("")}
    </div>`).join("");
}

function renderAll() {
  renderTermine();
  renderVersionInfo();
  renderKategorien();
}

// ---------- Tabs ----------
function switchTab(tab) {
  document.querySelectorAll("nav button[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.toggle("active", s.id === "tab-" + tab));
}

function fillSelect(el, options) {
  if (!el) return;
  el.innerHTML = options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("");
}

// ---------- Abwesenheits-Formular ----------
function setFormDisabled(disabled) {
  ["tf-von", "tf-bis", "tf-kategorie", "tf-notiz"].forEach((id) => { document.getElementById(id).disabled = disabled; });
}

function openTerminModal(idOrNew) {
  const a = (typeof idOrNew === "string") ? appData.abwesenheiten.find((x) => x.id === idOrNew) : null;
  if (a && !canManageEintrag(a)) { openTerminModalReadOnly(a); return; }

  editingId = a ? a.id : null;
  fillSelect(document.getElementById("tf-kategorie"), appData.kategorien.map((k) => ({ value: k.id, label: k.name })));

  document.getElementById("tf-von").value = a ? (a.von || "") : todayIso();
  document.getElementById("tf-bis").value = a ? (a.bis || "") : todayIso();
  document.getElementById("tf-kategorie").value = a ? a.kategorie : (appData.kategorien[0] ? appData.kategorien[0].id : "sonstiges");
  document.getElementById("tf-notiz").value = a ? (a.notiz || "") : "";
  setFormDisabled(false);

  const personLabel = document.getElementById("tf-person-label");
  if (a && a.erstelltVon !== myUsername()) {
    personLabel.textContent = "Person: " + personName(a);
    personLabel.classList.remove("hidden");
  } else {
    personLabel.classList.add("hidden");
  }

  document.getElementById("termin-modal-title").textContent = a ? "Abwesenheit bearbeiten" : "Neue Abwesenheit";
  document.getElementById("btn-delete-termin").classList.toggle("hidden", !a);
  document.getElementById("btn-save-termin").classList.remove("hidden");
  document.getElementById("termin-modal").classList.remove("hidden");
  document.getElementById("tf-von").focus();
}

// Fremder Eintrag (nicht eigene, kein Bearbeiter-Recht): read-only anzeigen --
// volle Transparenz (jede:r sieht alle Abwesenheiten), aber keine
// Bearbeitungsmöglichkeit. Speichern/Löschen-Buttons bleiben versteckt.
function openTerminModalReadOnly(a) {
  editingId = a.id;
  fillSelect(document.getElementById("tf-kategorie"), appData.kategorien.map((k) => ({ value: k.id, label: k.name })));
  document.getElementById("tf-von").value = a.von || "";
  document.getElementById("tf-bis").value = a.bis || "";
  document.getElementById("tf-kategorie").value = a.kategorie;
  document.getElementById("tf-notiz").value = a.notiz || "";
  setFormDisabled(true);

  const personLabel = document.getElementById("tf-person-label");
  personLabel.textContent = "Person: " + personName(a);
  personLabel.classList.remove("hidden");

  document.getElementById("termin-modal-title").textContent = "Abwesenheit ansehen";
  document.getElementById("btn-delete-termin").classList.add("hidden");
  document.getElementById("btn-save-termin").classList.add("hidden");
  document.getElementById("termin-modal").classList.remove("hidden");
}

function closeTerminModal() {
  document.getElementById("termin-modal").classList.add("hidden");
  setFormDisabled(false);
  editingId = null;
}

async function saveTermin() {
  const von = document.getElementById("tf-von").value;
  const bis = document.getElementById("tf-bis").value;
  const kategorie = document.getElementById("tf-kategorie").value;
  const notiz = document.getElementById("tf-notiz").value.trim();

  if (!ISO_RE.test(von)) { alert("Bitte ein gültiges Von-Datum wählen."); return; }
  if (!ISO_RE.test(bis)) { alert("Bitte ein gültiges Bis-Datum wählen."); return; }
  if (bis < von) { alert("Das Bis-Datum darf nicht vor dem Von-Datum liegen."); return; }
  if (!kategorie) { alert("Bitte eine Art auswählen."); return; }

  const btn = document.getElementById("btn-save-termin");
  btn.disabled = true;
  setSaveStatus("Speichern…", "pending");
  try {
    let a = editingId ? appData.abwesenheiten.find((x) => x.id === editingId) : null;
    if (a && !canManageEintrag(a)) { closeTerminModal(); return; } // Sicherheitsnetz, UI verhindert das schon
    const isNew = !a;
    if (!a) {
      a = {
        id: uuid(),
        erstelltVon: myUsername(),
        vorname: currentUser ? (currentUser.vorname || "") : "",
        nachname: currentUser ? (currentUser.nachname || "") : ""
      };
      appData.abwesenheiten.push(a);
    }
    a.von = von;
    a.bis = bis;
    a.kategorie = kategorie;
    a.notiz = notiz || undefined;
    if (isNew) a.erstelltAm = new Date().toISOString();

    await persistAbwesenheiten();
    renderAll();
    closeTerminModal();
  } catch (e) {
    if (e instanceof ConflictError) { await reloadAfterConflict(); }
    else if (e instanceof NotLoggedInError) { showConnectScreen("Sitzung abgelaufen — bitte neu anmelden."); }
    else { console.error("Speichern fehlgeschlagen", e); setSaveStatus("Nicht gespeichert", "error"); alert("Speichern fehlgeschlagen: " + e.message); }
  } finally {
    btn.disabled = false;
  }
}

async function deleteTermin() {
  if (!editingId) return;
  const a = appData.abwesenheiten.find((x) => x.id === editingId);
  if (a && !canManageEintrag(a)) { closeTerminModal(); return; } // Sicherheitsnetz, UI verhindert das schon
  if (!confirm("Diese Abwesenheit wirklich löschen?")) return;
  setSaveStatus("Löschen…", "pending");
  try {
    appData.abwesenheiten = appData.abwesenheiten.filter((x) => x.id !== editingId);
    await persistAbwesenheiten();
    renderAll();
    closeTerminModal();
  } catch (e) {
    if (e instanceof ConflictError) { await reloadAfterConflict(); }
    else { console.error("Löschen fehlgeschlagen", e); setSaveStatus("Nicht gespeichert", "error"); alert("Löschen fehlgeschlagen: " + e.message); }
  }
}

// ---------- Vergangene Abwesenheiten automatisch aufräumen (nur Bearbeiter) ----------
// Wie beim Vereinskalender läuft das Aufräumen nur, wenn ein Bearbeiter-Gruppen-
// Mitglied die App öffnet -- akzeptierte Grenze, siehe CLAUDE.md. Kein
// Datei-Anhang-Cleanup nötig (keine Anhänge in dieser App).
async function purgePastEvents() {
  if (!canEdit()) return;
  const past = appData.abwesenheiten.filter(isPast);
  if (past.length === 0) return;
  appData.abwesenheiten = appData.abwesenheiten.filter((a) => !isPast(a));
  try {
    await persistAbwesenheiten();
  } catch (e) {
    console.warn("Aufräumen vergangener Abwesenheiten konnte nicht gespeichert werden", e);
  }
}

// ---------- Abwesenheitsarten-Verwaltung (Einstellungen-Tab, nur Bearbeiter) ----------
function renderKategorien() {
  const el = document.getElementById("kategorie-list");
  if (!el) return;
  el.innerHTML = appData.kategorien.map((k) => `
    <div class="kategorie-row" data-id="${escapeHtml(k.id)}">
      <input type="color" class="kat-farbe-input" data-id="${escapeHtml(k.id)}" value="${escapeHtml(k.farbe)}" title="Farbe" />
      <input type="text" class="kat-name-input" data-id="${escapeHtml(k.id)}" value="${escapeHtml(k.name)}" maxlength="60" />
      <button type="button" class="kategorie-remove" data-id="${escapeHtml(k.id)}" aria-label="Art löschen">×</button>
    </div>
  `).join("");
}

async function saveKategorien() {
  setSaveStatus("Speichern…", "pending");
  try {
    await persistAbwesenheiten();
    renderAll();
  } catch (e) {
    if (e instanceof ConflictError) { await reloadAfterConflict(); }
    else if (e instanceof NotLoggedInError) { showConnectScreen("Sitzung abgelaufen — bitte neu anmelden."); }
    else { console.error("Speichern fehlgeschlagen", e); setSaveStatus("Nicht gespeichert", "error"); alert("Speichern fehlgeschlagen: " + e.message); }
  }
}

async function addKategorie() {
  const nameInput = document.getElementById("neue-kategorie-name");
  const farbeInput = document.getElementById("neue-kategorie-farbe");
  const name = nameInput.value.trim();
  if (!name) { alert("Bitte einen Namen für die Abwesenheitsart eingeben."); return; }
  appData.kategorien.push({ id: uuid(), name, farbe: farbeInput.value });
  nameInput.value = "";
  farbeInput.value = "#6b7280";
  await saveKategorien();
}

async function onKategorieFieldChange(e) {
  const id = e.target.dataset.id;
  const k = id ? kategorieById(id) : null;
  if (!k) return;
  if (e.target.classList.contains("kat-name-input")) {
    const name = e.target.value.trim();
    if (!name) { e.target.value = k.name; return; }
    k.name = name;
  } else if (e.target.classList.contains("kat-farbe-input")) {
    k.farbe = e.target.value;
  } else {
    return;
  }
  await saveKategorien();
}

async function onKategorieListClick(e) {
  const btn = e.target.closest(".kategorie-remove");
  if (!btn) return;
  const k = kategorieById(btn.dataset.id);
  if (!k) return;
  const used = appData.abwesenheiten.filter((a) => a.kategorie === k.id).length;
  const hinweis = used > 0 ? ` Sie wird aktuell bei ${used} Abwesenheit${used === 1 ? "" : "en"} verwendet (diese zeigen danach keine Art mehr an).` : "";
  if (!confirm(`Art "${k.name}" wirklich löschen?${hinweis}`)) return;
  appData.kategorien = appData.kategorien.filter((x) => x.id !== k.id);
  await saveKategorien();
}

// ---------- Gateway: Speichern / Konflikte ----------
function setSaveStatus(text, kind) {
  const el = document.getElementById("save-status");
  if (!el) return;
  el.textContent = text;
  el.className = "header-status" + (kind ? " is-" + kind : "");
}

// Bearbeiter speichern das volle Dokument inkl. rev/ETag-Konfliktschutz (wie
// Vereinskalender). Nicht-Bearbeiter dürfen serverseitig nur ihre eigenen
// Einträge schreiben (admin-worker.js OWNER_WRITE_APPS/handleOwnerFilteredSave)
// -- anders als bei Apps mit OWNER_FILTERED_APPS enthält appData.abwesenheiten
// hier aber AUCH fremde Einträge (voller Lesezugriff), daher MUSS hier lokal
// auf eigene Einträge gefiltert werden, bevor überhaupt etwas gesendet wird,
// sonst 400 "fremde oder ungültige Einträge". Kein rev nötig (der Worker mergt
// bei diesem Pfad immer frisch gegen den aktuellen Serverstand, ein evtl.
// mitgeschicktes rev wird von handleOwnerFilteredSave ignoriert) -- nach Erfolg
// wird der echte gemergte Stand (inkl. aller fremden Einträge) neu geladen,
// damit appData wieder synchron ist.
async function persistAbwesenheiten() {
  if (canEdit()) {
    appData.meta = Object.assign({}, appData.meta, { stand: new Date().toISOString() });
    await gatewaySave(appData);
  } else {
    const eigene = appData.abwesenheiten.filter((a) => a.erstelltVon === myUsername());
    await gatewaySave({ abwesenheiten: eigene });
    appData = normalizeData(await gatewayLoad());
  }
  const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  setSaveStatus("Gespeichert " + time, "ok");
}

async function reloadAfterConflict() {
  try {
    const data = await gatewayLoad();
    appData = normalizeData(data);
    renderAll();
    setSaveStatus("Von anderem Gerät aktualisiert", "");
    alert("Die Daten wurden zwischenzeitlich auf einem anderen Gerät geändert — die aktuelle Version wurde neu geladen. Bitte die letzte Änderung bei Bedarf erneut vornehmen.");
  } catch (e) {
    console.error("Neuladen nach Konflikt fehlgeschlagen", e);
  }
  closeTerminModal();
}

// ---------- Start ----------
function showConnectScreen(errorMsg) {
  document.getElementById("connect-screen").style.display = "";
  document.getElementById("app-shell").style.display = "none";
  document.getElementById("cloud-error").textContent = errorMsg ? "Fehler: " + errorMsg : "";
}

async function startApp() {
  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "";
  try { currentUser = await fetchMe(); } catch (_) { /* best effort */ }
  renderHeaderUser();
  applyAdminVisibility();
  renderVersionInfo();
  await purgePastEvents();
  renderAll();
}

async function init() {
  setupListeners();
  if (!getSessionToken()) { showConnectScreen(); return; }
  try {
    const data = await gatewayLoad();
    appData = normalizeData(data);
    await startApp();
  } catch (e) {
    if (e instanceof NotLoggedInError) { showConnectScreen(); return; }
    console.error("Nextcloud-Zugriff über Login fehlgeschlagen", e);
    showConnectScreen(e.message);
  }
}

function setupListeners() {
  document.querySelectorAll("nav button[data-tab]").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

  const versionBadgeHeader = document.getElementById("version-badge");
  versionBadgeHeader.addEventListener("click", () => switchTab("info"));
  versionBadgeHeader.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); switchTab("info"); }
  });

  // "+ Neue Abwesenheit" ist für ALLE eingeloggten Nutzer sichtbar (Selbstbedienung),
  // nicht editor-only wie beim Vereinskalender.
  document.getElementById("btn-new-termin").addEventListener("click", () => openTerminModal(null));

  // Jede Karte antippen -> bearbeiten (eigene/als Bearbeiter) oder read-only
  // ansehen (fremde), siehe openTerminModal.
  document.getElementById("hero").addEventListener("click", onCardClick);
  document.getElementById("termin-list").addEventListener("click", onCardClick);

  document.getElementById("termin-modal-close").addEventListener("click", closeTerminModal);
  document.getElementById("btn-cancel-termin").addEventListener("click", closeTerminModal);
  document.getElementById("btn-save-termin").addEventListener("click", saveTermin);
  document.getElementById("btn-delete-termin").addEventListener("click", deleteTermin);
  document.getElementById("termin-modal").addEventListener("click", (e) => { if (e.target.id === "termin-modal") closeTerminModal(); });
  document.getElementById("termin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!document.getElementById("btn-save-termin").classList.contains("hidden")) saveTermin();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("termin-modal").classList.contains("hidden")) closeTerminModal();
  });

  // Abwesenheitsarten-Verwaltung (Einstellungen-Tab)
  document.getElementById("btn-kategorie-add").addEventListener("click", addKategorie);
  document.getElementById("kategorie-list").addEventListener("change", onKategorieFieldChange);
  document.getElementById("kategorie-list").addEventListener("click", onKategorieListClick);
}

function onCardClick(e) {
  const card = e.target.closest(".termin-card");
  if (card) openTerminModal(card.dataset.id);
}

document.addEventListener("DOMContentLoaded", init);
