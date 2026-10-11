  /* =====================================================================
     V67 — Base abaixo de R$ 0,05 e XML sem valor do imposto: as validações
     que ficariam NÃO VALIDADO passam a VALIDADO (valor irrelevante) e nada
     é recalculado. Vale para PIS, COFINS, ICMS, IPI e IBS/CBS.
     A base considerada é a maior entre a base do XML e a base correta
     calculada (no IPI sem base no XML, o valor do produto).
     ===================================================================== */
  const LIMITE_V67 = 0.05;
  const numV67 = v => typeof v === 'number' && isFinite(v) ? Math.abs(v) : 0;   // textos (ex.: "VALIDADO") não contam como base
  const GRUPOS_V67 = {
    icms: [{nome: 'ICMS', bases: ['base_icms_xml', 'base_correta_icms', 'base_icms_calculada'], valores: ['valor_icms_xml'],
      valid: ['validacao_icms', 'validacao_base_icms'], corretos: ['valor_correto_icms', 'base_correta_icms'], calc: ['base_icms_calculada']}],
    ipi: [{nome: 'IPI', bases: ['base_ipi_xml'], semBaseXml: 'valor_total_produtos', valores: ['valor_ipi_xml'],
      valid: ['validacao_ipi', 'validacao_cst_ipi'], corretos: ['valor_correto_ipi'], calc: []}],
    pc: [
      {nome: 'PIS', bases: ['base_pis_xml', 'base_correta_pis'], valores: ['valor_pis_xml'],
        valid: ['validacao_cst_pis', 'validacao_base_pis', 'validacao_valor_pis', 'validacao_cst_entrada_pis'], corretos: ['base_correta_pis', 'valor_correto_pis'], calc: []},
      {nome: 'COFINS', bases: ['base_cofins_xml', 'base_correta_cofins'], valores: ['valor_cofins_xml'],
        valid: ['validacao_cst_cofins', 'validacao_base_cofins', 'validacao_valor_cofins', 'validacao_cst_entrada_cofins'], corretos: ['base_correta_cofins', 'valor_correto_cofins'], calc: []}],
    ibs: [{nome: 'IBS/CBS', bases: ['base_ibs_cbs_xml', 'base_correta_ibs_cbs', 'base_ibs_cbs_calculada'], valores: ['valor_ibs_total', 'valor_cbs'],
      valid: ['validacao_cst_ibs_cbs', 'validacao_base_ibs_cbs', 'validacao_ibs', 'validacao_cbs'], corretos: ['base_correta_ibs_cbs', 'valor_correto_ibs', 'valor_correto_cbs'], calc: []}]
  };
  const naoValV67 = v => /^(INCORRETO|NÃO VALIDADO)/.test(String(v || ''));
  function aplicarV67(o, grupos){
    for (const g of grupos){
      if (!g.valid.some(k => naoValV67(o[k]))) continue;                    // nada a corrigir neste imposto
      if (g.valores.some(k => numV67(o[k]) >= 0.005)) continue;              // o XML traz valor do imposto
      let base = Math.max(0, ...g.bases.map(k => numV67(o[k])));
      if (g.semBaseXml && numV67(o[g.bases[0]]) < 0.005) base = Math.max(base, numV67(o[g.semBaseXml]));
      if (arred(base) >= LIMITE_V67) continue;
      const motivo = 'VALIDADO (base de ' + g.nome + ' de ' + brl(arred(base)) + ', abaixo de R$ 0,05, e sem valor no XML — valor irrelevante)';
      for (const k of g.valid) if (naoValV67(o[k])) o[k] = motivo;
      for (const k of g.corretos) if (k in o) o[k] = 0;
      for (const k of g.calc) if (k in o && typeof o[k] === 'number') o[k] = 'VALIDADO';
    }
    return o;
  }
  const copiaV67 = o => { const x = Object.assign({}, o); if (o && o.__src) Object.defineProperty(x, '__src', {value: o.__src, configurable: true, writable: true}); return x; };
  const linhasIcmsV66 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV66().map(row => aplicarV67(row, GRUPOS_V67.icms));
  const linhaIpiV66 = window.linhaIpi;
  window.linhaIpi = r => aplicarV67(copiaV67(linhaIpiV66(r)), GRUPOS_V67.ipi);
  const linhasPisCofinsV66 = window.linhasPisCofins;
  window.linhasPisCofins = () => linhasPisCofinsV66().map(row => aplicarV67(row, GRUPOS_V67.pc));
  const linhaIbsCbsV66 = linhaIbsCbs;
  linhaIbsCbs = r => aplicarV67(copiaV67(linhaIbsCbsV66(r)), GRUPOS_V67.ibs);
  window.linhasIbsCbsTabela = () => linhasIbsCbsTab();   // acesso de leitura para os testes
  for (const k of ['validacao_icms', 'validacao_base_icms', 'validacao_ipi', 'validacao_base_pis', 'validacao_valor_pis', 'validacao_base_cofins', 'validacao_valor_cofins', 'validacao_base_ibs_cbs', 'validacao_ibs', 'validacao_cbs'])
    if (OBS_VAL[k]) OBS_VAL[k] += ' Base abaixo de R$ 0,05 sem valor no XML: VALIDADO (valor irrelevante).';
