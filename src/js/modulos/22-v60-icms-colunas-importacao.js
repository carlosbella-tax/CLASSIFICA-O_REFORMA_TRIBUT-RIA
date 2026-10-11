  /* =====================================================================
     V60 — Aba ICMS: colunas de frete, seguro, desconto, outras despesas,
     II e IPI logo após o valor total do item. CFOP 3101, 3102 e 3556:
     base do ICMS = produtos + frete + seguro + desconto + outras despesas
     + II + IPI; base e ICMS com diferença de até R$ 0,03 = VALIDADO.
     ===================================================================== */
  const CFOP_BASE_V60 = new Set(['3101', '3102', '3556']);
  const TOL_V60 = 0.0301;
  const linhasIcmsV59 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV59().map(row => {
    const r = row.__src; if (!r) return row;
    const c = {
      valor_frete: num(campoGrupo(r, 'prod', 'vFrete')), valor_seguro: num(campoGrupo(r, 'prod', 'vSeg')),
      valor_desconto: num(campoGrupo(r, 'prod', 'vDesc')), valor_outras_despesas: num(campoGrupo(r, 'prod', 'vOutro')),
      valor_ii: valorGrupo(r, 'II', 'vII'), valor_ipi: valorGrupo(r, 'IPI', 'vIPI')
    };
    // colunas novas logo depois de valor_total_produtos
    const x = {};
    for (const k of Object.keys(row)){ x[k] = row[k]; if (k === 'valor_total_produtos') Object.assign(x, c); }
    Object.defineProperty(x, '__src', {value: r, configurable: true, writable: true});

    const cfop = String(x.cfop_xml || x.cfop || '').trim(), cfop2 = String(x.cfop || '').trim();
    if (!CFOP_BASE_V60.has(cfop) && !CFOP_BASE_V60.has(cfop2)) return x;
    const cst = String(x.cst_icms || '').trim(), baseXml = num(x.base_icms_xml);
    if (SEM_BASE_ICMS.has(cst) || baseXml <= 0.005) return x;   // sem ICMS ou sem base no XML: regra anterior (V37)

    const prod = num(x.valor_total_produtos), aliq = num(x.aliquota_icms), icmsXml = num(x.valor_icms_xml);
    const base = arred(prod + c.valor_frete + c.valor_seguro + c.valor_desconto + c.valor_outras_despesas + c.valor_ii + c.valor_ipi);
    const comp = 'produtos ' + brl(prod) + ' + frete ' + brl(c.valor_frete) + ' + seguro ' + brl(c.valor_seguro) + ' + desconto ' + brl(c.valor_desconto)
      + ' + outras despesas ' + brl(c.valor_outras_despesas) + ' + II ' + brl(c.valor_ii) + ' + IPI ' + brl(c.valor_ipi);
    const okBase = Math.abs(arred(baseXml) - base) <= TOL_V60;
    if (okBase){
      x.validacao_base_icms = 'VALIDADO (CFOP ' + cfop + ': ' + comp + ' = ' + brl(base) + ')';
      if ('base_icms_calculada' in x) x.base_icms_calculada = 'VALIDADO';
      if ('base_correta_icms' in x) x.base_correta_icms = 0;
    } else {
      x.validacao_base_icms = 'NÃO VALIDADO (CFOP ' + cfop + ': base deve ser ' + brl(base) + ' = ' + comp + ')';
      if ('base_icms_calculada' in x) x.base_icms_calculada = base;
      if ('base_correta_icms' in x) x.base_correta_icms = base;
    }
    // valor do ICMS = base × alíquota do XML (base do XML quando validada; senão, a base correta)
    if (cst !== '51' && 'validacao_icms' in x){
      const baseUsada = okBase ? arred(baseXml) : base, icmsCalc = arred(baseUsada * aliq / 100);
      const okIcms = Math.abs(arred(icmsXml) - icmsCalc) <= TOL_V60;
      x.validacao_icms = okIcms ? 'VALIDADO'
        : 'NÃO VALIDADO (ICMS deve ser ' + brl(baseUsada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(icmsCalc) + ')';
      if ('valor_correto_icms' in x) x.valor_correto_icms = okIcms ? 0 : icmsCalc;
    }
    return x;
  });
  OBS_VAL.validacao_base_icms += ' Nos CFOP 3101, 3102 e 3556: produtos + frete + seguro + desconto + outras despesas + II + IPI, com margem de R$ 0,03.';
  OBS_VAL.validacao_icms += ' Nos CFOP 3101, 3102 e 3556, margem de R$ 0,03.';
