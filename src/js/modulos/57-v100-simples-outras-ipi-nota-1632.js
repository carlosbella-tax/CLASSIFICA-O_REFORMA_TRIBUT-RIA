  /* =====================================================================
     V100 — Aba ICMS
     1. regime_tributario opção 3 (Optante ME/EPP — Simples Nacional): o valor
        de valor_outras_despesas é o IPI e passa para valor_ipi (somado ao IPI
        destacado, se houver); valor_outras_despesas fica 0. A base é validada
        de novo: produtos − desconto + frete + seguro (+ IPI, só se a base do
        XML trouxer o IPI), com a redução do pRedBC; ICMS = base × alíquota.
     2. Nota 1632 (numero_nota_fiscal): o valor de reducao_base_icms é excluído
        (fica 0) e a base é validada sem redução, seguindo as demais regras.
     Operações internas/interestaduais (cfop_xml 1, 2, 5, 6) com ICMS na base;
     não se aplica a CST sem base, compra de uso e consumo nem ZFM (6110).
     Saída com desconto não abatido da base segue a V98 (VALIDADO).
     ===================================================================== */
  const TOL_V100 = 0.0501, NOTAS_SEM_REDUCAO_V100 = new Set(['1632']);
  const opcao3V100 = row => /^3\b/.test(String(row.regime_tributario || '').trim());
  function revalidarV100(row, r, motivo){
    const cfx = String(row.cfop_xml || (r && (r.cfop_xml || r.cfop)) || '').trim(), cst = String(row.cst_icms || '').trim(), baseXml = arred(num(row.base_icms_xml));
    if (!['1', '2', '5', '6'].includes(cfx.charAt(0)) || SEM_BASE_ICMS.has(cst) || CSOSN_SEM_V90.has(cst) || baseXml <= 0.005) return row;
    if ((r && (compraUsoConsumoV92(r) || ehZfmV99(null, r)))) return row;
    const prod = num(row.valor_total_produtos), desc = num(row.valor_desconto), frete = num(row.valor_frete), seg = num(row.valor_seguro), outras = num(row.valor_outras_despesas), ipi = num(row.valor_ipi);
    const red = num(row.reducao_base_icms), f = red > 0 && red < 100 ? 1 - red / 100 : 1;
    const sem = arred(prod - desc + frete + seg + outras), comIpi = ipi > TOL_V100 && Math.abs(baseXml - arred(arred(sem + ipi) * f)) <= TOL_V100;
    const cheia = comIpi ? arred(sem + ipi) : sem, base = arred(cheia * f);
    const conta = motivo + ', CFOP ' + cfx + ': produtos ' + brl(prod) + (desc > 0.005 ? ' − desconto ' + brl(desc) : '') + ' + frete ' + brl(frete) + ' + seguro ' + brl(seg)
      + ' + outras despesas ' + brl(outras) + (comIpi ? ' + IPI ' + brl(ipi) + ' (IPI na base do XML)' : '') + ' = ' + brl(cheia) + (f !== 1 ? ' × (1 − ' + brNumero(red, 2) + '%) = ' + brl(base) : '');
    let ok = Math.abs(baseXml - base) <= TOL_V100, txtOk = 'VALIDADO (' + conta + ')';
    // V98: saída com desconto não abatido da base
    if (!ok && row.tipo_operacao === 'SAÍDAS' && desc > 0.005 && (Math.abs(arred(baseXml - base) - desc) <= TOL_V100 || Math.abs(arred(baseXml - base) - arred(desc * f)) <= TOL_V100)){
      ok = true; txtOk = 'VALIDADO (saída: desconto de ' + brl(desc) + ' no XML não abatido da base de ICMS — base do XML ' + brl(baseXml) + ' aceita; ICMS = base × alíquota; ' + motivo + ')';
    }
    row.validacao_base_icms = ok ? txtOk : 'NÃO VALIDADO (base deve ser ' + brl(base) + ' — ' + conta + ') diferença: ' + brl(arred(baseXml - base));
    if ('base_icms_calculada' in row) row.base_icms_calculada = ok ? 'VALIDADO' : base;
    if ('base_correta_icms' in row) row.base_correta_icms = ok ? 0 : base;
    if (cst !== '51' && 'validacao_icms' in row){
      const aliq = num(row.aliquota_icms), icmsXml = arred(num(row.valor_icms_xml)), usada = ok ? baseXml : base, calc = arred(usada * aliq / 100), okI = Math.abs(icmsXml - calc) <= TOL_V100;
      row.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = okI ? 0 : calc;
    }
    if ('observacao' in row && obsUsuarioV71('icms')[chaveObsV71(row)] === undefined){
      const resto = String(row.observacao || '').split(' | ').filter(t => t && t !== 'Erro de cálculo de arredondamento');
      row.observacao = valorObsV71(chaveObsV71(row), resto.join(' | '), 'icms');
    }
    return row;
  }
  const linhasIcmsV99 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV99(...a).map(row => {
    const r = row.__src, motivos = [];
    if (opcao3V100(row) && num(row.valor_outras_despesas) > 0.005){
      row.valor_ipi = arred(num(row.valor_ipi) + num(row.valor_outras_despesas)); row.valor_outras_despesas = 0;
      motivos.push('Simples Nacional (opção 3): outras despesas lançadas como IPI');
    }
    if (NOTAS_SEM_REDUCAO_V100.has(String(row.numero_nota_fiscal || '').trim()) && num(row.reducao_base_icms) > 0){
      row.reducao_base_icms = 0; motivos.push('nota ' + String(row.numero_nota_fiscal).trim() + ' sem redução de base');
    }
    return motivos.length ? revalidarV100(row, r, motivos.join('; ')) : row;
  });
  OBS_VAL.validacao_base_icms += ' Simples Nacional (regime opção 3): outras despesas são o IPI (coluna valor_ipi). Nota 1632: sem redução de base.';
