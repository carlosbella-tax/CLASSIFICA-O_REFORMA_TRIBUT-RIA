  /* =====================================================================
     V15 — Filtros de consulta por aba: CNPJ (emitente/destinatário),
     operação, CFOP, NCM e CST, com seleção múltipla e opção "Todos".
     ===================================================================== */
  const ABAS_FILTRO = {
    items:     {titulo: 'Itens',             fonte: () => state.items,  cst: 'ICMS'},
    icms:      {titulo: 'ICMS',              fonte: () => state.items.filter(temIcmsFiscal), cst: 'ICMS'},
    icmsst:    {titulo: 'ICMS ST',           fonte: () => state.items.filter(temIcmsStFiscal), cst: 'ICMS'},
    ipi:       {titulo: 'IPI',               fonte: () => state.items.filter(r => temGrupoFiscal(r, 'IPI')), cst: 'IPI'},
    piscofins: {titulo: 'Base de PIS/COFINS', fonte: () => state.items.filter(r => temGrupoFiscal(r, 'PIS') || temGrupoFiscal(r, 'COFINS')), cst: 'PIS'},
    ibscbs:    {titulo: 'Base de IBS/CBS',    fonte: () => state.items.filter(r => temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS')), cst: 'IBS'},
    events:    {titulo: 'Eventos',           fonte: () => state.events, eventos: true},
    dashboard: {titulo: 'Dashboard',         fonte: () => state.items, cst: 'ICMS'}
  };
  const TABELA_DA_ABA = {items: 'table', icms: 'icmsTable', icmsst: 'icmsStTable', ipi: 'ipiTable', piscofins: 'pisCofinsTable', ibscbs: 'ibsCbsTable', events: 'eventsTable'};
  const FILTRO = {};   // FILTRO[aba] = {papel, cnpj:Set|null, op:Set|null, cfop:Set|null, ncm:Set|null, cst:Set|null}
  const fAba = aba => FILTRO[aba] || (FILTRO[aba] = {papel: 'ambos', cnpj: null, op: null, cfop: null, ncm: null, cst: null});
  function resetFiltrosV15(){ Object.keys(FILTRO).forEach(k => delete FILTRO[k]); desenharBarras(); }

  const soDig = v => String(v || '').replace(/\D/g, '');
  const fmtDoc = v => { const d = soDig(v);
    if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return String(v || ''); };
  // participantes de uma linha: [{doc, nome, papel}]
  function participantes(r, eventos){
    if (eventos){
      const out = [], vistos = new Set;
      for (const [k, v] of Object.entries(r)){
        if (/CNPJ|CPF/i.test(k.split('_').pop()) && soDig(v).length >= 11 && !vistos.has(soDig(v))){ vistos.add(soDig(v)); out.push({doc: soDig(v), nome: '', papel: 'emit'}); }
      }
      const ch = String(r.chave_documento || '').match(/\d{44}/);
      if (ch && !vistos.has(ch[0].slice(6, 20))) out.push({doc: ch[0].slice(6, 20), nome: '', papel: 'emit'});
      return out;
    }
    const out = [];
    if (r.emitente_cnpj_cpf) out.push({doc: soDig(r.emitente_cnpj_cpf), nome: r.emitente_razao_social || '', papel: 'emit'});
    if (r.destinatario_cnpj_cpf) out.push({doc: soDig(r.destinatario_cnpj_cpf), nome: r.destinatario_razao_social || '', papel: 'dest'});
    return out;
  }
  const DIM = {
    op:   {rotulo: 'Operação', valor: r => tipoOperacao(r) || 'Não classificada'},
    cfop: {rotulo: 'CFOP', valor: r => r.cfop || 'Sem CFOP', desc: r => r.descricao_cfop || ''},
    ncm:  {rotulo: 'NCM', valor: r => r.ncm || 'Sem NCM'},
    cst:  {rotulo: 'CST', valor: (r, aba) => cstGrupo(r, ABAS_FILTRO[aba].cst) || 'Sem CST', desc: r => r.descricao_cst_icms || ''}
  };
  function passa(r, aba, ignorar){
    const f = fAba(aba), cfg = ABAS_FILTRO[aba];
    if (f.cnpj && ignorar !== 'cnpj'){
      const ps = participantes(r, cfg.eventos).filter(p => f.papel === 'ambos' || p.papel === f.papel);
      if (!ps.some(p => f.cnpj.has(p.doc))) return false;
    }
    if (!cfg.eventos) for (const d of ['op', 'cfop', 'ncm', 'cst']){
      if (f[d] && ignorar !== d && !f[d].has(DIM[d].valor(r, aba))) return false;
    }
    return true;
  }
  const filtrados = (aba, lista) => { const f = fAba(aba);
    return (f.cnpj || f.op || f.cfop || f.ncm || f.cst) ? lista.filter(r => passa(r, aba)) : lista; };

  // Índice original do item (o seletor de operação da aba Itens precisa dele)
  const IDX_GLOBAL = new WeakMap;
  window.linhasItensComIcms = function(){
    return itensIcmsOriginal().map((r, i) => Object.defineProperty(r, '__idx', {value: IDX_GLOBAL.has(state.items[i]) ? IDX_GLOBAL.get(state.items[i]) : i, enumerable: false}));
  };
  let trocando = false;
  function comFiltro(aba, fn){
    if (trocando) return fn();
    const itens = state.items, eventos = state.events;
    itens.forEach((r, i) => IDX_GLOBAL.set(r, i));
    trocando = true;
    try {
      if (ABAS_FILTRO[aba].eventos) state.events = filtrados(aba, eventos);
      else state.items = filtrados(aba, itens);
      return fn();
    } finally { state.items = itens; state.events = eventos; trocando = false; }
  }
  const renderItensV14 = window.renderItens, renderDashV14 = window.renderDashboard, renderAbaV14 = window.renderAba;
  window.renderItens = function(){ comFiltro('items', renderItensV14); resumoFiltro('items'); };
  window.renderDashboard = function(){
    comFiltro('dashboard', () => { renderDashV14(); renderDashImpostos(); }); resumoFiltro('dashboard');
    const f = fAba('dashboard');
    if (f.cnpj || f.op || f.cfop || f.ncm || f.cst){
      const itens = filtrados('dashboard', state.items), docs = new Set(itens.map(r => r.chave_documento || r.arquivo_origem)).size;
      $('dashDocs').textContent = fmtInt(docs);
      $('dashSubtitle').textContent = fmtInt(docs) + ' documento(s) e ' + fmtInt(itens.length) + ' item(ns) conforme a seleção de consulta (total da carga: ' + fmtInt(state.docs.length) + ' documentos).';
    }
  };
  window.renderAba = function(id){
    if (ABAS_FILTRO[id] && id !== 'items' && id !== 'dashboard'){ comFiltro(id, () => renderAbaV14(id)); resumoFiltro(id); return; }
    return renderAbaV14(id);
  };

  // Colunas de CNPJ nas abas ICMS ST, IPI e IBS/CBS (antes não havia como identificar o participante)
  const comParticipantes = fn => r => { const o = fn(r);
    return {tipo_operacao: tipoOperacao(r), chave_documento_fiscal: o.chave_documento_fiscal, numero_documento_fiscal: o.numero_documento_fiscal, data_emissao: o.data_emissao,
      cnpj_emitente: r.emitente_cnpj_cpf || '', nome_emitente: r.emitente_razao_social || '', cnpj_destinatario: r.destinatario_cnpj_cpf || '', nome_destinatario: r.destinatario_razao_social || '',
      cfop: r.cfop || '', descricao_cfop: r.descricao_cfop || '', cfop_xml: r.cfop_xml || r.cfop || '', ...o, tipo_operacao: tipoOperacao(r)}; };
  window.linhaIcmsSt = comParticipantes(window.linhaIcmsSt);
  window.linhaIpi = comParticipantes(window.linhaIpi);
  linhaIbsCbs = comParticipantes(linhaIbsCbs);
  // V28: validação do IPI = Base × Alíquota (ou Qtd × Valor por unidade); se INCORRETO, mostra o valor correto
  const ipiV27 = window.linhaIpi;
  window.linhaIpi = r => {
    const o = ipiV27(r), base = valorGrupo(r, 'IPI', 'vBC'), aliq = valorGrupo(r, 'IPI', 'pIPI'), vIpi = valorGrupo(r, 'IPI', 'vIPI'),
      calc = base ? arred(base * aliq / 100) : arred(valorGrupo(r, 'IPI', 'qUnid') * valorGrupo(r, 'IPI', 'vUnid')), ok = Math.abs(arred(vIpi) - calc) <= 0.0201;
    const cst = String(cstGrupo(r, 'IPI') || '').trim(), sem = SEM_TRIB_IPI.has(cst), esp = calc,
      ok2 = sem || (!(CST_TRIB_IPI.has(cst) && vIpi <= 0.005 && esp > 0.0201) && Math.abs(arred(vIpi) - esp) <= 0.0201);
    const x = {};
    for (const k of Object.keys(o)){
      if (k === 'validacao_ipi' || k === 'valor_correto_ipi') continue;
      x[k] = o[k];
      if (k === 'cst_ipi') x.descricao_cst_ipi = cst ? (CST_IPI[cst.padStart(2, '0')] || 'CST não localizado na tabela') : '';
    }
    x.validacao_cst_ipi = validaCst(cst, CST_TRIB_IPI, SEM_TRIB_IPI, vIpi);
    x.validacao_ipi = ok2 ? 'VALIDADO' : 'INCORRETO';
    x.valor_correto_ipi = ok2 ? 0 : esp;
    return x;
  };


  /* ---------- barra de filtros ---------- */
  function valoresDim(aba, dim){
    const cfg = ABAS_FILTRO[aba], f = fAba(aba), m = new Map;
    // contagem considerando os demais filtros ativos (como no Excel)
    for (const r of cfg.fonte()){
      if (!passa(r, aba, dim)) continue;
      if (dim === 'cnpj'){
        for (const p of participantes(r, cfg.eventos)){
          if (f.papel !== 'ambos' && p.papel !== f.papel) continue;
          const x = m.get(p.doc) || {valor: p.doc, nome: p.nome, n: 0, emit: 0, dest: 0};
          if (!x.nome && p.nome) x.nome = p.nome;
          x.n++; x[p.papel]++; m.set(p.doc, x);
        }
      } else {
        const v = DIM[dim].valor(r, aba), x = m.get(v) || {valor: v, nome: DIM[dim].desc ? DIM[dim].desc(r) : '', n: 0};
        x.n++; m.set(v, x);
      }
    }
    return [...m.values()].sort((a, b) => b.n - a.n || String(a.valor).localeCompare(String(b.valor), 'pt-BR', {numeric: true}));
  }
  function rotuloBotao(aba, dim){
    const s = fAba(aba)[dim], nome = dim === 'cnpj' ? 'CNPJ' : DIM[dim].rotulo;
    if (!s) return nome + ': Todos';
    if (s.size === 1){ const v = [...s][0]; return nome + ': ' + (dim === 'cnpj' ? fmtDoc(v) : v); }
    return nome + ': ' + fmtInt(s.size) + ' selecionados';
  }
  function desenharBarra(aba){
    const painel = $(aba); if (!painel) return;
    let barra = $('fbar-' + aba);
    if (!barra){
      barra = document.createElement('div'); barra.id = 'fbar-' + aba; barra.className = 'card v15-fbar';
      const hero = painel.querySelector('.dashboard-hero');
      if (hero) hero.insertAdjacentElement('afterend', barra);
      else { const primeiro = painel.querySelector('.card'); if (primeiro) primeiro.insertAdjacentElement('afterend', barra); else painel.prepend(barra); }
    }
    const f = fAba(aba), cfg = ABAS_FILTRO[aba], dims = cfg.eventos ? ['cnpj'] : ['cnpj', 'op', 'cfop', 'ncm', 'cst'];
    const ativo = dims.some(d => f[d]);
    barra.innerHTML = '<div class="v15-frow"><b class="v15-ftit">Consultar ' + esc(cfg.titulo) + '</b>'
      + dims.map(d => '<button type="button" class="v15-fbtn' + (f[d] ? ' on' : '') + '" data-fdim="' + d + '">' + esc(rotuloBotao(aba, d)) + ' ▾</button>').join('')
      + (cfg.eventos ? '' : '<label class="v15-papel">CNPJ como <select data-fpapel><option value="ambos"' + (f.papel === 'ambos' ? ' selected' : '') + '>emitente ou destinatário</option><option value="emit"' + (f.papel === 'emit' ? ' selected' : '') + '>emitente</option><option value="dest"' + (f.papel === 'dest' ? ' selected' : '') + '>destinatário</option></select></label>')
      + '<button type="button" class="secondary v15-limpar" data-flimpar' + (ativo ? '' : ' disabled') + '>Mostrar todos</button></div>'
      + '<div class="v15-fres" id="fres-' + aba + '"></div>';
    barra.querySelectorAll('[data-fdim]').forEach(b => b.onclick = e => { e.stopPropagation(); abrirSeletor(aba, b.dataset.fdim, b); });
    const sp = barra.querySelector('[data-fpapel]'); if (sp) sp.onchange = () => { f.papel = sp.value; aplicarFiltro(aba); };
    barra.querySelector('[data-flimpar]').onclick = () => { FILTRO[aba] = {papel: f.papel, cnpj: null, op: null, cfop: null, ncm: null, cst: null}; aplicarFiltro(aba); };
  }
  function desenharBarras(){ const b = $('fbar-dashboard'); if (b) b.remove(); }   // V30: barra Consultar removida também do Dashboard
  // V26: o filtro ▾ das colunas usa as linhas exibidas na aba (inclui tipo_operacao e as colunas montadas)
  window.valoresFiltro = function(table, coluna){
    const rows = cacheTabelas[table]?.rows || (table === 'table' ? state.items : []), vistos = new Set, valores = [];
    for (const row of rows){
      const v = String(displayValue(coluna, row[coluna]) || '').trim();
      if (v && !vistos.has(v)){ vistos.add(v); valores.push(v); if (valores.length >= 3000) break; }
    }
    return valores.sort((a, b) => a.localeCompare(b, 'pt-BR', {numeric: true}));
  };   // V26: barra Consultar removida das abas de listas
  function resumoFiltro(aba){
    const el = $('fres-' + aba); if (!el) return;
    const total = ABAS_FILTRO[aba].fonte().length, n = filtrados(aba, ABAS_FILTRO[aba].fonte()).length, f = fAba(aba);
    const ativo = f.cnpj || f.op || f.cfop || f.ncm || f.cst;
    if (!total){ el.textContent = 'Nenhuma informação carregada para esta aba. Processe os XMLs para consultar.'; return; }
    let txt = ativo ? 'Exibindo ' + fmtInt(n) + ' de ' + fmtInt(total) + ' ' + (ABAS_FILTRO[aba].eventos ? 'eventos' : 'itens') + ' conforme a seleção.'
                    : 'Exibindo todas as ' + fmtInt(total) + ' linhas. Use os botões acima para escolher CNPJ, operação, CFOP, NCM ou CST.';
    if (f.cnpj){
      const nomes = valoresDim(aba, 'cnpj').filter(x => f.cnpj.has(x.valor)).slice(0, 4).map(x => fmtDoc(x.valor) + (x.nome ? ' — ' + x.nome : ''));
      txt += ' CNPJ: ' + nomes.join('; ') + (f.cnpj.size > 4 ? ' e mais ' + (f.cnpj.size - 4) : '') + '.';
    }
    el.textContent = txt;
  }
  function aplicarFiltro(aba){
    const t = TABELA_DA_ABA[aba]; if (t && PAG[t]) PAG[t].pagina = 0;
    desenharBarra(aba);
    if (aba === 'items') renderItens(); else if (aba === 'dashboard') renderDashboard(); else renderAba(aba);
  }

  /* ---------- seletor com caixas de marcação ---------- */
  const pop = document.createElement('div'); pop.id = 'v15Pop'; pop.className = 'v15-pop'; pop.hidden = true; document.body.appendChild(pop);
  let SEL = null;
  function abrirSeletor(aba, dim, botao){
    const lista = valoresDim(aba, dim), f = fAba(aba);
    SEL = {aba, dim, lista, marcados: new Set(f[dim] ? [...f[dim]] : lista.map(x => x.valor)), busca: ''};
    desenharSeletor();
    const r = botao.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 440)) + 'px';
    pop.style.top = Math.min(r.bottom + 6, window.innerHeight - 520) + 'px';
    pop.hidden = false;
    pop.querySelector('[data-sbusca]').focus();
  }
  function desenharSeletor(){
    const {aba, dim, lista, marcados} = SEL, busca = SEL.busca.toLocaleLowerCase('pt-BR'), buscaDig = /[a-zà-ú]/i.test(SEL.busca) ? '' : soDig(SEL.busca);
    const vis = lista.filter(x => !busca || String(x.valor).toLocaleLowerCase('pt-BR').includes(busca) || (buscaDig && String(x.valor).includes(buscaDig)) || String(x.nome || '').toLocaleLowerCase('pt-BR').includes(busca));
    const MAX = 1500, todosVis = vis.length && vis.every(x => marcados.has(x.valor));
    const nome = dim === 'cnpj' ? 'CNPJ' : DIM[dim].rotulo;
    pop.innerHTML = '<div class="v15-pop-h"><b>Selecionar ' + esc(nome) + '</b><span>' + fmtInt(marcados.size) + ' de ' + fmtInt(lista.length) + ' marcados</span></div>'
      + '<input type="search" data-sbusca placeholder="' + (dim === 'cnpj' ? 'Pesquisar CNPJ ou razão social' : 'Pesquisar') + '" value="' + esc(SEL.busca) + '">'
      + '<label class="v15-opt v15-todos"><input type="checkbox" data-stodos' + (todosVis ? ' checked' : '') + '> <b>' + (busca ? 'Todos os resultados da pesquisa' : 'Todos') + '</b></label>'
      + '<div class="v15-list">' + (vis.slice(0, MAX).map(x => '<label class="v15-opt"><input type="checkbox" data-sval="' + encodeURIComponent(x.valor) + '"' + (marcados.has(x.valor) ? ' checked' : '') + '>'
          + '<span class="v15-v">' + esc(dim === 'cnpj' ? fmtDoc(x.valor) : x.valor) + (x.nome ? '<small>' + esc(x.nome) + '</small>' : '') + '</span><em>' + fmtInt(x.n) + '</em></label>').join('')
        || '<div class="small" style="padding:10px">Nenhum valor encontrado.</div>')
      + (vis.length > MAX ? '<div class="small" style="padding:6px 10px">Mostrando ' + fmtInt(MAX) + ' de ' + fmtInt(vis.length) + '. Refine a pesquisa.</div>' : '') + '</div>'
      + '<div class="v15-pop-a"><button type="button" class="secondary" data-snenhum>Desmarcar todos</button><span><button type="button" class="secondary" data-scancel>Cancelar</button> <button type="button" data-sok>Aplicar</button></span></div>';
    const inp = pop.querySelector('[data-sbusca]');
    inp.oninput = () => { SEL.busca = inp.value; desenharSeletor(); const n = pop.querySelector('[data-sbusca]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    inp.onkeydown = e => { if (e.key === 'Enter') pop.querySelector('[data-sok]').click(); };
    pop.querySelector('[data-stodos]').onchange = e => { vis.forEach(x => e.target.checked ? marcados.add(x.valor) : marcados.delete(x.valor)); desenharSeletor(); };
    pop.querySelectorAll('[data-sval]').forEach(c => c.onchange = () => { const v = decodeURIComponent(c.dataset.sval); c.checked ? marcados.add(v) : marcados.delete(v); desenharSeletor(); });
    pop.querySelector('[data-snenhum]').onclick = () => { marcados.clear(); desenharSeletor(); };
    pop.querySelector('[data-scancel]').onclick = fecharSeletor;
    pop.querySelector('[data-sok]').onclick = () => {
      const f = fAba(aba);
      if (!marcados.size){ alert('Marque pelo menos um valor, ou clique em "Todos".'); return; }
      f[dim] = marcados.size === lista.length ? null : new Set(marcados);
      fecharSeletor(); aplicarFiltro(aba);
    };
  }
  function fecharSeletor(){ pop.hidden = true; SEL = null; }
  pop.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => { if (SEL) fecharSeletor(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && SEL) fecharSeletor(); });

  desenharBarras();
  Object.keys(ABAS_FILTRO).forEach(resumoFiltro);

