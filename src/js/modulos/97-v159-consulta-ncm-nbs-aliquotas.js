/* V159 — Resultado individual de NCM/NBS com enquadramento, alíquotas e consulta oficial do anexo. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const percentual=v=>{const n=Number(String(v??'').replace('%','').replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>v===null?'—':v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
  const campo=(titulo,valor)=>'<div class="v159-field"><span>'+esc(titulo)+'</span><strong>'+esc(valor)+'</strong></div>';
  const anexoOficial=anexo=>{const m=String(anexo||'').match(/Anexo\s+([IVXLCDM]+)/i);if(!m)return '';const alvo='ANEXO '+m[1].toUpperCase();return LC214+'#:~:text='+encodeURIComponent(alvo)};
  const reducaoNcm=ref=>{const texto=String(ref?.observacao||'');const m=texto.match(/redução de\s*(\d+(?:[,.]\d+)?)%/i);if(m)return percentual(m[1]);return String(ref?.cst||'')==='000'?0:null};
  /* V164 — o título da seção precede os cartões após a montagem da navegação atual. */
  const destino=()=>document.querySelector('#items .card');
  function calcular(panel){
    const ibs=percentual(panel.querySelector('[data-v159="ibs"]')?.value);
    const cbs=percentual(panel.querySelector('[data-v159="cbs"]')?.value);
    const reducao=percentual(panel.querySelector('[data-v159="reducao"]')?.value);
    const fator=reducao===null?null:Math.max(0,1-reducao/100);
    panel.querySelector('[data-v159-final="ibs"]').textContent=ibs===null||fator===null?'Informe a alíquota e a redução':fmt(ibs*fator);
    panel.querySelector('[data-v159-final="cbs"]').textContent=cbs===null||fator===null?'Informe a alíquota e a redução':fmt(cbs*fator);
  }
  function dadosNbs(termo){
    const lote=(window.classificadorLoteNcmNbs||[]).find(x=>x.tipo==='NBS'&&String(x.codigo||'').replace(/\D/g,'')===String(termo).replace(/\D/g,''));
    return {codigo:termo,descricao:lote?.descricao||'Descrição do serviço deve ser confirmada no documento.',cst:lote?.cst_sugerido||'A confirmar',cclass:lote?.cclasstrib_sugerida||'A confirmar',anexo:lote?.anexo||'Sem anexo confirmado — base oficial NBS não embarcada',reducao:percentual(lote?.reducao_sugerida),situacao:lote?'REFERÊNCIA LOCALIZADA NA PLANILHA — confirmar enquadramento legal.':'ANÁLISE NECESSÁRIA — não há base oficial NBS embarcada para validação conclusiva.'};
  }
  function render(tipo,termo){
    const card=destino();if(!card||!termo)return;
    document.querySelector('.tab[data-tab="items"]')?.click();
    const ref=tipo==='ncm'&&typeof window.classificadorReferenciaNcm==='function'?window.classificadorReferenciaNcm(termo):null;
    const encontrado=!!(ref?.descricao&&!/^NCM não/i.test(ref.descricao));
    const dados=tipo==='ncm'?{codigo:ref?.codigo||termo,descricao:ref?.descricao||'NCM não localizada na base embarcada.',cst:ref?.cst||'A confirmar',cclass:ref?.cclasstrib||'A confirmar',anexo:ref?.anexo||'Sem anexo candidato identificado',reducao:reducaoNcm(ref),situacao:encontrado?'VALIDADO — NCM localizada na referência TIPI e correlação embarcada.':'ANÁLISE NECESSÁRIA — NCM não localizada na referência embarcada.'}:dadosNbs(termo);
    const url=tipo==='ncm'&&encontrado?anexoOficial(dados.anexo):'';
    let panel=document.getElementById('v153-result');
    if(!panel){panel=document.createElement('section');panel.id='v153-result';panel.className='v153-result';card.insertAdjacentElement('afterend',panel)}
    panel.classList.add('v159-result');
    const reducao=dados.reducao===null?'':String(dados.reducao).replace('.',',');
    panel.innerHTML='<div class="v153-head"><h2>Resultado da validação — <b>'+tipo.toUpperCase()+'</b></h2><button class="v153-print" type="button">Imprimir em PDF</button></div><div class="v159-status '+(encontrado?'ok':'review')+'">'+esc(dados.situacao)+'</div><div class="v153-grid v159-grid">'+campo('Código '+tipo.toUpperCase(),dados.codigo)+campo('Descrição',dados.descricao)+campo('CST de referência',dados.cst)+campo('cClassTrib de referência',dados.cclass)+'<div class="v159-field"><span>Redução aplicável</span><strong><input data-v159="reducao" inputmode="decimal" value="'+esc(reducao)+'" placeholder="A confirmar"> <em>%</em></strong></div>'+'<div class="v159-field"><span>Anexo / enquadramento</span><strong>'+(url?'<a class="v159-link" href="'+url+'" target="_blank" rel="noopener">'+esc(dados.anexo)+'</a>':esc(dados.anexo))+'</strong></div></div><div class="v159-calc"><h3>Alíquotas e cálculo final</h3><p>Referência de transição de 2026. Confirme a competência e edite quando necessário.</p><div class="v159-calc-grid"><label>Alíquota IBS<input data-v159="ibs" inputmode="decimal" value="0,10">%</label><label>Alíquota CBS<input data-v159="cbs" inputmode="decimal" value="0,90">%</label><div><span>Alíquota final IBS</span><strong data-v159-final="ibs"></strong></div><div><span>Alíquota final CBS</span><strong data-v159-final="cbs"></strong></div></div></div><p class="v153-source"><b>Base da consulta:</b> '+(tipo==='ncm'?'TIPI e correlação NCM × cClassTrib embarcadas.':'Código informado e, quando houver, planilha NBS carregada.')+' '+(url?'<a class="v159-link" href="'+url+'" target="_blank" rel="noopener">Abrir '+esc(dados.anexo.match(/Anexo\s+[IVXLCDM]+/i)?.[0]||'anexo')+' na LC 214/2025</a>':'<a class="v159-link" href="'+LC214+'" target="_blank" rel="noopener">Consultar LC 214/2025</a>')+'</p>';
    panel.querySelector('.v153-print').onclick=()=>window.print();
    panel.querySelectorAll('[data-v159]').forEach(el=>el.addEventListener('input',()=>calcular(panel)));
    calcular(panel);
  }
  const style=document.createElement('style');style.textContent=`.v159-result{border-color:#ff761c!important}.v159-status{padding:10px 12px;border-radius:8px;font-size:13px;font-weight:800;margin-bottom:14px}.v159-status.ok{background:#173f30;color:#c7f5da}.v159-status.review{background:#4d3821;color:#ffe0a8}.v159-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.v159-field input{width:86px;background:#fff;border:1px solid #9097a2;border-radius:5px;padding:5px;color:#17202d;font-weight:800}.v159-field em{font-style:normal}.v159-calc{margin-top:18px;padding:16px;border-radius:10px;background:#171a20;border:1px solid #414752}.v159-calc h3{margin:0 0 4px;color:#ff8a3a;font-size:16px}.v159-calc p{margin:0 0 12px;color:#c7cbd3;font-size:12px}.v159-calc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.v159-calc-grid label,.v159-calc-grid div{display:flex;flex-direction:column;gap:5px;color:#c7cbd3;font-size:11px;font-weight:800;text-transform:uppercase}.v159-calc-grid input{box-sizing:border-box;width:100%;padding:8px;border:1px solid #8d949e;border-radius:5px;font-size:15px;font-weight:800;color:#162234}.v159-calc-grid strong{font-size:16px;color:#fff;text-transform:none}.v159-link{display:inline-block;margin-left:8px;color:#ff9a54!important;font-weight:800}@media(max-width:850px){.v159-grid,.v159-calc-grid{grid-template-columns:1fr 1fr!important}}@media(max-width:520px){.v159-grid,.v159-calc-grid{grid-template-columns:1fr!important}}`;document.head.appendChild(style);
  const disparar=b=>{const tipo=b.dataset.v123Consulta,termo=document.getElementById('v123-'+tipo)?.value.trim();if(termo)setTimeout(()=>render(tipo,termo),30)};
  document.getElementById('v123-topbar')?.addEventListener('click',e=>{const b=e.target.closest('[data-v123-consulta]');if(b)disparar(b)},true);
  document.getElementById('v123-topbar')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('#v123-ncm,#v123-nbs')){e.preventDefault();disparar({dataset:{v123Consulta:e.target.id.replace('v123-','')}})}},true);
})();
