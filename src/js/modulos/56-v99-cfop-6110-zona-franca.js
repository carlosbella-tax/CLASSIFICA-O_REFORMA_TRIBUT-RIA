  /* =====================================================================
     V99 — CFOP 6110: venda de mercadoria adquirida ou recebida de terceiros,
     destinada à Zona Franca de Manaus (ZFM) ou Áreas de Livre Comércio (ALC)
     - Tabela de CFOP: descrição completa do 6110 (estava truncada) e a mesma
       descrição para o 2110.
     - Conversão cfop_xml → cfop: 6110 → 2110 (entradas e saídas).
     - Aba ICMS: todas as validações VALIDADO, sem novo cálculo (base/valor
       corretos = 0) e observação "ZONA FRANCA" (o texto digitado pelo usuário
       continua prevalecendo).
     ===================================================================== */
  const DESC_ZFM_V99 = 'Venda de mercadoria, adquirida ou recebida de terceiros, destinada à ZFM ou ALC';
  CFOP_TABELA['6110'] = DESC_ZFM_V99; CFOP_TABELA['2110'] = DESC_ZFM_V99;
  const ehZfmV99 = (row, r) => String((row && row.cfop_xml) || (r && (r.cfop_xml || r.cfop)) || '').trim() === '6110';
  // a venda para ZFM/ALC não é tratada como uso e consumo
  const usoConsumoV98 = usoConsumoV90;
  usoConsumoV90 = function(r){ return r && ehZfmV99(null, r) ? null : usoConsumoV98(r); };
  const aplicarCfopV98 = aplicarCfop;
  aplicarCfop = function(){
    const x = aplicarCfopV98.apply(this, arguments);
    for (const r of (itensTodosV70 || state.items)) if (r && ehZfmV99(null, r) && (r.cfop !== '2110' || r.descricao_cfop !== DESC_ZFM_V99)){ r.cfop = '2110'; r.descricao_cfop = DESC_ZFM_V99; }
    return x;
  };
  const linhasIcmsV98 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV98(...a).map(row => {
    if (!ehZfmV99(row, row.__src)) return row;
    if ('cfop' in row) row.cfop = '2110';
    if ('descricao_cfop' in row) row.descricao_cfop = DESC_ZFM_V99;
    for (const k of Object.keys(row)){
      if (k.startsWith('validacao_')) row[k] = 'VALIDADO (ZONA FRANCA — CFOP 6110, venda destinada à ZFM ou ALC: sem novo cálculo)';
      else if (/^(valor|base)_corret/.test(k)) row[k] = 0;
      else if (/_calculad[ao]$/.test(k)) row[k] = 'VALIDADO';
    }
    if ('observacao' in row && obsUsuarioV71('icms')[chaveObsV71(row)] === undefined) row.observacao = valorObsV71(chaveObsV71(row), 'ZONA FRANCA', 'icms');
    return row;
  });
  OBS_VAL.validacao_base_icms += ' CFOP 6110 (venda destinada à ZFM ou ALC): cfop 2110, sempre VALIDADO, sem novo cálculo, observação ZONA FRANCA.';
