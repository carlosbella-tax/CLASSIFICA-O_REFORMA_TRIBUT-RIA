/* V255 — Padrão visual institucional aprovado em 20/11/2026: menu lateral azul-marinho, cores do Motor
   (#0F2A4A e #2456C8), cartões claros com borda de 1 px, tabelas densas com numerais tabulares,
   valores à direita e opção de linha compacta. Só altera a apresentação; não muda dados nem cálculos. */
(function(){
  const CHAVE='classificador.v255.densidade';
  const css=`
:root{--blue:#0F2A4A;--blue2:#2456C8;--bg:#F4F6FA;--line:#DCE3EE;--ink:#12263A;--ok:#15803D;--v255-mut:#5B6B7C;--v255-bad:#B91C1C}
body.v255{font-family:Inter,"Segoe UI",system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums;color:#12263A}
body.v255:not(.v219-modo-consulta){background:#F4F6FA}
body.v255 #v123-sidebar{background:#0F2A4A!important;border-right:0!important;box-shadow:none!important}
body.v255 #v123-sidebar .v123-side-section{color:rgba(255,255,255,.55)!important;font-size:10px!important;letter-spacing:.08em!important;text-transform:uppercase!important;margin:14px 0 4px!important;padding:0 14px!important}
body.v255 #v123-sidebar .v123-link{background:transparent!important;color:rgba(255,255,255,.86)!important;border:0!important;border-left:3px solid transparent!important;border-radius:0!important;box-shadow:none!important;margin:0!important;padding:7px 12px 7px 11px!important;font-size:13px!important;font-weight:500!important;width:100%!important;animation:none!important;transform:none!important;text-shadow:none!important}
body.v255 #v123-sidebar .v123-link:hover{background:rgba(255,255,255,.07)!important;color:#fff!important}
body.v255 #v123-sidebar .v123-link.active{background:rgba(255,255,255,.12)!important;border-left-color:#5B8DEF!important;color:#fff!important;font-weight:600!important}
body.v255 #v123-sidebar .v123-link small{background:rgba(255,255,255,.14)!important;color:#fff!important;border:0!important;box-shadow:none!important;animation:none!important}
body.v255 #v123-sidebar .v123-link.active small{background:#2456C8!important}
body.v255 #v123-sidebar .v123-link[aria-disabled="true"]{opacity:.45!important}
body.v255 #v123-sidebar .brand{border-radius:4px!important;box-shadow:none!important}
body.v255 #v123-sidebar #v140-audit-tool,body.v255 #v123-sidebar .v123-status{background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:4px!important;box-shadow:none!important}
body.v255 #v123-sidebar #v140-audit-tool,body.v255 #v123-sidebar #v140-audit-tool *,body.v255 #v123-sidebar .v123-status,body.v255 #v123-sidebar .v123-status *{color:rgba(255,255,255,.82)!important}
body.v255 .v255-densidade{margin:14px 12px 4px;display:flex;gap:6px;align-items:center;color:rgba(255,255,255,.6);font-size:11px}
body.v255 .v255-densidade button{font:inherit;font-size:11px;padding:3px 8px;border:1px solid rgba(255,255,255,.3);border-radius:3px;background:transparent;color:#fff;cursor:pointer;box-shadow:none;width:auto;margin:0}
body.v255 .v255-densidade button.on{background:#2456C8;border-color:#2456C8}
body.v255:not(.v219-modo-consulta) main .panel{background:#F4F6FA}
body.v255 main .card,body.v255 main .dashboard-card,body.v255 main .dashboard-metric,body.v255 main .v45-bar,body.v255 main .v168-card,body.v255 main .v168-parametros{border:1px solid #DCE3EE!important;border-radius:4px!important;box-shadow:none!important}
body.v255 main #v183-dashboard{background:#fff!important;color:#12263A!important}
body.v255 main #v183-dashboard .v183-bloco,body.v255 main #v183-dashboard .v183-grafico{background:#fff!important;color:#12263A!important;border:1px solid #DCE3EE!important;border-radius:4px!important}
body.v255 main #v183-dashboard :is(p,b,strong,small,span,li,label,div):not([class*="semaforo"]):not(table *){color:#12263A!important}
body.v255 main #v183-dashboard :is(h2,h3,h4){color:#0F2A4A!important}
body.v255 main .dashboard-hero{background:#0F2A4A!important;border-radius:4px!important}
body.v255 main h2,body.v255 main h3{color:#0F2A4A}
body.v255 main #v155-process{background:#2456C8!important;border-color:#2456C8!important;color:#fff!important;box-shadow:none!important}
body.v255 main button,body.v255 main select,body.v255 main input{border-radius:4px}
body.v255 main table{font-size:13px;line-height:1.4;border-collapse:collapse}
body.v255 main table th{background:#FAFBFD!important;color:#5B6B7C!important;font-size:11px;letter-spacing:.03em;border:0!important;border-bottom:1px solid #DCE3EE!important}
body.v255 main table td{border-left:0!important;border-right:0!important;border-top:0!important;border-bottom:1px solid #EDF1F6!important;padding-top:9px;padding-bottom:9px}
body.v255 main table tbody tr:nth-child(even) td{background-image:none}
body.v255 main table tbody tr:hover td{background-color:#F4F7FD}
body.v255 main .table-wrap{border:1px solid #DCE3EE;border-radius:4px}
body.v255.v255-compacta main table td{padding-top:4px;padding-bottom:4px}
body.v255.v255-compacta main table th{padding-top:5px;padding-bottom:5px}
`;
  const estilo=document.createElement('style');estilo.id='v255-design';estilo.textContent=css;
  const ler=()=>{try{return localStorage.getItem(CHAVE)==='compacta'}catch(e){return false}};
  function densidade(compacta,gravar){
    document.body.classList.toggle('v255-compacta',!!compacta);
    document.querySelectorAll('.v255-densidade button').forEach(b=>b.classList.toggle('on',(b.dataset.v255==='compacta')===!!compacta));
    if(gravar)try{localStorage.setItem(CHAVE,compacta?'compacta':'padrao')}catch(e){}
  }
  function controle(){
    const side=document.getElementById('v123-sidebar');if(!side||side.querySelector('.v255-densidade'))return;
    const d=document.createElement('div');d.className='v255-densidade';d.setAttribute('role','group');d.setAttribute('aria-label','Altura das linhas das tabelas');
    d.innerHTML='<span>Linhas</span><button type="button" data-v255="padrao">Padrão</button><button type="button" data-v255="compacta">Compacta</button>';
    d.addEventListener('click',e=>{const b=e.target.closest('button[data-v255]');if(b)densidade(b.dataset.v255==='compacta',true)});
    side.appendChild(d);densidade(ler(),false);
  }
  /* Valores à direita: marca, por tabela, as colunas cujas primeiras linhas são numéricas (R$, % ou número). */
  const numerico=t=>/^(R\$\s*)?-?\(?\d[\d.]*(,\d+)?\)?\s*%?$/.test(t)&&!/^\d{5,}$/.test(t)&&!/^\d{2}\.\d{3}\.\d{3}/.test(t)&&!/^\d{4}\.\d{2}\.\d{2}$/.test(t);
  let seq=0;const regras=document.createElement('style');regras.id='v255-colunas';const mapa=new Map;
  function alinhar(){
    const painel=document.querySelector('main .panel.active')||document.querySelector('main');if(!painel)return;
    let mudou=false;
    painel.querySelectorAll('table').forEach(tb=>{
      const linhas=[...tb.querySelectorAll('tbody tr')].filter(r=>r.cells.length>1&&!r.querySelector('td[colspan]')).slice(0,6);if(!linhas.length)return;
      const n=linhas[0].cells.length,cols=[];
      for(let c=0;c<n;c++){let num=0,tot=0;for(const r of linhas){const t=(r.cells[c]?.textContent||'').trim();if(!t||t==='—'||t==='-')continue;tot++;if(numerico(t))num++}if(tot&&num===tot)cols.push(c+1)}
      if(!tb.dataset.v255Id)tb.dataset.v255Id=String(++seq);
      const assinatura=cols.join(',');if(mapa.get(tb.dataset.v255Id)===assinatura)return;mapa.set(tb.dataset.v255Id,assinatura);mudou=true;
    });
    if(mudou)regras.textContent=[...mapa].filter(([,c])=>c).map(([id,c])=>c.split(',').map(i=>'body.v255 main table[data-v255-id="'+id+'"] :is(td,th):nth-child('+i+')').join(',')+'{text-align:right}').join('\n');
  }
  function iniciar(){
    if(!document.body)return;document.body.classList.add('v255');
    document.head.appendChild(estilo);document.head.appendChild(regras);controle();alinhar();
  }
  iniciar();
  document.addEventListener('DOMContentLoaded',iniciar);window.addEventListener('load',()=>{document.head.appendChild(estilo);controle();alinhar()});
  setInterval(()=>{controle();alinhar()},1500);
  window.classificadorV255Densidade=densidade;window.classificadorV255Alinhar=alinhar;window.classificadorV255Numerico=numerico;
  window.V255_CARREGADO=true;
})();
