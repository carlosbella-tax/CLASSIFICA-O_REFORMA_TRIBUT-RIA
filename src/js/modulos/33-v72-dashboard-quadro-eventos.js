  /* =====================================================================
     V72 — Dashboard › Resumo geral: quadro "Eventos das notas fiscais" ao
     lado de "Montante por imposto", com os totais, o resumo por tpEvento e
     descEvento (entradas × saídas) e a lista dos eventos com a nota de
     origem e o efeito no diagnóstico. O detalhamento completo continua na
     aba Eventos do Dashboard.
     ===================================================================== */
  const MAX_V72 = 12;
  function quadroEventosV72(){
    const ev = eventosV70().lista, nC = ev.filter(x => x.canc).length, nE = ev.filter(x => x.mv !== 'SAÍDAS').length;
    let h = '<h3>Eventos das notas fiscais</h3>';
    if (!ev.length) return h + '<p class="subtle">Eventos dos XMLs (tpEvento e descEvento) relacionados às notas.</p><div class="v50-vazio">Nenhum XML de evento foi carregado.</div>';
    const tipos = new Map;
    for (const x of ev){ const k = x.tp + '|' + x.desc, t = tipos.get(k) || {tp: x.tp, desc: x.desc, E: 0, S: 0, canc: x.canc}; t[x.mv === 'SAÍDAS' ? 'S' : 'E']++; tipos.set(k, t); }
    const ord = [...ev].sort((a, b) => (b.canc - a.canc) || a.mv.localeCompare(b.mv) || String(a.nf).localeCompare(String(b.nf), 'pt-BR', {numeric: true}));
    h += '<p class="subtle">' + fmtInt(ev.length) + ' evento(s) em ' + fmtInt(new Set(ev.map(x => x.chave)).size) + ' nota(s) · Entradas ' + fmtInt(nE) + ' · Saídas ' + fmtInt(ev.length - nE)
      + ' · <b style="color:var(--warn)">' + fmtInt(nC) + ' cancelamento(s)</b> fora das abas de impostos.</p>'
      + '<table class="dash-detail-table v72-ev"><thead><tr><th style="width:16%">tpEvento</th><th>descEvento</th><th style="width:15%">Entradas</th><th style="width:15%">Saídas</th></tr></thead><tbody>'
      + [...tipos.values()].sort((a, b) => (b.E + b.S) - (a.E + a.S)).map(t => '<tr><td><b>' + esc(t.tp) + '</b></td><td' + (t.canc ? ' style="color:var(--warn);font-weight:700"' : '') + '>' + esc(t.desc) + '</td><td>' + fmtInt(t.E) + '</td><td>' + fmtInt(t.S) + '</td></tr>').join('')
      + '</tbody></table>'
      + '<h4 class="v42-sub">Notas com evento</h4><table class="dash-detail-table v72-ev"><thead><tr><th style="width:17%">Movimento</th><th style="width:12%">NF</th><th>Evento</th><th style="width:31%">Efeito</th></tr></thead><tbody>'
      + ord.slice(0, MAX_V72).map(x => '<tr' + (x.mv === 'SAÍDAS' ? ' class="v35-sai"' : '') + '><td><span class="v24-mov ' + (x.mv === 'SAÍDAS' ? 'sai' : 'ent') + '">' + x.mv + '</span></td><td><b>' + esc(x.nf) + '</b></td><td>'
          + esc(x.tp + ' - ' + x.desc) + '<br><small>' + esc((x.mv === 'SAÍDAS' ? x.destinatario : x.emitente) || (x.carregada ? '' : 'Nota não carregada')) + (x.carregada && x.valor ? ' · ' + brl(x.valor) : '') + '</small></td><td'
          + (x.canc ? ' style="color:var(--warn);font-weight:700">Cancelada — fora das abas de impostos' : x.cancNaoHomologado ? '>Cancelamento não homologado' : '>Informativo') + '</td></tr>').join('')
      + '</tbody></table>'
      + (ev.length > MAX_V72 ? '<p class="subtle">Exibidos ' + MAX_V72 + ' de ' + fmtInt(ev.length) + ' eventos.</p>' : '')
      + '<p style="margin:8px 0 0"><button type="button" class="secondary" data-v72-eventos>Ver todos os eventos (aba Eventos)</button></p>';
    return h;
  }
  const renderDashImpostosV71 = renderDashImpostos;
  renderDashImpostos = function(){
    renderDashImpostosV71();
    const grid = document.querySelector('#dashboard .dash-tax-grid'); if (!grid) return;
    const montante = [...grid.querySelectorAll(':scope > .dashboard-card')].find(c => /Montante por imposto/.test((c.querySelector('h3') || {}).textContent || ''));
    let c = $('dashEventosResumo');
    if (!c){ c = document.createElement('div'); c.id = 'dashEventosResumo'; c.className = 'dashboard-card dash-tax-card'; }
    if (montante && c.previousElementSibling !== montante) montante.insertAdjacentElement('afterend', c);
    else if (!montante && !c.parentNode) grid.appendChild(c);
    c.innerHTML = quadroEventosV72();
    const b = c.querySelector('[data-v72-eventos]'); if (b) b.onclick = () => { trocarDashAba('eventos'); const n = $('dashSubnav'); if (n) n.scrollIntoView({behavior: 'smooth', block: 'start'}); };
  };
