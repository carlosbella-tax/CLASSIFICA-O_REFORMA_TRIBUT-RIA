/* V261 — Menu Documentos: opções próprias para carregar o SPED Fiscal (EFD ICMS/IPI) e a EFD Contribuições.
   A leitura continua sendo a da V253 (parseSpedV253, identificada pelo conteúdo do arquivo); aqui só entram
   os atalhos no menu, os botões de seleção no painel de carga e a contagem de documentos por tipo. */
(function(){
  if (window.V261_CARREGADO) return;
  const side=document.getElementById('v123-sidebar'),painel=document.getElementById('load'),area=document.getElementById('drop'),entrada=document.getElementById('files');
  if(!side||!painel||!area||!entrada)return;
  const TIPOS={spedfiscal:{nome:'SPED Fiscal — EFD ICMS/IPI',titulo:'Carregar SPED Fiscal (EFD ICMS/IPI)',re:/SPED EFD ICMS/i,botao:'Selecionar SPED Fiscal (.txt)'},
    efdcontrib:{nome:'EFD Contribuições',titulo:'Carregar EFD Contribuições',re:/SPED EFD Contribui/i,botao:'Selecionar EFD Contribuições (.txt)'}};
  const st=document.createElement('style');st.id='v261-sped-style';st.textContent='#v261-sped{margin:14px 0 0;padding:14px 16px;border:1px solid #DCE3EE;border-left:4px solid #2456C8;border-radius:8px;background:#F7F9FC;text-align:left}#v261-sped.v261-destaque{box-shadow:0 0 0 3px #2456C855}#v261-sped h3{margin:0 0 4px;font:700 15px system-ui;color:#0F2A4A}#v261-sped .hint{display:block;margin:0 0 10px;font-size:12.5px}#v261-sped .actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start}#v261-sped-msg{display:block;margin-top:8px;font:12.5px system-ui;color:#42566B}';
  document.head.appendChild(st);

  /* ---------- painel de carga ---------- */
  const bloco=document.createElement('div');bloco.id='v261-sped';
  bloco.innerHTML='<h3>Arquivos eletrônicos SPED</h3><span class="hint">Selecione o arquivo .txt gerado pelo PVA. O tipo (SPED Fiscal ou EFD Contribuições) é reconhecido pelo conteúdo do arquivo, e os documentos entram na mesma carga dos XMLs e PDFs. Depois clique em <b>Processar</b>. A leitura é feita somente neste computador.</span>'
    +'<div class="actions">'+Object.keys(TIPOS).map(k=>'<button type="button" class="secondary" data-v261-carregar="'+k+'">'+TIPOS[k].botao+'</button>').join('')+'</div>'
    +'<input id="v261-arquivo" type="file" accept=".txt,text/plain" multiple hidden><span id="v261-sped-msg" role="status"></span>';
  area.insertAdjacentElement('afterend',bloco);
  const seletor=bloco.querySelector('#v261-arquivo'),msg=bloco.querySelector('#v261-sped-msg');
  function enviar(lista){
    const arquivos=Array.from(lista||[]).filter(f=>/\.txt$/i.test(String(f.name||'')));
    if(!arquivos.length){msg.textContent='Nenhum arquivo .txt selecionado. O SPED Fiscal e a EFD Contribuições são arquivos de texto (.txt).';return 0}
    if(typeof window.classificadorV261Enviar==='function'){window.classificadorV261Enviar(arquivos)}
    else{const dt=new DataTransfer();arquivos.forEach(f=>dt.items.add(f));entrada.files=dt.files;entrada.dispatchEvent(new Event('change',{bubbles:true}))}
    msg.textContent=arquivos.length+' arquivo(s) SPED adicionado(s) à carga: '+arquivos.map(f=>f.name).join(', ')+'. Clique em Processar.';
    return arquivos.length;
  }
  seletor.addEventListener('change',()=>{enviar(seletor.files);seletor.value=''});
  bloco.addEventListener('click',e=>{const b=e.target.closest('[data-v261-carregar]');if(b)seletor.click()});

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
      setTimeout(()=>{
        if(!painel.classList.contains('active'))return;
        side.querySelectorAll('.v123-link').forEach(x=>x.classList.toggle('active',x===b));
        const t=document.getElementById('v123-title');if(t)t.textContent=TIPOS[k].titulo;
        bloco.classList.add('v261-destaque');if(bloco.scrollIntoView)bloco.scrollIntoView({block:'center'});
        setTimeout(()=>bloco.classList.remove('v261-destaque'),1800);
      },30);
    });
  }
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
  window.classificadorV261={contar,enviar,atualizar,TIPOS};
  window.V261_CARREGADO=true;
})();
