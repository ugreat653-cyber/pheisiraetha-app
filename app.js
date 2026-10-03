(() => {
  const STORAGE_KEY = 'pheisiraetha_v01';
  const ONBOARDING_KEY = 'pheisiraetha_onboarding_v01';
  const LANGUAGE_KEY = 'pheisiraetha_language_v01';
  const APP_VERSION = '0.1.0';
  const LOCALES = window.PHEISIRAETHA_LOCALES;
  const SUPPORTED_LANGUAGES = Object.keys(LOCALES);
  const LANGUAGE_OPTIONS = Object.values(LOCALES);
  const LOCALE_ALIASES = {nb:'no',nn:'no',iw:'he',in:'id'};
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const now = () => new Date().toISOString();
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

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
  let languagePickerController = null;
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

  function resolveLocale(value){
    const tag=String(value || '').trim().toLowerCase().replace(/_/g,'-');
    if(Object.hasOwn(LOCALES,tag)) return tag;
    const base=tag.split('-')[0];
    const code=LOCALE_ALIASES[base] || base;
    return Object.hasOwn(LOCALES,code) ? code : null;
  }

  function deviceLanguage(){
    const preferences=navigator.languages?.length
      ? Array.from(navigator.languages)
      : [navigator.language];

    for(const preference of preferences){
      const supported=resolveLocale(preference);
      if(supported) return supported;
    }
    return 'en';
  }

  function loadLanguagePreference(){
    const stored=localStorage.getItem(LANGUAGE_KEY);

    const saved=resolveLocale(stored);
    if(saved) return saved;

    const selected=deviceLanguage();
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
    return LOCALES[currentLang]?.translations[k] ?? LOCALES.en.translations[k] ?? k;
  }

  function dateLabel(iso){
    return new Intl.DateTimeFormat(
      LOCALES[currentLang].formatLocale,
      {dateStyle:'medium', timeStyle:'short'}
    ).format(new Date(iso));
  }

  function cycleLabel(n){
    const category=new Intl.PluralRules(LOCALES[currentLang].htmlLang).select(n);
    const key={zero:'cycleZero',one:'cycleOne',two:'cycleTwo',few:'cycleFew',many:'cycleMany',other:'cycleMany'}[category];
    return LOCALES[currentLang].translations[key] ?? t('cycleMany');
  }

  function languageSelector(buttonId,menuId){
    const options=LANGUAGE_OPTIONS.map(({code,nativeName,htmlLang,dir})=>`
      <button
        class="language-option${code===currentLang?' active':''}"
        type="button"
        role="menuitemradio"
        aria-checked="${code===currentLang}"
        tabindex="${code===currentLang?'0':'-1'}"
        data-language="${code}"
      >
        <bdi lang="${htmlLang}" dir="${dir}">${nativeName}</bdi>
        <span class="language-code" aria-hidden="true">${code===currentLang?'✓ ':''}<bdi dir="ltr">${code.toUpperCase()}</bdi></span>
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
      ><bdi dir="ltr">${currentLang.toUpperCase()}</bdi></button>
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

      options[next].focus({preventScroll:true});
      options[next].scrollIntoView?.({block:'nearest'});
    };

    const openMenu=index=>{
      menu.classList.remove('hidden');
      button.setAttribute('aria-expanded','true');
      const activeIndex=options.findIndex(option=>
        option.classList.contains('active')
      );
      focusOption(index ?? (activeIndex<0 ? 0 : activeIndex));
    };

    button.addEventListener('click',()=>{
      if(menu.classList.contains('hidden')) openMenu();
      else closeMenu();
    });

    button.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown' || event.key==='ArrowUp'){
        event.preventDefault();
        openMenu(event.key==='ArrowUp' ? options.length-1 : undefined);
      }else if(event.key==='Escape'){
        closeMenu({restoreFocus:true});
      }
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
      }else if(event.key.length===1 && /\p{L}/u.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey){
        // Jump by native-name initial or language-code initial.
        const letter=event.key.toLocaleLowerCase(currentLang);
        for(let offset=1;offset<=options.length;offset++){
          const index=(current+offset+options.length)%options.length;
          const option=options[index];
          if(option.textContent.trim().toLocaleLowerCase(currentLang).startsWith(letter) || option.dataset.language.startsWith(letter)){
            event.preventDefault();
            focusOption(index);
            break;
          }
        }
      }
    });

    picker?.addEventListener('focusout',event=>{
      if(!picker.contains(event.relatedTarget))
        closeMenu();
    });

    languagePickerController?.abort();
    languagePickerController=new AbortController();
    document.addEventListener('pointerdown',event=>{
      if(!picker.contains(event.target)) closeMenu();
    },{signal:languagePickerController.signal});
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

    document.documentElement.lang=LOCALES[currentLang].htmlLang;
    document.documentElement.dir=LOCALES[currentLang].dir;
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

    // User text keeps its own writing direction regardless of the UI language.
    $$('#app textarea').forEach(field=>field.dir='auto');
    $$('#app input[type="number"]').forEach(field=>field.dir='ltr');
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
    const copy=LOCALES[currentLang].onboarding;
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

    return `<section class="hero"><span class="kicker">${t('activeGoal')}</span><h1 dir="auto">${esc(state.intent.ris.primary)}</h1><p class="muted" dir="auto">${esc(state.intent.ris.success)}</p></section>

      <div class="grid">
        <button class="btn primary" id="startCheckin">${t('checkin')}</button>
        <button class="btn secondary" id="editGoal">${t('editIntent')}</button>
      </div>

      <div class="card flat">
        <div class="row">
          <h2>${t('ris')}</h2>
          <span class="pill">${esc(String(c.length))} ${cycleLabel(c.length)}</span>
        </div>
        ${risSummary(state.intent.ris)}
      </div>

      ${last ? `
      <div class="card">
        <h2>${t('summary')}</h2>
        <div class="grid">

          <div class="metric">
            <span>${t('achieved')}</span>
            <strong>${esc(String(last.oop.achievement))}/10</strong>
          </div>

          <div class="metric">
            <span>${t('desireShort')}</span>
            <strong>${esc(String(last.iep.desire))}/10</strong>
          </div>

          <div class="metric">
            <span>${t('mentalShort')}</span>
            <strong>${esc(String(last.iep.mental))}/10</strong>
          </div>

          <div class="metric">
            <span>${t('practicalShort')}</span>
            <strong>${esc(String(last.iep.practical))}/10</strong>
          </div>

        </div>
      </div>` : ''}

      <div class="notice smalltext">${t('recommended')}</div>`;
  }

  function risSummary(r){
    return `
      <p><strong>${t('success')}:</strong> <bdi>${esc(r.success)}</bdi></p>
      <p><strong>${t('scope')}:</strong> <bdi>${esc(r.scope)}</bdi></p>
      <p><strong>${t('nonGoals')}:</strong> <bdi>${esc(r.nonGoals)}</bdi></p>
      <p><strong>${t('constraints')}:</strong> <bdi>${esc(r.constraints)}</bdi></p>
      <p><strong>${t('rationale')}:</strong> <bdi>${esc(r.rationale)}</bdi></p>
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
        ${ems.map((e,i)=>`<option value="${esc(i===emotionIndex ? x.emotion : e)}" ${i===emotionIndex?'selected':''}>${esc(e)}</option>`).join('')}
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

      <h2 dir="auto">${esc(state.intent.ris.primary)}</h2>

      <p class="muted">
        ${esc(String(c.length))} ${cycleLabel(c.length)}
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
                ${t('achieved')}: ${esc(String(x.oop.achievement))}/10
              </span>

              <span class="pill">
                ${t('desireShort')}: ${esc(String(x.iep.desire))}/10
              </span>

              <span class="pill">
                ${t('mentalShort')}: ${esc(String(x.iep.mental))}/10
              </span>

              <span class="pill">
                ${t('practicalShort')}: ${esc(String(x.iep.practical))}/10
              </span>

              <p dir="auto">
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
