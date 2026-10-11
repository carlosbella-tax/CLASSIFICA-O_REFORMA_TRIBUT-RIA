  /* =====================================================================
     V66 — Apresentação (Lucro Presumido): informa o regime ao gerador do
     PowerPoint. PIS e COFINS das entradas aparecem só como informação; o
     saldo e o valor a recolher são somente as saídas (slides de PIS/COFINS,
     Saldo por imposto e Resumo). Regra no gerador-pptx.js (comentário V66).
     ===================================================================== */
  const dadosApresentacaoV65 = dadosApresentacao;
  dadosApresentacao = function(){
    const D = dadosApresentacaoV65();
    D.lucroPresumido = lucroPresumido();
    return D;
  };
