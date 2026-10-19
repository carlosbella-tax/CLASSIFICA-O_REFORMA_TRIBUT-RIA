  /* =====================================================================
     V113 — Aba ICMS ST (pedido de 19/10/2026)
     1. Todos os dados do ICMS ST do XML, inclusive do ICMS 60 / CSOSN 500
        (ST retido anteriormente): depois de valor_st_retido entram
        aliquota_st_retido (pST), icms_substituto (vICMSSubstituto) e o FCP ST
        retido (base, alíquota e valor).
     2. Validação do ICMS ST pela NCM do XML × relação da Portaria SRE nº
        34/2026 (planilha "Portaria SRE nº 342026 revogou", colunas C e D —
        as mesmas 208 NCMs / 174 itens da V107):
        - NCM encontrada → validacao_icms_st "ANALISAR" (vermelho) e observação
          "NCM FOI EXCLUÍDA DA LISTA DE ICMS ST EM 30/09 ATRAVÉS DA Portaria SRE
          nº 34/2026";
        - NCM não encontrada → validacao_icms_st "VALIDADO".
        A coluna validacao_portaria_sre_34_2026 (V107) passa a ser a
        validacao_icms_st. Observação editável, como nas demais abas.
     ===================================================================== */
  const TXT_OBS_SRE34_V113 = 'NCM FOI EXCLUÍDA DA LISTA DE ICMS ST EM 30/09 ATRAVÉS DA Portaria SRE nº 34/2026';
  MAPA_OBS_V75.icmsst = '__obsUsuarioIcmsSt';
  const campoIcmsV113 = (r, tag) => {
    const fim = '_' + String(tag).toUpperCase();
    return Object.keys(r || {}).filter(k => { const u = k.toUpperCase(); return u.includes('_ICMS') && u.endsWith(fim); }).reduce((a, k) => a + num(r[k]), 0);
  };
  // "ANALISAR" em vermelho, como NÃO VALIDADO
  const classeValidacaoV112 = window.classeValidacao;
  window.classeValidacao = v => /^ANALISAR/.test(String(v || '')) ? 'invalid' : classeValidacaoV112(v);

  const linhasIcmsStV112 = window.linhasIcmsSt;
  window.linhasIcmsSt = (...a) => linhasIcmsStV112(...a).map(row => {
    if (!row || 'validacao_icms_st' in row) return row;
    const r = row.__src, x = {};
    for (const k of Object.keys(row)){
      if (k === 'validacao_portaria_sre_34_2026' || k === 'observacao') continue;
      x[k] = row[k];
      if (k === 'valor_st_retido'){
        x.aliquota_st_retido = campoIcmsV113(r, 'pST'); x.icms_substituto = campoIcmsV113(r, 'vICMSSubstituto');
        x.base_fcp_st_retido = campoIcmsV113(r, 'vBCFCPSTRet'); x.aliquota_fcp_st_retido = campoIcmsV113(r, 'pFCPSTRet'); x.valor_fcp_st_retido = campoIcmsV113(r, 'vFCPSTRet');
      }
    }
    const achados = sre34V107(x.ncm, x.cest);
    x.validacao_icms_st = achados.length
      ? 'ANALISAR — NCM ' + x.ncm + ' consta da Portaria SRE nº 34/2026 (excluída do ICMS ST em 30/09/2026): ' + achados.map(it => 'Anexo ' + it[0] + ' item ' + it[1] + ' (CEST ' + it[2] + '): ' + it[4]).join(' | ')
      : 'VALIDADO — NCM ' + (x.ncm || '—') + ' não consta da relação de itens excluídos do ICMS ST pela Portaria SRE nº 34/2026';
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    const comObs = comObsV75(x, 'icmsst');
    if (achados.length && obsUsuarioV71('icmsst')[chaveObsV71(comObs)] === undefined) comObs.observacao = valorObsV71(chaveObsV71(comObs), TXT_OBS_SRE34_V113, 'icmsst');
    return comObs;
  });
  OBS_VAL.validacao_icms_st = 'Portaria SRE nº 34/2026: NCM do XML encontrada entre as NCMs excluídas do ICMS ST em 30/09/2026 → ANALISAR, com a observação; não encontrada → VALIDADO.';
