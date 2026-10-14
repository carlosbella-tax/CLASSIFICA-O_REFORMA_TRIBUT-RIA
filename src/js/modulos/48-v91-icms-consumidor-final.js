  /* =====================================================================
     V91 — Aba ICMS: venda para consumidor final
     NF-e com <indFinal>1</indFinal> (operação com consumidor final), CFOP
     1xxx, 2xxx, 5xxx, 6xxx e CST tributada: a base de ICMS é
         base = produtos + frete + IPI   (com a redução do pRedBC, quando houver)
     O ICMS é recalculado sobre essa base (margem de R$ 0,05). Esta regra
     prevalece sobre a V62/V63 e sobre a V90 (uso e consumo) nesses itens.
     A leitura do XML passa a guardar ind_final (1 = consumidor final) no item.
     ===================================================================== */
  const TOL_V91 = 0.0501, CSOSN_SEM_V91 = new Set(['101', '102', '103', '201', '202', '203', '300', '400', '500']);
  const parseV90 = window.parse;
  window.parse = function(file, txt){
    const res = parseV90.apply(this, arguments);
    if (typeof txt === 'string' && Array.isArray(res) && res[1] && /NF-e/.test(String(res[1].tipo_documento || ''))){
      const m = txt.match(/<(?:\w+:)?indFinal>\s*([01])\s*</);
      if (m){ res[1].ind_final = m[1]; for (const r of res[0] || []) if (r) r.ind_final = m[1]; }
    }
    return res;
  };
  const consumidorFinalV91 = r => !!r && String(r.ind_final || '') === '1';

  const linhasIcmsV90 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV90(...a).map(row => {
    const r = row.__src; if (!consumidorFinalV91(r)) return row;
    const cfop = String(row.cfop_xml || row.cfop || '').trim(), cst = String(row.cst_icms || '').trim(), baseXml = arred(num(row.base_icms_xml));
    if (!['1', '2', '5', '6'].includes(cfop.charAt(0)) || SEM_BASE_ICMS.has(cst) || CSOSN_SEM_V91.has(cst) || baseXml <= 0.005) return row;
    const prod = num(row.valor_total_produtos), frete = num(row.valor_frete), ipi = num(row.valor_ipi), desc = num(row.valor_desconto);   // V97: desconto subtrai
    const red = num(row.reducao_base_icms), fator = red > 0 && red < 100 ? 1 - red / 100 : 1;
    const cheia = arred(prod - desc + frete + ipi), base = arred(cheia * fator), ok = Math.abs(baseXml - base) <= TOL_V91;
    const conta = 'venda para consumidor final, CFOP ' + cfop + ': produtos ' + brl(prod) + (desc > 0.005 ? ' − desconto ' + brl(desc) : '') + ' + frete ' + brl(frete) + ' + IPI ' + brl(ipi) + ' = ' + brl(cheia)
      + (fator !== 1 ? ' × (1 − ' + brNumero(red, 2) + '%) = ' + brl(base) : '');
    row.validacao_base_icms = ok ? 'VALIDADO (' + conta + ')' : 'NÃO VALIDADO (base deve ser ' + brl(base) + ' — ' + conta + ') diferença: ' + brl(arred(baseXml - base));
    if ('base_icms_calculada' in row) row.base_icms_calculada = ok ? 'VALIDADO' : base;
    if ('base_correta_icms' in row) row.base_correta_icms = ok ? 0 : base;
    if (cst !== '51' && 'validacao_icms' in row){
      const aliq = num(row.aliquota_icms), icmsXml = arred(num(row.valor_icms_xml));
      const usada = ok ? baseXml : base, calc = arred(usada * aliq / 100), okI = Math.abs(icmsXml - calc) <= TOL_V91;
      row.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = okI ? 0 : calc;
    }
    // a observação automática de arredondamento (V88) não se aplica a esta regra
    if ('observacao' in row && obsUsuarioV71('icms')[chaveObsV71(row)] === undefined){
      const resto = String(row.observacao || '').split(' | ').filter(t => t && t !== 'Erro de cálculo de arredondamento');
      row.observacao = valorObsV71(chaveObsV71(row), resto.join(' | '), 'icms');
    }
    return row;
  });
  OBS_VAL.validacao_base_icms += ' Venda para consumidor final (indFinal = 1, CFOP 1xxx, 2xxx, 5xxx, 6xxx): base = produtos + frete + IPI, com a redução do pRedBC.';
