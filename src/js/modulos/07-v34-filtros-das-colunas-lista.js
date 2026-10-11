  /* =====================================================================
     V34 — filtros das colunas: a lista de valores considera os outros
     filtros já aplicados (como no Excel) e uma faixa mostra os filtros
     ativos, com opção de remover um a um ou todos.
     ===================================================================== */
  window.valoresFiltro = function(table, coluna){
    let rows = cacheTabelas[table]?.rows || (table === 'table' ? state.items : []);
    const outros = Object.entries(filtrosTabelas[table] || {}).filter(([c, v]) => c !== coluna && Array.isArray(v) && v.length).map(([c, v]) => [c, new Set(v)]);
    if (outros.length) rows = rows.filter(r => outros.every(([c, set]) => set.has(String(displayValue(c, r[c]) || '').trim())));
    const vistos = new Set, valores = [];
    for (const row of rows){
      const v = String(displayValue(coluna, row[coluna]) || '').trim();
      if (v && !vistos.has(v)){ vistos.add(v); valores.push(v); if (valores.length >= 3000) break; }
    }
    // mantém visíveis os valores já marcados nesta coluna
    for (const v of (filtrosTabelas[table] || {})[coluna] || []) if (!vistos.has(v)){ vistos.add(v); valores.push(v); }
    return valores.sort((a, b) => a.localeCompare(b, 'pt-BR', {numeric: true}));
  };
  function faixaFiltros(chave, tabela){
    if (!tabela) return;
    const wrap = tabela.closest('.table-wrap') || tabela; const card = wrap.parentElement;
    let faixa = document.getElementById('ffaixa-' + chave);
    const ativos = Object.entries(filtrosTabelas[chave] || {}).filter(([, v]) => Array.isArray(v) && v.length);
    if (!ativos.length){ if (faixa) faixa.remove(); return; }
    if (!faixa){ faixa = document.createElement('div'); faixa.id = 'ffaixa-' + chave; faixa.className = 'v34-faixa'; card.insertBefore(faixa, card.firstChild); }
    faixa.innerHTML = '<b>Filtros ativos:</b> ' + ativos.map(([c, v]) => '<span class="v34-chip" title="' + esc(v.join(' | ')) + '"><span class="t">' + esc(c) + ': ' + esc(v.slice(0, 2).join(', ')) + (v.length > 2 ? ' (+' + (v.length - 2) + ')' : '') + '</span>'
        + '<button type="button" data-ftira="' + esc(c) + '" title="Remover este filtro">×</button></span>').join('')
      + '<button type="button" class="secondary v34-limpar" data-flimpa>Limpar todos os filtros</button>'
      + (ativos.length > 1 ? '<span class="v34-dica">Os filtros se somam: a linha precisa atender a todos ao mesmo tempo.</span>' : '');
    faixa.querySelectorAll('[data-ftira]').forEach(b => b.onclick = () => { delete filtrosTabelas[chave][b.dataset.ftira]; redesenharFiltro(chave); });
    faixa.querySelector('[data-flimpa]').onclick = () => { filtrosTabelas[chave] = {}; redesenharFiltro(chave); };
  }
  const rtfV33 = window.renderTabelaFiscal, rtV33 = window.renderTabela, riV33 = window.renderItens;
  window.renderTabelaFiscal = function(id, rows, infoId, msg){ rtfV33(id, rows, infoId, msg); faixaFiltros(id, $(id + 'Table') || $(id)); };
  window.renderTabela = function(id, rows, infoId, msg){ rtV33(id, rows, infoId, msg); faixaFiltros(id, $(id + 'Table') || $(id)); };
  window.renderItens = function(){ riV33(); faixaFiltros('table', $('table')); };

