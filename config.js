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

// Was der Abwesenheitskalender kann -- steht im Info-Reiter als Karte
// "Funktionen". WICHTIG: Das ist NICHT der Changelog. Hier steht der ZUSTAND
// ("die Vertretung wird geprueft"), dort die Aenderung ("die Vertretung wird
// JETZT geprueft"). Wer eine Funktion umbaut oder abschaltet, zieht diesen Text
// mit -- und ebenso E:\SC1911-Tools-Anleitung.txt, wo dasselbe ausfuehrlich
// steht.
const APP_FUNKTIONEN = [
  {
    title: "Was der Kalender zeigt",
    items: [
      "Eine Übersicht, wer wann abwesend ist — als Grundlage dafür, rechtzeitig eine Vertretung zu organisieren.",
      "Die nächste anstehende Abwesenheit steht oben als hervorgehobene Karte, die weiteren folgen darunter nach Monat gruppiert.",
      "Vergangene Einträge räumt die App von selbst auf, sobald ein Bearbeiter die Seite aufruft."
    ]
  },
  {
    title: "Abwesenheit eintragen",
    items: [
      "Ein Eintrag hat einen Zeitraum von–bis, eine Art und wahlweise eine Vertretung und eine Notiz.",
      "Für einen einzelnen Tag werden beide Datumsfelder gleich gesetzt.",
      "Es gibt keine Uhrzeiten — eine Abwesenheit gilt immer ganztägig.",
      "Ein Eintrag, den man nicht ändern darf, lässt sich trotzdem öffnen und in Ruhe lesen."
    ]
  },
  {
    title: "Vertretung",
    items: [
      "Zu jeder Abwesenheit lässt sich eine Vertretung angeben — freiwillig, das Feld darf leer bleiben.",
      "Zur Auswahl stehen die Personen, die in diesem Werkzeug bearbeiten dürfen.",
      "Wer im gewählten Zeitraum selbst abwesend ist, erscheint gar nicht erst in der Liste.",
      "Auch die Gegenrichtung wird geprüft: Wer schon als Vertretung eingetragen ist und danach eigene Abwesenheit für dieselben Tage anlegt, bekommt beim Speichern einen Hinweis und kann trotzdem speichern. Die betroffene Karte kennzeichnet die Vertretung dann rot als offen."
    ]
  },
  {
    title: "Abwesenheitsarten",
    items: [
      "Voreingestellt sind Urlaub, Krankheit, Fortbildung/Lehrgang und Sonstiges.",
      "Die Arten lassen sich im Reiter „Einstellungen“ anlegen, umbenennen, umfärben und löschen. Sie geben der Karte ihre Farbe."
    ]
  },
  {
    title: "Wer darf was",
    items: [
      "Sehen: die komplette Übersicht, schreibgeschützt. Der Knopf „+ Neue Abwesenheit“ fehlt, und auch ein Umweg am Bildschirm vorbei wird vom Server abgewiesen.",
      "Bearbeiten: Abwesenheiten anlegen, ändern und löschen — die eigenen und die von anderen. Gedacht für die Geschäftsstelle, die eine Meldung auch einmal telefonisch entgegennimmt.",
      "Administrieren: zusätzlich die Abwesenheitsarten im Reiter „Einstellungen“ pflegen.",
      "Volle Transparenz ist gewollt: alle Berechtigten sehen alle Einträge. Der Reiter „Info“ steht jedem angemeldeten Nutzer offen."
    ]
  },
  {
    title: "Bedienung und Speicherung",
    items: [
      "Die Ansicht ist für das Handy gebaut und funktioniert dort vollständig. Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen.",
      "Gespeichert wird in der Vereins-Nextcloud über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
      "Wird die Seite geschlossen, bevor das Speichern bestätigt ist, geht der Stand trotzdem noch raus — und es kommt eine Rückfrage, falls das einmal nicht mehr möglich ist.",
      "Fällt die Anmeldung weg, während die App offen ist, räumt sie den Bildschirm samt Formular, statt Namen und Eingaben im Hintergrund lesbar zu lassen.",
      "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das, lädt den fremden Stand nach und sagt Bescheid."
    ]
  }
];

const APP_CHANGELOG = [
  {
    version: "1.3",
    groups: [
      {
        title: "Im Info-Reiter steht jetzt, was die App kann",
        items: [
          "Die Liste der Änderungen und die Versionsnummer sind aus dem Info-Reiter verschwunden.",
          "Stattdessen steht dort die Karte „Funktionen“: was die App kann, nach Themen geordnet.",
          "Was sich geändert hat, steht weiterhin in den Neuigkeiten auf der Startseite der Tools-Übersicht."
        ]
      }
    ]
  },
  {
    version: "1.2",
    groups: [
      {
        title: "Vertretung wird jetzt in beide Richtungen geprüft",
        items: [
          "Bisher galt die Regel nur beim Auswählen: Wer im Zeitraum schon abwesend war, tauchte in der Vertreter-Liste gar nicht erst auf.",
          "Die Gegenrichtung fehlte. Wer zuerst als Vertretung eingetragen wurde und danach seinen eigenen Urlaub für dieselben Tage anlegte, kam durch. Nichts prüfte das, und die Karte zeigte weiter „Vertretung: …“, obwohl in diesen Tagen niemand da war. Dasselbe Ergebnis, zwei verschiedene Ausgänge — nur je nachdem, wer zuerst getippt hat.",
          "Jetzt sagt das Speichern Bescheid: „Du bist in diesem Zeitraum als Vertretung eingetragen — für …“. Du kannst trotzdem speichern.",
          "Und die Karte des anderen Eintrags kennzeichnet die Vertretung dann rot als offen, statt sie unverändert weiterzuzeigen."
        ]
      }
    ]
  },
  {
    version: "1.1",
    groups: [
      {
        title: "Der Kalender ist beim Öffnen schneller da",
        items: [
          "Die Vertreter-Liste (für das Formular) wurde bisher erst geholt, nachdem die Abwesenheiten geladen waren — ein Roundtrip, auf den jeder vor dem ersten Bild wartete. Jetzt laufen beide Abfragen gemeinsam los."
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
