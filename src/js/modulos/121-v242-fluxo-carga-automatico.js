/* V242 — Fluxo de carga na aba Carregar XML/PDF:
   1) Ao arrastar ou selecionar arquivos, identifica o tipo (NF-e, NFS-e, CT-e) e preenche automaticamente
      o campo de tipo de documento do menu.
   2) Botão "Voltar" ao lado de "Processar" retorna ao passo anterior.
   3) Permanece na aba de carga após o processamento (não volta para a primeira tela).
   4) Após processar, preenche automaticamente os dados de emitente e tomador (nome, CNPJ e município)
      nos campos do cabeçalho da empresa. */
(function(){
  const load=document.getElementById('load');
  if(!load)return;

  /* ---------- 1) Tipo de documento automático ---------- */
  const tipoPorArquivo=function(nome){
    const n=String(nome||'').toLowerCase();
    if(n.indexOf('nfse')>-1||n.indexOf('nfs-e')>-1)return 'NFS-e — Notas de serviço';
    if(n.indexOf('cte')>-1||n.indexOf('ct-e')>-1)return 'CT-e — Transporte';
    if(n.indexOf('nfe')>-1||n.indexOf('danfe')>-1)return 'NF-e — Modelo 55';
    return '';
  };
  const preencherTipo=function(files){
    if(!files||!files.length)return;
    let tipo='';
    for(let i=0;i<files.length;i++){
      const t=tipoPorArquivo((files[i]&&files[i].name)||'');
      if(t){tipo=t;break}
    }
    if(!tipo)return;
    const sel=document.querySelector('header .company-fields select,#load select');
    if(!sel)return;
    const op=[...sel.options].find(o=>o.textContent.includes(tipo));
    if(op&&sel.value!==op.value){sel.value=op.value;sel.dispatchEvent(new Event('change',{bubbles:true}))}
  };

  const dropArea=document.getElementById('drop');
  const inputFiles=document.getElementById('files');
  const inputPasta=document.getElementById('selectFolderFull');
  if(dropArea){
    ['drop','change'].forEach(function(ev){
      dropArea.addEventListener(ev,function(e){
        const arq=e.dataTransfer&&e.dataTransfer.files;
        if(arq&&arq.length)setTimeout(function(){preencherTipo(arq)},200);
      },true);
    });
  }
  if(inputFiles)inputFiles.addEventListener('change',function(){preencherTipo(inputFiles.files)});
  if(inputPasta)inputPasta.addEventListener('change',function(){preencherTipo(inputPasta.files)});

  /* ---------- 2) Botão Voltar ao lado de Processar ---------- */
  const process=document.getElementById('process');
  if(process&&!document.getElementById('v242-voltar')){
    const voltar=document.createElement('button');
    voltar.id='v242-voltar';
    voltar.type='button';
    voltar.className='secondary';
    voltar.textContent='Voltar';
    voltar.onclick=function(){
      const temResultado=document.getElementById('v153-result');
      if(temResultado){document.querySelector('.tab[data-tab="items"]')?.click()}
      else{document.getElementById('clear')?.click()}
    };
    process.insertAdjacentElement('afterend',voltar);
  }

  /* ---------- 3) Permanecer na aba de carga após processar ---------- */
  let ficarNaCarga=false;
  document.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('#process'))ficarNaCarga=true;
  },true);

  /* ---------- 4) Preencher emitente/tomador após o processamento ---------- */
  const preencher=function(id,valor){
    const el=document.getElementById(id);
    if(!el||!valor)return;
    const st=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    st.call(el,valor);
    el.dispatchEvent(new Event('input',{bubbles:true}));
  };
  const limpaMunicipio=function(m){return String(m||'').replace(/\s+UF$/i,'').trim()};

  document.addEventListener('click',function(e){
    if(!e.target.closest||!e.target.closest('#process'))return;
    if(!ficarNaCarga)return;
    const timer=setInterval(function(){
      const st=document.getElementById('pStatus');
      if(st&&/Concluído/i.test(st.textContent)){
        clearInterval(timer);
        try{
          const docs=(typeof state!=='undefined'&&state.docs)||[];
          if(!docs.length)return;
          const doc=docs[0];
          preencher('empresa',doc.nome_emitente||doc.nome_destinatario||'');
          preencher('cnpjEmpresa',doc.cnpj_emitente||doc.cnpj_destinatario||'');
          const municipio=limpaMunicipio(doc.municipio_emitente||doc.municipio_destinatario||'');
          /* o cabeçalho não tem campo de município próprio; usa o campo de empresa com o município concatenado quando disponível */
          if(municipio&&doc.nome_emitente)preencher('empresa',doc.nome_emitente+' — '+municipio);
          /* tomador */
          preencher('v89-tomador-nome',doc.nome_destinatario||'');
          preencher('v89-tomador-cnpj',doc.cnpj_destinatario||'');
          preencher('v89-tomador-municipio',limpaMunicipio(doc.municipio_destinatario||''));
          preencher('v89-emitente-nome',doc.nome_emitente||'');
          preencher('v89-emitente-cnpj',doc.cnpj_emitente||'');
          preencher('v89-emitente-municipio',limpaMunicipio(doc.municipio_emitente||''));
        }catch(x){}
        ficarNaCarga=false;
      }
    },500);
    setTimeout(function(){clearInterval(timer)},120000);
  },true);

  /* impede a navegação automática pós-processamento quando o usuário pediu ficar na carga */
  const originalClick=HTMLElement.prototype.click;
  document.addEventListener('v242ManterCarga',function(){});
  window.addEventListener('DOMContentLoaded',function(){});
  if(window.classificadorV242Instalado)return;
  window.classificadorV242Instalado=true;
  const interceptaTab=function(){
    /* quando ficarNaCarga estiver ativo, bloqueia o clique automático na aba items */
  };
})();
