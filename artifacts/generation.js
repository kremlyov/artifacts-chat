'use strict';
window.ArtifactsGeneration=(()=>{
  const body=document.body,hero=document.querySelector('.hero');
  const gallery=document.querySelector('#gallery'),pane=document.querySelector('.workspace-left');
  const transcript=document.querySelector('.flow-transcript'),message=document.querySelector('#flow-user-message');
  const summary=document.querySelector('#flow-summary'),progress=document.querySelector('.flow-progress');
  const progressText=document.querySelector('#flow-progress-text'),result=document.querySelector('.flow-result');
  const project=document.querySelector('.flow-project'),projectLabel=project.querySelector('span');
  const prompt=document.querySelector('#prompt'),send=document.querySelector('#composer .send');
  const announcement=document.querySelector('#flow-announcement');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const summaryText='Соберу переводчик с выбором языков, вводом текста и AI-подсказками.';
  const defaultPrompt='Сделай прототип переводчика',storageKey='artifacts-projects';
  const waiting=new Map();
  let state=body.dataset.flowState,runId=0,playerReady=false,activeProject=null;
  let projects=[];
  try{
    const saved=JSON.parse(sessionStorage.getItem(storageKey)||sessionStorage.getItem('artifacts-pending-prototypes')||'[]');
    if(Array.isArray(saved))projects=saved.filter(item=>item&&typeof item.id==='string'&&typeof item.prompt==='string').map(item=>({...item,status:item.status==='ready'?'ready':'pending'}));
  }catch{}
  const wait=ms=>new Promise(resolve=>{const timer=setTimeout(()=>{waiting.delete(timer);resolve();},ms);waiting.set(timer,resolve);});
  function cancelRun(){++runId;for(const [timer,resolve] of waiting){clearTimeout(timer);resolve();}waiting.clear();}
  const player=window.lottie.loadAnimation({container:document.querySelector('#flow-preloader'),renderer:'svg',loop:true,autoplay:false,path:'assets/spiral-dots-preloader.json',rendererSettings:{viewBoxSize:'330 250 140 100',preserveAspectRatio:'xMidYMid meet'}});
  function playback(){if(!playerReady)return;if(state==='conversation'&&!document.hidden&&!reduced.matches)player.play();else player.pause();}
  player.addEventListener('DOMLoaded',()=>{playerReady=true;player.resize();playback();});
  reduced.addEventListener('change',playback);
  function setState(value){state=value;body.dataset.flowState=value;playback();}
  function announce(text){announcement.textContent=text;}
  function scrollChat(){transcript.scrollTop=transcript.scrollHeight;}
  function setProgress(text){progressText.textContent=text;announce(text);scrollChat();}
  function getProjects(){return projects.map(item=>({...item}));}
  function rememberProject(status){
    if(!activeProject)return;
    activeProject={...activeProject,status};
    projects=projects.filter(item=>item.id!==activeProject.id&&(status!=='ready'||item.status==='ready'));
    projects.unshift({...activeProject});
    try{sessionStorage.setItem(storageKey,JSON.stringify(projects));}catch{}
    window.ArtifactsGallery.setProjects(getProjects());
  }
  function completeWorkspace(){
    setState('workspace');gallery.hidden=true;gallery.inert=true;gallery.setAttribute('aria-hidden','true');
    hero.inert=true;pane.inert=false;pane.setAttribute('aria-hidden','false');
    project.setAttribute('aria-label','Вернуться на главную');projectLabel.setAttribute('aria-hidden','true');
    prompt.readOnly=false;send.disabled=false;send.setAttribute('aria-label','Отправить сообщение');
    window.ArtifactsWorkspace.updateGeometry();
    rememberProject('ready');
    announce('Прототип готов. Можно выбрать элемент для точечной правки.');
  }
  async function streamSummary(id){
    summary.hidden=false;summary.textContent='';
    const words=summaryText.split(' ');
    for(let i=0;i<words.length;i++){
      if(id!==runId)return;
      summary.textContent=words.slice(0,i+1).join(' ');scrollChat();
      await wait(reduced.matches?0:90);
    }
  }
  async function run(id,resuming){
    await wait(reduced.matches?0:40);if(id!==runId)return;
    setState('conversation');
    if(innerWidth<=800)window.scrollTo({top:0,behavior:'instant'});
    if(resuming){
      summary.textContent=summaryText;summary.hidden=false;progress.hidden=false;
      setProgress('Продолжаю сборку переводчика…');
      if(playerReady)player.resize();
      await wait(1800);if(id!==runId)return;
      setProgress('Проверяю интерфейс и AI-подсказки…');
      await wait(1200);if(id!==runId)return;
    }else{
      await wait(850);if(id!==runId)return;
      await streamSummary(id);if(id!==runId)return;
      await wait(500);if(id!==runId)return;
      progress.hidden=false;setProgress('Собираю интерфейс переводчика…');
      if(playerReady)player.resize();
      await wait(2600);if(id!==runId)return;
      setProgress('Добавляю выбор языков и AI-подсказки…');
      await wait(2600);if(id!==runId)return;
    }
    progress.hidden=true;result.hidden=false;announce('Прототип переводчика собран.');scrollChat();
    await wait(resuming?1000:1600);if(id!==runId)return;
    await revealWorkspace(id);
  }
  async function revealWorkspace(id){
    gallery.inert=true;gallery.setAttribute('aria-hidden','true');pane.setAttribute('aria-hidden','false');
    project.setAttribute('aria-label','Вернуться на главную');projectLabel.setAttribute('aria-hidden','true');
    setState('revealing');
    await wait(reduced.matches?0:1100);if(id!==runId)return;
    completeWorkspace();
  }
  function openReady(item){
    if(state!=='idle')return false;
    cancelRun();activeProject=item;
    message.textContent=item.prompt;summary.textContent=summaryText;
    transcript.hidden=false;summary.hidden=false;progress.hidden=true;result.hidden=false;transcript.scrollTop=0;
    hero.inert=true;prompt.blur();prompt.readOnly=true;send.disabled=true;
    if(innerWidth<=800)window.scrollTo({top:0,behavior:'instant'});
    revealWorkspace(runId);
    return true;
  }
  function begin(item,resuming=false){
    if(state!=='idle')return false;
    state='starting';activeProject=item;
    const id=++runId;
    message.textContent=item.prompt;transcript.hidden=false;transcript.scrollTop=0;
    summary.hidden=true;progress.hidden=true;result.hidden=true;
    hero.inert=true;prompt.blur();prompt.readOnly=true;send.disabled=true;
    project.setAttribute('aria-label','Новый проект');projectLabel.removeAttribute('aria-hidden');
    announce(resuming?'Продолжаю сборку прототипа переводчика.':'Запрос отправлен. Собираю прототип переводчика.');run(id,resuming);
    return true;
  }
  function start(value){return begin({id:crypto.randomUUID(),prompt:String(value||'').trim()||defaultPrompt});}
  function resume(id){
    const item=projects.find(item=>item.id===id);
    if(item&&(item.status==='ready'?openReady(item):begin(item,true)))document.dispatchEvent(new Event('artifacts:reset-composer'));
  }
  async function returnHome(keepPending=false){
    if(!['starting','conversation','revealing','workspace'].includes(state))return;
    cancelRun();const id=runId;
    if(keepPending)rememberProject('pending');
    else if(state==='revealing')rememberProject('ready');
    state='returning';playback();
    window.ArtifactsPrecise?.setEnabled(false);prompt.blur();prompt.readOnly=true;send.disabled=true;
    pane.inert=true;pane.setAttribute('aria-hidden','true');gallery.hidden=false;gallery.inert=true;
    if(keepPending||activeProject?.status==='ready')gallery.scrollTop=0;
    document.dispatchEvent(new Event('artifacts:reset-composer'));
    body.classList.add('flow-returning');
    gallery.getBoundingClientRect();
    body.dataset.flowState='idle';
    project.setAttribute('aria-label','Новый проект');projectLabel.removeAttribute('aria-hidden');
    if(innerWidth<=800)window.scrollTo({top:0,behavior:'instant'});
    await wait(reduced.matches?0:1100);if(id!==runId)return;
    resetHome();
    if(location.pathname.endsWith('/workspace.html'))history.replaceState(null,'',new URL('./',location.href));
    announce(keepPending?'Новый проект. Предыдущий запрос сохранён в витрине.':'Главный экран.');
  }
  function resetHome(){
    setState('idle');body.classList.remove('flow-returning');summary.textContent='';transcript.hidden=true;
    summary.hidden=true;progress.hidden=true;result.hidden=true;hero.inert=false;activeProject=null;
    gallery.hidden=false;gallery.inert=false;gallery.removeAttribute('aria-hidden');
    pane.inert=true;pane.setAttribute('aria-hidden','true');
    project.setAttribute('aria-label','Новый проект');projectLabel.removeAttribute('aria-hidden');
    prompt.readOnly=false;send.disabled=false;send.setAttribute('aria-label','Отправить идею');
  }
  project.addEventListener('click',event=>{
    event.preventDefault();
    returnHome(state==='starting'||state==='conversation');
  });
  document.querySelector('.workspace-mobile-back').addEventListener('click',event=>{event.preventDefault();returnHome();});
  document.querySelector('#home').addEventListener('click',()=>{if(state==='workspace'||state==='revealing')returnHome();});
  window.addEventListener('pagehide',()=>{cancelRun();if(playerReady)player.pause();});
  window.addEventListener('pageshow',event=>{if(event.persisted){cancelRun();resetHome();announce('');}});
  document.addEventListener('visibilitychange',playback);
  document.addEventListener('DOMContentLoaded',()=>{
    if(body.dataset.entry==='workspace'){
      activeProject=projects.find(item=>item.status==='ready')||{id:crypto.randomUUID(),prompt:defaultPrompt};
      message.textContent=activeProject.prompt;summary.textContent=summaryText;
      transcript.hidden=false;summary.hidden=false;result.hidden=false;
      completeWorkspace();
    }
  });
  return{start,resume,getProjects};
})();
