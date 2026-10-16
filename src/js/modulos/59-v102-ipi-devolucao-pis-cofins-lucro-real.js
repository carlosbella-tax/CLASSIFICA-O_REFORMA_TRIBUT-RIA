  /* =====================================================================
     V102 (pedido de 16/10/2026)
     1. Aba IPI — IPI devolvido no grupo <impostoDevol><IPI><vIPIDevol>: o valor
        vai para valor_ipi_xml; base e alíquota de IPI não são validadas
        (validações VALIDADO, valor correto 0) e a observação traz o valor com a
        descrição "DEVOLUÇÃO" (o texto digitado pelo usuário prevalece). Item
        sem grupo de IPI, mas com vIPIDevol, também entra na aba IPI.
     2. Dashboard — PIS/COFINS: empresa do Lucro Real (campo "Regime
        tributário" dos dados iniciais) → nas ENTRADAS, alíquota de PIS 1,65% e
        de COFINS 7,60% e valor = base × alíquota (crédito da não
        cumulatividade). Saídas continuam com os valores do XML; o saldo
        (créditos − débitos) segue com esses valores. Vale para o quadro
        PIS/COFINS do Resumo geral, as seções PIS e COFINS e o gráfico.
     ===================================================================== */
  const ipiDevolV102 = r => arred(num(campoGrupo(r, 'impostoDevol', 'vIPIDevol')));
  function aplicarIpiDevolV102(row, r){
    const v = ipiDevolV102(r); if (v <= 0.005) return row;
    row.valor_ipi_xml = v;
    if ('validacao_cst_ipi' in row) row.validacao_cst_ipi = 'VALIDADO (DEVOLUÇÃO: IPI devolvido informado no grupo impostoDevol)';
    if ('validacao_ipi' in row) row.validacao_ipi = 'VALIDADO (DEVOLUÇÃO: IPI devolvido ' + brl(v) + ' — vIPIDevol; base e alíquota de IPI não conferidas)';
    if ('valor_correto_ipi' in row) row.valor_correto_ipi = 0;
    if ('observacao' in row && obsUsuarioV71('ipi')[chaveObsV71(row)] === undefined) row.observacao = valorObsV71(chaveObsV71(row), 'DEVOLUÇÃO — IPI devolvido ' + brl(v), 'ipi');
    return row;
  }
  const linhasIpiV101 = window.linhasIpi;
  window.linhasIpi = (...a) => {
    const rows = linhasIpiV101(...a).map(row => row.__src ? aplicarIpiDevolV102(row, row.__src) : row);
    const ja = new Set(rows.map(x => x.__src).filter(Boolean));
    const extra = semCanceladasV70(() => state.items.filter(r => r && !ja.has(r) && !r.dados_nfse && ipiDevolV102(r) > 0.005));
    for (const r of extra){
      let row = window.linhaIpi(r); if (!row) continue;
      if (!row.__src) Object.defineProperty(row, '__src', {value: r, configurable: true, writable: true});
      row = moverUsoV93(comUsoConsumoV90(comObsV75(row, 'ipi'), r, 'cfop_xml'));
      rows.push(aplicarIpiDevolV102(row, r));
    }
    return rows;
  };
  if (OBS_VAL.validacao_ipi) OBS_VAL.validacao_ipi += ' IPI devolvido (impostoDevol/vIPIDevol): valor do IPI no XML, sem validar base e alíquota; observação DEVOLUÇÃO.';

  /* ---------- Dashboard: entradas do Lucro Real a 1,65% (PIS) e 7,60% (COFINS) ---------- */
  const ALIQ_LR_V102 = {pis: 1.65, cofins: 7.6};
  const lucroRealV102 = () => String(($('regimeEmpresa') || {}).value || '') === 'Lucro Real';
  const entradaLRV102 = r => lucroRealV102() && tipoOperacao(r) !== 'SAÍDAS';
  for (const id of ['pis', 'cofins']){
    const imp = IMPOSTOS.find(i => i.id === id); if (!imp) continue;
    const vAnt = imp.v, aAnt = imp.aliq;
    imp.v = r => { const [b, v] = vAnt(r); return entradaLRV102(r) ? [b, arred(num(b) * ALIQ_LR_V102[id] / 100)] : [b, v]; };
    imp.aliq = r => entradaLRV102(r) ? ALIQ_LR_V102[id] : aAnt(r);
  }
  const ajustarResumoV101 = ajustarResumo;
  ajustarResumo = function(){
    ajustarResumoV101();
    const tb = $('dashPisRows'); if (!tb || !lucroRealV102()) return;
    const th = tb.closest('table').querySelector('thead');
    tabelaMovimento(tb, th,
      [{t: 'Base PIS/COFINS', k: 'b', tipo: 'm'}, {t: 'Alíq. PIS', k: 'ap', tipo: 'p'}, {t: 'Valor PIS', k: 'p', tipo: 'm'}, {t: 'Alíq. COFINS', k: 'ac', tipo: 'p'}, {t: 'Valor COFINS', k: 'c', tipo: 'm'}],
      agruparMov(r => temGrupoFiscal(r, 'PIS') || temGrupoFiscal(r, 'COFINS'),
        r => entradaLRV102(r) ? {ap: ALIQ_LR_V102.pis, ac: ALIQ_LR_V102.cofins} : {ap: r4(valorGrupo(r, 'PIS', 'pPIS')), ac: r4(valorGrupo(r, 'COFINS', 'pCOFINS'))},
        r => {
          const b = valorGrupo(r, 'PIS', 'vBC') || valorGrupo(r, 'COFINS', 'vBC');
          return entradaLRV102(r) ? {b, p: arred(num(b) * ALIQ_LR_V102.pis / 100), c: arred(num(b) * ALIQ_LR_V102.cofins / 100)}
                                  : {b, p: valorGrupo(r, 'PIS', 'vPIS'), c: valorGrupo(r, 'COFINS', 'vCOFINS')};
        }));
    const tabela = tb.closest('table'), ant = tabela.parentNode.querySelector('.v102-nota'); if (ant) ant.remove();
    tabela.insertAdjacentHTML('afterend', '<p class="subtle v102-nota">Lucro Real: nas entradas, PIS 1,65% e COFINS 7,60% sobre a base (crédito da não cumulatividade); nas saídas, os valores do XML. Entradas (−) Saídas = créditos − débitos.</p>');
  };
