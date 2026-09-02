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
// Mitglieder der Bearbeiter-Gruppen für den "Vertreter"-Picker im Formular --
// [{username,displayName}] | null solange nicht geladen, siehe ensureEditorsLoaded.
let editorUsers = null;

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
    vertreterUsername: typeof d.vertreterUsername === "string" ? d.vertreterUsername : "",
    vertreterName: typeof d.vertreterName === "string" ? d.vertreterName : "",
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
// Administrieren-Ebene: Kategorien-Verwaltung (Einstellungen-Tab) ist Administratoren
// vorbehalten; Abwesenheiten selbst pflegen bleibt Bearbeiten-Sache (2026-07-24).
function canAdmin() {
  if (!currentUser) return false;
  return currentUser.isAdmin || !!currentUser.canAdmin;
}
function myUsername() { return currentUser ? currentUser.username : ""; }
function canManageEintrag() {
  // Seit 2026-07-24 (2. Runde, Michel): Sehen = absolut nichts editierbar. Früher durfte
  // jeder seine EIGENEN Einträge anlegen/ändern/löschen (canEdit() || eigener) -- jetzt
  // nur noch Bearbeiter. Serverseitig zusätzlich via WRITE_REQUIRES_EDIT_PERMISSION.
  return canEdit();
}

// Lädt einmalig die Mitglieder der Bearbeiter-Gruppen dieser App (für den
// "Vertreter"-Picker) -- Fehler werden geschluckt (leere Liste), damit ein
// nicht ladbares Verzeichnis nicht das ganze Formular blockiert.
// Merkt sich den LAUFENDEN Ladevorgang, nicht nur das Ergebnis: init() stoesst
// die Vertreter-Liste parallel zu gatewayLoad() an, startApp() wartet danach nur
// noch auf dieselbe Promise statt einen zweiten Aufruf loszuschicken. Vorher
// lief list-tool-editors erst NACH dav-load an -- ein voller Roundtrip
// (~180 ms), den jeder Nutzer vor dem ersten Bild abwartete, obwohl keiner der
// beiden Aufrufe den anderen braucht. Gleiches Muster wie ladePdfLib in raumnutzung.
let editorsLadevorgang = null;
async function ensureEditorsLoaded() {
  if (editorUsers) return;
  if (editorsLadevorgang) return editorsLadevorgang;
  editorsLadevorgang = (async () => {
    try {
      const res = await fetchToolEditors();
      editorUsers = Array.isArray(res.users) ? res.users : [];
    } catch (e) {
      console.warn("Vertreter-Liste konnte nicht geladen werden", e);
      editorUsers = [];
    } finally {
      editorsLadevorgang = null;
    }
  })();
  return editorsLadevorgang;
}

// Eigentümer des Formulars: bei einer bestehenden Abwesenheit deren erstelltVon
// (bleibt beim Bearbeiten durch einen Bearbeiter unverändert -- niemand kann
// eine Abwesenheit "im Namen von" jemand anderem anlegen, siehe CLAUDE.md),
// bei einer neuen Abwesenheit der aktuell eingeloggte Nutzer.
function formOwnerUsername() {
  if (!editingId) return myUsername();
  const a = appData.abwesenheiten.find((x) => x.id === editingId);
  return a ? a.erstelltVon : myUsername();
}

// Prüft, ob eine Person im angegebenen Zeitraum bereits selbst abwesend ist
// (beliebige Art) -- verhindert, dass jemand als Vertreter ausgewählt werden
// kann, der im selben Zeitraum z.B. ebenfalls Urlaub hat. excludeId blendet
// die gerade bearbeitete Abwesenheit selbst aus dem Abgleich aus.
function personHasOverlap(username, von, bis, excludeId) {
  if (!ISO_RE.test(von) || !ISO_RE.test(bis)) return false;
  return appData.abwesenheiten.some((a) =>
    a.id !== excludeId && a.erstelltVon === username &&
    ISO_RE.test(a.von) && ISO_RE.test(a.bis) && a.von <= bis && von <= a.bis
  );
}

// Vertreter-Auswahlliste: ohne den Formular-Eigentümer (sich selbst vertreten
// ergibt keinen Sinn) und ohne Personen, die im aktuell im Formular stehenden
// Zeitraum selbst schon abwesend sind (personHasOverlap). Inkl. Platzhalter-
// Option, da das Feld optional ist. Eine bisher gewählte Person, die
// zwischenzeitlich aus den Bearbeiter-Gruppen entfernt wurde, bleibt als
// Zusatzoption erhalten (damit ein unbeteiligtes Speichern z.B. nur der Notiz
// die bestehende Zuordnung nicht stillschweigend löscht) -- ABER nur, wenn sie
// nicht zusätzlich auch noch überschneidend abwesend ist; ein echter
// Terminkonflikt setzt die Auswahl dagegen zurück auf "keiner ausgewählt".
function fillVertreterSelect(selectedUsername, selectedName) {
  const el = document.getElementById("tf-vertreter");
  const von = document.getElementById("tf-von").value;
  const bis = document.getElementById("tf-bis").value;
  const owner = formOwnerUsername();
  const isEditorMember = (u) => (editorUsers || []).some((x) => x.username === u);
  const available = (editorUsers || [])
    .filter((u) => u.username !== owner)
    .filter((u) => !personHasOverlap(u.username, von, bis, editingId));

  let html = `<option value="">— keiner ausgewählt —</option>`;
  let finalValue = "";
  if (selectedUsername) {
    if (available.some((u) => u.username === selectedUsername)) {
      finalValue = selectedUsername;
    } else if (!isEditorMember(selectedUsername) && !personHasOverlap(selectedUsername, von, bis, editingId)) {
      html += `<option value="${escapeHtml(selectedUsername)}">${escapeHtml(selectedName || selectedUsername)}</option>`;
      finalValue = selectedUsername;
    }
    // sonst: echter Konflikt (überschneidend abwesend) -- Auswahl wird zurückgesetzt.
  }
  html += available.map((u) => `<option value="${escapeHtml(u.username)}">${escapeHtml(u.displayName)}</option>`).join("");
  el.innerHTML = html;
  el.value = finalValue;
}

// Live-Neuberechnung, wenn Von/Bis im offenen Formular geändert werden --
// bereits gewählte Person bleibt erhalten, sofern sie im neuen Zeitraum nicht
// überschneidend abwesend ist (siehe fillVertreterSelect).
function onVertreterRelevantFieldChange() {
  const sel = document.getElementById("tf-vertreter");
  if (sel.disabled) return; // read-only Ansicht: keine Neuberechnung nötig
  const currentValue = sel.value;
  const currentText = (currentValue && sel.selectedIndex >= 0) ? sel.options[sel.selectedIndex].textContent : "";
  fillVertreterSelect(currentValue, currentText);
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
  const admin = canAdmin();
  document.body.classList.toggle("can-edit", editable);
  document.querySelectorAll(".editor-only").forEach((el) => el.classList.toggle("hidden", !editable));
  // .admin-only (Einstellungen-Tab = Kategorien-Verwaltung) nur mit Administrieren-Recht.
  document.querySelectorAll(".admin-only").forEach((el) => el.classList.toggle("hidden", !admin));
}

// ---------- Render: Abwesenheiten ----------
function abwesenheitCardHtml(a, isHero) {
  const start = a.von, end = a.bis;
  const dt = parseIso(start);
  const dayBadge = `<span class="tc-day">${dt.getDate()}</span><span class="tc-mon">${MONATE_KURZ[dt.getMonth()]}</span>` +
    (end !== start ? `<span class="tc-range">bis ${fmtDate(end)}</span>` : "");
  const farbe = katFarbe(a.kategorie);
  const vertretung = a.vertreterUsername ? `<div class="tc-sub">🔁 Vertretung: ${escapeHtml(a.vertreterName || a.vertreterUsername)}</div>` : "";
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
          ${vertretung}
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
  document.querySelectorAll("#version-badge-2").forEach((el) => { if (el) el.textContent = "v" + APP_VERSION; });
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
  if (bildschirmGeraeumt) return;
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
  ["tf-von", "tf-bis", "tf-kategorie", "tf-vertreter", "tf-notiz"].forEach((id) => { document.getElementById(id).disabled = disabled; });
}

async function openTerminModal(idOrNew) {
  const a = (typeof idOrNew === "string") ? appData.abwesenheiten.find((x) => x.id === idOrNew) : null;
  if (a && !canManageEintrag(a)) { await openTerminModalReadOnly(a); return; }

  editingId = a ? a.id : null;
  fillSelect(document.getElementById("tf-kategorie"), appData.kategorien.map((k) => ({ value: k.id, label: k.name })));

  document.getElementById("tf-von").value = a ? (a.von || "") : todayIso();
  document.getElementById("tf-bis").value = a ? (a.bis || "") : todayIso();
  document.getElementById("tf-kategorie").value = a ? a.kategorie : (appData.kategorien[0] ? appData.kategorien[0].id : "sonstiges");
  document.getElementById("tf-notiz").value = a ? (a.notiz || "") : "";
  setFormDisabled(false);

  // Erst NACH dem Setzen von Von/Bis füllen -- fillVertreterSelect liest den
  // aktuellen Zeitraum aus dem Formular, um überschneidend Abwesende auszuschließen.
  await ensureEditorsLoaded();
  fillVertreterSelect(a ? a.vertreterUsername : "", a ? a.vertreterName : "");

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
async function openTerminModalReadOnly(a) {
  editingId = a.id;
  fillSelect(document.getElementById("tf-kategorie"), appData.kategorien.map((k) => ({ value: k.id, label: k.name })));
  document.getElementById("tf-von").value = a.von || "";
  document.getElementById("tf-bis").value = a.bis || "";
  document.getElementById("tf-kategorie").value = a.kategorie;
  document.getElementById("tf-notiz").value = a.notiz || "";
  setFormDisabled(true);
  await ensureEditorsLoaded();
  fillVertreterSelect(a.vertreterUsername, a.vertreterName);

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
  const vertreterUsername = document.getElementById("tf-vertreter").value;
  const notiz = document.getElementById("tf-notiz").value.trim();

  if (!ISO_RE.test(von)) { alert("Bitte ein gültiges Von-Datum wählen."); return; }
  if (!ISO_RE.test(bis)) { alert("Bitte ein gültiges Bis-Datum wählen."); return; }
  if (bis < von) { alert("Das Bis-Datum darf nicht vor dem Von-Datum liegen."); return; }
  if (!kategorie) { alert("Bitte eine Art auswählen."); return; }

  // Anzeigename des gewählten Vertreters für die Karten-Anzeige einfangen (siehe
  // fillVertreterSelect -- die Option kann auch aus der "bereits gewählt, aber
  // nicht mehr Bearbeiter"-Sonderoption stammen, deshalb aus dem DOM lesen statt
  // erneut in editorUsers nachzuschlagen).
  const vertreterSelectEl = document.getElementById("tf-vertreter");
  const vertreterName = vertreterUsername
    ? (vertreterSelectEl.options[vertreterSelectEl.selectedIndex].textContent || vertreterUsername)
    : "";

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
    a.vertreterUsername = vertreterUsername || undefined;
    a.vertreterName = vertreterUsername ? vertreterName : undefined;
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
//
// Es darf dabei immer nur EIN Schreibvorgang unterwegs sein — und zwar für BEIDE
// Pfade gemeinsam: gatewayRev (das ETag, mit dem der Worker Konflikte erkennt)
// wird erst aktualisiert, wenn ein Save zurückkommt, ein zweiter Save, der
// währenddessen startet, schickt also dasselbe, inzwischen veraltete ETag und
// wird zwangsläufig mit 409 abgelehnt. Für die bearbeitende Person sah das aus
// wie "ein anderes Gerät hat geändert", obwohl sie allein war, und
// reloadAfterConflict() verwarf dabei ihre letzte Eingabe. Beim Selbstbedienungs-
// Pfad gibt es zwar kein rev, dafür würde ein zweiter Save gegen das nach dem
// ersten frisch geladene appData laufen bzw. das Neuladen mitten in den nächsten
// Save fallen — auch das darf sich nicht überholen. Deshalb laufen beide Pfade
// durch dieselbe Schleife: persistAbwesenheiten() merkt nur vor,
// writeToGateway() entscheidet pro Durchlauf neu, welcher Pfad greift, und
// Änderungen, die während eines laufenden Saves anfallen, werden danach in einem
// Rutsch nachgeschrieben. Fehler werden weiterhin an die Aufrufer geworfen — die
// ConflictError-/NotLoggedInError-Behandlung liegt dort und bleibt unverändert.
let saveRunner = null;
let saveDirty = false;
// Für das Sicherheitsnetz beim Verlassen der Seite (beforeunload unten).
let ungespeicherteAenderungen = false;
let letzterSaveFehlgeschlagen = false;
function persistAbwesenheiten() {
  saveDirty = true;
  ungespeicherteAenderungen = true;
  if (!saveRunner) saveRunner = runSaveLoop().finally(() => { saveRunner = null; });
  return saveRunner;
}
async function runSaveLoop() {
  while (saveDirty) {
    saveDirty = false;
    try {
      await writeToGateway();
    } catch (e) {
      // Bei Konflikt/Fehler lädt der Aufrufer den Stand neu bzw. zeigt den
      // Login-Screen — dann NICHT blind nachschreiben, das würde den fremden
      // Stand wieder überbügeln.
      saveDirty = false;
      letzterSaveFehlgeschlagen = true;
      throw e;
    }
  }
  ungespeicherteAenderungen = false;
  letzterSaveFehlgeschlagen = false;
}

// Sicherheitsnetz beim Verlassen der Seite: ein laufender fetch wird beim
// Entladen abgebrochen, der keepalive-Request überlebt das Schließen des Tabs.
// Die Nutzlast muss dieselbe Weiche nehmen wie writeToGateway() — ein
// Nicht-Bearbeiter darf nur die eigenen Einträge schicken, sonst antwortet der
// Worker mit 400 "fremde oder ungültige Einträge" und der Rettungsversuch wäre
// wirkungslos. Nachgefragt wird nur, wenn der Beacon nicht trägt.
window.addEventListener("beforeunload", (e) => {
  if (!ungespeicherteAenderungen) return;
  const nutzlast = canEdit()
    ? appData
    : { abwesenheiten: appData.abwesenheiten.filter((a) => a.erstelltVon === myUsername()) };
  const abgeschickt = gatewaySaveBeacon(nutzlast);
  if (abgeschickt && !letzterSaveFehlgeschlagen) return;
  e.preventDefault();
  e.returnValue = "";
});
async function writeToGateway() {
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
// ---------- Sitzungsverlust: räumen, nicht nur verstecken ----------

// ⚠️ Verstecken ist nicht Räumen. Fällt die Sitzung weg, WÄHREND die App
// offen ist, steht bereits alles auf dem Bildschirm. display:none macht das
// unsichtbar, nicht weg -- Namen, Nummern und ausgefüllte Formularfelder sind
// im Seitenquelltext weiter lesbar.
//
// ⚠️ Über die CONTAINER räumen, nie über eine Id-Liste. Eine Liste veraltet
// lautlos: wer später ein Feld ergänzt, müsste daran denken, und genau das eine
// bliebe stehen.
//
// ⚠️ Dialoge, Druckbereich und Bild-Lightbox stehen NEBEN der Hülle, nicht
// darin -- ihr innerHTML erwischt sie nicht. Ein offener Dialog ist dabei der
// schlimmste Fall: er steht nicht nur gespeichert, sondern SICHTBAR da.
//
// ⚠️ #header-user steht in einigen Apps im Seitenkopf und damit ebenfalls
// außerhalb. Der Rest des Kopfes (Titel, Logo, Zurück-Link) bleibt absichtlich:
// ohne ihn stünde man vor einer weißen Seite ohne Weg zurück.
//
// Wegwerfen ist gefahrlos: zurück in die App geht es ausschließlich über ein
// Neuladen der Seite. Wer sich neu anmeldet, bekommt sie ohnehin frisch.
let bildschirmGeraeumt = false;

// Vor dem ersten Aufbau gibt es nichts zu räumen -- und wer gar nicht angemeldet
// ist, soll nicht "Sitzung abgelaufen" lesen. Gesetzt wird das erst, wenn die
// Hülle wirklich sichtbar wird.
let appLaeuft = false;

function raeumeBildschirm() {
  bildschirmGeraeumt = true;
  const huelle = document.getElementById("app-shell");
  if (huelle) huelle.innerHTML = "";
  document.querySelectorAll(".modal-overlay, .overlay, #print-area, .foto-lightbox, #header-user").forEach((el) => {
    el.innerHTML = "";
    el.classList.add("hidden");
    el.style.display = "none";
  });
}

// ⚠️ Gerufen aus db.js -- an der EINEN Stelle, an der die 401 ankommt. Sonst
// müsste jeder einzelne Fehlerweg daran denken, und einer vergisst es.
function raeumeBeiSitzungsverlust() {
  if (!appLaeuft) return;
  showConnectScreen("Die Sitzung ist abgelaufen. Bitte über die Tools-Übersicht neu anmelden.");
}

function showConnectScreen(errorMsg) {
  raeumeBildschirm();
  document.getElementById("connect-screen").style.display = "";
  document.getElementById("app-shell").style.display = "none";
  document.getElementById("cloud-error").textContent = errorMsg ? "Fehler: " + errorMsg : "";
}

async function startApp() {
  appLaeuft = true;
  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "";
  try { currentUser = await fetchMe(); } catch (_) { /* best effort */ }
  renderHeaderUser();
  applyAdminVisibility();
  renderVersionInfo();
  // Vorab laden, damit das Formular beim ersten Öffnen nicht auf die
  // Vertreter-Liste warten muss (ensureEditorsLoaded ist ohnehin idempotent).
  await ensureEditorsLoaded();
  await purgePastEvents();
  renderAll();
}

async function init() {
  setupListeners();
  if (!getSessionToken()) { showConnectScreen(); return; }
  // Die Vertreter-Liste laeuft ab hier parallel zu dav-load; startApp() findet
  // sie fertig vor oder wartet auf dieselbe Promise (siehe ensureEditorsLoaded).
  // Bewusst NACH dem Token-Check: ohne Token soll kein Aufruf rausgehen.
  ensureEditorsLoaded();
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

  // "+ Neue Abwesenheit" ist für ALLE eingeloggten Nutzer sichtbar (Selbstbedienung),
  // nicht editor-only wie beim Vereinskalender.
  document.getElementById("btn-new-termin").addEventListener("click", () => openTerminModal(null));

  // Jede Karte antippen -> bearbeiten (eigene/als Bearbeiter) oder read-only
  // ansehen (fremde), siehe openTerminModal.
  document.getElementById("hero").addEventListener("click", onCardClick);
  document.getElementById("termin-list").addEventListener("click", onCardClick);

  // Vertreter-Liste live neu berechnen, sobald sich der Zeitraum ändert (siehe
  // fillVertreterSelect/onVertreterRelevantFieldChange) -- schließt Personen aus,
  // die im neuen Zeitraum selbst schon abwesend sind.
  document.getElementById("tf-von").addEventListener("change", onVertreterRelevantFieldChange);
  document.getElementById("tf-bis").addEventListener("change", onVertreterRelevantFieldChange);

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
