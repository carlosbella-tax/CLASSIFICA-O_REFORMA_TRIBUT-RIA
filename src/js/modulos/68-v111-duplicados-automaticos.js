  /* =====================================================================
     V111 — Duplicados (XML ou PDF) excluídos automaticamente
     - Arquivo idêntico a outro já carregado (mesmo conteúdo, mesmo com nome
       diferente — ex.: "NF - 0038638 INTERTEK.pdf" e "… 08.2026.pdf") não é
       lido de novo: reaproveita a leitura do primeiro (sem OCR repetido).
     - Documento duplicado (mesma chave de acesso / mesmo prestador e número)
       não entra nas abas e sai da lista de erros; a mensagem final informa
       "N duplicado(s) excluído(s) automaticamente". A relação dos excluídos
       fica em state.duplicados (arquivo e motivo).
     - Contagem sempre visível nas abas depois do processamento (0 em vez
       de em branco).
     ===================================================================== */
  // impressão digital do conteúdo: tamanho + dois hashes de 32 bits (FNV-1a e djb2)
  const digitalV111 = buf => {
    const u = new Uint8Array(buf); let a = 0x811c9dc5, b = 5381;
    for (let i = 0; i < u.length; i++){ a ^= u[i]; a = Math.imul(a, 16777619); b = (Math.imul(b, 33) + u[i]) | 0; }
    return u.length + ':' + (a >>> 0).toString(16) + ':' + (b >>> 0).toString(16);
  };
  let lidosV111 = new Map();
  const setFilesV110 = window.setFiles;
  window.setFiles = function(){ lidosV111 = new Map(); state.duplicados = []; return setFilesV110.apply(this, arguments); };
  const lerTextoV110 = lerTexto;
  lerTexto = async function(f){
    let chave = null;
    try { chave = digitalV111(await f.arrayBuffer()); } catch(e){}
    if (chave && lidosV111.has(chave)) return lidosV111.get(chave);
    const p = lerTextoV110(f);
    if (chave) lidosV111.set(chave, p.catch(e => { lidosV111.delete(chave); throw e; }));
    return p;
  };
  // duplicados fora da lista de erros
  const renderV110 = window.render;
  window.render = function(){
    const dups = (state.errors || []).filter(e => /duplicado ignorado/i.test(e.erro || ''));
    if (dups.length){
      state.duplicados = (state.duplicados || []).concat(dups.map(e => ({arquivo_origem: e.arquivo_origem, pasta_origem: e.pasta_origem, motivo: String(e.erro).replace(/^Documento duplicado ignorado/, 'Duplicado excluído automaticamente')})));
      state.errors = state.errors.filter(e => !/duplicado ignorado/i.test(e.erro || ''));
      const n = dups.length;
      V14.duplicadas = 0;   // a conta de erros da mensagem final passa a ser só a dos erros reais
      try { listarOcorrencias(); } catch(e){}
      if ($('mErrors')) $('mErrors').textContent = fmtInt(state.errors.length);
      setTimeout(() => { for (const id of ['pStatus', 'status']){ const el = $(id); if (el && /0 duplicado\(s\)/.test(el.textContent)) el.textContent = el.textContent.replace(/ 0 duplicado\(s\)/, ' ' + fmtInt(n) + ' duplicado(s) excluído(s) automaticamente'); } }, 0);
    }
    const r = renderV110.apply(this, arguments); zerosV111(); return r;
  };
  // contagem sempre visível nas abas depois do processamento (0 em vez de em branco)
  function zerosV111(){ if ((state.docs || []).length) document.querySelectorAll('.tab[data-tab] .pill').forEach(p => { if (!String(p.textContent).trim()) p.textContent = '0'; }); }
  const badgesV110 = window.atualizarBadgesTributos;
  window.atualizarBadgesTributos = function(){ const r = badgesV110.apply(this, arguments); zerosV111(); return r; };
