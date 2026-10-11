  /* =====================================================================
     V25 — desempenho: índice por tag em cada item, detecção de grupos em
     cache, renderização só da aba aberta e campos do cabeçalho sem travar.
     ===================================================================== */
  const IDX = new WeakMap;
  function idx(row){
    let m = IDX.get(row);
    if (!m){
      m = {tags: new Map, keys: [], tem: {}};
      for (const k of Object.keys(row || {})){
        const u = k.toUpperCase(), t = u.slice(u.lastIndexOf('_') + 1);
        m.keys.push(u);
        let a = m.tags.get(t); if (!a) m.tags.set(t, a = []);
        a.push([u, row[k]]);
      }
      IDX.set(row, m);
    }
    return m;
  }
  function cacheTem(row, chave, fn){ const t = idx(row).tem; return chave in t ? t[chave] : (t[chave] = fn()); }
  const ALIAS = {CBS: ['_CBS', '_IBSCBS'], IBS: ['_IBS', '_IBSCBS']};
  const somaTag = (row, tag, teste) => { let s = 0; const a = idx(row).tags.get(tag.toUpperCase()); if (a) for (const [u, v] of a) if (teste(u)) s += num(v); return s; };
  window.valorIcms = (row, tag) => somaTag(row, tag, u => u.includes('_ICMS_'));
  window.valorSt = window.valorIcms;
  window.valorGrupo = (row, grupo, tag) => { const g = grupo.toUpperCase(), al = ALIAS[g] || ['_' + g]; return somaTag(row, tag, u => al.some(x => u.includes(x))); };
  window.campoGrupo = (row, grupo, sufixo) => {
    const g = grupo.toUpperCase(), al = ALIAS[g] || ['_' + g], a = idx(row).tags.get(sufixo.toUpperCase());
    if (a) for (const [u, v] of a) if (al.some(x => u.includes(x))) return v;
    return '';
  };
  window.chavesTributarias = r => idx(r).keys;
  window.temGrupoFiscal = (r, grupo) => cacheTem(r, 'g_' + grupo, () => {
    const u = idx(r).keys, g = grupo.toUpperCase();
    if (g === 'CBS') return u.some(k => k.includes('_CBS') || k.includes('_IBSCBS'));
    if (g === 'IBS') return u.some(k => k.includes('_IBS') || k.includes('_IBSCBS'));
    return u.some(k => k.includes('_' + g));
  });
  window.temIcmsFiscal = r => cacheTem(r, '__icms', () => idx(r).keys.some(k => k.includes('_ICMS') && !k.includes('_ICMSUFDEST')));

  // Renderiza apenas a aba que está aberta; as demais são montadas ao clicar nelas
  const seguro = (nome, fn) => { try { return fn(); } catch(e){ console.error('Erro ao montar ' + nome, e); const st = $('status'); if (st){ st.textContent = 'Erro ao montar ' + nome + ': ' + e.message; st.className = 'status warn'; } } };
  const renderAbaV24 = window.renderAba;
  window.renderAba = function(id){
    if (id === 'items') return seguro('Itens', () => renderItens());
    return seguro(id || 'aba', () => renderAbaV24(id));
  };
  window.render = function(){
    aplicarCfop();
    const ativo = document.querySelector('.tab.active')?.dataset.tab || 'items';
    if (ativo === 'processar') return;
    renderAba(ativo);
  };
  // Nome, CNPJ, mês, ano e regime: atualiza uma única vez depois que a digitação para
  let timerCab = null;
  const CAMPOS_CAB = new Set(['empresa', 'cnpjEmpresa', 'periodo', 'anoPeriodo', 'regimeEmpresa']);
  const aposDigitar = () => { clearTimeout(timerCab); timerCab = setTimeout(() => { if (state.items.length) render(); else seguro('Dashboard', () => renderDashboard()); }, 450); };
  ['input', 'change'].forEach(ev => window.addEventListener(ev, e => {
    if (e.target && CAMPOS_CAB.has(e.target.id)){ e.stopImmediatePropagation(); aposDigitar(); }
  }, true));
  // Troca manual ENTRADAS/SAÍDAS na aba Itens: uma única atualização
  window.addEventListener('change', e => {
    const sel = e.target.closest && e.target.closest('.operation-select'); if (!sel) return;
    e.stopImmediatePropagation();
    const i = Number(sel.dataset.sourceIndex);
    if (Number.isInteger(i) && state.items[i]){ state.items[i].tipo_operacao = sel.value; render(); }
  }, true);

  /* ---------- arrastar e soltar XML em qualquer ponto da tela ---------- */
  let seqTexto = 0;
  function xmlsDeTexto(txt){
    txt = String(txt || '').replace(/^\uFEFF/, '').trim();
    if (!txt.includes('<')) return [];
    const raiz = /<(?:nfeProc|cteProc|procEventoNFe|procEventoCTe|CompNfse|nfseProc)[\s>]/g;
    let partes = txt.split(/(?=<\?xml[\s>])/i).map(x => x.trim()).filter(Boolean);
    partes = partes.flatMap(pt => { const sem = pt.replace(/^<\?xml[^>]*>\s*/i, ''); return (sem.match(raiz) || []).length > 1 ? sem.split(/(?=<(?:nfeProc|cteProc|procEventoNFe|procEventoCTe|CompNfse|nfseProc)[\s>])/).filter(x => x.trim()) : [pt]; });
    return partes.map(pt => { seqTexto++; const ch = (pt.match(/Id="(?:NFe|CTe)?(\d{44})"/) || [])[1];
      return new File([pt], (ch ? 'xml_' + ch : 'xml_arrastado_' + String(seqTexto).padStart(3, '0')) + '.xml', {type: 'text/xml', lastModified: Date.now() + seqTexto}); });
  }
  async function receberSoltura(dt){
    const itens = dt.items, saida = [];
    if (itens && itens.length && itens[0].webkitGetAsEntry){
      const entradas = Array.from(itens).filter(i => i.kind === 'file').map(i => i.webkitGetAsEntry()).filter(Boolean);
      if (entradas.length){ $('status').textContent = 'Lendo arquivos e pastas arrastados...'; for (const en of entradas) await lerEntrada(en, '', saida); }
    }
    if (!saida.length && dt.files && dt.files.length) saida.push(...dt.files);
    if (!saida.length){ const t = dt.getData('text/plain') || dt.getData('text'); if (t) saida.push(...xmlsDeTexto(t)); }
    if (saida.length){ setFiles(saida); if (!document.querySelector('#load.active')) document.querySelector('.tab[data-tab="load"]').click(); }
  }
  let contDrag = 0;
  window.addEventListener('dragenter', e => { e.preventDefault(); contDrag++; $('drop').classList.add('drag'); });
  window.addEventListener('dragleave', () => { if (--contDrag <= 0){ contDrag = 0; $('drop').classList.remove('drag'); } });
  window.addEventListener('dragover', e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
  window.addEventListener('drop', e => { e.preventDefault(); contDrag = 0; $('drop').classList.remove('drag'); receberSoltura(e.dataTransfer); });
  $('drop').ondrop = null;
  // Ctrl+V de arquivos ou do conteúdo de um XML, com a aba Carregar XMLs aberta
  document.addEventListener('paste', e => {
    if (!$('load').classList.contains('active') || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const cd = e.clipboardData; if (!cd) return;
    if (cd.files && cd.files.length){ e.preventDefault(); setFiles(cd.files); return; }
    const fs = xmlsDeTexto(cd.getData('text')); if (fs.length){ e.preventDefault(); setFiles(fs); }
  });

  /* V30: contagem da aba ICMS ST pelos CFOP de substituição tributária */
  function badgeSt(){ const el = $('icmsStBadge'); if (!el) return; aplicarCfop(); const d = new Set(state.items.filter(ehCfopSt).map(r => r.chave_documento || r.arquivo_origem)).size; el.textContent = d || ''; }
  const badgesV29 = window.atualizarBadgesTributos;
  window.atualizarBadgesTributos = function(){ badgesV29(); badgeSt(); };
  const renderV29 = window.render;
  window.render = function(){ renderV29(); badgeSt(); };
  /* V31: filtro das colunas — campo de pesquisa estável, "Selecionar todos" sobre os resultados e aplicar com Enter */
  window.abrirFiltro = function(botao){
    const table = botao.dataset.filterTable, coluna = botao.dataset.filterColumn, valores = valoresFiltro(table, coluna),
      atual = (filtrosTabelas[table] || {})[coluna] || [], selecionados = new Set(atual.length ? atual : valores), pop = $('excelFilterPopover');
    filtroAberto = {table, coluna, valores, selecionados, pop};
    let busca = '', mexeu = false;
    pop.innerHTML = '<h4>Filtrar: ' + esc(coluna) + '</h4><input type="search" data-filter-search placeholder="Digite para pesquisar (parte do texto)">'
      + '<label class="filter-choice"><input type="checkbox" data-filter-all> <b data-all-txt>Selecionar todos</b></label><div class="filter-summary"></div><div class="filter-list"></div>'
      + '<div class="filter-actions"><button type="button" class="secondary" data-filter-clear>Limpar filtro</button><span><button type="button" class="secondary" data-filter-cancel>Cancelar</button> <button type="button" data-filter-apply>Aplicar</button></span></div>';
    const campo = pop.querySelector('[data-filter-search]'), lista = pop.querySelector('.filter-list'), todos = pop.querySelector('[data-filter-all]'),
      resumo = pop.querySelector('.filter-summary'), txtTodos = pop.querySelector('[data-all-txt]');
    const visiveis = () => { const b = busca.trim().toLocaleLowerCase('pt-BR'); return b ? valores.filter(v => v.toLocaleLowerCase('pt-BR').includes(b)) : valores; };
    const atualizarTopo = vis => {
      todos.checked = vis.length > 0 && vis.every(v => selecionados.has(v));
      txtTodos.textContent = busca.trim() ? 'Selecionar todos os resultados (' + vis.length + ')' : 'Selecionar todos';
      resumo.textContent = busca.trim() ? vis.length + ' resultado(s) para "' + busca.trim() + '" — Aplicar filtra só por eles' : selecionados.size + ' de ' + valores.length + ' valor(es) selecionado(s)';
    };
    const desenharLista = () => {
      const vis = visiveis(), MAX = 3000;
      lista.innerHTML = vis.slice(0, MAX).map(v => '<label class="filter-choice"><input type="checkbox" data-filter-value="' + encodeURIComponent(v) + '"' + (selecionados.has(v) ? ' checked' : '') + '> ' + esc(v) + '</label>').join('') || '<span class="small">Nenhum valor encontrado.</span>';
      atualizarTopo(vis);
    };
    lista.onchange = e => { const x = e.target.closest('[data-filter-value]'); if (!x) return; mexeu = true; const v = decodeURIComponent(x.dataset.filterValue); x.checked ? selecionados.add(v) : selecionados.delete(v); atualizarTopo(visiveis()); };
    todos.onchange = () => { mexeu = true; visiveis().forEach(v => todos.checked ? selecionados.add(v) : selecionados.delete(v)); desenharLista(); };
    campo.oninput = () => { busca = campo.value; desenharLista(); };
    const aplicar = () => {
      let sel = selecionados;
      if (busca.trim()){ const vis = visiveis(); sel = new Set(mexeu ? vis.filter(v => selecionados.has(v)) : vis); }
      if (!sel.size){ alert('Nenhum valor selecionado para filtrar.'); return; }
      filtrosTabelas[table] = filtrosTabelas[table] || {};
      if (sel.size === valores.length) delete filtrosTabelas[table][coluna]; else filtrosTabelas[table][coluna] = [...sel];
      fecharFiltro(); redesenharFiltro(table);
    };
    campo.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); aplicar(); } };
    pop.querySelector('[data-filter-apply]').onclick = aplicar;
    pop.querySelector('[data-filter-cancel]').onclick = fecharFiltro;
    pop.querySelector('[data-filter-clear]').onclick = () => { if (filtrosTabelas[table]) delete filtrosTabelas[table][coluna]; fecharFiltro(); redesenharFiltro(table); };
    desenharLista();
    const rect = botao.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 340)) + 'px';
    pop.style.top = Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 470)) + 'px';
    pop.hidden = false;
    campo.focus();
  };
  // filtro mais rápido (conjuntos) e redesenho da aba aberta (antes, ICMS ST, PIS/COFINS e IBS/CBS não redesenhavam)
  window.filtrarLinhas = function(rows, tableId){
    const ativos = Object.entries(filtrosTabelas[tableId] || {}).filter(([, v]) => Array.isArray(v) && v.length).map(([c, v]) => [c, new Set(v)]);
    if (!ativos.length) return rows;
    return rows.filter(r => ativos.every(([c, set]) => set.has(String(displayValue(c, r[c]) || '').trim())));
  };
  window.redesenharFiltro = function(tableId){
    const tb = tableId === 'table' ? 'table' : (document.getElementById(tableId + 'Table') ? tableId + 'Table' : tableId);
    if (PAG[tb]) PAG[tb].pagina = 0;
    render();
  };

  /* V32: troca manual do tipo de operação — aplicada a todos os itens da mesma nota */
  window.addEventListener('change', e => {
    const sel = e.target.closest && e.target.closest('.v32-tipo'); if (!sel) return;
    e.stopImmediatePropagation();
    const item = state.items[Number(sel.dataset.tipoIdx)]; if (!item) return;
    const chave = item.chave_documento, alvo = chave ? state.items.filter(x => x.chave_documento === chave) : [item];
    for (const x of alvo){
      if (sel.value){ x.tipo_operacao = sel.value; Object.defineProperty(x, '__tipoManual', {value: true, configurable: true, writable: true, enumerable: false}); }
      else { delete x.tipo_operacao; delete x.__tipoManual; }
    }
    const st = $('status'); if (st){ st.textContent = (sel.value ? 'Nota ' + (item.numero_documento || '') + ' alterada para ' + sel.value : 'Nota ' + (item.numero_documento || '') + ' voltou para a classificação automática pelo CNPJ') + ' (' + alvo.length + ' item(ns)).'; st.className = 'status ok'; }
    render();
  }, true);
  // as linhas das abas fiscais guardam o item de origem (para a edição do tipo de operação)
  const comOrigem = fn => r => { const o = fn(r); if (o && typeof o === 'object') Object.defineProperty(o, '__src', {value: r, configurable: true, writable: true}); return o; };
  window.linhaFiscal = comOrigem(window.linhaFiscal);
  window.linhaIcmsSt = comOrigem(window.linhaIcmsSt);
  window.linhaIpi = comOrigem(window.linhaIpi);
  linhaIbsCbs = comOrigem(linhaIbsCbs);

