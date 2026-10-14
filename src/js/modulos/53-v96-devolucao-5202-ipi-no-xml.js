  /* =====================================================================
     V96 — Devolução de compra (CFOP 5202/6202) e IPI na base de ICMS
     1. Aba ICMS, cfop_xml 5202/6202: outras despesas NÃO compõem a base:
          base = (produtos − desconto + frete + seguro [+ IPI, só se o XML
                  trouxer o IPI na base]) × (1 − % redução)
        ICMS = base × alíquota (margem R$ 0,05). A devolução não é tratada
        como uso e consumo.
     2. Aba IPI, cfop_xml 5202/6202: o valor de outras despesas (vOutro) é o
        valor do IPI devolvido — vai para valor_ipi_xml e segue a validação
        (com base e alíquota de IPI no XML: outras despesas = base × alíquota;
        sem grupo de IPI: VALIDADO, IPI devolvido em outras despesas). Item
        sem grupo de IPI, mas com outras despesas, também entra na aba IPI.
     3. Aba ICMS: o IPI só compõe a base de ICMS quando o XML traz a base
        assim. Consumidor final (V91) com o IPI fora da base do XML:
        base = produtos + frete. Importação (V95) com o IPI fora da base do
        XML: a conta sem o IPI também é aceita.
     ===================================================================== */
  const TOL_V96 = 0.0501, CFOP_DEV_V96 = new Set(['5202', '6202']);
  const cfopXmlV96 = (row, r) => String((row && row.cfop_xml) || (r && (r.cfop_xml || r.cfop)) || '').trim();
  const fatorV96 = red => red > 0 && red < 100 ? 1 - red / 100 : 1;
  const obsSemArredV96 = row => {
    if (!('observacao' in row) || obsUsuarioV71('icms')[chaveObsV71(row)] !== undefined) return row;
    const resto = String(row.observacao || '').split(' | ').filter(t => t && t !== 'Erro de cálculo de arredondamento');
    row.observacao = valorObsV71(chaveObsV71(row), resto.join(' | '), 'icms');
    return row;
  };
  // grava base/ICMS validados ou a base correta (mesmo formato das regras V90/V91/V95)
  const fixarIcmsV96 = (row, base, conta) => {
    const baseXml = arred(num(row.base_icms_xml)), ok = Math.abs(baseXml - base) <= TOL_V96;
    row.validacao_base_icms = ok ? 'VALIDADO (' + conta + ')' : 'NÃO VALIDADO (base deve ser ' + brl(base) + ' — ' + conta + ') diferença: ' + brl(arred(baseXml - base));
    if ('base_icms_calculada' in row) row.base_icms_calculada = ok ? 'VALIDADO' : base;
    if ('base_correta_icms' in row) row.base_correta_icms = ok ? 0 : base;
    if (String(row.cst_icms || '').trim() !== '51' && 'validacao_icms' in row){
      const aliq = num(row.aliquota_icms), icmsXml = arred(num(row.valor_icms_xml)), usada = ok ? baseXml : base, calc = arred(usada * aliq / 100), okI = Math.abs(icmsXml - calc) <= TOL_V96;
      row.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = okI ? 0 : calc;
    }
    return obsSemArredV96(row);
  };

  // devolução de compra não é uso e consumo
  const usoConsumoV94 = usoConsumoV90;
  usoConsumoV90 = function(r){ return r && CFOP_DEV_V96.has(cfopXmlV96(null, r)) ? null : usoConsumoV94(r); };

  /* ---------- aba ICMS ---------- */
  const linhasIcmsV95 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV95(...a).map(row => {
    const r = row.__src; if (!r) return row;
    const cfx = cfopXmlV96(row, r), cst = String(row.cst_icms || '').trim(), baseXml = arred(num(row.base_icms_xml));
    if (SEM_BASE_ICMS.has(cst) || CSOSN_SEM_V90.has(cst) || baseXml <= 0.005) return row;
    const prod = num(row.valor_total_produtos), frete = num(row.valor_frete), seg = num(row.valor_seguro), desc = num(row.valor_desconto), ipi = num(row.valor_ipi);
    const red = num(row.reducao_base_icms), f = fatorV96(red), pctRed = f !== 1 ? ' × (1 − ' + brNumero(red, 2) + '%)' : '';

    // 1. devolução de compra 5202/6202: sem outras despesas
    if (CFOP_DEV_V96.has(cfx)){
      const sem = arred(prod - desc + frete + seg), comIpi = ipi > TOL_V96 && Math.abs(baseXml - arred(arred(sem + ipi) * f)) <= TOL_V96;
      const cheia = comIpi ? arred(sem + ipi) : sem, base = arred(cheia * f);
      return fixarIcmsV96(row, base, 'devolução de compra, CFOP ' + cfx + ': produtos ' + brl(prod) + ' − desconto ' + brl(desc) + ' + frete ' + brl(frete) + ' + seguro ' + brl(seg)
        + (comIpi ? ' + IPI ' + brl(ipi) + ' (IPI na base do XML)' : '') + ' = ' + brl(cheia) + (f !== 1 ? pctRed + ' = ' + brl(base) : '') + '; outras despesas não compõem a base');
    }
    const t = String(row.validacao_base_icms || '');
    if (!/^NÃO VALIDADO/.test(t) || ipi <= TOL_V96) return row;

    // 3a. consumidor final (V91) com o IPI fora da base do XML: produtos + frete
    if (/venda para consumidor final/.test(t)){
      const comIpiXml = !!usoConsumoV90(r) || Math.abs(baseXml - arred(arred(prod + frete + ipi) * f)) <= TOL_V96;
      if (comIpiXml) return row;
      const cheia = arred(prod + frete), base = arred(cheia * f);
      return fixarIcmsV96(row, base, 'venda para consumidor final, CFOP ' + cfx + ': produtos ' + brl(prod) + ' + frete ' + brl(frete) + ' = ' + brl(cheia)
        + (f !== 1 ? pctRed + ' = ' + brl(base) : '') + '; IPI fora da base, como no XML');
    }
    // 3b. importação (V95): aceita a conta sem o IPI quando o XML não traz o IPI na base
    if (/importação, CFOP/.test(t) && cfx.charAt(0) === '3'){
      const outras = num(row.valor_outras_despesas), aliq = num(row.aliquota_icms);
      const vaII = valorGrupo(r, 'II', 'vBC'), vaProd = arred(prod + frete + seg), ii = valorGrupo(r, 'II', 'vII'), iof = valorGrupo(r, 'II', 'vIOF'), da = valorGrupo(r, 'II', 'vDespAdu');
      const pis = valorGrupo(r, 'PIS', 'vPIS'), cof = valorGrupo(r, 'COFINS', 'vCOFINS');
      for (const va of [...new Set([vaII || vaProd, vaProd])]) for (const extra of outras > 0.005 ? [0, outras] : [0]){
        const soma = arred(va + ii + pis + cof + iof + da + extra), porDentro = aliq > 0 && aliq < 100 ? arred(soma / (1 - aliq / 100)) : soma, base = arred(porDentro * f);
        if (Math.abs(baseXml - base) > TOL_V96) continue;
        return fixarIcmsV96(row, base, 'importação, CFOP ' + cfx + ': (valor aduaneiro ' + brl(va) + ' + II ' + brl(ii) + ' + PIS ' + brl(pis) + ' + COFINS ' + brl(cof) + ' + IOF ' + brl(iof)
          + ' + despesas aduaneiras ' + brl(da) + (extra ? ' + outras despesas ' + brl(extra) : '') + ') = ' + brl(soma) + (porDentro !== soma ? ' ÷ (1 − ' + brNumero(aliq, 2) + '%) = ' + brl(porDentro) : '')
          + (f !== 1 ? pctRed + ' = ' + brl(base) : '') + '; IPI fora da base, como no XML');
      }
    }
    return row;
  });
  OBS_VAL.validacao_base_icms += ' Devolução de compra (CFOP 5202/6202): outras despesas não compõem a base. O IPI só compõe a base de ICMS quando o XML traz a base assim.';

  /* ---------- aba IPI: devolução 5202/6202 — outras despesas = IPI devolvido ---------- */
  const ipiDevolucaoV96 = (row, r) => {
    const outras = num(campoGrupo(r, 'prod', 'vOutro')); if (outras <= 0.005) return row;
    row.valor_ipi_xml = outras;
    if (/não traz valor do imposto/.test(String(row.validacao_cst_ipi || ''))) row.validacao_cst_ipi = 'VALIDADO (CST ' + (row.cst_ipi || '') + ': valor do IPI devolvido informado em outras despesas)';
    const base = num(row.base_ipi_xml), aliq = num(row.aliquota_ipi), cfx = cfopXmlV96(row, r);
    if (base > 0.005 && aliq > 0){
      const calc = arred(base * aliq / 100), ok = Math.abs(arred(outras) - calc) <= TOL_V96;
      row.validacao_ipi = ok ? 'VALIDADO (devolução CFOP ' + cfx + ': IPI devolvido em outras despesas ' + brl(outras) + ' = ' + brl(base) + ' × ' + brNumero(aliq, 2) + '%)'
        : 'NÃO VALIDADO (devolução CFOP ' + cfx + ': IPI devolvido em outras despesas ' + brl(outras) + '; deveria ser ' + brl(base) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_ipi' in row) row.valor_correto_ipi = ok ? 0 : calc;
    } else {
      row.validacao_ipi = 'VALIDADO (devolução CFOP ' + cfx + ': IPI devolvido informado em outras despesas ' + brl(outras) + ')';
      if ('valor_correto_ipi' in row) row.valor_correto_ipi = 0;
    }
    return row;
  };
  const linhasIpiV95 = window.linhasIpi;
  window.linhasIpi = (...a) => {
    const rows = linhasIpiV95(...a).map(row => row.__src && CFOP_DEV_V96.has(cfopXmlV96(row, row.__src)) ? ipiDevolucaoV96(row, row.__src) : row);
    const ja = new Set(rows.map(x => x.__src).filter(Boolean));
    const extra = semCanceladasV70(() => state.items.filter(r => r && !ja.has(r) && !r.dados_nfse && CFOP_DEV_V96.has(cfopXmlV96(null, r)) && num(campoGrupo(r, 'prod', 'vOutro')) > 0.005));
    for (const r of extra){
      let row = window.linhaIpi(r); if (!row) continue;
      if (!row.__src) Object.defineProperty(row, '__src', {value: r, configurable: true, writable: true});
      row = moverUsoV93(comUsoConsumoV90(comObsV75(row, 'ipi'), r, 'cfop_xml'));
      rows.push(ipiDevolucaoV96(row, r));
    }
    return rows;
  };
  if (OBS_VAL.validacao_ipi) OBS_VAL.validacao_ipi += ' Devolução de compra (CFOP 5202/6202): o valor de outras despesas é o IPI devolvido (valor do IPI).';
