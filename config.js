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
    version: "1.0",
    groups: [
      {
        title: "Abwesenheitskalender",
        items: [
          "Abwesenheiten mit Zeitraum von–bis eintragen: Urlaub, Krankheit, Fortbildung/Lehrgang oder Sonstiges. Dazu ein freies Notizfeld.",
          "Alle mit Zugriff auf das Werkzeug sehen die vollständige Übersicht, wer wann abwesend ist. Die nächste anstehende Abwesenheit steht ganz oben hervorgehoben.",
          "Ein Eintrag, den man nicht ändern darf, lässt sich trotzdem öffnen und in Ruhe lesen — nur eben nicht bearbeiten.",
          "Vergangene Einträge räumt die App beim Öffnen von selbst auf, sobald ein Bearbeiter die Seite aufruft."
        ]
      },
      {
        title: "Vertreter",
        items: [
          "Zu jeder Abwesenheit lässt sich ein Vertreter angeben — freiwillig, das Feld darf leer bleiben.",
          "Zur Auswahl stehen die Mitglieder der Bearbeiter-Gruppen.",
          "Wer im gewählten Zeitraum selbst abwesend ist, erscheint gar nicht erst in der Liste."
        ]
      },
      {
        title: "Wer darf was",
        items: [
          "Sehen: die komplette Übersicht, schreibgeschützt. Der Knopf „+ Neue Abwesenheit“ fehlt, und auch ein Umweg am Bildschirm vorbei wird vom Server abgewiesen.",
          "Bearbeiten: Abwesenheiten anlegen, ändern und löschen — die eigenen und die von anderen. Gedacht für die Geschäftsstelle, die eine Meldung auch einmal telefonisch entgegennimmt.",
          "Administrieren: zusätzlich die Abwesenheitsarten mit ihren Farben im Reiter „Einstellungen“ pflegen.",
          "Der Reiter „Info“ ist für alle sichtbar."
        ]
      },
      {
        title: "Bedienung am Handy",
        items: [
          "Die Ansicht ist für das Handy gebaut und funktioniert dort vollständig.",
          "Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen.",
          "Eingabefelder sind mindestens 16 Pixel groß, damit der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt und verschoben stehen bleibt."
        ]
      },
      {
        title: "Daten & Speicherung",
        items: [
          "Gespeichert wird in der Vereins-Nextcloud über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
          "Wird die Seite geschlossen, bevor das Speichern bestätigt ist, geht der Stand trotzdem noch raus — und es kommt eine Rückfrage, falls das einmal nicht mehr möglich ist.",
          "Fällt die Anmeldung weg, während die App offen ist, wird der Bildschirm geräumt — die Seite selbst und auch der Termin-Dialog daneben. Es bleibt kein Name und keine Eingabe im Browser zurück, und jeder Weg führt auf den Hinweis, sich neu anzumelden.",
          "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das, lädt den fremden Stand nach und sagt Bescheid."
        ]
      }
    ]
  }
];
