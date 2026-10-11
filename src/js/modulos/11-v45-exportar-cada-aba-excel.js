  /* =====================================================================
     V45 — Exportar cada aba em Excel e salvar/importar o diagnóstico completo
     ===================================================================== */
  function gerarXlsx(nomeArquivo, sheets){
    const usados = new Set;
    sheets = sheets.filter(s => s[1] && s[1].length).map(([n, rows]) => {
      let nome = String(n).replace(/[\\\/\?\*\[\]:]/g, '-').slice(0, 31), base = nome, i = 2;
      while (usados.has(nome)) nome = (base.slice(0, 28) + ' ' + i++);
      usados.add(nome); return [nome, rows];
    });
    if (!sheets.length){ alert('Não há dados nesta aba para exportar.'); return; }
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + xe(s[0]) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '</Relationships>']
    ];
    sheets.forEach((s, i) => files.push(['xl/worksheets/sheet' + (i + 1) + '.xml', sheet(s[1])]));
    baixarBlob(zip(files), nomeArquivo);
  }
  function baixarBlob(blob, nome){
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
  }
  const sufixoArq = () => { const c = String($('cnpjEmpresa').value || '').replace(/\D/g, ''), d = new Date(); return (c ? c + '_' : '') + d.toISOString().slice(0, 10); };
  // tabela HTML → linhas (para exportar quadros do Dashboard)
  function tabelaParaLinhas(tb){
    const grade = [], heads = [...tb.querySelectorAll('thead tr')];
    heads.forEach((tr, ri) => { let ci = 0; grade[ri] = grade[ri] || [];
      for (const th of tr.children){ while (grade[ri][ci] !== undefined) ci++; const cs = th.colSpan || 1, rs = th.rowSpan || 1, t = th.textContent.trim();
        for (let r = 0; r < rs; r++) for (let c = 0; c < cs; c++){ grade[ri + r] = grade[ri + r] || []; grade[ri + r][ci + c] = t; } ci += cs; } });
    const ncol = Math.max(0, ...grade.map(g => g.length));
    const nomes = []; for (let c = 0; c < ncol; c++){ const partes = [...new Set(grade.map(g => g[c]).filter(Boolean))]; let n = partes.join(' - ') || 'Coluna ' + (c + 1); while (nomes.includes(n)) n += ' '; nomes.push(n); }
    const linhas = [];
    for (const tr of tb.querySelectorAll('tbody tr')){
      const o = {}; let ci = 0;
      for (const td of tr.children){ const cs = td.colSpan || 1; const t = td.innerText.replace(/\s*\n\s*/g, ' · ').trim(); o[nomes[ci] || 'Coluna ' + (ci + 1)] = t; for (let c = 1; c < cs; c++) o[nomes[ci + c] || 'Coluna ' + (ci + c + 1)] = ''; ci += cs; }
      if (Object.values(o).some(v => v !== '')) linhas.push(o);
    }
    return linhas;
  }
  const ABA_TABELA = {items: 'table', icms: 'icmsTable', icmsst: 'icmsStTable', ipi: 'ipiTable', piscofins: 'pisCofinsTable', ibscbs: 'ibsCbsTable', events: 'eventsTable'};
  const NOME_ABA = {items: 'Itens', icms: 'ICMS', icmsst: 'ICMS ST', ipi: 'IPI', piscofins: 'Base de PIS-COFINS', ibscbs: 'Base de IBS-CBS', events: 'Eventos', dashboard: 'Dashboard'};
  function exportarAba(aba){
    if (!state.items.length && !state.events.length){ alert('Processe os XMLs ou importe um diagnóstico salvo antes de exportar.'); return; }
    if (aba === 'dashboard'){
      const ativo = document.querySelector('.tab.active')?.dataset.tab;
      if (ativo !== 'dashboard') renderDashboard();
      const sheets = [];
      for (const card of document.querySelectorAll('#dashboard .dashboard-card, #dashboard .v23-sec')){
        if (card.offsetParent === null && !card.closest('#dashPane')) continue;
        const titulo = (card.querySelector('h3')?.textContent || 'Quadro').trim();
        card.querySelectorAll('table').forEach((tb, i) => { const l = tabelaParaLinhas(tb); if (l.length) sheets.push([titulo + (i ? ' ' + (i + 1) : ''), l]); });
      }
      gerarXlsx('dashboard_' + sufixoArq() + '.xlsx', sheets); return;
    }
    const tid = ABA_TABELA[aba];
    if (!cacheTabelas[tid === 'table' ? 'table' : tid.replace(/Table$/, '')] && !cacheTabelas[tid]) renderAba(aba);
    const chave = cacheTabelas[tid === 'table' ? 'table' : tid.replace(/Table$/, '')] ? (tid === 'table' ? 'table' : tid.replace(/Table$/, '')) : tid;
    const rows = filtrarLinhas(cacheTabelas[chave]?.rows || [], chave);
    const limpas = rows.map(r => { const o = {}; for (const k of Object.keys(r)) o[k] = r[k]; return o; });
    gerarXlsx(NOME_ABA[aba].toLowerCase().replace(/[^a-z0-9]+/gi, '_') + '_' + sufixoArq() + '.xlsx', [[NOME_ABA[aba], limpas]]);
  }
  // barra com o botão em cada aba
  for (const aba of Object.keys(NOME_ABA)){
    const painel = $(aba); if (!painel) continue;
    const barra = document.createElement('div'); barra.className = 'v45-bar';
    barra.innerHTML = '<button type="button" class="v45-btn" data-exp="' + aba + '">⬇ Exportar ' + (aba === 'dashboard' ? 'Dashboard' : 'esta aba') + ' em Excel</button>'
      + '<span>' + (aba === 'dashboard' ? 'Todos os quadros, um por planilha.' : 'Todas as linhas da aba, respeitando os filtros ativos.') + '</span>'
      + '<button type="button" class="secondary v45-btn2" data-salvar>💾 Salvar diagnóstico completo</button>';
    painel.insertBefore(barra, painel.firstChild);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-exp]'); if (b) exportarAba(b.dataset.exp);
    const s = e.target.closest && e.target.closest('[data-salvar]'); if (s) salvarDiagnostico();
  });

  /* ---------- salvar / importar o diagnóstico completo ---------- */
  const CAMPOS_SALVOS = ['empresa', 'cnpjEmpresa', 'periodo', 'anoPeriodo', 'regimeEmpresa', 'ufOrigem', 'ufDestino'];
  async function salvarDiagnostico(){
    if (!state.items.length && !state.docs.length){ alert('Não há diagnóstico processado para salvar.'); return; }
    const manuais = []; state.items.forEach((r, i) => { if (r.__tipoManual) manuais.push(i); });
    const pacote = {formato: 'DIAGNOSTICO-OPERACOES-FISCAIS', versao: 45, salvoEm: new Date().toISOString(),
      cabecalho: Object.fromEntries(CAMPOS_SALVOS.map(id => [id, $(id) ? $(id).value : ''])),
      items: state.items, events: state.events, docs: state.docs, errors: state.errors, manuais, filtros: filtrosTabelas};
    const json = JSON.stringify(pacote);
    let blob = new Blob([json], {type: 'application/json'});
    try { if (window.CompressionStream) blob = await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob(); } catch(e){}
    baixarBlob(blob, 'diagnostico_' + sufixoArq() + '.diagnostico');
    const st = $('status'); if (st){ st.textContent = 'Diagnóstico salvo (' + fmtInt(state.items.length) + ' itens). Para reabrir, use "Importar diagnóstico salvo" na aba Carregar XMLs.'; st.className = 'status ok'; }
  }
  async function lerPacote(file){
    const buf = new Uint8Array(await file.arrayBuffer());
    let texto;
    if (buf[0] === 0x1f && buf[1] === 0x8b){
      if (!window.DecompressionStream) throw Error('Este navegador não consegue abrir o arquivo compactado. Use o Chrome ou o Edge.');
      texto = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    } else texto = new TextDecoder('utf-8').decode(buf);
    const p = JSON.parse(texto);
    if (p.formato !== 'DIAGNOSTICO-OPERACOES-FISCAIS') throw Error('O arquivo não é um diagnóstico salvo por este sistema.');
    return p;
  }
  async function importarDiagnostico(file){
    const st = $('status');
    try {
      if (st){ st.textContent = 'Importando diagnóstico salvo...'; st.className = 'status'; }
      const p = await lerPacote(file);
      state.runId++;
      for (const id of CAMPOS_SALVOS) if ($(id) && p.cabecalho && p.cabecalho[id] !== undefined) $(id).value = p.cabecalho[id];
      state.items = p.items || []; state.events = p.events || []; state.docs = p.docs || []; state.errors = p.errors || []; state.files = [];
      (p.manuais || []).forEach(i => { if (state.items[i]) Object.defineProperty(state.items[i], '__tipoManual', {value: true, configurable: true, writable: true}); });
      for (const k of Object.keys(filtrosTabelas)) delete filtrosTabelas[k];
      Object.assign(filtrosTabelas, p.filtros || {});
      Object.keys(PAG).forEach(k => PAG[k].pagina = 0);
      V14.keys = new Set(); V14.pendente = false; V14.duplicadas = 0;
      aplicarCfop();
      $('mDocs').textContent = fmtInt(state.docs.length); $('mItems').textContent = fmtInt(state.items.length); $('mErrors').textContent = fmtInt(state.errors.length); $('mFiles').textContent = '0';
      $('itemBadge').textContent = state.items.length; $('eventBadge').textContent = state.events.length;
      try { atualizarBadgesTributos(); } catch(e){}
      $('download').disabled = !state.docs.length; $('downloadTop').disabled = !state.docs.length; $('pVerDash').disabled = !state.docs.length;
      $('selected').textContent = 'Diagnóstico importado: ' + file.name + ' (salvo em ' + new Date(p.salvoEm).toLocaleString('pt-BR') + ').';
      const msg = 'Diagnóstico importado: ' + fmtInt(state.docs.length) + ' documento(s), ' + fmtInt(state.items.length) + ' item(ns), ' + fmtInt(state.events.length) + ' evento(s).';
      if (st){ st.textContent = msg; st.className = 'status ok'; }
      if ($('pStatus')) $('pStatus').textContent = msg;
      document.querySelector('.tab[data-tab="items"]').click();
    } catch(e){
      console.error(e); alert('Não foi possível importar: ' + e.message);
      if (st){ st.textContent = 'Falha ao importar o diagnóstico: ' + e.message; st.className = 'status warn'; }
    }
  }
  // botões na aba Carregar XMLs
  (function(){
    const acoes = document.querySelector('#load .card .actions') || document.querySelector('#drop .actions');
    const box = document.createElement('div'); box.className = 'v45-diag';
    box.innerHTML = '<b>Diagnóstico salvo</b><span>Salve todo o processamento num único arquivo (.diagnostico) e reabra depois sem precisar dos XMLs.</span>'
      + '<button type="button" data-salvar>💾 Salvar diagnóstico completo</button>'
      + '<button type="button" class="secondary" id="v45Importar">📂 Importar diagnóstico salvo</button><input type="file" id="v45Arquivo" accept=".diagnostico,.json,.gz" hidden>';
    const card = document.querySelector('#load .card');
    card.appendChild(box);
    $('v45Importar').onclick = () => $('v45Arquivo').click();
    $('v45Arquivo').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importarDiagnostico(f); };
  })();
  // arquivo .diagnostico arrastado para a tela também é importado
  const setFilesV44 = window.setFiles;
  window.setFiles = function(fs){
    const lista = Array.from(fs || []), diag = lista.find(f => /\.(diagnostico|gz)$/i.test(f.name || ''));
    if (diag) return importarDiagnostico(diag);
    return setFilesV44(lista);
  };

