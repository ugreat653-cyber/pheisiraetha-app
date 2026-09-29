(() => {
  const STORAGE_KEY = 'pheisiraetha_v01';
  const APP_VERSION = '0.1.0';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const now = () => new Date().toISOString();
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const T = {
    en: {
      brand:'PHEISIRAETHA', home:'Home', history:'History', data:'Data',
      local:'Local-first private beta', title:'Turn intention into a traceable cycle.',
      intro:'Define what you want, record effort and emotion, observe what actually happened, then deliberately keep or revise the intention.',
      noGoal:'No active intention yet.', createGoal:'Create intention', activeGoal:'Active intention',
      checkin:'New check-in', editIntent:'Edit current intention', cycles:'cycles', next:'Continue', back:'Back', save:'Save', cancel:'Cancel',
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
      privacyTitle:'Your data in v0.1', privacyText:'This prototype stores all entries only in this browser on this device. There is no account, server sync, analytics, advertising SDK, or cloud database in v0.1.',
      export:'Export backup (JSON)', import:'Import backup', delete:'Delete all local data', deleteConfirm:'Delete the entire local PHEISIRAETHA record on this device? This cannot be undone unless you exported a backup.',
      exported:'Backup exported.', imported:'Backup imported.', importError:'This file is not a valid PHEISIRAETHA v0.1 backup.',
      disclaimer:'Self-reflection tool. It does not establish that thoughts, emotions, intentions or effort cause external events. It is not medical or psychological treatment.',
      recommended:'Recommended rhythm: one check-in per week. v0.1 does not lock the timer so you can test freely.',
      summary:'Latest snapshot', achieved:'Achievement', desireShort:'Desire', mentalShort:'Mental effort', practicalShort:'Practical effort',
      directionToward:'Moved toward the desired outcome', directionNone:'No meaningful change', directionAway:'Moved away from the desired outcome', directionMixed:'Mixed or unclear change', directionUnknown:'Not enough information to determine',
      evidenceDirect:'Directly observed events or conditions', evidenceDocumented:'Documented or recorded information', evidenceOtherPerson:'Information provided or confirmed by another person', evidenceSubjective:'My overall subjective impression', evidenceInsufficient:'Not enough information to assess', evidenceOther:'Other',
      freq0:'Not at all', freq1:'Less than once per day', freq2:'About once per day', freq3:'Several times per day', freq4:'Many times per day', freq5:'Almost continuously',
      emotions:['Love / affection','Joy / excitement','Hope / positive anticipation','Calm / contentment','Fear / anxiety','Anger / frustration','Sadness / disappointment','Shame / guilt','Neutral / little emotion','Other'],
      testNote:'Prototype v0.1 — designed for self-test before public beta.'
    },

    ru: {
      brand:'PHEISIRAETHA', home:'Главная', history:'История', data:'Данные',
      local:'Локальный приватный прототип', title:'Преврати намерение в отслеживаемый цикл.',
      intro:'Определи, чего ты хочешь, зафиксируй усилия и эмоции, наблюдай, что реально произошло, а затем сознательно сохрани или измени намерение.',
      noGoal:'Активного намерения пока нет.', createGoal:'Создать намерение', activeGoal:'Активное намерение',
      checkin:'Новый check-in', editIntent:'Изменить текущее намерение', cycles:'циклов', next:'Далее', back:'Назад', save:'Сохранить', cancel:'Отмена',
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
      privacyTitle:'Твои данные в v0.1', privacyText:'Этот прототип сохраняет все записи только в браузере на этом устройстве. В v0.1 нет аккаунта, серверной синхронизации, аналитики, рекламных SDK или облачной базы.',
      export:'Экспорт резервной копии (JSON)', import:'Импорт резервной копии', delete:'Удалить все локальные данные', deleteConfirm:'Удалить всю локальную запись PHEISIRAETHA на этом устройстве? Отменить это будет нельзя, если нет экспортированной копии.',
      exported:'Резервная копия экспортирована.', imported:'Резервная копия импортирована.', importError:'Этот файл не является корректной резервной копией PHEISIRAETHA v0.1.',
      disclaimer:'Инструмент самонаблюдения. Он не устанавливает, что мысли, эмоции, намерения или усилия вызывают внешние события. Это не медицинское и не психологическое лечение.',
      recommended:'Рекомендуемый ритм: один check-in в неделю. В v0.1 таймер не блокируется, чтобы можно было свободно тестировать.',
      summary:'Последний снимок', achieved:'Достижение', desireShort:'Желание', mentalShort:'Умственные усилия', practicalShort:'Практические усилия',
      directionToward:'Продвижение к желаемому результату', directionNone:'Значимых изменений нет', directionAway:'Удаление от желаемого результата', directionMixed:'Смешанное или неясное изменение', directionUnknown:'Недостаточно информации',
      evidenceDirect:'Непосредственно наблюдаемые события или условия', evidenceDocumented:'Документированная или записанная информация', evidenceOtherPerson:'Информация, предоставленная или подтверждённая другим человеком', evidenceSubjective:'Моё общее субъективное впечатление', evidenceInsufficient:'Недостаточно информации для оценки', evidenceOther:'Другое',
      freq0:'Вообще нет', freq1:'Реже одного раза в день', freq2:'Примерно раз в день', freq3:'Несколько раз в день', freq4:'Много раз в день', freq5:'Почти постоянно',
      emotions:['Любовь / привязанность','Радость / воодушевление','Надежда / позитивное ожидание','Спокойствие / удовлетворённость','Страх / тревога','Гнев / фрустрация','Грусть / разочарование','Стыд / вина','Нейтрально / почти без эмоций','Другое'],
      testNote:'Прототип v0.1 — для самостоятельного тестирования перед публичной beta.'
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
  let view = 'home';
  let wizard = null;
  let risDraft = null;

  function load(){
    try {
      const x = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return x && x.version ? x : fresh();
    } catch {
      return fresh();
    }
  }

  function persist(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function t(k){
    return T[state.lang]?.[k] ?? T.en[k] ?? k;
  }

  function dateLabel(iso){
    return new Intl.DateTimeFormat(
      state.lang==='ru' ? 'ru-RU' : 'en-GB',
      {dateStyle:'medium', timeStyle:'short'}
    ).format(new Date(iso));
  }

  function cycleLabel(n){
    if(state.lang!=='ru') return n===1 ? 'cycle' : 'cycles';

    const mod10 = n % 10;
    const mod100 = n % 100;

    if(mod10===1 && mod100!==11) return 'цикл';

    if(
      mod10>=2 &&
      mod10<=4 &&
      (mod100<12 || mod100>14)
    ) return 'цикла';

    return 'циклов';
  }

  function shell(content){
    return `<div class="shell"><header class="topbar"><div class="brand">PHEISIRAETHA</div><button class="lang" id="langBtn">${state.lang==='ru'?'RU':'EN'}</button></header><main>${content}</main>${bottomNav()}</div>`;
  }

  function bottomNav(){
    return `<nav class="bottomnav">
      <button data-nav="home" class="${view==='home'?'active':''}">${t('home')}</button>
      <button data-nav="history" class="${view==='history'?'active':''}">${t('history')}</button>
      <button data-nav="data" class="${view==='data'?'active':''}">${t('data')}</button>
    </nav>`;
  }

  function render(){
    const app = document.getElementById('app');

    document.documentElement.lang=state.lang;

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
    return `<label for="${key}">${t(key)}</label>
    <textarea id="${key}">${esc(value)}</textarea>
    ${helpKey ? `<div class="help">${t(helpKey)}</div>` : ''}`;
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

      <div id="risMsg" class="help"></div>
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
    render();
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
        <span class="kicker">${labels[step-1]}</span>
        <h1>${labels[step-1]}</h1>
      </div>

      <button class="btn secondary small" id="wizCancel">${t('cancel')}</button>

    </div>

    <div class="progress">
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

    return `<label>${label}</label>

    <div class="range-line">

      <input
        type="range"
        min="0"
        max="10"
        step="1"
        id="${id}"
        value="${val}"
      >

      <span class="range-value" id="${id}Val">${val}</span>

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

      <label>${t('emotion')}</label>

      <select id="emotion">
        ${ems.map((e,i)=>`<option ${i===emotionIndex?'selected':''}>${esc(e)}</option>`).join('')}
      </select>

      ${range('emotionIntensity',t('emotionIntensity'),x.emotionIntensity)}

      ${range('mental',t('mental'),x.mental)}

      ${range('practical',t('practical'),x.practical)}

      <label>${t('frequency')}</label>

      <select id="frequency">

        ${
          ['freq0','freq1','freq2','freq3','freq4','freq5']
          .map(k=>`<option value="${k}" ${k===x.frequency?'selected':''}>${t(k)}</option>`)
          .join('')
        }

      </select>

      <label>${t('actions')}</label>

      <textarea id="actions">${esc(x.actions)}</textarea>

      <label>${t('hours')}</label>

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

      <label>${t('currentState')}</label>

      <textarea id="currentState">${esc(x.currentState)}</textarea>

      ${range('achievement',t('achievement'),x.achievement)}

      <label>${t('events')}</label>

      <textarea id="events">${esc(x.events)}</textarea>

      <label>${t('direction')}</label>

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

      <label>${t('evidence')}</label>

      ${
        evid.map(([v,k])=>`
          <div class="choice">

            <input
              type="checkbox"
              data-evidence="${v}"
              ${x.evidence.includes(v)?'checked':''}
            >

            <span>${t(k)}</span>

          </div>
        `).join('')
      }

      <label>${t('external')}</label>

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

      <label>${t('intentional')}</label>

      ${
        [['yes','yes'],['no','no'],['unsure','unsure']]
        .map(([v,k])=>`
          <div class="choice">

            <input
              type="radio"
              name="intentional"
              value="${v}"
              ${wizard.intentional===v?'checked':''}
            >

            <span>${t(k)}</span>

          </div>
        `).join('')
      }

      <div
        id="revisionBox"
        class="${wizard.intentional==='yes'?'':'hidden'}"
      >

        <div class="divider"></div>

        <label>${t('changedParts')}</label>

        <div class="help">${t('revisionHelp')}</div>

        ${
          dims.map(([v,k])=>`
            <div class="choice">

              <input
                type="checkbox"
                data-dim="${v}"
                ${wizard.selected.includes(v)?'checked':''}
              >

              <span>${t(k)}</span>

            </div>
          `).join('')
        }

        <div id="revisionFields">
          ${renderRevisionFields()}
        </div>

      </div>

      <div class="grid" style="margin-top:18px">

        <button class="btn secondary" id="wizBack">${t('back')}</button>

        <button class="btn primary" id="wizComplete">${t('complete')}</button>

      </div>

      <div id="wizMsg" class="help"></div>

    </div>`;
  }

  function renderRevisionFields(){

    if(wizard.intentional!=='yes')
      return '';

    return wizard.selected
      .map(k=>`
        <label>${t(k)}</label>
        <textarea data-revision="${k}">${esc(
          wizard.revision[k] ??
          wizard.cie[k] ??
          ''
        )}</textarea>
      `)
      .join('');
  }

  function renderHistory(){

    if(!state.intent)
      return `<div class="card empty">
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

    <div class="card">

      <h2>${t('privacyTitle')}</h2>

      <p>${t('privacyText')}</p>

      <p class="help">
        ${t('testNote')}
      </p>

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

      <button class="btn danger" id="deleteBtn">
        ${t('delete')}
      </button>

    </div>

    <div
      class="notice smalltext"
      style="margin-top:16px"
    >
      ${t('disclaimer')}
    </div>`;
  }

  function bindCommon(){

    $('#langBtn')?.addEventListener(
      'click',
      ()=>{
        if(view==='ris')
          captureRISDraft();

        if(view==='wizard' && wizard)
          saveStep({trim:false});

        state.lang =
          state.lang==='ru'
          ? 'en'
          : 'ru';

        if(wizard && Number.isInteger(wizard.emotionIndex))
          wizard.iep.emotion=
            t('emotions')[wizard.emotionIndex];

        persist();
        render();
      }
    );

    $$('[data-nav]').forEach(
      b=>b.addEventListener(
        'click',
        ()=>{
          view=b.dataset.nav;
          wizard=null;
          risDraft=null;
          render();
        }
      )
    );

    $('#createGoal')?.addEventListener(
      'click',
      ()=>{
        risDraft=risValues();
        view='ris';
        render();
      }
    );

    $('#editGoal')?.addEventListener(
      'click',
      ()=>{
        risDraft=risValues(state.intent?.ris);
        view='ris';
        render();
      }
    );

    $('#startCheckin')?.addEventListener(
      'click',
      startWizard
    );
  }

  function bindRIS(){

    $('#risCancel').addEventListener(
      'click',
      ()=>{
        risDraft=null;
        view='home';
        render();
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

          $('#risMsg').textContent=t('required');

          $('#risMsg').className='badge-danger';

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

        setTimeout(
          ()=>{
            view='home';
            render();
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

    $('#wizCancel')?.addEventListener(
      'click',
      ()=>{

        if(
          confirm(
            state.lang==='ru'
            ? 'Отменить текущий check-in?'
            : 'Cancel this check-in?'
          )
        ){

          wizard=null;
          view='home';
          render();
        }
      }
    );

    $('#wizNext')?.addEventListener(
      'click',
      ()=>{

        if(!saveStep()){

          alert(t('required'));

          return;
        }

        wizard.step++;

        render();
      }
    );

    $('#wizBack')?.addEventListener(
      'click',
      ()=>{

        saveStep();

        wizard.step--;

        render();
      }
    );

    $$('input[name=intentional]')
    .forEach(
      r=>r.addEventListener(
        'change',
        ()=>{
          saveStep({trim:false});
          wizard.intentional=r.value;

          render();
        }
      )
    );

    $$('[data-dim]')
    .forEach(
      c=>c.addEventListener(
        'change',
        ()=>{
          saveStep({trim:false});

          wizard.selected=
            $$('[data-dim]:checked')
            .map(x=>x.dataset.dim);

          render();
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
            state.lang==='ru'
            ? 'Выбери хотя бы одну часть RIS для изменения.'
            : 'Select at least one RIS dimension to revise.';

          $('#wizMsg').className='badge-danger';

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

        render();

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

          render();

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

          render();
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
