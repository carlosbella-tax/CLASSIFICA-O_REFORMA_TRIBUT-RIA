  /* =====================================================================
     V98 — Aba ICMS, notas de SAÍDA com desconto no XML (vDesc) que não foi
     abatido da base de ICMS: a base do XML é aceita (VALIDADO) e o ICMS é
     conferido como base do XML × alíquota (margem R$ 0,05).
     Reconhecimento: a base calculada pela regra do item (que subtrai o
     desconto — V97) fica NÃO VALIDADA e a diferença (base do XML − base
     calculada) é igual ao desconto (ou ao desconto × (1 − % redução)).
     Nas entradas a regra da V97 continua (desconto subtrai da base).
     ===================================================================== */
  const TOL_V98 = 0.0501;
  const linhasIcmsV97 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV97(...a).map(row => {
    if (row.tipo_operacao !== 'SAÍDAS' || !/^NÃO VALIDADO/.test(String(row.validacao_base_icms || ''))) return row;
    const desc = num(row.valor_desconto), bc = typeof row.base_correta_icms === 'number' ? row.base_correta_icms : 0;
    if (desc <= 0.005 || bc <= 0.005) return row;
    const baseXml = arred(num(row.base_icms_xml)), dif = arred(baseXml - bc), red = num(row.reducao_base_icms), f = red > 0 && red < 100 ? 1 - red / 100 : 1;
    if (Math.abs(dif - desc) > TOL_V98 && Math.abs(dif - arred(desc * f)) > TOL_V98) return row;
    row.validacao_base_icms = 'VALIDADO (saída: desconto de ' + brl(desc) + ' no XML não abatido da base de ICMS — base do XML ' + brl(baseXml) + ' aceita; ICMS = base × alíquota)';
    if ('base_icms_calculada' in row) row.base_icms_calculada = 'VALIDADO';
    if ('base_correta_icms' in row) row.base_correta_icms = 0;
    if (String(row.cst_icms || '').trim() !== '51' && 'validacao_icms' in row){
      const aliq = num(row.aliquota_icms), icmsXml = arred(num(row.valor_icms_xml)), calc = arred(baseXml * aliq / 100), ok = Math.abs(icmsXml - calc) <= TOL_V98;
      row.validacao_icms = ok ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(baseXml) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = ok ? 0 : calc;
    }
    if ('observacao' in row && obsUsuarioV71('icms')[chaveObsV71(row)] === undefined){
      const resto = String(row.observacao || '').split(' | ').filter(t => t && t !== 'Erro de cálculo de arredondamento');
      row.observacao = valorObsV71(chaveObsV71(row), resto.join(' | '), 'icms');
    }
    return row;
  });
  OBS_VAL.validacao_base_icms += ' Saídas: desconto no XML não abatido da base de ICMS → VALIDADO, ICMS = base do XML × alíquota.';
