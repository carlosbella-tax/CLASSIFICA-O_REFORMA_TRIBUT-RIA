  /* =====================================================================
     V103 (pedido de 16/10/2026)
     1. XML com base (vBC) e valor (vICMS) de ICMS, mas sem alíquota (pICMS):
        aliquota_icms = valor do ICMS ÷ base × 100 (2 casas). Vale para a aba
        Itens, a aba ICMS (validações usam a alíquota calculada) e o Dashboard
        (quadros por alíquota), pois todos leem a alíquota pelo valorIcms.
     2. regime_tributario opção 3 (Optante ME/EPP — Simples Nacional):
        observação "SIMPLES NACIONAL" na aba Itens (coluna observacao no fim)
        e na aba ICMS (somada às demais observações; o texto digitado pelo
        usuário prevalece).
     ===================================================================== */
  const aliqCalculadaV103 = r => {
    const base = num(valorIcmsV102(r, 'vBC')), valor = num(valorIcmsV102(r, 'vICMS'));
    return base > 0.005 && valor > 0.005 ? Math.round(valor / base * 10000) / 100 : 0;
  };
  const valorIcmsV102 = window.valorIcms;
  window.valorIcms = function(row, tag){
    const v = valorIcmsV102(row, tag);
    if (String(tag).toUpperCase() !== 'PICMS' || num(v) > 0) return v;
    const c = aliqCalculadaV103(row);
    return c > 0 ? c : v;
  };
  const simplesV103 = row => /^3\b/.test(String((row && row.regime_tributario) || '').trim());
  const TXT_SIMPLES_V103 = 'SIMPLES NACIONAL';

  /* aba Itens: coluna observacao no fim */
  const comObsItensV103 = row => { if (row && typeof row === 'object') row.observacao = simplesV103(row) ? TXT_SIMPLES_V103 : ''; return row; };
  const itensComIcmsV102 = window.linhasItensComIcms;
  window.linhasItensComIcms = function(){ return itensComIcmsV102.apply(this, arguments).map(comObsItensV103); };
  const itensVisaoV102 = linhasItensVisao;
  linhasItensVisao = function(){ return itensVisaoV102.apply(this, arguments).map(comObsItensV103); };

  /* aba ICMS: observação SIMPLES NACIONAL */
  const linhasIcmsV102 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV102(...a).map(row => {
    if (!simplesV103(row) || !('observacao' in row) || obsUsuarioV71('icms')[chaveObsV71(row)] !== undefined) return row;
    const atual = String(row.observacao || '').split(' | ').filter(Boolean);
    if (!atual.includes(TXT_SIMPLES_V103)) row.observacao = valorObsV71(chaveObsV71(row), atual.concat(TXT_SIMPLES_V103).join(' | '), 'icms');
    return row;
  });
  OBS_VAL.validacao_base_icms += ' XML sem alíquota de ICMS (pICMS) com base e valor: alíquota = valor ÷ base. Regime opção 3 (Simples Nacional): observação SIMPLES NACIONAL.';
