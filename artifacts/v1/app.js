'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('.app');
const scroll = $('.stack-scroll');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const examples = [
  {id:'wind', title:'Энергия ветра', image:'ef2b9.png', prompt:'Создай дашборд ветровой электростанции: мощность, скорость ветра, выработка и состояние турбин.'},
  {id:'tennis', title:'Теннисная статистика', image:'dde3e.png', prompt:'Создай спортивное приложение со статистикой теннисных матчей, карточками игроков и графиками.'},
  {id:'finance', title:'Финансовый дашборд', image:'06302.png', prompt:'Создай финансовый дашборд с балансом, расходами, доходами и аналитикой по категориям.'},
  {id:'content', title:'Планировщик контента', image:'1fba4.png', prompt:'Создай мобильный планировщик контента с заметками, календарём публикаций и списком идей.'},
  {id:'audit', title:'Аналитика продукта', image:'74649.png', prompt:'Создай дашборд аналитики продукта с метриками, графиками и отчётом об активности пользователей.'},
  {id:'reminder', title:'Напоминания', image:'b6e71.png', prompt:'Создай мобильное приложение для напоминаний с расписанием, уведомлениями и простыми настройками.'}
];
const applications = Array.from({length:14}, (_, i) => ({id:`demo-${i}`, title:'Дашборд статей', variant:i % 7}));
let state = 'populated';
let stack = true;
let activeExample = examples[0];
let activeApplication = null;
let attachedFiles = [];
let voice = null;
let toastTimer;
const storage = {get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
function image(filename) {const img = document.createElement('img');img.src=`../assets/${filename}`;img.alt='';img.decoding='async';return img;}
function exampleCard(example) {
  const button = document.createElement('button');button.className=`example-card art-${example.id}`;button.setAttribute('aria-label',`Посмотреть пример: ${example.title}`);button.dataset.example=example.id;
  const visual = document.createElement('div');visual.className='gallery-visual';
  const artwork = document.createElement('div');artwork.className='artwork';artwork.append(image(example.image));visual.append(artwork);
  if(example.id==='finance'){const top = document.createElement('div');top.className='finance-top';top.append(image(example.image));visual.append(top);}
  button.append(visual);
  button.addEventListener('click',()=>openExample(example));return button;
}
function applicationCard(application) {
  const button=window.ArtifactsPreviews.createProjectCard(application);
  button.addEventListener('click',()=>openApplication(application));
  return button;
}
function renderApplications(){ $('#app-list').replaceChildren(...applications.map(applicationCard));$('#app-count').textContent=applications.length;requestStack(); }
function setState(next){state=next==='empty'?'empty':'populated';app.dataset.state=state;storage.set('artifacts-screen',state);$$('[name=screen-state]').forEach(r=>r.checked=r.value===state);$('#stack-switch').disabled=state==='empty';requestStack();}
let stackFrame = 0;
function requestStack(){if(!stackFrame)stackFrame=requestAnimationFrame(updateStack);}
function updateStack(){
  stackFrame=0;if(state==='empty')return;
  window.ArtifactsPreviews.updateStack(scroll,stack&&!reducedMotion.matches);
}
scroll.addEventListener('scroll',requestStack,{passive:true});new ResizeObserver(requestStack).observe(scroll);window.addEventListener('resize',requestStack);reducedMotion.addEventListener('change',requestStack);
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
function openPreview({title,label,content,note,action}){
  $('#preview-title').textContent=title;$('#preview-label').textContent=label;$('#preview-content').replaceChildren(content);
  $('#preview-note').textContent=note;$('#preview-action').textContent=action;
  if(!$('#preview-dialog').open)$('#preview-dialog').showModal();
}
function openExample(example){
  activeExample=example;activeApplication=null;const content=exampleCard(example);content.disabled=true;
  openPreview({title:example.title,label:'Пример приложения',content,note:'Возьмите этот пример за основу своей идеи.',action:'Использовать как основу'});
}
function openApplication(application){
  activeApplication=application;
  openPreview({title:application.title,label:'Ваше приложение',content:window.ArtifactsPreviews.createProjectCard(application,{disabled:true}),note:'Создано вами. Откройте приложение, чтобы продолжить работу.',action:'Открыть приложение'});
}
function openLibrary(){if(state==='empty'){toast('Пока нет созданных приложений. Начните с описания идеи.');return;}$('#library-grid').replaceChildren(...applications.map(applicationCard));$('#library-dialog').showModal();}
function resetChat(){ $('#conversation').hidden=true;$('#conversation').replaceChildren();$('#main').classList.remove('has-conversation');$('#prompt').value='';$('#prompt').style.height='50px';attachedFiles=[];renderAttachments();$('#main').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'}); }
$('#home').addEventListener('click',resetChat);
$('#showcase').addEventListener('click',()=>$('#gallery').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'}));
$('#settings').addEventListener('click',()=>$('#settings-dialog').showModal());
$('#settings-done').addEventListener('click',()=>$('#settings-dialog').close());
$$('[name=screen-state]').forEach(r=>r.addEventListener('change',()=>setState(r.value)));
$('#stack-switch').addEventListener('change',event=>{stack=event.target.checked;storage.set('artifacts-stack',String(stack));requestStack();});
$('#all-apps').addEventListener('click',openLibrary);
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}));
$('#preview-action').addEventListener('click',()=>{if(activeApplication){location.assign('workspace.html');return;}$('#preview-dialog').close();$('#library-dialog').close();resetChat();$('#prompt').value=activeExample.prompt;resizePrompt();$('#prompt').focus();});
const agentSegments=$('.segments');
const agentIndicator=$('.segment-indicator');
function moveAgentIndicator(){
  const selected=$('[data-provider][aria-pressed=true]',agentSegments);
  if(!selected)return;
  const bounds=selected.getBoundingClientRect();
  agentIndicator.style.width=`${bounds.width}px`;
  agentIndicator.style.transform=`translateX(${bounds.left-agentSegments.getBoundingClientRect().left}px)`;
}
$$('[data-provider]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-provider]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  storage.set('artifacts-provider',button.dataset.provider);moveAgentIndicator();
}));
new ResizeObserver(moveAgentIndicator).observe(agentSegments);
$('#model-toggle').addEventListener('click',()=>{const open=$('#model-menu').hidden;$('#model-menu').hidden=!open;$('#model-toggle').setAttribute('aria-expanded',String(open));if(open)$('#model-menu button').focus();});
$$('[data-model]').forEach(button=>button.addEventListener('click',()=>{ $('#model-name').textContent=button.dataset.model;$$('[data-model]').forEach(b=>{b.setAttribute('aria-pressed',String(b===button));$('span',b).textContent=b===button?'✓':'';});$('#model-menu').hidden=true;$('#model-toggle').setAttribute('aria-expanded','false');$('#model-toggle').focus(); }));
document.addEventListener('click',event=>{if(!event.target.closest('.model-picker')){$('#model-menu').hidden=true;$('#model-toggle').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('#model-menu').hidden=true;$('#model-toggle').setAttribute('aria-expanded','false');}if(event.key==='ArrowDown'&&!$('#model-menu').hidden){event.preventDefault();const items=$$('[data-model]');items[(items.indexOf(document.activeElement)+1)%items.length].focus();}});
function resizePrompt(){const field=$('#prompt');field.style.height='auto';field.style.height=`${Math.min(180,Math.max(matchMedia('(max-width:600px)').matches?68:50,field.scrollHeight))}px`;}
$('#prompt').addEventListener('input',resizePrompt);
$('#prompt').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('#composer').requestSubmit();}});
$('#attach').addEventListener('click',()=>$('#file-input').click());
$('#file-input').addEventListener('change',event=>{attachedFiles.push(...[...event.target.files].map(file=>({name:file.name,size:file.size})));event.target.value='';renderAttachments();});
function renderAttachments(){const container=$('#attachments');container.hidden=!attachedFiles.length;container.replaceChildren(...attachedFiles.map((file,index)=>{const chip=document.createElement('div');chip.className='attachment';const name=document.createElement('span');name.textContent=file.name;const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Убрать файл ${file.name}`);remove.addEventListener('click',()=>{attachedFiles.splice(index,1);renderAttachments();});chip.append(name,remove);return chip;}));}
$('#microphone').addEventListener('click',()=>{
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){toast('Голосовой ввод недоступен в этом браузере. Введите идею текстом.');return;}
  if(voice){voice.stop();return;}
  voice=new Recognition();voice.lang='ru-RU';voice.interimResults=false;
  voice.onresult=event=>{$('#prompt').value=[$('#prompt').value,event.results[0][0].transcript].filter(Boolean).join(' ');resizePrompt();};
  voice.onerror=()=>toast('Не удалось включить микрофон. Проверьте разрешение браузера.');
  voice.onend=()=>{voice=null;$('#microphone').removeAttribute('aria-pressed');};
  try{voice.start();$('#microphone').setAttribute('aria-pressed','true');toast('Слушаю вашу идею…');}catch{voice=null;toast('Не удалось начать голосовой ввод.');}
});
$('#composer').addEventListener('submit',event=>{event.preventDefault();window.ArtifactsGeneration.start();});
$('#gallery').replaceChildren(...examples.map(exampleCard));renderApplications();
const queryState=new URLSearchParams(location.search).get('state');setState(queryState||storage.get('artifacts-screen')||'populated');
stack=storage.get('artifacts-stack')!=='false';$('#stack-switch').checked=stack;
const provider=storage.get('artifacts-provider');if(provider)$$('[data-provider]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.provider===provider)));
moveAgentIndicator();
document.fonts.ready.then(()=>{
  requestStack();moveAgentIndicator();
  requestAnimationFrame(()=>agentSegments.classList.add('indicator-ready'));
});
