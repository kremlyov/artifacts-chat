'use strict';
window.ArtifactsWorkspace=(()=>{
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const layout=$('.workspace-layout'),pane=$('.workspace-left'),preview=$('.application-preview'),divider=$('.workspace-divider');
const devicePicker=$('.device-picker'),deviceIndicator=$('.device-indicator'),refresh=$('.refresh-control'),refreshIcon=$('img',refresh);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let chatWidth=320,resizeSession=null,geometryFrame=0,refreshTurns=0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function resizeBounds(){return{min:240,max:Math.max(240,Math.min(640,layout.clientWidth-556))};}
function updateGeometry(){geometryFrame=0;pane.classList.toggle('compact-toolbar',pane.clientWidth<980);pane.classList.toggle('dense-toolbar',pane.clientWidth<600);const selected=$('[data-device][aria-pressed=true]');deviceIndicator.style.transform=`translateX(${selected.offsetLeft}px)`;}
function scheduleGeometry(){if(!geometryFrame)geometryFrame=requestAnimationFrame(updateGeometry);}
function setChatWidth(value){const bounds=resizeBounds();chatWidth=Math.round(clamp(value,bounds.min,bounds.max));layout.style.setProperty('--chat-width',`${chatWidth}px`);divider.setAttribute('aria-valuemin',String(bounds.min));divider.setAttribute('aria-valuemax',String(bounds.max));divider.setAttribute('aria-valuenow',String(chatWidth));divider.setAttribute('aria-valuetext',`${chatWidth} пикселей`);scheduleGeometry();}
$$('[data-device]').forEach(button=>button.addEventListener('click',()=>{$$('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));deviceIndicator.style.transform=`translateX(${button.offsetLeft}px)`;}));
refresh.addEventListener('click',()=>{refreshIcon.style.transform=`rotate(${++refreshTurns}turn)`;});
divider.addEventListener('pointerdown',event=>{if(innerWidth<=800||event.button!==0)return;event.preventDefault();resizeSession={pointerId:event.pointerId,startX:event.clientX,startWidth:chatWidth};divider.setPointerCapture(event.pointerId);document.body.classList.add('is-resizing');});
divider.addEventListener('pointermove',event=>{if(resizeSession&&event.pointerId===resizeSession.pointerId)setChatWidth(resizeSession.startWidth+event.clientX-resizeSession.startX);});
function finishResize(){resizeSession=null;document.body.classList.remove('is-resizing');}
divider.addEventListener('pointerup',finishResize);divider.addEventListener('pointercancel',finishResize);divider.addEventListener('lostpointercapture',finishResize);
divider.addEventListener('keydown',event=>{let value=chatWidth;const bounds=resizeBounds();if(event.key==='ArrowLeft')value-=event.shiftKey?40:10;else if(event.key==='ArrowRight')value+=event.shiftKey?40:10;else if(event.key==='Home')value=bounds.min;else if(event.key==='End')value=bounds.max;else return;event.preventDefault();setChatWidth(value);});
new ResizeObserver(scheduleGeometry).observe(pane);window.addEventListener('resize',()=>{if(innerWidth>800)setChatWidth(chatWidth);else scheduleGeometry();});
if(document.documentElement.classList.contains('workspace-arriving')){if(reducedMotion.matches)document.documentElement.classList.remove('workspace-arriving');else preview.addEventListener('animationend',event=>{if(event.target===preview&&event.animationName==='workspace-arrive')document.documentElement.classList.remove('workspace-arriving');});}
setChatWidth(chatWidth);document.fonts.ready.then(()=>{updateGeometry();$('.workspace-header').classList.add('geometry-ready');});

return{setChatWidth,updateGeometry:scheduleGeometry};
})();
