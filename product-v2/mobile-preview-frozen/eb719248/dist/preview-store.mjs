/*
 * Separate-origin mobile preview domain. No analytics, network, billing,
 * automatic migration, or legacy localStorage writes.
 */
import {
  openStore, FoundationError, DB_VERSION, STORES, BACKUP_FORMAT,
  SCHEMA_VERSION, classifyLegacy
} from './foundation.mjs';

const DEFAULT_DB = 'pheisiraetha_mobile_preview_v2';
const STORE_NAMES = Object.values(STORES);
const RIS = ['primary','success','scope','nonGoals','constraints','rationale'];
const NUMBERS = [
  ['iep','desire',0,10], ['iep','belief',0,10], ['iep','emotionIntensity',0,10],
  ['iep','mental',0,10], ['iep','practical',0,10], ['iep','hours',0,168],
  ['oop','achievement',0,10]
];
const FILE_FORMAT = 'pheisiraetha-preview-lossless';
const FILE_LIMITS = Object.freeze({characters: 16 * 1024 * 1024, depth: 100, nodes: 250000, records: 10000});
const has = (v,k) => Object.hasOwn(v,k);
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonblank = v => typeof v === 'string' && v.trim().length > 0;
const rev = (v,zero=false) => Number.isSafeInteger(v) && v >= (zero ? 0 : 1);
const date = v => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const number = (v,a,b) => Number.isFinite(v) && v >= a && v <= b;
function need(ok,code='INVALID_ARGUMENT') { if (!ok) throw new FoundationError(code); }
function own(target,key,value) {
  Object.defineProperty(target,key,{value,enumerable:true,writable:true,configurable:true});
}
function clone(v,seen=new Set(),depth=0) {
  need(depth <= FILE_LIMITS.depth,'BACKUP_LIMIT_EXCEEDED');
  if (v === null || ['string','boolean','number'].includes(typeof v)) return v;
  need(typeof v === 'object' && !seen.has(v),'UNSUPPORTED_DATA');
  const array = Array.isArray(v), prototype = Object.getPrototypeOf(v);
  need(array ? prototype === Array.prototype : prototype === Object.prototype || prototype === null,'UNSUPPORTED_DATA');
  const descriptors = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(descriptors);
  need(keys.every(k=>typeof k === 'string'),'UNSUPPORTED_DATA');
  seen.add(v);
  try {
    if (array) {
      const length = descriptors.length.value;
      need(keys.length === length + 1,'UNSUPPORTED_DATA');
      const out=[];
      for(let i=0;i<length;i++){
        const d=descriptors[String(i)];
        need(d && has(d,'value') && d.enumerable,'UNSUPPORTED_DATA');
        out.push(clone(d.value,seen,depth+1));
      }
      return out;
    }
    const out={};
    for(const key of keys){
      const d=descriptors[key];
      need(has(d,'value') && d.enumerable,'UNSUPPORTED_DATA');
      own(out,key,clone(d.value,seen,depth+1));
    }
    return out;
  } finally { seen.delete(v); }
}
function canonical(v) {
  if(v===null) return 'null';
  if(typeof v==='number'){
    if(Number.isNaN(v)) return 'NaN';
    if(v===Infinity) return 'Infinity';
    if(v===-Infinity) return '-Infinity';
    return Object.is(v,-0) ? '-0' : JSON.stringify(v);
  }
  if(typeof v!=='object') return JSON.stringify(v);
  if(Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
function argsOf(input,allowed,required=allowed) {
  const args=clone(input);
  need(record(args) && Object.keys(args).every(k=>allowed.includes(k)) && required.every(k=>has(args,k)));
  need(nonblank(args.operationId));
  return args;
}
function uuid(){ return globalThis.crypto.randomUUID(); }
async function hash(text){
  const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
}
function storageError(error){
  if(error instanceof FoundationError) return error;
  return new FoundationError({
    QuotaExceededError:'STORAGE_QUOTA',AbortError:'TRANSACTION_ABORTED',
    InvalidStateError:'STORE_CLOSED',VersionError:'UNSUPPORTED_DATABASE_VERSION',
    SecurityError:'STORAGE_UNAVAILABLE'
  }[error && error.name] || 'STORAGE_ERROR');
}
function schema(value){
  need(record(value),'INVALID_STORED_RECORD');
  if(Number.isSafeInteger(value.schemaVersion) && value.schemaVersion>SCHEMA_VERSION)
    throw new FoundationError('UNSUPPORTED_SCHEMA');
  need(value.schemaVersion===SCHEMA_VERSION,'INVALID_STORED_RECORD');
}
function textFields(v){ return record(v) && RIS.every(k=>typeof v[k]==='string'); }
function validCycle(c){
  return record(c) && typeof c.id==='string' && date(c.createdAt) && textFields(c.cie) &&
    record(c.iep) && record(c.oop) && ['yes','no','unsure'].includes(c.intentional) && record(c.revision) &&
    NUMBERS.every(([part,key,a,b])=>number(c[part][key],a,b)) &&
    typeof c.iep.emotion==='string' && ['freq0','freq1','freq2','freq3','freq4','freq5'].includes(c.iep.frequency) &&
    typeof c.iep.actions==='string' && typeof c.oop.currentState==='string' && typeof c.oop.events==='string' &&
    ['toward','none','away','mixed','unknown'].includes(c.oop.direction) && Array.isArray(c.oop.evidence) &&
    c.oop.evidence.every(v=>['direct','documented','otherPerson','subjective','insufficient','other'].includes(v)) &&
    typeof c.oop.external==='string' && Object.entries(c.revision).every(([k,v])=>RIS.includes(k) && typeof v==='string');
}
function validEnvelope(v){
  if(!record(v) || v.version!=='0.1.0' || !['ru','en'].includes(v.lang) || !has(v,'intent')) return false;
  if(v.intent===null) return true;
  const i=v.intent;
  return record(i) && typeof i.id==='string' && date(i.createdAt) && textFields(i.ris) &&
    Array.isArray(i.cycles) && i.cycles.every(validCycle);
}
function unique(rows,key){
  const keys=rows.map(row=>row[key]);
  need(new Set(keys).size===keys.length,'INVALID_BACKUP_GRAPH');
}
function validateData(data,importing=false){
  need(data.meta.length===1,'INVALID_STORED_RECORD');
  const w=data.meta[0];
  schema(w);
  need(w.key==='workspace' && nonblank(w.workspaceKey) && rev(w.revision,true) &&
    [w.selectedIntentKey,w.legacyBaselineSnapshotKey,w.latestObservedLegacySnapshotKey].every(v=>v===null || nonblank(v)),
    'INVALID_STORED_RECORD');
  need(!has(w,'restoreSources') || Array.isArray(w.restoreSources),'INVALID_STORED_RECORD');
  for(const row of data.intentions){
    schema(row);
    need(nonblank(row.intentKey) && rev(row.revision) && rev(row.createdRevision) && date(row.createdAt) && date(row.updatedAt) &&
      (row.sourceSnapshotKey===null || nonblank(row.sourceSnapshotKey)) &&
      validEnvelope(row.sourceEnvelope) && row.sourceEnvelope.intent!==null,'INVALID_STORED_RECORD');
  }
  for(const row of data.drafts){
    schema(row);
    need(nonblank(row.intentKey) && nonblank(row.draftId) && rev(row.revision) && rev(row.basedOnIntentRevision) &&
      ['first','progress'].includes(row.kind) && rev(row.step) && record(row.values) && date(row.updatedAt),'INVALID_STORED_RECORD');
  }
  for(const row of data.legacySnapshots){
    schema(row);
    need(nonblank(row.snapshotKey) && ['legacy-storage','legacy-import'].includes(row.source) &&
      (row.rawState===null || typeof row.rawState==='string') && /^[a-f0-9]{64}$/.test(row.rawSha256) &&
      date(row.observedAt) && ['empty','valid-v1','invalid-json','invalid-v1','unsupported-version'].includes(row.classification) &&
      (row.materializedIntentKey===null || nonblank(row.materializedIntentKey)) &&
      typeof row.conflictWithBaseline==='boolean','INVALID_STORED_RECORD');
  }
  for(const row of data.operations){
    schema(row);
    need(nonblank(row.operationId) && nonblank(row.command) && typeof row.requestCanonical==='string' &&
      /^[a-f0-9]{64}$/.test(row.requestFingerprint) && record(row.result) && date(row.completedAt),'INVALID_STORED_RECORD');
  }
  unique(data.intentions,'intentKey'); unique(data.drafts,'intentKey');
  unique(data.drafts,'draftId'); unique(data.legacySnapshots,'snapshotKey');
  const intentions=new Map(data.intentions.map(v=>[v.intentKey,v]));
  const snapshots=new Map(data.legacySnapshots.map(v=>[v.snapshotKey,v]));
  need(w.selectedIntentKey===null || intentions.has(w.selectedIntentKey),'INVALID_BACKUP_GRAPH');
  need([w.legacyBaselineSnapshotKey,w.latestObservedLegacySnapshotKey].every(k=>k===null || snapshots.has(k)),'INVALID_BACKUP_GRAPH');
  for(const i of data.intentions){
    need(i.sourceSnapshotKey===null || snapshots.has(i.sourceSnapshotKey),'INVALID_BACKUP_GRAPH');
    if(importing && i.sourceSnapshotKey!==null)
      need(snapshots.get(i.sourceSnapshotKey).materializedIntentKey===i.intentKey,'INVALID_BACKUP_GRAPH');
  }
  for(const s of data.legacySnapshots){
    need(s.materializedIntentKey===null || intentions.has(s.materializedIntentKey),'INVALID_BACKUP_GRAPH');
    if(importing && s.materializedIntentKey!==null)
      need(intentions.get(s.materializedIntentKey).sourceSnapshotKey===s.snapshotKey,'INVALID_BACKUP_GRAPH');
  }
  for(const draft of data.drafts){
    const i=intentions.get(draft.intentKey);
    need(i,'INVALID_BACKUP_GRAPH');
    if(importing) need(draft.basedOnIntentRevision===i.revision &&
      draft.kind===(i.sourceEnvelope.intent.cycles.length===0?'first':'progress'),'INVALID_BACKUP_GRAPH');
  }
  return w;
}

export function encodePreviewBackup(value){
  let count=0;
  const seen=new Set();
  function tag(v,depth){
    need(++count<=FILE_LIMITS.nodes && depth<=FILE_LIMITS.depth,'BACKUP_LIMIT_EXCEEDED');
    if(v===null) return ['null'];
    if(typeof v==='string') return ['string',v];
    if(typeof v==='boolean') return ['boolean',v];
    if(typeof v==='number') return ['number',Number.isNaN(v)?'NaN':Object.is(v,-0)?'-0':String(v)];
    need(typeof v==='object' && !seen.has(v),'UNSUPPORTED_DATA');
    const array=Array.isArray(v), proto=Object.getPrototypeOf(v);
    need(array?proto===Array.prototype:proto===Object.prototype || proto===null,'UNSUPPORTED_DATA');
    const ds=Object.getOwnPropertyDescriptors(v), keys=Reflect.ownKeys(ds);
    need(keys.every(k=>typeof k==='string'),'UNSUPPORTED_DATA');
    seen.add(v);
    try{
      if(array){
        need(keys.length===ds.length.value+1,'UNSUPPORTED_DATA');
        const nodes=[];
        for(let i=0;i<ds.length.value;i++){
          const d=ds[String(i)]; need(d && has(d,'value') && d.enumerable,'UNSUPPORTED_DATA');
          nodes.push(tag(d.value,depth+1));
        }
        return ['array',nodes];
      }
      const pairs=[];
      for(const key of keys){
        const d=ds[key]; need(has(d,'value') && d.enumerable,'UNSUPPORTED_DATA');
        pairs.push([key,tag(d.value,depth+1)]);
      }
      return ['object',pairs];
    }finally{seen.delete(v);}
  }
  need(record(value),'INVALID_BACKUP');
  const result=JSON.stringify({format:FILE_FORMAT,version:1,payload:tag(value,0)});
  need(result.length<=FILE_LIMITS.characters,'BACKUP_LIMIT_EXCEEDED');
  return result;
}
export function decodePreviewBackup(text){
  need(typeof text==='string' && text.length<=FILE_LIMITS.characters,'BACKUP_LIMIT_EXCEEDED');
  let parsed;
  try{parsed=JSON.parse(text);}catch{throw new FoundationError('INVALID_BACKUP');}
  need(record(parsed) && Object.keys(parsed).length===3 && parsed.format===FILE_FORMAT &&
    has(parsed,'payload') && parsed.version===1,'INVALID_BACKUP');
  let count=0;
  function untag(node,depth){
    need(++count<=FILE_LIMITS.nodes && depth<=FILE_LIMITS.depth,'BACKUP_LIMIT_EXCEEDED');
    need(Array.isArray(node) && typeof node[0]==='string','INVALID_BACKUP');
    const [kind,value]=node;
    if(kind==='null'){need(node.length===1,'INVALID_BACKUP');return null;}
    need(node.length===2,'INVALID_BACKUP');
    if(kind==='string'){need(typeof value==='string','INVALID_BACKUP');return value;}
    if(kind==='boolean'){need(typeof value==='boolean','INVALID_BACKUP');return value;}
    if(kind==='number'){
      need(typeof value==='string','INVALID_BACKUP');
      if(value==='NaN') return NaN;
      if(value==='Infinity') return Infinity;
      if(value==='-Infinity') return -Infinity;
      if(value==='-0') return -0;
      const n=Number(value);
      need(Number.isFinite(n) && !Object.is(n,-0) && String(n)===value,'INVALID_BACKUP');
      return n;
    }
    need(Array.isArray(value),'INVALID_BACKUP');
    if(kind==='array') return value.map(v=>untag(v,depth+1));
    need(kind==='object','INVALID_BACKUP');
    const out={},keys=new Set();
    for(const pair of value){
      need(Array.isArray(pair) && pair.length===2 && typeof pair[0]==='string' && !keys.has(pair[0]),'INVALID_BACKUP');
      keys.add(pair[0]);own(out,pair[0],untag(pair[1],depth+1));
    }
    return out;
  }
  const out=untag(parsed.payload,0);
  need(record(out),'INVALID_BACKUP');
  return out;
}
function request(request){
  return new Promise((resolve,reject)=>{
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function database(name){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(name,DB_VERSION);
    r.onerror=()=>reject(storageError(r.error));
    r.onblocked=()=>reject(new FoundationError('DATABASE_BLOCKED'));
    r.onsuccess=()=>resolve(r.result);
    r.onupgradeneeded=()=>{r.transaction.abort();reject(new FoundationError('INVALID_STORED_RECORD'));};
  });
}
export async function openPreviewStore(options={}){
  const setting=clone(options);
  need(record(setting) && Object.keys(setting).every(k=>k==='dbName'));
  const dbName=setting.dbName ?? DEFAULT_DB;
  need(nonblank(dbName));
  const foundation=await openStore({dbName});
  let db;
  try{db=await database(dbName);}catch(e){foundation.close();throw e;}
  let closed=false;
  function close(){closed=true;db.close();foundation.close();}
  db.onversionchange=close;
  async function tx(mode,body){
    need(!closed,'STORE_CLOSED');
    let t;
    try{t=db.transaction(STORE_NAMES,mode);}catch(e){throw storageError(e);}
    const done=new Promise((resolve,reject)=>{
      t.oncomplete=resolve;t.onabort=()=>reject(t.error || new FoundationError('TRANSACTION_ABORTED'));t.onerror=()=>{};
    });
    done.catch(()=>{});
    try{const result=await body(t);await done;return clone(result);}
    catch(e){try{t.abort();}catch{}try{await done;}catch{}throw storageError(e);}
  }
  async function rows(t){
    return clone(Object.fromEntries(await Promise.all(STORE_NAMES.map(async name=>[name,await request(t.objectStore(name).getAll())]))));
  }
  async function prepare(command,args){
    const requestCanonical=canonical({command,args});
    return {command,args,requestCanonical,requestFingerprint:await hash(requestCanonical),at:new Date().toISOString(),id:uuid()};
  }
  async function mutate(p,body){
    return tx('readwrite',async t=>{
      const data=await rows(t),current=validateData(data);
      const old=data.operations.find(v=>v.operationId===p.args.operationId);
      if(old){
        need(old.command===p.command && old.requestCanonical===p.requestCanonical && old.requestFingerprint===p.requestFingerprint,'IDEMPOTENCY_CONFLICT');
        return old.result;
      }
      need(current.revision<Number.MAX_SAFE_INTEGER,'REVISION_EXHAUSTED');
      const workspace={...current,revision:current.revision+1};
      const result={...body(t,data,workspace),workspaceRevision:workspace.revision};
      t.objectStore(STORES.meta).put(workspace);
      t.objectStore(STORES.operations).add({operationId:p.args.operationId,schemaVersion:SCHEMA_VERSION,command:p.command,
        requestCanonical:p.requestCanonical,requestFingerprint:p.requestFingerprint,result,completedAt:p.at});
      return result;
    });
  }
  const api={
    close,
    listIntentions:()=>foundation.listIntentions(),
    readIntention:key=>foundation.readIntention(key),
    readDraft:key=>foundation.readDraft(key),
    readWorkspace:()=>foundation.readWorkspace(),
    exportWorkspace:()=>foundation.exportWorkspace(),
    async addIntention(input){
      const args=argsOf(input,['operationId','ris']);
      need(textFields(args.ris) && RIS.every(k=>nonblank(args.ris[k])),'RIS_REQUIRED');
      const p=await prepare('preview.addIntention',args);
      const legacyId=uuid();
      return mutate(p,(t,_data,workspace)=>{
        const intention={intentKey:p.id,schemaVersion:SCHEMA_VERSION,revision:1,
          createdRevision:workspace.revision,createdAt:p.at,updatedAt:p.at,sourceSnapshotKey:null,
          sourceEnvelope:{version:'0.1.0',lang:'ru',intent:{id:legacyId,createdAt:p.at,ris:args.ris,cycles:[]}}};
        t.objectStore(STORES.intentions).add(intention);
        if(workspace.selectedIntentKey===null)workspace.selectedIntentKey=p.id;
        return {intentKey:p.id,intentRevision:1};
      });
    },
    saveObservationDraft:input=>foundation.saveDraft(input),
    importLegacy:input=>{
      const args=argsOf(input,['operationId','rawState']);
      return foundation.importLegacy({...args,mode:'add-copy'});
    },
    async completeObservation(input){
      const args=argsOf(input,['operationId','intentKey','expectedIntentRevision','expectedDraftRevision']);
      need(nonblank(args.intentKey) && rev(args.expectedIntentRevision) && rev(args.expectedDraftRevision));
      const p=await prepare('preview.completeObservation',args);
      return mutate(p,(t,data,workspace)=>{
        const intention=data.intentions.find(v=>v.intentKey===args.intentKey);
        need(intention,'INTENTION_NOT_FOUND');
        const draft=data.drafts.find(v=>v.intentKey===args.intentKey);
        need(draft,'DRAFT_NOT_FOUND');
        need(intention.revision===args.expectedIntentRevision && draft.revision===args.expectedDraftRevision &&
          draft.basedOnIntentRevision===intention.revision,'REVISION_CONFLICT');
        need(intention.revision<Number.MAX_SAFE_INTEGER,'REVISION_EXHAUSTED');
        const values=draft.values,current=intention.sourceEnvelope.intent;
        need(draft.kind===(current.cycles.length===0?'first':'progress'),'DRAFT_KIND_CONFLICT');
        need(record(values.answered) && record(values.iep) && record(values.oop) && textFields(values.cie),'OBSERVATION_INCOMPLETE');
        need(RIS.every(k=>values.cie[k]===current.ris[k] && nonblank(values.cie[k])),'RIS_BASIS_CONFLICT');
        need(draft.kind!=='progress' || values.answered.cie===true,'RIS_CONFIRMATION_REQUIRED');
        need(NUMBERS.every(([part,key,a,b])=>values.answered[part+'.'+key]===true && number(values[part][key],a,b)),'OBSERVATION_INCOMPLETE');
        need(nonblank(values.iep.emotion) && ['freq0','freq1','freq2','freq3','freq4','freq5'].includes(values.iep.frequency) &&
          ['toward','none','away','mixed','unknown'].includes(values.oop.direction) &&
          Array.isArray(values.oop.evidence) && values.oop.evidence.length>0 &&
          values.oop.evidence.every(v=>['direct','documented','otherPerson','subjective','insufficient','other'].includes(v)) &&
          ['yes','no','unsure'].includes(values.intentional) && record(values.revision),'OBSERVATION_INCOMPLETE');
        need(Object.entries(values.revision).every(([k,v])=>RIS.includes(k) && nonblank(v)) &&
          (values.intentional==='yes' ? Object.keys(values.revision).length>0 : Object.keys(values.revision).length===0),'INVALID_REVISION');
        const iep={...values.iep},oop={...values.oop};
        for(const key of ['actions']){if(!has(iep,key))iep[key]='';need(typeof iep[key]==='string','INVALID_OBSERVATION');}
        for(const key of ['currentState','events','external']){if(!has(oop,key))oop[key]='';need(typeof oop[key]==='string','INVALID_OBSERVATION');}
        need(!current.cycles.some(c=>c.id===p.id),'KEY_COLLISION');
        const cycle={id:p.id,createdAt:p.at,cie:clone(values.cie),iep,oop,intentional:values.intentional,revision:clone(values.revision)};
        need(validCycle(cycle),'INVALID_OBSERVATION');
        const sourceEnvelope={...intention.sourceEnvelope,intent:{...current,
          ris:values.intentional==='yes'?{...current.ris,...values.revision}:current.ris,
          cycles:[...current.cycles,cycle]}};
        const updated={...intention,revision:intention.revision+1,updatedAt:p.at,sourceEnvelope};
        t.objectStore(STORES.intentions).put(updated);
        t.objectStore(STORES.drafts).delete(args.intentKey);
        return {intentKey:args.intentKey,cycleId:cycle.id,intentRevision:updated.revision};
      });
    },
    async exportFile(){return encodePreviewBackup(await foundation.exportWorkspace());},
    async importFile(input){
      const args=argsOf(input,['operationId','text','mode','expectedWorkspaceRevision'],['operationId','text']);
      need(typeof args.text==='string' && (!has(args,'mode') || args.mode==='add-copy') &&
        (!has(args,'expectedWorkspaceRevision') || rev(args.expectedWorkspaceRevision,true)));
      const backup=decodePreviewBackup(args.text);
      schema(backup);
      need(backup.format===BACKUP_FORMAT && record(backup.workspace) && Array.isArray(backup.intentions) &&
        Array.isArray(backup.drafts) && Array.isArray(backup.legacySnapshots),'INVALID_BACKUP');
      need(backup.intentions.length+backup.drafts.length+backup.legacySnapshots.length<=FILE_LIMITS.records,'BACKUP_LIMIT_EXCEEDED');
      const sourceData={meta:[backup.workspace],intentions:backup.intentions,drafts:backup.drafts,
        legacySnapshots:backup.legacySnapshots,operations:[]};
      validateData(sourceData,true);
      await Promise.all(backup.legacySnapshots.map(async s=>{
        need(await hash(s.rawState || '')===s.rawSha256 && classifyLegacy(s.rawState).classification===s.classification,'INVALID_BACKUP_PROVENANCE');
        if(s.materializedIntentKey!==null)need(s.classification==='valid-v1' && classifyLegacy(s.rawState).sourceEnvelope.intent!==null,'INVALID_BACKUP_GRAPH');
      }));
      const p=await prepare('preview.importFile',args);
      const intentionMap=new Map(backup.intentions.map(v=>[v.intentKey,uuid()]));
      const snapshotMap=new Map(backup.legacySnapshots.map(v=>[v.snapshotKey,uuid()]));
      const draftMap=new Map(backup.drafts.map(v=>[v.draftId,uuid()]));
      const keyMaps={intentions:Object.fromEntries(intentionMap),snapshots:Object.fromEntries(snapshotMap),drafts:Object.fromEntries(draftMap)};
      const extras={};
      for(const key of Object.keys(backup))if(!['format','schemaVersion','workspace','intentions','drafts','legacySnapshots'].includes(key))own(extras,key,backup[key]);
      return mutate(p,(t,data,workspace)=>{
        if(has(args,'expectedWorkspaceRevision'))need(workspace.revision-1===args.expectedWorkspaceRevision,'REVISION_CONFLICT');
        const intentKeys=new Set(data.intentions.map(v=>v.intentKey));
        const snapshotKeys=new Set(data.legacySnapshots.map(v=>v.snapshotKey));
        const draftIds=new Set(data.drafts.map(v=>v.draftId));
        need(new Set(intentionMap.values()).size===intentionMap.size && new Set(snapshotMap.values()).size===snapshotMap.size &&
          new Set(draftMap.values()).size===draftMap.size,'KEY_COLLISION');
        need([...intentionMap.values()].every(k=>!intentKeys.has(k)) && [...snapshotMap.values()].every(k=>!snapshotKeys.has(k)) &&
          [...draftMap.values()].every(k=>!draftIds.has(k)),'KEY_COLLISION');
        const copiedIntentions = backup.intentions.map(v => ({
          ...v,intentKey:intentionMap.get(v.intentKey),
          sourceSnapshotKey:v.sourceSnapshotKey===null?null:snapshotMap.get(v.sourceSnapshotKey)
        }));
        const copiedSnapshots=backup.legacySnapshots.map(v=>({
          ...v,snapshotKey:snapshotMap.get(v.snapshotKey),
          materializedIntentKey:v.materializedIntentKey===null?null:intentionMap.get(v.materializedIntentKey)
        }));
        const copiedDrafts=backup.drafts.map(v=>({
          ...v,intentKey:intentionMap.get(v.intentKey),draftId:draftMap.get(v.draftId)
        }));
        if(workspace.selectedIntentKey===null){
          workspace.selectedIntentKey=(backup.workspace.selectedIntentKey===null?null:intentionMap.get(backup.workspace.selectedIntentKey))||(intentionMap.size?[...intentionMap.values()][0]:null);
        }
        workspace.restoreSources=[...(workspace.restoreSources||[]),{
          restoreKey:p.id,sourceWorkspace:backup.workspace,sourceBackupExtras:extras,keyMaps
        }];
        const candidate={
          meta:[workspace],intentions:[...data.intentions,...copiedIntentions],
          drafts:[...data.drafts,...copiedDrafts],legacySnapshots:[...data.legacySnapshots,...copiedSnapshots],
          operations:data.operations
        };
        need(candidate.intentions.length+candidate.drafts.length+candidate.legacySnapshots.length<=FILE_LIMITS.records,'BACKUP_LIMIT_EXCEEDED');
        clone(candidate);
        encodePreviewBackup({
          format:BACKUP_FORMAT,schemaVersion:SCHEMA_VERSION,workspace,
          intentions:candidate.intentions,drafts:candidate.drafts,legacySnapshots:candidate.legacySnapshots
        });
        for(const row of copiedIntentions)t.objectStore(STORES.intentions).add(row);
        for(const row of copiedSnapshots)t.objectStore(STORES.legacySnapshots).add(row);
        for(const row of copiedDrafts)t.objectStore(STORES.drafts).add(row);
        return {intentionCount:backup.intentions.length,draftCount:backup.drafts.length,snapshotCount:backup.legacySnapshots.length,keyMaps};
      });
    }
  };
  return Object.freeze(api);
}
