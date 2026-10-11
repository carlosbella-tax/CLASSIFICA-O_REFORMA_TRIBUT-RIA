  /* =====================================================================
     V35 — Base de IBS/CBS: % de redução de alíquota, validação do
     cClassTrib (LC 214/2025) e anexo/artigo; base validada quando há redução.
     ===================================================================== */
  const CCLASS = {"000001": [0, 0, "art. 4º", "", "Situações tributadas integralmente pelo IBS e CBS"], "000002": [0, 0, "art. 11", "", "Exploração de via"], "000003": [0, 0, "art. 311", "", "Regime automotivo - projetos incentivados"], "000004": [0, 0, "art. 312", "", "Regime automotivo - projetos incentivados"], "010001": [0, 0, "art. 212", "", "Operações do FGTS não realizadas pela Caixa Econômica Federal"], "011001": [60, 60, "art. 236", "", "Planos de assistência funerária"], "011002": [60, 60, "art. 237", "", "Planos de assistência à saúde"], "011003": [60, 60, "art. 240", "", "Intermediação de planos de assistência à saúde"], "011004": [0, 0, "art. 246", "", "Concursos e prognósticos"], "011005": [30, 30, "art. 243", "", "Planos de assistência à saúde de animais domésticos"], "200001": [100, 100, "art. 103", "", "Aquisições entre empresas autorizadas a operar em ZPE"], "200002": [100, 100, "art. 110", "", "Tratores, máquinas e implementos agrícolas a produtor rural não contribuinte"], "200003": [100, 100, "art. 125", "Anexo I", "Cesta Básica Nacional de Alimentos"], "200004": [100, 100, "art. 144", "Anexo XII", "Dispositivos médicos"], "200005": [100, 100, "art. 144", "Anexo IV", "Dispositivos médicos adquiridos pela administração pública"], "200006": [100, 100, "art. 144", "Anexo XIII", "Emergência de saúde pública — dispositivos médicos"], "200007": [100, 100, "art. 145", "Anexo XIV", "Dispositivos de acessibilidade para pessoas com deficiência"], "200008": [100, 100, "art. 145", "Anexo V", "Dispositivos de acessibilidade adquiridos pela administração pública"], "200009": [100, 100, "art. 146", "Anexo XIV", "Medicamentos"], "200010": [100, 100, "art. 146", "", "Medicamentos adquiridos pela administração pública e entidades imunes"], "200011": [100, 100, "art. 146", "Anexo VI", "Nutrição enteral e parenteral adquiridas pela administração pública"], "200012": [100, 100, "art. 146", "Anexo XIV", "Emergência de saúde pública — medicamentos"], "200013": [100, 100, "art. 147", "", "Absorventes, tampões e coletores menstruais"], "200014": [100, 100, "art. 148", "Anexo XV", "Produtos hortícolas, frutas e ovos"], "200015": [100, 100, "art. 149", "", "Automóveis para taxistas e pessoas com deficiência"], "200016": [100, 100, "art. 156", "", "Pesquisa e desenvolvimento por ICT sem fins lucrativos"], "200017": [100, 100, "art. 212", "", "Operações relacionadas ao FGTS"], "200018": [100, 100, "art. 223", "", "Resseguro e retrocessão"], "200019": [100, 100, "art. 231", "", "Importação de serviços financeiros"], "200020": [100, 100, "art. 271", "", "Cooperativas — operações com associados"], "200021": [100, 100, "art. 285", "", "Transporte público coletivo ferroviário e hidroviário urbano"], "200022": [100, 100, "art. 445", "", "Operação destinada à Zona Franca de Manaus"], "200023": [100, 100, "art. 448", "", "Indústria incentivada na Zona Franca de Manaus"], "200024": [100, 100, "art. 463", "", "Operação destinada às Áreas de Livre Comércio"], "200025": [60, 100, "art. 308", "", "Educação — Prouni (CBS zero, IBS reduzido 60%)"], "200026": [80, 80, "art. 158", "", "Locação de imóveis em zonas reabilitadas"], "200027": [70, 70, "art. 261", "", "Locação, cessão onerosa e arrendamento de bens imóveis"], "200028": [60, 60, "art. 129", "Anexo II", "Serviços de educação"], "200029": [60, 60, "art. 130", "Anexo III", "Serviços de saúde humana"], "200030": [60, 60, "art. 131", "Anexo IV", "Dispositivos médicos"], "200031": [60, 60, "art. 132", "Anexo V", "Dispositivos de acessibilidade para pessoas com deficiência"], "200032": [60, 60, "art. 133", "", "Medicamentos registrados na Anvisa"], "200033": [60, 60, "art. 133", "Anexo VI", "Nutrição enteral e parenteral"], "200034": [60, 60, "art. 135", "Anexo VII", "Alimentos destinados ao consumo humano"], "200035": [60, 60, "art. 136", "Anexo VIII", "Produtos de higiene pessoal e limpeza"], "200036": [60, 60, "art. 137", "", "Produtos agropecuários, aquícolas, pesqueiros, florestais in natura"], "200037": [60, 60, "art. 137", "", "Serviços ambientais de conservação da vegetação nativa"], "200038": [60, 60, "art. 138", "Anexo IX", "Insumos agropecuários e aquícolas"], "200039": [60, 60, "art. 139", "Anexo X", "Produções artísticas, culturais, jornalísticas e audiovisuais"], "200040": [60, 60, "art. 140", "", "Comunicação institucional à administração pública"], "200041": [60, 60, "art. 141", "", "Atividades desportivas"], "200042": [60, 60, "art. 141", "", "Educação desportiva"], "200043": [60, 60, "art. 142", "Anexo XI", "Soberania, segurança nacional e cibernética (administração pública)"], "200044": [60, 60, "art. 142", "Anexo XI", "Segurança da informação e cibernética"], "200045": [60, 60, "art. 158", "", "Reabilitação urbana de zonas históricas"], "200046": [50, 50, "art. 261", "", "Operações com bens imóveis"], "200047": [40, 40, "art. 275", "", "Bares e restaurantes"], "200048": [40, 40, "art. 281", "", "Hotelaria, parques de diversão e temáticos"], "200049": [40, 40, "art. 286", "", "Transporte coletivo intermunicipal e interestadual de passageiros"], "200050": [40, 40, "art. 287", "", "Transporte aéreo regional coletivo"], "200051": [40, 40, "art. 289", "", "Agências de turismo"], "200052": [30, 30, "art. 127", "", "Profissões intelectuais regulamentadas"], "210001": [50, 50, "art. 259", "", "Redutor social — alienação de imóvel residencial novo"], "210002": [50, 50, "art. 259", "", "Redutor social — alienação de lote residencial"], "210003": [70, 70, "art. 260", "", "Redutor social — locação residencial"], "220001": [0, 0, "art. 485", "", "Incorporação imobiliária — regime especial"], "220002": [0, 0, "art. 485", "", "Incorporação imobiliária — regime especial"], "220003": [0, 0, "art. 486", "", "Alienação de imóvel de parcelamento do solo"], "221001": [0, 0, "art. 487", "", "Locação/arrendamento de imóvel com alíquota sobre receita bruta"], "400001": [0, 0, "art. 157", "", "Transporte público coletivo rodoviário e metroviário urbano"], "410001": [0, 0, "art. 5º", "", "Bonificações constantes do documento fiscal"], "410002": [0, 0, "art. 6º", "", "Transferências entre estabelecimentos do mesmo contribuinte"], "410003": [0, 0, "art. 6º", "", "Doações"], "410004": [0, 0, "art. 8º", "", "Exportações de bens e serviços"], "410005": [0, 0, "art. 9º", "", "Fornecimentos da União, Estados, DF e Municípios"], "410006": [0, 0, "art. 9º", "", "Entidades religiosas e templos"], "410007": [0, 0, "art. 9º", "", "Partidos, sindicatos de trabalhadores, educação e assistência social"], "410008": [0, 0, "art. 9º", "", "Livros, jornais, periódicos e papel"], "410009": [0, 0, "art. 9º", "", "Fonogramas e videofonogramas musicais brasileiros"], "410010": [0, 0, "art. 9º", "", "Radiodifusão de recepção livre e gratuita"], "410011": [0, 0, "art. 9º", "", "Ouro ativo financeiro"], "410012": [0, 0, "art. 26", "", "Condomínio edilício não optante"], "410013": [0, 0, "art. 98", "", "Exportações de combustíveis"], "410014": [0, 0, "art. 164", "", "Produtor rural não contribuinte"], "410015": [0, 0, "art. 169", "", "Transportador autônomo não contribuinte"], "410016": [0, 0, "art. 170", "", "Resíduos sólidos"], "410017": [0, 0, "art. 171", "", "Bem móvel com crédito presumido sob condição de revenda"], "410018": [0, 0, "art. 213", "", "Fundos garantidores e executores de políticas públicas"], "410019": [0, 0, "art. 274", "", "Exclusão da gorjeta no fornecimento de alimentação"], "410020": [0, 0, "art. 274", "", "Exclusão da intermediação no fornecimento de alimentação"], "510001": [0, 0, "art. 28", "", "Diferimento — energia elétrica"], "510002": [0, 0, "art. 138", "", "Diferimento — insumos agropecuários a produtor rural"], "550001": [0, 0, "art. 82", "", "Exportações de bens materiais"], "550002": [0, 0, "art. 84", "", "Regime de trânsito"], "550003": [0, 0, "art. 85", "", "Regimes de depósito"], "550004": [0, 0, "art. 87", "", "Regimes de depósito"], "550005": [0, 0, "art. 87", "", "Regimes de depósito"], "550006": [0, 0, "art. 88", "", "Permanência temporária"], "550007": [0, 0, "art. 90", "", "Regimes de aperfeiçoamento"], "550008": [0, 0, "art. 93, I", "", "Repetro-Temporário"], "550009": [0, 0, "art. 93, II", "", "GNL-Temporário"], "550010": [0, 0, "art. 93, III", "", "Repetro-Permanente"], "550011": [0, 0, "art. 93, IV", "", "Repetro-Industrialização"], "550012": [0, 0, "art. 93, V", "", "Repetro-Nacional"], "550013": [0, 0, "art. 93, VI", "", "Repetro-Entreposto"], "550014": [0, 0, "arts. 99, 100 e 102", "", "Zona de Processamento de Exportação"], "550015": [0, 0, "art. 105", "", "Reporto"], "550016": [0, 0, "art. 106", "", "Reidi"], "550017": [0, 0, "art. 107", "", "Renaval"], "550018": [0, 0, "art. 109", "", "Desoneração da aquisição de bens de capital"], "550019": [0, 0, "art. 443", "", "Importação por indústria incentivada na ZFM"], "550020": [0, 0, "art. 461", "", "Áreas de livre comércio"], "620001": [0, 0, "arts. 172 e 179, I", "", "Monofásica sobre combustíveis"], "620002": [0, 0, "art. 178", "", "Monofásica com responsabilidade pela retenção"], "620003": [0, 0, "art. 178", "", "Monofásica com tributos retidos por responsabilidade"], "620004": [0, 0, "art. 179", "", "Mistura de EAC com gasolina A"], "620005": [0, 0, "art. 180", "", "Monofásica cobrada anteriormente"], "800001": [0, 0, "art. 55", "", "Fusão, cisão ou incorporação"], "800002": [0, 0, "art. 272", "", "Transferência de crédito do associado à cooperativa"], "810001": [0, 0, "art. 450", "", "Crédito presumido — fornecimentos a partir da ZFM"], "820001": [0, 0, "art. 235", "", "Planos de saúde — tributação por outro meio"], "820002": [0, 0, "art. 236", "", "Planos funerários — tributação por outro meio"], "820003": [0, 0, "art. 243", "", "Planos de saúde de animais — tributação por outro meio"], "820004": [0, 0, "art. 248", "", "Concursos de prognósticos — tributação por outro meio"], "820005": [0, 0, "art. 254", "", "Alienação de bens imóveis — tributação por outro meio"]};   // código: [redução IBS %, redução CBS %, artigo, anexo, descrição]
  function redAliq(r, grupo){
    const a = idx(r).tags.get('PREDALIQ'); if (!a) return 0;
    for (const [u, v] of a) if (u.includes('_' + grupo + '_')) return num(v);
    return 0;
  }
  function validaCClass(r, o){
    const c = String(o.cclasstrib || '').trim(), cst = String(o.cst_ibs_cbs || '').trim();
    if (!c) return {v: 'NÃO VALIDADO (cClassTrib não informado no XML)', a: ''};
    const t = CCLASS[c];
    if (!t) return {v: 'NÃO VALIDADO (cClassTrib ' + c + ' não localizado na tabela oficial de cClassTrib)', a: ''};
    const anexo = (t[3] ? t[3] + ' — ' : '') + t[2] + ' da LC 214/2025 · ' + t[4];
    if (cst && c.slice(0, 3) !== cst.padStart(3, '0')) return {v: 'NÃO VALIDADO (cClassTrib ' + c + ' pertence ao CST ' + c.slice(0, 3) + '; o XML informa CST ' + cst + ')', a: anexo};
    const rI = redAliq(r, 'GIBSUF') || redAliq(r, 'GIBSMUN'), rC = redAliq(r, 'GCBS');
    const [eI, eC] = t;
    if (eI || eC){
      const zeroOk = (esp, red, valor) => esp === 100 ? (Math.abs(red - 100) <= 0.0201 || valor <= 0.005) : Math.abs(red - esp) <= 0.0201;
      const okI = zeroOk(eI, rI, num(o.valor_ibs_total)), okC = zeroOk(eC, rC, num(o.valor_cbs));
      if (!okI || !okC) return {v: 'NÃO VALIDADO (redução no XML: IBS ' + brNumero(rI, 2) + '% / CBS ' + brNumero(rC, 2) + '%; LC 214/2025: IBS ' + brNumero(eI, 2) + '% / CBS ' + brNumero(eC, 2) + '%)', a: anexo};
    } else if (rI > 0.005 || rC > 0.005){
      return {v: 'NÃO VALIDADO (o XML traz redução de alíquota, mas o cClassTrib ' + c + ' não prevê redução)', a: anexo};
    }
    return {v: 'VALIDADO', a: anexo};
  }
  const ibsV34 = linhaIbsCbs;
  linhaIbsCbs = function(r){
    const o = ibsV34(r), x = {};
    const rI = redAliq(r, 'GIBSUF') || redAliq(r, 'GIBSMUN'), rC = redAliq(r, 'GCBS');
    const reducao = rI === rC ? rI : null, vc = validaCClass(r, o);
    for (const k of Object.keys(o)){
      if (k === 'base_ibs_cbs_calculada') continue;
      if (k === 'cclasstrib'){
        if (reducao === null){ x.percentual_reducao_ibs = rI; x.percentual_reducao_cbs = rC; }
        else x.percentual_reducao_aliquota = reducao;
      }
      x[k] = o[k];
      if (k === 'valor_cbs'){ x.validacao_cclasstrib = vc.v; x.anexo_lc214_cclasstrib = vc.a; }
    }
    if (rI > 0.005 || rC > 0.005){ x.validacao_base_ibs_cbs = 'VALIDADO (com redução de alíquota, base = base do XML)'; if ('base_correta_ibs_cbs' in x) x.base_correta_ibs_cbs = 0; }
    if (o.__src) Object.defineProperty(x, '__src', {value: o.__src, configurable: true, writable: true});
    return x;
  };
  window.classeValidacao = v => { const t = String(v || ''); return t.startsWith('VALIDADO') ? 'valid' : /^(INCORRETO|NÃO VALIDADO)/.test(t) ? 'invalid' : 'empty'; };

  /* ---------- Resumo geral: uma linha por alíquota, SAÍDAS em azul e negrito, totais e Entradas − Saídas ---------- */
  function tabelaMovimento(tbody, thead, cols, itens){
    // cols: [{t, k, tipo:'m'|'p'}]; itens: [{mv:'E'|'S', chaves..., valores...}] já agrupados
    thead.innerHTML = '<tr><th>Movimento</th>' + cols.map(c => '<th>' + c.t + '</th>').join('') + '</tr>';
    const soma = mv => { const t = {}; for (const c of cols) if (c.tipo === 'm') t[c.k] = itens.filter(i => i.mv === mv).reduce((a, i) => a + (i[c.k] || 0), 0); return t; };
    const cel = (c, v) => c.tipo === 'p' ? (v === '' ? '' : brNumero(v, 2) + '%') : brl(v);
    const linha = (rot, cls, obj, semAliq) => '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + rot + '</td>' + cols.map(c => '<td>' + (c.tipo === 'p' && semAliq ? '' : cel(c, obj[c.k] ?? 0)) + '</td>').join('') + '</tr>';
    const E = itens.filter(i => i.mv === 'E'), S = itens.filter(i => i.mv === 'S'), tE = soma('E'), tS = soma('S'), dif = {};
    for (const c of cols) if (c.tipo === 'm') dif[c.k] = (tE[c.k] || 0) - (tS[c.k] || 0);
    tbody.innerHTML = (E.length ? E.map(i => linha('Entradas', '', i)).join('') : linha('Entradas', '', {}, false))
      + (S.length ? S.map(i => linha('Saídas', 'v35-sai', i)).join('') : linha('Saídas', 'v35-sai', {}, false))
      + linha('Total Entradas', 'dash-total-row', tE, true)
      + linha('Total Saídas', 'dash-total-row v35-sai', tS, true)
      + linha('Entradas (−) Saídas', 'dash-total-row v35-dif', dif, true);
  }
  function agruparMov(pred, chaveFn, valoresFn){
    const m = new Map;
    for (const r of state.items){
      if (!pred(r)) continue;
      const mv = tipoOperacao(r) === 'SAÍDAS' ? 'S' : 'E', ch = chaveFn(r), k = mv + '|' + JSON.stringify(ch), vals = valoresFn(r);
      const x = m.get(k) || Object.assign({mv}, ch, Object.fromEntries(Object.keys(vals).map(kk => [kk, 0])));
      for (const [kk, v] of Object.entries(vals)) x[kk] += v;
      m.set(k, x);
    }
    return [...m.values()].sort((a, b) => a.mv.localeCompare(b.mv) || JSON.stringify(a).localeCompare(JSON.stringify(b), 'pt-BR', {numeric: true}));
  }
  function resumoV35(){
    const tb = id => $(id), th = id => { const t = $(id); return t ? t.closest('table').querySelector('thead') : null; };
    const icms = imp33('icms'), st = imp33('st'), ipi = imp33('ipi');
    if (tb('dashIcmsRows')) tabelaMovimento(tb('dashIcmsRows'), th('dashIcmsRows'), [{t: 'Base ICMS', k: 'b', tipo: 'm'}, {t: 'Alíquota', k: 'a', tipo: 'p'}, {t: 'Valor ICMS', k: 'v', tipo: 'm'}],
      agruparMov(icms.tem, r => ({a: r4(icms.aliq(r))}), r => { const [b, v] = icms.v(r); return {b, v}; }));
    if (tb('dashStRows')) tabelaMovimento(tb('dashStRows'), th('dashStRows'), [{t: 'Base ICMS ST', k: 'b', tipo: 'm'}, {t: 'Valor ICMS ST', k: 'v', tipo: 'm'}],
      agruparMov(st.tem, r => ({}), r => { const [b, v] = st.v(r); return {b, v}; }));
    if (tb('dashIpiRows')) tabelaMovimento(tb('dashIpiRows'), th('dashIpiRows'), [{t: 'Base IPI', k: 'b', tipo: 'm'}, {t: 'Alíquota', k: 'a', tipo: 'p'}, {t: 'Valor IPI', k: 'v', tipo: 'm'}],
      agruparMov(ipi.tem, r => ({a: r4(ipi.aliq(r))}), r => { const [b, v] = ipi.v(r); return {b, v}; }));
    if (tb('dashPisRows')) tabelaMovimento(tb('dashPisRows'), th('dashPisRows'),
      [{t: 'Base PIS/COFINS', k: 'b', tipo: 'm'}, {t: 'Alíq. PIS', k: 'ap', tipo: 'p'}, {t: 'Valor PIS', k: 'p', tipo: 'm'}, {t: 'Alíq. COFINS', k: 'ac', tipo: 'p'}, {t: 'Valor COFINS', k: 'c', tipo: 'm'}],
      agruparMov(r => temGrupoFiscal(r, 'PIS') || temGrupoFiscal(r, 'COFINS'), r => ({ap: r4(valorGrupo(r, 'PIS', 'pPIS')), ac: r4(valorGrupo(r, 'COFINS', 'pCOFINS'))}),
        r => ({b: valorGrupo(r, 'PIS', 'vBC') || valorGrupo(r, 'COFINS', 'vBC'), p: valorGrupo(r, 'PIS', 'vPIS'), c: valorGrupo(r, 'COFINS', 'vCOFINS')})));
    // IBS e CBS: saídas em azul e negrito e linha Entradas (−) Saídas
    const t = document.querySelector('#dashboard .v33-ibs');
    if (t){
      t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if (i >= 7) td.classList.add('v35-sai-cel'); }));
      const tot = t.querySelector('tbody tr.dash-total-row');
      if (tot && !t.querySelector('tr.v35-dif')){
        const c = [...tot.children].map(td => td.textContent);
        const n = s => num(String(s).replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.'));
        tot.insertAdjacentHTML('afterend', '<tr class="dash-total-row v35-dif"><td>Entradas (−) Saídas</td><td>' + brl(n(c[1]) - n(c[8])) + '</td><td></td><td>' + brl(n(c[3]) - n(c[10])) + '</td><td></td><td>' + brl(n(c[5]) - n(c[12])) + '</td><td></td><td colspan="7"></td></tr>');
      }
    }
  }
  const ajustarResumoV34 = ajustarResumo;
  ajustarResumo = function(){ ajustarResumoV34(); resumoV35(); };

