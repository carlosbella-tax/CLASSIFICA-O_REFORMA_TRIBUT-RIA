  /* =====================================================================
     V70 — Eventos de NF-e (tpEvento / descEvento / chNFe)
     - Cancelamento (tpEvento 110111 ou descEvento com "Cancelamento"),
       homologado: a nota fica só na aba Itens, com a observação do evento
       antes de arquivo_origem, e no Dashboard (aba Eventos). Os itens não
       vão para as abas de impostos, para os quadros de impostos do
       Dashboard, para o Excel das abas de impostos nem para a apresentação.
     - Demais eventos (ex.: 110110 Carta de Correção): observação na aba
       Itens e registro na aba Eventos do Dashboard; a nota segue normal.
     - Apresentação: slide de eventos relacionando as notas de origem,
       separado em ENTRADAS e SAÍDAS.
     ===================================================================== */
  const STATUS_OK_V70 = new Set(['135', '136', '155']);
  const ehCancelamentoV70 = e => String(e.tipo_evento || '').trim() === '110111' || /cancelamento/i.test(String(e.descricao_evento || ''));
  const homologadoV70 = e => { const c = String(e.status_evento || '').trim(); return !c || STATUS_OK_V70.has(c); };
  let cacheEvV70 = {ref: null, n: -1, val: null};
  function eventosV70(){
    const evs = state.events || [];
    if (cacheEvV70.ref === evs && cacheEvV70.n === evs.length && cacheEvV70.itens === state.items) return cacheEvV70.val;
    const porChave = new Map, canceladas = new Set;
    const itemDaChave = new Map, somaItens = new Map;
    for (const r of state.items) if (r.chave_documento){ if (!itemDaChave.has(r.chave_documento)) itemDaChave.set(r.chave_documento, r); somaItens.set(r.chave_documento, (somaItens.get(r.chave_documento) || 0) + num(r.valor_item)); }
    const docDaChave = new Map; for (const d of state.docs || []) if (d.tipo_documento !== 'Evento NF-e' && d.chave_documento && !docDaChave.has(d.chave_documento)) docDaChave.set(d.chave_documento, d);
    const cnpjEmp = String(($('cnpjEmpresa') || {}).value || '').replace(/\D/g, '');
    const lista = evs.map(e => {
      const chave = String(e.chave_documento || '').trim(), canc = ehCancelamentoV70(e), ok = homologadoV70(e);
      const item = itemDaChave.get(chave), doc = docDaChave.get(chave), nota = item || doc;
      const mv = nota ? tipoOperacao(nota) : (cnpjEmp && chave.slice(6, 20) === cnpjEmp ? 'SAÍDAS' : 'ENTRADAS');
      const efeito = canc && ok ? 'Nota cancelada — itens somente na aba Itens (fora das abas de impostos)'
        : canc ? 'Cancelamento não homologado (cStat ' + e.status_evento + ') — a nota continua nas abas de impostos'
        : 'Evento informativo — a nota segue nas abas de impostos';
      const x = {chave, tp: String(e.tipo_evento || '').trim(), desc: String(e.descricao_evento || '').trim() || 'Evento sem descrição', seq: e.sequencia_evento || '',
        data: String(e.data_hora_evento || '').slice(0, 10), status: e.status_evento || '', motivo: e.mensagem_retorno_evento || '', protocolo: e.protocolo_evento || '',
        canc: canc && ok, cancNaoHomologado: canc && !ok, mv, efeito, carregada: !!nota,
        nf: (doc && doc.numero_documento) || (item && item.numero_documento) || (chave.length === 44 ? String(Number(chave.slice(25, 34))) : ''),
        emitente: (nota && nota.emitente_razao_social) || '', destinatario: (nota && nota.destinatario_razao_social) || '',
        valor: num((doc && doc.valor_total_documento) || 0) || arred(somaItens.get(chave) || 0), arquivo: e.arquivo_origem || ''};
      if (x.canc && chave) canceladas.add(chave);
      if (chave){ const a = porChave.get(chave) || []; a.push(x); porChave.set(chave, a); }
      return x;
    });
    cacheEvV70 = {ref: evs, n: evs.length, itens: state.items, val: {lista, porChave, canceladas}};
    return cacheEvV70.val;
  }
  const semCanceladosV70 = itens => { const c = eventosV70().canceladas; return c.size ? itens.filter(r => !c.has(r.chave_documento)) : itens; };
  // executa fn com state.items sem as notas canceladas
  function semCanceladasV70(fn){
    const todos = state.items, filtrados = semCanceladosV70(todos);
    if (filtrados === todos) return fn();
    state.items = filtrados;
    try { return fn(); } finally { state.items = todos; }
  }

  // abas de impostos e Dashboard: sem as notas canceladas (a aba Itens e a aba Eventos ficam com tudo)
  const comFiltroV69 = comFiltro;
  comFiltro = function(aba, fn){
    if (aba === 'items' || aba === 'events') return comFiltroV69(aba, fn);
    return comFiltroV69(aba, () => semCanceladasV70(fn));
  };
  // as funções das abas de impostos também excluem as canceladas, qualquer que seja quem as chama
  for (const f of ['linhasIcms', 'linhasIcmsSt', 'linhasIpi', 'linhasPisCofins', 'linhasIbsCbsTabela']){
    const ant = window[f]; if (typeof ant === 'function') window[f] = (...a) => semCanceladasV70(() => ant(...a));
  }
  const badgesV69 = window.atualizarBadgesTributos;
  window.atualizarBadgesTributos = function(){ return semCanceladasV70(badgesV69); };
  const dadosApresentacaoV69 = dadosApresentacao;
  dadosApresentacao = function(){
    const D = semCanceladasV70(dadosApresentacaoV69), ev = eventosV70().lista;
    D.eventos = {E: ev.filter(x => x.mv !== 'SAÍDAS'), S: ev.filter(x => x.mv === 'SAÍDAS'), total: ev.length, canc: ev.filter(x => x.canc).length};
    return D;
  };
  // Excel completo: abas de impostos sem as canceladas; aba Itens com todos os itens
  const baixarV70 = () => {
    const todos = state.items, antItens = linhasItensVisao;
    linhasItensVisao = lista => antItens(lista === state.items ? todos : lista);
    try { semCanceladasV70(downloadV18); } finally { linhasItensVisao = antItens; }
  };
  $('download').onclick = baixarV70; $('downloadTop').onclick = baixarV70;

  // aba Itens: observação do evento antes de arquivo_origem
  const obsEventoV70 = chave => {
    const a = eventosV70().porChave.get(chave); if (!a) return '';
    return a.map(x => x.tp + ' - ' + x.desc + (x.canc ? ' (nota cancelada: fora das abas de impostos)' : x.cancNaoHomologado ? ' (cancelamento não homologado)' : '')).join(' | ');
  };
  const comObsV70 = (row, src) => {
    const x = {}, obs = obsEventoV70(src ? src.chave_documento : row.chave_documento), ks = Object.keys(row), alvo = ks.includes('arquivo_origem') ? 'arquivo_origem' : ks[1];
    for (const k of ks){ if (k === alvo) x.observacao_evento = obs; x[k] = row[k]; }
    if (!('observacao_evento' in x)) x.observacao_evento = obs;
    for (const p of ['__idx', '__src']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], enumerable: false, writable: true, configurable: true});
    return x;
  };
  const itensComIcmsV69 = window.linhasItensComIcms;
  window.linhasItensComIcms = function(){
    const rows = itensComIcmsV69();
    if (!(state.events || []).length) return rows;
    const fonte = state.items;   // linhasItensComIcms gera uma linha por item, na mesma ordem
    return rows.map((row, i) => comObsV70(row, fonte[i]));
  };
  const itensVisaoV69 = linhasItensVisao;
  linhasItensVisao = function(lista){
    const rows = itensVisaoV69(lista);
    if (!(state.events || []).length) return rows;
    return rows.map((row, i) => comObsV70(row, lista[i]));
  };

  // Dashboard: aba Eventos
  function tabelaEventosV70(titulo, lista, mv){
    const parte = mv === 'S' ? 'Destinatário' : 'Emitente';
    return '<h4 class="v42-sub">' + titulo + ' · ' + fmtInt(lista.length) + ' evento(s)</h4><div class="v33-scroll"><table class="dash-detail-table v70-ev"><thead><tr><th>NF</th><th>Chave (chNFe)</th><th>' + parte + '</th><th>Valor da nota</th>'
      + '<th>tpEvento</th><th>descEvento</th><th>Seq.</th><th>Data</th><th>Situação (cStat)</th><th>Efeito no diagnóstico</th></tr></thead><tbody>'
      + (lista.length ? lista.map(x => '<tr' + (mv === 'S' ? ' class="v35-sai"' : '') + '><td><b>' + esc(x.nf) + '</b></td><td><small>' + esc(x.chave) + '</small></td><td>'
          + esc((mv === 'S' ? x.destinatario : x.emitente) || (x.carregada ? '' : 'Nota não carregada')) + '</td><td>' + (x.carregada ? brl(x.valor) : '—') + '</td><td><b>' + esc(x.tp) + '</b></td><td>'
          + esc(x.desc) + '</td><td>' + esc(x.seq) + '</td><td>' + esc(x.data) + '</td><td>' + esc(x.status + (x.motivo ? ' — ' + x.motivo : '')) + '</td><td' + (x.canc ? ' style="color:var(--warn);font-weight:700"' : '') + '>' + esc(x.efeito) + '</td></tr>').join('')
        : '<tr><td colspan="10" class="dash-empty">Nenhum evento nesta movimentação.</td></tr>')
      + '</tbody></table></div>';
  }
  function painelEventosV70(){
    const ev = eventosV70().lista, E = ev.filter(x => x.mv !== 'SAÍDAS'), S = ev.filter(x => x.mv === 'SAÍDAS'), nC = ev.filter(x => x.canc).length;
    const tipos = new Map; for (const x of ev){ const k = x.tp + '|' + x.desc, t = tipos.get(k) || {tp: x.tp, desc: x.desc, E: 0, S: 0, canc: x.canc}; t[x.mv === 'SAÍDAS' ? 'S' : 'E']++; tipos.set(k, t); }
    const kpi = (rot, v, sub) => '<div class="dashboard-metric v17-kpi"><small>' + rot + '</small><strong>' + v + '</strong><span>' + sub + '</span></div>';
    return '<div class="dashboard-card dash-wide"><div class="v17-head"><h3>Eventos das notas fiscais</h3></div>'
      + '<p class="subtle">Eventos lidos dos XMLs (tpEvento, descEvento e chNFe) relacionados às notas de origem. Cancelamentos ficam só na aba Itens e aqui; os itens dessas notas não entram nas abas de impostos, nos quadros de impostos do Dashboard nem na apresentação.</p>'
      + '<div class="v17-kpis">' + kpi('EVENTOS', fmtInt(ev.length), fmtInt(new Set(ev.map(x => x.chave)).size) + ' nota(s) relacionada(s)')
      + kpi('CANCELAMENTOS', fmtInt(nC), 'notas fora das abas de impostos') + kpi('OUTROS EVENTOS', fmtInt(ev.length - nC), 'informativos — a nota segue normal') + '</div>'
      + (ev.length ? '<h4 class="v42-sub">Resumo por tipo de evento</h4><div class="v33-scroll"><table class="dash-detail-table"><thead><tr><th>tpEvento</th><th>descEvento</th><th>Entradas</th><th>Saídas</th><th>Total</th></tr></thead><tbody>'
          + [...tipos.values()].sort((a, b) => (b.E + b.S) - (a.E + a.S)).map(t => '<tr><td><b>' + esc(t.tp) + '</b></td><td>' + esc(t.desc) + '</td><td>' + fmtInt(t.E) + '</td><td>' + fmtInt(t.S) + '</td><td><b>' + fmtInt(t.E + t.S) + '</b></td></tr>').join('')
          + '</tbody></table></div>' + tabelaEventosV70('ENTRADAS', E, 'E') + tabelaEventosV70('SAÍDAS', S, 'S')
        : '<div class="v50-vazio">Nenhum XML de evento foi carregado.</div>')
      + '</div>';
  }
  const renderDashImpostosV69 = renderDashImpostos;
  renderDashImpostos = function(){
    const ev = DASH_ABA === 'eventos';
    if (ev) DASH_ABA = 'impostos';
    renderDashImpostosV69();
    if (ev) DASH_ABA = 'eventos';
    const nav = $('dashSubnav'), pane = $('dashPane'); if (!nav || !pane) return;
    if (!nav.querySelector('[data-dsub="eventos"]')){
      nav.insertAdjacentHTML('beforeend', '<button type="button" class="v17-sub" data-dsub="eventos">Eventos (' + fmtInt((state.events || []).length) + ')</button>');
      nav.querySelector('[data-dsub="eventos"]').onclick = () => trocarDashAba('eventos');
    }
    if (!ev) return;
    nav.querySelectorAll('[data-dsub]').forEach(b => b.classList.toggle('on', b.dataset.dsub === 'eventos'));
    pane.innerHTML = painelEventosV70();
  };
