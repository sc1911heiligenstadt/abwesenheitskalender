const APP_VERSION = "1.0";

// Startbestand der Abwesenheitsarten — greift, wenn im Gateway noch keine bzw.
// leere Daten liegen. Im Einstellungen-Tab (nur Bearbeiter) frei anpassbar,
// gleiches Muster wie die Kategorien-Verwaltung im Vereinskalender.
const DEFAULT_ABWESENHEITSARTEN = [
  { id: "urlaub",      name: "Urlaub",                farbe: "#2d8c4e" },
  { id: "krankheit",   name: "Krankheit",              farbe: "#c0392b" },
  { id: "fortbildung", name: "Fortbildung/Lehrgang",   farbe: "#1a56a0" },
  { id: "sonstiges",   name: "Sonstiges",              farbe: "#6b7280" }
];

const APP_CHANGELOG = [
  {
    version: "1.1",
    groups: [
      {
        title: "Speichern",
        items: [
          "Behoben: Beim zügigen Bearbeiten — etwa mehrere Abwesenheiten kurz nacheinander speichern oder löschen, oder Name und Farbe einer Abwesenheitsart im Einstellungen-Tab ändern — erschien wiederholt die Meldung „Die Daten wurden zwischenzeitlich auf einem anderen Gerät geändert“, obwohl niemand sonst am Kalender arbeitete; die zuletzt gemachte Eingabe ging dabei verloren. Es wird jetzt immer nur ein Speichervorgang gleichzeitig ausgeführt, weitere Änderungen werden direkt danach mitgespeichert.",
          "Die Meldung erscheint dadurch nur noch, wenn tatsächlich ein anderes Gerät den Kalender geändert hat."
        ]
      }
    ]
  },
  {
    version: "1.0",
    groups: [
      {
        title: "Abwesenheitskalender",
        items: [
          "Eigene Abwesenheiten (Urlaub, Krankheit, Fortbildung/Lehrgang, Sonstiges) mit Zeitraum von–bis eintragen.",
          "Alle mit Tool-Zugriff sehen die komplette Übersicht (wer wann abwesend ist) — jede:r verwaltet aber nur die eigenen Einträge, Bearbeiter-Gruppen verwalten alle.",
          "Vergangene Einträge werden beim Öffnen durch einen Bearbeiter automatisch aufgeräumt.",
          "Abwesenheitsarten im Einstellungen-Tab frei verwaltbar (nur Bearbeiter)."
        ]
      },
      {
        title: "Vertreter",
        items: [
          "Neues Feld „Vertreter“ beim Anlegen/Bearbeiten einer Abwesenheit — Auswahl aus den Mitgliedern der Bearbeiter-Gruppen, optional.",
          "Personen, die im gewählten Zeitraum selbst schon abwesend sind, stehen nicht zur Auswahl."
        ]
      }
    ]
  }
];
