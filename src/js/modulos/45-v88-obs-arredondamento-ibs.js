  /* =====================================================================
     V88 — Observações automáticas (o texto do usuário substitui o padrão):
     Aba ICMS: base com redução (pRedBC) NÃO VALIDADA → o texto da validação
       mostra a diferença em relação à base do XML e a observação recebe
       "Erro de cálculo de arredondamento".
     Aba Base de IBS/CBS: base NÃO VALIDADA cuja diferença é igual a IBS + CBS
       (margem de R$ 0,05) → observação "Cálculo errado excluindo o valor de
       IBS e CBS".
     ===================================================================== */
  const linhasIcmsV87 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV87(...a).map(row => {
    const t = String(row.validacao_base_icms || ''), bc = typeof row.base_correta_icms === 'number' ? row.base_correta_icms : 0;
    if (!/^NÃO VALIDADO/.test(t) || !/× \(1 − /.test(t) || bc <= 0) return row;
    if (!/diferença:/.test(t)) row.validacao_base_icms = t + ' diferença: ' + brl(arred(num(row.base_icms_xml) - bc));
    return comObsPadraoV86(row, 'icms', ['Erro de cálculo de arredondamento']);
  });
  const linhaIbsCbsV87 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV87(r); if (!o) return o;
    const bc = typeof o.base_correta_ibs_cbs === 'number' ? o.base_correta_ibs_cbs : 0, tributos = arred(num(o.valor_ibs_total) + num(o.valor_cbs));
    if (bc > 0 && tributos > 0.005 && /^(NÃO VALIDADO|INCORRETO)/.test(String(o.validacao_base_ibs_cbs || ''))
        && Math.abs(Math.abs(arred(num(o.base_ibs_cbs_xml) - bc)) - tributos) <= 0.0501)
      return comObsPadraoV86(o, 'ibscbs', ['Cálculo errado excluindo o valor de IBS e CBS']);
    return o;
  };
