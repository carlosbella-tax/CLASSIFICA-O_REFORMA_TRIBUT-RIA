  /* =====================================================================
     V73 — Aba Base de IBS/CBS: a coluna valor_total_produtos (valor total
     dos produtos do item) passa a ficar logo após ncm. Vale para a tela,
     o filtro, o Excel e a impressão.
     ===================================================================== */
  const linhaIbsCbsV72 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV72(r);
    if (!o || !('ncm' in o)) return o;
    const v = 'valor_total_produtos' in o ? o.valor_total_produtos : num(r && r.valor_item), x = {};
    for (const k of Object.keys(o)){ if (k === 'valor_total_produtos') continue; x[k] = o[k]; if (k === 'ncm') x.valor_total_produtos = v; }
    for (const p of ['__src', '__idx']) if (o[p] !== undefined) Object.defineProperty(x, p, {value: o[p], configurable: true, writable: true});
    return x;
  };
