  /* =====================================================================
     V85 — Aba ICMS: coluna regime_tributario logo após nome_emitente (mesma
     informação da aba Itens: opSimpNac ou CRT do emitente). Quando o regime
     é Simples Nacional (códigos 2, 3 e 4) e o XML não destaca valor de frete,
     a coluna observacao vem preenchida com "Valor do frete não destacado no
     XML" (o texto digitado pelo usuário substitui o padrão).
     ===================================================================== */
  const OBS_FRETE_SN_V85 = 'Valor do frete não destacado no XML';
  const REGIME_SN_V85 = new Set(['2', '3', '4']);
  const linhasIcmsV84 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV84(...a).map(row => {
    const r = row.__src; if (!r) return row;
    const info = regimeItem(r), x = {};
    for (const k of Object.keys(row)){ if (k === 'regime_tributario') continue; x[k] = row[k]; if (k === 'nome_emitente') x.regime_tributario = textoRegime(info); }
    if (!('regime_tributario' in x)) x.regime_tributario = textoRegime(info);
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    if (REGIME_SN_V85.has(String(info.cod)) && num(x.valor_frete) <= 0.005 && 'observacao' in x){
      const k = chaveObsV71(x), usuario = obsUsuarioV71('icms')[k];
      x.observacao = valorObsV71(k, usuario !== undefined ? usuario : OBS_FRETE_SN_V85, 'icms');
    }
    return x;
  });
