  /* =====================================================================
     V81 — Filtro ▾ da coluna "observacao" (abas ICMS, IPI, Base de
     PIS/COFINS e Base de IBS/CBS): além dos textos digitados, a lista traz
     "(sem observação)", para selecionar também os itens sem texto.
     ===================================================================== */
  const SEM_OBS_V81 = '(sem observação)';
  const textoObsV81 = v => String(displayValue('observacao', v) || '').trim();
  const valoresFiltroV80 = window.valoresFiltro;
  window.valoresFiltro = function(table, coluna){
    const vals = valoresFiltroV80(table, coluna);
    if (coluna !== 'observacao') return vals;
    const rows = (cacheTabelas[table] && cacheTabelas[table].rows) || [];
    const lista = vals.filter(v => v !== SEM_OBS_V81);
    if (rows.some(r => !textoObsV81(r.observacao)) || ((filtrosTabelas[table] || {}).observacao || []).includes(SEM_OBS_V81)) lista.push(SEM_OBS_V81);
    return lista;
  };
  const filtrarLinhasV80 = window.filtrarLinhas;
  window.filtrarLinhas = function(rows, tableId){
    const f = filtrosTabelas[tableId], sel = f && f.observacao;
    if (!Array.isArray(sel) || !sel.length) return filtrarLinhasV80(rows, tableId);
    const set = new Set(sel);
    delete f.observacao;
    let out; try { out = filtrarLinhasV80(rows, tableId); } finally { f.observacao = sel; }
    return out.filter(r => { const t = textoObsV81(r.observacao); return t ? set.has(t) : set.has(SEM_OBS_V81); });
  };
