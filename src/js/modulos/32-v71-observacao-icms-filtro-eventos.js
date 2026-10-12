  /* =====================================================================
     V71 — Aba ICMS: coluna "observacao" logo após base_correta_icms, com
     campo para o usuário digitar. O texto fica guardado por item (chave da
     nota + número do item), vai para o Excel e é salvo/importado junto com
     o diagnóstico (.diagnostico).
     Aba Itens: o filtro ▾ de observacao_evento lista cada evento
     separadamente e mostra somente as notas com o evento selecionado
     (inclusive quando a nota tem mais de um evento); "(sem evento)"
     seleciona os itens sem evento.
     ===================================================================== */
  // observações do usuário: guardadas em filtrosTabelas, que já é salvo/importado com o diagnóstico
  const obsUsuarioV71 = () => filtrosTabelas.__obsUsuarioIcms || (filtrosTabelas.__obsUsuarioIcms = {});
  const chaveObsV71 = row => { const r = row.__src || {}; return (row.chave_nota_fiscal || r.chave_documento || '') + '|' + (row.numero_item || r.numero_item || ''); };
  const valorObsV71 = (k, texto) => { const s = new String(texto || ''); Object.defineProperty(s, '__obsChave', {value: k}); return s; };
  const linhasIcmsV70 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV70(...a).map(row => {
    const x = {}, k = chaveObsV71(row), txt = obsUsuarioV71()[k] || '';
    for (const c of Object.keys(row)){ x[c] = row[c]; if (c === 'base_correta_icms') x.observacao = valorObsV71(k, txt); }
    if (!('observacao' in x)) x.observacao = valorObsV71(k, txt);
    if (row.__src) Object.defineProperty(x, '__src', {value: row.__src, configurable: true, writable: true});
    return x;
  });
  const cellValidacaoV70 = window.cellValidacao;
  window.cellValidacao = function(c, v){
    if (c === 'observacao' && v && v.__obsChave !== undefined)
      return '<input type="text" class="v71-obs" data-obs-chave="' + esc(v.__obsChave) + '" value="' + esc(String(v)) + '" placeholder="Digite uma observação" title="Observação do usuário — salva com o diagnóstico">';
    return cellValidacaoV70(c, v);
  };
  const gravarObsV71 = el => {
    const k = el.dataset.obsChave, t = el.value.trim(), m = obsUsuarioV71();
    if (t) m[k] = t; else delete m[k];
    const cache = cacheTabelas.icms && cacheTabelas.icms.rows;   // mantém o Excel da aba e o filtro ▾ atualizados sem redesenhar
    if (cache) for (const r of cache) if (r.observacao && r.observacao.__obsChave === k) r.observacao = valorObsV71(k, t);
  };
  document.addEventListener('input', e => { const el = e.target.closest && e.target.closest('.v71-obs'); if (el) gravarObsV71(el); });
  document.addEventListener('change', e => { const el = e.target.closest && e.target.closest('.v71-obs'); if (el) gravarObsV71(el); });
  document.addEventListener('keydown', e => { const el = e.target.closest && e.target.closest('.v71-obs'); if (el && e.key === 'Enter'){ e.preventDefault(); el.blur(); } });
  document.head.insertAdjacentHTML('beforeend', '<style>.v71-obs{width:100%;min-width:220px;border:1px solid #b7cbd8;border-radius:4px;padding:5px 7px;font:12px system-ui,-apple-system,Segoe UI,sans-serif;color:#182936;background:#fffdf5}'
    + '.v71-obs:focus{outline:2px solid #92d0f8;border-color:#2877b8;background:#fff}@media print{.v71-obs{border:0;background:none;padding:0}}</style>');

  // Aba Itens: filtro de observacao_evento por evento individual
  const SEM_EVENTO_V71 = '(sem evento)';
  const partesEventoV71 = v => String(v || '').split(' | ').map(s => s.trim()).filter(Boolean);
  const valoresFiltroV70 = window.valoresFiltro;
  window.valoresFiltro = function(table, coluna){
    const f = filtrosTabelas[table], sel = f && f.observacao_evento, rows0 = (cacheTabelas[table] && cacheTabelas[table].rows) || [];
    if (coluna !== 'observacao_evento'){
      if (!Array.isArray(sel) || !sel.length) return valoresFiltroV70(table, coluna);
      // outras colunas: o filtro de evento ativo é traduzido para os textos completos das células
      const set = new Set(sel), exp = [...new Set(rows0.map(r => String(displayValue('observacao_evento', r.observacao_evento) || '').trim())
        .filter(v => { const p = partesEventoV71(v); return p.length ? p.some(x => set.has(x)) : set.has(SEM_EVENTO_V71); }))];
      f.observacao_evento = exp;
      try { return valoresFiltroV70(table, coluna); } finally { f.observacao_evento = sel; }
    }
    const vals = valoresFiltroV70(table, coluna);
    const set = new Set; for (const v of vals) for (const p of partesEventoV71(v)) set.add(p);
    const rows = (cacheTabelas[table] && cacheTabelas[table].rows) || [];
    const lista = [...set].sort((a, b) => a.localeCompare(b, 'pt-BR', {numeric: true}));
    if (rows.some(r => !partesEventoV71(r.observacao_evento).length)) lista.push(SEM_EVENTO_V71);
    return lista;
  };
  const filtrarLinhasV70 = window.filtrarLinhas;
  window.filtrarLinhas = function(rows, tableId){
    const f = filtrosTabelas[tableId], sel = f && f.observacao_evento;
    if (!Array.isArray(sel) || !sel.length) return filtrarLinhasV70(rows, tableId);
    const set = new Set(sel);
    delete f.observacao_evento;
    let out; try { out = filtrarLinhasV70(rows, tableId); } finally { f.observacao_evento = sel; }
    return out.filter(r => { const p = partesEventoV71(r.observacao_evento); return p.length ? p.some(x => set.has(x)) : set.has(SEM_EVENTO_V71); });
  };
