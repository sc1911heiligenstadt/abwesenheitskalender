# 🧳 Abwesenheitskalender

Übersicht, wer wann abwesend ist (Urlaub, Krankheit, Fortbildung u.a.) — jede:r Berechtigte trägt eigene Abwesenheiten ein, alle mit Tool-Zugriff sehen die komplette Übersicht.

**➡️ [Abwesenheitskalender öffnen](https://sc1911heiligenstadt.github.io/abwesenheitskalender/)**

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

Die Rechte gelten in drei Stufen: **Sehen** (nur ansehen), **Bearbeiten** (Einträge pflegen) und **Administrieren** (Einstellungen und Verwaltung). Wer welche Stufe hat, legt die Tools-Übersicht fest.

## Lokal starten

Über den Eintrag `abwesenheitskalender` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8787/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
