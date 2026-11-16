'use strict';
window.ArtifactsGeneration=(()=>{
  const screen=document.querySelector('#generation-screen'),app=document.querySelector('.app');
  const fact=document.querySelector('#generation-fact'),announcement=document.querySelector('#generation-announcement');
  const rows=[...document.querySelectorAll('[data-generation-stage]')],loader=document.querySelector('#generation-preloader');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const stageDuration=6000;
  const facts=[
    'Могу обрабатывать аналитику из АБ-шницы',
    'Подключаю к прототипам внутреннюю инфру',
    'Могу собирать лендинги с анимацией',
    'Использую внутренние дизайн-системы'
  ];
  let running=false,finishing=false,visible=false,ready=false,warmed=false,runId=0,timer=0,startedAt=0,currentStage=-1;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const player=window.lottie.loadAnimation({
    container:loader,renderer:'svg',loop:true,autoplay:false,path:'../assets/spiral-dots-preloader.json',
    rendererSettings:{viewBoxSize:'330 250 140 100',preserveAspectRatio:'xMidYMid meet'}
  });
  function updatePlayback(){if(!ready)return;if(running&&visible&&!finishing&&!reduced.matches)player.play();else player.pause();}
  player.addEventListener('DOMLoaded',()=>{ready=true;player.resize();updatePlayback();});
  reduced.addEventListener('change',updatePlayback);
  function warmWorkspace(){
    if(warmed)return;warmed=true;
    fetch('workspace.html').then(response=>response.ok?response.text():null).then(html=>{
      if(!html)return;const document=new DOMParser().parseFromString(html,'text/html');
      const assets=new Set(['workspace.html',...Array.from(document.querySelectorAll('link[href],script[src],img[src]'),el=>el.getAttribute('src')||el.getAttribute('href'))]);
      for(const href of assets){if(!href||/^(https?:|data:)/.test(href))continue;const link=window.document.createElement('link');link.rel='prefetch';link.href=href;window.document.head.append(link);}
    }).catch(()=>{});
  }
  function setStage(index){
    currentStage=index;
    rows.forEach((row,i)=>{
      const state=i<index?'done':i===index?'active':'pending';row.dataset.state=state;
      row.querySelector('.generation-check').hidden=state!=='done';
      row.querySelector('.stage-description').textContent=state==='done'?'Готово':state==='active'?'В процессе':'Ожидание';
      if(state==='active'){row.setAttribute('aria-current','step');row.querySelector('.generation-stage-icon').append(loader);}
      else row.removeAttribute('aria-current');
    });
    if(index===rows.length){loader.hidden=true;announcement.textContent='Приложение готово';}
    else{loader.hidden=false;announcement.textContent=`${rows[index].querySelector('.generation-stage-text').textContent}. Этап ${index+1} из ${rows.length}`;}
  }
  async function showFact(index,first,id){
    if(!first&&!reduced.matches){fact.classList.remove('is-visible');await wait(350);}
    if(id!==runId||!running||finishing)return;
    fact.textContent=facts[index];fact.dataset.kind='agent';
    requestAnimationFrame(()=>{if(id===runId)fact.classList.add('is-visible');});
  }
  async function finish(id){
    finishing=true;setStage(rows.length);updatePlayback();
    await wait(400);if(id!==runId)return;
    screen.classList.add('is-leaving');fact.classList.remove('is-visible');
    await wait(reduced.matches?0:500);if(id!==runId)return;
    try{sessionStorage.setItem('artifacts-workspace-arrival','true');}catch{}
    location.assign('workspace.html');
  }
  function tick(){
    clearTimeout(timer);if(!running||finishing)return;
    const elapsed=performance.now()-startedAt,index=Math.min(rows.length,Math.floor(elapsed/stageDuration));
    if(index===rows.length){finish(runId);return;}
    if(index!==currentStage){setStage(index);showFact(index,false,runId);}
    timer=setTimeout(tick,Math.max(10,(index+1)*stageDuration-elapsed));
  }
  async function start(){
    if(running)return;running=true;finishing=false;visible=false;const id=++runId;
    app.inert=true;document.body.classList.add('generation-running');screen.hidden=false;screen.classList.remove('is-visible','is-leaving');
    fact.classList.remove('is-visible');warmWorkspace();
    await wait(reduced.matches?0:550);if(id!==runId)return;
    visible=true;screen.classList.add('is-visible');screen.focus({preventScroll:true});setStage(0);showFact(0,true,id);
    if(ready){player.goToAndStop(0,true);player.resize();}updatePlayback();
    startedAt=performance.now();timer=setTimeout(tick,stageDuration);
  }
  function reset(){
    ++runId;clearTimeout(timer);running=false;finishing=false;visible=false;screen.hidden=true;screen.classList.remove('is-visible','is-leaving');
    document.body.classList.remove('generation-running');app.inert=false;updatePlayback();
  }
  window.addEventListener('pagehide',()=>{++runId;clearTimeout(timer);if(ready)player.pause();});
  window.addEventListener('pageshow',event=>{if(event.persisted)reset();});
  document.addEventListener('visibilitychange',()=>{if(running&&visible&&!document.hidden)tick();});
  return{start};
})();
