  /* =====================================================================
     V56 — PIS/COFINS: CST não validada torna a base INCORRETA, com a base
     correta = valor total dos produtos − ICMS; NCM 4818.10.00 (papel higiênico)
     ===================================================================== */
  const linhasPisV55 = window.linhasPisCofins;
  window.linhasPisCofins = () => linhasPisV55().map(row => {
    const r = row.__src; if (!r) return row;
    const baseCorreta = arred(num(row.valor_total_produtos !== undefined ? row.valor_total_produtos : r.valor_item) - num(row.valor_icms_xml));
    for (const [cst, bVal, bCor, nome] of [['validacao_cst_pis', 'validacao_base_pis', 'base_correta_pis', 'PIS'], ['validacao_cst_cofins', 'validacao_base_cofins', 'base_correta_cofins', 'COFINS']]){
      if (!/^(INCORRETO|NÃO VALIDADO)/.test(String(row[cst] || ''))) continue;
      row[bVal] = 'INCORRETO (CST ' + (nome === 'PIS' ? 'do ' : 'da ') + nome + ' não validada — base de ' + nome + ' deve ser valor total dos produtos − ICMS: ' + brl(baseCorreta) + ')';
      row[bCor] = baseCorreta;
    }
    return row;
  });
  OBS_VAL.validacao_base_pis = OBS_VAL.validacao_base_cofins = 'Base de PIS/COFINS = valor total dos produtos − ICMS (Lei 14.592/2023). Se a CST do PIS/COFINS não for validada, a base também fica INCORRETA e a base correta é valor dos produtos − ICMS. Na importação, base = valor aduaneiro.';

  // NCM 4818.10.00 — papel higiênico: CST 200, cClassTrib 200035, redução de 60% do IBS e da CBS (Anexo VIII da LC 214/2025)
  (function(){
    const u = s => { let i = REF39.u.indexOf(s); if (i < 0){ REF39.u.push(s); i = REF39.u.length - 1; } return i; };
    const atual = REF39.tipi['48181000'];
    REF39.tipi['48181000'] = [atual ? atual[0] : 'Papel higiênico', u('Anexo VIII (produtos de higiene pessoal e limpeza)'), u('200035'), u('200'),
      u('NCM 4818.10.00 (papel higiênico): CST 200, cClassTrib 200035, redução de 60% das alíquotas do IBS e da CBS (art. 136 e Anexo VIII da LC 214/2025).')];
    CCLASS['200035'] = CCLASS['200035'] || [60, 60, 'art. 136', 'Anexo VIII', 'Fornecimento dos produtos de higiene pessoal e limpeza (Anexo VIII)', '200', 'Vigente', 'Padrão'];
    PRODUTO39.add('200035');
  })();

  /* V57 — Aba ICMS: base_icms_calculada mostra "VALIDADO" quando a base do XML confere */
  const linhasIcmsV56 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV56().map(row => {
    if ('base_icms_calculada' in row && String(row.validacao_base_icms || '').startsWith('VALIDADO')) row.base_icms_calculada = 'VALIDADO';
    return row;
  });
  PAR_CORRETO.base_icms_calculada = 'validacao_base_icms';

