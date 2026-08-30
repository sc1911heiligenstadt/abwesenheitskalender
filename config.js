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
    version: "1.3",
    groups: [
      {
        title: "Beim Sitzungsende wird auch alles neben der Seite geräumt",
        items: [
          "Beim Sitzungsende wurde die Seite bereits geleert. Der Termin-Dialog steht aber daneben und blieb mit Namen und Eingaben stehen. Jetzt wird er mitgeleert.",
          "Der Hinweis erscheint außerdem an jeder Stelle, an der die Anmeldung wegfällt — vorher nur bei einem Teil der Wege."
        ]
      }
    ]
  },
  {
    version: "1.2",
    groups: [
      {
        title: "Beim Abmelden bleibt nichts stehen",
        items: [
          "Läuft die Anmeldung ab, während die App offen ist — zum Beispiel weil ein Speichern nach längerer Pause fehlschlägt —, erscheint wie bisher der Hinweis „bitte neu anmelden“.",
          "Neu ist: der Bildschirm dahinter wird jetzt auch geleert. Vorher wurde er nur unsichtbar gemacht, und alles Angezeigte blieb im Browser stehen — sichtbar für jeden, der sich an denselben Rechner setzt und nachschaut.",
          "Für dich ändert sich nichts: der Weg zurück war schon immer ein Neuladen der Seite."
        ]
      }
    ]
  },
  {
    version: "1.1",
    groups: [
      {
        title: "Am Handy",
        items: [
          "Bisher brach die Reiterleiste selbst um, die rechte Reiter-Gruppe darin aber nicht: Sie rutschte als ein Stück in die zweite Zeile und lief dort weiter über den rechten Rand hinaus. Jetzt bricht auch sie um, sobald sie zu breit wird. Zu sehen ist das nur, wenn genug Reiter nebeneinanderstehen — bis dahin sieht alles aus wie bisher."
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
          "Eigene Abwesenheiten mit Zeitraum von–bis eintragen: Urlaub, Krankheit, Fortbildung/Lehrgang oder Sonstiges.",
          "Alle mit Zugriff auf das Werkzeug sehen die vollständige Übersicht, wer wann abwesend ist.",
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
          "Bearbeiten: eigene Abwesenheiten anlegen, ändern und löschen.",
          "Administrieren: zusätzlich die Abwesenheitsarten im Reiter „Einstellungen“ pflegen.",
          "Der Reiter „Info“ ist für alle sichtbar."
        ]
      },
      {
        title: "Bedienung am Handy",
        items: [
          "Die Ansicht ist für das Handy gebaut und funktioniert dort vollständig.",
          "Eingabefelder sind mindestens 16 Pixel groß, damit der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt und verschoben stehen bleibt."
        ]
      },
      {
        title: "Daten & Speicherung",
        items: [
          "Gespeichert wird in der Vereins-Nextcloud über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
          "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das, lädt den fremden Stand nach und sagt Bescheid."
        ]
      }
    ]
  }
];
