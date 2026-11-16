'use strict';
window.ArtifactsPrecise=(()=>{
  const preview=document.querySelector('.application-preview'),toggle=document.querySelector('#precise-control');
  const layer=document.querySelector('#precise-layer'),surface=layer.querySelector('.precise-surface');
  const hoverOutline=layer.querySelector('.precise-hover'),selectedOutline=layer.querySelector('.precise-selected');
  const pin=layer.querySelector('.precise-pin'),composer=layer.querySelector('.precise-composer');
  const input=layer.querySelector('.precise-input'),announcement=layer.querySelector('.precise-announcement');
  const targets='button,p,h1,h2,h3,.translator-logo,.translator-download,.ai-artwork,.promo-cat-one,.promo-cat-two,.translation-source,.translation-promo,.translator-ai-input,.language-selector,.translator-ai,.translation-section,.translator-navigation';
  let enabled=false,hovered=null,selected=null,pointer=null,frame=0;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function bounds(){
    const rect=preview.getBoundingClientRect(),viewport=window.visualViewport;
    const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0;
    return{left:Math.max(left,rect.left),top:Math.max(top,rect.top),right:Math.min(left+(viewport?.width||innerWidth),rect.right),bottom:Math.min(top+(viewport?.height||innerHeight),rect.bottom)};
  }
  function pick(x,y){
    const element=document.elementsFromPoint(x,y).find(node=>node!==preview&&preview.contains(node));
    const target=element?.closest(targets);
    return target&&preview.contains(target)?target:null;
  }
  function place(element,rect){
    element.style.left=`${rect.left}px`;element.style.top=`${rect.top}px`;
    element.style.width=`${Math.max(0,rect.right-rect.left)}px`;element.style.height=`${Math.max(0,rect.bottom-rect.top)}px`;
  }
  function outline(element,target,view){
    if(!target?.isConnected){element.hidden=true;return;}
    const rect=target.getBoundingClientRect();
    const clipped={left:Math.max(rect.left,view.left),top:Math.max(rect.top,view.top),right:Math.min(rect.right,view.right),bottom:Math.min(rect.bottom,view.bottom)};
    element.hidden=clipped.right<=clipped.left||clipped.bottom<=clipped.top;
    if(element.hidden)return;
    place(element,clipped);element.style.borderRadius=getComputedStyle(target).borderRadius==='0px'?'6px':getComputedStyle(target).borderRadius;
  }
  function hideAnnotation(){pin.hidden=true;composer.hidden=true;selectedOutline.hidden=true;}
  function paint(){
    frame=0;if(!enabled)return;
    const view=bounds();place(surface,view);
    if(pointer)hovered=pick(pointer.x,pointer.y);
    outline(hoverOutline,hovered===selected?.element?null:hovered,view);
    if(!selected?.element.isConnected){hideAnnotation();return;}
    outline(selectedOutline,selected.element,view);
    const rect=selected.element.getBoundingClientRect(),x=rect.left+rect.width*selected.x,y=rect.top+rect.height*selected.y;
    if(x<view.left||x>view.right||y<view.top||y>view.bottom||view.right-view.left<48||view.bottom-view.top<124){pin.hidden=true;composer.hidden=true;return;}
    pin.hidden=false;composer.hidden=false;pin.style.left=`${x}px`;pin.style.top=`${y}px`;
    const width=Math.min(296,view.right-view.left-24);composer.style.width=`${width}px`;
    const height=composer.offsetHeight,minLeft=view.left+12,maxLeft=view.right-width-12,minTop=view.top+12,maxTop=view.bottom-height-12;
    let left=x+24,top=y-26;
    if(left>maxLeft){
      if(x-24-width>=minLeft)left=x-24-width;
      else{left=clamp(x-width/2,minLeft,maxLeft);top=y+24;if(top>maxTop)top=y-height-24;}
    }
    composer.style.left=`${clamp(left,minLeft,maxLeft)}px`;composer.style.top=`${clamp(top,minTop,maxTop)}px`;
  }
  function schedule(){if(enabled&&!frame)frame=requestAnimationFrame(paint);}
  function setEnabled(value){
    enabled=!!value;toggle.setAttribute('aria-pressed',String(enabled));document.body.classList.toggle('precise-mode',enabled);layer.hidden=!enabled;
    hovered=null;selected=null;pointer=null;input.value='';hoverOutline.hidden=true;hideAnnotation();
    announcement.textContent=enabled?'Выберите элемент приложения для точечной правки.':'';
    if(enabled)paint();else{cancelAnimationFrame(frame);frame=0;}
  }
  toggle.addEventListener('click',()=>setEnabled(!enabled));
  surface.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};schedule();});
  surface.addEventListener('pointerleave',()=>{pointer=null;hovered=null;hoverOutline.hidden=true;});
  surface.addEventListener('click',event=>{
    if(!enabled||event.button!==0)return;
    const element=pick(event.clientX,event.clientY);if(!element)return;
    event.preventDefault();const rect=element.getBoundingClientRect();
    selected={element,x:clamp((event.clientX-rect.left)/rect.width,0,1),y:clamp((event.clientY-rect.top)/rect.height,0,1)};
    input.value='';hovered=null;pointer=null;paint();
    const label=element.getAttribute('aria-label')||element.textContent.trim().replace(/\s+/g,' ').slice(0,100)||'элемент приложения';
    announcement.textContent=`Точка 1. Выбран элемент: ${label}.`;input.focus({preventScroll:true});
  });
  layer.addEventListener('wheel',event=>{
    if(!enabled||event.ctrlKey||event.target===input)return;
    const unit=event.deltaMode===1?16:event.deltaMode===2?preview.clientHeight:1;
    const top=preview.scrollTop,left=preview.scrollLeft;
    preview.scrollBy({top:event.deltaY*unit,left:event.deltaX*unit,behavior:'instant'});
    if(preview.scrollTop!==top||preview.scrollLeft!==left)event.preventDefault();
    schedule();
  },{passive:false});
  composer.addEventListener('submit',event=>event.preventDefault());
  document.addEventListener('keydown',event=>{if(enabled&&event.key==='Escape'){event.preventDefault();setEnabled(false);toggle.focus({preventScroll:true});}});
  preview.addEventListener('scroll',schedule,{passive:true});window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  new ResizeObserver(schedule).observe(preview);
  return{setEnabled};
})();
