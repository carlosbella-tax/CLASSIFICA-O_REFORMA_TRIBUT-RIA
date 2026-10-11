  /* =====================================================================
     V68 — Base de IBS/CBS: no NÃO VALIDADO, mostra a diferença logo após o
     parêntese: "NÃO VALIDADO (base de IBS/CBS calculada: R$ 287,51)
     diferença: R$ 12,49". Diferença = base do XML − base calculada.
     ===================================================================== */
  const linhaIbsCbsV67 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = copiaV67(linhaIbsCbsV67(r)), t = String(o.validacao_base_ibs_cbs || '');
    const calc = typeof o.base_correta_ibs_cbs === 'number' ? o.base_correta_ibs_cbs : 0;
    if (/^(NÃO VALIDADO|INCORRETO)/.test(t) && calc > 0 && !/diferença:/.test(t))
      o.validacao_base_ibs_cbs = t + ' diferença: ' + brl(arred(num(o.base_ibs_cbs_xml) - calc));
    return o;
  };
  // Inconsistências: motivo sem o parêntese solto antes da diferença
  const coletarInconsistenciasV67 = coletarInconsistencias;
  coletarInconsistencias = function(){
    return coletarInconsistenciasV67().map(x => x.chave === 'validacao_base_ibs_cbs' ? Object.assign(x, {motivo: String(x.motivo).replace(/\) diferença:/, ' — diferença:')}) : x);
  };
  if (OBS_VAL.validacao_base_ibs_cbs) OBS_VAL.validacao_base_ibs_cbs += ' No NÃO VALIDADO, a diferença mostrada é base do XML − base calculada.';
