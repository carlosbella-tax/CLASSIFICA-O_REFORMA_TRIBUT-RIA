/* V163 — Evidencia a referência documental da LC 214/2025 nas consultas individuais de NCM e NBS. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
    painel.querySelectorAll('.v162-candidato').forEach((artigo,i)=>{
      const r=todos[i],v=r?.vinculo||{},temRef=Boolean(v.NroAnexo&&v.NroItemAnexoLei);
      const box=document.createElement('div');
      box.className='v163-lc214 '+(temRef?'confirmada':'pendente');
      box.innerHTML=temRef
        ?'<b>LC 214/2025 — referência identificada</b><span>Anexo '+esc(v.NroAnexo)+' · item '+esc(v.NroItemAnexoLei)+'. Aplique somente se a condição e as exceções deste vínculo estiverem atendidas.</span><a href="'+LC214+'" target="_blank" rel="noopener">Abrir LC 214/2025</a>'
        :'<b>LC 214/2025 — revisão necessária</b><span>A referência consultada não informa anexo e item suficientes para uma validação documental automática. Confirme o enquadramento na legislação oficial.</span><a href="'+LC214+'" target="_blank" rel="noopener">Abrir LC 214/2025</a>';
      artigo.querySelector('.v162-links')?.insertAdjacentElement('beforebegin',box);
    });
    const fonte=painel.querySelector('.v153-source');
    if(fonte)fonte.insertAdjacentHTML('beforeend',' <b>Critério V163:</b> somente vínculos com anexo e item registrados são apresentados como referência documental identificada; isso não elimina a conferência das condições legais da operação.');
    painel.dataset.v163Aplicado='1';
  }
  const css=document.createElement('style');
  css.textContent='.v162-status.validado{background:#e8f6ed;color:#17683a}.v163-lc214{margin:10px 0;padding:9px 10px;border-radius:6px;font-size:12px;line-height:1.4}.v163-lc214.confirmada{background:#e9f7ee;border:1px solid #a9d7b8;color:#185b34}.v163-lc214.pendente{background:#fff5df;border:1px solid #e7ca8c;color:#6f4a05}.v163-lc214 b,.v163-lc214 span{display:block}.v163-lc214 a{display:inline-block;margin-top:5px;color:#0e5b91!important;font-weight:800}';
  document.head.appendChild(css);
  new MutationObserver(()=>setTimeout(validar,0)).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(validar,140),true);
})();
