  /* =====================================================================
     V121 — Aba ICMS ST: coluna "quantidade" (quantidade comercial do item,
     qCom do XML) logo antes de valor_total_produtos.
     ===================================================================== */
  const linhasIcmsStV120 = window.linhasIcmsSt;
  window.linhasIcmsSt = (...a) => linhasIcmsStV120(...a).map(row => {
    const r = row.__src; if (!r || 'quantidade' in row) return row;
    const q = num(r.quantidade || campoGrupo(r, 'prod', 'qCom')), x = {};
    for (const k of Object.keys(row)){ if (k === 'valor_total_produtos') x.quantidade = q; x[k] = row[k]; }
    if (!('quantidade' in x)) x.quantidade = q;
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    return x;
  });
