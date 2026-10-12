  /* =====================================================================
     V78 — Base de IBS/CBS: CFOP 6911 (remessa de amostra grátis) deve
     vir com CST 410 e cClassTrib 410999. CST 410 não tem base nem valor
     de IBS/CBS. Cada validação aponta o que estiver diferente; base e
     valores destacados no XML ficam NÃO VALIDADO (o correto é zero).
     Nas entradas, vale pelo CFOP original do XML (6911).
     V79 — a mesma regra para o CFOP 5911 (amostra grátis dentro do estado).
     V80 — tabela de operações com CST 410 (imunidade e não incidência):
       5911/6911  amostra grátis ............................ 410999
       5910/6910  bonificação, doação ou brinde ............. 410001 ou 410003
       7101/7102/7105/7106/7127/7501/7949  exportação ...... 410004 ou 410027
       5927       baixa por perda, roubo ou perecimento ..... 410030
       cClassTrib 410037 (importação sem incidência), em qualquer CFOP:
       só confere CST 410, sem base e sem IBS/CBS.
     ===================================================================== */
  const REGRAS_CST410_V80 = [
    {cfops: ['5911', '6911'], codigos: ['410999'], nome: 'amostra grátis'},
    {cfops: ['5910', '6910'], codigos: ['410001', '410003', '410999'], nome: 'bonificação, doação ou brinde'},   // V86: 410999 também aceito
    {cfops: ['7101', '7102', '7105', '7106', '7127', '7501', '7949'], codigos: ['410004', '410027'], nome: 'exportação'},
    {cfops: ['5927'], codigos: ['410030'], nome: 'baixa por perda, roubo ou perecimento'}
  ];
  const REGRA_POR_CFOP_V80 = new Map; for (const g of REGRAS_CST410_V80) for (const c of g.cfops) REGRA_POR_CFOP_V80.set(c, g);
  const CFOP_AMOSTRA_V78 = new Set(['6911', '5911']);   // mantido para referência (V78/V79)
  const linhaIbsCbsV77 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV77(r); if (!o) return o;
    const src = o.__src || r || {}, cfop = String(o.cfop_xml || src.cfop_xml || src.cfop || '').trim();
    const cc = String(o.cclasstrib || '').trim(), g = REGRA_POR_CFOP_V80.get(cfop);
    if (!g && cc !== '410037') return o;
    const cst = String(o.cst_ibs_cbs || '').trim().padStart(3, '0');
    const base = arred(num(o.base_ibs_cbs_xml)), ibs = arred(num(o.valor_ibs_total)), cbs = arred(num(o.valor_cbs));
    const reg = g ? 'CFOP ' + cfop + ' — ' + g.nome + ': CST 410 e cClassTrib ' + g.codigos.join(' ou ') + ', sem base e sem IBS/CBS'
      : 'cClassTrib 410037 — importação de bens materiais sem incidência: CST 410, sem base e sem IBS/CBS';
    const ok = 'VALIDADO (' + reg + ')';
    o.validacao_cst_ibs_cbs = cst === '410' ? ok : 'NÃO VALIDADO (' + reg + '; o XML traz CST ' + (o.cst_ibs_cbs || 'vazio') + ')';
    o.validacao_cclasstrib = !g || g.codigos.includes(cc) ? ok : 'NÃO VALIDADO (' + reg + '; o XML traz cClassTrib ' + (cc || 'vazio') + ')';
    if ('validacao_ncm_cclasstrib' in o) o.validacao_ncm_cclasstrib = 'VALIDADO (' + reg + ' — não depende do NCM)';
    o.validacao_base_ibs_cbs = base <= 0.05 ? ok : 'NÃO VALIDADO (CST 410 não tem base de IBS/CBS; o XML traz ' + brl(base) + ') diferença: ' + brl(base);
    o.validacao_ibs = ibs <= 0.05 ? ok : 'NÃO VALIDADO (CST 410 não tem IBS; o XML traz ' + brl(ibs) + ') diferença: ' + brl(ibs);
    o.validacao_cbs = cbs <= 0.05 ? ok : 'NÃO VALIDADO (CST 410 não tem CBS; o XML traz ' + brl(cbs) + ') diferença: ' + brl(cbs);
    for (const k of ['base_correta_ibs_cbs', 'valor_correto_ibs', 'valor_correto_cbs']) if (k in o) o[k] = 0;
    return o;
  };
  OBS_VAL.validacao_cst_ibs_cbs = String(OBS_VAL.validacao_cst_ibs_cbs || '') + ' CST 410 (sem base e sem IBS/CBS): CFOP 5911/6911 amostra grátis → 410999; 5910/6910 bonificação, doação ou brinde → 410001 ou 410003; exportação 7101/7102/7105/7106/7127/7501/7949 → 410004 ou 410027; 5927 baixa por perda, roubo ou perecimento → 410030; 410037 importação sem incidência.';
