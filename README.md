# 🧳 Abwesenheitskalender

Wer ist wann nicht da. Jede Person trägt ihre eigenen Abwesenheiten ein — als
Zeitraum von–bis — und alle mit Zugriff sehen die gemeinsame Übersicht. Damit
erübrigt sich die Rundfrage, ob am Wochenende jemand einspringen kann.

**➡️ [Abwesenheitskalender öffnen](https://sc1911heiligenstadt.github.io/abwesenheitskalender/)**

## Was drin ist

| Reiter | Wofür |
|---|---|
| **Abwesenheiten** | Einträge anlegen und die Übersicht aller ansehen; die nächste anstehende Abwesenheit steht oben hervorgehoben |
| **Einstellungen** | Die Abwesenheitsarten mit ihren Farben pflegen |
| **Info** | Was die App tut, die Änderungen und der Datenschutz-Hinweis |

Als Arten sind **Urlaub**, **Krankheit**, **Fortbildung/Lehrgang** und
**Sonstiges** hinterlegt — anpassbar unter *Einstellungen*.

## Vertreter

Zu jeder Abwesenheit lässt sich freiwillig ein **Vertreter** angeben. Zur
Auswahl stehen die Mitglieder der Bearbeiter-Gruppen — wer im gewählten Zeitraum
selbst abwesend ist, erscheint dort gar nicht erst.

## Wer darf was ändern

**Sehen** heißt hier wirklich nur sehen: die Übersicht ist vollständig, aber
nichts daran lässt sich ändern — auch nicht die eigenen Einträge. Wer
**Bearbeiten** hat, verwaltet alle Einträge, die eigenen wie die von anderen;
gedacht für die Geschäftsstelle, die eine Meldung telefonisch entgegennimmt. Ein
Eintrag, den man nicht ändern darf, lässt sich trotzdem öffnen und lesen.

Vergangene Einträge werden automatisch aufgeräumt, die Liste bleibt also von
selbst kurz.

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

Die Rechte gelten in drei Stufen: **Sehen** (die Übersicht ansehen,
schreibgeschützt), **Bearbeiten** (Abwesenheiten anlegen, ändern und löschen —
eigene wie fremde) und **Administrieren** (Reiter *Einstellungen*: die
Abwesenheitsarten). Wer welche Stufe hat, legt die Tools-Übersicht fest. Der
Reiter *Info* ist für alle sichtbar.

## Lokal starten

Über den Eintrag `abwesenheitskalender` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8787/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
