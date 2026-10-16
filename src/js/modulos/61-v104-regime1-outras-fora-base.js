  /* =====================================================================
     V104 — Aba ICMS, regime_tributario 1 (Não Optante — Lucro Presumido ou
     Lucro Real, ex.: pelo CRT 3): o valor de valor_outras_despesas NÃO compõe
     a base de ICMS. A base é validada de novo:
         produtos − desconto + frete + seguro (+ IPI, só se a base do XML o
         trouxer), com a redução do pRedBC; ICMS = base × alíquota
     e a observação recebe "Outras despesas R$ X não compõem a base de ICMS"
     (o texto digitado pelo usuário prevalece).
     Revalida os itens da regra geral (V62/V63 — operação interna ou
     interestadual), da nota sem redução (V100) e da saída com desconto não
     abatido (V98). As regras que já tiram as outras despesas da base
     (devolução 5202/6202, consumidor final, uso e consumo) e as de ZFM e de
     base de todos os itens em um item (V99/V101) não são recalculadas; o
     valor de outras despesas vai para a observação do mesmo jeito.
     Só operações internas e interestaduais (cfop_xml 1, 2, 5, 6).
     ===================================================================== */
  const regime1V104 = row => /^1\b/.test(String(row.regime_tributario || '').trim());
  const REVALIDA_V104 = /operação inter(na|estadual), CFOP|sem redução de base|não abatido da base de ICMS/;
  const linhasIcmsV103 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV103(...a).map(row => {
    const outras = num(row.valor_outras_despesas);
    if (!regime1V104(row) || outras <= 0.005) return row;
    const r = row.__src, t = String(row.validacao_base_icms || '');
    if (!['1', '2', '5', '6'].includes(String(row.cfop_xml || (r && r.cfop_xml) || '').trim().charAt(0))) return row;   // importação (3xxx): outras podem ser despesas aduaneiras (V95)
    if (REVALIDA_V104.test(t) && !(r && String(r.ind_final || '') === '1'))
      revalidarV100(row, r, 'regime 1 (Não Optante): outras despesas ' + brl(outras) + ' fora da base', true);
    return comObsPadraoV86(row, 'icms', ['Outras despesas ' + brl(outras) + ' não compõem a base de ICMS']);
  });
  OBS_VAL.validacao_base_icms += ' Regime 1 (Não Optante — Lucro Presumido ou Real): outras despesas não compõem a base de ICMS; o valor vai para a observação.';
