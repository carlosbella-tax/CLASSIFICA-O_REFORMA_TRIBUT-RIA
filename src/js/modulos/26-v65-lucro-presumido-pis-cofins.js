  /* =====================================================================
     V65 — Lucro Presumido: PIS e COFINS no regime cumulativo (0,65% e 3%
     sobre a receita bruta), sem direito a crédito das compras.
     - Dashboard › Inconsistências (e slides de observações): nenhuma
       inconsistência de PIS/COFINS das notas de ENTRADA.
     - Quadro PIS/COFINS do Resumo geral: entradas só informativas; a linha
       "Entradas (−) Saídas" vira "a recolher — somente saídas".
     - Seções PIS e COFINS (Entradas e Saídas): o cartão de saldo mostra
       somente as saídas.
     ===================================================================== */
  const lucroPresumido = () => String(($('regimeEmpresa') || {}).value || '') === 'Lucro Presumido';

  const coletarInconsistenciasV64 = coletarInconsistencias;
  coletarInconsistencias = function(){
    const itens = coletarInconsistenciasV64();
    return lucroPresumido() ? itens.filter(x => !(x.aba === 'PIS/COFINS' && x.mv === 'E')) : itens;
  };

  const tabelaMovimentoV64 = tabelaMovimento;
  tabelaMovimento = function(tbody, thead, cols, itens){
    tabelaMovimentoV64(tbody, thead, cols, itens);
    if (!tbody || tbody.id !== 'dashPisRows') return;
    const tabela = tbody.closest('table'), notaAnt = tabela && tabela.parentNode.querySelector('.v65-nota');
    if (notaAnt) notaAnt.remove();
    if (!lucroPresumido()) return;
    const trs = [...tbody.rows], rot = tr => tr.cells[0].textContent.trim();
    for (const tr of trs) if (rot(tr) === 'Entradas') tr.cells[0].textContent = 'Entradas (informativo)';
    const totS = trs.find(tr => rot(tr) === 'Total Saídas'), dif = trs.find(tr => rot(tr) === 'Entradas (−) Saídas');
    if (totS && dif) dif.innerHTML = '<td>A recolher — somente saídas (Lucro Presumido)</td>' + [...totS.cells].slice(1).map(c => '<td>' + c.innerHTML + '</td>').join('');
    if (tabela) tabela.insertAdjacentHTML('afterend', '<p class="subtle v65-nota">Lucro Presumido: PIS e COFINS no regime cumulativo (0,65% e 3% sobre a receita), sem crédito das compras. As entradas aparecem apenas como informação e não entram na apuração.</p>');
  };

  const secaoImpostoV64 = secaoImposto;
  secaoImposto = function(imp, g){
    const html = secaoImpostoV64(imp, g);
    if (!lucroPresumido() || !imp || (imp.id !== 'pis' && imp.id !== 'cofins')) return html;
    const S = g['SAÍDAS'], ini = html.indexOf('<div class="dashboard-metric v17-kpi saldo">'); if (ini < 0) return html;
    const fim = html.indexOf('</div>', ini) + 6;
    return html.slice(0, ini) + '<div class="dashboard-metric v17-kpi saldo"><small>A RECOLHER — somente saídas (Lucro Presumido)</small><strong>' + brl(S.valor) + '</strong><span>Base ' + brl(S.base)
      + '</span><span>Regime cumulativo: as entradas não geram crédito</span></div>' + html.slice(fim);
  };
