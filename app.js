(() => {
  const STORAGE_KEY = 'pheisiraetha_v01';
  const ONBOARDING_KEY = 'pheisiraetha_onboarding_v01';
  const LANGUAGE_KEY = 'pheisiraetha_language_v01';
  const APP_VERSION = '0.1.0';
  const SUPPORTED_LANGUAGES = ['ru','en','de'];
  const LANGUAGE_OPTIONS = [
    {code:'ru',label:'Русский'},
    {code:'en',label:'English'},
    {code:'de',label:'Deutsch'}
  ];
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const now = () => new Date().toISOString();
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const T = {
    en: {
      brand:'PHEISIRAETHA', languageLabel:'Language', home:'Home', history:'History', data:'Data',
      local:'Local-first beta', productVersion:'PHEISIRAETHA v0.1', title:'Turn intention into a traceable cycle.',
      intro:'Define what you want, record effort and emotion, observe what actually happened, then deliberately keep or revise the intention.',
      noGoal:'No active intention yet.', createGoal:'Create intention', activeGoal:'Active intention',
      checkin:'New check-in', editIntent:'Edit current intention', cycles:'cycles', cycleOne:'cycle', cycleFew:'cycles', cycleMany:'cycles', next:'Continue', back:'Back', save:'Save', cancel:'Cancel',
      ris:'Ratified Intent State (RIS)', primary:'Primary objective', primaryHelp:'What are you ultimately trying to create, achieve, change or complete?',
      success:'Success criteria', successHelp:'What would need to be true for you to consider this successful?',
      scope:'Scope', scopeHelp:'What is included in this intention or project?',
      nonGoals:'Non-goals', nonGoalsHelp:'What is deliberately not part of the goal?',
      constraints:'Constraints', constraintsHelp:'What limits, rules or conditions must be respected?',
      rationale:'Rationale', rationaleHelp:'Why does this intention matter to you?',
      required:'Please complete all six RIS fields.', created:'Intention created.', updated:'RIS updated.',
      cie:'Current Intention Snapshot', cieIntro:'Describe the project as it exists right now. Do not try to reproduce your previous wording.',
      iep:'Intent & Energy Profile', oop:'Observed Outcome Profile', revise:'Intentional revision',
      desire:'How strongly do you currently want this outcome?', belief:'How strongly do you currently believe this outcome is possible?',
      emotion:'Which emotion best describes how you currently feel about this outcome?', emotionIntensity:'How intense is that emotion?',
      mental:'How much mental attention and effort are you currently investing?', practical:'How much practical effort are you currently investing?',
      frequency:'How often do you think about, rehearse, visualise, or direct attention toward this outcome?',
      actions:'What concrete actions, time, money, resources, or physical effort are you investing? If none, write “None”.',
      hours:'Approximately how many hours have you spent on concrete actions toward this outcome during the past 7 days?',
      currentState:'What observable situation or result currently exists in relation to this intention?',
      achievement:'To what extent has the desired outcome been achieved at this moment?',
      events:'What observable events or changes occurred during the past 7 days? If none, write “No observable change.”',
      direction:'Overall, in which direction has the observable situation changed during the past 7 days?',
      evidence:'What is this assessment based on? Select all that apply.',
      external:'What external circumstances, events, or conditions outside your direct control were relevant? If none, write “None known”.',
      intentional:'Since the previous checkpoint, did you intentionally change any part of your objective, success criteria, scope, non-goals, constraints, or rationale?',
      yes:'Yes', no:'No', unsure:'Not sure', changedParts:'Which parts do you intentionally want to revise?',
      revisionHelp:'Only selected dimensions will replace the current RIS. Everything else stays unchanged.',
      complete:'Complete check-in', saved:'Check-in saved.', noHistory:'No check-ins yet.',
      cancelCheckinConfirm:'Cancel this check-in?', selectRevisionRequired:'Select at least one RIS dimension to revise.',
      aboutTitle:'About PHEISIRAETHA',
      aboutIntro:'PHEISIRAETHA is a local-first self-reflection tool for tracking an intention over time through repeated check-ins.',
      aboutPrivacy:'In v0.1, your entries are stored locally in this browser on this device. There is no account, cloud database, advertising SDK or server synchronisation.',
      aboutDisclaimer:'PHEISIRAETHA does not establish that thoughts, emotions, intentions or effort cause external events. It is not medical or psychological treatment.',
      feedback:'Report a problem / send feedback',
      export:'Export backup (JSON)', import:'Import backup', delete:'Delete all local data', deleteConfirm:'Delete the entire local PHEISIRAETHA record on this device? This cannot be undone unless you exported a backup.',
      exported:'Backup exported.', imported:'Backup imported.', importError:'This file is not a valid PHEISIRAETHA v0.1 backup.',
      disclaimer:'Self-reflection tool. It does not establish that thoughts, emotions, intentions or effort cause external events. It is not medical or psychological treatment.',
      recommended:'Recommended rhythm: one check-in per week. v0.1 does not lock the timer.',
      summary:'Latest snapshot', achieved:'Achievement', desireShort:'Desire', mentalShort:'Mental effort', practicalShort:'Practical effort',
      directionToward:'Moved toward the desired outcome', directionNone:'No meaningful change', directionAway:'Moved away from the desired outcome', directionMixed:'Mixed or unclear change', directionUnknown:'Not enough information to determine',
      evidenceDirect:'Directly observed events or conditions', evidenceDocumented:'Documented or recorded information', evidenceOtherPerson:'Information provided or confirmed by another person', evidenceSubjective:'My overall subjective impression', evidenceInsufficient:'Not enough information to assess', evidenceOther:'Other',
      freq0:'Not at all', freq1:'Less than once per day', freq2:'About once per day', freq3:'Several times per day', freq4:'Many times per day', freq5:'Almost continuously',
      emotions:['Love / affection','Joy / excitement','Hope / positive anticipation','Calm / contentment','Fear / anxiety','Anger / frustration','Sadness / disappointment','Shame / guilt','Neutral / little emotion','Other']
    },

    ru: {
      brand:'PHEISIRAETHA', languageLabel:'Язык', home:'Главная', history:'История', data:'Данные',
      local:'Локальная beta-версия', productVersion:'PHEISIRAETHA v0.1', title:'Преврати намерение в отслеживаемый цикл.',
      intro:'Определи, чего ты хочешь, зафиксируй усилия и эмоции, наблюдай, что реально произошло, а затем сознательно сохрани или измени намерение.',
      noGoal:'Активного намерения пока нет.', createGoal:'Создать намерение', activeGoal:'Активное намерение',
      checkin:'Новый check-in', editIntent:'Изменить текущее намерение', cycles:'циклов', cycleOne:'цикл', cycleFew:'цикла', cycleMany:'циклов', next:'Далее', back:'Назад', save:'Сохранить', cancel:'Отмена',
      ris:'Зафиксированное состояние намерения (RIS)', primary:'Основная цель', primaryHelp:'Что в конечном итоге ты пытаешься создать, достичь, изменить или завершить?',
      success:'Критерии успеха', successHelp:'Что должно стать реальностью, чтобы ты считал цель достигнутой?',
      scope:'Область', scopeHelp:'Что входит в это намерение или проект?',
      nonGoals:'Не-цели', nonGoalsHelp:'Что сознательно не является частью цели?',
      constraints:'Ограничения', constraintsHelp:'Какие рамки, правила или условия необходимо соблюдать?',
      rationale:'Обоснование', rationaleHelp:'Почему это намерение для тебя важно?',
      required:'Заполни все шесть полей RIS.', created:'Намерение создано.', updated:'RIS обновлён.',
      cie:'Текущее состояние намерения', cieIntro:'Опиши проект таким, каким он существует прямо сейчас. Не пытайся воспроизвести прежнюю формулировку.',
      iep:'Профиль намерения и энергии', oop:'Профиль наблюдаемого результата', revise:'Сознательное изменение',
      desire:'Насколько сильно ты сейчас хочешь этого результата?', belief:'Насколько сильно ты сейчас веришь, что этот результат возможен?',
      emotion:'Какая эмоция лучше всего описывает твоё текущее отношение к этому результату?', emotionIntensity:'Насколько сильна эта эмоция?',
      mental:'Сколько умственного внимания и усилий ты сейчас вкладываешь?', practical:'Сколько практических усилий ты сейчас вкладываешь?',
      frequency:'Как часто ты думаешь об этом результате, мысленно репетируешь, визуализируешь или направляешь на него внимание?',
      actions:'Какие конкретные действия, время, деньги, ресурсы или физические усилия ты вкладываешь? Если никаких — напиши «Нет».',
      hours:'Примерно сколько часов за последние 7 дней ты потратил на конкретные действия в направлении этого результата?',
      currentState:'Какая наблюдаемая ситуация или результат существует сейчас в отношении этого намерения?',
      achievement:'В какой степени желаемый результат достигнут сейчас?',
      events:'Какие наблюдаемые события или изменения произошли за последние 7 дней? Если никаких — напиши «Наблюдаемых изменений нет».',
      direction:'В целом, в каком направлении изменилась наблюдаемая ситуация за последние 7 дней?',
      evidence:'На чём основана эта оценка? Можно выбрать несколько вариантов.',
      external:'Какие внешние обстоятельства, события или условия вне твоего прямого контроля были важны? Если никаких — напиши «Неизвестно/нет».',
      intentional:'С предыдущей контрольной точки ты сознательно изменил какую-либо часть основной цели, критериев успеха, области, не-целей, ограничений или обоснования?',
      yes:'Да', no:'Нет', unsure:'Не уверен', changedParts:'Какие части ты сознательно хочешь изменить?',
      revisionHelp:'Только выбранные измерения заменят текущий RIS. Всё остальное останется без изменений.',
      complete:'Завершить check-in', saved:'Check-in сохранён.', noHistory:'Check-in пока нет.',
      cancelCheckinConfirm:'Отменить текущий check-in?', selectRevisionRequired:'Выбери хотя бы одну часть RIS для изменения.',
      aboutTitle:'О PHEISIRAETHA',
      aboutIntro:'PHEISIRAETHA — это локальный инструмент самонаблюдения, который помогает отслеживать намерение во времени с помощью повторных check-in.',
      aboutPrivacy:'В версии v0.1 записи хранятся локально в этом браузере на этом устройстве. Нет аккаунта, облачной базы данных, рекламного SDK или серверной синхронизации.',
      aboutDisclaimer:'PHEISIRAETHA не устанавливает, что мысли, эмоции, намерения или усилия вызывают внешние события. Это не медицинское и не психологическое лечение.',
      feedback:'Сообщить об ошибке / оставить отзыв',
      export:'Экспорт резервной копии (JSON)', import:'Импорт резервной копии', delete:'Удалить все локальные данные', deleteConfirm:'Удалить всю локальную запись PHEISIRAETHA на этом устройстве? Отменить это будет нельзя, если нет экспортированной копии.',
      exported:'Резервная копия экспортирована.', imported:'Резервная копия импортирована.', importError:'Этот файл не является корректной резервной копией PHEISIRAETHA v0.1.',
      disclaimer:'Инструмент самонаблюдения. Он не устанавливает, что мысли, эмоции, намерения или усилия вызывают внешние события. Это не медицинское и не психологическое лечение.',
      recommended:'Рекомендуемый ритм: один check-in в неделю. В v0.1 таймер не блокируется.',
      summary:'Последний снимок', achieved:'Достижение', desireShort:'Желание', mentalShort:'Умственные усилия', practicalShort:'Практические усилия',
      directionToward:'Продвижение к желаемому результату', directionNone:'Значимых изменений нет', directionAway:'Удаление от желаемого результата', directionMixed:'Смешанное или неясное изменение', directionUnknown:'Недостаточно информации',
      evidenceDirect:'Непосредственно наблюдаемые события или условия', evidenceDocumented:'Документированная или записанная информация', evidenceOtherPerson:'Информация, предоставленная или подтверждённая другим человеком', evidenceSubjective:'Моё общее субъективное впечатление', evidenceInsufficient:'Недостаточно информации для оценки', evidenceOther:'Другое',
      freq0:'Вообще нет', freq1:'Реже одного раза в день', freq2:'Примерно раз в день', freq3:'Несколько раз в день', freq4:'Много раз в день', freq5:'Почти постоянно',
      emotions:['Любовь / привязанность','Радость / воодушевление','Надежда / позитивное ожидание','Спокойствие / удовлетворённость','Страх / тревога','Гнев / фрустрация','Грусть / разочарование','Стыд / вина','Нейтрально / почти без эмоций','Другое']
    },

    de: {
      brand:'PHEISIRAETHA', languageLabel:'Sprache', home:'Startseite', history:'Verlauf', data:'Daten',
      local:'Lokale Beta-Version', productVersion:'PHEISIRAETHA v0.1', title:'Mache aus einer Absicht einen nachvollziehbaren Zyklus.',
      intro:'Definiere, was du erreichen möchtest, halte Aufwand und Emotionen fest, beobachte, was tatsächlich geschieht, und entscheide anschließend bewusst, ob du die Absicht beibehältst oder überarbeitest.',
      noGoal:'Noch keine aktive Absicht.', createGoal:'Absicht erstellen', activeGoal:'Aktive Absicht',
      checkin:'Neuer Check-in', editIntent:'Aktuelle Absicht bearbeiten', cycles:'Zyklen', cycleOne:'Zyklus', cycleFew:'Zyklen', cycleMany:'Zyklen', next:'Weiter', back:'Zurück', save:'Speichern', cancel:'Abbrechen',
      ris:'Ratified Intent State (RIS)', primary:'Hauptziel', primaryHelp:'Was möchtest du letztlich erschaffen, erreichen, verändern oder abschließen?',
      success:'Erfolgskriterien', successHelp:'Was müsste erfüllt sein, damit du das Vorhaben als erfolgreich betrachtest?',
      scope:'Umfang', scopeHelp:'Was gehört zu dieser Absicht oder diesem Projekt?',
      nonGoals:'Nicht-Ziele', nonGoalsHelp:'Was gehört bewusst nicht zum Ziel?',
      constraints:'Einschränkungen', constraintsHelp:'Welche Grenzen, Regeln oder Bedingungen müssen eingehalten werden?',
      rationale:'Begründung', rationaleHelp:'Warum ist dir diese Absicht wichtig?',
      required:'Bitte fülle alle sechs RIS-Felder aus.', created:'Absicht erstellt.', updated:'RIS aktualisiert.',
      cie:'Aktueller Stand der Absicht', cieIntro:'Beschreibe das Vorhaben so, wie es jetzt besteht. Versuche nicht, deine frühere Formulierung zu wiederholen.',
      iep:'Absichts- und Energieprofil', oop:'Profil des beobachtbaren Ergebnisses', revise:'Bewusste Überarbeitung',
      desire:'Wie stark wünschst du dir dieses Ergebnis derzeit?', belief:'Wie stark glaubst du derzeit, dass dieses Ergebnis möglich ist?',
      emotion:'Welche Emotion beschreibt am besten, wie du dich derzeit in Bezug auf dieses Ergebnis fühlst?', emotionIntensity:'Wie intensiv ist diese Emotion?',
      mental:'Wie viel gedankliche Aufmerksamkeit und Anstrengung investierst du derzeit?', practical:'Wie viel praktischen Aufwand investierst du derzeit?',
      frequency:'Wie häufig denkst du an dieses Ergebnis, gehst es gedanklich durch, visualisierst es oder richtest deine Aufmerksamkeit darauf?',
      actions:'Welche konkreten Handlungen, Zeit, Geldmittel, Ressourcen oder körperlichen Anstrengungen investierst du? Falls keine, schreibe „Keine“.',
      hours:'Wie viele Stunden hast du in den vergangenen 7 Tagen ungefähr für konkrete Handlungen in Richtung dieses Ergebnisses aufgewendet?',
      currentState:'Welche beobachtbare Situation oder welches Ergebnis besteht derzeit in Bezug auf diese Absicht?',
      achievement:'In welchem Maß ist das gewünschte Ergebnis derzeit erreicht?',
      events:'Welche beobachtbaren Ereignisse oder Veränderungen gab es in den vergangenen 7 Tagen? Falls keine, schreibe „Keine beobachtbare Veränderung.“',
      direction:'In welche Richtung hat sich die beobachtbare Situation in den vergangenen 7 Tagen insgesamt verändert?',
      evidence:'Worauf beruht diese Einschätzung? Wähle alle zutreffenden Angaben aus.',
      external:'Welche äußeren Umstände, Ereignisse oder Bedingungen außerhalb deiner direkten Kontrolle waren relevant? Falls keine, schreibe „Keine bekannt“.',
      intentional:'Hast du seit dem vorherigen Check-in bewusst einen Teil des Hauptziels, der Erfolgskriterien, des Umfangs, der Nicht-Ziele, der Einschränkungen oder der Begründung verändert?',
      yes:'Ja', no:'Nein', unsure:'Nicht sicher', changedParts:'Welche Teile möchtest du bewusst überarbeiten?',
      revisionHelp:'Nur ausgewählte Bereiche ersetzen den aktuellen RIS. Alles andere bleibt unverändert.',
      complete:'Check-in abschließen', saved:'Check-in gespeichert.', noHistory:'Noch keine Check-ins.',
      cancelCheckinConfirm:'Diesen Check-in abbrechen?', selectRevisionRequired:'Wähle mindestens einen RIS-Bereich zur Überarbeitung aus.',
      aboutTitle:'Über PHEISIRAETHA',
      aboutIntro:'PHEISIRAETHA ist ein lokales Werkzeug zur Selbstreflexion, mit dem eine Absicht über wiederholte Check-ins im Zeitverlauf beobachtet werden kann.',
      aboutPrivacy:'In Version v0.1 werden deine Einträge lokal in diesem Browser auf diesem Gerät gespeichert. Es gibt kein Konto, keine Cloud-Datenbank, kein Werbe-SDK und keine Serversynchronisierung.',
      aboutDisclaimer:'PHEISIRAETHA weist nicht nach, dass Gedanken, Emotionen, Absichten oder Aufwand äußere Ereignisse verursachen. Es ist keine medizinische oder psychologische Behandlung.',
      feedback:'Problem melden / Feedback senden',
      export:'Sicherung exportieren (JSON)', import:'Sicherung importieren', delete:'Alle lokalen Daten löschen', deleteConfirm:'Den gesamten lokalen PHEISIRAETHA-Datensatz auf diesem Gerät löschen? Ohne exportierte Sicherung kann dies nicht rückgängig gemacht werden.',
      exported:'Sicherung exportiert.', imported:'Sicherung importiert.', importError:'Diese Datei ist keine gültige PHEISIRAETHA-v0.1-Sicherung.',
      disclaimer:'Werkzeug zur Selbstreflexion. Es weist nicht nach, dass Gedanken, Emotionen, Absichten oder Aufwand äußere Ereignisse verursachen. Es ist keine medizinische oder psychologische Behandlung.',
      recommended:'Empfohlener Rhythmus: ein Check-in pro Woche. In v0.1 ist der Zeitraum nicht gesperrt.',
      summary:'Letzter Stand', achieved:'Erreichungsgrad', desireShort:'Wunschstärke', mentalShort:'Gedanklicher Aufwand', practicalShort:'Praktischer Aufwand',
      directionToward:'Dem gewünschten Ergebnis angenähert', directionNone:'Keine wesentliche Veränderung', directionAway:'Vom gewünschten Ergebnis entfernt', directionMixed:'Gemischte oder unklare Veränderung', directionUnknown:'Nicht genügend Informationen für eine Einschätzung',
      evidenceDirect:'Direkt beobachtete Ereignisse oder Bedingungen', evidenceDocumented:'Dokumentierte oder aufgezeichnete Informationen', evidenceOtherPerson:'Von einer anderen Person mitgeteilte oder bestätigte Informationen', evidenceSubjective:'Mein subjektiver Gesamteindruck', evidenceInsufficient:'Nicht genügend Informationen für eine Einschätzung', evidenceOther:'Sonstiges',
      freq0:'Überhaupt nicht', freq1:'Weniger als einmal pro Tag', freq2:'Etwa einmal pro Tag', freq3:'Mehrmals pro Tag', freq4:'Sehr oft am Tag', freq5:'Fast ununterbrochen',
      emotions:['Liebe / Zuneigung','Freude / Begeisterung','Hoffnung / positive Erwartung','Ruhe / Zufriedenheit','Angst / Sorge','Ärger / Frustration','Traurigkeit / Enttäuschung','Scham / Schuldgefühl','Neutral / kaum Emotion','Sonstiges']
    }
  };

  const ONBOARDING = {
    en: {
      continue:'Continue',
      skip:'Skip',
      start:'Start',
      progress:step=>`Step ${step} of 4`,
      screens:[
        {
          title:'PHEISIRAETHA',
          lead:'From intention to observable outcome.',
          paragraphs:[
            'PHEISIRAETHA helps you define what you want to achieve and then observe how your actions, state, and real-world outcomes change over time.'
          ]
        },
        {
          title:'1. Define your intention',
          paragraphs:[
            'Create a RIS — your ratified intention state: objective, success criteria, scope, non-goals, constraints and rationale.',
            'This becomes your reference point.'
          ]
        },
        {
          title:'2. Check in over time',
          paragraphs:[
            'During a check-in you independently describe the current state of your intention, your emotions and effort, and then record the observable outcome.',
            'Over time this creates a history of change.'
          ]
        },
        {
          title:"3. Observe, don't assume",
          paragraphs:[
            'PHEISIRAETHA does not claim that thoughts, emotions or intentions cause external events.',
            'The app helps separate intention, actions and observable outcomes and track how they change over time.',
            'All data in this version is stored locally on this device.'
          ]
        }
      ]
    },

    ru: {
      continue:'Далее',
      skip:'Пропустить',
      start:'Начать',
      progress:step=>`Шаг ${step} из 4`,
      screens:[
        {
          title:'PHEISIRAETHA',
          lead:'От намерения к наблюдаемому результату.',
          paragraphs:[
            'PHEISIRAETHA помогает зафиксировать то, чего ты хочешь достичь, а затем наблюдать, как со временем меняются твои действия, состояние и реальные результаты.'
          ]
        },
        {
          title:'1. Зафиксируй намерение',
          paragraphs:[
            'Создай RIS — исходное состояние намерения: цель, критерии успеха, область, не-цели, ограничения и обоснование.',
            'Это становится точкой отсчёта.'
          ]
        },
        {
          title:'2. Делай check-in',
          paragraphs:[
            'Во время check-in ты независимо описываешь текущее состояние намерения, свои эмоции и усилия, а затем фиксируешь наблюдаемый результат.',
            'Так со временем формируется история изменений.'
          ]
        },
        {
          title:'3. Наблюдай, не предполагай',
          paragraphs:[
            'PHEISIRAETHA не утверждает, что мысли, эмоции или намерения вызывают внешние события.',
            'Приложение помогает отделять намерение, действия и наблюдаемые результаты и смотреть, как они изменяются со временем.',
            'Все данные этой версии хранятся только локально на этом устройстве.'
          ]
        }
      ]
    },

    de: {
      continue:'Weiter',
      skip:'Überspringen',
      start:'Starten',
      progress:step=>`Schritt ${step} von 4`,
      screens:[
        {
          title:'PHEISIRAETHA',
          lead:'Von der Absicht zum beobachtbaren Ergebnis.',
          paragraphs:[
            'Mit PHEISIRAETHA kannst du festhalten, was du erreichen möchtest, und anschließend beobachten, wie sich deine Handlungen, dein Zustand und die realen Ergebnisse im Laufe der Zeit verändern.'
          ]
        },
        {
          title:'1. Definiere deine Absicht',
          paragraphs:[
            'Erstelle einen RIS — deinen Ratified Intent State: Hauptziel, Erfolgskriterien, Umfang, Nicht-Ziele, Einschränkungen und Begründung.',
            'Er wird zu deinem Bezugspunkt.'
          ]
        },
        {
          title:'2. Führe regelmäßig Check-ins durch',
          paragraphs:[
            'Bei einem Check-in beschreibst du unabhängig den aktuellen Stand deiner Absicht, deine Emotionen und deinen Aufwand und hältst anschließend das beobachtbare Ergebnis fest.',
            'Auf diese Weise entsteht mit der Zeit ein Verlauf der Veränderungen.'
          ]
        },
        {
          title:'3. Beobachte, ohne zu unterstellen',
          paragraphs:[
            'PHEISIRAETHA behauptet nicht, dass Gedanken, Emotionen oder Absichten äußere Ereignisse verursachen.',
            'Die App hilft dabei, Absicht, Handlungen und beobachtbare Ergebnisse voneinander zu trennen und ihre Entwicklung im Laufe der Zeit zu verfolgen.',
            'Alle Daten dieser Version werden ausschließlich lokal auf diesem Gerät gespeichert.'
          ]
        }
      ]
    }
  };

  const fresh = () => ({ version: APP_VERSION, lang:'ru', intent:null });

  const RIS_FIELDS = [
    'primary',
    'success',
    'scope',
    'nonGoals',
    'constraints',
    'rationale'
  ];

  const risValues = (source={}) =>
    Object.fromEntries(
      RIS_FIELDS.map(k=>[k,String(source?.[k] ?? '')])
    );

  const isRecord = value =>
    value!==null && typeof value==='object' && !Array.isArray(value);

  const hasTextFields = (value,fields) =>
    isRecord(value) && fields.every(k=>typeof value[k]==='string');

  const isNumberIn = (value,min,max) =>
    Number.isFinite(value) && value>=min && value<=max;

  function isValidCycle(cycle){
    if(
      !isRecord(cycle) ||
      typeof cycle.id!=='string' ||
      typeof cycle.createdAt!=='string' ||
      Number.isNaN(Date.parse(cycle.createdAt)) ||
      !hasTextFields(cycle.cie,RIS_FIELDS) ||
      !isRecord(cycle.iep) ||
      !isRecord(cycle.oop) ||
      !['yes','no','unsure'].includes(cycle.intentional) ||
      !isRecord(cycle.revision)
    ) return false;

    const iep=cycle.iep;
    if(
      !['desire','belief','emotionIntensity','mental','practical']
        .every(k=>isNumberIn(iep[k],0,10)) ||
      typeof iep.emotion!=='string' ||
      !['freq0','freq1','freq2','freq3','freq4','freq5']
        .includes(iep.frequency) ||
      typeof iep.actions!=='string' ||
      !isNumberIn(iep.hours,0,168)
    ) return false;

    const oop=cycle.oop;
    if(
      typeof oop.currentState!=='string' ||
      !isNumberIn(oop.achievement,0,10) ||
      typeof oop.events!=='string' ||
      !['toward','none','away','mixed','unknown']
        .includes(oop.direction) ||
      !Array.isArray(oop.evidence) ||
      !oop.evidence.every(v=>
        ['direct','documented','otherPerson','subjective','insufficient','other']
          .includes(v)
      ) ||
      typeof oop.external!=='string'
    ) return false;

    return Object.entries(cycle.revision)
      .every(([k,v])=>RIS_FIELDS.includes(k) && typeof v==='string');
  }

  function isValidBackup(value){
    if(
      !isRecord(value) ||
      value.version!==APP_VERSION ||
      !['ru','en'].includes(value.lang) ||
      !Object.hasOwn(value,'intent')
    ) return false;

    if(value.intent===null)
      return true;

    const intent=value.intent;
    return (
      isRecord(intent) &&
      typeof intent.id==='string' &&
      typeof intent.createdAt==='string' &&
      !Number.isNaN(Date.parse(intent.createdAt)) &&
      hasTextFields(intent.ris,RIS_FIELDS) &&
      Array.isArray(intent.cycles) &&
      intent.cycles.every(isValidCycle)
    );
  }

  let state = load();
  let currentLang = loadLanguagePreference();
  let view = 'home';
  let wizard = null;
  let risDraft = null;
  let onboardingStep = hasCompletedOnboarding() ? null : 1;

  if(onboardingStep && state.intent){
    setOnboardingComplete();
    onboardingStep=null;
  }

  function load(){
    try {
      const x = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return x && x.version ? x : fresh();
    } catch {
      return fresh();
    }
  }

  function deviceLanguage(){
    const locale=String(navigator.language || '').toLowerCase();

    if(locale==='ru' || locale.startsWith('ru-')) return 'ru';
    if(locale==='de' || locale.startsWith('de-')) return 'de';

    return 'en';
  }

  function loadLanguagePreference(){
    const stored=localStorage.getItem(LANGUAGE_KEY);

    if(SUPPORTED_LANGUAGES.includes(stored))
      return stored;

    let selected;

    try{
      const legacy=JSON.parse(localStorage.getItem(STORAGE_KEY));

      if(
        legacy &&
        legacy.version===APP_VERSION &&
        ['ru','en'].includes(legacy.lang)
      ) selected=legacy.lang;
    }catch{}

    selected=selected || deviceLanguage();
    localStorage.setItem(LANGUAGE_KEY,selected);

    return selected;
  }

  function setLanguage(nextLanguage){
    if(!SUPPORTED_LANGUAGES.includes(nextLanguage))
      return;

    if(view==='ris')
      captureRISDraft();

    if(view==='wizard' && wizard)
      saveStep({trim:false});

    currentLang=nextLanguage;
    localStorage.setItem(LANGUAGE_KEY,currentLang);

    if(wizard && Number.isInteger(wizard.emotionIndex))
      wizard.iep.emotion=t('emotions')[wizard.emotionIndex];

    render();
  }

  function persist(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function hasCompletedOnboarding(){
    return localStorage.getItem(ONBOARDING_KEY)==='1';
  }

  function setOnboardingComplete(){
    localStorage.setItem(ONBOARDING_KEY,'1');
  }

  function t(k){
    return T[currentLang]?.[k] ?? T.en[k] ?? k;
  }

  function dateLabel(iso){
    const locales={ru:'ru-RU',en:'en-GB',de:'de-DE'};

    return new Intl.DateTimeFormat(
      locales[currentLang] || locales.en,
      {dateStyle:'medium', timeStyle:'short'}
    ).format(new Date(iso));
  }

  function cycleLabel(n){
    if(currentLang!=='ru') return n===1 ? t('cycleOne') : t('cycleMany');

    const mod10 = n % 10;
    const mod100 = n % 100;

    if(mod10===1 && mod100!==11) return t('cycleOne');

    if(
      mod10>=2 &&
      mod10<=4 &&
      (mod100<12 || mod100>14)
    ) return t('cycleFew');

    return t('cycleMany');
  }

  function languageSelector(buttonId,menuId){
    const options=LANGUAGE_OPTIONS.map(({code,label})=>`
      <button
        class="language-option${code===currentLang?' active':''}"
        type="button"
        role="menuitemradio"
        aria-checked="${code===currentLang}"
        tabindex="${code===currentLang?'0':'-1'}"
        data-language="${code}"
      >
        <span>${label}</span>
        <span class="language-code">${code.toUpperCase()}</span>
      </button>
    `).join('');

    return `<div class="language-picker">
      <button
        class="lang"
        id="${buttonId}"
        type="button"
        aria-label="${esc(t('languageLabel'))}: ${currentLang.toUpperCase()}"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="${menuId}"
      >${currentLang.toUpperCase()}</button>
      <div class="language-menu hidden" id="${menuId}" role="menu" aria-labelledby="${buttonId}">${options}</div>
    </div>`;
  }

  function bindLanguageSelector(buttonId,menuId){
    const button=$('#'+buttonId);
    const menu=$('#'+menuId);

    if(!button || !menu)
      return;

    const picker=button.closest('.language-picker');
    const options=$$('.language-option',menu);
    const closeMenu=({restoreFocus=false}={})=>{
      menu.classList.add('hidden');
      button.setAttribute('aria-expanded','false');

      if(restoreFocus)
        button.focus();
    };

    const focusOption=index=>{
      const count=options.length;

      if(!count)
        return;

      const next=(index+count)%count;

      options.forEach((option,optionIndex)=>
        option.tabIndex=optionIndex===next ? 0 : -1
      );

      options[next].focus();
    };

    button.addEventListener('click',()=>{
      const willOpen=menu.classList.contains('hidden');

      if(!willOpen){
        closeMenu();
        return;
      }

      menu.classList.remove('hidden');
      button.setAttribute('aria-expanded','true');

      const activeIndex=options.findIndex(option=>
        option.classList.contains('active')
      );

      focusOption(activeIndex<0 ? 0 : activeIndex);
    });

    options.forEach(option=>
      option.addEventListener('click',()=>{
        setLanguage(option.dataset.language);
        document.getElementById(buttonId)?.focus();
      })
    );

    menu.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        event.preventDefault();
        closeMenu({restoreFocus:true});
        return;
      }

      const current=options.indexOf(document.activeElement);
      const keyTargets={
        ArrowDown:current+1,
        ArrowUp:current-1,
        Home:0,
        End:options.length-1
      };

      if(Object.hasOwn(keyTargets,event.key)){
        event.preventDefault();
        focusOption(keyTargets[event.key]);
      }
    });

    picker?.addEventListener('focusout',event=>{
      if(!picker.contains(event.relatedTarget))
        closeMenu();
    });
  }

  function shell(content){
    return `<div class="shell"><header class="topbar"><div class="brand">PHEISIRAETHA</div>${languageSelector('langBtn','langMenu')}</header><main>${content}</main>${bottomNav()}</div>`;
  }

  function bottomNav(){
    return `<nav class="bottomnav">
      <button data-nav="home" class="${view==='home'?'active':''}"${view==='home'?' aria-current="page"':''}>${t('home')}</button>
      <button data-nav="history" class="${view==='history'?'active':''}"${view==='history'?' aria-current="page"':''}>${t('history')}</button>
      <button data-nav="data" class="${view==='data'?'active':''}"${view==='data'?' aria-current="page"':''}>${t('data')}</button>
    </nav>`;
  }

  function render(){
    const app = document.getElementById('app');

    document.documentElement.lang=currentLang;
    document.body.classList.toggle('is-onboarding',onboardingStep!==null);

    if(onboardingStep!==null){
      app.innerHTML=renderOnboarding();
      bindOnboarding();
      return;
    }

    if(view==='ris') app.innerHTML = shell(renderRIS());
    else if(view==='wizard') app.innerHTML = shell(renderWizard());
    else if(view==='history') app.innerHTML = shell(renderHistory());
    else if(view==='data') app.innerHTML = shell(renderData());
    else app.innerHTML = shell(renderHome());

    bindCommon();

    if(view==='ris') bindRIS();
    if(view==='wizard') bindWizard();
    if(view==='data') bindData();
  }

  function renderAndFocusHeading(){
    render();

    const heading=$('#app main h1');

    if(heading){
      heading.tabIndex=-1;
      heading.focus();
    }
  }

  function renderOnboarding(){
    const copy=ONBOARDING[currentLang] || ONBOARDING.en;
    const screen=copy.screens[onboardingStep-1];
    const progressLabel=copy.progress(onboardingStep);
    const dots=copy.screens.map((_,index)=>{
      const step=index+1;
      const classes=[
        'onboarding-dot',
        step<onboardingStep ? 'complete' : '',
        step===onboardingStep ? 'active' : ''
      ].filter(Boolean).join(' ');

      return `<span class="${classes}"${step===onboardingStep ? ' aria-current="step"' : ''}></span>`;
    }).join('');

    return `<div class="onboarding-shell">
      <header class="onboarding-topbar">
        <div class="brand">PHEISIRAETHA</div>
        ${languageSelector('onboardingLangBtn','onboardingLangMenu')}
      </header>

      <main class="onboarding-main">
        <section class="onboarding-panel" aria-labelledby="onboardingTitle">
          <div class="onboarding-progress-row">
            <span class="onboarding-count">${onboardingStep} / 4</span>
            <div class="onboarding-dots" role="img" aria-label="${esc(progressLabel)}">${dots}</div>
          </div>

          <div class="onboarding-content">
            <h1 id="onboardingTitle">${esc(screen.title)}</h1>
            ${screen.lead ? `<p class="onboarding-lead">${esc(screen.lead)}</p>` : ''}
            ${screen.paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}
          </div>

          <div class="onboarding-actions${onboardingStep===4?' single':''}">
            ${onboardingStep<4 ? `<button class="btn secondary" id="onboardingSkip" type="button">${copy.skip}</button>` : ''}
            <button class="btn primary" id="${onboardingStep<4?'onboardingNext':'onboardingStart'}" type="button">
              ${onboardingStep<4 ? copy.continue : copy.start}
            </button>
          </div>
        </section>
      </main>
    </div>`;
  }

  function bindOnboarding(){
    bindLanguageSelector('onboardingLangBtn','onboardingLangMenu');

    $('#onboardingNext')?.addEventListener('click',()=>{
      onboardingStep=Math.min(4,onboardingStep+1);
      renderAndFocusHeading();
    });

    $('#onboardingSkip')?.addEventListener('click',completeOnboarding);
    $('#onboardingStart')?.addEventListener('click',completeOnboarding);
  }

  function completeOnboarding(){
    setOnboardingComplete();
    onboardingStep=null;
    view='home';
    wizard=null;
    risDraft=null;
    renderAndFocusHeading();
  }

  function renderHome(){

    if(!state.intent)
      return `<section class="hero"><span class="kicker">${t('local')}</span><h1>${t('title')}</h1><p class="muted">${t('intro')}</p></section>
      <div class="card empty"><h2>${t('noGoal')}</h2><button class="btn primary" id="createGoal">${t('createGoal')}</button></div>
      <div class="notice smalltext">${t('disclaimer')}</div>`;

    const c = state.intent.cycles || [];
    const last = c[c.length-1];

    return `<section class="hero"><span class="kicker">${t('activeGoal')}</span><h1>${esc(state.intent.ris.primary)}</h1><p class="muted">${esc(state.intent.ris.success)}</p></section>

      <div class="grid">
        <button class="btn primary" id="startCheckin">${t('checkin')}</button>
        <button class="btn secondary" id="editGoal">${t('editIntent')}</button>
      </div>

      <div class="card flat">
        <div class="row">
          <h2>${t('ris')}</h2>
          <span class="pill">${c.length} ${cycleLabel(c.length)}</span>
        </div>
        ${risSummary(state.intent.ris)}
      </div>

      ${last ? `
      <div class="card">
        <h2>${t('summary')}</h2>
        <div class="grid">

          <div class="metric">
            <span>${t('achieved')}</span>
            <strong>${last.oop.achievement}/10</strong>
          </div>

          <div class="metric">
            <span>${t('desireShort')}</span>
            <strong>${last.iep.desire}/10</strong>
          </div>

          <div class="metric">
            <span>${t('mentalShort')}</span>
            <strong>${last.iep.mental}/10</strong>
          </div>

          <div class="metric">
            <span>${t('practicalShort')}</span>
            <strong>${last.iep.practical}/10</strong>
          </div>

        </div>
      </div>` : ''}

      <div class="notice smalltext">${t('recommended')}</div>`;
  }

  function risSummary(r){
    return `
      <p><strong>${t('success')}:</strong> ${esc(r.success)}</p>
      <p><strong>${t('scope')}:</strong> ${esc(r.scope)}</p>
      <p><strong>${t('nonGoals')}:</strong> ${esc(r.nonGoals)}</p>
      <p><strong>${t('constraints')}:</strong> ${esc(r.constraints)}</p>
      <p><strong>${t('rationale')}:</strong> ${esc(r.rationale)}</p>
    `;
  }

  function field(key, value='', helpKey){
    const helpId=helpKey ? `${key}Help` : '';

    return `<label for="${key}">${t(key)}</label>
    <textarea id="${key}" required${helpId ? ` aria-describedby="${helpId}"` : ''}>${esc(value)}</textarea>
    ${helpKey ? `<div class="help" id="${helpId}">${t(helpKey)}</div>` : ''}`;
  }

  function renderRIS(){

    if(!risDraft)
      risDraft=risValues(state.intent?.ris);

    const r=risDraft;

    return `<div class="row">
      <h1>${t('ris')}</h1>
      <button class="btn secondary small" id="risCancel">${t('cancel')}</button>
    </div>

    <div class="card flat">

      ${field('primary',r.primary,'primaryHelp')}
      ${field('success',r.success,'successHelp')}
      ${field('scope',r.scope,'scopeHelp')}
      ${field('nonGoals',r.nonGoals,'nonGoalsHelp')}
      ${field('constraints',r.constraints,'constraintsHelp')}
      ${field('rationale',r.rationale,'rationaleHelp')}

      <button class="btn primary" id="risSave" style="margin-top:18px">${t('save')}</button>

      <div id="risMsg" class="help" aria-live="polite" aria-atomic="true"></div>
    </div>`;
  }

  function startWizard(){

    const r = state.intent.ris;

    wizard = {
      step:1,

      cie:{
        primary:'',
        success:'',
        scope:'',
        nonGoals:'',
        constraints:'',
        rationale:''
      },

      iep:{
        desire:5,
        belief:5,
        emotion:t('emotions')[2],
        emotionIntensity:5,
        mental:5,
        practical:5,
        frequency:'freq2',
        actions:'',
        hours:0
      },

      emotionIndex:2,

      oop:{
        currentState:'',
        achievement:0,
        events:'',
        direction:'none',
        evidence:[],
        external:''
      },

      intentional:'no',
      selected:[],
      revision:{}
    };

    view='wizard';
    renderAndFocusHeading();
  }

  function renderWizard(){

    const labels = [
      t('cie'),
      t('iep'),
      t('oop'),
      t('revise')
    ];

    const step = wizard.step;

    let body='';

    if(step===1) body = renderCIE();
    if(step===2) body = renderIEP();
    if(step===3) body = renderOOP();
    if(step===4) body = renderRevision();

    return `<div class="row">

      <div>
        <span class="kicker" aria-hidden="true">${labels[step-1]}</span>
        <h1>${labels[step-1]}</h1>
      </div>

      <button class="btn secondary small" id="wizCancel">${t('cancel')}</button>

    </div>

    <div class="progress" role="progressbar" aria-label="${esc(labels[step-1])}" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${step}">
      <span style="width:${step*25}%"></span>
    </div>

    ${body}`;
  }

  function renderCIE(){

    const r=wizard.cie;

    return `<p class="muted">${t('cieIntro')}</p>

    <div class="card flat">

      ${field('primary',r.primary,'primaryHelp')}
      ${field('success',r.success,'successHelp')}
      ${field('scope',r.scope,'scopeHelp')}
      ${field('nonGoals',r.nonGoals,'nonGoalsHelp')}
      ${field('constraints',r.constraints,'constraintsHelp')}
      ${field('rationale',r.rationale,'rationaleHelp')}

      <button class="btn primary" id="wizNext" style="margin-top:18px">${t('next')}</button>

    </div>`;
  }

  function range(id,label,val){

    return `<label for="${id}">${label}</label>

    <div class="range-line">

      <input
        type="range"
        min="0"
        max="10"
        step="1"
        id="${id}"
        value="${val}"
      >

      <span class="range-value" id="${id}Val" aria-hidden="true">${val}</span>

    </div>`;
  }

  function renderIEP(){

    const x=wizard.iep;

    const ems=t('emotions');

    const emotionIndex=
      Number.isInteger(wizard.emotionIndex)
      ? wizard.emotionIndex
      : Math.max(0,ems.indexOf(x.emotion));

    return `<div class="card flat">

      ${range('desire',t('desire'),x.desire)}
      ${range('belief',t('belief'),x.belief)}

      <label for="emotion">${t('emotion')}</label>

      <select id="emotion">
        ${ems.map((e,i)=>`<option ${i===emotionIndex?'selected':''}>${esc(e)}</option>`).join('')}
      </select>

      ${range('emotionIntensity',t('emotionIntensity'),x.emotionIntensity)}

      ${range('mental',t('mental'),x.mental)}

      ${range('practical',t('practical'),x.practical)}

      <label for="frequency">${t('frequency')}</label>

      <select id="frequency">

        ${
          ['freq0','freq1','freq2','freq3','freq4','freq5']
          .map(k=>`<option value="${k}" ${k===x.frequency?'selected':''}>${t(k)}</option>`)
          .join('')
        }

      </select>

      <label for="actions">${t('actions')}</label>

      <textarea id="actions">${esc(x.actions)}</textarea>

      <label for="hours">${t('hours')}</label>

      <input
        type="number"
        min="0"
        max="168"
        step="0.25"
        id="hours"
        value="${x.hours}"
      >

      <div class="grid" style="margin-top:18px">

        <button class="btn secondary" id="wizBack">${t('back')}</button>

        <button class="btn primary" id="wizNext">${t('next')}</button>

      </div>

    </div>`;
  }

  function renderOOP(){

    const x=wizard.oop;

    const evid=[
      ['direct','evidenceDirect'],
      ['documented','evidenceDocumented'],
      ['otherPerson','evidenceOtherPerson'],
      ['subjective','evidenceSubjective'],
      ['insufficient','evidenceInsufficient'],
      ['other','evidenceOther']
    ];

    return `<div class="card flat">

      <label for="currentState">${t('currentState')}</label>

      <textarea id="currentState">${esc(x.currentState)}</textarea>

      ${range('achievement',t('achievement'),x.achievement)}

      <label for="events">${t('events')}</label>

      <textarea id="events">${esc(x.events)}</textarea>

      <label for="direction">${t('direction')}</label>

      <select id="direction">

        <option value="toward" ${x.direction==='toward'?'selected':''}>
          ${t('directionToward')}
        </option>

        <option value="none" ${x.direction==='none'?'selected':''}>
          ${t('directionNone')}
        </option>

        <option value="away" ${x.direction==='away'?'selected':''}>
          ${t('directionAway')}
        </option>

        <option value="mixed" ${x.direction==='mixed'?'selected':''}>
          ${t('directionMixed')}
        </option>

        <option value="unknown" ${x.direction==='unknown'?'selected':''}>
          ${t('directionUnknown')}
        </option>

      </select>

      <fieldset class="choice-group">

      <legend>${t('evidence')}</legend>

      ${
        evid.map(([v,k])=>`
          <label class="choice">

            <input
              type="checkbox"
              data-evidence="${v}"
              ${x.evidence.includes(v)?'checked':''}
            >

            <span>${t(k)}</span>

          </label>
        `).join('')
      }

      </fieldset>

      <label for="external">${t('external')}</label>

      <textarea id="external">${esc(x.external)}</textarea>

      <div class="grid" style="margin-top:18px">

        <button class="btn secondary" id="wizBack">${t('back')}</button>

        <button class="btn primary" id="wizNext">${t('next')}</button>

      </div>

    </div>`;
  }

  function renderRevision(){

    const dims=[
      ['primary','primary'],
      ['success','success'],
      ['scope','scope'],
      ['nonGoals','nonGoals'],
      ['constraints','constraints'],
      ['rationale','rationale']
    ];

    return `<div class="card flat">

      <fieldset class="choice-group">

      <legend>${t('intentional')}</legend>

      ${
        [['yes','yes'],['no','no'],['unsure','unsure']]
        .map(([v,k])=>`
          <label class="choice">

            <input
              type="radio"
              name="intentional"
              value="${v}"
              ${wizard.intentional===v?'checked':''}
            >

            <span>${t(k)}</span>

          </label>
        `).join('')
      }

      </fieldset>

      <div
        id="revisionBox"
        class="${wizard.intentional==='yes'?'':'hidden'}"
      >

        <div class="divider"></div>

        <fieldset class="choice-group" aria-describedby="revisionHelp">

        <legend>${t('changedParts')}</legend>

        <div class="help" id="revisionHelp">${t('revisionHelp')}</div>

        ${
          dims.map(([v,k])=>`
            <label class="choice">

              <input
                type="checkbox"
                data-dim="${v}"
                ${wizard.selected.includes(v)?'checked':''}
              >

              <span>${t(k)}</span>

            </label>
          `).join('')
        }

        </fieldset>

        <div id="revisionFields">
          ${renderRevisionFields()}
        </div>

      </div>

      <div class="grid" style="margin-top:18px">

        <button class="btn secondary" id="wizBack">${t('back')}</button>

        <button class="btn primary" id="wizComplete">${t('complete')}</button>

      </div>

      <div id="wizMsg" class="help" aria-live="polite" aria-atomic="true"></div>

    </div>`;
  }

  function renderRevisionFields(){

    if(wizard.intentional!=='yes')
      return '';

    return wizard.selected
      .map(k=>`
        <label for="revision-${k}">${t(k)}</label>
        <textarea id="revision-${k}" data-revision="${k}">${esc(
          wizard.revision[k] ??
          wizard.cie[k] ??
          ''
        )}</textarea>
      `)
      .join('');
  }

  function renderHistory(){

    if(!state.intent)
      return `<h1>${t('history')}</h1>
      <div class="card empty">
        <h2>${t('noGoal')}</h2>
      </div>`;

    const c=state.intent.cycles || [];

    return `<h1>${t('history')}</h1>

    <div class="card flat">

      <h2>${esc(state.intent.ris.primary)}</h2>

      <p class="muted">
        ${c.length} ${cycleLabel(c.length)}
      </p>

    </div>

    ${
      c.length
      ?
      `<div class="timeline">

        ${
          [...c]
          .reverse()
          .map((x,i)=>`

            <div class="event">

              <h3>${dateLabel(x.createdAt)}</h3>

              <span class="pill">
                ${t('achieved')}: ${x.oop.achievement}/10
              </span>

              <span class="pill">
                ${t('desireShort')}: ${x.iep.desire}/10
              </span>

              <span class="pill">
                ${t('mentalShort')}: ${x.iep.mental}/10
              </span>

              <span class="pill">
                ${t('practicalShort')}: ${x.iep.practical}/10
              </span>

              <p>
                ${esc(x.oop.events || x.oop.currentState)}
              </p>

              <div class="help">

                ${
                  x.intentional==='yes'
                  ? t('yes')
                  : x.intentional==='no'
                  ? t('no')
                  : t('unsure')
                }

                ·

                ${esc(directionLabel(x.oop.direction))}

              </div>

            </div>

          `)
          .join('')
        }

      </div>`
      :
      `<div class="card empty">
        ${t('noHistory')}
      </div>`
    }`;
  }

  function directionLabel(v){

    return t(
      {
        toward:'directionToward',
        none:'directionNone',
        away:'directionAway',
        mixed:'directionMixed',
        unknown:'directionUnknown'
      }[v] || 'directionUnknown'
    );
  }

  function renderData(){

    return `<h1>${t('data')}</h1>

    <div class="card about-card">

      <div class="product-status">
        <strong>${t('productVersion')}</strong>
        <span class="kicker">${t('local')}</span>
      </div>

      <h2>${t('aboutTitle')}</h2>

      <p>${t('aboutIntro')}</p>

      <p>${t('aboutPrivacy')}</p>

      <p>${t('aboutDisclaimer')}</p>

    </div>

    <div class="stack">

      <button class="btn secondary" id="exportBtn">
        ${t('export')}
      </button>

      <button class="btn secondary" id="importBtn">
        ${t('import')}
      </button>

      <input
        id="importFile"
        type="file"
        accept="application/json,.json"
        class="hidden"
      >

      <a
        class="btn secondary feedback-link"
        href="https://github.com/ugreat653-cyber/pheisiraetha-app/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${t('feedback')}
      </a>

      <button class="btn danger" id="deleteBtn">
        ${t('delete')}
      </button>

    </div>`;
  }

  function bindCommon(){
    bindLanguageSelector('langBtn','langMenu');

    $$('[data-nav]').forEach(
      b=>b.addEventListener(
        'click',
        ()=>{
          view=b.dataset.nav;
          wizard=null;
          risDraft=null;
          renderAndFocusHeading();
        }
      )
    );

    $('#createGoal')?.addEventListener(
      'click',
      ()=>{
        risDraft=risValues();
        view='ris';
        renderAndFocusHeading();
      }
    );

    $('#editGoal')?.addEventListener(
      'click',
      ()=>{
        risDraft=risValues(state.intent?.ris);
        view='ris';
        renderAndFocusHeading();
      }
    );

    $('#startCheckin')?.addEventListener(
      'click',
      startWizard
    );
  }

  function bindRIS(){

    bindRequiredTextFields();

    $('#risCancel').addEventListener(
      'click',
      ()=>{
        risDraft=null;
        view='home';
        renderAndFocusHeading();
      }
    );

    $('#risSave').addEventListener(
      'click',
      ()=>{
        captureRISDraft();

        const r=Object.fromEntries(
          RIS_FIELDS.map(k=>[k,risDraft[k].trim()])
        );

        if(
          Object.values(r)
          .some(v=>!v)
        ){

          markRequiredTextFields('risMsg');

          $('#risMsg').textContent=t('required');

          $('#risMsg').className='badge-danger';

          $('#risMsg').setAttribute('role','alert');

          return;
        }

        const existed=!!state.intent;

        if(!state.intent){

          state.intent={
            id:uid(),
            createdAt:now(),
            ris:r,
            cycles:[]
          };

        } else {

          state.intent.ris=r;
        }

        persist();

        risDraft=null;

        $('#risMsg').textContent=
          existed
          ? t('updated')
          : t('created');

        $('#risMsg').className='badge-ok';

        $('#risMsg').setAttribute('role','status');

        setTimeout(
          ()=>{
            view='home';
            renderAndFocusHeading();
          },
          450
        );
      }
    );
  }

  function syncRanges(){

    [
      'desire',
      'belief',
      'emotionIntensity',
      'mental',
      'practical',
      'achievement'
    ]
    .forEach(
      id=>{

        const el=$('#'+id);

        if(el)
          el.oninput=
            ()=>$('#'+id+'Val').textContent=el.value;
      }
    );
  }

  function captureRISDraft(){
    if(view!=='ris')
      return;

    risDraft=Object.fromEntries(
      RIS_FIELDS.map(
        k=>[k,$('#'+k)?.value ?? risDraft?.[k] ?? '']
      )
    );
  }

  function bindRequiredTextFields(){
    RIS_FIELDS.forEach(key=>{
      const field=$('#'+key);

      field?.addEventListener('input',()=>{
        if(field.value.trim()){
          field.removeAttribute('aria-invalid');
          field.removeAttribute('aria-errormessage');
        }
      });
    });
  }

  function markRequiredTextFields(messageId){
    let firstInvalid=null;

    RIS_FIELDS.forEach(key=>{
      const field=$('#'+key);

      if(!field)
        return;

      if(field.value.trim()){
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-errormessage');
        return;
      }

      field.setAttribute('aria-invalid','true');

      if(messageId)
        field.setAttribute('aria-errormessage',messageId);

      firstInvalid=firstInvalid || field;
    });

    firstInvalid?.focus();
  }

  function saveStep({trim=true}={}){

    const textValue=id=>{
      const value=$('#'+id).value;
      return trim ? value.trim() : value;
    };

    if(wizard.step===1){

      RIS_FIELDS
      .forEach(
        k=>wizard.cie[k]=textValue(k)
      );

      return !Object.values(wizard.cie).some(v=>!v);
    }

    if(wizard.step===2){

      [
        'desire',
        'belief',
        'emotionIntensity',
        'mental',
        'practical'
      ]
      .forEach(
        k=>wizard.iep[k]=Number($('#'+k).value)
      );

      wizard.emotionIndex=$('#emotion').selectedIndex;
      wizard.iep.emotion=$('#emotion').value;
      wizard.iep.frequency=$('#frequency').value;
      wizard.iep.actions=textValue('actions');
      wizard.iep.hours=Number($('#hours').value||0);

      return true;
    }

    if(wizard.step===3){

      wizard.oop.currentState=textValue('currentState');

      wizard.oop.achievement=
        Number($('#achievement').value);

      wizard.oop.events=textValue('events');

      wizard.oop.direction=
        $('#direction').value;

      wizard.oop.evidence=
        $$('[data-evidence]:checked')
        .map(x=>x.dataset.evidence);

      wizard.oop.external=textValue('external');

      return true;
    }

    if(wizard.step===4){

      const radio=
        $('input[name=intentional]:checked');

      wizard.intentional=
        radio
        ? radio.value
        : 'no';

      wizard.selected=
        $$('[data-dim]:checked')
        .map(x=>x.dataset.dim);

      $$('[data-revision]')
      .forEach(
        x=>
          wizard.revision[x.dataset.revision]
          =
          trim ? x.value.trim() : x.value
      );

      return true;
    }
  }

  function bindWizard(){

    syncRanges();

    if(wizard.step===1)
      bindRequiredTextFields();

    $('#wizCancel')?.addEventListener(
      'click',
      ()=>{

        if(
          confirm(t('cancelCheckinConfirm'))
        ){

          wizard=null;
          view='home';
          renderAndFocusHeading();
        }
      }
    );

    $('#wizNext')?.addEventListener(
      'click',
      ()=>{

        if(!saveStep()){

          alert(t('required'));

          markRequiredTextFields();

          return;
        }

        wizard.step++;

        renderAndFocusHeading();
      }
    );

    $('#wizBack')?.addEventListener(
      'click',
      ()=>{

        saveStep();

        wizard.step--;

        renderAndFocusHeading();
      }
    );

    $$('input[name=intentional]')
    .forEach(
      r=>r.addEventListener(
        'change',
        ()=>{
          const value=r.value;

          saveStep({trim:false});
          wizard.intentional=value;

          render();

          $(`input[name="intentional"][value="${value}"]`)?.focus();
        }
      )
    );

    $$('[data-dim]')
    .forEach(
      c=>c.addEventListener(
        'change',
        ()=>{
          const dimension=c.dataset.dim;

          saveStep({trim:false});

          wizard.selected=
            $$('[data-dim]:checked')
            .map(x=>x.dataset.dim);

          render();

          $(`[data-dim="${dimension}"]`)?.focus();
        }
      )
    );

    $('#wizComplete')?.addEventListener(
      'click',
      ()=>{

        saveStep();

        if(
          wizard.intentional==='yes' &&
          wizard.selected.length===0
        ){

          $('#wizMsg').textContent=
            t('selectRevisionRequired');

          $('#wizMsg').className='badge-danger';

          $('#wizMsg').setAttribute('role','alert');

          return;
        }

        const cycle={
          id:uid(),
          createdAt:now(),
          cie:wizard.cie,
          iep:wizard.iep,
          oop:wizard.oop,
          intentional:wizard.intentional,
          revision:{}
        };

        if(wizard.intentional==='yes'){

          wizard.selected.forEach(
            k=>{

              const v=
                (
                  wizard.revision[k] ||
                  wizard.cie[k] ||
                  ''
                )
                .trim();

              cycle.revision[k]=v;

              state.intent.ris[k]=v;
            }
          );
        }

        state.intent.cycles.push(cycle);

        persist();

        wizard=null;

        view='home';

        renderAndFocusHeading();

        setTimeout(
          ()=>alert(t('saved')),
          50
        );
      }
    );
  }

  function bindData(){

    $('#exportBtn').addEventListener(
      'click',
      ()=>{

        const blob=
          new Blob(
            [JSON.stringify(state,null,2)],
            {type:'application/json'}
          );

        const a=
          document.createElement('a');

        a.href=
          URL.createObjectURL(blob);

        a.download=
          `PHEISIRAETHA-backup-${new Date().toISOString().slice(0,10)}.json`;

        a.click();

        URL.revokeObjectURL(a.href);
      }
    );

    $('#importBtn').addEventListener(
      'click',
      ()=>$('#importFile').click()
    );

    $('#importFile').addEventListener(
      'change',
      async e=>{

        try{

          const x=
            JSON.parse(
              await e.target.files[0].text()
            );

          if(!isValidBackup(x))
            throw new Error();

          state=x;

          persist();

          alert(t('imported'));

          renderAndFocusHeading();

        }catch{

          alert(t('importError'));
        }
      }
    );

    $('#deleteBtn').addEventListener(
      'click',
      ()=>{

        if(
          confirm(t('deleteConfirm'))
        ){

          localStorage.removeItem(STORAGE_KEY);

          state=fresh();

          view='home';

          renderAndFocusHeading();
        }
      }
    );
  }

  if(
    'serviceWorker' in navigator &&
    location.protocol.startsWith('http')
  ){
    navigator.serviceWorker
      .register('sw.js')
      .catch(()=>{});
  }

  render();

})();
