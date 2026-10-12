  /* =====================================================================
     V78 — Base de IBS/CBS: CFOP 6911 (remessa de amostra grátis) deve
     vir com CST 410 e cClassTrib 410999. CST 410 não tem base nem valor
     de IBS/CBS. Cada validação aponta o que estiver diferente; base e
     valores destacados no XML ficam NÃO VALIDADO (o correto é zero).
     Nas entradas, vale pelo CFOP original do XML (6911).
     V79 — a mesma regra para o CFOP 5911 (amostra grátis dentro do estado).
     ===================================================================== */
  const CFOP_AMOSTRA_V78 = new Set(['6911', '5911']);   // V79: 5911 (amostra grátis dentro do estado)
  const linhaIbsCbsV77 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV77(r); if (!o) return o;
    const src = o.__src || r || {}, cfop = String(o.cfop_xml || src.cfop_xml || src.cfop || '').trim();
    if (!CFOP_AMOSTRA_V78.has(cfop)) return o;
    const cst = String(o.cst_ibs_cbs || '').trim().padStart(3, '0'), cc = String(o.cclasstrib || '').trim();
    const base = arred(num(o.base_ibs_cbs_xml)), ibs = arred(num(o.valor_ibs_total)), cbs = arred(num(o.valor_cbs));
    const reg = 'CFOP ' + cfop + ' — amostra grátis: CST 410 e cClassTrib 410999, sem base e sem IBS/CBS';
    const ok = 'VALIDADO (' + reg + ')';
    o.validacao_cst_ibs_cbs = cst === '410' ? ok : 'NÃO VALIDADO (' + reg + '; o XML traz CST ' + (o.cst_ibs_cbs || 'vazio') + ')';
    o.validacao_cclasstrib = cc === '410999' ? ok : 'NÃO VALIDADO (' + reg + '; o XML traz cClassTrib ' + (cc || 'vazio') + ')';
    if ('validacao_ncm_cclasstrib' in o) o.validacao_ncm_cclasstrib = 'VALIDADO (' + reg + ' — não depende do NCM)';
    o.validacao_base_ibs_cbs = base <= 0.05 ? ok : 'NÃO VALIDADO (CST 410 não tem base de IBS/CBS; o XML traz ' + brl(base) + ') diferença: ' + brl(base);
    o.validacao_ibs = ibs <= 0.05 ? ok : 'NÃO VALIDADO (CST 410 não tem IBS; o XML traz ' + brl(ibs) + ') diferença: ' + brl(ibs);
    o.validacao_cbs = cbs <= 0.05 ? ok : 'NÃO VALIDADO (CST 410 não tem CBS; o XML traz ' + brl(cbs) + ') diferença: ' + brl(cbs);
    for (const k of ['base_correta_ibs_cbs', 'valor_correto_ibs', 'valor_correto_cbs']) if (k in o) o[k] = 0;
    return o;
  };
  OBS_VAL.validacao_cst_ibs_cbs = String(OBS_VAL.validacao_cst_ibs_cbs || '') + ' CFOP 5911 e 6911 (amostra grátis): CST 410 e cClassTrib 410999, sem base e sem IBS/CBS.';
