/* V261 — Menu Documentos: opções próprias para carregar o SPED Fiscal (EFD ICMS/IPI) e a EFD Contribuições.
   V263 — Cada opção tem a sua própria tela de carga: na tela do SPED Fiscal aparece só o SPED Fiscal, na da
   EFD Contribuições só a EFD Contribuições (arquivo ou pasta), sem o quadro "Carregar XML/PDF"; e a tela
   Carregar XML/PDF não mostra os quadros do SPED.
   A leitura continua sendo a da V253 (parseSpedV253, identificada pelo conteúdo do arquivo). */
(function(){
  if (window.V261_CARREGADO) return;
  const side=document.getElementById('v123-sidebar'),painel=document.getElementById('load'),area=document.getElementById('drop'),entrada=document.getElementById('files');
  if(!side||!painel||!area||!entrada)return;
  const TIPOS={
    spedfiscal:{nome:'SPED Fiscal — EFD ICMS/IPI',titulo:'Carregar SPED Fiscal (EFD ICMS/IPI)',curto:'SPED Fiscal',de:'do SPED Fiscal',re:/SPED EFD ICMS/i,
      texto:'Escrituração Fiscal Digital do ICMS e do IPI. Selecione o arquivo .txt gerado pelo PVA, ou a pasta onde estão os arquivos do período.'},
    efdcontrib:{nome:'EFD Contribuições',titulo:'Carregar EFD Contribuições',curto:'EFD Contribuições',de:'da EFD Contribuições',re:/SPED EFD Contribui/i,
      texto:'Escrituração Fiscal Digital das Contribuições (PIS/COFINS). Selecione o arquivo .txt gerado pelo PVA, ou a pasta onde estão os arquivos do período.'}};
  const st=document.createElement('style');st.id='v261-sped-style';st.textContent=`
.v261-sped{display:none;margin:0 0 4px;text-align:left}
#load[data-v263-modo="spedfiscal"] #v261-sped-spedfiscal,#load[data-v263-modo="efdcontrib"] #v261-sped-efdcontrib{display:block}
#load[data-v263-modo="spedfiscal"] #drop,#load[data-v263-modo="efdcontrib"] #drop,#load[data-v263-modo="spedfiscal"] #v225-carregar-titulo,#load[data-v263-modo="efdcontrib"] #v225-carregar-titulo{display:none!important}
#load[data-v263-modo="spedfiscal"] #selected,#load[data-v263-modo="efdcontrib"] #selected{display:none!important}
.v261-sped h2{margin:0 0 14px;color:#173f64;font-size:22px}
.v261-zona{padding:34px 20px;border:2px dashed #8AA4BF;border-radius:10px;background:#F7FAFE;text-align:center}
.v261-zona.v261-sobre{border-color:#2456C8;background:#E9F0FD}
.v261-zona strong{display:block;font-size:18px;color:#173f64}
.v261-zona .hint{display:block;margin:8px auto 16px;max-width:760px;font-size:13px}
.v261-zona .actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.v261-msg{display:block;margin-top:10px;font:12.5px system-ui;color:#42566B}
@media(max-width:650px){.v261-zona{padding:25px 12px}.v261-zona .actions>*{width:100%}}`;
  document.head.appendChild(st);

  /* ---------- envio à carga (mesma fila dos XMLs) ---------- */
  function enviar(lista,tipo){
    const msg=document.getElementById('v261-msg-'+(tipo||'spedfiscal'));
    const todos=Array.from(lista||[]),arquivos=todos.filter(f=>/\.txt$/i.test(String(f.name||'')));
    const de=(TIPOS[tipo]||TIPOS.spedfiscal).de;
    if(!arquivos.length){if(msg)msg.textContent=todos.length?'Nenhum arquivo .txt encontrado entre os '+todos.length+' selecionado(s). O arquivo '+de+' é um texto (.txt).':'Nenhum arquivo selecionado.';return 0}
    if(typeof window.classificadorV261Enviar==='function'){window.classificadorV261Enviar(arquivos)}
    else{const dt=new DataTransfer();arquivos.forEach(f=>dt.items.add(f));entrada.files=dt.files;entrada.dispatchEvent(new Event('change',{bubbles:true}))}
    if(msg)msg.textContent=arquivos.length+' arquivo(s) adicionado(s) à carga: '+arquivos.slice(0,6).map(f=>f.name).join(', ')+(arquivos.length>6?' e mais '+(arquivos.length-6):'')+'. Clique em Processar.';
    /* total da carga, lido depois que a fila é atualizada */
    if(msg)setTimeout(()=>{try{const n=(typeof state!=='undefined'&&state.files||[]).length;if(n&&!/Total na carga/.test(msg.textContent))msg.textContent+=' Total na carga: '+n+' arquivo(s).'}catch(e){}},300);
    return arquivos.length;
  }

  /* ---------- uma tela de carga por escrituração ---------- */
  const titulo=document.getElementById('v225-carregar-titulo');
  let ancora=area;
  for(const k of Object.keys(TIPOS)){
    const T=TIPOS[k],b=document.createElement('div');b.className='v261-sped';b.id='v261-sped-'+k;
    b.innerHTML='<h2>'+T.titulo+'</h2><div class="v261-zona" data-v261-zona="'+k+'"><strong>Arraste o arquivo '+T.de+' para cá</strong><span class="hint">'+T.texto+' Depois clique em <b>Processar</b>. A leitura é feita somente neste computador.</span>'
      +'<div class="actions"><button type="button" data-v261-arquivo="'+k+'">Selecionar arquivo</button><button type="button" class="secondary" data-v261-pasta="'+k+'">Selecionar pasta</button></div>'
      +'<input id="v261-arquivo-'+k+'" type="file" accept=".txt,text/plain" multiple hidden><input id="v261-pasta-'+k+'" type="file" webkitdirectory directory multiple hidden aria-hidden="true">'
      +'<span class="v261-msg" id="v261-msg-'+k+'" role="status"></span></div>';
    ancora.insertAdjacentElement('afterend',b);ancora=b;
    const fa=b.querySelector('#v261-arquivo-'+k),fp=b.querySelector('#v261-pasta-'+k),zona=b.querySelector('.v261-zona');
    b.querySelector('[data-v261-arquivo]').addEventListener('click',()=>fa.click());
    b.querySelector('[data-v261-pasta]').addEventListener('click',()=>fp.click());
    fa.addEventListener('change',()=>{enviar(fa.files,k);fa.value=''});
    fp.addEventListener('change',()=>{enviar(fp.files,k);fp.value=''});
    zona.addEventListener('dragover',e=>{e.preventDefault();e.stopPropagation();zona.classList.add('v261-sobre')});
    zona.addEventListener('dragleave',()=>zona.classList.remove('v261-sobre'));
    zona.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();zona.classList.remove('v261-sobre');enviar(e.dataTransfer&&e.dataTransfer.files,k)});
  }
  function modo(k){
    const m=TIPOS[k]?k:'xml';
    if(painel.dataset.v263Modo!==m)painel.dataset.v263Modo=m;
    return m;
  }
  modo('xml');

  /* ---------- menu lateral ---------- */
  const ref=side.querySelector('[data-v123-key="cte"]')||side.querySelector('[data-v123-key="documentos"]');
  const carga=side.querySelector('[data-v123-key="documentos"]');
  let ultimo=ref;
  for(const k of Object.keys(TIPOS)){
    const b=document.createElement('button');b.type='button';b.className='v123-link';b.dataset.v123Key=k;b.dataset.v261='1';
    b.appendChild(document.createTextNode(TIPOS[k].nome));const c=document.createElement('small');c.dataset.v261Count=k;c.textContent='0';b.appendChild(c);
    if(ultimo)ultimo.after(b);else side.appendChild(b);ultimo=b;
    b.addEventListener('click',()=>{
      if(b.classList.contains('v229-locked'))return;
      if(carga)carga.click();else document.querySelector('.tab[data-tab="load"]')?.click();
      modo(k);
      setTimeout(()=>{
        if(!painel.classList.contains('active')){modo('xml');return}
        modo(k);
        side.querySelectorAll('.v123-link').forEach(x=>x.classList.toggle('active',x===b));
        const t=document.getElementById('v123-title');if(t)t.textContent=TIPOS[k].titulo;
        if(window.scrollTo)try{window.scrollTo(0,0)}catch(e){}
      },30);
    });
  }
  /* qualquer outro caminho para a tela de carga (menu Carregar XML/PDF, botões "Carregar mais XMLs") volta ao modo XML */
  document.addEventListener('click',e=>{
    const alvo=e.target&&e.target.closest?e.target:null;if(!alvo)return;
    /* V278 — o clique automático do link de download (Excel, diagnóstico) não é troca de tela */
    if(alvo.closest('[data-v261]')||alvo.closest('#load')||alvo.closest('a[download]'))return;
    modo('xml');
  },true);

  function contar(itens){
    const s={spedfiscal:new Set,efdcontrib:new Set};
    for(const r of itens||[]){const t=String(r.tipo_documento||'');for(const k in TIPOS)if(TIPOS[k].re.test(t))s[k].add(String(r.chave_documento||'')+'|'+String(r.arquivo_origem||''))}
    return {spedfiscal:s.spedfiscal.size,efdcontrib:s.efdcontrib.size};
  }
  function atualizar(){
    const n=contar((typeof state!=='undefined'&&state.items)||[]);
    for(const k in n){const e=side.querySelector('[data-v261-count="'+k+'"]');if(e&&e.textContent!==String(n[k]))e.textContent=String(n[k])}
  }
  atualizar();setInterval(atualizar,2000);document.addEventListener('click',()=>setTimeout(atualizar,80));
  window.classificadorV261={contar,enviar,atualizar,modo,TIPOS};
  window.V261_CARREGADO=true;
})();
