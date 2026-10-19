  /* =====================================================================
     V114 — Aba Base de PIS/COFINS (pedido de 19/10/2026): depois do
     valor do ICMS (valor_icms_xml e valor_icms_difal, que a V77 mantém juntos) entram valor_frete, valor_seguro, valor_desconto,
     valor_outras_despesas, valor_ii e valor_ipi, com os MESMOS valores da aba
     ICMS (inclusive os ajustes de lá, ex.: Simples opção 3 — outras despesas
     lançadas como IPI). Item que não está na aba ICMS: valores do XML.
     ===================================================================== */
  const COLS_V114 = ['valor_frete', 'valor_seguro', 'valor_desconto', 'valor_outras_despesas', 'valor_ii', 'valor_ipi'];
  const doXmlV114 = r => ({
    valor_frete: num(campoGrupo(r, 'prod', 'vFrete')), valor_seguro: num(campoGrupo(r, 'prod', 'vSeg')),
    valor_desconto: num(campoGrupo(r, 'prod', 'vDesc')), valor_outras_despesas: num(campoGrupo(r, 'prod', 'vOutro')),
    valor_ii: valorGrupo(r, 'II', 'vII'), valor_ipi: valorGrupo(r, 'IPI', 'vIPI')
  });
  const linhasPisCofinsV113 = window.linhasPisCofins;
  window.linhasPisCofins = (...a) => {
    const rows = linhasPisCofinsV113(...a);
    if (!rows.length || COLS_V114.every(c => c in rows[0])) return rows;
    let icms = new Map();
    try { icms = new Map(window.linhasIcms().filter(x => x && x.__src).map(x => [x.__src, x])); } catch(e){}
    return rows.map(row => {
      const r = row.__src, ri = r && icms.get(r);
      const v = ri ? Object.fromEntries(COLS_V114.map(c => [c, num(ri[c])])) : (r ? doXmlV114(r) : Object.fromEntries(COLS_V114.map(c => [c, 0])));
      const x = {}, apos = 'valor_icms_difal' in row ? 'valor_icms_difal' : 'valor_icms_xml';
      for (const k of Object.keys(row)){ if (COLS_V114.includes(k)) continue; x[k] = row[k]; if (k === apos) Object.assign(x, v); }
      if (!('valor_frete' in x)) Object.assign(x, v);
      for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
      return x;
    });
  };
