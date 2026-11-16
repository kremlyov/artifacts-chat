'use strict';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const layout=$('.workspace-layout'),pane=$('.workspace-left'),preview=$('.application-preview'),header=$('.workspace-header');
const logo=$('.workspace-logo-toggle'),drawer=$('.workspace-drawer'),closePanel=$('.workspace-panel-close'),divider=$('.workspace-divider');
const devicePicker=$('.device-picker'),deviceIndicator=$('.device-indicator');
const refresh=$('.refresh-control'),refreshIcon=$('img',refresh),actions=$('.workspace-actions');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
if(document.documentElement.classList.contains('workspace-arriving')){
  if(reducedMotion.matches)document.documentElement.classList.remove('workspace-arriving');
  else preview.addEventListener('animationend',event=>{if(event.target===preview&&event.animationName==='workspace-arrive')document.documentElement.classList.remove('workspace-arriving');});
}
let projectsOpen=false,chatWidth=320,resizeSession=null,geometryFrame=0,stackFrame=0,refreshTurns=0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function resizeBounds(){return{min:240,max:Math.max(240,Math.min(640,layout.clientWidth-520-26))};}
function setChatWidth(value){
  const bounds=resizeBounds();chatWidth=Math.round(clamp(value,bounds.min,bounds.max));
  layout.style.setProperty('--chat-width',`${chatWidth}px`);
  divider.setAttribute('aria-valuemin',String(bounds.min));divider.setAttribute('aria-valuemax',String(bounds.max));
  divider.setAttribute('aria-valuenow',String(chatWidth));divider.setAttribute('aria-valuetext',`${chatWidth} пикселей`);
  scheduleGeometry();
}
function scheduleGeometry(){if(!geometryFrame)geometryFrame=requestAnimationFrame(updateGeometry);}
function updateGeometry(){
  geometryFrame=0;
  pane.classList.toggle('compact-toolbar',pane.clientWidth<980);
  pane.classList.toggle('dense-toolbar',pane.clientWidth<600);
  const style=getComputedStyle(header),paddingLeft=parseFloat(style.paddingLeft),paddingRight=parseFloat(style.paddingRight);
  let deviceLeft=Math.round((pane.clientWidth+paddingLeft-paddingRight-devicePicker.offsetWidth)/2);
  if(pane.clientWidth<600&&innerWidth>600){
    const actionsLeft=$('.workspace-actions button').getBoundingClientRect().left-pane.getBoundingClientRect().left;
    deviceLeft=Math.min(deviceLeft,Math.floor(actionsLeft-6-devicePicker.offsetWidth));
  }
  header.style.setProperty('--device-left',`${deviceLeft}px`);
  const brand=$('.brand',logo),base=header.getBoundingClientRect().left+paddingLeft+brand.getBoundingClientRect().width;
  logo.style.setProperty('--logo-gap',`${Math.round(base+10)-base}px`);
  const scale=clamp(Math.min(.77,(pane.clientWidth-290)/preview.offsetWidth,pane.clientHeight*.708/preview.offsetHeight),.18,.77);
  pane.style.setProperty('--preview-scale',String(scale));pane.style.setProperty('--preview-x','270px');
  pane.style.setProperty('--preview-y',`${(pane.clientHeight-preview.offsetHeight*scale)/2-header.offsetHeight}px`);
  pane.style.setProperty('--preview-blur',`${5/scale}px`);
}
function setProjectsOpen(open){
  if(open)window.ArtifactsPrecise?.setEnabled(false);
  const keyboardFocus=document.activeElement?.matches(':focus-visible');
  projectsOpen=open;updateGeometry();document.body.classList.toggle('projects-open',open);
  logo.setAttribute('aria-expanded',String(open));logo.setAttribute('aria-label',open?'На главную':'Показать проекты');
  drawer.setAttribute('aria-hidden',String(!open));drawer.inert=!open;
  devicePicker.inert=open;actions.inert=open;preview.inert=open;divider.inert=open;closePanel.hidden=!open;
  divider.setAttribute('aria-disabled',String(open));
  if(open)requestProjectStack();
  else if(keyboardFocus)logo.focus({preventScroll:true});
}
const goHome=()=>location.assign('./');
logo.addEventListener('click',()=>projectsOpen?goHome():setProjectsOpen(true));
$('.drawer-new').addEventListener('click',goHome);
closePanel.addEventListener('click',()=>setProjectsOpen(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&projectsOpen){event.preventDefault();setProjectsOpen(false);}});
$$('[data-device]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  deviceIndicator.style.transform=`translateX(${button.offsetLeft}px)`;
}));
refresh.addEventListener('click',()=>{refreshIcon.style.transform=`rotate(${++refreshTurns}turn)`;});
divider.addEventListener('pointerdown',event=>{
  if(projectsOpen||innerWidth<=800||event.button!==0)return;
  event.preventDefault();resizeSession={pointerId:event.pointerId,startX:event.clientX,startWidth:chatWidth};
  divider.setPointerCapture(event.pointerId);document.body.classList.add('is-resizing');
});
divider.addEventListener('pointermove',event=>{
  if(resizeSession&&event.pointerId===resizeSession.pointerId)setChatWidth(resizeSession.startWidth+resizeSession.startX-event.clientX);
});
function finishResize(){resizeSession=null;document.body.classList.remove('is-resizing');}
divider.addEventListener('pointerup',finishResize);divider.addEventListener('pointercancel',finishResize);divider.addEventListener('lostpointercapture',finishResize);
divider.addEventListener('keydown',event=>{
  if(projectsOpen)return;let value=chatWidth;const bounds=resizeBounds();
  if(event.key==='ArrowLeft')value+=event.shiftKey?40:10;
  else if(event.key==='ArrowRight')value-=event.shiftKey?40:10;
  else if(event.key==='Home')value=bounds.min;
  else if(event.key==='End')value=bounds.max;
  else return;
  event.preventDefault();setChatWidth(value);
});
const scroller=$('.stack-scroll',drawer),track=$('#workspace-projects');
const projects=Array.from({length:14},(_,i)=>({id:`workspace-${i}`,title:'Дашборд статей',variant:i%7}));
track.replaceChildren(...projects.map(project=>window.ArtifactsPreviews.createProjectCard(project,{disabled:true})));
function requestProjectStack(){if(!stackFrame)stackFrame=requestAnimationFrame(()=>{stackFrame=0;let enabled=!reducedMotion.matches;try{enabled=enabled&&localStorage.getItem('artifacts-stack')!=='false';}catch{}window.ArtifactsPreviews.updateStack(scroller,enabled);});}
scroller.addEventListener('scroll',requestProjectStack,{passive:true});new ResizeObserver(requestProjectStack).observe(scroller);
new ResizeObserver(scheduleGeometry).observe(pane);
window.addEventListener('resize',()=>{if(innerWidth>800)setChatWidth(chatWidth);else scheduleGeometry();});
reducedMotion.addEventListener('change',requestProjectStack);
setChatWidth(chatWidth);requestProjectStack();
document.fonts.ready.then(()=>{updateGeometry();header.classList.add('geometry-ready');});
