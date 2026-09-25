import { getLocales } from 'expo-localization';

export type Language = 'de' | 'en';

export const translations = {
  de: {
    'common.ok': 'OK',
    'common.cancel': 'Abbrechen',
    'common.confirm': 'Bestätigen',
    'common.errorTitle': 'Fehler',
    'common.refresh': 'Aktualisieren',
    'common.resume': 'Fortsetzen',
    'common.startOver': 'Neu starten',
    'common.select': 'Auswählen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.surrender': 'Aufgeben',
    'common.loading': 'Lade…',
    'common.offline': 'Offline',
    'common.openSettings': 'Einstellungen öffnen',
    'a11y.languageToggle': 'Sprache wechseln',
    'a11y.languageToggleHint': 'Wechselt zwischen Deutsch und Englisch.',
    'a11y.languageToggleCurrent': 'Sprache wechseln, aktuell {{language}}',
    'a11y.languageToggleHintTarget': 'Wechselt zu {{language}}.',
    'a11y.languageName.de': 'Deutsch',
    'a11y.languageName.en': 'Englisch',
    'a11y.hintButton': 'Tipp anzeigen',
    'a11y.hintButtonHint': 'Öffnet den Tipp.',
    'a11y.logoutButton': 'Rallye beenden',
    'a11y.logoutButtonHint': 'Beendet die Teilnahme an der Rallye.',
    'a11y.selectRallye': 'Rallye {{name}} auswählen',
    'a11y.selectRallyeWithCode': 'Rallye {{name}} mit Code beitreten',
    'a11y.selectRallyeHint': 'Startet die Teilnahme.',
    'a11y.selectRallyeCodeHint': 'Öffnet die Code-Eingabe.',
    'a11y.answerOptionHint': 'Wählt diese Antwort.',
    'welcome.appTitle': 'DHBW Lörrach Campus Rallye',
    'welcome.infos': 'Infos & Impressum',
    'infos.title': 'Infos',
    'infos.imprint': 'Impressum',
    'infos.about': 'Über diese App',
    'infos.heroTitle': 'Rechtliches und Hintergrund',
    'infos.heroBody':
      'Hier findest du die rechtlichen Angaben zur App und den Hintergrund zu Projekt, Mitwirkenden und Version.',
    'infos.imprintEyebrow': 'Rechtliches',
    'infos.imprintDescription': 'Kontakt, Anbieter und Pflichtangaben',
    'infos.aboutEyebrow': 'Hintergrund',
    'infos.aboutDescription': 'Projekt, Mitwirkende und Version',
    'welcome.offline': 'Du bist offline…',
    'welcome.error': 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
    'welcome.resume.title': 'Rallye fortsetzen',
    'welcome.resume.details': 'Rallye: {{rallye}}\nTeam: {{team}}',
    'welcome.join.description':
      'Wähle eine Rallye und tritt mit deinem Team bei',
    'welcome.explore.title': 'Campus-Gelände erkunden',
    'welcome.explore.description':
      'Erkunde den Campus in deinem eigenen Tempo ohne Zeitdruck',
    'welcome.explore.start': 'Erkundung starten',
    'welcome.tourModeUnavailable': 'Kein Tour Mode Rallye verfügbar.',
    'welcome.participationStartError':
      'Teilnahme konnte nicht gestartet werden.',
    'welcome.clearParticipation.title': 'Teilnahme löschen',
    'welcome.clearParticipation.message':
      'Möchtest du die gespeicherte Teilnahme wirklich löschen? Die Teamzuordnung auf diesem Gerät wird entfernt.',
    'welcome.clearParticipation.confirm': 'Löschen',
    'welcome.selectLocation.title': 'Standort auswählen',
    'welcome.selectLocation.description':
      'Wähle deinen Standort aus, um verfügbare Rallyes zu sehen',
    'welcome.selectLocation.empty': 'Keine Standorte verfügbar',
    'welcome.selectDepartment.description': 'Bereichs-Rallyes',
    'welcome.noContent':
      'Derzeit sind keine aktiven Rallyes für diesen Standort verfügbar.',
    'welcome.departmentLoadError':
      'Standortinhalte konnten nicht geladen werden.',
    'rallye.status.draft': 'Entwurf',
    'rallye.status.ready': 'Bereit',
    'rallye.status.running': 'Läuft',
    'rallye.status.voting': 'Abstimmung',
    'rallye.status.results': 'Ergebnisse',
    'rallye.status.ended': 'Abgeschlossen',
    'rallye.code.required.title': 'Code eingeben',
    'rallye.code.required.badge': 'Code erforderlich',
    'rallye.code.required.hint': 'Beitritt nur mit Rallye-Code',
    'rallye.code.missing.title': 'Code fehlt',
    'rallye.code.missing.message': 'Bitte gib den Rallye-Code ein.',
    'rallye.code.wrong.title': 'Falscher Code',
    'rallye.code.wrong.message': 'Bitte gib den richtigen Code ein.',
    'rallye.code.enter': 'Code eingeben',
    'rallye.code.label': 'Code',
    'rallye.code.placeholder': 'Code',
    'rallye.code.subtitle': 'Gib den Code ein, um teilzunehmen',
    'rallye.code.helper': 'Code bei der Betreuung erfragen',
    'rallye.code.join': 'Teilnehmen',
    'rallye.join': 'Teilnehmen',
    'rallye.joinWithCode': 'Mit Code teilnehmen',
    'rallye.modal.activeTitle': 'Aktive Rallyes',
    'rallye.modal.noActive':
      'Keine aktiven Rallyes verfügbar. Bitte warte, bis eine Rallye gestartet wird.',
    'rallye.progress': 'Frage {{current}} von {{total}}',
    'rallye.allAnswered.title': 'Erkundung des Campus beendet',
    'rallye.allAnswered.simple': 'Alle Fragen beantwortet',
    'rallye.correctAnswers':
      '{{correct}} von {{total}} Fragen richtig beantwortet',
    'tour.feedback.correct': 'Das ist richtig!',
    'tour.feedback.incorrect': 'Leider falsch…',
    'tour.feedback.correctAnswer': 'Die richtige Antwort lautet: {{answer}}',
    'rallye.backToStart': 'Zurück zum Start',
    'rallye.plannedEnd': 'geplant bis {{time}} Uhr',
    'rallye.teamLabel': 'Team: {{team}}',
    'rallye.currentTeamLabel': 'Dein Team:',
    'rallye.pointsLabel': 'Punkte: {{points}}',
    'rallye.meetingPoint': 'Bitte kommt zum vereinbarten Treffpunkt',
    'rallye.noQuestions.title': 'Keine Fragen',
    'rallye.noQuestions.message': 'Momentan sind keine Fragen verfügbar.',
    'rallye.preparing.title': 'Die Rallye hat noch nicht begonnen',
    'rallye.preparing.message': 'Bitte warte auf den Start der Rallye',
    'rallye.error.loadQuestions': 'Die Fragen konnten nicht geladen werden.',
    'rallye.error.noInternet': 'Keine Internetverbindung verfügbar',
    'teamSetup.message': 'Bilde ein Team, um an der Rallye teilzunehmen.',
    'teamSetup.button': 'Team bilden',
    'teamSetup.error.message':
      'Team konnte nicht erstellt werden. Bitte erneut versuchen.',
    'team.sheetTitle': 'Euer Team',
    'team.deleted.title': 'Team nicht mehr vorhanden',
    'team.deleted.message':
      'Euer Team existiert nicht mehr, vermutlich wurde die Rallye zurückgesetzt. Bitte legt ein neues Team an.',
    'question.submit': 'Antwort senden',
    'question.options.loading': 'Antwortoptionen werden geladen…',
    'question.placeholder.answer': 'Deine Antwort...',
    'question.error.selectAnswer': 'Bitte wähle eine Antwort aus.',
    'question.error.enterAnswer': 'Bitte gebe eine Antwort ein.',
    'question.error.pleaseWaitTitle': 'Bitte warten',
    'question.error.answerLoading': 'Die Antwortdaten werden noch geladen.',
    'question.error.qrLoading': 'Die QR-Code Daten werden noch geladen.',
    'question.error.saveAnswer': 'Antwort konnte nicht gespeichert werden.',
    'question.qr.incorrect':
      'Der QR-Code ist falsch! Du bist vermutlich nicht am richtigen Ort.',
    'question.qr.correctMessage': 'Das ist der richtige QR-Code!',
    'question.camera.needAccess': 'Wir brauchen Zugriff auf die Kamera',
    'question.camera.allow': 'Zugriff auf Kamera erlauben',
    'question.camera.deniedInSettings':
      'Der Kamerazugriff wurde abgelehnt. Du kannst ihn in den Einstellungen erlauben.',
    'question.qr.hideCamera': 'Kamera ausblenden',
    'question.qr.scan': 'QR-Code scannen',
    'question.photo.take': 'Foto aufnehmen',
    'question.photo.switch': 'Kamera wechseln',
    'question.photo.new': 'Neues Foto',
    'question.photo.send': 'Foto senden',
    'question.photo.privacyTitle': 'Datenschutz bei Fotoantworten',
    'question.photo.privacyNotice':
      'Wir speichern dein Foto für die Auswertung der Rallye. Nur die Organisatoren können es sehen. Wir löschen es spätestens 30 Tage nach dem Upload. Lade Fotos mit erkennbaren Personen nur hoch, wenn sie Aufnahme und Upload zugestimmt haben.',
    'question.photo.consent':
      'Ich bin mit dem Upload und der beschriebenen Nutzung des Fotos einverstanden.',
    'question.photo.offlineMessage':
      'Foto-Uploads benötigen eine Internetverbindung.',
    'question.photo.offlineNotice': 'Offline: Foto-Uploads benötigen Internet.',
    'question.error.submitPhoto': 'Foto konnte nicht gesendet werden.',
    'question.error.surrender': 'Beim Aufgeben ist ein Fehler aufgetreten.',
    'question.unknown.title': 'Unbekannter Fragetyp',
    'question.unknown.message':
      'Dieser Fragetyp wird aktuell nicht unterstützt: {{type}}',
    'question.skip': 'Frage überspringen',
    'hint.confirm.title': 'Sicherheitsfrage',
    'hint.confirm.freeMessage':
      'Möchtet ihr einen Tipp erhalten? Bei dieser Foto-Frage kostet euch der Tipp keine Punkte.',
    'hint.confirm.message':
      'Seid ihr sicher, dass ihr einen Tipp erhalten möchtet? Das kostet euch {{cost}} Punkt(e).',
    'hint.confirm.confirm': 'Ja, ich möchte einen Tipp',
    'hint.title': 'Tipp',
    'hint.error.save': 'Der Tipp konnte nicht gespeichert werden.',
    'confirm.answer.title': 'Sicherheitsfrage',
    'confirm.answer.message':
      'Willst du wirklich "{{answer}}" als Antwort abschicken?',
    'confirm.answer.confirm': 'Antwort senden',
    'confirm.surrender.title': 'Sicherheitsfrage',
    'confirm.surrender.message': 'Willst du diese Aufgabe wirklich aufgeben?',
    'confirm.surrender.confirm': 'Ja, ich möchte aufgeben',
    'confirm.exit.title': 'Teilnahme an der Rallye beenden',
    'confirm.exit.message':
      'Möchtest du die Teilnahme an der Rallye wirklich beenden? Die Teamzuordnung auf diesem Gerät wird gelöscht.',
    'confirm.exit.confirm': 'Beenden',
    'confirm.tourExit.title': 'Erkundung beenden',
    'confirm.tourExit.message': 'Möchtest du die Erkundung wirklich beenden?',
    'scoreboard.rowLabel': 'Platz {{rank}}, Team {{team}}, Punkte {{points}}',
    'scoreboard.error.load': 'Der Endstand konnte nicht geladen werden.',
    'voting.ended.title': 'Die Abstimmung wurde beendet.',
    'voting.ended.message': 'Wartet auf die Beendigung der Rallye.',
    'voting.unavailable.title': 'Keine Abstimmung verfügbar',
    'voting.unavailable.message':
      'Derzeit stehen nicht genügend Antworten zur Abstimmung bereit.',
    'voting.instruction':
      'Gebt dem Team einen zusätzlichen Punkt, das eurer Meinung nach die oben gestellte Aufgabe am besten gelöst hat.',
    'voting.next': 'Nächste Abstimmung',
    'voting.error.load': 'Die Abstimmung konnte nicht geladen werden.',
    'voting.error.submit': 'Abstimmung konnte nicht gespeichert werden.',
    'scoreboard.title': 'Endstand',
    'geocaching.arrived': 'Ziel erreicht!',
    'geocaching.calibrate':
      'Bitte bewege dein Gerät in einer 8er-Bewegung, um den Kompass zu kalibrieren.',
    'geocaching.error.noCoordinates':
      'Für diese Frage sind keine Zielkoordinaten hinterlegt.',
    'geocaching.error.locationDenied':
      'Standortzugriff wurde verweigert. Dieser Fragetyp benötigt GPS.',
    'geocaching.error.locationDeniedInSettings':
      'Standortzugriff wurde verweigert. Du kannst ihn in den Einstellungen erlauben.',
    'geocaching.instruction.text':
      'Finde zuerst das Ziel, um dann die Antwort einzugeben!',
    'geocaching.instruction.qr':
      'Finde zuerst das Ziel, um dann den QR-Code zu scannen!',
    'geocaching.retryPermission': 'Standort erneut anfragen',
    'geocaching.skipCalibration': 'Überspringen',
  },
  en: {
    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.errorTitle': 'Error',
    'common.refresh': 'Refresh',
    'common.resume': 'Resume',
    'common.startOver': 'Start over',
    'common.select': 'Select',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.surrender': 'Surrender',
    'common.loading': 'Loading…',
    'common.offline': 'Offline',
    'common.openSettings': 'Open settings',
    'a11y.languageToggle': 'Switch language',
    'a11y.languageToggleHint': 'Switches between German and English.',
    'a11y.languageToggleCurrent': 'Switch language, currently {{language}}',
    'a11y.languageToggleHintTarget': 'Switches to {{language}}.',
    'a11y.languageName.de': 'German',
    'a11y.languageName.en': 'English',
    'a11y.hintButton': 'Show hint',
    'a11y.hintButtonHint': 'Opens the hint.',
    'a11y.logoutButton': 'End rallye',
    'a11y.logoutButtonHint': 'Ends your participation in the rallye.',
    'a11y.selectRallye': 'Select rallye {{name}}',
    'a11y.selectRallyeWithCode': 'Join rallye {{name}} with code',
    'a11y.selectRallyeHint': 'Starts joining.',
    'a11y.selectRallyeCodeHint': 'Opens the code entry.',
    'a11y.answerOptionHint': 'Selects this answer.',
    'welcome.appTitle': 'DHBW Lörrach Campus Rallye',
    'welcome.infos': 'Info & Imprint',
    'infos.title': 'Info',
    'infos.imprint': 'Imprint',
    'infos.about': 'About this app',
    'infos.heroTitle': 'Legal and project background',
    'infos.heroBody':
      'Find the app’s legal details here, together with context about the project, contributors, and version.',
    'infos.imprintEyebrow': 'Legal',
    'infos.imprintDescription': 'Contact, provider, and mandatory details',
    'infos.aboutEyebrow': 'Background',
    'infos.aboutDescription': 'Project, contributors, and version',
    'welcome.offline': 'You are offline…',
    'welcome.error': 'Something went wrong. Please try again.',
    'welcome.resume.title': 'Resume rallye',
    'welcome.resume.details': 'Rallye: {{rallye}}\nTeam: {{team}}',
    'welcome.join.description': 'Select a rallye and join with your team',
    'welcome.explore.title': 'Explore Campus',
    'welcome.explore.description':
      'Explore the campus at your own pace without time pressure',
    'welcome.explore.start': 'Start exploring',
    'welcome.tourModeUnavailable': 'No tour mode rallye available.',
    'welcome.participationStartError': 'Could not start participation.',
    'welcome.clearParticipation.title': 'Clear participation',
    'welcome.clearParticipation.message':
      'Do you really want to clear the saved participation? The team assignment on this device will be removed.',
    'welcome.clearParticipation.confirm': 'Clear',
    'welcome.selectLocation.title': 'Select Location',
    'welcome.selectLocation.description':
      'Select your location to see available rallyes',
    'welcome.selectLocation.empty': 'No locations available',
    'welcome.selectDepartment.description': 'Department rallyes',
    'welcome.noContent':
      'No active rallyes are currently available for this location.',
    'welcome.departmentLoadError': 'Location content could not be loaded.',
    'rallye.status.draft': 'Draft',
    'rallye.status.ready': 'Ready',
    'rallye.status.running': 'Running',
    'rallye.status.voting': 'Voting',
    'rallye.status.results': 'Results',
    'rallye.status.ended': 'Completed',
    'rallye.code.required.title': 'Enter code',
    'rallye.code.required.badge': 'Code required',
    'rallye.code.required.hint': 'Join with the rallye code only',
    'rallye.code.missing.title': 'Code required',
    'rallye.code.missing.message': 'Please enter the rallye code.',
    'rallye.code.wrong.title': 'Wrong code',
    'rallye.code.wrong.message': 'Please enter the correct code.',
    'rallye.code.enter': 'Enter code',
    'rallye.code.label': 'Code',
    'rallye.code.placeholder': 'Code',
    'rallye.code.subtitle': 'Enter the code to join',
    'rallye.code.helper': 'Ask your supervisor for the code',
    'rallye.code.join': 'Join',
    'rallye.join': 'Join',
    'rallye.joinWithCode': 'Join with code',
    'rallye.modal.activeTitle': 'Active Rallyes',
    'rallye.modal.noActive':
      'No active rallyes available. Please wait until a rallye starts.',
    'rallye.progress': 'Question {{current}} of {{total}}',
    'rallye.allAnswered.title': 'Campus exploration complete',
    'rallye.allAnswered.simple': 'All questions answered',
    'rallye.correctAnswers':
      '{{correct}} of {{total}} questions answered correctly',
    'tour.feedback.correct': 'That is correct!',
    'tour.feedback.incorrect': 'Unfortunately, that is incorrect…',
    'tour.feedback.correctAnswer': 'The correct answer is: {{answer}}',
    'rallye.backToStart': 'Back to start',
    'rallye.plannedEnd': 'planned until {{time}}',
    'rallye.teamLabel': 'Team: {{team}}',
    'rallye.currentTeamLabel': 'Your team:',
    'rallye.pointsLabel': 'Points: {{points}}',
    'rallye.meetingPoint': 'Please come to the agreed meeting point.',
    'rallye.noQuestions.title': 'No questions',
    'rallye.noQuestions.message': 'Currently no questions available.',
    'rallye.preparing.title': 'The rally has not started yet',
    'rallye.preparing.message': 'Please wait for the rally to start',
    'rallye.error.loadQuestions': 'The questions could not be loaded.',
    'rallye.error.noInternet': 'No internet connection available',
    'teamSetup.message': 'Create a team to participate in the rally.',
    'teamSetup.button': 'Create team',
    'teamSetup.error.message': 'Team could not be created. Please try again.',
    'team.sheetTitle': 'Your Team',
    'team.deleted.title': 'Team no longer exists',
    'team.deleted.message':
      'Your team no longer exists, probably because the rally was reset. Please create a new team.',
    'question.submit': 'Submit answer',
    'question.options.loading': 'Loading answer options…',
    'question.placeholder.answer': 'Your answer...',
    'question.error.selectAnswer': 'Please select an answer.',
    'question.error.enterAnswer': 'Please enter an answer.',
    'question.error.pleaseWaitTitle': 'Please wait',
    'question.error.answerLoading': 'Answer data is still loading.',
    'question.error.qrLoading': 'QR code data is still loading.',
    'question.error.saveAnswer': 'Answer could not be saved.',
    'question.qr.incorrect':
      'The QR code is incorrect! You are probably not at the right place.',
    'question.qr.correctMessage': 'This is the correct QR code!',
    'question.camera.needAccess': 'We need access to the camera',
    'question.camera.allow': 'Allow access to camera',
    'question.camera.deniedInSettings':
      'Camera access was denied. You can allow it in the settings.',
    'question.qr.hideCamera': 'Hide Camera',
    'question.qr.scan': 'Scan QR code',
    'question.photo.take': 'Take photo',
    'question.photo.switch': 'Switch camera',
    'question.photo.new': 'New photo',
    'question.photo.send': 'Send photo',
    'question.photo.privacyTitle': 'Privacy for photo answers',
    'question.photo.privacyNotice':
      'We store your photo to evaluate the rally. Only the organizers can view it. We delete it within 30 days of upload. Upload photos of recognizable people only if they agreed to being photographed and to the upload.',
    'question.photo.consent':
      'I agree to the upload and the described use of the photo.',
    'question.photo.offlineMessage':
      'Photo uploads require an internet connection.',
    'question.photo.offlineNotice': 'Offline: photo uploads require internet.',
    'question.error.submitPhoto': 'Photo could not be sent.',
    'question.error.surrender': 'An error occurred while surrendering.',
    'question.unknown.title': 'Unknown question type',
    'question.unknown.message':
      'This question type is not supported yet: {{type}}',
    'question.skip': 'Skip question',
    'hint.confirm.title': 'Security question',
    'hint.confirm.freeMessage':
      'Would you like a hint? Hints for this photo question do not cost any points.',
    'hint.confirm.message':
      'Are you sure you want to receive a hint? This will cost you {{cost}} point(s).',
    'hint.confirm.confirm': 'Yes, I want a hint',
    'hint.title': 'Hint',
    'hint.error.save': 'The hint could not be saved.',
    'confirm.answer.title': 'Security question',
    'confirm.answer.message':
      'Do you really want to submit "{{answer}}" as your answer?',
    'confirm.answer.confirm': 'Submit answer',
    'confirm.surrender.title': 'Security question',
    'confirm.surrender.message': 'Do you really want to give up this task?',
    'confirm.surrender.confirm': 'Yes, I want to give up',
    'confirm.exit.title': 'End participation',
    'confirm.exit.message':
      'Do you really want to end participation? The team assignment on this device will be removed.',
    'confirm.exit.confirm': 'End',
    'confirm.tourExit.title': 'End exploration',
    'confirm.tourExit.message': 'Do you really want to end the exploration?',
    'scoreboard.rowLabel': 'Rank {{rank}}, Team {{team}}, Points {{points}}',
    'scoreboard.error.load': 'The final standings could not be loaded.',
    'voting.ended.title': 'Voting has ended.',
    'voting.ended.message': 'Wait for the rallye to finish.',
    'voting.unavailable.title': 'No voting available',
    'voting.unavailable.message':
      'There are currently not enough answers available for voting.',
    'voting.instruction':
      'Give an extra point to the team that you think solved the task above the best.',
    'voting.next': 'Next vote',
    'voting.error.load': 'Voting could not be loaded.',
    'voting.error.submit': 'Vote could not be saved.',
    'scoreboard.title': 'Final standings',
    'geocaching.arrived': 'Destination reached!',
    'geocaching.calibrate':
      'Please move your device in a figure-8 motion to calibrate the compass.',
    'geocaching.error.noCoordinates':
      'No target coordinates are set for this question.',
    'geocaching.error.locationDenied':
      'Location access was denied. This question type requires GPS.',
    'geocaching.error.locationDeniedInSettings':
      'Location access was denied. You can allow it in the settings.',
    'geocaching.instruction.text':
      'Find the destination first, then enter the answer!',
    'geocaching.instruction.qr':
      'Find the destination first, then scan the QR code!',
    'geocaching.retryPermission': 'Request location again',
    'geocaching.skipCalibration': 'Skip',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type TranslationParams = Record<string, string | number>;
export type Translator = (
  key: TranslationKey,
  params?: TranslationParams
) => string;

export const translate = (
  language: Language,
  key: TranslationKey,
  params?: TranslationParams
) => {
  const template =
    translations[language][key] ?? translations.en[key] ?? String(key);
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
};

export const resolveDeviceLanguage = (): Language => {
  try {
    const locales = getLocales();
    if (locales[0]?.languageCode?.toLowerCase().startsWith('de')) return 'de';
  } catch {
    // Fall back to English if native API unavailable.
  }
  return 'en';
};
