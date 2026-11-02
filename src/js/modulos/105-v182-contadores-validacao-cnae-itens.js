/* V182 — Contadores de CNAEs informados/validados e de itens analisados. */
(function(){
  const cnaes=()=>[...new Set((document.getElementById('cnaesEmpresa')?.value||'').split(/[;,\n]+/).map(v=>v.replace(/\D/g,'')).filter(Boolean))];
  function atualizarCnae(){
    const painel=document.getElementById('v156-cnae-panel');if(!painel)return;
    const lista=cnaes(),validados=lista.filter(c=>c.length===7).length;
    let contador=painel.querySelector('.v182-cnae-contador');
    if(!contador){contador=document.createElement('p');contador.className='v182-cnae-contador';const intro=painel.querySelector('.v156-cnae-intro');intro?.insertAdjacentElement('afterend',contador);}
    contador.textContent=lista.length+' CNAE(s) informado(s) · '+validados+' CNAE(s) validado(s)';
  }
  function atualizarEnquadramento(){
    const titulo=document.querySelector('#observacoes .v180-enquadramento h2');if(!titulo)return;
    const quantidade=typeof state!=='undefined'&&Array.isArray(state.items)?state.items.length:0;
    titulo.textContent='Enquadramento recomendado — '+quantidade+' item(ns) analisado(s)';
  }
  function atualizar(){atualizarCnae();atualizarEnquadramento();}
  const css=document.createElement('style');css.textContent='.v182-cnae-contador{display:inline-block;margin:0 0 15px;padding:7px 10px;border-radius:6px;background:#e8f1f7;color:#123d60!important;font-size:13px;font-weight:800}.v182-cnae-contador::before{content:"Resumo da validação: ";}';document.head.appendChild(css);
  document.getElementById('v123-sidebar')?.addEventListener('click',e=>{if(e.target.closest('[data-v123-key="cnae"]'))setTimeout(atualizarCnae,20);if(e.target.closest('[data-v123-key="enquadramento"]'))setTimeout(atualizarEnquadramento,40);});
  document.querySelector('.tab[data-tab="observacoes"]')?.addEventListener('click',()=>setTimeout(atualizarEnquadramento,40));
  document.getElementById('cnaesEmpresa')?.addEventListener('input',()=>setTimeout(atualizarCnae,0));
  window.classificadorAtualizarContadoresAnalise=atualizar;
})();
