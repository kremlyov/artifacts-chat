'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('.app');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const examples = [
  {id:'wind', title:'Энергия ветра', image:'ef2b9.png', prompt:'Создай дашборд ветровой электростанции: мощность, скорость ветра, выработка и состояние турбин.'},
  {id:'tennis', title:'Теннисная статистика', image:'dde3e.png', prompt:'Создай спортивное приложение со статистикой теннисных матчей, карточками игроков и графиками.'},
  {id:'finance', title:'Финансовый дашборд', image:'06302.png', prompt:'Создай финансовый дашборд с балансом, расходами, доходами и аналитикой по категориям.'},
  {id:'content', title:'Планировщик контента', image:'1fba4.png', prompt:'Создай мобильный планировщик контента с заметками, календарём публикаций и списком идей.'},
  {id:'audit', title:'Аналитика продукта', image:'74649.png', prompt:'Создай дашборд аналитики продукта с метриками, графиками и отчётом об активности пользователей.'},
  {id:'reminder', title:'Напоминания', image:'b6e71.png', prompt:'Создай мобильное приложение для напоминаний с расписанием, уведомлениями и простыми настройками.'}
];
const galleryEntries=[examples[0],{...examples[1],created:true},examples[3],{...examples[4],created:true,title:'Дашборд статей'},{...examples[2],created:true},examples[5]];
let activeExample = examples[0];
let activeApplication = null;
let attachedFiles = [];
let voice = null;
let toastTimer;
const storage = {get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
function image(filename) {const img = document.createElement('img');img.src=`assets/${filename}`;img.alt='';img.decoding='async';return img;}
function exampleCard(example) {
  const button = document.createElement('button');button.className=`example-card art-${example.id}`;button.setAttribute('aria-label',example.created?`Открыть ${example.title}`:`Посмотреть пример: ${example.title}`);button.dataset.example=example.id;
  const visual = document.createElement('div');visual.className='gallery-visual';
  const artwork = document.createElement('div');artwork.className='artwork';artwork.append(image(example.image));visual.append(artwork);
  if(example.id==='finance'){const top = document.createElement('div');top.className='finance-top';top.append(image(example.image));visual.append(top);}
  button.append(visual);button.dataset.kind=example.created?'project':'example';const caption=document.createElement('span');caption.className='gallery-caption';caption.textContent=example.created?'Моё приложение':'Пример приложения';button.append(caption);
  button.addEventListener('click',()=>example.created?openApplication(example):openExample(example));return button;
}
function pendingCard(project){
  const button=document.createElement('button');button.type='button';button.className='example-card pending-card';button.dataset.pendingProject=project.id;
  button.setAttribute('aria-label','Открыть генерацию прототипа переводчика');
  const field=document.createElement('div');field.className='pending-wave-field';field.setAttribute('aria-hidden','true');
  for(let i=0;i<2;i++){
    const surface=document.createElement('div');surface.className='pending-wave-layer';field.append(surface);
  }
  button.append(field);
  const title=document.createElement('span');title.className='pending-card-title';title.textContent='Разработка прототипа переводчика';button.append(title);
  button.addEventListener('click',()=>window.ArtifactsGeneration.resume(project.id));return button;
}
function generatedCard(project){
  const button=document.createElement('button');button.type='button';button.className='example-card generated-card';button.dataset.project=project.id;button.dataset.kind='project';
  button.setAttribute('aria-label','Открыть прототип переводчика');
  const preview=image('translator-prototype-preview.png');preview.className='generated-card-image';
  const caption=document.createElement('span');caption.className='gallery-caption';caption.textContent='Прототип переводчика';
  button.append(preview,caption);button.addEventListener('click',()=>window.ArtifactsGeneration.resume(project.id));return button;
}
function renderGallery(projects=[]){
  const entries=projects.length?[galleryEntries[0],galleryEntries[3],galleryEntries[1],galleryEntries[2],galleryEntries[4],galleryEntries[5]]:galleryEntries;
  $('#gallery').replaceChildren(...projects.map(project=>project.status==='ready'?generatedCard(project):pendingCard(project)),...entries.map(exampleCard));
}
window.ArtifactsGallery={setProjects:renderGallery};
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
  openPreview({title:application.title,label:'Ваше приложение',content:Object.assign(exampleCard(application),{disabled:true}),note:'Создано вами. Откройте приложение, чтобы продолжить работу.',action:'Открыть приложение'});
}
function resetChat(){$('#prompt').value='';$('#prompt').style.height='50px';attachedFiles=[];renderAttachments();}
$('#home').addEventListener('click',resetChat);
document.addEventListener('artifacts:reset-composer',resetChat);
$('#settings').addEventListener('click',()=>{window.ArtifactsPrecise?.setEnabled(false);$('#settings-dialog').showModal();});
$('#settings-done').addEventListener('click',()=>$('#settings-dialog').close());
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}));
$('#preview-action').addEventListener('click',()=>{if(activeApplication){location.assign('workspace.html');return;}$('#preview-dialog').close();resetChat();$('#prompt').value=activeExample.prompt;resizePrompt();$('#prompt').focus();});
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
$('#composer').addEventListener('submit',event=>{event.preventDefault();if(window.ArtifactsGeneration.start($('#prompt').value))resetChat();});
renderGallery(window.ArtifactsGeneration.getProjects());
const provider=storage.get('artifacts-provider');if(provider)$$('[data-provider]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.provider===provider)));
moveAgentIndicator();
document.fonts.ready.then(()=>{
  moveAgentIndicator();
  requestAnimationFrame(()=>agentSegments.classList.add('indicator-ready'));
});
