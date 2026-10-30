  /* =====================================================================
     V50 — Aba APRESENTAÇÃO: monta o PowerPoint (modelo Tax Advice) com os
     dados do Dashboard da empresa analisada.
     ===================================================================== */
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  function periodoTexto(){
    const p = $('periodo'), ano = $('anoPeriodo') ? $('anoPeriodo').value : '';
    let mes = p && p.value ? (p.options[p.selectedIndex].text || '') : '';
    if (/^\d+$/.test(mes)) mes = MESES[+mes - 1] || mes;
    mes = mes ? mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase() : '';
    return [mes, ano].filter(Boolean).join(' / ') || 'Período não informado';
  }
  function dadosApresentacao(){
    aplicarCfop();
    const itens = state.items, mvOf = r => tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E';
    const empresa = ($('empresa').value || 'Empresa não informada').trim(), periodo = periodoTexto();
    const regime = textoSel('regimeEmpresa') || 'Regime não informado';
    const D = {empresa, cnpj: $('cnpjEmpresa').value || 'não informado', regime, periodo, docs: state.docs.length, itens: itens.length,
      data: new Date().toLocaleDateString('pt-BR'), rodape: (($('apRodape') && $('apRodape').value) || 'CARLOS BELLA - ESPECIALISTA TRIBUTÁRIO - 11 9949-7347').trim()};
    const ids = ['icms', 'st', 'ipi', 'pis', 'cofins', 'ibs', 'cbs'], nomes = ['ICMS', 'ICMS ST', 'IPI', 'PIS', 'COFINS', 'IBS', 'CBS'];
    D.imp = ids.map((id, i) => { const g = agregar(imp33(id)); return {nome: nomes[i], E: g.ENTRADAS.valor, S: g['SAÍDAS'].valor}; });
    const icms = imp33('icms'), ipi = imp33('ipi');
    const al = {E: new Map, S: new Map}, cf = {E: new Map, S: new Map}, ip = new Map, pcS = {pis: new Map, cof: new Map}, pcE = [], ibsA = new Set, cbsA = new Set;
    const ib = {baseE: 0, baseS: 0, cfopE: new Map, cfopS: new Map};
    for (const r of itens){
      const mv = mvOf(r);
      if (icms.tem(r)){ const [, v] = icms.v(r), a = r4(icms.aliq(r)); if (v){ al[mv].set(a, (al[mv].get(a) || 0) + v);
        const c = r.cfop || 'Sem CFOP', x = cf[mv].get(c) || {cfop: c, desc: r.descricao_cfop || '', v: 0}; x.v += v; cf[mv].set(c, x); } }
      if (ipi.tem(r)){ const [b, v] = ipi.v(r), a = r4(ipi.aliq(r)); const x = ip.get(a) || {a, E: 0, S: 0, baseS: 0}; x[mv] += v; if (mv === 'S') x.baseS += b; ip.set(a, x); }
      if (temGrupoFiscal(r, 'PIS') || temGrupoFiscal(r, 'COFINS')){
        const ap = r4(valorGrupo(r, 'PIS', 'pPIS')), ac = r4(valorGrupo(r, 'COFINS', 'pCOFINS')), vp = valorGrupo(r, 'PIS', 'vPIS'), vc = valorGrupo(r, 'COFINS', 'vCOFINS');
        if (mv === 'S'){ if (vp) pcS.pis.set(ap, (pcS.pis.get(ap) || 0) + vp); if (vc) pcS.cof.set(ac, (pcS.cof.get(ac) || 0) + vc); } else pcE.push([ap, ac, vp + vc]);
      }
      if (temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS')){
        const b = valorGrupo(r, 'IBS', 'vBC'), vI = valorGrupo(r, 'IBS', 'vIBS'), vC = valorGrupo(r, 'CBS', 'vCBS');
        if (vI) ibsA.add(r4(num(campoGrupo(r, 'IBS', 'pIBSUF')) + num(campoGrupo(r, 'IBS', 'pIBSMun')))); if (vC) cbsA.add(r4(campoGrupo(r, 'CBS', 'pCBS')));
        if (mv === 'S') ib.baseS += b; else ib.baseE += b;
        const m = mv === 'S' ? ib.cfopS : ib.cfopE, c = r.cfop || 'Sem CFOP'; m.set(c, (m.get(c) || 0) + vC);
      }
    }
    D.icmsAliq = {E: [...al.E.entries()], S: [...al.S.entries()]};
    D.icmsCfop = {E: [...cf.E.values()].sort((a, b) => b.v - a.v), S: [...cf.S.values()].sort((a, b) => b.v - a.v)};
    D.ipiAliq = [...ip.values()].filter(x => x.E || x.S);
    const topAl = m => [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    const aP = topAl(pcS.pis), aC = topAl(pcS.cof);
    D.pc = {aliqS: [aP && aP[0], aC && aC[0]].filter(v => v), shareE: 0};
    const totPcE = pcE.reduce((a, x) => a + x[2], 0);
    D.pc.shareE = totPcE ? pcE.filter(x => (!aP || x[0] === aP[0]) && (!aC || x[1] === aC[0])).reduce((a, x) => a + x[2], 0) / totPcE * 100 : 0;
    const cfl = m => [...m.entries()].map(([cfop, v]) => ({cfop, v})).filter(x => x.v).sort((a, b) => b.v - a.v);
    D.ibs = {aI: [...ibsA].sort((a, b) => a - b), aC: [...cbsA].sort((a, b) => a - b), baseE: ib.baseE, baseS: ib.baseS, cfopE: cfl(ib.cfopE), cfopS: cfl(ib.cfopS)};

    // pendências de IBS/CBS (tipo principal por item)
    const P = {E: {n: 0, base: 0, ibs: 0, cbs: 0}, S: {n: 0, base: 0, ibs: 0, cbs: 0}}, tipos = new Map, ncms = new Map;
    const classifica = o => {
      const v = k => String(o['validacao_' + k] || ''), ruim = k => /^(INCORRETO|NÃO VALIDADO)/.test(v(k));
      if (ruim('ncm_cclasstrib') && /não encontrado na TIPI|sem NCM/i.test(v('ncm_cclasstrib'))) return ['NCM não encontrado na TIPI', 'NCM não encontrado na TIPI 2026'];
      if (ruim('base_ibs_cbs')) return ['Base do XML ≠ base calculada', 'Base do XML diferente da base calculada'];
      if (ruim('ncm_cclasstrib')) return ['cClassTrib fora dos candidatos', 'cClassTrib não é candidato para o NCM'];
      if (ruim('cclasstrib')) return ['cClassTrib inválido (LC 214)', 'cClassTrib não confere com a LC 214/2025'];
      if (ruim('ibs') || ruim('cbs')) return ['Valor de IBS/CBS divergente', 'Valor do XML diferente de base × alíquota'];
      if (ruim('cst_ibs_cbs')) return ['CST de IBS/CBS', 'CST tributado sem valor no XML'];
      return null;
    };
    for (const r of itens){
      if (!(temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS'))) continue;
      const o = linhaIbsCbs(r), t = classifica(o); if (!t) continue;
      const mv = mvOf(r), b = num(o.base_ibs_cbs_xml), vi = num(o.valor_ibs_total), vc = num(o.valor_cbs);
      const p = P[mv]; p.n++; p.base += b; p.ibs += vi; p.cbs += vc;
      const x = tipos.get(t[0]) || {rot: t[0], desc: t[1], n: 0, base: 0, ncm: new Map}; x.n++; x.base += b;
      const nc = String(r.ncm || '').replace(/\D/g, ''), ncF = nc.length === 8 ? fmtNcm(nc) : (nc || 'sem NCM'); x.ncm.set(ncF, (x.ncm.get(ncF) || 0) + 1); tipos.set(t[0], x);
      const y = ncms.get(ncF) || {ncm: ncF, desc: (REF39.tipi[nc] && REF39.tipi[nc][0].replace(/^[-–\s]+/, '')) || (nc && /^0+$/.test(nc) ? 'Sem NCM válido (' + ncF + ')' : 'NCM não encontrado na TIPI'), n: 0, base: 0, pend: new Map};
      y.n++; y.base += b; y.pend.set(t[0] === 'Base do XML ≠ base calculada' ? 'Base do XML ≠ calculada' : t[0], (y.pend.get(t[0] === 'Base do XML ≠ base calculada' ? 'Base do XML ≠ calculada' : t[0]) || 0) + 1); ncms.set(ncF, y);
    }
    D.pend = {E: P.E, S: P.S,
      tipos: [...tipos.values()].sort((a, b) => b.n - a.n).map(x => { const top = [...x.ncm.entries()].sort((a, b) => b[1] - a[1])[0];
        return {rot: x.rot, n: x.n, base: x.base, desc: x.rot === 'NCM não encontrado na TIPI' && top && top[1] / x.n > 0.6 ? 'NCM ' + top[0] + ' não encontrado na TIPI 2026' : x.desc, topNcm: top ? top[0] : ''}; }),
      ncms: [...ncms.values()].sort((a, b) => b.n - a.n || b.base - a.base).map(y => ({ncm: y.ncm, desc: y.desc, n: y.n, base: y.base, pend: [...y.pend.entries()].sort((a, b) => b[1] - a[1])[0][0]}))};

    // Simples Nacional
    const sn = () => ({itens: 0, docs: new Set, base: 0, porCod: {}});
    const SN = {E: sn(), S: sn()};
    for (const r of itens){
      const mv = mvOf(r), cod = regimeItem(r).cod || '—', b = (temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS')) ? valorGrupo(r, 'IBS', 'vBC') : 0, doc = r.chave_documento || r.arquivo_origem;
      const z = SN[mv]; z.itens++; z.docs.add(doc); z.base += b;
      const c = z.porCod[cod] || (z.porCod[cod] = {n: 0, b: 0, docs: new Set}); c.n++; c.b += b; c.docs.add(doc);
    }
    for (const k of ['E', 'S']){ SN[k].docs = SN[k].docs.size; for (const c of Object.values(SN[k].porCod)) c.docs = c.docs.size; }
    D.simples = SN;

    // pontos de atenção
    const pontos = [];
    for (const t of D.pend.tipos.slice(0, 3)){
      const itensTxt = fmtInt(t.n) + ' itens';
      if (t.rot === 'NCM não encontrado na TIPI') pontos.push([t.topNcm && /NCM \d/.test(t.desc) ? 'Corrigir o NCM ' + t.topNcm : 'Corrigir NCMs fora da TIPI', itensTxt + ' (base de ' + brl(t.base) + ') não passam na validação da TIPI 2026.']);
      else if (t.rot.startsWith('Base')) pontos.push(['Conferir a base de IBS/CBS', itensTxt + ' têm a base do XML diferente da base calculada (' + brl(t.base) + ').']);
      else if (t.rot.startsWith('cClassTrib fora')) pontos.push(['Revisar o cClassTrib', itensTxt + ' usam um código que não é candidato para o NCM na TIPI.']);
      else if (t.rot.startsWith('cClassTrib inválido')) pontos.push(['Revisar o cClassTrib (LC 214/2025)', itensTxt + ' têm cClassTrib que não confere com a tabela oficial.']);
      else pontos.push(['Conferir ' + t.rot, itensTxt + ' com ' + t.desc.toLowerCase() + '.']);
    }
    const contaInc = (lista, chaves) => lista.filter(o => chaves.some(k => /^(INCORRETO|NÃO VALIDADO)/.test(String(o[k] || '')))).length;
    if (pontos.length < 3){ const n = contaInc(linhasIcms(), ['validacao_icms', 'validacao_base_icms']); if (n) pontos.push(['Revisar o ICMS', fmtInt(n) + ' itens com base ou valor de ICMS não validado na aba ICMS.']); }
    if (pontos.length < 3){ const n = contaInc(linhasPisCofins(), ['validacao_base_pis', 'validacao_valor_pis', 'validacao_base_cofins', 'validacao_valor_cofins']); if (n) pontos.push(['Revisar PIS e COFINS', fmtInt(n) + ' itens com base ou valor de PIS/COFINS não validado.']); }
    const nSup = D.imp.filter(x => x.S > x.E + 0.005).length, sTot = D.imp.reduce((a, x) => a + x.E - x.S, 0);
    pontos.push(['Acompanhar o saldo', 'Em ' + nSup + ' dos 7 tributos, as saídas superam as entradas. Saldo total: ' + (sTot < 0 ? '−' : '') + brl(Math.abs(sTot)) + '.']);
    D.pontos = pontos.slice(0, 4);
    D.consultor = {nome: $('apNome').value || 'Carlos Bella', email: $('apEmail').value || '', fone: $('apFone').value || '', site: $('apSite').value || ''};
    return D;
  }
  function montarPreviaApresentacao(){
    const box = $('apPrevia'); if (!box) return;
    if (!state.items.length){ box.innerHTML = '<div class="v50-vazio">Processe os XMLs (ou importe um diagnóstico salvo) para montar a apresentação.</div>'; return; }
    try {
      const D = dadosApresentacao(), pres = montarApresentacaoPptx(PptxGenJS, D, IMG50);
      box.innerHTML = pres.__roteiro.map((s, i) => '<div class="v50-slide' + (i === 0 || i === pres.__roteiro.length - 1 ? ' escuro' : '') + '"><span class="r">' + esc(D.rodape) + '</span><span class="n">' + (i + 1) + '</span><small>' + esc(s.k) + '</small><b>' + esc(s.t) + '</b></div>').join('');
    } catch(e){ console.error(e); box.innerHTML = '<div class="v50-vazio">Não foi possível montar a prévia: ' + esc(e.message) + '</div>'; }
  }
  async function gerarApresentacao(){
    if (!state.items.length){ alert('Processe os XMLs (ou importe um diagnóstico salvo) antes de gerar a apresentação.'); return; }
    const b = $('apGerar'); b.disabled = true; b.textContent = 'Gerando apresentação...';
    try {
      const D = dadosApresentacao(), pres = montarApresentacaoPptx(PptxGenJS, D, IMG50);
      const nome = 'Diagnostico_Operacoes_Fiscais_' + (D.empresa.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40)) + '_' + D.periodo.replace(/[^A-Za-z0-9]+/g, '_') + '.pptx';
      await pres.writeFile({fileName: nome});
      $('apStatus').textContent = 'Apresentação gerada: ' + nome + ' (' + pres.__roteiro.length + ' slides).'; $('apStatus').className = 'status ok';
    } catch(e){ console.error(e); alert('Erro ao gerar a apresentação: ' + e.message); }
    b.disabled = false; b.textContent = '📊 Gerar apresentação em PowerPoint';
  }
  (function(){
    const nav = document.querySelector('.tab[data-tab="dashboard"]');
    const t = document.createElement('button'); t.className = 'tab'; t.dataset.tab = 'apresentacao'; t.textContent = 'Apresentação';
    nav.insertAdjacentElement('afterend', t);
    const sec = document.createElement('section'); sec.id = 'apresentacao'; sec.className = 'panel';
    sec.innerHTML = '<div class="card v50-topo"><div><h2>Apresentação em PowerPoint</h2><p class="subtle">Monta a apresentação resumida no modelo Tax Advice (14 slides) com os dados do Dashboard da empresa analisada: nome, CNPJ, regime e período da primeira tela.</p></div>'
      + '<button type="button" id="apGerar" class="v45-btn">📊 Gerar apresentação em PowerPoint</button></div>'
      + '<div class="card"><b>Consultor exibido no último slide</b><div class="v50-form">'
      + '<label>Nome<input id="apNome" value="Carlos Bella"></label><label>E-mail<input id="apEmail" value="carlos.bella@taxadvice.com.br"></label>'
      /* V131 — telefone padronizado na identificação do consultor em PPTX. */
      + '<label>Telefone<input id="apFone" value="(11) 99479-7347"></label><label>Site<input id="apSite" value="taxadvice.com.br"></label></div>'
      + '<div class="v50-form v51-rod"><label>Rodapé dos slides<input id="apRodape" value="CARLOS BELLA - ESPECIALISTA TRIBUTÁRIO - 11 9949-7347"></label></div>'
      + '<div id="apStatus" class="status">Os slides abaixo mostram o roteiro com os títulos calculados a partir dos dados atuais.</div></div>'
      + '<div class="v50-grade" id="apPrevia"></div>'
      + '<div class="v51-rodape" id="apRodapeTela">CARLOS BELLA - ESPECIALISTA TRIBUTÁRIO - 11 9949-7347</div>';
    $('dashboard').insertAdjacentElement('afterend', sec);
    t.onclick = () => { document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); document.querySelectorAll('.panel').forEach(x => x.classList.remove('active')); t.classList.add('active'); sec.classList.add('active'); montarPreviaApresentacao(); };
    $('apGerar').onclick = gerarApresentacao;
    $('apRodape').addEventListener('input', () => { $('apRodapeTela').textContent = $('apRodape').value; });
    $('apRodape').addEventListener('change', montarPreviaApresentacao);
  })();

