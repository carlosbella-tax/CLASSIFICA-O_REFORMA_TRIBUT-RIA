/* V157 — Validação NCM/NBS na própria Base de IBS/CBS e ajustes solicitados de interface. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  const TIPI='https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/nomenclatura-comum-do-mercosul-ncm';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style=document.createElement('style');
  style.textContent=`
    #items #download,#items #back{display:none!important}
    #items .v45-bar{display:none!important}
    #ibsCbsTable .v157-validation{background:#f5f8fb;color:#173f64;min-width:175px;white-space:normal;line-height:1.35}
    #ibsCbsTable .v157-link{color:#0e5b91;font-weight:800;text-decoration:underline}
    #items .v105-is,#items [id*="isInfo"]{background:#e4e7ea!important;color:#27323c!important;border-color:#c8cdd2!important}
    .v157-admin .v127-calendar,.v157-admin [class*="calendar"]{display:none!important}
    .v157-admin .v127-admin-grid{grid-template-columns:minmax(330px,390px) minmax(0,1fr)!important}
    .v157-admin .v127-box label,.v157-admin .v127-box input,.v157-admin .v127-box select{box-sizing:border-box;width:100%!important}
    .v157-admin .v127-box input,.v157-admin .v127-box select{min-height:42px!important;margin-bottom:10px}
    @media(max-width:850px){.v157-admin .v127-admin-grid{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  function localizarLote(tipo,codigo){
    return (window.classificadorLoteNcmNbs||[]).find(x=>x.tipo===tipo&&String(x.codigo||'').replace(/\D/g,'')===String(codigo||'').replace(/\D/g,''));
  }
  function linhaNcm(r){
    const ncm=String(r.ncm||'').replace(/\D/g,'').padStart(8,'0');
    const ref=typeof window.classificadorReferenciaNcm==='function'?window.classificadorReferenciaNcm(ncm):null;
    const encontrado=ref&&ref.descricao&&!/^NCM não/i.test(ref.descricao);
    return {tipo_documento:r.tipo_de_documento||'Documento Fiscal — Modelo 55',codigo_item:r.codigo_item||r.cProd||'',descricao_item:r.descricao_item||r.xProd||'',codigo_referencia:ncm,fonte:'NCM / TIPI',validacao_referencia:encontrado?'VALIDADO — NCM localizada na TIPI embarcada':'ANALISAR — NCM não localizada na TIPI embarcada',cst_adequada:ref?.cst||'A confirmar',cclasstrib_adequada:ref?.cclasstrib||'A confirmar',reducao_adequada:'Conforme anexo e hipótese legal',anexo_lc214:ref?.anexo||'Sem anexo candidato identificado',link_legislacao:encontrado?LC214:'',link_tipi:TIPI};
  }
  function linhaNbs(r){
    const nbs=String(r.nbs||r.codigo_nbs||'').trim();
    const servico=String(r.codigo_servico||r.codigoServico||r.codigo_item||'').trim();
    const lote=localizarLote('NBS',nbs);
    const temNbs=/^\d\.\d{4}\.\d{2}\.\d{2}$/.test(nbs);
    const referencia=lote?'REFERÊNCIA EM PLANILHA — NBS encontrada na planilha carregada; confirme o enquadramento legal.':temNbs?'ANALISAR — NBS informada no documento, sem correspondência em planilha carregada.':'ANALISAR — documento sem NBS válida; use o código do serviço para confirmar a NBS.';
    return {tipo_documento:r.tipo_de_documento||'Nota de Serviço — NFS-e',codigo_item:servico||'Não informado',descricao_item:r.descricao_item||r.descricao_servico||'',codigo_referencia:nbs||'NBS não identificada',fonte:'NBS + código do serviço',validacao_referencia:referencia,cst_adequada:lote?.cst_sugerido||'A confirmar na legislação',cclasstrib_adequada:lote?.cclasstrib_sugerida||'A confirmar na legislação',reducao_adequada:lote?.reducao_sugerida||'A confirmar na legislação',anexo_lc214:lote?.anexo||'A confirmar — base oficial NBS não embarcada',link_legislacao:lote?.anexo&&lote.anexo!=='A validar'?LC214:'',link_tipi:''};
  }
  function linhasValidacao(){
    const itens=(typeof state==='undefined'?[]:state.items||[]);
    return itens.filter(r=>r&&(r.ncm||r.nbs||r.codigo_nbs||r.codigo_servico)).map(r=>r.nbs||r.codigo_nbs||r.codigo_servico?linhaNbs(r):linhaNcm(r));
  }
  function renderIbsCbs(){
    const table=document.getElementById('ibsCbsTable'),info=document.getElementById('ibsCbsInfo'); if(!table)return;
    const rows=linhasValidacao(), cols=['tipo_documento','codigo_item','descricao_item','codigo_referencia','fonte','validacao_referencia','cst_adequada','cclasstrib_adequada','reducao_adequada','anexo_lc214','link_tipi'];
    cacheTabelas.ibscbs={rows};
    const filtro=typeof filtrarLinhas==='function'?filtrarLinhas(rows,'ibscbs'):rows;
    const labels={tipo_documento:'Documento',codigo_item:'Código do item/serviço',descricao_item:'Descrição',codigo_referencia:'NCM / NBS',fonte:'Base de validação',validacao_referencia:'Validação NCM/NBS',cst_adequada:'CST adequada',cclasstrib_adequada:'cClassTrib adequada',reducao_adequada:'Redução adequada',anexo_lc214:'Anexo / enquadramento',link_tipi:'Consulta TIPI'};
    table.querySelector('thead').innerHTML='<tr>'+cols.map(c=>'<th>'+esc(labels[c])+'</th>').join('')+'</tr>';
    table.querySelector('tbody').innerHTML=filtro.slice(0,MAX_LINHAS_VISIVEIS).map(r=>'<tr>'+cols.map(c=>{
      if(c==='anexo_lc214')return '<td class="v157-validation">'+(r.link_legislacao?'<a class="v157-link" href="'+LC214+'" target="_blank" rel="noopener" title="Abrir a LC 214/2025 para consultar o anexo informado">'+esc(r[c])+'</a>':esc(r[c]))+'</td>';
      if(c==='link_tipi')return '<td class="v157-validation">'+(r[c]?'<a class="v157-link" href="'+TIPI+'" target="_blank" rel="noopener">Consultar TIPI</a>':'')+'</td>';
      return '<td class="'+(/validacao|adequada/.test(c)?'v157-validation':'')+'">'+esc(r[c])+'</td>';
    }).join('')+'</tr>').join('')||'<tr><td class="empty" colspan="'+cols.length+'">Processe XML ou PDF com NCM/NBS para exibir a validação na mesma linha.</td></tr>';
    if(info)info.textContent='Linhas de NCM/NBS para validação: '+rows.length+'. A conclusão depende do documento, da operação e da hipótese legal aplicável.';
  }
  const renderAbaAnterior=renderAba;
  renderAba=function(id){if(id==='ibscbs'){renderIbsCbs();return}return renderAbaAnterior.apply(this,arguments)};

  function ajustarInterface(){
    const side=document.getElementById('v123-sidebar'),contact=side?.querySelector('[data-v125-contact]');
    if(side&&contact){const section=contact.previousElementSibling; if(section?.classList.contains('v123-side-section')){side.insertBefore(section,side.firstChild);side.insertBefore(contact,section.nextSibling);}}
    const admin=document.getElementById('v127-admin'); if(admin){admin.classList.add('v157-admin');const h=admin.querySelector('h2');if(h&&h.textContent!=='Administrador')h.textContent='Administrador';const sub=document.getElementById('v127-admin-sub');if(sub&&sub.textContent!=='Usuários, administradores e validade de acesso.')sub.textContent='Usuários, administradores e validade de acesso.';}
    document.querySelectorAll('#items .card').forEach(card=>{if(/Imposto Seletivo \(IS\)/.test(card.textContent||'')){card.style.background='#e4e7ea';card.style.color='#27323c';}});
  }
  ajustarInterface();
})();
