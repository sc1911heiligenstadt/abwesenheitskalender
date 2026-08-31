# 🧳 Abwesenheitskalender

Wer ist wann nicht da. Jede Person trägt ihre eigenen Abwesenheiten ein — als
Zeitraum von–bis — und alle mit Zugriff sehen die gemeinsame Übersicht. Damit
erübrigt sich die Rundfrage, ob am Wochenende jemand einspringen kann.

**➡️ [Abwesenheitskalender öffnen](https://sc1911heiligenstadt.github.io/abwesenheitskalender/)**

## Was drin ist

| Reiter | Wofür |
|---|---|
| **Abwesenheiten** | Eigene Einträge anlegen und die Übersicht aller ansehen |
| **Einstellungen** | Die Abwesenheitsarten pflegen |

Als Arten sind **Urlaub**, **Krankheit**, **Fortbildung**, **Lehrgang** und
**Sonstiges** hinterlegt.

## Wer darf was ändern

Jede Person verwaltet **nur die eigenen Einträge**. Bearbeiter-Gruppen können
darüber hinaus alle Einträge verwalten — gedacht für die Geschäftsstelle, die
eine Meldung telefonisch entgegennimmt.

Vergangene Einträge werden automatisch aufgeräumt, die Liste bleibt also von
selbst kurz.

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

Die Rechte gelten in drei Stufen: **Sehen** (die Übersicht ansehen),
**Bearbeiten** (eigene Einträge pflegen, in Bearbeiter-Gruppen auch fremde) und
**Administrieren** (Reiter *Einstellungen*: die Abwesenheitsarten). Wer welche
Stufe hat, legt die Tools-Übersicht fest.

## Lokal starten

Über den Eintrag `abwesenheitskalender` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8787/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
