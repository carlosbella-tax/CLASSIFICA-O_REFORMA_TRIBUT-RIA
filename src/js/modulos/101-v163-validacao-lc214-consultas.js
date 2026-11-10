/* V163 — Evidencia a referência documental da LC 214/2025 nas consultas individuais de NCM e NBS. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  const LC214Senado='https://legis.senado.gov.br/norma/40180341/publicacao/40181429';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  /* V219 — Prioriza a âncora oficial do Anexo; usa o fundamento do Portal e a LC completa como contingências. */
  const seguro=(anexo,url)=>{if(typeof window.classificadorUrlAnexoLc214==='function')return window.classificadorUrlAnexoLc214(anexo,url);const limpo=String(url||'').replace(/\s+/g,'');return /^https:\/\/(?:www\.)?planalto\.gov\.br\//i.test(limpo)?limpo:LC214};
  const codigo=(tipo,v)=>String(v||'').replace(/\D/g,'').padStart(tipo==='NCM'?8:9,'0');
  const vigente=o=>{const hoje=new Date().toISOString().slice(0,10),ini=String(o?.DthIniVig||'').slice(0,10),fim=String(o?.DthFimVig||'').slice(0,10);return (!ini||ini<=hoje)&&(!fim||fim>=hoje)};
  function registros(tipo,termo){
    const fn=window.classificadorReferenciaPortal;
    if(typeof fn!=='function')return [];
    return fn(tipo,codigo(tipo,termo)).map(x=>Object.assign({},x,{vigente:vigente(x.vinculo)&&vigente(x.classificacao)&&vigente(x.cst)}));
  }
  function validar(){
    const painel=document.getElementById('v153-result');
    if(!painel||painel.dataset.v163Aplicado==='1')return;
    const tipo=(painel.querySelector('.v153-head b')?.textContent||'').trim();
    const campo=document.getElementById('v123-'+tipo.toLowerCase());
    if(!/^(NCM|NBS)$/.test(tipo)||!campo?.value.trim())return;
    const todos=registros(tipo,campo.value),ativos=todos.filter(x=>x.vigente&&x.vinculo?.TipoPermissao!=='VEDADO');
    const documentados=ativos.filter(x=>x.vinculo?.NroAnexo&&x.vinculo?.NroItemAnexoLei);
    const status=painel.querySelector('.v162-status');
    if(status){
      status.className='v162-status '+(ativos.length===1&&documentados.length===1?'validado':'warning');
      status.textContent=!todos.length
        ?'ANÁLISE NECESSÁRIA — não há vínculo documental localizado na referência consultada para validar este código na LC 214/2025.'
        :ativos.length===1&&documentados.length===1
          ?'REFERÊNCIA DOCUMENTAL LOCALIZADA NA LC 214/2025 — o vínculo possui anexo e item identificados. Confirme a condição, a exceção, a operação e a vigência antes do enquadramento definitivo.'
          :'REVISÃO OBRIGATÓRIA — a LC 214/2025 apresenta mais de uma hipótese, ou o vínculo não informa anexo/item suficiente. Não é seguro definir o tratamento automaticamente.';
    }
    /* V204 — Quando não há correlação NCM específica, exibe os parâmetros gerais oficiais sem presumir tratamento tributário. */
    if(tipo==='NCM'&&!todos.length&&!painel.querySelector('.v204-lc214-geral')){
      const box=document.createElement('section');
      box.className='v204-lc214-geral';
      box.innerHTML='<b>LC 214/2025 — parâmetros gerais para a operação</b><p><strong>Art. 4º:</strong> IBS e CBS incidem sobre operações onerosas com bens ou serviços, nas hipóteses da Lei Complementar.</p><p><strong>Art. 7º:</strong> em operação com fornecimentos de tratamento tributário distinto, cada fornecimento e seu valor devem ser especificados.</p><p><strong>Art. 12:</strong> a base de cálculo é, em regra, o valor da operação, observadas as disposições específicas da lei.</p><p><strong>Arts. 14 a 16:</strong> as alíquotas-padrão são definidas pelos entes competentes; reduções dependem dos regimes diferenciados previstos na LC 214/2025 e da condição legal aplicável.</p><p class="v204-cautela"><strong>Aplicação ao NCM consultado:</strong> a TIPI identifica a mercadoria, mas a ausência de vínculo específico na referência Portal não confirma alíquota-padrão, tributação integral, redução, isenção ou regime específico. Confirme a operação, o destino, o adquirente e as condições legais.</p><a href="'+LC214+'" target="_blank" rel="noopener">Texto oficial no Planalto</a><a href="'+LC214Senado+'" target="_blank" rel="noopener">Consulta legislativa no Senado</a>';
      (status||painel.querySelector('.v162-resumo'))?.insertAdjacentElement('afterend',box);
    }
    painel.querySelectorAll('.v162-candidato').forEach((artigo,i)=>{
      const r=todos[i],v=r?.vinculo||{},temAnexo=Boolean(v.NroAnexo),temRef=Boolean(v.NroAnexo&&v.NroItemAnexoLei),url=seguro(v.NroAnexo,r?.classificacao?.TexUrlLegislacao);
      const box=document.createElement('div');
      box.className='v163-lc214 '+(temRef?'confirmada':'pendente');
      box.innerHTML=temRef
        ?'<b>LC 214/2025 — referência identificada</b><span>Anexo '+esc(v.NroAnexo)+' · item '+esc(v.NroItemAnexoLei)+'. Aplique somente se a condição e as exceções deste vínculo estiverem atendidas.</span><a href="'+esc(url)+'" target="_blank" rel="noopener">Abrir Anexo '+esc(v.NroAnexo)+' / fundamento indicado</a>'
        :temAnexo
          ?'<b>LC 214/2025 — revisão necessária</b><span>Anexo '+esc(v.NroAnexo)+' identificado, mas sem item suficiente para validação automática. Confirme o enquadramento na legislação oficial.</span><a href="'+esc(url)+'" target="_blank" rel="noopener">Abrir Anexo '+esc(v.NroAnexo)+' / fundamento indicado</a>'
          :'<b>LC 214/2025 — revisão necessária</b><span>A referência consultada não informa anexo e item suficientes para uma validação documental automática. Confirme o enquadramento na legislação oficial.</span><a href="'+LC214+'" target="_blank" rel="noopener">Abrir texto completo da LC 214/2025</a>';
      artigo.querySelector('.v162-links')?.insertAdjacentElement('beforebegin',box);
    });
    painel.dataset.v163Aplicado='1';
  }
  const css=document.createElement('style');
  css.textContent='.v162-status.validado{background:#e8f6ed;color:#17683a}.v163-lc214{margin:10px 0;padding:9px 10px;border-radius:6px;font-size:12px;line-height:1.4}.v163-lc214.confirmada{background:#e9f7ee;border:1px solid #a9d7b8;color:#185b34}.v163-lc214.pendente{background:#fff5df;border:1px solid #e7ca8c;color:#6f4a05}.v163-lc214 b,.v163-lc214 span{display:block}.v163-lc214 a{display:inline-block;margin-top:5px;color:#0e5b91!important;font-weight:800}.v204-lc214-geral{margin:12px 0;padding:12px;border:1px solid #9dc5db;border-radius:7px;background:#edf7fc;color:#17445e;font-size:12px;line-height:1.45}.v204-lc214-geral>b{display:block;font-size:13px}.v204-lc214-geral p{margin:6px 0}.v204-lc214-geral .v204-cautela{padding-top:7px;border-top:1px solid #c3dbe8}.v204-lc214-geral a{display:inline-block;margin:4px 12px 0 0;color:#0e5b91!important;font-weight:800}';
  document.head.appendChild(css);
  new MutationObserver(()=>setTimeout(validar,0)).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(validar,140),true);
})();
