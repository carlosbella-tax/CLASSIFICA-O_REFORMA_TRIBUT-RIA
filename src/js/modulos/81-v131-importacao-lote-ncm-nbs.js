/* V131 — Importacao local em lote de NCM e NBS por planilha Excel/CSV. */
/* V133 — Campo de envio identificado como UPLOAD. */
(function(){
  const normalizarCabecalho=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/gi,'').toUpperCase();
  const valor=(row,names)=>{const keys=Object.keys(row);for(const n of names){const k=keys.find(x=>normalizarCabecalho(x)===n);if(k&&row[k]!==undefined)return String(row[k]).trim()}return ''};
  const decodificar=s=>String(s||'').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  const coluna=ref=>{let n=0;for(const c of String(ref).replace(/\d/g,''))n=n*26+c.charCodeAt(0)-64;return n-1};
  async function lerXlsx(file){
    if(!window.JSZip)throw new Error('Leitor de planilha indisponível. Atualize a página e tente novamente.');
    const zip=await window.JSZip.loadAsync(file), shared=zip.file('xl/sharedStrings.xml'), strings=[];
    if(shared){const xml=new DOMParser().parseFromString(await shared.async('text'),'text/xml');xml.querySelectorAll('si').forEach(n=>strings.push([...n.querySelectorAll('t')].map(x=>x.textContent).join('')));}
    const target=Object.keys(zip.files).find(n=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(n));if(!target)throw new Error('A planilha não possui uma aba com dados.');
    const xml=new DOMParser().parseFromString(await zip.file(target).async('text'),'text/xml'), lines=[];
    xml.querySelectorAll('sheetData row').forEach(r=>{const row=[];r.querySelectorAll('c').forEach(c=>{let v=c.querySelector('v')?.textContent||'',t=c.getAttribute('t');if(t==='s')v=strings[+v]||'';if(t==='inlineStr')v=c.querySelector('is')?.textContent||'';row[coluna(c.getAttribute('r'))]=decodificar(v);});lines.push(row)});
    return lines;
  }
  async function lerArquivo(file){
    if(/\.csv$/i.test(file.name)){const text=await file.text(),sep=text.includes(';')?';':',';return text.split(/\r?\n/).filter(Boolean).map(x=>x.split(sep).map(y=>y.trim().replace(/^"|"$/g,'')));}
    if(!/\.xlsx$/i.test(file.name))throw new Error('Use uma planilha .xlsx ou .csv.');return lerXlsx(file);
  }
  function classificar(rows){
    const [heads,...data]=rows;if(!heads||!data.length)throw new Error('A planilha deve conter cabeçalho e pelo menos uma linha.');
    const resultado=[];
    data.forEach((values,index)=>{const row=Object.fromEntries(heads.map((h,i)=>[h,values[i]||'']));let ncm=valor(row,['NCM','CODIGONCM']),nbs=valor(row,['NBS','CODIGONBS']),descricao=valor(row,['DESCRICAO','DESCRICAODOITEM','DESCRICAODOSERVICO']);
      if(ncm){ncm=ncm.replace(/\D/g,'').padStart(8,'0');const ref=typeof window.tipiNcm==='function'?window.tipiNcm(ncm):null;resultado.push({linha:index+2,tipo:'NCM',codigo:ncm,descricao:descricao||ref?.descricao||'',validacao:ref?'VALIDADO — NCM localizado na TIPI':'ANALISAR — NCM não localizado na TIPI',cst_sugerido:valor(row,['CST','CSTSUGERIDO'])||'Conforme enquadramento',aliquota_sugerida:valor(row,['ALIQUOTA','ALIQUOTASUGERIDA'])||'Conforme LC 214/2025',reducao_sugerida:valor(row,['REDUCAO','REDUCAOSUGERIDA'])||'Conforme enquadramento',cclasstrib_sugerida:valor(row,['CCLASSTRIB','CCLASSTRIBSUGERIDA'])||'A validar no Classificador',anexo:valor(row,['ANEXO'])||'A validar'});}
      if(nbs){const ok=/^\d\.\d{4}\.\d{2}\.\d{2}$/.test(nbs);resultado.push({linha:index+2,tipo:'NBS',codigo:nbs,descricao,validacao:ok?'VALIDADO — formato NBS reconhecido':'ANALISAR — informe NBS no padrão 0.0000.00.00',cst_sugerido:valor(row,['CST','CSTSUGERIDO'])||'Conforme enquadramento',aliquota_sugerida:valor(row,['ALIQUOTA','ALIQUOTASUGERIDA'])||'Conforme LC 214/2025',reducao_sugerida:valor(row,['REDUCAO','REDUCAOSUGERIDA'])||'Conforme enquadramento',cclasstrib_sugerida:valor(row,['CCLASSTRIB','CCLASSTRIBSUGERIDA'])||'A validar no Classificador',anexo:valor(row,['ANEXO'])||'A validar'});}
    });
    if(!resultado.length)throw new Error('Não encontrei colunas NCM ou NBS. Use os modelos disponibilizados.');return resultado;
  }
  let lote=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){const out=document.getElementById('v131-result');if(!lote.length){out.innerHTML='<p class="hint">Importe uma planilha para validar os códigos e preparar a exportação.</p>';return}out.innerHTML='<p class="hint"><b>'+lote.length+'</b> código(s) processado(s) localmente. A tela mostra os primeiros '+Math.min(500,lote.length)+' registros; todos permanecem disponíveis na exportação. A classificação fiscal definitiva depende dos dados do documento e do enquadramento na LC 214/2025.</p><div class="table-wrap"><table><thead><tr><th>Tipo</th><th>Código</th><th>Descrição</th><th>Validação</th><th>CST sugerido</th><th>Alíquota sugerida</th><th>Redução sugerida</th><th>cClassTrib sugerida</th><th>Anexo</th></tr></thead><tbody>'+lote.slice(0,500).map(x=>'<tr><td>'+esc(x.tipo)+'</td><td>'+esc(x.codigo)+'</td><td>'+esc(x.descricao)+'</td><td>'+esc(x.validacao)+'</td><td>'+esc(x.cst_sugerido)+'</td><td>'+esc(x.aliquota_sugerida)+'</td><td>'+esc(x.reducao_sugerida)+'</td><td>'+esc(x.cclasstrib_sugerida)+'</td><td>'+esc(x.anexo)+'</td></tr>').join('')+'</tbody></table></div>'}
  function baixarModelo(tipo){const h=tipo==='NCM'?['NCM','Descrição','CST sugerido','Alíquota sugerida','Redução sugerida','cClassTrib sugerida','Anexo']:['NBS','Descrição','CST sugerido','Alíquota sugerida','Redução sugerida','cClassTrib sugerida','Anexo'];gerarXlsx('modelo_importacao_'+tipo.toLowerCase()+'.xlsx',[['Modelo '+tipo,[Object.fromEntries(h.map(x=>[x,'']))]]]);}
  const tab=document.createElement('button');tab.className='tab';tab.dataset.tab='v131-lote';tab.textContent='Importar NCM / NBS';
  const anchor=document.querySelector('.tab[data-tab="apresentacao"]')||document.querySelector('.tab[data-tab="dashboard"]');anchor.insertAdjacentElement('afterend',tab);
  const panel=document.createElement('section');panel.id='v131-lote';panel.className='panel';panel.innerHTML='<div class="card"><h2>Importação em lote — NCM e NBS</h2><p class="subtle">Carregue uma planilha Excel (.xlsx) ou CSV com as colunas <b>NCM</b> e/ou <b>NBS</b>. Campos opcionais: Descrição, CST sugerido, Alíquota sugerida, Redução sugerida, cClassTrib sugerida e Anexo.</p><div class="actions"><label class="button">UPLOAD<input id="v131-file" type="file" accept=".xlsx,.csv" hidden></label><button type="button" class="secondary" id="v131-model-ncm">Baixar modelo NCM</button><button type="button" class="secondary" id="v131-model-nbs">Baixar modelo NBS</button><button type="button" id="v131-export" disabled>Exportar resultado em Excel</button></div><p id="v131-status" class="status">Aguardando planilha.</p></div><div class="card" id="v131-result"></div>';
  document.getElementById('apresentacao')?.insertAdjacentElement('afterend',panel)||document.querySelector('main.wrap').appendChild(panel);
  /* V131 — A navegação V123 oculta as abas originais; expõe importação e PPTX no painel lateral. */
  const side=document.getElementById('v123-sidebar');
  if(side){const status=side.querySelector('.v123-status');const links=document.createElement('div');links.innerHTML='<div class="v123-side-section">Exportações</div><button class="v123-link" data-v123-tab="v131-lote">Importar NCM / NBS</button><button class="v123-link" data-v123-tab="apresentacao">Baixar .pptx</button>';side.insertBefore(links,status);}
  tab.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));tab.classList.add('active');panel.classList.add('active');const title=document.getElementById('v123-title');if(title)title.textContent='Importação NCM / NBS';render()};
  document.getElementById('v131-model-ncm').onclick=()=>baixarModelo('NCM');document.getElementById('v131-model-nbs').onclick=()=>baixarModelo('NBS');
  const importarPlanilha=async(file,tipoEsperado='')=>{const status=document.getElementById('v131-status');if(!file)return;try{status.textContent='Lendo e validando a planilha localmente...';const processado=classificar(await lerArquivo(file));lote=tipoEsperado?processado.filter(x=>x.tipo===tipoEsperado):processado;if(!lote.length)throw new Error('O arquivo não possui códigos '+tipoEsperado+' para validação.');status.textContent='Planilha '+file.name+' processada com '+lote.length+' código(s) '+(tipoEsperado||'NCM/NBS')+'.';status.className='status ok';document.getElementById('v131-export').disabled=false;render();return lote}catch(err){status.textContent=err.message||'Não foi possível ler a planilha.';status.className='status warn';lote=[];render();throw err}};
  window.classificadorImportarPlanilha=importarPlanilha;
  document.getElementById('v131-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';try{await importarPlanilha(file)}catch(_){}};
  document.getElementById('v131-export').onclick=()=>gerarXlsx('classificacao_ncm_nbs_'+new Date().toISOString().slice(0,10)+'.xlsx',[['Classificação NCM NBS',lote]]);
})();
