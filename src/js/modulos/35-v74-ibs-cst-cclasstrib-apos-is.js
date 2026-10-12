  /* =====================================================================
     V74 — Aba Base de IBS/CBS: as colunas cclasstrib e cst_ibs_cbs passam
     a ficar logo após valor_imposto_seletivo_is (fim dos componentes da
     base). Vale para a tela, o filtro, o Excel e a impressão.
     ===================================================================== */
  const MOVER_V74 = ['cclasstrib', 'cst_ibs_cbs'];
  const linhaIbsCbsV73 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV73(r);
    if (!o || !('valor_imposto_seletivo_is' in o)) return o;
    const x = {};
    for (const k of Object.keys(o)){
      if (MOVER_V74.includes(k)) continue;
      x[k] = o[k];
      if (k === 'valor_imposto_seletivo_is') for (const m of MOVER_V74) if (m in o) x[m] = o[m];
    }
    for (const p of ['__src', '__idx']) if (o[p] !== undefined) Object.defineProperty(x, p, {value: o[p], configurable: true, writable: true});
    return x;
  };
