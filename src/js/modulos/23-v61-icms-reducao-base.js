  /* =====================================================================
     V61 — Aba ICMS: origem da mercadoria (orig) e % de redução da base
     (pRedBC). A redução é aplicada na base do ICMS em todas as regras:
     base reduzida = base cheia × (1 − % redução); o ICMS é calculado e
     validado sobre a base reduzida.
     ===================================================================== */
  const ORIGEM_V61 = {
    '0': 'Nacional', '1': 'Estrangeira — importação direta', '2': 'Estrangeira — adquirida no mercado interno',
    '3': 'Nacional — conteúdo de importação acima de 40% e até 70%', '4': 'Nacional — processos produtivos básicos',
    '5': 'Nacional — conteúdo de importação até 40%', '6': 'Estrangeira — importação direta, sem similar nacional (CAMEX)',
    '7': 'Estrangeira — mercado interno, sem similar nacional (CAMEX)', '8': 'Nacional — conteúdo de importação acima de 70%'
  };
  const pctV61 = p => brNumero(p, Math.abs(p * 100 - Math.round(p * 100)) < 1e-6 ? 2 : 4) + '%';
  const linhasIcmsV60 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV60().map(row => {
    const r = row.__src; if (!r) return row;
    const orig = String(campoGrupo(r, 'ICMS', 'orig') ?? '').trim(), red = valorIcms(r, 'pRedBC');
    // colunas: reducao_base_icms antes de base_icms_xml; origem_icms antes de cst_icms
    const x = {};
    for (const k of Object.keys(row)){
      if (k === 'base_icms_xml') x.reducao_base_icms = red;
      if (k === 'cst_icms') x.origem_icms = orig === '' ? '' : orig + ' - ' + (ORIGEM_V61[orig] || 'origem não identificada');
      x[k] = row[k];
    }
    Object.defineProperty(x, '__src', {value: r, configurable: true, writable: true});
    if (!(red > 0 && red < 100)) return x;
    const cst = String(x.cst_icms || '').trim(), baseXml = arred(num(x.base_icms_xml));
    if (SEM_BASE_ICMS.has(cst) || baseXml <= 0.005) return x;

    const fator = 1 - red / 100, aliq = num(x.aliquota_icms), icmsXml = arred(num(x.valor_icms_xml)), p = pctV61(red);
    const cfop = String(x.cfop_xml || x.cfop || '').trim(), cfop2 = String(x.cfop || '').trim();
    const reduzir = cheia => arred(cheia * fator);
    const fixarBase = (ok, base, texto) => {
      x.validacao_base_icms = (ok ? 'VALIDADO (' : 'NÃO VALIDADO (base deve ser ' + brl(base) + ' — ') + texto + ')';
      if ('base_icms_calculada' in x) x.base_icms_calculada = ok ? 'VALIDADO' : base;
      if ('base_correta_icms' in x) x.base_correta_icms = ok ? 0 : base;
    };
    const fixarIcms = (ok, base, tol) => {
      if (cst === '51' || !('validacao_icms' in x)) return;
      const usada = ok ? baseXml : base, calc = arred(usada * aliq / 100), okI = Math.abs(icmsXml - calc) <= tol;
      x.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ', base com redução de ' + p + ')';
      if ('valor_correto_icms' in x) x.valor_correto_icms = okI ? 0 : calc;
    };

    if (CFOP_BASE_V60.has(cfop) || CFOP_BASE_V60.has(cfop2)){
      // V60 + redução: (produtos + frete + seguro + desconto + outras despesas + II + IPI) × (1 − % redução); margem R$ 0,03
      const cheia = arred(num(x.valor_total_produtos) + num(x.valor_frete) + num(x.valor_seguro) + num(x.valor_desconto) + num(x.valor_outras_despesas) + num(x.valor_ii) + num(x.valor_ipi));
      const base = reduzir(cheia), ok = Math.abs(baseXml - base) <= TOL_V60;
      fixarBase(ok, base, 'CFOP ' + cfop + ': produtos ' + brl(num(x.valor_total_produtos)) + ' + frete ' + brl(num(x.valor_frete)) + ' + seguro ' + brl(num(x.valor_seguro))
        + ' + desconto ' + brl(num(x.valor_desconto)) + ' + outras despesas ' + brl(num(x.valor_outras_despesas)) + ' + II ' + brl(num(x.valor_ii)) + ' + IPI ' + brl(num(x.valor_ipi))
        + ' = ' + brl(cheia) + ' × (1 − ' + p + ') = ' + brl(base));
      fixarIcms(ok, base, TOL_V60);
    } else if (cfop.charAt(0) === '3'){
      // V59 + redução: (VA + II + IPI + PIS + COFINS + despesas aduaneiras), com ou sem o ICMS por dentro, × (1 − % redução)
      const va = valorGrupo(r, 'II', 'vBC') || num(x.valor_total_produtos), ii = valorGrupo(r, 'II', 'vII'), da = valorGrupo(r, 'II', 'vDespAdu'),
        ipi = valorGrupo(r, 'IPI', 'vIPI'), pis = valorGrupo(r, 'PIS', 'vPIS'), cof = valorGrupo(r, 'COFINS', 'vCOFINS');
      const soma = arred(va + ii + ipi + pis + cof + da), porDentro = aliq > 0 && aliq < 100 ? arred(soma / (1 - aliq / 100)) : soma;
      const base = reduzir(porDentro), alt = reduzir(soma), ok = Math.abs(baseXml - base) <= 0.0201 || Math.abs(baseXml - alt) <= 0.0201;
      fixarBase(ok, base, 'importação: (VA ' + brl(va) + ' + II ' + brl(ii) + ' + IPI ' + brl(ipi) + ' + PIS ' + brl(pis) + ' + COFINS ' + brl(cof) + ' + desp. aduaneiras ' + brl(da) + ')'
        + (porDentro !== soma ? ' ÷ (1 − ' + brNumero(aliq, 2) + '%)' : '') + ' × (1 − ' + p + ') = ' + brl(base));
      fixarIcms(ok, base, 0.0201);
    } else if (/^(VALIDADO|NÃO VALIDADO)/.test(String(x.validacao_base_icms || '')) && !/redução/.test(x.validacao_base_icms)){
      // demais operações: a V14 já aplica a redução; aqui só mostramos a conta
      const comIpi = /inclui o IPI/.test(x.validacao_base_icms);
      const cheia = arred(num(x.valor_total_produtos) + num(x.valor_frete) + num(x.valor_seguro) + num(x.valor_outras_despesas) - num(x.valor_desconto) + (comIpi ? num(x.valor_ipi) : 0));
      x.validacao_base_icms += ' (redução da base de ' + p + ': base cheia ' + brl(cheia) + (comIpi ? ' com IPI' : '') + ' × (1 − ' + p + ') = ' + brl(reduzir(cheia)) + ')';
    }
    return x;
  });
  OBS_VAL.validacao_base_icms += ' Com redução de base (pRedBC), a base é multiplicada por (1 − % de redução) e o ICMS é calculado sobre a base reduzida.';
