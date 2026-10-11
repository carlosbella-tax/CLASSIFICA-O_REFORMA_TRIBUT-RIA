  /* =====================================================================
     V59 — ICMS na importação (CFOP 3xxx): base = valor aduaneiro + II + IPI
     + PIS + COFINS + despesas aduaneiras (com o ICMS "por dentro")
     ===================================================================== */
  const aplicarCfopV58 = aplicarCfop;
  aplicarCfop = function(){
    aplicarCfopV58();
    for (const r of state.items) if (((r.cfop === '1405' && r.cfop_xml === '5405') || (r.cfop === '2405' && r.cfop_xml === '6405')) && !/contribuinte substituído/.test(r.descricao_cfop || '')) r.descricao_cfop = descCfop(r.cfop, r.cfop_xml);
  };
  const linhasIcmsV58 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV58().map(row => {
    const r = row.__src; if (!r) return row;
    const cfx = String(row.cfop_xml || r.cfop_xml || '').trim(); if (cfx.charAt(0) !== '3') return row;
    const cst = String(row.cst_icms || '').trim(); if (SEM_BASE_ICMS.has(cst)) return row;
    const va = valorGrupo(r, 'II', 'vBC') || num(r.valor_item), ii = valorGrupo(r, 'II', 'vII'), da = valorGrupo(r, 'II', 'vDespAdu'),
      ipi = valorGrupo(r, 'IPI', 'vIPI'), pis = valorGrupo(r, 'PIS', 'vPIS'), cof = valorGrupo(r, 'COFINS', 'vCOFINS'), aliq = num(row.aliquota_icms);
    const soma = arred(va + ii + ipi + pis + cof + da), porDentro = aliq > 0 && aliq < 100 ? arred(soma / (1 - aliq / 100)) : soma;
    const base = num(row.base_icms_xml), ok = Math.abs(arred(base) - porDentro) <= 0.0201 || Math.abs(arred(base) - soma) <= 0.0201;
    const comp = 'VA ' + brl(va) + ' + II ' + brl(ii) + ' + IPI ' + brl(ipi) + ' + PIS ' + brl(pis) + ' + COFINS ' + brl(cof) + ' + desp. aduaneiras ' + brl(da);
    if (ok){
      row.validacao_base_icms = 'VALIDADO (importação: ' + comp + (Math.abs(arred(base) - porDentro) <= 0.0201 && porDentro !== soma ? ', com o ICMS por dentro' : '') + ')';
      if ('base_icms_calculada' in row) row.base_icms_calculada = 'VALIDADO';
      if ('base_correta_icms' in row) row.base_correta_icms = 0;
    } else {
      row.validacao_base_icms = 'NÃO VALIDADO (importação: base deve ser ' + brl(porDentro) + ' = (' + comp + ')' + (porDentro !== soma ? ' ÷ (1 − ' + brNumero(aliq, 2) + '%)' : '') + ')';
      if ('base_icms_calculada' in row) row.base_icms_calculada = porDentro;
      if ('base_correta_icms' in row) row.base_correta_icms = porDentro;
      const vc = arred(porDentro * aliq / 100);
      if ('valor_correto_icms' in row){ row.valor_correto_icms = vc; row.validacao_icms = 'NÃO VALIDADO (ICMS sobre a base correta da importação: ' + brl(porDentro) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(vc) + ')'; }
    }
    return row;
  });
  OBS_VAL.validacao_base_icms = 'Base = produto + frete + seguro + outras − desconto, com a redução quando houver. XML sem base só é inconsistente na CST 00. Na importação (CFOP 3xxx): valor aduaneiro + II + IPI + PIS + COFINS + despesas aduaneiras, com o ICMS por dentro.';
  OBS_VAL.validacao_base_pis = OBS_VAL.validacao_base_cofins = OBS_VAL.validacao_base_pis + ' Com ICMS-ST (CST 60) ou Simples Nacional, a base é o valor total dos produtos.';

