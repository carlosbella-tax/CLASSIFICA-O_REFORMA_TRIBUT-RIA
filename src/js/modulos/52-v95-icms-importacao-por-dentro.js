  /* =====================================================================
     V95 — Aba ICMS: base e valor do ICMS
     1. Operação própria (venda interna ou interestadual, entradas e saídas),
        IPI fora da base do XML (operação entre contribuintes, para revenda
        ou industrialização):
          BC = mercadoria + frete + seguro + outras despesas (juros e demais
               despesas cobradas do comprador) − desconto incondicional (vDesc)
        com a redução do pRedBC, quando houver; ICMS = BC × alíquota.
        É a regra da V62/V63, mantida. Com IPI na base seguem as regras de
        uso e consumo (V90/V92/V93) e de consumidor final (V91).
     2. Importação (cfop_xml 3xxx) — substitui a regra da V59/V60:
          BC = (valor aduaneiro + II + IPI + PIS-Importação + COFINS-Importação
                + IOF + despesas aduaneiras) ÷ (1 − alíquota)
        valor aduaneiro = vBC do grupo II (mercadoria + frete e seguro
        internacionais); também é aceito produtos + frete + seguro (frete e
        seguro internacionais lançados fora do vBC do II).
        Despesas aduaneiras = vDespAdu (Siscomex, AFRMM, capatazia); também é
        aceita a conta com as outras despesas (vOutro) somadas, quando o
        importador lança as despesas aduaneiras nesse campo.
        Com redução de base (pRedBC): × (1 − % redução). ICMS = BC × alíquota.
        Margem de R$ 0,05.
     ===================================================================== */
  const TOL_V95 = 0.0501;
  const linhasIcmsV94 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV94(...a).map(row => {
    const r = row.__src; if (!r) return row;
    const cfx = String(row.cfop_xml || r.cfop_xml || '').trim();
    if (cfx.charAt(0) !== '3') return row;
    const cst = String(row.cst_icms || '').trim(), baseXml = arred(num(row.base_icms_xml));
    if (SEM_BASE_ICMS.has(cst) || baseXml <= 0.005) return row;

    const prod = num(row.valor_total_produtos), frete = num(row.valor_frete), seg = num(row.valor_seguro), outras = num(row.valor_outras_despesas);
    const vaII = valorGrupo(r, 'II', 'vBC'), vaProd = arred(prod + frete + seg - num(row.valor_desconto)), va = vaII || vaProd, ii = valorGrupo(r, 'II', 'vII'), iof = valorGrupo(r, 'II', 'vIOF'), da = valorGrupo(r, 'II', 'vDespAdu');
    const ipi = valorGrupo(r, 'IPI', 'vIPI'), pis = valorGrupo(r, 'PIS', 'vPIS'), cof = valorGrupo(r, 'COFINS', 'vCOFINS');
    const aliq = num(row.aliquota_icms), red = num(row.reducao_base_icms), fator = red > 0 && red < 100 ? 1 - red / 100 : 1;
    const conta = (va, extra) => {
      const soma = arred(va + ii + ipi + pis + cof + iof + da + extra), porDentro = aliq > 0 && aliq < 100 ? arred(soma / (1 - aliq / 100)) : soma, base = arred(porDentro * fator);
      const txt = 'importação, CFOP ' + cfx + ': (valor aduaneiro ' + brl(va) + ' + II ' + brl(ii) + ' + IPI ' + brl(ipi) + ' + PIS ' + brl(pis) + ' + COFINS ' + brl(cof)
        + ' + IOF ' + brl(iof) + ' + despesas aduaneiras ' + brl(da) + (extra ? ' + outras despesas ' + brl(extra) : '') + ') = ' + brl(soma)
        + (porDentro !== soma ? ' ÷ (1 − ' + brNumero(aliq, 2) + '%) = ' + brl(porDentro) : '') + (fator !== 1 ? ' × (1 − ' + brNumero(red, 2) + '%) = ' + brl(base) : '');
      return {base, txt};
    };
    // conta principal + alternativas aceitas (valor aduaneiro = produtos + frete + seguro; despesas aduaneiras em vOutro)
    const p = conta(va, 0), contas = [p];
    if (vaII && Math.abs(vaII - vaProd) > 0.005) contas.push(conta(vaProd, 0));
    if (outras > 0.005){ contas.push(conta(va, outras)); if (vaII && Math.abs(vaII - vaProd) > 0.005) contas.push(conta(vaProd, outras)); }
    const usa = contas.find(c => Math.abs(baseXml - c.base) <= TOL_V95) || null, ok = !!usa;
    const ref = usa || p;
    row.validacao_base_icms = ok ? 'VALIDADO (' + ref.txt + ')' : 'NÃO VALIDADO (base deve ser ' + brl(ref.base) + ' — ' + ref.txt + ') diferença: ' + brl(arred(baseXml - ref.base));
    if ('base_icms_calculada' in row) row.base_icms_calculada = ok ? 'VALIDADO' : ref.base;
    if ('base_correta_icms' in row) row.base_correta_icms = ok ? 0 : ref.base;
    if (cst !== '51' && 'validacao_icms' in row){
      const icmsXml = arred(num(row.valor_icms_xml)), usada = ok ? baseXml : ref.base, calc = arred(usada * aliq / 100), okI = Math.abs(icmsXml - calc) <= TOL_V95;
      row.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = okI ? 0 : calc;
    }
    // observação automática de arredondamento (V88) não se aplica a esta regra
    if ('observacao' in row && obsUsuarioV71('icms')[chaveObsV71(row)] === undefined){
      const resto = String(row.observacao || '').split(' | ').filter(t => t && t !== 'Erro de cálculo de arredondamento');
      row.observacao = valorObsV71(chaveObsV71(row), resto.join(' | '), 'icms');
    }
    return row;
  });
  OBS_VAL.validacao_base_icms += ' Importação (CFOP 3xxx): base = (valor aduaneiro + II + IPI + PIS + COFINS + IOF + despesas aduaneiras) ÷ (1 − alíquota), com a redução do pRedBC; ICMS = base × alíquota.';
