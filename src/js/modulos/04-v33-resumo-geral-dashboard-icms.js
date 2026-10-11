  /* =====================================================================
     V33 — Resumo geral do Dashboard: ICMS RESUMO, ICMS ST sem alíquota,
     IPI e PIS/COFINS com uma linha por alíquota, IBS/CBS por CFOP e alíquota
     com ENTRADAS e SAÍDAS lado a lado.
     ===================================================================== */
  const imp33 = id => IMPOSTOS.find(i => i.id === id);
  const r4 = v => Math.round(num(v) * 10000) / 10000;
  const pct = v => brNumero(v, 2) + '%';
  const movRotulo = m => m === 'S' ? 'Saídas' : 'Entradas';
  function ajustarResumo(){
    const card = id => { const el = $(id); return el ? el.closest('.dashboard-card') : null; };
    // ICMS RESUMO
    const cI = card('dashIcmsRows');
    if (cI){ cI.querySelector('h3').textContent = 'ICMS RESUMO'; const p = cI.querySelector('p.subtle'); if (p) p.remove(); }
    // ICMS ST sem alíquota
    const cS = card('dashStRows');
    if (cS){
      const p = cS.querySelector('p.subtle'); if (p) p.remove();
      const st = imp33('st'), T = {E: {b: 0, v: 0}, S: {b: 0, v: 0}};
      for (const r of state.items){ if (!st.tem(r)) continue; const [b, v] = st.v(r), m = tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E'; T[m].b += b; T[m].v += v; }
      cS.querySelector('thead').innerHTML = '<tr><th>Movimento</th><th>Base ICMS ST</th><th>Valor ICMS ST</th></tr>';
      $('dashStRows').innerHTML = '<tr><td>Entradas</td><td>' + brl(T.E.b) + '</td><td>' + brl(T.E.v) + '</td></tr><tr><td>Saídas</td><td>' + brl(T.S.b) + '</td><td>' + brl(T.S.v) + '</td></tr>'
        + '<tr class="dash-total-row"><td>Saldo (E − S)</td><td>' + brl(T.E.b - T.S.b) + '</td><td>' + brl(T.E.v - T.S.v) + '</td></tr>';
    }
    // IPI — uma linha por alíquota
    const cP = card('dashIpiRows');
    if (cP){
      const ipi = imp33('ipi'), m = new Map, T = {E: {b: 0, v: 0}, S: {b: 0, v: 0}};
      for (const r of state.items){
        if (!ipi.tem(r)) continue;
        const [b, v] = ipi.v(r), mv = tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E', a = r4(ipi.aliq(r)), k = mv + '|' + a;
        const x = m.get(k) || {mv, a, b: 0, v: 0}; x.b += b; x.v += v; m.set(k, x); T[mv].b += b; T[mv].v += v;
      }
      const ls = [...m.values()].sort((x, y) => x.mv.localeCompare(y.mv) || x.a - y.a);
      $('dashIpiRows').innerHTML = (ls.length ? ls.map(x => '<tr><td>' + movRotulo(x.mv) + '</td><td>' + brl(x.b) + '</td><td>' + pct(x.a) + '</td><td>' + brl(x.v) + '</td></tr>').join('')
          : '<tr><td>Entradas</td><td>' + brl(0) + '</td><td>' + pct(0) + '</td><td>' + brl(0) + '</td></tr><tr><td>Saídas</td><td>' + brl(0) + '</td><td>' + pct(0) + '</td><td>' + brl(0) + '</td></tr>')
        + '<tr class="dash-total-row"><td>Saldo (E − S)</td><td>' + brl(T.E.b - T.S.b) + '</td><td>—</td><td>' + brl(T.E.v - T.S.v) + '</td></tr>';
    }
    // PIS/COFINS — um único quadro, uma linha por alíquota
    const cPis = card('dashPisRows'), cCof = card('dashCofinsRows');
    if (cCof) cCof.style.display = 'none';
    if (cPis){
      cPis.querySelector('h3').textContent = 'PIS/COFINS';
      cPis.querySelector('thead').innerHTML = '<tr><th>Movimento</th><th>Base PIS/COFINS</th><th>Alíq. PIS</th><th>Valor PIS</th><th>Alíq. COFINS</th><th>Valor COFINS</th></tr>';
      const m = new Map, T = {E: {b: 0, p: 0, c: 0}, S: {b: 0, p: 0, c: 0}};
      for (const r of state.items){
        const tp = temGrupoFiscal(r, 'PIS'), tc = temGrupoFiscal(r, 'COFINS'); if (!tp && !tc) continue;
        const mv = tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E', ap = r4(valorGrupo(r, 'PIS', 'pPIS')), ac = r4(valorGrupo(r, 'COFINS', 'pCOFINS')),
          b = valorGrupo(r, 'PIS', 'vBC') || valorGrupo(r, 'COFINS', 'vBC'), vp = valorGrupo(r, 'PIS', 'vPIS'), vc = valorGrupo(r, 'COFINS', 'vCOFINS'), k = mv + '|' + ap + '|' + ac;
        const x = m.get(k) || {mv, ap, ac, b: 0, p: 0, c: 0}; x.b += b; x.p += vp; x.c += vc; m.set(k, x);
        T[mv].b += b; T[mv].p += vp; T[mv].c += vc;
      }
      const ls = [...m.values()].sort((x, y) => x.mv.localeCompare(y.mv) || x.ap - y.ap || x.ac - y.ac);
      $('dashPisRows').innerHTML = (ls.length ? ls.map(x => '<tr><td>' + movRotulo(x.mv) + '</td><td>' + brl(x.b) + '</td><td>' + pct(x.ap) + '</td><td>' + brl(x.p) + '</td><td>' + pct(x.ac) + '</td><td>' + brl(x.c) + '</td></tr>').join('')
          : '<tr><td colspan="6" class="dash-empty">Sem PIS/COFINS nos XMLs.</td></tr>')
        + '<tr class="dash-total-row"><td>Saldo (E − S)</td><td>' + brl(T.E.b - T.S.b) + '</td><td>—</td><td>' + brl(T.E.p - T.S.p) + '</td><td>—</td><td>' + brl(T.E.c - T.S.c) + '</td></tr>';
    }
    // IBS e CBS — por CFOP e alíquota, ENTRADAS e SAÍDAS lado a lado
    const tIbs = document.querySelector('#dashboard .dash-ibscbs'), cIbs = tIbs ? tIbs.closest('.dashboard-card') : null;
    if (cIbs){
      cIbs.querySelector('h3').textContent = 'IBS e CBS';
      const p = cIbs.querySelector('p.subtle'); if (p) p.textContent = 'Resumo por CFOP e alíquota que consta no XML, com ENTRADAS e SAÍDAS lado a lado.';
      const E = new Map, S = new Map, T = {E: {b: 0, i: 0, c: 0, n: 0}, S: {b: 0, i: 0, c: 0, n: 0}};
      for (const r of state.items){
        if (!(temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS'))) continue;
        const mv = tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E', mp = mv === 'S' ? S : E, cfop = r.cfop || 'Sem CFOP',
          ai = r4(num(campoGrupo(r, 'IBS', 'pIBSUF')) + num(campoGrupo(r, 'IBS', 'pIBSMun'))), ac = r4(campoGrupo(r, 'CBS', 'pCBS')),
          b = valorGrupo(r, 'IBS', 'vBC'), vi = valorGrupo(r, 'IBS', 'vIBS'), vc = valorGrupo(r, 'CBS', 'vCBS'), k = cfop + '|' + ai + '|' + ac;
        const x = mp.get(k) || {cfop, desc: r.descricao_cfop || '', ai, ac, b: 0, i: 0, c: 0, n: 0};
        x.b += b; x.i += vi; x.c += vc; x.n++; mp.set(k, x);
        T[mv].b += b; T[mv].i += vi; T[mv].c += vc; T[mv].n++;
      }
      const ord = (a, b) => String(a.cfop).localeCompare(String(b.cfop), 'pt-BR', {numeric: true}) || a.ai - b.ai || a.ac - b.ac;
      const le = [...E.values()].sort(ord), ls = [...S.values()].sort(ord), n = Math.max(le.length, ls.length);
      const lado = (x, sep) => x ? '<td' + (sep ? ' class="v31-sep"' : '') + '><b>' + esc(x.cfop) + '</b>' + (x.desc ? '<small>' + esc(x.desc) + '</small>' : '') + '</td><td>' + brl(x.b) + '</td><td>' + pct(x.ai) + '</td><td><b>' + brl(x.i) + '</b></td><td>' + pct(x.ac) + '</td><td><b>' + brl(x.c) + '</b></td><td>' + fmtInt(x.n) + '</td>'
        : '<td' + (sep ? ' class="v31-sep"' : '') + '></td><td></td><td></td><td></td><td></td><td></td><td></td>';
      let corpo = '';
      for (let i = 0; i < n; i++) corpo += '<tr>' + lado(le[i], false) + lado(ls[i], true) + '</tr>';
      if (!n) corpo = '<tr><td colspan="14" class="dash-empty">Sem IBS ou CBS destacado nos XMLs.</td></tr>';
      else corpo += '<tr class="dash-total-row"><td>Total</td><td>' + brl(T.E.b) + '</td><td></td><td>' + brl(T.E.i) + '</td><td></td><td>' + brl(T.E.c) + '</td><td>' + fmtInt(T.E.n) + '</td>'
        + '<td class="v31-sep">Total</td><td>' + brl(T.S.b) + '</td><td></td><td>' + brl(T.S.i) + '</td><td></td><td>' + brl(T.S.c) + '</td><td>' + fmtInt(T.S.n) + '</td></tr>';
      tIbs.className = 'dash-detail-table dash-ibscbs v31-bat v33-ibs';
      tIbs.innerHTML = '<thead><tr><th colspan="7" class="v30-ent">ENTRADAS</th><th colspan="7" class="v30-sai v31-sep">SAÍDAS</th></tr>'
        + '<tr>' + ['CFOP', 'Base', 'Alíq. IBS', 'IBS', 'Alíq. CBS', 'CBS', 'Qtd. itens'].map(h => '<th class="v30-ent">' + h + '</th>').join('')
        + ['CFOP', 'Base', 'Alíq. IBS', 'IBS', 'Alíq. CBS', 'CBS', 'Qtd. itens'].map((h, i) => '<th class="v30-sai' + (i ? '' : ' v31-sep') + '">' + h + '</th>').join('') + '</tr></thead><tbody id="dashIbsCbsRows">' + corpo + '</tbody>';
      if (!tIbs.parentElement.classList.contains('v33-scroll')){ const w = document.createElement('div'); w.className = 'v33-scroll'; tIbs.parentElement.insertBefore(w, tIbs); w.appendChild(tIbs); }
    }
  }
  function renderDashImpostos(){
    if (!DASH_PRONTO) return;
    try { ajustarResumo(); } catch(e){ console.error('Resumo', e); }
    if (DASH_ABA !== 'resumo' && DASH_ABA !== 'impostos') DASH_ABA = 'impostos';
    const nav = $('dashSubnav'), pane = $('dashPane');
    const dados = IMPOSTOS.map(imp => ({imp, g: agregar(imp)}));
    nav.innerHTML = '<button type="button" class="v17-sub' + (DASH_ABA === 'resumo' ? ' on' : '') + '" data-dsub="resumo">Resumo geral</button>'
      + '<button type="button" class="v17-sub' + (DASH_ABA === 'impostos' ? ' on' : '') + '" data-dsub="impostos">Entradas e Saídas por imposto</button>';
    nav.querySelectorAll('[data-dsub]').forEach(b => b.onclick = () => trocarDashAba(b.dataset.dsub));
    // gráfico do Resumo geral
    const grid = document.querySelector('#dashboard .dash-tax-grid');
    let gc = $('dashGraficoES');
    if (grid && !gc){ gc = document.createElement('div'); gc.id = 'dashGraficoES'; gc.className = 'dashboard-card dash-wide'; const v = $('dashValidacoes'); v ? v.insertAdjacentElement('afterend', gc) : grid.prepend(gc); }
    if (gc) gc.innerHTML = graficoResumo(dados);
    let bc = $('dashBaseCst');
    if (gc && !bc){ bc = document.createElement('div'); bc.id = 'dashBaseCst'; bc.className = 'dashboard-card dash-wide'; gc.insertAdjacentElement('afterend', bc); }
    if (bc) montarBat();
    const resumo = DASH_ABA === 'resumo';
    document.querySelectorAll('#dashboard .v17-resumo').forEach(e => e.style.display = resumo ? '' : 'none');
    pane.hidden = resumo;
    if (resumo) return;
    const cnpj = $('cnpjEmpresa').value;
    pane.innerHTML = '<p class="subtle v23-nota">' + (cnpj ? 'SAÍDAS = XMLs emitidos pelo CNPJ ' + esc(cnpj) + '. ENTRADAS = XMLs de outros emitentes, com CFOP convertido (5→1, 6→2, 7→3).'
        : '<b style="color:var(--warn)">CNPJ da empresa não informado na primeira tela — todos os documentos estão sendo tratados como ENTRADAS.</b>') + '</p>'
      + '<div class="v23-atalhos">' + dados.map(({imp}) => '<a href="#dsec-' + imp.id + '">' + imp.nome + '</a>').join('') + '</div>'
      + dados.map(({imp, g}) => secaoImposto(imp, g)).join('');
  }
  montarDashAbas();


