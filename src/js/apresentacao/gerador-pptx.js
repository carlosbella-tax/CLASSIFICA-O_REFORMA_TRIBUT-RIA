/* Gerador da apresentação "Diagnóstico Operações Fiscais" (modelo Tax Advice) — usa PptxGenJS */
function montarApresentacaoPptx(PptxGenJS, D, IMG){
  const C = {navy: '143854', navy2: '123F68', azul: '1D6B99', laranja: 'FD7B2F', verde: '1C7844', verm: 'C04010', cinza: '5B6670',
    borda: 'CFD9E3', card: 'F2F7FB', rosa: 'FBEAE3', total: 'DCE8F3', claro: 'CFE0EE', escuro: '0E3354', branco: 'FFFFFF'};
  const F = 'Poppins';
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Diagnóstico Operações Fiscais — ' + D.empresa;
  pres.company = 'Tax Advice';

  /* ---------- formatação ---------- */
  const nf = (v, c = 2) => Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits: c, maximumFractionDigits: c});
  const neg = v => v < -0.004;
  const brl = v => (neg(v) ? '−' : '') + 'R$ ' + nf(Math.abs(v));
  const curto = v => { const a = Math.abs(v || 0), s = neg(v) ? '−' : '';
    if (a >= 1e6) return s + 'R$ ' + nf(a / 1e6, 2) + ' mi';
    if (a >= 1e3) return s + 'R$ ' + nf(a / 1e3, 1) + ' mil';
    return s + 'R$ ' + nf(a, 2); };
  const pct = (v, c = 1) => nf(v, c) + '%';
  const pctDe = (p, t) => t ? p / t * 100 : 0;
  const int = v => Number(v || 0).toLocaleString('pt-BR');
  const aliqTxt = a => nf(a, 2).replace(/,00$/, '') + '%';
  const rodape = D.rodape;

  /* ---------- peças comuns ---------- */
  let nSlide = 0; const roteiro = [{k: 'CAPA', t: 'Diagnóstico Operações Fiscais — ' + D.empresa}];
  function base(kicker, titulo){
    const s = pres.addSlide(); nSlide++; roteiro.push({k: kicker, t: titulo});
    s.background = {color: C.branco};
    s.addImage({data: IMG.logo, x: 12.17, y: 0.36, w: 0.57, h: 0.62});
    s.addText(kicker, {x: 0.6, y: 0.4, w: 9.5, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: C.azul, charSpacing: 3, margin: 0, isTextBox: true});
    s.addText(titulo, {x: 0.6, y: 0.78, w: 11.2, h: 1.05, fontFace: F, fontSize: 28, bold: true, color: C.navy, valign: 'top', margin: 0, fit: 'shrink', isTextBox: true});
    s.addText(rodape, {x: 0.6, y: 7.03, w: 10.5, h: 0.3, fontFace: F, fontSize: 10.5, bold: true, color: C.cinza, margin: 0, isTextBox: true});
    s.addText(String(nSlide), {x: 12.0, y: 7.03, w: 0.73, h: 0.3, fontFace: F, fontSize: 10.5, color: C.cinza, align: 'right', margin: 0, isTextBox: true});
    return s;
  }
  const card = (s, x, y, w, h, fill) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, {x, y, w, h, rectRadius: 0.08, fill: {color: fill || C.card}, line: {color: C.borda, width: 0.75}});
  const txt = (s, t, o) => s.addText(t, Object.assign({fontFace: F, margin: 0, isTextBox: true, valign: 'top'}, o));
  const cel = (t, o) => ({text: t, options: Object.assign({fontFace: F, color: C.navy, valign: 'middle'}, o || {})});
  const cab = (t, al) => cel(t, {bold: true, color: C.branco, fill: {color: C.navy2}, align: al || 'left'});
  function tabela(s, linhas, o){
    s.addTable(linhas, Object.assign({fontFace: F, border: {type: 'solid', color: C.borda, pt: 0.75}, margin: [0.03, 0.12, 0.03, 0.12], valign: 'middle'}, o));
  }

  /* ---------- 1. Capa ---------- */
  {
    const s = pres.addSlide(); nSlide++;
    s.background = {data: IMG.fundo};
    s.addImage({data: IMG.logoCapa, x: 9.54, y: 1.9, w: 3.19, h: 3.5});
    txt(s, 'DASHBOARD DA ANÁLISE FISCAL', {x: 0.6, y: 1.45, w: 8.2, h: 0.3, fontSize: 13, bold: true, color: C.laranja, charSpacing: 3});
    txt(s, 'Diagnóstico Operações Fiscais', {x: 0.6, y: 1.95, w: 8.0, h: 1.75, fontSize: 44, bold: true, color: C.branco});
    txt(s, [
      {text: D.empresa, options: {fontSize: 22, bold: true, breakLine: true}},
      {text: 'CNPJ ' + D.cnpj + ' · ' + D.regime + ' · ' + D.periodo, options: {fontSize: 16, breakLine: true}},
      {text: int(D.docs) + ' documentos · ' + int(D.itens) + ' itens analisados', options: {fontSize: 16}}
    ], {x: 0.6, y: 3.95, w: 8.0, h: 1.9, color: C.branco, paraSpaceAfter: 6});
    txt(s, 'Dados do dashboard gerados em ' + D.data, {x: 0.6, y: 6.55, w: 8.0, h: 0.3, fontSize: 12, color: C.claro});
    txt(s, rodape, {x: 0.6, y: 7.03, w: 10.5, h: 0.3, fontSize: 10.5, bold: true, color: C.claro});
  }

  /* ---------- 2. Resumo ---------- */
  // V66 — Lucro Presumido: PIS e COFINS das entradas são só informativos (não deduzem das saídas)
  const LP = !!D.lucroPresumido, semCredito = x => LP && (x.nome === 'PIS' || x.nome === 'COFINS'), entradaSaldo = x => semCredito(x) ? 0 : x.E;
  const totE = D.imp.reduce((a, x) => a + x.E, 0), totS = D.imp.reduce((a, x) => a + x.S, 0), saldo = D.imp.reduce((a, x) => a + entradaSaldo(x), 0) - totS;
  {
    const tit = Math.abs(saldo) < 0.005 ? 'Entradas e saídas destacaram o mesmo valor de tributos'
      : saldo < 0 ? 'As saídas destacaram ' + curto(-saldo) + ' a mais de tributos do que as entradas'
      : 'As entradas destacaram ' + curto(saldo) + ' a mais de tributos do que as saídas';
    const s = base('RESUMO', tit);
    const k = (x, w, rot, cor, v1, v2) => { card(s, x, 1.95, w, 2.15); txt(s, rot, {x: x + 0.25, y: 2.15, w: w - 0.5, h: 0.3, fontSize: 13, bold: true, color: cor, charSpacing: 1.5});
      txt(s, v1, {x: x + 0.25, y: 2.53, w: w - 0.5, h: 0.75, fontSize: 34, bold: true, color: C.navy, fit: 'shrink'});
      txt(s, v2, {x: x + 0.25, y: 3.36, w: w - 0.5, h: 0.59, fontSize: 14, color: C.cinza}); };
    k(0.6, 3.75, 'TRIBUTOS NAS ENTRADAS', C.verde, curto(totE), brl(totE));
    k(4.49, 3.75, 'TRIBUTOS NAS SAÍDAS', C.verm, curto(totS), brl(totS));
    k(8.38, 4.35, LP ? 'SALDO (SEM PIS/COFINS DAS ENTRADAS)' : 'SALDO (ENTRADAS − SAÍDAS)', C.navy, curto(saldo), brl(saldo));
    card(s, 0.6, 4.4, 5.92, 2.25);
    txt(s, 'BASE ANALISADA', {x: 0.85, y: 4.6, w: 5.42, h: 0.3, fontSize: 13, bold: true, color: C.azul, charSpacing: 1.5});
    txt(s, int(D.docs) + ' documentos', {x: 0.85, y: 4.98, w: 5.42, h: 0.75, fontSize: 34, bold: true, color: C.navy, fit: 'shrink'});
    txt(s, int(D.itens) + ' itens · XMLs reconhecidos · ' + D.regime, {x: 0.85, y: 5.81, w: 5.42, h: 0.69, fontSize: 14, color: C.cinza});
    const pE = D.pend.E.n, pS = D.pend.S.n;
    card(s, 6.82, 4.4, 5.92, 2.25, pE + pS ? C.rosa : C.card);
    txt(s, 'PENDÊNCIAS DE IBS/CBS', {x: 7.07, y: 4.6, w: 5.42, h: 0.3, fontSize: 13, bold: true, color: pE + pS ? C.verm : C.verde, charSpacing: 1.5});
    txt(s, int(pE + pS) + ' itens', {x: 7.07, y: 4.98, w: 5.42, h: 0.75, fontSize: 34, bold: true, color: C.navy});
    txt(s, pE + pS ? (int(pE) + ' de entrada e ' + int(pS) + ' de saída com validação não atendida.' + (pS ? '' : ' Nas saídas, nenhum item não validado.'))
      : 'Todos os itens com IBS/CBS foram validados.', {x: 7.07, y: 5.81, w: 5.42, h: 0.69, fontSize: 14, color: C.cinza});
  }

  /* ---------- 3. Entradas × Saídas por imposto ---------- */
  {
    const tot = totE + totS, ord = [...D.imp].sort((a, b) => (b.E + b.S) - (a.E + a.S)), top = ord.slice(0, 3);
    const p3 = pctDe(top.reduce((a, x) => a + x.E + x.S, 0), tot);
    const s = base('ENTRADAS × SAÍDAS POR IMPOSTO', top.map(x => x.nome).join(', ').replace(/, ([^,]*)$/, ' e $1') + ' somam ' + pct(p3) + ' de todos os tributos destacados');
    const labels = D.imp.map(x => x.nome).reverse();
    s.addChart(pres.charts.BAR, [
      {name: 'Saídas', labels, values: D.imp.map(x => +(x.S / 1000).toFixed(1)).reverse()},
      {name: 'Entradas', labels, values: D.imp.map(x => +(x.E / 1000).toFixed(1)).reverse()}
    ], {x: 0.6, y: 1.85, w: 8.3, h: 5.05, barDir: 'bar', barGrouping: 'clustered', chartColors: [C.verm, C.verde],
      showTitle: true, title: 'Valores destacados nos XMLs (R$ mil)', titleFontFace: F, titleFontSize: 12, titleColor: C.cinza,
      showLegend: true, legendPos: 't', legendFontFace: F, legendFontSize: 11, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 9, dataLabelFontFace: F,
      dataLabelFormatCode: '#,##0.0', catAxisLabelFontFace: F, catAxisLabelFontSize: 11, catAxisLabelColor: C.navy, valAxisHidden: true,
      valGridLine: {style: 'none'}, catGridLine: {style: 'none'}, barGapWidthPct: 60});
    const nota = (y, t, corpo) => { card(s, 9.25, y, 3.48, 1.55); txt(s, t, {x: 9.47, y: y + 0.15, w: 3.04, h: 0.3, fontSize: 15, bold: true, color: C.azul}); txt(s, corpo, {x: 9.47, y: y + 0.5, w: 3.04, h: 0.95, fontSize: 13, color: C.navy, fit: 'shrink'}); };
    const icms = D.imp[0], ipi = D.imp[2], ibs = D.imp[5], cbs = D.imp[6];
    nota(1.95, 'ICMS', curto(icms.S) + ' nas saídas e ' + curto(icms.E) + ' nas entradas.');
    nota(3.67, 'IPI', ipi.S > ipi.E * 2 && ipi.E > 0 ? 'Saídas (' + curto(ipi.S) + ') são mais que o dobro das entradas (' + curto(ipi.E) + ').'
      : 'Saídas de ' + curto(ipi.S) + ' e entradas de ' + curto(ipi.E) + '.');
    nota(5.39, 'IBS e CBS', (ibs.E + ibs.S + cbs.E + cbs.S) > 0 ? 'Total de ' + curto(ibs.E + ibs.S + cbs.E + cbs.S) + ', nas alíquotas de teste de 2026.' : 'Sem IBS/CBS destacado nos XMLs.');
  }

  /* ---------- 4. Saldo por imposto ---------- */
  {
    const nS = D.imp.filter(x => x.S > entradaSaldo(x) + 0.005).length;
    const ext = ['nenhum', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete'];
    const s = base('SALDO POR IMPOSTO', nS ? 'Em ' + ext[nS] + ' dos sete tributos, as saídas superam as entradas' : 'Em todos os tributos, as entradas superam ou igualam as saídas');
    const linhas = [[cab('Imposto'), cab('Entradas', 'right'), cab('Saídas', 'right'), cab('Saldo (E − S)', 'right')]];
    for (const x of D.imp){ const sd = entradaSaldo(x) - x.S;
      linhas.push([cel(x.nome + (semCredito(x) ? ' *' : ''), {bold: true}), cel(brl(x.E), {color: C.verde, align: 'right'}), cel(brl(x.S), {color: C.verm, align: 'right'}), cel(brl(sd), {bold: true, color: neg(sd) ? C.verm : C.verde, align: 'right'})]); }
    linhas.push([cel('Total', {bold: true, fill: {color: C.total}}), cel(brl(totE), {bold: true, color: C.verde, align: 'right', fill: {color: C.total}}), cel(brl(totS), {bold: true, color: C.verm, align: 'right', fill: {color: C.total}}), cel(brl(saldo), {bold: true, color: neg(saldo) ? C.verm : C.verde, align: 'right', fill: {color: C.total}})]);
    tabela(s, linhas, {x: 0.6, y: 1.9, w: 12.13, colW: [2.9, 3.1, 3.1, 3.03], rowH: 0.5, fontSize: 17});
    txt(s, 'Saldo = Entradas − Saídas. Saldo negativo significa que as saídas destacaram mais imposto do que as entradas.'
      + (LP ? ' * Lucro Presumido: PIS e COFINS sem crédito — as entradas são informativas e o saldo é somente o valor das saídas.' : ''), {x: 0.6, y: 6.5, w: 12.13, h: LP ? 0.55 : 0.4, fontSize: LP ? 12 : 14, color: C.cinza, fit: 'shrink'});
  }

  /* ---------- 4b. Notas de serviço (NFS-e) — V89: só quando houver NFS-e ---------- */
  if (D.servicos && D.servicos.T && D.servicos.T.n){
    const R = D.servicos, campos = R.campos || [];
    const s = base('NOTAS DE SERVIÇO (NFS-e)', int(R.T.n) + (R.T.n > 1 ? ' notas de serviço somam ' : ' nota de serviço soma ') + curto(R.T.valor_servico) + ', com ' + curto(R.T.valor_iss) + ' de ISS');
    const linhas = [[cab('Campo'), cab('Entradas (' + int(R.E.n) + ')', 'right'), cab('Saídas (' + int(R.S.n) + ')', 'right'), cab('Total', 'right')]];
    for (const [k, t] of campos) linhas.push([cel(t, {bold: true}), cel(brl(R.E[k]), {color: C.verde, align: 'right'}), cel(brl(R.S[k]), {color: C.verm, align: 'right'}), cel(brl(R.T[k]), {bold: true, align: 'right', fill: {color: C.total}})]);
    tabela(s, linhas, {x: 0.6, y: 1.9, w: 12.13, colW: [3.4, 2.91, 2.91, 2.91], rowH: 0.38, fontSize: 13});
    txt(s, 'NFS-e lidas do XML (padrão nacional ou ABRASF) ou do PDF. ISS retido = ISS das notas com retenção pelo tomador. Detalhe por nota na aba ISS.', {x: 0.6, y: 6.55, w: 12.13, h: 0.4, fontSize: 12.5, color: C.cinza, fit: 'shrink'});
  }

  /* ---------- 5. ICMS por alíquota ---------- */
  {
    const E = D.icmsAliq.E, S = D.icmsAliq.S, tE = E.reduce((a, x) => a + x[1], 0), tS = S.reduce((a, x) => a + x[1], 0);
    const mapa = new Map; for (const [a, v] of E) mapa.set(a, {E: v, S: 0}); for (const [a, v] of S){ const x = mapa.get(a) || {E: 0, S: 0}; x.S = v; mapa.set(a, x); }
    let grupos = [...mapa.entries()].sort((a, b) => (b[1].E + b[1].S) - (a[1].E + a[1].S));
    const princ = grupos.slice(0, 3).sort((a, b) => a[0] - b[0]), resto = grupos.slice(3);
    const cats = princ.map(g => aliqTxt(g[0])), vE = princ.map(g => g[1].E), vS = princ.map(g => g[1].S);
    if (resto.length){ cats.push('Outras'); vE.push(resto.reduce((a, g) => a + g[1].E, 0)); vS.push(resto.reduce((a, g) => a + g[1].S, 0)); }
    const topE = [...E].sort((a, b) => b[1] - a[1])[0] || [0, 0], pE = pctDe(topE[1], tE);
    const s = base('ICMS · POR ALÍQUOTA', tE ? 'No ICMS das entradas, ' + pct(pE) + ' está na alíquota de ' + aliqTxt(topE[0]) : 'Sem ICMS destacado nas entradas');
    if (cats.length) s.addChart(pres.charts.BAR, [{name: 'Entradas', labels: cats, values: vE.map(v => +(v / 1000).toFixed(1))}, {name: 'Saídas', labels: cats, values: vS.map(v => +(v / 1000).toFixed(1))}],
      {x: 0.6, y: 1.85, w: 7.5, h: 5.05, barDir: 'col', barGrouping: 'clustered', chartColors: [C.verde, C.verm], showTitle: true, title: 'ICMS por alíquota (R$ mil)', titleFontFace: F, titleFontSize: 12, titleColor: C.cinza,
        showLegend: true, legendPos: 't', legendFontFace: F, legendFontSize: 11, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 10, dataLabelFormatCode: '#,##0.0',
        catAxisLabelFontFace: F, catAxisLabelFontSize: 12, catAxisLabelColor: C.navy, valAxisHidden: true, valGridLine: {style: 'none'}, catGridLine: {style: 'none'}, barGapWidthPct: 70});
    card(s, 8.4, 1.95, 4.33, 2.3);
    txt(s, 'ENTRADAS', {x: 8.65, y: 2.12, w: 3.83, h: 0.3, fontSize: 13, bold: true, color: C.verde, charSpacing: 1.5});
    txt(s, tE ? pct(pE) : '—', {x: 8.65, y: 2.45, w: 3.83, h: 0.75, fontSize: 38, bold: true, color: C.navy});
    txt(s, tE ? 'do ICMS vem da alíquota de ' + aliqTxt(topE[0]) + ' (' + curto(topE[1]) + ' de ' + curto(tE) + ').' : 'Nenhum ICMS destacado nas entradas.', {x: 8.65, y: 3.25, w: 3.83, h: 0.9, fontSize: 15, color: C.cinza, fit: 'shrink'});
    card(s, 8.4, 4.5, 4.33, 2.35);
    const sOrd = [...S].sort((a, b) => b[1] - a[1]);
    txt(s, 'SAÍDAS', {x: 8.65, y: 4.67, w: 3.83, h: 0.3, fontSize: 13, bold: true, color: C.verm, charSpacing: 1.5});
    txt(s, sOrd.length ? int(sOrd.length) + (sOrd.length > 1 ? ' alíquotas' : ' alíquota') : '—', {x: 8.65, y: 5.0, w: 3.83, h: 0.75, fontSize: 38, bold: true, color: C.navy});
    txt(s, sOrd.length ? (sOrd.length > 1 ? 'dividem o ICMS: ' : 'concentra o ICMS: ') + sOrd.slice(0, 4).map(x => aliqTxt(x[0]) + ' (' + pct(pctDe(x[1], tS)) + ')').join(', ').replace(/, ([^,]*)$/, ' e $1') + '.' : 'Nenhum ICMS destacado nas saídas.',
      {x: 8.65, y: 5.8, w: 3.83, h: 0.95, fontSize: 15, color: C.cinza, fit: 'shrink'});
  }

  /* ---------- 6. ICMS principais CFOPs ---------- */
  {
    const tE = D.icmsCfop.E.reduce((a, x) => a + x.v, 0), tS = D.icmsCfop.S.reduce((a, x) => a + x.v, 0);
    const top2 = (l, t) => pctDe(l.slice(0, 2).reduce((a, x) => a + x.v, 0), t);
    const s = base('ICMS · PRINCIPAIS CFOPs', 'Dois CFOPs concentram ' + pct(top2(D.icmsCfop.E, tE), 0) + ' do ICMS das entradas e ' + pct(top2(D.icmsCfop.S, tS), 0) + ' das saídas');
    const tab = (x, lista, t, rot, cor) => {
      txt(s, rot + ' · ICMS ' + brl(t), {x, y: 1.9, w: 5.9, h: 0.35, fontSize: 15, bold: true, color: cor});
      const linhas = [[cab('CFOP'), cab('Descrição'), cab('ICMS (R$)', 'right'), cab('%', 'right')]];
      for (const c of lista.slice(0, 4)) linhas.push([cel(c.cfop, {bold: true}), cel(c.desc.slice(0, 60), {fontSize: 12}), cel(nf(c.v), {align: 'right'}), cel(pct(pctDe(c.v, t)), {bold: true, align: 'right'})]);
      const resto = lista.slice(4).reduce((a, c) => a + c.v, 0);
      if (lista.length > 4) linhas.push([cel('', {fill: {color: C.total}}), cel('Demais CFOPs', {fill: {color: C.total}}), cel(nf(resto), {align: 'right', fill: {color: C.total}}), cel(pct(pctDe(resto, t)), {bold: true, align: 'right', fill: {color: C.total}})]);
      if (!lista.length) linhas.push([cel('—'), cel('Sem ICMS destacado'), cel('0,00', {align: 'right'}), cel('0,0%', {align: 'right'})]);
      tabela(s, linhas, {x, y: 2.35, w: 5.9, colW: [0.8, 2.85, 1.45, 0.8], fontSize: 13, rowH: 0.62});
    };
    tab(0.6, D.icmsCfop.E, tE, 'ENTRADAS', C.verde);
    tab(6.83, D.icmsCfop.S, tS, 'SAÍDAS', C.verm);
    txt(s, 'CFOPs iniciados em 1 e 2 são entradas; em 5 e 6, saídas (5 = operação interna, 6 = interestadual).', {x: 0.6, y: 6.55, w: 12.13, h: 0.4, fontSize: 13.5, color: C.cinza});
  }

  /* ---------- 7. IPI ---------- */
  {
    const ipi = D.imp[2], tS = ipi.S, ls = D.ipiAliq;
    const topS = [...ls].sort((a, b) => b.S - a.S)[0] || {a: 0, S: 0, baseS: 0};
    const s = base('IPI', tS ? 'No IPI das saídas, ' + pct(pctDe(topS.S, tS), 0) + ' do valor está na alíquota de ' + aliqTxt(topS.a) : 'Sem IPI destacado nas saídas');
    const k = (y, rot, cor, v) => { card(s, 0.6, y, 4.3, 1.5); txt(s, rot, {x: 0.85, y: y + 0.2, w: 3.8, h: 0.3, fontSize: 13, bold: true, color: cor, charSpacing: 1.5}); txt(s, v, {x: 0.85, y: y + 0.6, w: 3.8, h: 0.7, fontSize: 28, bold: true, color: C.navy, fit: 'shrink'}); };
    k(1.9, 'ENTRADAS', C.verde, brl(ipi.E)); k(3.6, 'SAÍDAS', C.verm, brl(ipi.S)); k(5.3, 'SALDO (E − S)', C.navy, brl(ipi.E - ipi.S));
    const ord = [...ls].filter(x => x.a > 0).sort((a, b) => a.a - b.a), linhas = [[cab('Alíquota'), cab('Entradas (R$)', 'right'), cab('Saídas (R$)', 'right')]];
    const mostrar = ord.length > 4 ? [...ord].sort((a, b) => (b.E + b.S) - (a.E + a.S)).slice(0, 3).sort((a, b) => a.a - b.a) : ord;
    for (const x of mostrar) linhas.push([cel(nf(x.a, 2) + '%', {bold: true}), cel(nf(x.E), {align: 'right'}), cel(nf(x.S), {align: 'right', bold: x.S > 0})]);
    const rest = ls.filter(x => !mostrar.includes(x)), rE = rest.reduce((a, x) => a + x.E, 0), rS = rest.reduce((a, x) => a + x.S, 0);
    if (rest.length && (rE || rS)) linhas.push([cel('Demais alíquotas'), cel(nf(rE), {align: 'right'}), cel(nf(rS), {align: 'right'})]);
    linhas.push([cel('Total', {bold: true, fill: {color: C.total}}), cel(nf(ipi.E), {bold: true, align: 'right', fill: {color: C.total}}), cel(nf(ipi.S), {bold: true, align: 'right', fill: {color: C.total}})]);
    tabela(s, linhas, {x: 5.3, y: 1.9, w: 7.43, colW: [2.43, 2.5, 2.5], fontSize: 16, rowH: 0.55});
    card(s, 5.3, 5.85, 7.43, 0.95);
    txt(s, tS ? 'Nas saídas, base de ' + brl(topS.baseS) + ' à alíquota de ' + aliqTxt(topS.a) + '.' : 'Nenhum IPI destacado nas saídas.', {x: 5.6, y: 5.85, w: 6.83, h: 0.95, fontSize: 16, color: C.navy, valign: 'middle'});
  }

  /* ---------- 8. PIS e COFINS ---------- */
  {
    const pis = D.imp[3], cof = D.imp[4];
    const aS = D.pc.aliqS.length ? 'nas saídas, alíquotas de ' + D.pc.aliqS.map(aliqTxt).join(' e ') : 'sem PIS/COFINS nas saídas';
    const s = base('PIS E COFINS', 'PIS e COFINS: ' + aS);
    const painel = (x, nome, o) => { card(s, x, 1.9, 5.9, 3.75); txt(s, nome, {x: x + 0.3, y: 2.1, w: 5.3, h: 0.5, fontSize: 24, bold: true, color: C.azul});
      (LP ? [['Entradas (informativo)', o.E, C.cinza], ['Saídas', o.S, C.verm], ['A recolher (saídas)', o.S, C.navy]]
          : [['Entradas', o.E, C.verde], ['Saídas', o.S, C.verm], ['Saldo (E − S)', o.E - o.S, C.navy]]).forEach(([r, v, c], i) => {
        txt(s, r, {x: x + 0.3, y: 2.8 + i * 0.93, w: 2.1, h: 0.6, fontSize: 16, color: C.cinza, valign: 'middle', fit: 'shrink'});
        txt(s, brl(v), {x: x + 2.3, y: 2.8 + i * 0.93, w: 3.3, h: 0.6, fontSize: 26, bold: true, color: c, align: 'right', valign: 'middle', fit: 'shrink'}); }); };
    painel(0.6, 'PIS', pis); painel(6.83, 'COFINS', cof);
    card(s, 0.6, 5.9, 12.13, 0.95);
    txt(s, LP ? 'Lucro Presumido (regime cumulativo): as entradas aparecem só como informação — PIS de ' + brl(pis.E) + ' e COFINS de ' + brl(cof.E) + ' — e não são deduzidas. O valor a recolher é somente o das saídas.'
      : D.pc.aliqS.length ? 'Nas entradas, ' + pct(D.pc.shareE) + ' do valor de PIS e COFINS também está nas alíquotas de ' + D.pc.aliqS.map(aliqTxt).join(' e ') + '.' : 'Nas entradas, PIS de ' + brl(pis.E) + ' e COFINS de ' + brl(cof.E) + '.',
      {x: 0.9, y: 5.9, w: 11.53, h: 0.95, fontSize: 17, color: C.navy, valign: 'middle'});
  }

  /* ---------- 9. IBS e CBS ---------- */
  {
    const ibs = D.imp[5], cbs = D.imp[6], tot = ibs.E + ibs.S + cbs.E + cbs.S;
    const s = base('IBS E CBS · ALÍQUOTAS DE TESTE DE 2026', tot ? 'IBS e CBS: ' + curto(tot) + ' destacados, ' + pct(pctDe(cbs.E + cbs.S, tot), 0) + ' deles de CBS' : 'IBS e CBS: nenhum valor destacado nos XMLs');
    const linhas = [[cab('Tributo'), cab('Alíquota', 'right'), cab('Entradas', 'right'), cab('Saídas', 'right'), cab('Saldo (E − S)', 'right')],
      [cel('IBS', {bold: true}), cel(D.ibs.aI.map(aliqTxt).join(' / ') || '—', {align: 'right'}), cel(brl(ibs.E), {color: C.verde, align: 'right'}), cel(brl(ibs.S), {color: C.verm, align: 'right'}), cel(brl(ibs.E - ibs.S), {bold: true, color: neg(ibs.E - ibs.S) ? C.verm : C.verde, align: 'right'})],
      [cel('CBS', {bold: true}), cel(D.ibs.aC.map(aliqTxt).join(' / ') || '—', {align: 'right'}), cel(brl(cbs.E), {color: C.verde, align: 'right'}), cel(brl(cbs.S), {color: C.verm, align: 'right'}), cel(brl(cbs.E - cbs.S), {bold: true, color: neg(cbs.E - cbs.S) ? C.verm : C.verde, align: 'right'})],
      [cel('Base IBS/CBS', {bold: true, fill: {color: C.total}}), cel('', {fill: {color: C.total}}), cel(brl(D.ibs.baseE), {align: 'right', fill: {color: C.total}}), cel(brl(D.ibs.baseS), {align: 'right', fill: {color: C.total}}), cel('', {fill: {color: C.total}})]];
    tabela(s, linhas, {x: 0.6, y: 1.9, w: 12.13, colW: [2.6, 1.8, 2.6, 2.6, 2.53], fontSize: 16, rowH: 0.55});
    const k = (x, rot, cor, lista, t) => { card(s, x, 4.55, 5.92, 2.3); txt(s, rot, {x: x + 0.28, y: 4.75, w: 5.36, h: 0.3, fontSize: 13, bold: true, color: cor, charSpacing: 1.5});
      const p = pctDe(lista.slice(0, 2).reduce((a, c) => a + c.v, 0), t);
      txt(s, t ? pct(p) : '—', {x: x + 0.28, y: 5.1, w: 5.36, h: 0.75, fontSize: 36, bold: true, color: C.navy});
      txt(s, t ? 'vem do' + (lista.length > 1 ? 's CFOPs ' + lista[0].cfop + ' e ' + lista[1].cfop + ' (' + curto(lista[0].v) + ' + ' + curto(lista[1].v) : ' CFOP ' + lista[0].cfop + ' (' + curto(lista[0].v)) + ' de ' + curto(t) + ').' : 'Sem CBS destacada.',
        {x: x + 0.28, y: 5.9, w: 5.36, h: 0.8, fontSize: 14, color: C.cinza, fit: 'shrink'}); };
    k(0.6, 'CBS NAS ENTRADAS', C.verde, D.ibs.cfopE, cbs.E);
    k(6.82, 'CBS NAS SAÍDAS', C.verm, D.ibs.cfopS, cbs.S);
  }

  /* ---------- 10. IBS/CBS não validados ---------- */
  const P = D.pend, nPend = P.E.n + P.S.n;
  {
    const quem = P.E.n && P.S.n ? int(P.E.n) + ' itens de entrada e ' + int(P.S.n) + ' de saída têm' : P.S.n ? int(P.S.n) + ' itens de saída têm' : int(P.E.n) + ' itens de entrada têm';
    const s = base('IBS E CBS NÃO VALIDADOS', nPend ? quem + ' IBS/CBS não validado' : 'Todos os itens com IBS/CBS foram validados');
    const tipos = P.tipos.slice(0, 3), cores = [C.verm, C.navy2, C.azul];
    if (tipos.length){
      s.addChart(pres.charts.BAR, [{name: 'Itens', labels: tipos.map(t => t.rot).reverse(), values: tipos.map(t => t.n).reverse()}],
        {x: 0.6, y: 1.9, w: 6.5, h: 4.05, barDir: 'bar', chartColors: tipos.map((t, i) => cores[i]).reverse(), showTitle: true, title: 'Itens por tipo de pendência', titleFontFace: F, titleFontSize: 12, titleColor: C.cinza,
          showLegend: false, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 11, catAxisLabelFontFace: F, catAxisLabelFontSize: 11, catAxisLabelColor: C.navy, valAxisHidden: true, valGridLine: {style: 'none'}, catGridLine: {style: 'none'}, barGapWidthPct: 50});
      tipos.forEach((t, i) => { const y = 1.95 + i * 1.4; card(s, 7.45, y, 5.28, 1.25);
        s.addShape(pres.shapes.OVAL, {x: 7.7, y: y + 0.2, w: 0.2, h: 0.2, fill: {color: cores[i]}, line: {color: cores[i]}});
        txt(s, int(t.n) + ' itens', {x: 8.05, y: y + 0.12, w: 4.43, h: 0.4, fontSize: 20, bold: true, color: C.navy});
        txt(s, t.desc + ' · base ' + curto(t.base), {x: 8.05, y: y + 0.54, w: 4.43, h: 0.66, fontSize: 14.5, color: C.cinza, fit: 'shrink'}); });
    } else { card(s, 0.6, 1.95, 12.13, 3.9); txt(s, 'Nenhuma pendência de IBS/CBS encontrada nos XMLs processados.', {x: 0.9, y: 1.95, w: 11.5, h: 3.9, fontSize: 22, bold: true, color: C.verde, align: 'center', valign: 'middle'}); }
    card(s, 0.6, 6.12, 12.13, 0.7);
    txt(s, 'Base afetada ' + brl(P.E.base + P.S.base) + ' · IBS ' + brl(P.E.ibs + P.S.ibs) + ' · CBS ' + brl(P.E.cbs + P.S.cbs) + (P.S.n ? ' · Saídas: ' + int(P.S.n) + ' itens não validados.' : ' · Saídas: nenhum item não validado.'),
      {x: 0.9, y: 6.12, w: 11.53, h: 0.7, fontSize: 15, color: C.navy, valign: 'middle', fit: 'shrink'});
  }

  /* ---------- 11. NCMs com pendência ---------- */
  {
    const ls = P.ncms, tb = P.E.base + P.S.base, top = ls[0];
    const s = base('NCMS COM PENDÊNCIA', top ? 'NCM ' + top.ncm + ' concentra ' + int(top.n) + ' itens e ' + pct(pctDe(top.base, tb)) + ' da base com pendência' : 'Nenhum NCM com pendência de IBS/CBS');
    const linhas = [[cab('NCM'), cab('Descrição'), cab('Itens', 'right'), cab('Pendência'), cab('Base IBS/CBS (R$)', 'right')]];
    for (const x of ls.slice(0, 5)) linhas.push([cel(x.ncm, {bold: true}), cel(x.desc.slice(0, 55), {fontSize: 14}), cel(int(x.n), {bold: true, align: 'right'}), cel(x.pend, {color: x.pend.startsWith('NCM') ? C.verm : C.navy, fontSize: 14}), cel(nf(x.base), {align: 'right'})]);
    const rest = ls.slice(5);
    if (rest.length) linhas.push([cel('Demais', {bold: true, fill: {color: C.total}}), cel(int(rest.length) + ' NCMs', {fill: {color: C.total}}), cel(int(rest.reduce((a, x) => a + x.n, 0)), {bold: true, align: 'right', fill: {color: C.total}}), cel('Diversas', {fill: {color: C.total}}), cel(nf(rest.reduce((a, x) => a + x.base, 0)), {align: 'right', fill: {color: C.total}})]);
    if (!ls.length) linhas.push([cel('—'), cel('Sem pendências'), cel('0', {align: 'right'}), cel('—'), cel('0,00', {align: 'right'})]);
    tabela(s, linhas, {x: 0.6, y: 1.9, w: 12.13, colW: [1.7, 4.2, 1.0, 3.3, 1.93], fontSize: 15, rowH: 0.62});
    txt(s, 'Total: ' + int(nPend) + ' itens · base ' + brl(tb) + '.' + (P.S.n ? '' : ' Todas as pendências estão nas entradas.'), {x: 0.6, y: 6.55, w: 12.13, h: 0.35, fontSize: 14, color: C.cinza});
  }

  /* ---------- 12. Simples Nacional ---------- */
  {
    const E = D.simples.E, opt = (E.porCod['2']?.n || 0) + (E.porCod['3']?.n || 0) + (E.porCod['4']?.n || 0), pOpt = pctDe(opt, E.itens);
    const s = base('REGIME NO XML · SIMPLES NACIONAL', E.itens ? pct(pOpt) + ' dos itens de entrada têm regime Simples Nacional' : 'Sem itens de entrada para classificar o regime');
    txt(s, 'ENTRADAS · ' + int(E.itens) + ' itens · ' + int(E.docs) + ' documentos', {x: 0.6, y: 1.98, w: 12.13, h: 0.35, fontSize: 15, bold: true, color: C.verde});
    [['1', 'NÃO OPTANTE (Lucro Real ou Presumido)', C.navy], ['3', 'OPTANTE · ME / EPP', C.azul], ['2', 'OPTANTE · MEI', C.azul]].forEach(([cod, rot, cor], i) => {
      const x = 0.6 + i * 4.145, o = E.porCod[cod] || {n: 0, b: 0, docs: 0};
      card(s, x, 2.45, 3.84, 2.15);
      txt(s, rot, {x: x + 0.25, y: 2.63, w: 3.34, h: 0.5, fontSize: 12.5, bold: true, color: cor});
      txt(s, int(o.n) + ' itens', {x: x + 0.25, y: 3.17, w: 3.34, h: 0.7, fontSize: 32, bold: true, color: C.navy});
      txt(s, [{text: brl(o.b), options: {breakLine: true}}, {text: int(o.docs) + ' documentos'}], {x: x + 0.25, y: 3.95, w: 3.34, h: 0.6, fontSize: 14, color: C.cinza});
    });
    const S = D.simples.S;
    card(s, 0.6, 4.85, 12.13, 0.9);
    txt(s, [{text: 'SAÍDAS  ', options: {bold: true, color: C.verm, fontSize: 14}}, {text: S.itens ? pct(pctDe(S.porCod['1']?.n || 0, S.itens), 0) + ' dos ' + int(S.itens) + ' itens (' + int(S.docs) + ' documentos · base ' + brl(S.base) + ') aparecem como Não optante.' : 'Nenhum item de saída.', options: {fontSize: 16, color: C.navy}}],
      {x: 0.9, y: 4.85, w: 11.53, h: 0.9, valign: 'middle', fit: 'shrink'});
    const bOpt = (E.porCod['2']?.b || 0) + (E.porCod['3']?.b || 0) + (E.porCod['4']?.b || 0);
    card(s, 0.6, 5.95, 12.13, 0.9, C.rosa);
    txt(s, [{text: 'Por itens, ' + pct(pOpt) + ' das entradas aparecem como optantes do Simples.', options: {breakLine: true}}, {text: 'Por valor, ' + pct(pctDe(bOpt, E.base)) + ' da base de IBS/CBS das entradas.'}],
      {x: 0.9, y: 5.95, w: 11.53, h: 0.9, fontSize: 16, color: C.navy, valign: 'middle'});
  }

  /* ---------- V70/V87 — Eventos das notas fiscais: resumo por tipo (o mesmo do Dashboard) ---------- */
  if (D.eventos && D.eventos.total){
    const EV = D.eventos, nE = EV.E.length, nS = EV.S.length, tipos = EV.tipos || [], max = 9;
    const s = base('EVENTOS DAS NOTAS FISCAIS', int(EV.total) + ' evento' + (EV.total > 1 ? 's' : '') + (EV.canc ? ', ' + int(EV.canc) + ' cancelamento' + (EV.canc > 1 ? 's' : '') + ' fora da apuração' : ', nenhum cancelamento'));
    const kp = (x, rot, v, cor) => { card(s, x, 1.9, 2.85, 1.25); txt(s, rot, {x: x + 0.2, y: 2.0, w: 2.45, h: 0.3, fontSize: 11.5, bold: true, color: cor, charSpacing: 1});
      txt(s, String(v), {x: x + 0.2, y: 2.35, w: 2.45, h: 0.7, fontSize: 30, bold: true, color: C.navy}); };
    kp(0.6, 'EVENTOS', int(EV.total), C.azul); kp(3.69, 'NOTAS', int(EV.notas || 0), C.azul); kp(6.78, 'ENTRADAS · SAÍDAS', int(nE) + ' · ' + int(nS), C.azul); kp(9.87, 'CANCELAMENTOS', int(EV.canc), C.verm);
    const linhas = [[cab('tpEvento'), cab('descEvento'), cab('Entradas', 'right'), cab('Saídas', 'right'), cab('Total', 'right')]];
    for (const tt of tipos.slice(0, max)) linhas.push([cel(tt.tp, {bold: true}), cel(tt.desc.slice(0, 60), {color: tt.canc ? C.verm : C.navy, bold: tt.canc}),
      cel(int(tt.E), {align: 'right'}), cel(int(tt.S), {align: 'right'}), cel(int(tt.E + tt.S), {bold: true, align: 'right'})]);
    linhas.push([cel('Total', {bold: true, fill: {color: C.total}}), cel('', {fill: {color: C.total}}), cel(int(nE), {bold: true, align: 'right', fill: {color: C.total}}),
      cel(int(nS), {bold: true, align: 'right', fill: {color: C.total}}), cel(int(EV.total), {bold: true, align: 'right', fill: {color: C.total}})]);
    tabela(s, linhas, {x: 0.6, y: 3.4, w: 12.13, colW: [1.6, 6.03, 1.5, 1.5, 1.5], fontSize: 13, rowH: 0.36, autoPage: false});
    txt(s, 'Notas canceladas ficam fora dos valores de ICMS, IPI, PIS, COFINS e IBS/CBS desta apresentação. Demais eventos são informativos.', {x: 0.6, y: 6.55, w: 12.13, h: 0.35, fontSize: 12, color: C.cinza, fit: 'shrink'});
  }

  /* ---------- Observações: somente o que não foi validado ---------- */
  {
    const obs = D.observacoes || [], porSlide = 6, partes = [];
    for (let i = 0; i < Math.max(1, Math.min(obs.length, 18)); i += porSlide) partes.push(obs.slice(i, i + porSlide));
    partes.forEach((lista, pi) => {
      const total = obs.reduce((a, o) => a + o.n, 0);
      const s = base('OBSERVAÇÕES · ITENS NÃO VALIDADOS' + (partes.length > 1 ? ' (' + (pi + 1) + '/' + partes.length + ')' : ''),
        obs.length ? int(total) + ' ocorrências não validadas, em ' + int(obs.length) + ' tipo' + (obs.length > 1 ? 's' : '') + ' de inconsistência' : 'Nenhuma inconsistência encontrada nas validações');
      if (!lista.length){ card(s, 0.6, 1.95, 12.13, 4.8); txt(s, 'Todas as validações foram atendidas.', {x: 0.9, y: 1.95, w: 11.5, h: 4.8, fontSize: 22, bold: true, color: C.verde, align: 'center', valign: 'middle'}); return; }
      const linhas = [[cab('Validação'), cab('Itens', 'right'), cab('Inconsistência'), cab('Observação (regra)')]];
      for (const o of lista) linhas.push([cel(o.aba + ' · ' + o.val, {bold: true, fontSize: 11}), cel(int(o.n) + (o.nS ? '\n(' + int(o.nE) + ' E · ' + int(o.nS) + ' S)' : ''), {bold: true, align: 'right', fontSize: 11, color: C.verm}),
        cel(o.motivo.slice(0, 150), {fontSize: 10.5}), cel(o.obs.slice(0, 220), {fontSize: 10, color: C.cinza})]);
      tabela(s, linhas, {x: 0.6, y: 1.9, w: 12.13, colW: [2.35, 1.0, 3.9, 4.88], fontSize: 11, rowH: 0.7, autoPage: false});
      if (pi === partes.length - 1 && obs.length > 18) txt(s, 'Exibidos os 18 tipos mais frequentes de ' + int(obs.length) + '. O detalhamento completo está no Dashboard.', {x: 0.6, y: 6.6, w: 12.13, h: 0.35, fontSize: 12, color: C.cinza});
    });
  }

  /* ---------- 13. Pontos de atenção ---------- */
  {
    const s = base('PONTOS DE ATENÇÃO', 'O que olhar primeiro neste diagnóstico');
    const pontos = [...D.pontos].slice(0, 4);
    pontos.forEach((p, i) => { const y = 1.95 + i * 1.22; card(s, 0.6, y, 12.13, 1.05);
      txt(s, String(i + 1).padStart(2, '0'), {x: 0.9, y, w: 0.9, h: 1.05, fontSize: 30, bold: true, color: C.laranja, valign: 'middle'});
      txt(s, p[0], {x: 1.9, y: y + 0.12, w: 10.53, h: 0.42, fontSize: 19, bold: true, color: C.navy});
      txt(s, p[1], {x: 1.9, y: y + 0.55, w: 10.53, h: 0.42, fontSize: 16, color: C.cinza, fit: 'shrink'}); });
  }

  /* ---------- 14. Contato ---------- */
  {
    const s = pres.addSlide(); nSlide++;
    s.background = {data: IMG.fundo};
    s.addImage({data: IMG.logoCapa, x: 9.54, y: 1.9, w: 3.19, h: 3.5});
    txt(s, 'TAX ADVICE · ASSESSORIA FISCAL TRIBUTÁRIA', {x: 0.6, y: 1.45, w: 8.2, h: 0.3, fontSize: 13, bold: true, color: C.laranja, charSpacing: 3});
    txt(s, 'Fale com a Tax Advice', {x: 0.6, y: 1.95, w: 8.0, h: 0.8, fontSize: 44, bold: true, color: C.branco});
    txt(s, 'Diagnóstico Operações Fiscais · ' + D.periodo, {x: 0.6, y: 2.75, w: 8.0, h: 0.5, fontSize: 18, color: C.branco});
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {x: 0.6, y: 3.75, w: 8.55, h: 2.15, rectRadius: 0.08, fill: {color: C.escuro}, line: {color: '3E7399', width: 0.75}});
    txt(s, 'CONSULTOR TRIBUTÁRIO', {x: 1.0, y: 4.25, w: 3.2, h: 0.3, fontSize: 12, bold: true, color: C.laranja, charSpacing: 1.5});
    txt(s, D.consultor.nome, {x: 1.0, y: 4.65, w: 3.3, h: 0.7, fontSize: 28, bold: true, color: C.branco, fit: 'shrink'});
    s.addImage({data: IMG.email, x: 4.3, y: 4.3, w: 0.32, h: 0.32});
    txt(s, D.consultor.email, {x: 4.8, y: 4.25, w: 4.1, h: 0.42, fontSize: 16, color: C.branco, valign: 'middle'});
    s.addImage({data: IMG.fone, x: 4.3, y: 5.05, w: 0.32, h: 0.32});
    txt(s, D.consultor.fone, {x: 4.8, y: 5.0, w: 4.1, h: 0.42, fontSize: 16, color: C.branco, valign: 'middle'});
    txt(s, D.consultor.site, {x: 0.6, y: 6.55, w: 5.0, h: 0.35, fontSize: 13, bold: true, color: C.claro});
    txt(s, rodape, {x: 0.6, y: 7.03, w: 10.5, h: 0.3, fontSize: 10.5, bold: true, color: C.claro});
  }
  roteiro.push({k: 'CONTATO', t: 'Fale com a Tax Advice — ' + D.consultor.nome});
  pres.__roteiro = roteiro;
  return pres;
}


