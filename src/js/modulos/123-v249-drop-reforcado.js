/* V249 — Reforço do arrastar e soltar: garante o processamento do drop na aba Carregar XML/PDF
   mesmo quando outros handlers falham, e mantém o usuário na aba de carga. */
(function(){
  const load=document.getElementById('load');
  if(!load)return;

  /* reforço: o drop na área (e em qualquer ponto da tela) sempre preventDefault e entrega os arquivos */
  const tipoPorArquivo=function(nome){
    const n=String(nome||'').toLowerCase();
    if(n.indexOf('nfse')>-1||n.indexOf('nfs-e')>-1)return 'iss';
    if(n.indexOf('cte')>-1||n.indexOf('ct-e')>-1)return 'cte';
    if(n.indexOf('nfe')>-1||n.indexOf('danfe')>-1)return 'items';
    return '';
  };

  const receber=function(files){
    if(!files||!files.length)return;
    /* garante a aba de carga ativa */
    try{
      if(!load.classList.contains('active')){
        const menu=document.querySelector('#v123-sidebar [data-v123-key="documentos"]');
        if(menu)menu.click();else{const tab=document.querySelector('.tab[data-tab="load"]');tab&&tab.click()}
      }
    }catch(x){}
    /* entrega ao setFiles global (respeita o filtro xml/txt/pdf do V89) */
    try{
      if(typeof window.setFiles==='function')window.setFiles(files);
      else if(typeof state!=='undefined'){Array.prototype.push.apply(state.files,Array.from(files));if(typeof window.atualizarSelecao==='function')window.atualizarSelecao()}
    }catch(x){}
    /* identifica o tipo apenas para informação (sem navegar) */
    let tipo='';
    for(let i=0;i<files.length;i++){const t=tipoPorArquivo((files[i]&&files[i].name)||'');if(t){tipo=t;break}}
    const st=document.getElementById('status');
    if(st&&tipo){const rotulo=tipo==='iss'?'NFS-e':(tipo==='cte'?'CT-e':'NF-e');if(!/Concluído/i.test(st.textContent))st.textContent='Arquivos de '+rotulo+' prontos para processar.';st.className='status ok'}
  };

  /* janela inteira: arraste sempre autorizado */
  window.addEventListener('dragover',function(e){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy'},false);
  window.addEventListener('drop',function(e){
    e.preventDefault();e.stopPropagation();
    const dt=e.dataTransfer;if(!dt)return;
    let arq=dt.files;
    if(!arq||!arq.length){ /* pasta arrastada: usa a leitura por entradas existente */
      if(e.dataTransfer.items&&e.dataTransfer.items.length){return /* o handler nativo do V06/V14 trata pastas */}
      return;
    }
    receber(arq);
  },true);

  const dropArea=document.getElementById('drop');
  if(dropArea){
    dropArea.addEventListener('dragover',function(e){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';dropArea.classList.add('drag')},false);
    dropArea.addEventListener('dragleave',function(){dropArea.classList.remove('drag')},false);
    dropArea.addEventListener('drop',function(e){
      e.preventDefault();e.stopPropagation();dropArea.classList.remove('drag');
      const arq=e.dataTransfer&&e.dataTransfer.files;
      if(arq&&arq.length)receber(arq);
    },false);
  }

  /* inputs de arquivo também garantem a entrega dupla (por garantia) */
  ['files','selectFolderFull'].forEach(function(id){
    const el=document.getElementById(id);
    if(el)el.addEventListener('change',function(){
      const arq=el.files&&el.files.length?el.files:null;
      if(arq)setTimeout(function(){receber(arq)},150);
    });
  });
})();
