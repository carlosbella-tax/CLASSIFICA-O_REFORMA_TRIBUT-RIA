  /* =====================================================================
     V119 — Aba ICMS: colunas de PIS/COFINS do XML logo depois de
     valor_icms_difal — base_pis_cofins (vBC do PIS; sem ele, vBC da COFINS),
     cst_pis, valor_pis, cst_cofins e valor_cofins. Somente informação do
     XML (sem cálculo nem validação; a validação fica na aba Base de
     PIS/COFINS).
     ===================================================================== */
  const colunasPcV119 = r => ({
    base_pis_cofins: valorGrupo(r, 'PIS', 'vBC') || valorGrupo(r, 'COFINS', 'vBC'),
    cst_pis: String(cstGrupo(r, 'PIS') || ''), valor_pis: valorGrupo(r, 'PIS', 'vPIS'),
    cst_cofins: String(cstGrupo(r, 'COFINS') || ''), valor_cofins: valorGrupo(r, 'COFINS', 'vCOFINS')
  });
  const linhasIcmsV118 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV118(...a).map(row => {
    const r = row.__src; if (!r || 'cst_pis' in row) return row;
    const c = colunasPcV119(r), x = {};
    for (const k of Object.keys(row)){ x[k] = row[k]; if (k === 'valor_icms_difal') Object.assign(x, c); }
    if (!('cst_pis' in x)) Object.assign(x, c);
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    return x;
  });
