  /* =====================================================================
     V53 — Inconsistências: coleta única de tudo que não foi validado,
     detalhamento no Dashboard e slides de Observações na apresentação.
     ===================================================================== */
  const ROT_VAL = {validacao_icms: 'Valor do ICMS', validacao_base_icms: 'Base do ICMS', validacao_ipi: 'Valor do IPI', validacao_cst_ipi: 'CST do IPI',
    validacao_base_pis: 'Base do PIS', validacao_valor_pis: 'Valor do PIS', validacao_base_cofins: 'Base da COFINS', validacao_valor_cofins: 'Valor da COFINS',
    validacao_cst_pis: 'CST do PIS', validacao_cst_cofins: 'CST da COFINS', validacao_cst_entrada_pis: 'CST de entrada do PIS', validacao_cst_entrada_cofins: 'CST de entrada da COFINS',
    validacao_credito_cfop: 'Crédito por CFOP (importação)', validacao_cst_ibs_cbs: 'CST do IBS/CBS', validacao_base_ibs_cbs: 'Base do IBS/CBS', validacao_ibs: 'Valor do IBS',
    validacao_cbs: 'Valor da CBS', validacao_cclasstrib: 'cClassTrib (LC 214/2025)', validacao_ncm_cclasstrib: 'NCM × cClassTrib (TIPI)'};
  const OBS_VAL = {
    validacao_icms: 'ICMS = base × alíquota do XML, com margem de R$ 0,02. No diferimento (CST 51), compara com o ICMS da operação. CST não tributado não é calculado.',
    validacao_base_icms: 'Base = produto + frete + seguro + outras − desconto, com a redução quando houver. XML sem base só é inconsistente na CST 00.',
    validacao_ipi: 'IPI = base × alíquota (ou quantidade × valor por unidade), margem de R$ 0,02. CST não tributado não é calculado.',
    validacao_cst_ipi: 'CST tributado (00 ou 50) deve trazer valor de IPI; CST não tributado (01–05, 51–55) não calcula.',
    validacao_base_pis: 'Lei 14.592/2023: base = valor da operação − ICMS destacado. Na importação, base = valor aduaneiro (art. 7º, I, Lei 10.865/2004).',
    validacao_base_cofins: 'Lei 14.592/2023: base = valor da operação − ICMS destacado. Na importação, base = valor aduaneiro (art. 7º, I, Lei 10.865/2004).',
    validacao_valor_pis: 'PIS = base × alíquota do XML, margem de R$ 0,02. CST tributado (01–03, 50–56) deve trazer valor.',
    validacao_valor_cofins: 'COFINS = base × alíquota do XML, margem de R$ 0,02. CST tributado (01–03, 50–56) deve trazer valor.',
    validacao_cst_pis: 'CST tributado deve trazer valor; CST não tributado (04–09, 70–75) não calcula.',
    validacao_cst_cofins: 'CST tributado deve trazer valor; CST não tributado (04–09, 70–75) não calcula.',
    validacao_cst_entrada_pis: 'Na entrada use CST 50 a 56 (com crédito, conforme a receita), 70 a 75 (sem crédito) ou 98/99. A CST 01 é de saída e não serve para entrada.',
    validacao_cst_entrada_cofins: 'Na entrada use CST 50 a 56 (com crédito, conforme a receita), 70 a 75 (sem crédito) ou 98/99. A CST 01 é de saída e não serve para entrada.',
    validacao_credito_cfop: 'Uso e consumo (3556) não gera crédito; revenda 3102 e insumo 3101 dão crédito pelo valor pago, sem o adicional; imobilizado 3551 sobre a depreciação; 3127/3930 suspensos.',
    validacao_cst_ibs_cbs: 'CST 000 deve trazer IBS/CBS; CST de isenção/imunidade/suspensão (400, 410, 550, 830) não calcula.',
    validacao_base_ibs_cbs: 'Base = produto + frete + seguro + outras + II − desconto − PIS − COFINS − ICMS − FCP − ICMS monofásico (NT 2025.002). Com redução de alíquota, vale a base do XML.',
    validacao_ibs: 'IBS = base × (alíquota UF + Municipal), margem de R$ 0,02.',
    validacao_cbs: 'CBS = base × alíquota da CBS, margem de R$ 0,02.',
    validacao_cclasstrib: 'O cClassTrib deve existir na tabela oficial, pertencer ao CST informado e trazer a redução prevista na LC 214/2025.',
    validacao_ncm_cclasstrib: 'O cClassTrib deve ser candidato para o NCM na TIPI - Base Completa (correlação capítulo × anexo da LC 214/2025).'};
  const PAR_VAL_CORRETO = {validacao_icms: 'valor_correto_icms', validacao_base_icms: 'base_correta_icms', validacao_base_pis: 'base_correta_pis', validacao_valor_pis: 'valor_correto_pis',
    validacao_base_cofins: 'base_correta_cofins', validacao_valor_cofins: 'valor_correto_cofins', validacao_ipi: 'valor_correto_ipi', validacao_base_ibs_cbs: 'base_correta_ibs_cbs', validacao_ibs: 'valor_correto_ibs', validacao_cbs: 'valor_correto_cbs'};
  const naoVal = v => /^(INCORRETO|NÃO VALIDADO)/.test(String(v || ''));
  const motivoDe = v => String(v).replace(/^(INCORRETO|NÃO VALIDADO)\s*/, '').replace(/^\(|\)$/g, '').trim();
  function coletarInconsistencias(){
    const fontes = [['ICMS', () => linhasIcms()], ['IPI', () => linhasIpi()], ['PIS/COFINS', () => linhasPisCofins()], ['IBS/CBS', () => linhasIbsCbsTab()]];
    const itens = [];
    for (const [aba, fn] of fontes){
      let rows = []; try { rows = fn(); } catch(e){ console.error(aba, e); }
      for (const o of rows){
        const r = o.__src || {};
        for (const k of Object.keys(o)){
          if (!k.startsWith('validacao_') || !naoVal(o[k])) continue;
          const corr = PAR_VAL_CORRETO[k];
          itens.push({aba, chave: k, val: ROT_VAL[k] || k.replace('validacao_', ''), motivo: motivoDe(o[k]) || (/base/.test(k) ? 'base do XML diferente da base calculada' : /cst/.test(k) ? 'CST não confere com o valor do XML' : 'valor do XML diferente de base × alíquota'),
            mv: tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E', nf: o.numero_nota_fiscal || o.numero_documento_fiscal || r.numero_documento || '', item: o.numero_item || r.numero_item || '',
            cfop: o.cfop_xml || o.cfop || r.cfop || '', ncm: r.ncm || o.ncm || '', emit: r.emitente_razao_social || o.nome_emitente || '', correto: corr && corr in o ? o[corr] : ''});
        }
      }
    }
    return itens;
  }
  function agruparInconsistencias(itens){
    const g = new Map;
    for (const x of itens){
      const k = x.aba + '|' + x.chave;
      const y = g.get(k) || {aba: x.aba, chave: x.chave, val: x.val, obs: OBS_VAL[x.chave] || '', n: 0, nE: 0, nS: 0, nfs: new Set, mot: new Map};
      y.n++; y[x.mv === 'S' ? 'nS' : 'nE']++; y.nfs.add(x.nf); y.mot.set(x.motivo, (y.mot.get(x.motivo) || 0) + 1); g.set(k, y);
    }
    return [...g.values()].sort((a, b) => b.n - a.n).map(y => {
      const mots = [...y.mot.entries()].sort((a, b) => b[1] - a[1]);
      y.motivo = mots[0][0] + (mots.length > 1 ? ' (+' + (mots.length - 1) + ' variação' + (mots.length > 2 ? 'ões' : '') + ')' : '');
      y.motivos = mots.slice(0, 4).map(([m, n]) => m + ' — ' + n + ' item(ns)');
      return y;
    });
  }
  function cardInconsistencias(){
    const itens = coletarInconsistencias(), grupos = agruparInconsistencias(itens);
    const nE = itens.filter(x => x.mv === 'E').length, nS = itens.length - nE;
    const MAX = 300, det = [...itens].sort((a, b) => a.mv.localeCompare(b.mv) || a.aba.localeCompare(b.aba) || String(a.nf).localeCompare(String(b.nf), 'pt-BR', {numeric: true}));
    const fmtCorr = v => v === '' || v === undefined ? '' : brl(num(v));
    return '<div class="v43-head"><h3>Inconsistências encontradas — detalhamento</h3><span class="v43-badge' + (itens.length ? '' : ' ok') + '">' + (itens.length ? fmtInt(itens.length) + ' ocorrência(s) — Entradas ' + fmtInt(nE) + ' · Saídas ' + fmtInt(nS) : 'Nenhuma inconsistência') + '</span></div>'
      + '<p class="subtle">Tudo o que ficou NÃO VALIDADO nas abas ICMS, IPI, Base de PIS/COFINS e Base de IBS/CBS, com a regra (observação) de cada validação.</p>'
      + (grupos.length ? '<h4 class="v42-sub">Resumo por tipo de inconsistência</h4><div class="v33-scroll"><table class="dash-detail-table v53-res"><colgroup><col style="width:7%"><col style="width:12%"><col style="width:30%"><col style="width:5%"><col style="width:6%"><col style="width:5%"><col style="width:5%"><col style="width:30%"></colgroup><thead><tr><th>Aba</th><th>Validação</th><th>Inconsistência</th><th>Itens</th><th>Entradas</th><th>Saídas</th><th>Notas</th><th>Observação (regra aplicada)</th></tr></thead><tbody>'
        + grupos.map(gp => '<tr><td>' + esc(gp.aba) + '</td><td><b>' + esc(gp.val) + '</b></td><td class="v53-mot">' + gp.motivos.map(esc).join('<br>') + (gp.mot.size > 4 ? '<br>… e mais ' + (gp.mot.size - 4) : '') + '</td><td><b>' + fmtInt(gp.n) + '</b></td><td>' + fmtInt(gp.nE) + '</td><td class="v53-s">' + fmtInt(gp.nS) + '</td><td>' + fmtInt(gp.nfs.size) + '</td><td class="v53-obs">' + esc(gp.obs) + '</td></tr>').join('')
        + '</tbody></table></div>'
        + '<h4 class="v42-sub">Itens não validados' + (det.length > MAX ? ' (primeiros ' + fmtInt(MAX) + ' de ' + fmtInt(det.length) + ' — use o filtro das abas ou exporte o Dashboard para ver todos)' : '') + '</h4>'
        + '<div class="v33-scroll"><table class="dash-detail-table v53-det"><thead><tr><th>Movimento</th><th>NF</th><th>Item</th><th>Emitente</th><th>CFOP</th><th>NCM</th><th>Aba</th><th>Validação</th><th>Inconsistência</th><th>Valor correto</th></tr></thead><tbody>'
        + det.slice(0, MAX).map(x => '<tr' + (x.mv === 'S' ? ' class="v35-sai"' : '') + '><td><span class="v24-mov ' + (x.mv === 'S' ? 'sai' : 'ent') + '">' + (x.mv === 'S' ? 'SAÍDAS' : 'ENTRADAS') + '</span></td><td>' + esc(x.nf) + '</td><td>' + esc(x.item) + '</td><td class="v53-emit">' + esc(x.emit) + '</td><td>' + esc(x.cfop) + '</td><td>' + esc(x.ncm) + '</td><td>' + esc(x.aba) + '</td><td><b>' + esc(x.val) + '</b></td><td class="v53-mot">' + esc(x.motivo) + '</td><td class="v53-corr">' + fmtCorr(x.correto) + '</td></tr>').join('')
        + '</tbody></table></div>' : '<div class="v50-vazio">Todas as validações foram atendidas.</div>');
  }
  const cardsV52 = cardsV42;
  cardsV42 = function(){
    cardsV52();
    const ref = $('dashIbsNaoVal'); if (!ref) return;
    let c = $('dashInconsist');
    if (!c){ c = document.createElement('div'); c.id = 'dashInconsist'; c.className = 'dashboard-card dash-wide'; ref.insertAdjacentElement('beforebegin', c); }
    c.innerHTML = cardInconsistencias();
  };
  // apresentação: observações somente do que não foi validado
  const dadosApresV52 = dadosApresentacao;
  dadosApresentacao = function(){
    const D = dadosApresV52();
    D.observacoes = agruparInconsistencias(coletarInconsistencias()).map(g => ({aba: g.aba, val: g.val, motivo: g.motivo, obs: g.obs, n: g.n, nE: g.nE, nS: g.nS}));
    return D;
  };

