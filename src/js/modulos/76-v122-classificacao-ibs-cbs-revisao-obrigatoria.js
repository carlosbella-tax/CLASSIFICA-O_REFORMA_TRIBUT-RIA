  /* =====================================================================
     V122 — Classificação IBS/CBS: revisão obrigatória nos casos em que a
     base não entrega prova suficiente de enquadramento.

     Não permite que lacuna de correlação NCM × cClassTrib, benefício
     potencial declarado como tributação integral, ou CST 410/620 sem
     cClassTrib oficial seja exibido como "VALIDADO". As validações de
     cálculo já concluídas são preservadas; a pendência é de classificação.
     ===================================================================== */
  const linhaIbsCbsV121 = linhaIbsCbs;
  const temCClassV122 = cc => !!cc && Object.prototype.hasOwnProperty.call(CCLASS, cc);
  const marcarRevisaoV122 = (o, campos, motivo) => {
    const txt = 'NÃO VALIDADO (REVISÃO OBRIGATÓRIA — ' + motivo + ')';
    for (const campo of campos) if (campo in o) o[campo] = txt;
    return o;
  };
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV121(r); if (!o) return o;
    const cst = String(o.cst_ibs_cbs || '').trim().padStart(3, '0');
    const cc = String(o.cclasstrib || '').trim();
    const candidato = String(o.cclasstrib_candidato_capitulo || '');
    const cands = candidato.match(/\d{6}/g) || [];
    const semCorrelacao = candidato === '000001 (tributação integral)'
      && /^— \(presume-se CST 000/.test(String(o.anexo_candidato_capitulo || ''));

    // CST 410/620 não pode apagar a verificação da própria classificação.
    if ((cst === '410' || cst === '620') && !temCClassV122(cc)) {
      return marcarRevisaoV122(o, ['validacao_cclasstrib', 'validacao_ncm_cclasstrib', 'validacao_cst_ibs_cbs'],
        'CST ' + cst + ' informado sem cClassTrib oficial identificada');
    }

    // Benefício candidato exige confirmação formal quando o XML usa CST 000.
    if (cst === '000' && cands.length && !cands.includes(cc)) {
      return marcarRevisaoV122(o, ['validacao_cclasstrib', 'validacao_ncm_cclasstrib', 'validacao_cst_ibs_cbs'],
        'NCM com cClassTrib candidato ' + cands.join(' / ') + ' e XML em tributação integral');
    }

    // Ausência de correlação não comprova a classificação tributária integral.
    if (cst === '000' && semCorrelacao) {
      return marcarRevisaoV122(o, ['validacao_cclasstrib', 'validacao_ncm_cclasstrib'],
        'NCM sem correlação específica NCM × cClassTrib na matriz');
    }
    return o;
  };
  OBS_VAL.validacao_cclasstrib = String(OBS_VAL.validacao_cclasstrib || '')
    + ' V122: ausência de correlação, benefício potencial ou CST 410/620 sem cClassTrib oficial exige revisão obrigatória.';
