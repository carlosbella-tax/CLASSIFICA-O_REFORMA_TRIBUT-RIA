/* V242/V244 — Fluxo de carga na aba Carregar XML/PDF:
   1) Ao arrastar ou selecionar arquivos, abre automaticamente a aba do menu correspondente ao tipo
      (NF-e, NFS-e, CT-e) — a aba é o "tipo de documento".
   2) Botão "Voltar" ao lado de "Processar" retorna ao passo anterior.
   3) Permanece na aba de carga após o processamento (não volta para a primeira tela).
   4) Após processar, preenche automaticamente emitente e tomador (nome, CNPJ e município). */
(function(){
  const load=document.getElementById('load');
  if(!load)return;

  /* ---------- 1) Tipo de documento automático ---------- */
  const tipoPorArquivo=function(nome){
    const n=String(nome||'').toLowerCase();
    if(n.indexOf('nfse')>-1||n.indexOf('nfs-e')>-1)return 'iss';
    if(n.indexOf('cte')>-1||n.indexOf('ct-e')>-1)return 'cte';
    if(n.indexOf('nfe')>-1||n.indexOf('danfe')>-1)return 'items';
    return '';
  };
  window.classificadorV243AbaPorArquivo=tipoPorArquivo;
  const abrirAbaTipo=function(files){
    /* V246 — permanece na aba de carga: apenas identifica o tipo, sem navegar */
    if(!files||!files.length)return '';
    for(let i=0;i<files.length;i++){
      const aba=tipoPorArquivo((files[i]&&files[i].name)||'');
      if(aba)return aba;
    }
    return '';
  };

  const dropArea=document.getElementById('drop');
  const inputFiles=document.getElementById('files');
  const inputPasta=document.getElementById('selectFolderFull');
  if(dropArea){
    dropArea.addEventListener('drop',function(e){
      const arq=e.dataTransfer&&e.dataTransfer.files;
      if(arq&&arq.length)setTimeout(function(){abrirAbaTipo(arq)},200);
    },true);
  }
  if(inputFiles)inputFiles.addEventListener('change',function(){abrirAbaTipo(inputFiles.files)});
  if(inputPasta)inputPasta.addEventListener('change',function(){abrirAbaTipo(inputPasta.files)});

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

  /* ---------- 3 e 4) Ficar na carga e preencher emitente/tomador ---------- */
  document.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('#process'))window.v242FicarNaCarga=true;
  },true);

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
    if(!window.v242FicarNaCarga)return;
    const timer=setInterval(function(){
      const st=document.getElementById('pStatus');
      if(st&&/Concluído/i.test(st.textContent)){
        clearInterval(timer);
        try{
          const docs=(typeof state!=='undefined'&&state.docs)||[];
          if(docs.length){
            const doc=docs[0];
            const nomeEmi=doc.emitente_razao_social||'';
            const cnpjEmi=doc.emitente_cnpj_cpf||'';
            const munEmi=limpaMunicipio(doc.emitente_municipio||'');
            const nomeDes=doc.destinatario_razao_social||'';
            const cnpjDes=doc.destinatario_cnpj_cpf||'';
            const munDes=limpaMunicipio(doc.destinatario_municipio||'');
            preencher('empresa',(nomeEmi||nomeDes)+(munEmi?' — '+munEmi:(munDes?' — '+munDes:'')));
            preencher('cnpjEmpresa',cnpjEmi||cnpjDes);
            preencher('v89-emitente-nome',nomeEmi);
            preencher('v89-emitente-cnpj',cnpjEmi);
            preencher('v89-emitente-municipio',munEmi);
            preencher('v89-tomador-nome',nomeDes);
            preencher('v89-tomador-cnpj',cnpjDes);
            preencher('v89-tomador-municipio',munDes);
          }
        }catch(x){}
        window.v242FicarNaCarga=false;
      }
    },500);
    setTimeout(function(){clearInterval(timer)},120000);
  },true);
})();
