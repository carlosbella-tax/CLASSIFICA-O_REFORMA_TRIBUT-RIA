  /* =====================================================================
     V64 — Simples Nacional sem permissão de crédito (CSOSN 102): o item
     não gera crédito de ICMS nem de IPI, então não há base a validar.
     Nas abas ICMS e IPI, todas as validações ficam VALIDADO e nenhum
     valor é recalculado (base correta, valor correto e calculados = 0).
     ===================================================================== */
  const CSOSN_SEM_CREDITO_V64 = new Set(['102']);
  const csosnSemCredito = r => { const c = String(cstGrupo(r, 'ICMS') || '').trim(); return CSOSN_SEM_CREDITO_V64.has(c) ? c : ''; };
  const zerarValidacoesV64 = (o, c) => {
    const motivo = 'VALIDADO (Simples Nacional — CSOSN ' + c + ', sem permissão de crédito: não gera crédito de ICMS e IPI)';
    for (const k of Object.keys(o)){
      if (k.startsWith('validacao_')) o[k] = motivo;
      else if (/^(valor|base)_corret/.test(k)) o[k] = 0;
      else if (/_calculad[ao]$/.test(k)) o[k] = 'VALIDADO';
    }
    return o;
  };
  const linhasIcmsV63 = window.linhasIcms;
  window.linhasIcms = () => linhasIcmsV63().map(row => { const c = row.__src && csosnSemCredito(row.__src); return c ? zerarValidacoesV64(row, c) : row; });
  const linhaIpiV63 = window.linhaIpi;
  window.linhaIpi = r => { const o = linhaIpiV63(r), c = csosnSemCredito(r); return c ? zerarValidacoesV64(o, c) : o; };
  OBS_VAL.validacao_base_icms += ' Simples Nacional sem permissão de crédito (CSOSN 102): não gera crédito, sempre VALIDADO e sem valor recalculado.';
  if (OBS_VAL.validacao_ipi) OBS_VAL.validacao_ipi += ' Simples Nacional sem permissão de crédito (CSOSN 102): sempre VALIDADO e sem valor recalculado.';
