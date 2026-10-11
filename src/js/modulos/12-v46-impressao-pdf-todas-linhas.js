  /* =====================================================================
     V46 — Impressão/PDF: todas as linhas da aba aberta, fonte menor e
     tabelas reduzidas para caber na largura da página (A4 paisagem).
     ===================================================================== */
  const IMPRESSAO = {pag: null};
  const LARGURA_PAGINA = 940;   // V47: largura útil com folga (A4/Carta paisagem, margens padrão do navegador)
  function prepararImpressao(){
    if (IMPRESSAO.pag) return;
    const aba = document.querySelector('.tab.active')?.dataset.tab;
    IMPRESSAO.pag = {};
    // abas de lista: imprime todas as linhas (sem paginação)
    const tid = ABA_TABELA[aba];
    if (tid){
      const p = PAG[tid] || (PAG[tid] = {pagina: 0, tamanho: 100});
      IMPRESSAO.pag = {tid, tamanho: p.tamanho, pagina: p.pagina};
      p.tamanho = 1e9; p.pagina = 0;
      try { renderAba(aba); } catch(e){}
    }
    // reduz as tabelas largas para caber na página
    document.body.classList.add('v46-imp');   // aplica o layout de impressão para medir
    const painel = document.querySelector('.panel.active');
    IMPRESSAO.zoom = [];
    if (painel) for (const tb of painel.querySelectorAll('table')){
      tb.style.zoom = ''; tb.classList.remove('v46-nw', 'v46-mw');
      // 1º: uma linha por célula; se precisar reduzir demais, quebra o texto com largura mínima por coluna
      tb.classList.add('v46-nw'); let w = tb.scrollWidth, z = LARGURA_PAGINA / w;
      if (z < 0.6){
        tb.classList.remove('v46-nw'); tb.classList.add('v46-mw');
        // colunas de texto longo ganham mais largura para não virar uma tira estreita
        const heads = [...tb.querySelectorAll('thead tr:last-child th')];
        heads.forEach((th, i) => {
          const t = (th.title || th.textContent || '').toLowerCase();
          const cls = /descri|nome|observ|anexo|capitulo|motivo|natureza|valida/.test(t) ? 'v46-largo' : /chave|razao|regime|cfop_xml/.test(t) ? 'v46-medio' : '';
          if (!cls) return;
          th.classList.add(cls);
          for (const tr of tb.querySelectorAll('tbody tr')){ const td = tr.children[i]; if (td) td.classList.add(cls); }
        });
        w = tb.scrollWidth; z = LARGURA_PAGINA / w;
      }
      if (z < 1){ tb.style.zoom = Math.max(0.3, z).toFixed(3); }
      IMPRESSAO.zoom.push(tb);
    }
  }
  function concluirImpressao(){
    if (!IMPRESSAO.pag) return;
    for (const tb of IMPRESSAO.zoom || []){ tb.style.zoom = ''; tb.classList.remove('v46-nw', 'v46-mw'); tb.querySelectorAll('.v46-largo,.v46-medio').forEach(e => e.classList.remove('v46-largo', 'v46-medio')); }
    document.body.classList.remove('v46-imp');
    const {tid, tamanho, pagina} = IMPRESSAO.pag;
    IMPRESSAO.pag = null;
    if (tid && PAG[tid]){ PAG[tid].tamanho = tamanho; PAG[tid].pagina = pagina; try { render(); } catch(e){} }
  }
  window.addEventListener('beforeprint', prepararImpressao);
  window.addEventListener('afterprint', concluirImpressao);
  window.prepararImpressao = prepararImpressao; window.concluirImpressao = concluirImpressao;
  // botão de impressão em cada aba
  for (const barra of document.querySelectorAll('.v45-bar')){
    const b = document.createElement('button'); b.type = 'button'; b.className = 'secondary v46-print'; b.textContent = '🖨 Imprimir / PDF';
    b.onclick = () => { prepararImpressao(); setTimeout(() => { window.print(); }, 50); };
    barra.querySelector('[data-salvar]').insertAdjacentElement('beforebegin', b);
  }

