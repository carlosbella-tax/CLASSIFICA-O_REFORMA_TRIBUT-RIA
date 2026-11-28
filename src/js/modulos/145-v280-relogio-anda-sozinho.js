/* V280 — Relógio do tempo de processamento anda sozinho pela tela: enquanto está visível, desliza devagar
   e rebate nas bordas da janela, sem precisar ser arrastado. Arrastar continua valendo (V262): ao soltar,
   ele segue andando a partir do ponto em que foi deixado. Duplo clique para o relógio no canto; outro
   duplo clique solta de novo. Não altera a contagem do tempo (V155) nem dados. */
(function(){
  if (window.V280_CARREGADO) return;
  const relogio=document.getElementById('v155-timer');if(!relogio)return;
  const MARGEM=6,VEL={x:34,y:22};   /* pixels por segundo */
  const TITULO='O relógio anda sozinho pela tela. Arraste para mudar de lugar. Duplo clique: para no canto; outro duplo clique: volta a andar.';
  const st=document.createElement('style');st.id='v280-relogio-style';
  st.textContent='#v155-timer{will-change:left,top}#v155-timer.v280-parado{border-style:dashed!important}';
  document.head.appendChild(st);
  relogio.title=TITULO;relogio.setAttribute('aria-label','Tempo de processamento — anda sozinho pela tela; arraste ou use as setas para mover');
  let x=0,y=0,dx=-1,dy=-1,ultL=null,ultT=null,parado=false,antes=0;
  const area=()=>({w:window.innerWidth||document.documentElement.clientWidth||0,h:window.innerHeight||document.documentElement.clientHeight||0});
  const tamanho=()=>{const r=relogio.getBoundingClientRect();return {l:r.width||194,a:r.height||150}};
  const limites=()=>{const a=area(),t=tamanho();return {x:Math.max(MARGEM,a.w-t.l-MARGEM),y:Math.max(MARGEM,a.h-t.a-MARGEM)}};
  /* outro módulo (arrastar, setas, volta ao canto) mudou o lugar: segue a partir de onde o relógio está */
  function sincronizar(){const r=relogio.getBoundingClientRect();x=r.left;y=r.top}
  function escrever(){ultL=x.toFixed(1)+'px';ultT=y.toFixed(1)+'px';relogio.classList.add('v262-movido');relogio.style.left=ultL;relogio.style.top=ultT}
  const livre=()=>!relogio.hidden&&!parado&&!relogio.classList.contains('v262-arrastando');
  /* um passo do movimento, com o tempo decorrido em segundos; devolve false quando o relógio não deve andar */
  function passo(dt){
    if(!livre())return false;
    if(relogio.style.left!==ultL||relogio.style.top!==ultT)sincronizar();
    const m=limites();
    x+=dx*VEL.x*dt;y+=dy*VEL.y*dt;
    if(x<=MARGEM){x=MARGEM;dx=1}else if(x>=m.x){x=m.x;dx=-1}
    if(y<=MARGEM){y=MARGEM;dy=1}else if(y>=m.y){y=m.y;dy=-1}
    escrever();return true;
  }
  function parar(v){
    parado=v===undefined?!parado:!!v;relogio.classList.toggle('v280-parado',parado);
    const em=relogio.querySelector('#v269-alca em');if(em)em.textContent=parado?'relógio parado':'arraste para mover';
    return parado;
  }
  /* ao redimensionar a janela a V262 recoloca o relógio no ponto gravado; aqui ele continua de onde estava, dentro da nova área */
  window.addEventListener('resize',()=>{if(!livre()||ultL===null)return;const m=limites();x=Math.min(Math.max(MARGEM,x),m.x);y=Math.min(Math.max(MARGEM,y),m.y);escrever()});
  /* registrado depois do duplo clique da V262, que devolve o relógio ao canto */
  relogio.addEventListener('dblclick',()=>parar());
  const quadro=window.requestAnimationFrame?window.requestAnimationFrame.bind(window):f=>setTimeout(()=>f(Date.now()),16);
  function laco(agora){
    /* quadros muito espaçados (aba em segundo plano) não fazem o relógio saltar */
    const dt=antes?Math.min((agora-antes)/1000,0.1):0;antes=agora;
    if(dt>0)passo(dt);
    quadro(laco);
  }
  quadro(laco);
  window.classificadorV280={passo,parar,VEL,MARGEM,estado:()=>({x,y,dx,dy,parado,andando:livre()})};
  window.V280_CARREGADO=true;
})();
