/* V269 — Relógio do processamento visivelmente flutuante: ganha uma alça "arraste para mover", sombra de
   janela solta e fica acima das demais camadas. O reinício do cronômetro a cada novo processamento está
   no módulo V155. Não altera dados. */
(function(){
  if (window.V269_CARREGADO) return;
  const relogio=document.getElementById('v155-timer');if(!relogio)return;
  const st=document.createElement('style');st.id='v269-relogio-style';
  st.textContent='#v155-timer{z-index:2147483000!important;box-shadow:0 18px 40px #000a,0 2px 6px #0006!important;padding-top:6px!important}#v269-alca{display:flex;align-items:center;justify-content:center;gap:6px;margin:0 -8px 6px;padding:2px 0 4px;border-bottom:1px solid #ffffff22;color:#d8d3c8;font:600 10px system-ui;letter-spacing:.04em;text-transform:uppercase;cursor:grab}#v269-alca em{font-style:normal}#v269-alca i{display:inline-block;width:18px;height:8px;background:radial-gradient(circle,#ff761c 1.2px,transparent 1.6px) 0 0/6px 4px}#v155-timer.v262-arrastando #v269-alca{cursor:grabbing}';
  document.head.appendChild(st);
  const alca=document.createElement('div');alca.id='v269-alca';alca.innerHTML='<i></i><em>arraste para mover</em><i></i>';
  relogio.insertBefore(alca,relogio.firstChild);
  window.V269_CARREGADO=true;
})();
