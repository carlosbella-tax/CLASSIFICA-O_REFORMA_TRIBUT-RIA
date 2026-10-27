  /* =====================================================================
     V123 — Interface em painel: barra lateral, consultas NCM/NBS e
     indicadores de documentos, preservando o processamento local existente.
     ===================================================================== */
  (function(){
    const tabs = document.querySelector('.tabs');
    const header = document.querySelector('header');
    if (!tabs || !header || document.getElementById('v123-sidebar')) return;

    const css = `
      :root{--v123-navy:#0e3657;--v123-blue:#0e5b91;--v123-orange:#f26a21;--v123-bg:#eef3f7;--v123-line:#d7e2eb}
      body{background:var(--v123-bg);padding-left:255px;min-height:100vh}
      .v3-notice{display:none} header.v123-header{min-height:0;padding:78px 28px 14px;background:#fff;color:#183a5b;border-bottom:1px solid var(--v123-line);box-shadow:none}
      .v123-header .brand{position:fixed;z-index:20;left:20px;top:26px;text-align:left;margin:0;font:700 27px Georgia,serif;color:#fff}.v123-header .brand .tax{color:#fff}.v123-header .brand .advice{color:#f26a21}.v123-header .brand .tagline{width:auto;min-width:0;border:0;margin:3px 0 0;padding:0;color:#91b9d5;font:500 12px system-ui;letter-spacing:0}
      .v123-header .header-grid{display:block;max-width:none}.v123-header .diagnostic-title{display:none}.v123-header .header-grid>div:first-child>p{display:none}.v123-header .process-fields{position:absolute;right:28px;top:124px;display:flex;gap:14px}.v123-header .process-fields .field-label{color:#5c7185;min-width:185px}.v123-header .company-fields{max-width:none;margin:0;grid-template-columns:1.35fr 1.35fr 1.25fr .9fr 1.8fr;gap:15px}.v123-header .field-label{color:#5c7185;font-size:12px}.v123-header .field-label input,.v123-header .field-label select{border-color:#d6e1ea;border-radius:7px;background:#fff;color:#324b60;padding:10px}.v123-header .company-fields .field-label:last-child:after{content:'Atividades secundárias: informe um CNAE por linha';font-size:11px;color:#7b8c9d;display:none}
      .tabs{display:none!important}.panel{padding:24px 29px 32px;max-width:none}.panel .card{border:1px solid var(--v123-line);border-radius:9px;box-shadow:0 1px 3px #173b5412}.panel.active{display:block}.panel h2{color:#173f64}
      #v123-sidebar{position:fixed;z-index:15;left:0;top:0;bottom:0;width:255px;background:#0c3556;color:#fff;overflow:auto;padding-top:116px;box-shadow:2px 0 8px #0b2f4b2e}.v123-side-section{padding:0 21px 13px;color:#7eafcf;font-size:11px;font-weight:800;letter-spacing:.3px;text-transform:uppercase}.v123-link{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;border:0;background:transparent;color:#eef7ff;text-align:left;padding:9px 20px;font:700 14px system-ui;cursor:pointer}.v123-link:hover,.v123-link.active{background:#164b72}.v123-link small{display:inline-block;min-width:23px;padding:2px 7px;border-radius:999px;text-align:center;background:#285879;color:#dceefa;font-size:11px}.v123-status{position:absolute;left:13px;right:13px;bottom:15px;border:1px solid #285674;border-radius:9px;padding:13px;background:#123f62;color:#b9d2e4;font-size:12px;line-height:1.55}.v123-status strong{color:#fff;display:block;font-size:13px}
      #v123-topbar{position:fixed;z-index:14;left:255px;right:0;top:0;height:76px;background:#fff;border-bottom:1px solid var(--v123-line);display:flex;align-items:center;gap:22px;padding:0 29px}.v123-page-title{font-size:21px;font-weight:800;color:#143e62;white-space:nowrap}.v123-searches{margin-left:auto;display:flex;gap:10px;align-items:center}.v123-query{display:flex;border:1px solid #b8cddd;border-radius:7px;overflow:hidden;height:41px;background:#fff}.v123-query b{display:flex;align-items:center;padding:0 12px;background:#17649b;color:#fff;font-size:12px}.v123-query input{border:0;min-width:210px;padding:0 12px;color:#35546c;font:13px system-ui}.v123-query input:focus{outline:2px solid #86c4e8;outline-offset:-2px}.v123-query button{border:0;background:#154f7a;color:#fff;padding:0 14px;font-weight:800;cursor:pointer}.v123-clear{border:0;border-radius:7px;background:var(--v123-orange);color:#fff;height:41px;padding:0 16px;font-weight:800;cursor:pointer}
      .v123-section-title{margin:-1px 0 16px;padding:15px 19px;border:1px solid #d6e8f2;border-radius:9px 9px 0 0;background:linear-gradient(90deg,#fff,#edf9ff);font-size:19px;font-weight:800;color:#184a70}.v123-section-title:before{content:'';display:inline-block;width:5px;height:23px;vertical-align:-5px;background:var(--v123-orange);border-radius:3px;margin-right:10px}.v123-action{position:absolute;right:30px;top:10px;background:#145581!important;color:#fff!important}.v123-header-note{display:none}
      @media(max-width:1000px){body{padding-left:0}#v123-sidebar{display:none}#v123-topbar{left:0}.v123-header .brand{display:none}.v123-header .company-fields{grid-template-columns:1fr 1fr}.v123-header .process-fields{position:static;margin-top:12px}.v123-searches{display:none}}
    `;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    const links = [
      ['Consulta','Consulta NCM e NBS','items','consulta'],['Documentos','Carregar documentos','load','documentos'],
      ['','NF-e — Modelo 55','items','nfe'],['','NFS-e — Notas de serviço','iss','nfse'],['','CT-e — Transporte','items','cte'],
      ['Análise','Base de IBS/CBS','ibscbs','ibs'],['','Validação de atividades (CNAE)','dashboard','cnae'],['','Enquadramento recomendado','observacoes','enquadramento'],
      ['Painéis','Dashboard','dashboard','dashboard']
    ];
    const side = document.createElement('aside'); side.id = 'v123-sidebar';
    let sideHtml = '', last = null;
    for (const [sec,label,tab,key] of links) {
      if (sec && sec !== last) { sideHtml += '<div class="v123-side-section">' + sec + '</div>'; last = sec; }
      sideHtml += '<button class="v123-link" data-v123-tab="' + tab + '" data-v123-key="' + key + '">' + label + '<small data-v123-count="' + key + '">0</small></button>';
    }
    side.innerHTML = sideHtml + '<div class="v123-status"><strong id="v123-lote">0 arquivo(s) carregado(s)</strong><span id="v123-docs">0 documento(s) · 0 item(ns)</span><br>Modelo oficial · Versão 123<br>atualizado em 27/10/2026</div>';
    document.body.insertBefore(side, document.body.firstChild);

    const top = document.createElement('div'); top.id = 'v123-topbar';
    top.innerHTML = '<div class="v123-page-title" id="v123-title">Carregar documentos</div><div class="v123-searches"><div class="v123-query"><b>NBS</b><input id="v123-nbs" placeholder="Código da NBS ou nome do serviço"><button data-v123-consulta="nbs">Consultar</button></div><div class="v123-query"><b>NCM</b><input id="v123-ncm" placeholder="Código da NCM — ex.: 0101"><button data-v123-consulta="ncm">Consultar</button></div><button class="v123-clear" id="v123-clear">Limpar</button></div>';
    document.body.insertBefore(top, header); header.classList.add('v123-header');

    const titles = {load:'Carregar documentos',processar:'Processamento do lote',items:'Consulta NCM e NBS',iss:'NFS-e — Notas de serviço',icms:'NF-e — Modelo 55',icmsst:'ICMS ST',ipi:'IPI',piscofins:'PIS e COFINS',ibscbs:'Base de IBS/CBS',events:'Eventos fiscais',dashboard:'Painel de análise fiscal',observacoes:'Enquadramento recomendado'};
    const ativar = tab => { const original = document.querySelector('.tab[data-tab="' + tab + '"]'); if (original) original.click(); document.getElementById('v123-title').textContent = titles[tab] || 'Classificação tributária'; document.querySelectorAll('.v123-link').forEach(b => b.classList.toggle('active', b.dataset.v123Tab === tab)); };
    side.addEventListener('click', e => { const b = e.target.closest('[data-v123-tab]'); if (b) ativar(b.dataset.v123Tab); });
    const limpar = () => { document.getElementById('v123-nbs').value=''; document.getElementById('v123-ncm').value=''; };
    document.getElementById('v123-clear').onclick = limpar;
    top.addEventListener('click', e => { const b=e.target.closest('[data-v123-consulta]'); if (!b) return; const tipo=b.dataset.v123Consulta, termo=document.getElementById('v123-'+tipo).value.trim(); ativar(tipo === 'nbs' ? 'iss' : 'items'); const info=document.getElementById(tipo === 'nbs' ? 'issInfo' : 'tableInfo'); if (info && termo) info.textContent='Consulta solicitada: ' + tipo.toUpperCase() + ' ' + termo + '. Use os filtros da tabela para refinar o resultado.'; });
    const atualizar = () => { const s = typeof state === 'undefined' ? {} : state; const arquivos=(s.files||[]).length, docs=(s.docs||[]).length, itens=(s.items||[]).length; const a=document.getElementById('v123-lote'), d=document.getElementById('v123-docs'); if(a)a.textContent=arquivos+' arquivo(s) carregado(s)'; if(d)d.textContent=docs+' documento(s) · '+itens+' item(ns)'; for(const k of ['nfe','nfse','cte','ibs','cnae','enquadramento','dashboard','consulta','documentos']) { const e=side.querySelector('[data-v123-count="'+k+'"]'); if(e)e.textContent=(k==='nfe'?docs:k==='ibs'?itens:0); } };
    const antigo = window.atualizarBadgesTributos; if (typeof antigo === 'function') window.atualizarBadgesTributos = function(){ const r=antigo.apply(this,arguments); atualizar(); return r; };
    atualizar(); ativar('load');
  })();
