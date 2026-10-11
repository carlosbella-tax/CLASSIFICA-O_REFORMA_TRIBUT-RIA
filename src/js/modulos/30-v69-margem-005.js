  /* =====================================================================
     V69 — Margem única de R$ 0,05 em todas as abas: quando a diferença
     entre o XML e o valor/base calculado for de até R$ 0,05 (para mais ou
     para menos), a validação fica VALIDADO e nada é recalculado.
     Se a base ficar validada pela margem, o valor do imposto é conferido
     sobre a base do XML (base × alíquota do XML), também com R$ 0,05.
     Validações de CST (que não comparam valores) não mudam.
     ===================================================================== */
  const MARGEM_V69 = 0.0501;
  const naoValV69 = v => /^(INCORRETO|NÃO VALIDADO)/.test(String(v || ''));
  const okV69 = (a, b) => Math.abs(arred(num(a)) - arred(num(b))) <= MARGEM_V69;
  const textoV69 = d => 'VALIDADO (diferença de ' + brl(Math.abs(arred(d))) + ', dentro da margem de R$ 0,05)';
  // [validação, valor do XML, valor correto, campo calculado opcional]
  const PARES_V69 = {
    icms: {base: ['validacao_base_icms', 'base_icms_xml', 'base_correta_icms', 'base_icms_calculada'], valor: ['validacao_icms', 'valor_icms_xml', 'valor_correto_icms'], aliq: 'aliquota_icms'},
    ipi: {valor: ['validacao_ipi', 'valor_ipi_xml', 'valor_correto_ipi']},
    pis: {base: ['validacao_base_pis', 'base_pis_xml', 'base_correta_pis'], valor: ['validacao_valor_pis', 'valor_pis_xml', 'valor_correto_pis'], aliq: 'aliquota_pis'},
    cofins: {base: ['validacao_base_cofins', 'base_cofins_xml', 'base_correta_cofins'], valor: ['validacao_valor_cofins', 'valor_cofins_xml', 'valor_correto_cofins'], aliq: 'aliquota_cofins'},
    ibs: {base: ['validacao_base_ibs_cbs', 'base_ibs_cbs_xml', 'base_correta_ibs_cbs'], extras: [['validacao_ibs', 'valor_ibs_total', 'valor_correto_ibs'], ['validacao_cbs', 'valor_cbs', 'valor_correto_cbs']]}
  };
  function margemV69(o, p){
    const ajusta = ([kv, kx, kc, kcalc]) => {
      if (!(kv in o) || !naoValV69(o[kv]) || typeof o[kc] !== 'number') return false;
      if (!okV69(o[kx], o[kc])) return false;
      o[kv] = textoV69(num(o[kx]) - o[kc]); o[kc] = 0;
      if (kcalc && typeof o[kcalc] === 'number') o[kcalc] = 'VALIDADO';
      return true;
    };
    const baseOk = p.base ? ajusta(p.base) : false;
    if (p.valor && !ajusta(p.valor) && baseOk && p.aliq && naoValV69(o[p.valor[0]])){
      // base validada pela margem: o valor passa a ser conferido sobre a base do XML
      const [kv, kx, kc] = p.valor, calc = arred(num(o[p.base[1]]) * num(o[p.aliq]) / 100);
      if (okV69(o[kx], calc)){ o[kv] = textoV69(num(o[kx]) - calc) + ' — sobre a base do XML'; if (kc in o) o[kc] = 0; }
    }
    for (const e of p.extras || []) ajusta(e);
    return o;
  }
  const linhasIcmsV68 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV68().map(row => margemV69(row, PARES_V69.icms));
  const linhaIpiV68 = window.linhaIpi;
  window.linhaIpi = r => margemV69(copiaV67(linhaIpiV68(r)), PARES_V69.ipi);
  const linhasPisCofinsV68 = window.linhasPisCofins;
  window.linhasPisCofins = () => linhasPisCofinsV68().map(row => margemV69(margemV69(row, PARES_V69.pis), PARES_V69.cofins));
  const linhaIbsCbsV68 = linhaIbsCbs;
  linhaIbsCbs = r => margemV69(copiaV67(linhaIbsCbsV68(r)), PARES_V69.ibs);
  for (const k of Object.keys(OBS_VAL)) if (!/cst|cclasstrib|credito/.test(k)) OBS_VAL[k] += ' Margem única: diferença de até R$ 0,05 = VALIDADO.';
