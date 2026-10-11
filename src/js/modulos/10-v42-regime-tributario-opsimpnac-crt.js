  /* =====================================================================
     V42 — Regime tributário (opSimpNac / CRT), resumo do Simples Nacional
     e resumo de IBS/CBS não validados no Dashboard.
     ===================================================================== */
  const OPSIMPNAC = {'1': 'Não Optante (Lucro Presumido ou Lucro Real)', '2': 'Optante - MEI (Microempreendedor Individual)',
    '3': 'Optante - ME / EPP (Microempresa ou Empresa de Pequeno Porte)', '4': 'Optante - Pendente de homologação'};   // TABELA_OPÇÃO_SIMPLES.xlsx
  const CRT_PARA_OP = {'1': '3', '2': '3', '3': '1', '4': '2'};
  let REG_DOC = null, REG_DOCS_REF = null;
  function mapaRegime(){
    if (REG_DOC && REG_DOCS_REF === state.docs && REG_DOC.n === state.docs.length) return REG_DOC;
    const m = new Map;
    const achar = (obj, fim) => { for (const k in obj){ if (k.endsWith(fim) && String(obj[k]).trim()) return String(obj[k]).trim(); } return ''; };
    for (const d of state.docs){
      const op = achar(d, 'opSimpNac'), crt = op ? '' : achar(d, '_CRT');
      const info = op ? {cod: op, fonte: 'opSimpNac'} : crt ? {cod: CRT_PARA_OP[crt] || '', fonte: 'CRT ' + crt} : null;
      if (!info) continue;
      if (d.chave_documento) m.set('c:' + d.chave_documento, info);
      if (d.arquivo_origem) m.set('a:' + d.arquivo_origem, info);
    }
    REG_DOC = m; m.n = state.docs.length; REG_DOCS_REF = state.docs;
    return m;
  }
  function regimeItem(r){
    let op = ''; for (const k in r){ if (k.endsWith('opSimpNac') && String(r[k]).trim()){ op = String(r[k]).trim(); break; } }
    const info = op ? {cod: op, fonte: 'opSimpNac'} : (mapaRegime().get('c:' + r.chave_documento) || mapaRegime().get('a:' + r.arquivo_origem) || {cod: '', fonte: ''});
    return info;
  }
  const textoRegime = info => info.cod ? info.cod + ' — ' + (OPSIMPNAC[info.cod] || 'Código não localizado na tabela') + (info.fonte && info.fonte !== 'opSimpNac' ? ' (pelo ' + info.fonte + ')' : '') : 'Não informado no XML';

  /* ---------- Dashboard: IBS/CBS não validados (NCM, cClassTrib, CST) ---------- */
  const ROTULO_VAL = {cclasstrib: 'cClassTrib (LC 214)', ncm_cclasstrib: 'NCM × cClassTrib (TIPI)', cst_ibs_cbs: 'CST', base_ibs_cbs: 'Base IBS/CBS', ibs: 'Valor IBS', cbs: 'Valor CBS'};
  const MOVS = [['E', 'ENTRADAS', 'ent'], ['S', 'SAÍDAS', 'sai']];
  const movDe = r => tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E';
  // V45: IBS e CBS não validados — separado em ENTRADAS e SAÍDAS
  function cardIbsNaoValidado(){
    const m = new Map, T = {E: {n: 0, b: 0, i: 0, c: 0}, S: {n: 0, b: 0, i: 0, c: 0}};
    for (const r of state.items){
      if (!(temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS'))) continue;
      const o = linhaIbsCbs(r), falhas = Object.keys(o).filter(k => k.startsWith('validacao_') && /^(INCORRETO|NÃO VALIDADO)/.test(String(o[k])));
      if (!falhas.length) continue;
      const mv = movDe(r), ncm = String(r.ncm || '').replace(/\D/g, ''), k = mv + '|' + ncm + '|' + o.cclasstrib + '|' + o.cst_ibs_cbs;
      const x = m.get(k) || {mv, ncm, cc: o.cclasstrib || '', cst: o.cst_ibs_cbs || '', desc: o.descricao_ncm_tipi || '', n: 0, b: 0, i: 0, c: 0, motivos: new Map};
      x.n++; x.b += num(o.base_ibs_cbs_xml); x.i += num(o.valor_ibs_total); x.c += num(o.valor_cbs);
      for (const f of falhas){
        const chave = f.replace('validacao_', ''), txt = String(o[f]).replace(/^(INCORRETO|NÃO VALIDADO)\s*/, '').replace(/^\(|\)$/g, '');
        const id = chave + '|' + txt, y = x.motivos.get(id) || {rot: ROTULO_VAL[chave] || chave, txt: txt || (chave === 'base_ibs_cbs' ? 'base do XML diferente da base calculada' : chave === 'ibs' || chave === 'cbs' ? 'valor do XML diferente de base × alíquota (margem de R$ 0,02)' : 'não validado'), n: 0};
        y.n++; x.motivos.set(id, y);
      }
      m.set(k, x); const t = T[mv]; t.n++; t.b += num(o.base_ibs_cbs_xml); t.i += num(o.valor_ibs_total); t.c += num(o.valor_cbs);
    }
    const chip = y => '<div class="v43-mot"><span class="v43-rot">' + esc(y.rot) + '</span><span class="v43-txt">' + esc(y.txt) + '</span>' + (y.n > 1 ? '<span class="v43-qtd">' + fmtInt(y.n) + ' itens</span>' : '') + '</div>';
    const totN = T.E.n + T.S.n;
    let corpo = '';
    for (const [mv, rot, cls] of MOVS){
      const ls = [...m.values()].filter(x => x.mv === mv).sort((a, b) => b.n - a.n || a.ncm.localeCompare(b.ncm));
      corpo += '<tr class="v45-sec ' + cls + '"><td colspan="8">' + rot + ' — ' + (ls.length ? fmtInt(T[mv].n) + ' item(ns) não validado(s)' : 'nenhum item não validado') + '</td></tr>';
      corpo += ls.map(x => '<tr' + (mv === 'S' ? ' class="v35-sai"' : '') + '><td><b>' + esc(x.ncm.length === 8 ? fmtNcm(x.ncm) : x.ncm) + '</b>' + (x.desc ? '<small>' + esc(x.desc) + '</small>' : '') + '</td><td><b>' + esc(x.cc) + '</b></td><td>' + esc(x.cst) + '</td><td>' + fmtInt(x.n) + '</td><td>' + brl(x.b) + '</td><td>' + brl(x.i) + '</td><td>' + brl(x.c) + '</td><td class="v43-mots">' + [...x.motivos.values()].map(chip).join('') + '</td></tr>').join('');
      if (ls.length) corpo += '<tr class="dash-total-row' + (mv === 'S' ? ' v35-sai' : '') + '"><td colspan="3">Total ' + rot + '</td><td>' + fmtInt(T[mv].n) + '</td><td>' + brl(T[mv].b) + '</td><td>' + brl(T[mv].i) + '</td><td>' + brl(T[mv].c) + '</td><td></td></tr>';
    }
    if (totN) corpo += '<tr class="dash-total-row v35-dif"><td colspan="3">TOTAL NÃO VALIDADO</td><td>' + fmtInt(totN) + '</td><td>' + brl(T.E.b + T.S.b) + '</td><td>' + brl(T.E.i + T.S.i) + '</td><td>' + brl(T.E.c + T.S.c) + '</td><td></td></tr>';
    return '<div class="v43-head"><h3>IBS e CBS não validados</h3><span class="v43-badge' + (totN ? '' : ' ok') + '">' + (totN ? fmtInt(totN) + ' item(ns) com pendência — Entradas ' + fmtInt(T.E.n) + ' · Saídas ' + fmtInt(T.S.n) : 'Tudo validado') + '</span></div>'
      + '<p class="subtle">Itens com pelo menos uma validação de IBS/CBS não atendida, separados em ENTRADAS e SAÍDAS e agrupados por NCM, cClassTrib e CST.</p>'
      + '<div class="v33-scroll"><table class="dash-detail-table v42-tab v43-nv"><colgroup><col style="width:11%"><col style="width:7%"><col style="width:4%"><col style="width:5%"><col style="width:9%"><col style="width:7%"><col style="width:7%"><col style="width:50%"></colgroup>'
      + '<thead><tr><th>NCM</th><th>cClassTrib</th><th>CST</th><th>Itens</th><th>Base IBS/CBS</th><th>Valor IBS</th><th>Valor CBS</th><th>Validações não atendidas</th></tr></thead><tbody>' + corpo + '</tbody></table></div>';
  }

  // V45: Simples Nacional — separado em ENTRADAS e SAÍDAS
  function cardSimples(){
    const m = new Map, porCod = new Map, T = {E: {n: 0, b: 0, i: 0, c: 0, docs: new Set}, S: {n: 0, b: 0, i: 0, c: 0, docs: new Set}};
    for (const r of state.items){
      const mv = movDe(r), info = regimeItem(r), cod = info.cod || '—';
      const tem = temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS');
      const cc = tem ? String(campoGrupo(r, 'IBS', 'cClassTrib') || '') : '', cst = tem ? String(campoGrupo(r, 'IBS', 'CST') || '') : '';
      const rI = tem ? (redAliq(r, 'GIBSUF') || redAliq(r, 'GIBSMUN')) : 0, rC = tem ? redAliq(r, 'GCBS') : 0;
      const aI = tem ? r4(num(campoGrupo(r, 'IBS', 'pIBSUF')) + num(campoGrupo(r, 'IBS', 'pIBSMun'))) : 0, aC = tem ? r4(campoGrupo(r, 'CBS', 'pCBS')) : 0;
      const b = tem ? valorGrupo(r, 'IBS', 'vBC') : 0, vi = tem ? valorGrupo(r, 'IBS', 'vIBS') : 0, vc = tem ? valorGrupo(r, 'CBS', 'vCBS') : 0;
      const k = [mv, cod, cc, cst, rI, rC, aI, aC].join('|');
      const x = m.get(k) || {mv, cod, cc, cst, rI, rC, aI, aC, n: 0, b: 0, i: 0, c: 0};
      x.n++; x.b += b; x.i += vi; x.c += vc; m.set(k, x);
      const kc = mv + '|' + cod, y = porCod.get(kc) || {docs: new Set, n: 0, b: 0, i: 0, c: 0};
      const doc = r.chave_documento || r.arquivo_origem;
      y.docs.add(doc); y.n++; y.b += b; y.i += vi; y.c += vc; porCod.set(kc, y);
      const t = T[mv]; t.n++; t.b += b; t.i += vi; t.c += vc; t.docs.add(doc);
    }
    const ordemCod = c => c === '—' ? 9 : Number(c) || 8;
    const nomeReg = c => c === '—' ? 'Não informado no XML' : c + ' — ' + (OPSIMPNAC[c] || 'código não localizado');
    const red = x => (x.rI || x.rC) ? (x.rI === x.rC ? brNumero(x.rI, 2) + '%' : 'IBS ' + brNumero(x.rI, 2) + '% / CBS ' + brNumero(x.rC, 2) + '%') : '—';
    let corpo = '';
    for (const [mv, rot, cls] of MOVS){
      const ls = [...m.values()].filter(x => x.mv === mv).sort((a, b) => ordemCod(a.cod) - ordemCod(b.cod) || a.cc.localeCompare(b.cc) || a.aI - b.aI);
      corpo += '<tr class="v45-sec ' + cls + '"><td colspan="10">' + rot + '</td></tr>';
      if (!ls.length){ corpo += '<tr><td colspan="10" class="dash-empty">Sem itens nas ' + rot.toLowerCase() + '.</td></tr>'; continue; }
      let atual = null, sub = null;
      const sCls = mv === 'S' ? ' v35-sai' : '';
      const fechar = () => { if (atual !== null) corpo += '<tr class="dash-total-row' + sCls + '"><td colspan="4">Total ' + esc(nomeReg(atual)) + '</td><td>' + brl(sub.b) + '</td><td></td><td>' + brl(sub.i) + '</td><td></td><td>' + brl(sub.c) + '</td><td>' + fmtInt(sub.n) + '</td></tr>'; };
      for (const x of ls){
        if (x.cod !== atual){ fechar(); atual = x.cod; sub = {n: 0, b: 0, i: 0, c: 0}; }
        sub.n += x.n; sub.b += x.b; sub.i += x.i; sub.c += x.c;
        corpo += '<tr' + (sCls ? ' class="v35-sai"' : '') + '><td><b>' + esc(nomeReg(x.cod)) + '</b></td><td>' + esc(x.cc || '—') + '</td><td>' + esc(x.cst || '—') + '</td><td>' + red(x) + '</td><td>' + brl(x.b) + '</td><td>' + brNumero(x.aI, 2) + '%</td><td><b>' + brl(x.i) + '</b></td><td>' + brNumero(x.aC, 2) + '%</td><td><b>' + brl(x.c) + '</b></td><td>' + fmtInt(x.n) + '</td></tr>';
      }
      fechar();
      corpo += '<tr class="dash-total-row' + sCls + '"><td colspan="4">TOTAL ' + rot + '</td><td>' + brl(T[mv].b) + '</td><td></td><td>' + brl(T[mv].i) + '</td><td></td><td>' + brl(T[mv].c) + '</td><td>' + fmtInt(T[mv].n) + '</td></tr>';
    }
    corpo += '<tr class="dash-total-row v35-dif"><td colspan="4">TOTAL GERAL (Entradas + Saídas)</td><td>' + brl(T.E.b + T.S.b) + '</td><td></td><td>' + brl(T.E.i + T.S.i) + '</td><td></td><td>' + brl(T.E.c + T.S.c) + '</td><td>' + fmtInt(T.E.n + T.S.n) + '</td></tr>';
    const codigos = ['1', '2', '3', '4', ...[...new Set([...porCod.keys()].map(k => k.split('|')[1]))].filter(c => !['1', '2', '3', '4'].includes(c))];
    let res = '';
    for (const [mv, rot, cls] of MOVS){
      res += '<tr class="v45-sec ' + cls + '"><td colspan="7">' + rot + '</td></tr>';
      res += codigos.map(c => { const y = porCod.get(mv + '|' + c) || {docs: new Set, n: 0, b: 0, i: 0, c: 0};
        return '<tr class="' + (y.n ? (mv === 'S' ? 'v35-sai' : '') : 'v42-vazio') + '"><td><b>' + esc(c) + '</b></td><td>' + esc(c === '—' ? 'Não informado no XML' : OPSIMPNAC[c] || 'Código não localizado na tabela') + '</td><td>' + fmtInt(y.docs.size) + '</td><td>' + fmtInt(y.n) + '</td><td>' + brl(y.b) + '</td><td>' + brl(y.i) + '</td><td>' + brl(y.c) + '</td></tr>'; }).join('');
      res += '<tr class="dash-total-row' + (mv === 'S' ? ' v35-sai' : '') + '"><td colspan="2">Total ' + rot + '</td><td>' + fmtInt(T[mv].docs.size) + '</td><td>' + fmtInt(T[mv].n) + '</td><td>' + brl(T[mv].b) + '</td><td>' + brl(T[mv].i) + '</td><td>' + brl(T[mv].c) + '</td></tr>';
    }
    return '<h3>Optante do Simples Nacional — resumo de IBS e CBS</h3><p class="subtle">Regime tributário pelo &lt;opSimpNac&gt; do XML (quando não houver, pelo CRT do emitente), separado em ENTRADAS e SAÍDAS.</p>'
      + '<div class="v33-scroll"><table class="dash-detail-table v42-tab v42-sn"><thead>'
      + '<tr><th rowspan="2">Regime tributário</th><th rowspan="2">cClassTrib</th><th rowspan="2">CST IBS/CBS</th><th rowspan="2">Redução</th><th rowspan="2">Base IBS/CBS</th><th colspan="2" class="v30-ent">IBS</th><th colspan="2" class="v30-sai">CBS</th><th rowspan="2">Itens</th></tr>'
      + '<tr><th class="v30-ent">Alíquota</th><th class="v30-ent">Valor IBS</th><th class="v30-sai">Alíquota</th><th class="v30-sai">Valor CBS</th></tr></thead><tbody>' + corpo + '</tbody></table></div>'
      + '<h4 class="v42-sub">Resumo por código da tabela de opção do Simples Nacional</h4><div class="v33-scroll"><table class="dash-detail-table v42-tab v42-cod"><thead><tr><th>Código</th><th>Significado perante o Simples Nacional</th><th>Documentos</th><th>Itens</th><th>Base IBS/CBS</th><th>Valor IBS</th><th>Valor CBS</th></tr></thead><tbody>' + res + '</tbody></table></div>';
  }
  function cardsV42(){
    const ref = $('dashBaseCst'); if (!ref) return;
    let a = $('dashIbsNaoVal'), s = $('dashSimples');
    if (!a){ a = document.createElement('div'); a.id = 'dashIbsNaoVal'; a.className = 'dashboard-card dash-wide'; ref.insertAdjacentElement('afterend', a); }
    if (!s){ s = document.createElement('div'); s.id = 'dashSimples'; s.className = 'dashboard-card dash-wide'; a.insertAdjacentElement('afterend', s); }
    a.innerHTML = cardIbsNaoValidado();
    s.innerHTML = cardSimples();
  }
  const montarBatV41 = montarBat;
  montarBat = function(){ montarBatV41(); try { cardsV42(); } catch(e){ console.error('V42', e); } };

