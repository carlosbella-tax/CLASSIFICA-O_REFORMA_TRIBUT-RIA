  /* =====================================================================
     V52 — PIS/COFINS na importação e CST de entrada (Informativo Tax Advice)
     Lei 10.865/2004 · Leis 10.637/2002 e 10.833/2003 · Lei 14.973/2024
     ===================================================================== */
  const CFOP_IMP = {
    '3101': {dest: 'Industrialização', paga: 'Sim', cred: 'Sim, pelo valor pago (sem o adicional)', tipo: 'credito'},
    '3102': {dest: 'Comercialização', paga: 'Sim', cred: 'Sim, pelo valor pago (sem o adicional)', tipo: 'credito'},
    '3126': {dest: 'Uso em serviço sujeito ao ISS', paga: 'Sim', cred: 'Sim, se for insumo do serviço', tipo: 'credito'},
    '3127': {dest: 'Industrialização sob drawback', paga: 'Suspenso', cred: 'Não há crédito, porque não houve pagamento', tipo: 'suspenso'},
    '3551': {dest: 'Ativo imobilizado', paga: 'Sim', cred: 'Sim, mas sobre a depreciação ou de forma acelerada, conforme o bem', tipo: 'imobilizado'},
    '3556': {dest: 'Uso e consumo', paga: 'Sim', cred: 'Em regra, não', tipo: 'uso'},
    '3651': {dest: 'Combustíveis / lubrificantes', paga: 'Sim, alíquotas específicas', cred: 'Depende da destinação', tipo: 'depende'},
    '3652': {dest: 'Combustíveis / lubrificantes', paga: 'Sim, alíquotas específicas', cred: 'Depende da destinação', tipo: 'depende'},
    '3653': {dest: 'Combustíveis / lubrificantes', paga: 'Sim, alíquotas específicas', cred: 'Depende da destinação', tipo: 'depende'},
    '3930': {dest: 'Admissão temporária', paga: 'Suspenso ou proporcional', cred: 'Restrito', tipo: 'suspenso'},
    '3201': {dest: 'Retorno de produto exportado', paga: 'Em regra, não incide', cred: 'Não se aplica', tipo: 'naoincide'},
    '3202': {dest: 'Retorno de produto exportado', paga: 'Em regra, não incide', cred: 'Não se aplica', tipo: 'naoincide'},
    '3949': {dest: 'Outras entradas', paga: 'Depende do caso', cred: 'Depende do caso', tipo: 'depende'}
  };
  const CST_ENT_CRED = new Set(['50', '51', '52', '53', '54', '55', '56']), CST_ENT_SEM = new Set(['70', '71', '72', '73', '74', '75']), CST_ENT_OUT = new Set(['98', '99']);
  const ALQ_PIS_IMP = 2.10, ALQ_COF_IMP = 9.65, ADIC_COF_2026 = 0.60;
  const regimeLucroReal = () => { const t = (textoSel('regimeEmpresa') || '').toLowerCase(); return !t || /real/.test(t) ? (/real/.test(t) ? 'real' : 'nao_informado') : 'cumulativo'; };
  function ajustarImportacao(row){
    const r = row.__src; if (!r) return row;
    const cfx = String(row.cfop_xml || r.cfop_xml || r.cfop || '').trim(), d1 = cfx.charAt(0);
    const entrada = d1 === '1' || d1 === '2' || d1 === '3', imp = d1 === '3';
    if (!entrada) return row;
    const cstP = String(row.cst_pis || '').padStart(2, '0'), cstC = String(row.cst_cofins || '').padStart(2, '0');
    // CST de entrada (EFD-Contribuições): 50–56 com crédito, 70–75 sem crédito, 98/99 outras; 01–49 são de saída
    const valCst = c => {
      if (!c || c === '00') return 'NÃO VALIDADO (sem CST no XML)';
      if (Number(c) < 50) return 'NÃO VALIDADO (CST ' + c + ' é de saída; na entrada use 50 a 56 com crédito, 70 a 75 sem crédito, ou 98/99)';
      const reg = CFOP_IMP[cfx];
      if (CST_ENT_CRED.has(c) && reg && reg.tipo === 'uso') return 'NÃO VALIDADO (CST ' + c + ' é de crédito, mas uso e consumo em regra não gera crédito)';
      if (CST_ENT_CRED.has(c) && reg && (reg.tipo === 'suspenso' || reg.tipo === 'naoincide')) return 'NÃO VALIDADO (CST ' + c + ' é de crédito, mas no CFOP ' + cfx + ' não há pagamento)';
      if (CST_ENT_SEM.has(c) && reg && (reg.tipo === 'credito' || reg.tipo === 'imobilizado') && regimeLucroReal() !== 'cumulativo')
        return 'NÃO VALIDADO (CST ' + c + ' é sem crédito, mas o CFOP ' + cfx + ' dá direito a crédito no Lucro Real)';
      return 'VALIDADO';
    };
    const x = {};
    const basePis = num(row.base_pis_xml), baseCof = num(row.base_cofins_xml), vPis = num(row.valor_pis_xml), vCof = num(row.valor_cofins_xml);
    const aPis = num(row.aliquota_pis), aCof = num(row.aliquota_cofins);
    let extra = {};
    if (imp){
      const reg = CFOP_IMP[cfx] || {dest: 'Importação (CFOP ' + cfx + ')', paga: 'Depende do caso', cred: 'Depende do caso', tipo: 'depende'};
      const vAdu = valorGrupo(r, 'II', 'vBC') || num(r.valor_item);
      const suspenso = reg.tipo === 'suspenso' || reg.tipo === 'naoincide';
      const baseOk = (b, v) => suspenso ? (b <= 0.02 && v <= 0.02) : Math.abs(arred(b) - arred(vAdu)) <= 0.0201;
      const msgBase = suspenso ? 'NÃO VALIDADO (CFOP ' + cfx + ': ' + reg.paga.toLowerCase() + ' — não deveria haver base/valor)' : 'NÃO VALIDADO (na importação, a base é o valor aduaneiro: ' + brl(vAdu) + ')';
      const tipoAliq = (aPis === 0 && aCof === 0) ? 'Sem alíquota no XML'
        : Math.abs(aPis - ALQ_PIS_IMP) <= 0.001 && Math.abs(aCof - ALQ_COF_IMP) <= 0.001 ? 'Geral (PIS 2,10% · COFINS 9,65%)'
        : Math.abs(aPis - ALQ_PIS_IMP) <= 0.001 && Math.abs(aCof - (ALQ_COF_IMP + ADIC_COF_2026)) <= 0.001 ? 'Geral com adicional de 0,6% (COFINS 10,25%)'
        : 'Diferenciada pelo NCM (conferir art. 8º da Lei 10.865/2004)';
      const adicional = aCof > ALQ_COF_IMP + 0.001 && Math.abs(aCof - (ALQ_COF_IMP + ADIC_COF_2026)) <= 0.001 ? arred(baseCof * ADIC_COF_2026 / 100) : 0;
      const regime = regimeLucroReal();
      let crP = 0, crC = 0, valCred;
      if (regime === 'cumulativo'){ valCred = 'VALIDADO (regime cumulativo: paga, sem crédito — o valor integra o custo)'; }
      else if (reg.tipo === 'credito' || reg.tipo === 'imobilizado' || reg.tipo === 'depende'){
        crP = vPis; crC = arred(vCof - adicional);
        valCred = reg.tipo === 'imobilizado' ? 'VALIDADO (crédito sobre a depreciação ou acelerado, conforme o bem)'
          : reg.tipo === 'depende' ? 'VALIDADO (crédito depende da destinação — confirmar)' : 'VALIDADO (crédito pelo valor pago' + (adicional ? ', sem o adicional de ' + brl(adicional) : '') + ')';
      } else if (reg.tipo === 'uso'){
        valCred = (vPis + vCof) > 0.005 ? 'NÃO VALIDADO (uso e consumo não gera crédito: ' + brl(vPis + vCof) + ' pagos sem crédito. Se for revenda use 3102, insumo 3101, imobilizado 3551)' : 'VALIDADO (uso e consumo, sem crédito)';
      } else {
        valCred = (vPis + vCof) > 0.005 ? 'NÃO VALIDADO (CFOP ' + cfx + ': ' + reg.paga.toLowerCase() + ', mas o XML traz PIS/COFINS)' : 'VALIDADO (' + reg.paga.toLowerCase() + ', sem crédito)';
      }
      x.validacao_base_pis = baseOk(basePis, vPis) ? 'VALIDADO (valor aduaneiro)' : msgBase;
      x.base_correta_pis = baseOk(basePis, vPis) ? 0 : (suspenso ? 0 : vAdu);
      x.validacao_base_cofins = baseOk(baseCof, vCof) ? 'VALIDADO (valor aduaneiro)' : msgBase;
      x.base_correta_cofins = baseOk(baseCof, vCof) ? 0 : (suspenso ? 0 : vAdu);
      extra = {importacao_destinacao_cfop: reg.dest, importacao_paga_pis_cofins: reg.paga, importacao_credito_lucro_real: reg.cred,
        valor_aduaneiro: vAdu, aliquota_importacao: tipoAliq, valor_adicional_cofins: adicional,
        valor_credito_pis_permitido: crP, valor_credito_cofins_permitido: crC, validacao_credito_cfop: valCred};
    }
    const out = {};
    for (const k of Object.keys(row)){
      out[k] = k in x ? x[k] : row[k];
      if (k === 'cst_pis') out.validacao_cst_entrada_pis = valCst(cstP);
      if (k === 'cst_cofins') out.validacao_cst_entrada_cofins = valCst(cstC);
    }
    Object.assign(out, extra);
    Object.defineProperty(out, '__src', {value: r, configurable: true, writable: true});
    return out;
  }
  const linhasPisV51 = window.linhasPisCofins;
  window.linhasPisCofins = () => linhasPisV51().map(ajustarImportacao);
  Object.assign(PAR_CORRETO, {});

  /* ---------- aba OBSERVAÇÕES (regras) ---------- */
  (function(){
    const ref = document.querySelector('.tab[data-tab="apresentacao"]') || document.querySelector('.tab[data-tab="dashboard"]');
    const t = document.createElement('button'); t.className = 'tab'; t.dataset.tab = 'observacoes'; t.textContent = 'Observações';
    ref.insertAdjacentElement('afterend', t);
    const linhaCfop = (c, o) => '<tr><td><b>' + c + '</b></td><td>' + o.dest + '</td><td>' + o.paga + '</td><td>' + o.cred + '</td></tr>';
    const sec = document.createElement('section'); sec.id = 'observacoes'; sec.className = 'panel';
    sec.innerHTML = '<div class="card v52-obs">'
      + '<h2>Observações — regras aplicadas nas validações</h2><p class="subtle">Base: Informativo Tax Advice “PIS/COFINS na importação: base de cálculo e direito a crédito por CFOP”.</p>'
      + '<h3>1. CST de PIS/COFINS na entrada</h3><ul>'
      + '<li><b>Com direito a crédito:</b> use a CST <b>50, 51, 52, 53, 54, 55 ou 56</b>, conforme a receita a que o crédito se vincula.</li>'
      + '<li><b>Sem direito a crédito:</b> CST <b>70 a 75</b>. <b>Outras situações:</b> CST <b>98 ou 99</b>.</li>'
      + '<li>A <b>CST 01</b> (e as demais de 01 a 49) é exclusiva de saídas e <b>não serve para entrada</b>. Notas com CFOP de entrada (1xxx, 2xxx, 3xxx) e CST de saída ficam <span class="v52-nv">NÃO VALIDADO</span> nas colunas validacao_cst_entrada_pis / validacao_cst_entrada_cofins.</li>'
      + '<li><b>Material de uso e consumo não gera crédito.</b> Isso reforça o ponto do <b>CFOP 3556</b>: se os itens forem mercadoria para revenda, o CFOP seria <b>3102</b>; se forem insumo para industrialização, <b>3101</b>; se forem ativo imobilizado, <b>3551</b> — e nesse caso o crédito segue regras próprias, sobre a depreciação ou de forma acelerada, conforme o bem.</li></ul>'
      + '<h3>2. O que depende do CFOP: o crédito</h3><div class="v33-scroll"><table class="dash-detail-table v52-tab"><thead><tr><th>CFOP</th><th>Destinação</th><th>Paga PIS/COFINS-Imp.?</th><th>Crédito (Lucro Real)</th></tr></thead><tbody>'
      + ['3101', '3102', '3126', '3127', '3551', '3556'].map(c => linhaCfop(c, CFOP_IMP[c])).join('')
      + linhaCfop('3651 a 3653', CFOP_IMP['3651']) + linhaCfop('3930', CFOP_IMP['3930']) + linhaCfop('3201, 3202', CFOP_IMP['3201']) + linhaCfop('3949', CFOP_IMP['3949'])
      + '</tbody></table></div>'
      + '<h3>3. Base de cálculo e alíquotas do PIS/COFINS-Importação</h3><ul>'
      + '<li>Na importação de bens, a base é sempre o <b>valor aduaneiro</b> (art. 7º, I, da Lei 10.865/2004), em todos os CFOPs de importação tributada. Não entram na base o II, o IPI, o ICMS nem as próprias contribuições. O sistema usa a base do II do XML (valor aduaneiro); sem ela, o valor do produto.</li>'
      + '<li>Alíquotas gerais: <b>PIS 2,10%</b> e <b>COFINS 9,65%</b>. Alguns NCMs têm o <b>adicional de 0,6%</b> da COFINS-Importação em 2026 (Lei 14.973/2024), totalizando 10,25%. Há alíquotas diferenciadas por produto (combustíveis, farmacêuticos, perfumaria, máquinas e veículos, autopeças, pneus).</li>'
      + '<li>Regimes especiais (drawback suspensão, admissão temporária, entreposto, Recof, Reidi, ZFM) e isenções do art. 9º afastam ou reduzem o pagamento. Retorno de produto exportado, em regra, não é fato gerador.</li>'
      + '<li>Importação de serviços: a base é o valor remetido ao exterior, antes do IR, acrescido do ISS e das próprias contribuições (art. 7º, II).</li></ul>'
      + '<h3>4. Crédito no regime não cumulativo (Lucro Real)</h3><ul>'
      + '<li>O crédito corresponde às contribuições <b>efetivamente pagas</b> na importação (art. 15, § 3º), e não a 1,65%/7,6% sobre o custo.</li>'
      + '<li>O <b>adicional da COFINS-Importação não gera crédito</b> (art. 15, § 1º-A): o crédito de COFINS fica limitado a 9,65%. O sistema mostra o adicional em valor_adicional_cofins e o crédito permitido em valor_credito_pis_permitido / valor_credito_cofins_permitido.</li>'
      + '<li>Frete nacional e armazenagem pagos no Brasil a pessoa jurídica geram crédito à parte, a 1,65% e 7,6%. Honorários de despachante são ponto controverso.</li>'
      + '<li><b>Lucro Presumido</b> (cumulativo): o PIS/COFINS-Importação é pago, mas não gera crédito; o valor integra o custo.</li></ul>'
      + '<h3>5. Escrituração</h3><ul><li>EFD-Contribuições: crédito de importação com o <b>tipo de crédito 108</b>, separado dos créditos do mercado interno.</li><li>Manter a DUIMP, o comprovante de pagamento e a memória de cálculo por adição e por item.</li></ul>'
      + '<h3>6. Transição para a CBS</h3><p>A partir de 2027, o PIS/COFINS-Importação deixa de existir e o crédito passa a ser o da CBS paga na importação. A base da CBS na importação de bens é mais ampla: valor aduaneiro + II + Imposto Seletivo + taxa Siscomex + AFRMM, sem IPI, ICMS e ISS (LC 214/2025, art. 69). Em 2026, IBS e CBS são destacados com alíquotas de teste (0,1% e 0,9%).</p>'
      + '<h3>Base legal</h3><p class="subtle">Lei nº 10.865/2004 (arts. 7º, 8º, 9º e 15) · Leis nº 10.637/2002 e 10.833/2003 (art. 3º) · Lei nº 14.973/2024 · Lei Complementar nº 214/2025 (arts. 69, 343 e 346) · Guia Prático da EFD-Contribuições, Tabela 4.3.6.</p>'
      + '<h3>Como aparece na aba Base de PIS/COFINS</h3><ul><li><b>validacao_cst_entrada_pis / _cofins</b>: conferência da CST em notas com CFOP de entrada.</li><li>Em CFOP de importação (3xxx): base validada pelo <b>valor aduaneiro</b>, e as colunas importacao_destinacao_cfop, importacao_paga_pis_cofins, importacao_credito_lucro_real, valor_aduaneiro, aliquota_importacao, valor_adicional_cofins, valor_credito_pis_permitido, valor_credito_cofins_permitido e <b>validacao_credito_cfop</b>.</li><li>O direito a crédito considera o <b>Regime tributário</b> informado na primeira tela.</li></ul>'
      + '</div><div class="v51-rodape">CARLOS BELLA - ESPECIALISTA TRIBUTÁRIO - 11 9949-7347</div>';
    (document.getElementById('apresentacao') || $('dashboard')).insertAdjacentElement('afterend', sec);
    t.onclick = () => { document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); document.querySelectorAll('.panel').forEach(x => x.classList.remove('active')); t.classList.add('active'); sec.classList.add('active'); };
  })();

