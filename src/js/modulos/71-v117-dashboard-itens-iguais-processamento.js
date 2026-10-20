  /* =====================================================================
     V117 — Dashboard (e impressão em PDF): "Itens analisados" igual à aba
     Processamento do lote
     O quadro da empresa no Dashboard contava os itens sem as notas
     canceladas (que desde a V70 ficam fora das apurações), enquanto a aba
     Processamento conta todos os itens carregados (ex.: 549 × 591).
     Agora "Documentos" e "Itens analisados" mostram os mesmos números do
     processamento; o subtítulo informa quantos itens são de notas canceladas
     e ficam fora das apurações. Com filtro de consulta no Dashboard, vale a
     contagem filtrada (V15).
     ===================================================================== */
  const renderDashboardV116 = window.renderDashboard;
  window.renderDashboard = function(){
    const r = renderDashboardV116.apply(this, arguments);
    try {
      const f = fAba('dashboard');
      if (f.cnpj || f.op || f.cfop || f.ncm || f.cst) return r;
    } catch(e){}
    const todos = itensTodosV70 || state.items, total = todos.length, docs = state.docs.length;
    const canceladas = total - semCanceladosV70(todos).length;
    if ($('dashItems')) $('dashItems').textContent = fmtInt(total);
    if ($('dashDocs')) $('dashDocs').textContent = fmtInt(docs);
    if ($('dashSubtitle') && docs) $('dashSubtitle').textContent = fmtInt(docs) + ' documento(s) e ' + fmtInt(total) + ' item(ns) consolidados da carga atual'
      + (canceladas > 0 ? ' (' + fmtInt(canceladas) + ' item(ns) de notas canceladas ficam fora das apurações).' : '.');
    return r;
  };
