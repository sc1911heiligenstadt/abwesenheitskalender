# Abwesenheitskalender (v1.0)

Übersicht, wer wann abwesend ist (Urlaub, Krankheit, Fortbildung/Lehrgang, Sonstiges) —
Teil der [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) des 1. SC 1911
Heiligenstadt. Dient als Grundlage für die intern geregelte Vertreterregelung, die selbst
nicht Teil dieser App ist.

**Jede:r Berechtigte trägt eigene Abwesenheiten ein** (Zeitraum von–bis, z. B. eine Woche
Urlaub, oder ein einzelner wichtiger Tag). **Alle mit Zugriff auf dieses Tool sehen die
komplette Übersicht** — nicht nur die eigenen Einträge, denn genau darum geht es: sichtbar
machen, wer wann nicht da ist. Verwalten darf aber jede:r nur die eigenen Einträge;
Mitglieder von Gruppen mit Bearbeiten-Recht für den Abwesenheitskalender (vergeben in der
Tools-Übersicht-Gruppenverwaltung) können zusätzlich alle Einträge verwalten.

## Bedienung

- **Abwesenheiten** — anstehende (und laufende) Abwesenheiten chronologisch, nach Monat
  gruppiert. Auf eine eigene Karte tippen öffnet sie zum Bearbeiten/Löschen; eine fremde
  Karte öffnet read-only (Person, Zeitraum, Art, Notiz ansehen, aber nicht ändern).
- **+ Neue Abwesenheit** (alle eingeloggten Nutzer) — Von/Bis-Datum, Art und optionale
  Notiz eintragen. Ein einzelner Tag ist ein Zeitraum, bei dem Von und Bis gleich sind.
- **Einstellungen** (nur Bearbeiter-Gruppen) — Abwesenheitsarten (Name + Farbe) anlegen,
  umbenennen, umfärben und löschen.
- Vergangene Abwesenheiten werden automatisch aufgeräumt, sobald ein Mitglied einer
  Bearbeiter-Gruppe die App öffnet.

Die 4 nächsten anstehenden Abwesenheiten erscheinen zusätzlich im Dashboard-Widget der
Tools-Übersicht.

## Technik

Vanilla-JS-App (kein Build-Step), Anmeldung & Speicherung laufen über das zentrale
ToolsUebersicht-Login-Gateway (`admin-worker.js`), das die Daten serverseitig in der
Vereins-Nextcloud ablegt (`abwesenheitskalender.json`). Kein separates Passwort im Client.

Anders als bei den meisten anderen Gateway-Apps ist der Lesezugriff hier bewusst
**nicht** auf eigene Einträge beschränkt (siehe oben) — nur das Schreiben ist für
Nicht-Bearbeiter auf eigene Einträge begrenzt, serverseitig durchgesetzt.

- `index.html`, `app.js`, `db.js`, `config.js`, `style.css` — die App
