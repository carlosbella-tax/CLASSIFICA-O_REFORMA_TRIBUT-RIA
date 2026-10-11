  /* =====================================================================
     V62 — Aba ICMS: operações internas (CFOP 1xxx/5xxx) e interestaduais
     (CFOP 2xxx/6xxx): base do ICMS = produtos + frete + seguro, com a
     redução do pRedBC: base = (produtos + frete + seguro) × (1 − % redução).
     O ICMS é calculado e validado sobre essa base (margem de R$ 0,02).
     Outras despesas, desconto e IPI não entram nesta base.
     ===================================================================== */
  const TOL_V62 = 0.0201;
  const linhasIcmsV61 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV61().map(row => {
    const r = row.__src; if (!r) return row;
    const cfop = String(row.cfop_xml || row.cfop || '').trim(), d = cfop.charAt(0);
    if (!['1', '2', '5', '6'].includes(d)) return row;
    const cst = String(row.cst_icms || '').trim(), baseXml = arred(num(row.base_icms_xml));
    if (SEM_BASE_ICMS.has(cst) || baseXml <= 0.005) return row;   // sem ICMS ou sem base no XML: regra anterior (V37)

    const red = num(row.reducao_base_icms), fator = red > 0 && red < 100 ? 1 - red / 100 : 1;
    const prod = num(row.valor_total_produtos), frete = num(row.valor_frete), seguro = num(row.valor_seguro);
    const cheia = arred(prod + frete + seguro), base = arred(cheia * fator), ok = Math.abs(baseXml - base) <= TOL_V62;
    const tipo = d === '1' || d === '5' ? 'operação interna' : 'operação interestadual';
    const conta = tipo + ', CFOP ' + cfop + ': produtos ' + brl(prod) + ' + frete ' + brl(frete) + ' + seguro ' + brl(seguro) + ' = ' + brl(cheia)
      + (fator !== 1 ? ' × (1 − ' + pctV61(red) + ') = ' + brl(base) : '');
    row.validacao_base_icms = ok ? 'VALIDADO (' + conta + ')' : 'NÃO VALIDADO (base deve ser ' + brl(base) + ' — ' + conta + ')';
    if ('base_icms_calculada' in row) row.base_icms_calculada = ok ? 'VALIDADO' : base;
    if ('base_correta_icms' in row) row.base_correta_icms = ok ? 0 : base;

    // ICMS = base × alíquota do XML (base do XML quando validada; senão, a base correta). Diferimento (CST 51) mantém a regra anterior.
    if (cst !== '51' && 'validacao_icms' in row){
      const aliq = num(row.aliquota_icms), icmsXml = arred(num(row.valor_icms_xml));
      const usada = ok ? baseXml : base, calc = arred(usada * aliq / 100), okI = Math.abs(icmsXml - calc) <= TOL_V62;
      row.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = okI ? 0 : calc;
    }
    return row;
  });
  OBS_VAL.validacao_base_icms += ' Operações internas e interestaduais (CFOP 1xxx, 2xxx, 5xxx, 6xxx): base = produtos + frete + seguro, com a redução do pRedBC; outras despesas, desconto e IPI não entram.';
