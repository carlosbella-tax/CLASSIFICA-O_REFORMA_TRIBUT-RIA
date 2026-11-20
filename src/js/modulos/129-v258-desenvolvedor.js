/* V258 — Crédito fixo do desenvolvedor. O texto fica gravado no código da ferramenta: não existe tela,
   botão ou permissão de usuário que o altere ou remova. Se o bloco for apagado ou adulterado na página,
   ele é recolocado automaticamente. Só muda com a publicação de uma nova versão pelo administrador. */
(function(){
  if (window.V258_CARREGADO) return;
  const TEXTO='Desenvolvedor — Carlos Bella · +55 11 99479-7347';
  const HTML='<span>Desenvolvedor</span><b>Carlos Bella</b><a href="tel:+5511994797347">+55 11 99479-7347</a>';
  const st=document.createElement('style');st.id='v258-desenvolvedor-style';
  st.textContent='.v258-dev{display:block!important;visibility:visible!important;opacity:1!important;position:fixed;left:0;bottom:0;width:255px;box-sizing:border-box;z-index:16;margin:0;padding:8px 14px 10px;background:#0B2038;border-top:1px solid #ffffff2e;font:11px/1.45 system-ui,sans-serif;color:#C9D6E6;text-align:left}'
    +'.v258-dev span{display:block;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#8FA6C2}.v258-dev b{display:block;color:#fff;font-size:12px}.v258-dev a{color:#C9D6E6;text-decoration:none}'
    +'.v258-dev.claro{position:static;background:none;margin:10px 0 0;padding:8px 0 0;border-top:1px solid #dbe4ee;color:#4a5b6d;text-align:center}.v258-dev.claro span{color:#6b7c8d;display:inline;margin-right:6px}.v258-dev.claro b{display:inline;color:#0F2A4A;margin-right:6px}.v258-dev.claro a{color:#2456C8}'
    +'#v123-sidebar{padding-bottom:70px!important}@media(max-width:1000px){.v258-dev:not(.claro){display:none!important}}'
    +'@media print{.v258-dev{display:none!important}}';
  const LOCAIS=[['#v123-sidebar',''],['#v229-auth .v229-card','claro'],['#v235-admin-aba .v229-card','claro']];
  function garantir(){
    if(!document.getElementById('v258-desenvolvedor-style'))document.head.appendChild(st);
    for(const [sel,cls] of LOCAIS){
      const pai=document.querySelector(sel);if(!pai)continue;
      let el=[...pai.children].find(x=>x.classList&&x.classList.contains('v258-dev'));
      if(!el){el=document.createElement('div');pai.appendChild(el)}
      const classe='v258-dev'+(cls?' '+cls:'');
      if(el.className!==classe)el.className=classe;
      if(el.innerHTML!==HTML)el.innerHTML=HTML;
      if(el.hidden)el.hidden=false;
      if(el.getAttribute('style'))el.removeAttribute('style');
      if(el.getAttribute('data-v258')!==TEXTO)el.setAttribute('data-v258',TEXTO);
      if(pai.lastElementChild!==el)pai.appendChild(el);
    }
  }
  garantir();
  let agendado=false;
  new MutationObserver(()=>{if(agendado)return;agendado=true;Promise.resolve().then(()=>{agendado=false;garantir()})})
    .observe(document.documentElement,{childList:true,subtree:true,attributes:true,characterData:true,attributeFilter:['class','style','hidden']});
  setInterval(garantir,3000);
  Object.defineProperty(window,'classificadorV258',{value:Object.freeze({texto:TEXTO,garantir}),writable:false,configurable:false});
  Object.defineProperty(window,'V258_CARREGADO',{value:true,writable:false,configurable:false});
})();
