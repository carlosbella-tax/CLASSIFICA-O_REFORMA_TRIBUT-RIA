  /* =====================================================================
     V112 — Aba Processar: o campo "Duplicados ignorados" fica sempre vazio.
     Desde a V111 todo arquivo duplicado (XML ou PDF) é excluído
     automaticamente ao carregar; a contagem deixou de ser informação útil
     (pedido de 16/10/2026 → 19/10/2026). A relação dos excluídos continua em
     state.duplicados.
     ===================================================================== */
  const limparDupV112 = () => { const el = $('pDup'); if (el && el.textContent !== '') el.textContent = ''; };
  const resetPainelV111 = resetPainel;
  resetPainel = function(){ const r = resetPainelV111.apply(this, arguments); limparDupV112(); return r; };
  const atualizarPainelV111 = atualizarPainel;
  atualizarPainel = function(){ const r = atualizarPainelV111.apply(this, arguments); limparDupV112(); return r; };
  const renderV111 = window.render;
  window.render = function(){ const r = renderV111.apply(this, arguments); limparDupV112(); setTimeout(limparDupV112, 0); return r; };
