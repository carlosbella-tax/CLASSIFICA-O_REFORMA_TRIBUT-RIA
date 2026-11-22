/* V260 — Layout: menu lateral recolhível (faixa de ícones, escolha gravada no navegador), menu disponível
   também em janelas estreitas e faixa de indicadores no topo das telas de análise.
   Não altera dados nem cálculos: os indicadores só contam o que já está carregado. */
(function(){
  if (window.V260_CARREGADO) return;
  const side=document.getElementById('v123-sidebar');if(!side)return;
  const CHAVE='classificador.v260.menu';
  const P={consulta:'M11 4a7 7 0 105.2 11.7L20 20M11 8v6M8 11h6',documentos:'M12 16V4m0 0l-4 4m4-4l4 4M4 20h16',nfe:'M6 3h9l4 4v14H6zM9 12h7M9 16h7',nfse:'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
    cte:'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',ibs:'M4 20V10m6 10V4m6 16v-7m4 7H2',ncmanalise:'M4 6h16M4 12h16M4 18h10',
    apuracaocbs:'M5 4h14v16H5zM9 9h6M9 13h2m3 0h1M9 16h2m3 0h1',fornecedores:'M3 20V9l6-4v15m0 0h12V11l-6-3M13 14h4m-4 3h4',cnae:'M5 12l4 4L19 6',enquadramento:'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z',
    dashboard:'M4 13h7V4H4zm9 7h7v-9h-7zM4 20h7v-4H4zm9-13h7V4h-7z',padrao:'M12 8v5m0 3h.01M12 3a9 9 0 100 18 9 9 0 000-18z'};
  const icone=k=>'<svg class="v260-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(P[k]||P.padrao)+'"/></svg>';
  const st=document.createElement('style');st.id='v260-layout-style';st.textContent=`
#v123-sidebar,#v123-topbar,body{transition:width .16s,left .16s,padding-left .16s}
#v123-sidebar .v123-link{justify-content:flex-start!important}
#v123-sidebar .v123-link small{margin-left:auto!important}
.v260-ico{flex:none;width:17px;height:17px;margin-right:9px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:.9}
#v260-toggle{position:fixed;z-index:21;left:214px;top:26px;width:28px;height:28px;border:0;border-radius:7px;background:rgba(255,255,255,.14);color:#fff;font:700 16px/1 system-ui;cursor:pointer;padding:0;transition:left .16s}
#v260-toggle:hover{background:rgba(255,255,255,.26)}
body.v260-rec{padding-left:56px!important}
body.v260-rec #v123-sidebar{width:56px!important;display:block!important;overflow-x:hidden!important;padding-top:66px!important}
body.v260-rec #v123-topbar{left:56px!important}
body.v260-rec #v260-toggle{left:14px;transform:rotate(180deg)}
body.v260-rec .v123-header .brand,body.v260-rec #v123-sidebar .brand,body.v260-rec #v123-sidebar .v123-status,body.v260-rec #v123-sidebar .v229-counter,body.v260-rec #v123-sidebar .v229-logout,body.v260-rec #v123-sidebar .v255-densidade{display:none!important}
body.v260-rec #v123-sidebar #v140-audit-tool,body.v260-rec #v123-sidebar .v140-audit-tool,body.v260-rec #v123-sidebar .v123-status{display:none!important}
body.v260-rec #v123-sidebar > :not(.v123-link):not(.v258-dev):not(.v123-side-section){display:none!important}
body.v260-rec #v123-sidebar .v123-side-section{border:0!important;font-size:0!important;line-height:0!important;color:transparent!important;overflow:hidden!important;height:1px!important;min-height:0!important;margin:7px 12px!important;padding:0!important;background:rgba(255,255,255,.16)!important}
body.v260-rec #v123-sidebar .v123-link{justify-content:center!important;padding:10px 0!important}
body.v260-rec #v123-sidebar .v123-link .v260-txt{display:none!important}
body.v260-rec #v123-sidebar .v123-link small{display:none!important}
body.v260-rec #v123-sidebar .v260-ico{margin:0;width:19px;height:19px}
body.v260-rec .v258-dev:not(.claro){width:56px!important;padding:7px 2px 8px!important;text-align:center!important;display:block!important}
body.v260-rec .v258-dev:not(.claro) span,body.v260-rec .v258-dev:not(.claro) a{display:none!important}
body.v260-rec .v258-dev:not(.claro) b{font-size:9px!important;line-height:1.15!important}
#v260-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 12px}
#v260-kpis[hidden]{display:none!important}
.v260-kpi{background:#fff;border:1px solid #DCE3EE;border-top:3px solid #2456C8;border-radius:8px;padding:9px 12px}
.v260-kpi.alerta{border-top-color:#D97706}.v260-kpi.ok{border-top-color:#15803D}
.v260-kpi label{display:block;font:600 10px system-ui;color:#5B6B7C;text-transform:uppercase;letter-spacing:.05em}
.v260-kpi b{display:block;margin-top:2px;font:700 18px system-ui;color:#0F2A4A;font-variant-numeric:tabular-nums}
.v260-kpi small{font:11px system-ui;color:#5B6B7C}
@media print{#v260-toggle,#v260-kpis{display:none!important}}`;
  document.head.appendChild(st);

  /* ---------- menu recolhível ---------- */
  const estreita=()=>!!(window.matchMedia&&window.matchMedia('(max-width:1000px)').matches);
  const lerPref=()=>{try{return localStorage.getItem(CHAVE)==='recolhido'}catch(e){return false}};
  let recolhido=lerPref();
  const btn=document.createElement('button');btn.id='v260-toggle';btn.type='button';btn.textContent='‹';
  document.body.appendChild(btn);
  function aplicarMenu(){
    const rec=recolhido||estreita();
    document.body.classList.toggle('v260-rec',rec);
    btn.title=rec?'Expandir o menu':'Recolher o menu';btn.setAttribute('aria-label',btn.title);btn.setAttribute('aria-expanded',String(!rec));
    btn.hidden=estreita();
  }
  function alternar(){recolhido=!recolhido;try{localStorage.setItem(CHAVE,recolhido?'recolhido':'expandido')}catch(e){}aplicarMenu()}
  btn.onclick=alternar;
  function icones(){
    for(const l of side.querySelectorAll('.v123-link')){
      if(!l.querySelector(':scope > .v260-ico'))l.insertAdjacentHTML('afterbegin',icone(l.dataset.v123Key));
      /* o nome vai para um <span>, para sumir quando o menu está recolhido */
      for(const n of [...l.childNodes])if(n.nodeType===3&&n.textContent.trim()){const sp=document.createElement('span');sp.className='v260-txt';sp.textContent=n.textContent;l.replaceChild(sp,n)}
      const nome=[...l.querySelectorAll(':scope > .v260-txt')].map(n=>n.textContent).join(' ').trim();
      if(nome&&!l.classList.contains('v229-locked')&&l.title!==nome)l.title=nome;
      if(nome&&l.getAttribute('aria-label')!==nome)l.setAttribute('aria-label',nome);
    }
  }
  if(window.matchMedia){const mq=window.matchMedia('(max-width:1000px)');(mq.addEventListener?mq.addEventListener('change',aplicarMenu):mq.addListener&&mq.addListener(aplicarMenu))}

  /* ---------- indicadores no topo das telas de análise ---------- */
  const TELAS=['dashboard','fornecedores','ncm2','apuracaocbs','ibscbs'];
  const numero=v=>typeof num==='function'?num(v):(Number(v)||0);
  const dig=v=>String(v??'').replace(/\D/g,'');
  const real=v=>'R$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
  const inteiro=v=>new Intl.NumberFormat('pt-BR').format(v);
  function indicadores(itens){
    const docs=new Set,emit=new Set,ncms=new Set,rev=new Set,DIVERG=window.V254_DIVERGENCIAS_MOTOR_NCM;let valor=0;
    for(const r of itens||[]){
      docs.add(dig(r.chave_documento)||((r.numero_documento||'')+'|'+dig(r.emitente_cnpj_cpf)));
      const c=dig(r.emitente_cnpj_cpf);if(c)emit.add(c);
      const n=dig(r.ncm);if(n.length===8){ncms.add(n);if(DIVERG&&Object.prototype.hasOwnProperty.call(DIVERG,n))rev.add(n)}
      valor+=numero(r.valor_item);
    }
    return {documentos:docs.size,itens:(itens||[]).length,valor:Math.round(valor*100)/100,emitentes:emit.size,ncms:ncms.size,revisao:rev.size};
  }
  const kpis=document.createElement('div');kpis.id='v260-kpis';kpis.hidden=true;kpis.setAttribute('aria-label','Indicadores da carga atual');
  const wrap=document.querySelector('main.wrap');if(wrap)wrap.insertBefore(kpis,wrap.firstChild);
  let assinatura='';
  function renderKpis(){
    if(!wrap)return;
    const itens=(typeof state!=='undefined'&&state.items)||[];
    const ativo=document.querySelector('.panel.active');
    const mostrar=itens.length>0&&!!ativo&&TELAS.includes(ativo.id)&&!document.body.classList.contains('v219-modo-consulta');
    const ass=mostrar?itens.length+'|'+ativo.id:'';
    if(ass===assinatura&&kpis.hidden===!mostrar)return;
    assinatura=ass;kpis.hidden=!mostrar;if(!mostrar)return;
    const k=indicadores(itens);
    kpis.innerHTML='<div class="v260-kpi"><label>Documentos</label><b>'+inteiro(k.documentos)+'</b><small>'+inteiro(k.itens)+' item(ns)</small></div>'
      +'<div class="v260-kpi"><label>Valor dos itens</label><b>'+real(k.valor)+'</b><small>soma da carga atual</small></div>'
      +'<div class="v260-kpi"><label>Emitentes</label><b>'+inteiro(k.emitentes)+'</b><small>CNPJ/CPF distintos</small></div>'
      +'<div class="v260-kpi"><label>NCM distintos</label><b>'+inteiro(k.ncms)+'</b><small>códigos de 8 dígitos</small></div>'
      +'<div class="v260-kpi '+(k.revisao?'alerta':'ok')+'"><label>NCM em revisão</label><b>'+inteiro(k.revisao)+'</b><small>'+(k.revisao?'Motor × Classificador divergem':'nenhuma divergência com o Motor')+'</small></div>';
  }
  function atualizar(){icones();aplicarMenu();renderKpis()}
  atualizar();
  document.addEventListener('click',()=>setTimeout(atualizar,60));
  setInterval(atualizar,2000);
  window.classificadorV260={alternar,indicadores,atualizar,recolhido:()=>document.body.classList.contains('v260-rec')};
  window.V260_CARREGADO=true;
})();
