  /* =====================================================================
     V84 — Base de IBS/CBS: item em tributação integral (CST 000) cujo NCM
     tem cClassTrib candidato com benefício (cclasstrib_candidato_capitulo)
     não é inconsistência: validacao_ncm_cclasstrib, validacao_cclasstrib,
     validacao_cst_ibs_cbs, validacao_base_ibs_cbs, validacao_ibs e
     validacao_cbs ficam VALIDADO (verde), nada é recalculado (base correta e
     valores corretos = 0) e a coluna observacao vem preenchida com
     "Analisar cClassTrib" (o usuário pode trocar o texto).
     cClassTrib de benefício diferente do candidato continua NÃO VALIDADO (V83).
     ===================================================================== */
  const OBS_PADRAO_V84 = 'Analisar cClassTrib';
  const linhaIbsCbsV83 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV83(r); if (!o) return o;
    const cands = String(o.cclasstrib_candidato_capitulo || '').match(/\d{6}/g) || [];
    const cc = String(o.cclasstrib || '').trim(), cst = String(o.cst_ibs_cbs || '').trim().padStart(3, '0');
    if (cst !== '000' || !cands.length || cands.includes(cc)) return o;
    const txt = 'VALIDADO (tributação integral — o NCM tem cClassTrib candidato ' + cands.join(' / ') + '; analisar cClassTrib)';
    for (const k of ['validacao_ncm_cclasstrib', 'validacao_cclasstrib', 'validacao_cst_ibs_cbs', 'validacao_base_ibs_cbs', 'validacao_ibs', 'validacao_cbs']) if (k in o) o[k] = txt;
    for (const k of ['base_correta_ibs_cbs', 'valor_correto_ibs', 'valor_correto_cbs']) if (k in o) o[k] = 0;
    if ('observacao' in o){
      const k = chaveObsV71(o), usuario = obsUsuarioV71('ibscbs')[k];
      o.observacao = valorObsV71(k, usuario !== undefined ? usuario : OBS_PADRAO_V84, 'ibscbs');
    }
    return o;
  };
  OBS_VAL.validacao_ncm_cclasstrib = String(OBS_VAL.validacao_ncm_cclasstrib || '') + ' Tributação integral (CST 000) em NCM com cClassTrib candidato: VALIDADO, sem cálculo, com a observação "Analisar cClassTrib".';
