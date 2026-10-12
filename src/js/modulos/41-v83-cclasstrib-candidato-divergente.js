  /* =====================================================================
     V83 — Base de IBS/CBS: quando o cClassTrib do XML não está entre os
     cClassTrib candidatos do NCM (cclasstrib_candidato_capitulo), as
     colunas validacao_cclasstrib e validacao_ncm_cclasstrib ficam
     NÃO VALIDADO (antes: VALIDADO com aviso "confirme se o item tem
     benefício"). Não se aplica quando o NCM não tem candidato, às CST de
     operação (não dependem do NCM, ex.: 410, 550, 620) nem às operações
     com regra própria por CFOP (amostra grátis, bonificação, exportação…).
     ===================================================================== */
  const linhaIbsCbsV82 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV82(r); if (!o) return o;
    const cands = String(o.cclasstrib_candidato_capitulo || '').match(/\d{6}/g) || [];
    const cc = String(o.cclasstrib || '').trim(), cst = String(o.cst_ibs_cbs || '').trim().padStart(3, '0');
    if (!cands.length || !cc || cands.includes(cc)) return o;
    if (CST_OPERACAO_IBS.has(cst) || /não depende do NCM/.test(String(o.validacao_ncm_cclasstrib || ''))) return o;
    const txt = 'NÃO VALIDADO (cClassTrib ' + cc + ' do XML diverge do cClassTrib candidato para o NCM ' + (o.ncm || '') + ': ' + cands.join(' / ') + ')';
    o.validacao_cclasstrib = txt;
    if ('validacao_ncm_cclasstrib' in o) o.validacao_ncm_cclasstrib = txt;
    return o;
  };
  for (const k of ['validacao_cclasstrib', 'validacao_ncm_cclasstrib']) OBS_VAL[k] = String(OBS_VAL[k] || '') + ' cClassTrib do XML diferente do candidato do NCM (cclasstrib_candidato_capitulo): NÃO VALIDADO.';
