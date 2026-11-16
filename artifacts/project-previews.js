'use strict';
window.ArtifactsPreviews=(()=>{
  function image(file){const img=document.createElement('img');img.src=`assets/${file}`;img.alt='';img.decoding='async';return img;}
  function createProjectCard(project,{disabled=false}={}){
    const button=document.createElement('button');button.className='app-card';button.type='button';button.dataset.app=project.id;button.disabled=disabled;button.setAttribute('aria-label',`Открыть ${project.title}`);
    const picture=document.createElement('div');picture.className='sidebar-image';
    const layers=[{file:'395af.png',className:''}];
    if(project.variant===1)layers.push({file:'dde3e.png',className:'tennis-layer'});
    else{
      if(project.variant>=2&&project.variant!==6)layers.push({file:'96c9e.png',className:'layer-2'});
      if(project.variant>=3&&project.variant!==6)layers.push({file:'af563.png',className:'layer-3'});
      if(project.variant===0)layers.push({file:'96c9e.png',className:'layer-2'},{file:'af563.png',className:'layer-3'},{file:'395af.png',className:''});
      if(project.variant>=3&&project.variant!==6)layers.push({file:'ae92f.png',className:'layer-4'});
      if(project.variant>=4&&project.variant!==6)layers.push({file:'05ec8.png',className:'layer-5'});
    }
    for(const layer of layers){const div=document.createElement('div');div.className=`sidebar-layer ${layer.className}`;div.append(image(layer.file));picture.append(div);}
    const fade=document.createElement('div');fade.className='card-fade';const title=document.createElement('span');title.className='card-title';title.textContent=project.title;
    button.append(picture,fade,title);return button;
  }
  function updateStack(scroller,enabled){
    scroller.dataset.effect=enabled?'on':'off';
    const track=scroller.querySelector('.stack-track'),style=getComputedStyle(track);
    const topInset=parseFloat(style.paddingTop),bottomInset=parseFloat(style.paddingBottom),gap=parseFloat(style.rowGap);
    [...track.querySelectorAll('.app-card')].forEach((card,index)=>{
      if(!enabled){card.style.transform='none';card.style.opacity='1';card.style.zIndex='auto';card.style.visibility='visible';card.style.pointerEvents='';card.inert=false;return;}
      const height=card.offsetHeight,step=height+gap,naturalTop=topInset+index*step-scroller.scrollTop;
      const bottomEdge=Math.max(topInset,scroller.clientHeight-bottomInset-height);
      const distance=naturalTop<topInset?topInset-naturalTop:Math.max(0,naturalTop-bottomEdge),progress=Math.min(1,distance/(height*.85));
      card.style.transform=`scale(${1-progress*.08})`;card.style.opacity=String(Math.pow(1-progress,1.8));
      card.style.zIndex=String(naturalTop<topInset?100+index:naturalTop>bottomEdge?100-index:1000);
      card.style.visibility='visible';card.style.pointerEvents=progress>=1?'none':'';card.inert=progress>=1;
    });
  }
  return{createProjectCard,updateStack};
})();
