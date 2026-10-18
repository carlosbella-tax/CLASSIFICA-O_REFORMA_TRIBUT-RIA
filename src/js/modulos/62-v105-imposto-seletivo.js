  /* =====================================================================
     V105 — Imposto Seletivo (IS) — LC 214/2025, Livro II (arts. 409 a 434)
     Aba Base de IBS/CBS
     - Colunas do grupo IS do XML (NT 2025.002: CSTIS, cClassTribIS, vBCIS,
       pIS, pISEspec, qTrib, vIS) logo depois dos valores de IBS e CBS:
       cst_is, cclasstrib_is, base_is, aliquota_is, valor_is.
     - Validações logo depois de validacao_cbs:
       validacao_cst_is · validacao_base_is · validacao_is (+ valor_correto_is)
       · vigência: o IS é cobrado a partir de 01/01/2027 (antes disso o grupo
         é opcional; IS destacado antes de 2027 = NÃO VALIDADO);
       · incidência: NCM do Anexo XVII (veículos 87.03/87.04, aeronaves 88.02,
         embarcações 89.03, fumígenos 24.02/24.03, bebidas alcoólicas
         22.03–22.06 e 22.08, bebidas açucaradas 2202.10/2202.99, bens
         minerais 26.01, 27.01, 27.09, 27.11). NCM sujeito sem grupo IS a
         partir de 2027 = NÃO VALIDADO; NCM fora do Anexo com IS = NÃO VALIDADO;
       · CST: com valor de IS a CST deve ser tributada (000); CST 000 com base
         e alíquota, mas sem valor = NÃO VALIDADO;
       · base: valor da operação = produtos + frete + seguro + outras despesas
         − desconto incondicional (não integram o IBS, a CBS e o próprio IS);
         também aceita a mesma conta sem ICMS, PIS e COFINS;
       · valor: base × alíquota ad valorem + quantidade × alíquota específica.
       Margem de R$ 0,05.
     Dashboard: quadro "Imposto Seletivo (IS)" junto à apuração de IBS e CBS
     (Resumo geral), com ENTRADAS e SAÍDAS por CST e alíquota.
     ===================================================================== */
  const TOL_V105 = 0.0501;
  const ANEXO_XVII_V105 = [['8703', 'veículos'], ['8704', 'veículos'], ['8802', 'aeronaves'], ['8903', 'embarcações'], ['2402', 'produtos fumígenos'], ['2403', 'produtos fumígenos'],
    ['2203', 'bebidas alcoólicas'], ['2204', 'bebidas alcoólicas'], ['2205', 'bebidas alcoólicas'], ['2206', 'bebidas alcoólicas'], ['2208', 'bebidas alcoólicas'],
    ['220210', 'bebidas açucaradas'], ['220299', 'bebidas açucaradas'], ['2601', 'bens minerais'], ['2701', 'bens minerais'], ['2709', 'bens minerais'], ['2711', 'bens minerais']];
  const anexoIsV105 = ncm => { const n = String(ncm || '').replace(/\D/g, ''); const x = ANEXO_XVII_V105.find(([p]) => n.startsWith(p)); return x ? x[1] : ''; };
  // tags do grupo <imposto><IS> (chaves achatadas item_det_imposto_IS_*)
  const tagIsV105 = (r, t) => { const T = '_' + t.toUpperCase(); for (const k of Object.keys(r || {})){ const u = k.toUpperCase(); if (u.includes('_IMPOSTO_IS_') && u.endsWith(T)) return r[k]; } return ''; };
  function dadosIsV105(r){
    const cst = String(tagIsV105(r, 'CSTIS') || '').trim(), cc = String(tagIsV105(r, 'cClassTribIS') || '').trim();
    const base = num(tagIsV105(r, 'vBCIS')), aliq = num(tagIsV105(r, 'pIS')), esp = num(tagIsV105(r, 'pISEspec')), qtd = num(tagIsV105(r, 'qTrib')), valor = num(tagIsV105(r, 'vIS'));
    return {tem: !!(cst || base || valor || aliq), cst, cc, base, aliq, esp, qtd, valor};
  }
  const anoV105 = r => { const m = String(r.data_emissao || '').match(/^(\d{4})-|\/(\d{4})/); return m ? +(m[1] || m[2]) : 0; };
  function validarIsV105(r){
    const d = dadosIsV105(r), vig = anoV105(r) >= 2027, anexo = anexoIsV105(r.ncm), ncm = String(r.ncm || '');
    const v = {cst: '', base: '', valor: '', correto: 0, d};
    if (!d.tem){
      v.cst = !vig ? 'VALIDADO (sem grupo IS — o Imposto Seletivo é exigido a partir de 01/01/2027)'
        : anexo ? 'NÃO VALIDADO (NCM ' + ncm + ' do Anexo XVII da LC 214/2025 — ' + anexo + ' — sujeito ao IS, mas o XML não traz o grupo IS)'
        : 'VALIDADO (NCM fora do Anexo XVII da LC 214/2025: sem IS)';
      v.base = 'VALIDADO (sem base de IS)'; v.valor = 'VALIDADO (sem IS)';
      return v;
    }
    // CST e incidência
    if (d.valor > 0.005 && !vig) v.cst = 'NÃO VALIDADO (IS destacado antes da vigência — o Imposto Seletivo é cobrado a partir de 01/01/2027)';
    else if (d.valor > 0.005 && !anexo) v.cst = 'NÃO VALIDADO (NCM ' + ncm + ' fora do Anexo XVII da LC 214/2025 com IS destacado)';
    else if (d.valor > 0.005 && d.cst !== '000') v.cst = 'NÃO VALIDADO (CST IS ' + (d.cst || 'vazio') + ' com valor de IS — deveria ser CST 000, tributada)';
    else if (d.cst === '000' && d.valor <= 0.005 && d.base > 0.005 && (d.aliq > 0 || d.esp > 0)) v.cst = 'NÃO VALIDADO (CST IS 000 tributada com base e alíquota, mas sem valor de IS)';
    else if (!/^\d{3}$/.test(d.cst)) v.cst = 'NÃO VALIDADO (CST IS ausente ou inválida: ' + (d.cst || 'vazio') + ')';
    else v.cst = 'VALIDADO (CST IS ' + d.cst + (anexo ? ' — Anexo XVII: ' + anexo : '') + ')';
    // base: valor da operação, sem IBS, CBS e o próprio IS
    if (d.base <= 0.005 && d.valor <= 0.005) v.base = 'VALIDADO (sem base de IS)';
    else {
      const prod = num(r.valor_item), fr = num(campoGrupo(r, 'prod', 'vFrete')), sg = num(campoGrupo(r, 'prod', 'vSeg')), ou = num(campoGrupo(r, 'prod', 'vOutro')), ds = num(campoGrupo(r, 'prod', 'vDesc'));
      const op = arred(prod + fr + sg + ou - ds), semTrib = arred(op - valorIcms(r, 'vICMS') - valorGrupo(r, 'PIS', 'vPIS') - valorGrupo(r, 'COFINS', 'vCOFINS'));
      const conta = 'produtos ' + brl(prod) + ' + frete ' + brl(fr) + ' + seguro ' + brl(sg) + ' + outras despesas ' + brl(ou) + ' − desconto ' + brl(ds) + ' = ' + brl(op);
      if (Math.abs(d.base - op) <= TOL_V105) v.base = 'VALIDADO (valor da operação: ' + conta + ')';
      else if (Math.abs(d.base - semTrib) <= TOL_V105) v.base = 'VALIDADO (valor da operação sem ICMS, PIS e COFINS: ' + brl(semTrib) + ')';
      else v.base = 'NÃO VALIDADO (base de IS deve ser ' + brl(op) + ' — ' + conta + '; não integram IBS, CBS e o próprio IS) diferença: ' + brl(arred(d.base - op));
    }
    // valor: ad valorem + específica
    if (d.valor <= 0.005 && d.base <= 0.005) v.valor = 'VALIDADO (sem IS)';
    else {
      const calc = arred(d.base * d.aliq / 100 + d.qtd * d.esp), ok = Math.abs(d.valor - calc) <= TOL_V105;
      const conta = brl(d.base) + ' × ' + brNumero(d.aliq, 2) + '%' + (d.esp ? ' + ' + brNumero(d.qtd, 4) + ' × ' + brl(d.esp) : '');
      v.valor = ok ? 'VALIDADO (' + conta + ' = ' + brl(calc) + ')' : 'NÃO VALIDADO (IS deve ser ' + conta + ' = ' + brl(calc) + ') diferença: ' + brl(arred(d.valor - calc));
      v.correto = ok ? 0 : calc;
    }
    return v;
  }
  // colunas na aba Base de IBS/CBS
  const linhaIbsCbsV104 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV104(r); if (!o || 'cst_is' in o) return o;
    const v = validarIsV105(o.__src || r), d = v.d, x = {};
    const dados = {cst_is: d.cst, cclasstrib_is: d.cc, base_is: d.base, aliquota_is: d.aliq, valor_is: d.valor};
    const vals = {validacao_cst_is: v.cst, validacao_base_is: v.base, validacao_is: v.valor, valor_correto_is: v.correto};
    for (const k of Object.keys(o)){
      x[k] = o[k];
      if (k === 'valor_cbs') Object.assign(x, dados);
      if (k === 'validacao_cbs') Object.assign(x, vals);
    }
    if (!('cst_is' in x)) Object.assign(x, dados);
    if (!('validacao_is' in x)) Object.assign(x, vals);
    for (const p of ['__src', '__idx']) if (o[p] !== undefined) Object.defineProperty(x, p, {value: o[p], configurable: true, writable: true});
    return x;
  };
  OBS_VAL.validacao_cst_is = 'Imposto Seletivo (LC 214/2025): cobrado a partir de 01/01/2027 sobre os bens do Anexo XVII; com valor de IS a CST deve ser 000.';
  OBS_VAL.validacao_base_is = 'Base do IS = valor da operação (produtos + frete + seguro + outras despesas − desconto incondicional); não integram IBS, CBS e o próprio IS.';
  OBS_VAL.validacao_is = 'Valor do IS = base × alíquota ad valorem + quantidade × alíquota específica; margem de R$ 0,05.';

  /* ---------- Dashboard: quadro de IS junto à apuração de IBS e CBS ---------- */
  function quadroIsV105(){
    const E = new Map, S = new Map, T = {E: {b: 0, v: 0, n: 0}, S: {b: 0, v: 0, n: 0}};
    for (const r of state.items){
      const d = dadosIsV105(r); if (!d.tem) continue;
      const mv = tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E', mp = mv === 'S' ? S : E, k = d.cst + '|' + d.aliq;
      const x = mp.get(k) || {cst: d.cst || '—', aliq: d.aliq, b: 0, v: 0, n: 0}; x.b += d.base; x.v += d.valor; x.n++; mp.set(k, x);
      T[mv].b += d.base; T[mv].v += d.valor; T[mv].n++;
    }
    const linhas = (mp, t) => [...mp.values()].sort((a, b) => String(a.cst).localeCompare(String(b.cst)) || a.aliq - b.aliq)
      .map(x => '<tr><td>' + esc(x.cst) + '</td><td>' + brNumero(x.aliq, 2) + '%</td><td>' + brl(x.b) + '</td><td><b>' + brl(x.v) + '</b></td><td>' + fmtInt(x.n) + '</td></tr>').join('')
      + '<tr class="dash-total-row"><td colspan="2">Total</td><td>' + brl(t.b) + '</td><td>' + brl(t.v) + '</td><td>' + fmtInt(t.n) + '</td></tr>';
    const tab = (rot, cls, mp, t) => '<div style="flex:1;min-width:280px"><h4 class="' + cls + '" style="margin:6px 0">' + rot + '</h4><table class="dash-detail-table v105-is"><thead><tr><th>CST IS</th><th>Alíq. IS</th><th>Base IS</th><th>Valor IS</th><th>Qtd. itens</th></tr></thead><tbody>'
      + (t.n ? linhas(mp, t) : '<tr><td colspan="5" class="dash-empty">Sem IS nesta movimentação.</td></tr>') + '</tbody></table></div>';
    return '<h3>Imposto Seletivo (IS)</h3><p class="subtle">Apuração do IS junto ao IBS e à CBS (LC 214/2025 — cobrado a partir de 01/01/2027). '
      + (T.E.n + T.S.n ? 'Entradas ' + brl(T.E.v) + ' · Saídas ' + brl(T.S.v) + '.' : 'Nenhum grupo IS nos XMLs.') + ' Validação item a item na aba Base de IBS/CBS.</p>'
      + '<div style="display:flex;gap:16px;flex-wrap:wrap">' + tab('ENTRADAS', 'v30-ent', E, T.E) + tab('SAÍDAS', 'v30-sai', S, T.S) + '</div>';
  }
  const renderDashImpostosV104 = renderDashImpostos;
  renderDashImpostos = function(){
    const x = renderDashImpostosV104.apply(this, arguments);
    const tIbs = document.querySelector('#dashboard .dash-ibscbs'), cIbs = tIbs ? tIbs.closest('.dashboard-card') : null;
    if (cIbs){
      let c = $('dashIsV105');
      if (!c){ c = document.createElement('div'); c.id = 'dashIsV105'; c.className = 'dashboard-card dash-wide v17-resumo'; cIbs.insertAdjacentElement('afterend', c); }
      c.innerHTML = quadroIsV105(); c.style.display = DASH_ABA === 'resumo' ? '' : 'none';
    }
    return x;
  };
