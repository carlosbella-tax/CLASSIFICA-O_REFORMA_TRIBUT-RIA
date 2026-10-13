  /* =====================================================================
     V93 — Uso e consumo: aba Itens, aba ICMS, demais abas e Dashboard
     - Aba Itens: coluna uso_e_consumo logo depois de cfop ("USO E CONSUMO"
       quando o XML tem IPI e o IPI compõe a base de ICMS). Nas compras de uso
       e consumo o cfop é 1556 (dentro do estado) ou 2556 (fora do estado).
     - Abas de impostos: a coluna uso_e_consumo passa a ficar logo depois de cfop.
     - Compra de uso e consumo (ENTRADA):
       · aba ICMS: impostos do XML aparecem, sem validação (tudo VALIDADO, nada
         recalculado) e a observação recebe "USO E CONSUMO" (e "CST informado
         divergente do uso" quando a CST do ICMS é tributada);
       · abas ICMS ST, IPI, Base de PIS/COFINS e Base de IBS/CBS: o item não
         entra (nenhuma informação de imposto segue para as outras abas);
       · Dashboard e apresentação: o item conta só pelo valor dos produtos,
         sem nenhum valor de imposto.
     ===================================================================== */
  const TXT_UC_V93 = 'USO E CONSUMO';
  const moverUsoV93 = (row, depois = 'cfop') => {
    if (!row || !('uso_e_consumo' in row) || !(depois in row)) return row;
    const x = {};
    for (const c of Object.keys(row)){ if (c === 'uso_e_consumo') continue; x[c] = row[c]; if (c === depois) x.uso_e_consumo = row.uso_e_consumo; }
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    return x;
  };
  const comUsoItensV93 = (row, r) => {
    if (!row || 'uso_e_consumo' in row) return row;
    const v = r && !r.dados_nfse && (r.__cfopUsoV93 || usoConsumoV90(r)) ? TXT_UC_V93 : '', x = {};
    for (const c of Object.keys(row)){ x[c] = row[c]; if (c === 'cfop') x.uso_e_consumo = v; }
    if (!('uso_e_consumo' in x)) x.uso_e_consumo = v;
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    return x;
  };

  /* ---------- trocas temporárias de state.items ---------- */
  function trocarItensV93(lista, fn){
    const ant = state.items; if (lista === ant) return fn();
    state.items = lista;
    try { return fn(); } finally { state.items = ant; }
  }
  // demais abas de impostos: sem as compras de uso e consumo
  const semUsoConsumoV93 = fn => { const l = state.items, f = l.filter(r => !compraUsoConsumoV92(r)); return trocarItensV93(f.length === l.length ? l : f, fn); };
  // Dashboard/apresentação: a compra de uso e consumo vira um item sem grupos de imposto (só o valor dos produtos)
  const CLONES_V93 = new WeakMap;
  const semImpostoV93 = r => {
    let c = CLONES_V93.get(r); if (c) return c;
    c = {};
    for (const k of Object.keys(r)) if (!/^item_det_imposto_/i.test(k)) c[k] = r[k];
    c.cfop = cfopUsoConsumoV92(r); c.descricao_cfop = descCfop(c.cfop, r.cfop_xml);
    Object.defineProperty(c, '__cfopUsoV93', {value: c.cfop, configurable: true, writable: true});
    CLONES_V93.set(r, c); return c;
  };
  const dashSemImpostoV93 = fn => { const l = state.items; let mudou = false; const f = l.map(r => compraUsoConsumoV92(r) ? (mudou = true, semImpostoV93(r)) : r); return trocarItensV93(mudou ? f : l, fn); };

  // CFOP 1556/2556 também nos itens sem imposto do Dashboard
  const aplicarCfopV92 = aplicarCfop;
  aplicarCfop = function(){
    const x = aplicarCfopV92.apply(this, arguments);
    for (const r of state.items) if (r && r.__cfopUsoV93 && r.cfop !== r.__cfopUsoV93){ r.cfop = r.__cfopUsoV93; r.descricao_cfop = descCfop(r.cfop, r.cfop_xml); }
    return x;
  };

  // quadro ICMS do Dashboard: a compra de uso e consumo aparece no CFOP 1556/2556 só com o valor dos produtos (base e ICMS zerados)
  const IMP_ICMS_V93 = IMPOSTOS.find(i => i.id === 'icms');
  if (IMP_ICMS_V93){ const temV92 = IMP_ICMS_V93.tem; IMP_ICMS_V93.tem = r => !!(r && r.__cfopUsoV93) || temV92(r); }

  const ABAS_SEM_USO_V93 = new Set(['icmsst', 'ipi', 'piscofins', 'ibscbs']);
  const comFiltroV92 = comFiltro;
  comFiltro = function(aba, fn){
    if (ABAS_SEM_USO_V93.has(aba)) return comFiltroV92(aba, () => semUsoConsumoV93(fn));
    if (aba === 'dashboard') return comFiltroV92(aba, () => dashSemImpostoV93(fn));
    return comFiltroV92(aba, fn);
  };
  const dadosApresentacaoV92 = dadosApresentacao;
  dadosApresentacao = function(){ return dashSemImpostoV93(() => dadosApresentacaoV92.apply(this, arguments)); };
  const coletarInconsistenciasV92 = coletarInconsistencias;
  coletarInconsistencias = function(){ return dashSemImpostoV93(() => coletarInconsistenciasV92.apply(this, arguments)); };

  /* ---------- abas de impostos ---------- */
  const linhasIcmsV92 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV92(...a).map(row0 => {
    const row = moverUsoV93(row0), r = row.__src;
    if (!compraUsoConsumoV92(r) || !('observacao' in row)) return row;
    const k = chaveObsV71(row); if (obsUsuarioV71('icms')[k] !== undefined) return row;
    row.observacao = valorObsV71(k, TXT_UC_V93 + (tribIcmsV92(r) ? ' | ' + OBS_CST_USO_V92 : ''), 'icms');
    return row;
  });
  const linhasIcmsStV92 = window.linhasIcmsSt;
  window.linhasIcmsSt = (...a) => semUsoConsumoV93(() => linhasIcmsStV92(...a)).map(row => moverUsoV93(row));
  const linhasIpiV92 = window.linhasIpi;
  window.linhasIpi = (...a) => semUsoConsumoV93(() => linhasIpiV92(...a)).map(row => moverUsoV93(row));
  const linhasPisCofinsV92 = window.linhasPisCofins;
  window.linhasPisCofins = (...a) => semUsoConsumoV93(() => linhasPisCofinsV92(...a)).map(row => moverUsoV93(row));
  const linhaIbsCbsV92 = linhaIbsCbs;
  linhaIbsCbs = r => moverUsoV93(linhaIbsCbsV92(r));
  const linhasIbsCbsTabelaV92 = window.linhasIbsCbsTabela;
  window.linhasIbsCbsTabela = (...a) => semUsoConsumoV93(() => linhasIbsCbsTabelaV92(...a));

  /* ---------- aba Itens: coluna uso_e_consumo depois de cfop ---------- */
  const itensComIcmsV92 = window.linhasItensComIcms;
  window.linhasItensComIcms = function(){ const fonte = state.items; return itensComIcmsV92.apply(this, arguments).map((row, i) => comUsoItensV93(row, fonte[i])); };
  const itensVisaoV92 = linhasItensVisao;
  linhasItensVisao = function(lista){ return itensVisaoV92.apply(this, arguments).map((row, i) => comUsoItensV93(row, lista[i])); };

  OBS_VAL.validacao_base_icms += ' Compra de uso e consumo: impostos do XML sem validação (VALIDADO), observação "USO E CONSUMO"; o item não segue para as demais abas de impostos e entra no Dashboard só pelo valor dos produtos.';
