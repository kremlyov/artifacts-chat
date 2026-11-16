'use strict';
window.ArtifactsVersions=(()=>{
  const base=new URL('.',document.currentScript.src),legacy=location.pathname.includes('/v1/');
  let dialog=document.querySelector('#settings-dialog');
  if(!dialog){
    dialog=document.createElement('dialog');dialog.id='settings-dialog';dialog.className='dialog settings-dialog';dialog.setAttribute('aria-labelledby','settings-title');
    dialog.innerHTML='<div class="dialog-heading"><h2 id="settings-title">Настройки</h2><button class="close-button" type="button" aria-label="Закрыть">×</button></div><button class="primary-button" type="button">Готово</button>';
    dialog.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
    document.body.append(dialog);
  }
  const field=document.createElement('fieldset');field.className='version-field';
  field.innerHTML='<legend>Версия интерфейса</legend><label class="version-choice"><input type="radio" name="interface-version" value="v2"><span>Версия 2<small>Новый лейаут, общая галерея</small></span></label><label class="version-choice"><input type="radio" name="interface-version" value="v1"><span>Версия 1<small>Сохранённая версия с лентой приложений</small></span></label>';
  field.querySelector(`[value="${legacy?'v1':'v2'}"]`).checked=true;
  dialog.querySelector('.dialog-heading').after(field);
  field.addEventListener('change',event=>{const state=document.body.dataset.flowState;const workspace=state?['revealing','workspace'].includes(state):location.pathname.endsWith('workspace.html');const path=(event.target.value==='v1'?'v1/':'')+(workspace?'workspace.html':'index.html');location.assign(new URL(path,base));});
  function open(){window.ArtifactsPrecise?.setEnabled(false);if(!dialog.open)dialog.showModal();}
  document.querySelectorAll('[data-open-settings]').forEach(button=>button.addEventListener('click',open));
  return{open};
})();
