/* =====================================================================
   V14 — Carga ilimitada de XML (arquivos + pasta + arrastar pastas),
   aba PROCESSAR que inicia o processamento, paginação para exibir
   TODOS os itens, correções de cálculo e dashboard de validações.
   ===================================================================== */
(function(){
  const V14 = { keys: new Set(), naoXml: 0, pendente: false, cancelar: false, rodando: false, duplicadas: 0, t0: 0 };
  const fmtInt = n => new Intl.NumberFormat('pt-BR').format(n || 0);
  const tamanho = b => b > 1048576 ? brNumero(b / 1048576, 1) + ' MB' : brNumero(b / 1024, 1) + ' KB';

  /* ---------- desempenho: formatadores reutilizados e cache por item ---------- */
  function memo(fn){
    const cache = new WeakMap;
    return function(r){
      const chave = tipoOperacao(r) + '|' + (r.tipo_operacao || '');
      const c = cache.get(r);
      if (c && c.k === chave) return c.v;
      const v = fn(r); cache.set(r, {k: chave, v}); return v;
    };
  }

  /* ---------- correções de cálculo ---------- */
  // V13: "IMPOSTO" contém "ST", o que zerava todo o ICMS próprio. Agora o filtro é pela tag final.
  const ENT = new WeakMap;
  function ent(row){
    let e = ENT.get(row);
    if (!e){ e = Object.keys(row || {}).map(k => [k.toUpperCase(), row[k]]); ENT.set(row, e); }
    return e;
  }
  const aliasGrupo = g => g === 'CBS' ? ['_CBS', '_IBSCBS'] : g === 'IBS' ? ['_IBS', '_IBSCBS'] : ['_' + g];
  window.valorIcms = function(row, tag){
    const fim = '_' + tag.toUpperCase(); let s = 0;
    for (const [u, v] of ent(row)) if (u.endsWith(fim) && u.includes('_ICMS_')) s += num(v);
    return s;
  };
  window.valorSt = window.valorIcms;
  window.valorGrupo = function(row, grupo, tag){
    const al = aliasGrupo(grupo.toUpperCase()), fim = '_' + tag.toUpperCase(); let s = 0;
    for (const [u, v] of ent(row)) if (u.endsWith(fim) && al.some(a => u.includes(a))) s += num(v);
    return s;
  };
  window.campoGrupo = function(row, grupo, sufixo){
    const al = aliasGrupo(grupo.toUpperCase()), fim = '_' + sufixo.toUpperCase();
    for (const [u, v] of ent(row)) if (u.endsWith(fim) && al.some(a => u.includes(a))) return v;
    return '';
  };
  window.chavesTributarias = r => ent(r).map(x => x[0]);
  // V13: a base esperada de PIS/COFINS usava a função valorIcms em vez do valor → sempre "INCORRETO".
  // V23: linha fiscal única que alimenta as abas ICMS e Base de PIS/COFINS
  const SEM_BASE_ICMS = new Set(['30', '40', '41', '50', '60', '101', '102', '103', '201', '202', '203', '300', '400', '500']);
  const SEM_BASE_PC = new Set(['03', '04', '05', '06', '07', '08', '09']);
  const ok01 = (a, b) => Math.abs(arred(a) - arred(b)) <= 0.0201;
  // V38: base de PIS/COFINS — CST não tributado (04 a 09, 70 a 75) ou por quantidade (03) não é calculado; demais: valor da operação − ICMS destacado, aceitando arredondamento de até R$ 0,10
  const TOL_PC = 0.0201;   // V43: margem de R$ 0,02
  // V40: CST diferente de 01/02 (tributadas pela alíquota básica/diferenciada) e sem base no XML → VALIDADO (não há base de PIS/COFINS)
  const CST_BASE_PC = new Set(['01', '02']);
  function basePcOk(cst, base, esp, alt){
    const c = String(cst || '').trim().padStart(2, '0');
    if (SEM_TRIB_PC.has(c) || c === '03') return true;
    if (!CST_BASE_PC.has(c) && arred(base) <= 0.005) return true;
    return Math.abs(arred(base) - esp) <= TOL_PC || Math.abs(arred(base) - alt) <= TOL_PC;
  }
  // V29: CST que não gera imposto → o XML deve vir sem base/valor; CST tributado → o XML deve trazer valor
  // V31: classificação conforme as planilhas CST_DE_ICMS, CST_PIS_E_COFINS e CST_DE_IPI
  const CST_BASE_TRIB = new Set(['00', '10', '20', '51', '70', '90']);
  const CST_TRIB_ICMS = new Set(['00', '10', '20', '70']), CST_TRIB_PC = new Set(['01', '02', '03', '50', '51', '52', '53', '54', '55', '56']), SEM_TRIB_PC = new Set(['04', '05', '06', '07', '08', '09', '70', '71', '72', '73', '74', '75']);
  const CST_TRIB_IPI = new Set(['00', '50']), SEM_TRIB_IPI = new Set(['01', '02', '03', '04', '05', '51', '52', '53', '54', '55']);
  const CST_TRIB_IBS = new Set(['000']), SEM_TRIB_IBS = new Set(['400', '410', '550', '830']);
  function validaCst(cst, trib, semTrib, valores){
    const c = String(cst || '').trim();
    if (!c) return valores ? 'INCORRETO (sem CST no XML)' : 'VALIDADO';
    if (semTrib.has(c)) return 'VALIDADO';   // V31: CST não tributado — não calcula, sempre VALIDADO
    if (trib.has(c)) return valores > 0.005 ? 'VALIDADO' : 'INCORRETO (CST ' + c + ' tributado, mas o XML não traz valor do imposto)';
    return 'VALIDADO';
  }
  window.linhaFiscal = function(r){
    const baseIcms = valorIcms(r, 'vBC'), aliqIcms = valorIcms(r, 'pICMS'), valorIcmsXml = valorIcms(r, 'vICMS'),
      basePis = valorGrupo(r, 'PIS', 'vBC'), aliqPis = valorGrupo(r, 'PIS', 'pPIS'), valorPis = valorGrupo(r, 'PIS', 'vPIS'),
      baseCofins = valorGrupo(r, 'COFINS', 'vBC'), aliqCofins = valorGrupo(r, 'COFINS', 'pCOFINS'), valorCofins = valorGrupo(r, 'COFINS', 'vCOFINS'),
      prod = num(r.valor_item), cstIcms = cstGrupo(r, 'ICMS'), cstPis = cstGrupo(r, 'PIS'), cstCofins = cstGrupo(r, 'COFINS'),
      // ICMS: Base × Alíquota = Valor (no diferimento, CST 51, compara com o ICMS da operação)
      temOp = Object.keys(r).some(k => /_ICMS_.*_vICMSOp$/.test(k)),
      icmsComparado = temOp ? valorIcms(r, 'vICMSOp') : valorIcmsXml,
      icmsCalculado = SEM_BASE_ICMS.has(String(cstIcms)) ? 0 : arred(baseIcms * aliqIcms / 100), difIcms = arred(icmsComparado - icmsCalculado),
      // Base de ICMS: (produto + frete + seguro + outras − desconto) × (1 − % redução)
      bruto = prod + num(campoGrupo(r, 'prod', 'vFrete')) + num(campoGrupo(r, 'prod', 'vSeg')) + num(campoGrupo(r, 'prod', 'vOutro')) - num(campoGrupo(r, 'prod', 'vDesc')),
      fator = 1 - valorIcms(r, 'pRedBC') / 100, semBase = SEM_BASE_ICMS.has(String(cstIcms)),
      baseIcmsCalc = semBase ? 0 : arred(bruto * fator), baseComIpi = arred((bruto + valorGrupo(r, 'IPI', 'vIPI')) * fator),
      // PIS/COFINS: base = valor total dos produtos − ICMS destacado; valor = base × alíquota
      // V38: Lei 14.592/2023 (art. 1º, § 2º das Leis 10.637 e 10.833) — base = valor da operação − ICMS destacado na nota
      basePisEsp = SEM_BASE_PC.has(String(cstPis)) ? 0 : arred(bruto - valorIcmsXml),
      baseCofEsp = SEM_BASE_PC.has(String(cstCofins)) ? 0 : arred(bruto - valorIcmsXml),
      baseAltPC = arred(prod - valorIcmsXml),
      pisCalc = SEM_BASE_PC.has(String(cstPis)) && String(cstPis) !== '03' ? 0 : String(cstPis) === '03' ? arred(valorGrupo(r, 'PIS', 'qBCProd') * valorGrupo(r, 'PIS', 'vAliqProd')) : arred(basePis * aliqPis / 100),
      cofCalc = SEM_BASE_PC.has(String(cstCofins)) && String(cstCofins) !== '03' ? 0 : String(cstCofins) === '03' ? arred(valorGrupo(r, 'COFINS', 'qBCProd') * valorGrupo(r, 'COFINS', 'vAliqProd')) : arred(baseCofins * aliqCofins / 100);
    const semIcms = SEM_BASE_ICMS.has(String(cstIcms)), tribSemIcms = CST_TRIB_ICMS.has(String(cstIcms)) && icmsComparado <= 0.005 && arred(baseIcms * aliqIcms / 100) > 0.0201,
      okIcms = semIcms || (!tribSemIcms && Math.abs(difIcms) <= 0.0201),
      semP = SEM_TRIB_PC.has(String(cstPis)), semC = SEM_TRIB_PC.has(String(cstCofins)),
      okBP = basePcOk(cstPis, basePis, basePisEsp, baseAltPC), okVP = semP || (!(CST_TRIB_PC.has(String(cstPis)) && valorPis <= 0.005 && pisCalc > 0.0201) && ok01(valorPis, pisCalc)),
      okBC = basePcOk(cstCofins, baseCofins, baseCofEsp, baseAltPC), okVC = semC || (!(CST_TRIB_PC.has(String(cstCofins)) && valorCofins <= 0.005 && cofCalc > 0.0201) && ok01(valorCofins, cofCalc));
    let valBaseIcms;
    // V35: base zerada no XML → VALIDADO se a CST não é tributada; INCORRETO se a CST é tributada (00, 10, 20, 51, 70, 90)
    // V37: sem base no XML → só CST 00 fica NÃO VALIDADO; qualquer outra CST fica VALIDADO
    if (baseIcms <= 0.005 && String(cstIcms) !== '00') valBaseIcms = 'VALIDADO';
    else if (baseIcms <= 0.005) valBaseIcms = 'NÃO VALIDADO (CST ' + cstIcms + ' tributado, sem base de ICMS no XML)';
    else if (semIcms || ok01(baseIcms, baseIcmsCalc)) valBaseIcms = 'VALIDADO';
    else if (!semBase && valorGrupo(r, 'IPI', 'vIPI') && ok01(baseIcms, baseComIpi)) valBaseIcms = 'VALIDADO (base inclui o IPI)';
    else valBaseIcms = 'NÃO VALIDADO';
    return {
      tipo_operacao: tipoOperacao(r), data_emissao: r.data_emissao || '', chave_nota_fiscal: r.chave_documento || '',
      numero_nota_fiscal: r.numero_documento || '', cnpj_emitente: r.emitente_cnpj_cpf || '', nome_emitente: r.emitente_razao_social || '',
      nome_destinatario: r.destinatario_razao_social || '', cnpj_destinatario: r.destinatario_cnpj_cpf || '',
      numero_item: r.numero_item || '', codigo_item: r.codigo_item || '', descricao_item: r.descricao_item || '', ncm: r.ncm || '',
      cfop: r.cfop || '', descricao_cfop: r.descricao_cfop || '', cfop_xml: r.cfop_xml || r.cfop || '', valor_total_produtos: prod,
      base_icms_xml: baseIcms, cst_icms: cstIcms, descricao_cst_icms: descCstIcms(cstIcms), aliquota_icms: aliqIcms, valor_icms_xml: valorIcmsXml,
      valor_icms_calculado: icmsCalculado, valor_diferenca_icms: difIcms,
      base_pis_esperada: basePisEsp, base_pis_xml: basePis, cst_pis: cstPis, descricao_cst_pis: descCstPc(cstPis), aliquota_pis: aliqPis, valor_pis_xml: valorPis, valor_pis_calculado: pisCalc,
      base_cofins_esperada: baseCofEsp, base_cofins_xml: baseCofins, cst_cofins: cstCofins, descricao_cst_cofins: descCstPc(cstCofins), aliquota_cofins: aliqCofins, valor_cofins_xml: valorCofins, valor_cofins_calculado: cofCalc,
      validacao_cst_icms: validaCst(cstIcms, CST_TRIB_ICMS, SEM_BASE_ICMS, icmsComparado),
      validacao_icms: (okIcms ? 'VALIDADO' : 'INCORRETO') + (temOp && !semIcms ? ' (diferimento: comparado com o ICMS da operação ' + brl(icmsComparado) + ')' : ''),
      valor_correto_icms: okIcms ? 0 : arred(baseIcms * aliqIcms / 100),
      base_icms_calculada: baseIcmsCalc, validacao_base_icms: valBaseIcms,
      base_correta_icms: /^(INCORRETO|NÃO VALIDADO)/.test(valBaseIcms) ? (baseIcmsCalc || arred(bruto * fator)) : 0,
      validacao_cst_pis: validaCst(cstPis, CST_TRIB_PC, SEM_TRIB_PC, valorPis),
      validacao_base_pis: okBP ? 'VALIDADO' : 'NÃO VALIDADO' + (basePis <= 0.005 ? ' (sem base de PIS no XML)' : ' (base deve ser o valor da operação − ICMS destacado)'),
      base_correta_pis: okBP ? 0 : basePisEsp,
      validacao_valor_pis: okVP ? 'VALIDADO' : 'INCORRETO',
      valor_correto_pis: okVP ? 0 : pisCalc,
      validacao_cst_cofins: validaCst(cstCofins, CST_TRIB_PC, SEM_TRIB_PC, valorCofins),
      validacao_base_cofins: okBC ? 'VALIDADO' : 'NÃO VALIDADO' + (baseCofins <= 0.005 ? ' (sem base de COFINS no XML)' : ' (base deve ser o valor da operação − ICMS destacado)'),
      base_correta_cofins: okBC ? 0 : baseCofEsp,
      validacao_valor_cofins: okVC ? 'VALIDADO' : 'INCORRETO',
      valor_correto_cofins: okVC ? 0 : cofCalc
    };
  };
  const SO_PIS = ['validacao_cst_pis', 'validacao_cst_cofins', 'base_pis_esperada', 'valor_pis_calculado', 'base_cofins_esperada', 'valor_cofins_calculado', 'validacao_base_pis', 'validacao_valor_pis', 'validacao_base_cofins', 'validacao_valor_cofins', 'base_correta_pis', 'valor_correto_pis', 'base_correta_cofins', 'valor_correto_cofins'];
  const SO_ICMS = ['validacao_cst_icms', 'valor_icms_calculado', 'valor_diferenca_icms', 'validacao_icms', 'base_icms_calculada', 'validacao_base_icms', 'valor_correto_icms', 'base_correta_icms'];
  const sem = (o, fora) => { const x = {}; for (const k in o) if (!fora.includes(k)) x[k] = o[k]; if (o.__src) Object.defineProperty(x, '__src', {value: o.__src, configurable: true, writable: true}); return x; };
  window.linhasIcms = () => state.items.filter(temIcmsFiscal).map(r => sem(linhaFiscal(r), SO_PIS.concat(['valor_icms_calculado', 'valor_diferenca_icms', 'validacao_cst_icms', 'base_pis_xml', 'cst_pis', 'descricao_cst_pis', 'aliquota_pis', 'valor_pis_xml', 'base_cofins_xml', 'cst_cofins', 'descricao_cst_cofins', 'aliquota_cofins', 'valor_cofins_xml'])));
  window.linhasPisCofins = () => state.items.filter(r => temGrupoFiscal(r, 'PIS') || temGrupoFiscal(r, 'COFINS')).map(r => sem(linhaFiscal(r), SO_ICMS.concat(['valor_pis_calculado', 'base_cofins_esperada', 'base_pis_esperada', 'valor_cofins_calculado'])));
  window.linhaIcmsSt = function(r){
    const base = valorSt(r, 'vBCST'), aliq = valorSt(r, 'pICMSST'), valor = valorSt(r, 'vICMSST'),
      proprio = valorIcms(r, 'vICMS'), esperado = Math.max(0, base * aliq / 100 - proprio),
      cst = cstGrupo(r, 'ICMS'), simples = ['201', '202', '203'].includes(cst);
    return {
      tipo_operacao: tipoOperacao(r), chave_documento_fiscal: r.chave_documento || '', numero_documento_fiscal: r.numero_documento || '',
      data_emissao: r.data_emissao || '', numero_item: r.numero_item || '', codigo_item: r.codigo_item || '', descricao_item: r.descricao_item || '',
      ncm: r.ncm || '', cest: campoGrupo(r, 'prod', 'CEST') || '', cfop: r.cfop || '', cst_icms: cst, descricao_cst_icms: descCstIcms(cst),
      valor_total_produtos: num(r.valor_item), mva_st: valorSt(r, 'pMVAST'), reducao_base_st: valorSt(r, 'pRedBCST'),
      base_icms_st_xml: base, aliquota_icms_st: aliq, icms_proprio_xml: proprio, valor_icms_st_xml: valor,
      base_fcp_st: valorSt(r, 'vBCFCPST'), aliquota_fcp_st: valorSt(r, 'pFCPST'), valor_fcp_st: valorSt(r, 'vFCPST'),
      base_st_retido: valorSt(r, 'vBCSTRet'), valor_st_retido: valorSt(r, 'vICMSSTRet')
    };
  };
  window.linhaFiscal = memo(window.linhaFiscal);
  window.linhaIcmsSt = memo(window.linhaIcmsSt);
  const linhaIpiM = memo(window.linhaIpi);
  const CFOP_ST = new Set(["1405", "2405", "1401", "1403", "1406", "1407", "1408", "1409", "1410", "1411", "1414", "1415", "2401", "2403", "2406", "2407", "2408", "2409", "2410", "2411", "2414", "2415", "5401", "5402", "5403", "5405", "5408", "5409", "5410", "5411", "5412", "5413", "5414", "5415", "6401", "6402", "6403", "6405", "6408", "6409", "6410", "6411", "6412", "6413", "6414", "6415"]);   // V30: planilha CFOP_DE_SUBSTITUIÇÃO_TRIBUTARIA.xlsx
  const ehCfopSt = r => CFOP_ST.has(String(r.cfop || '').trim());
  window.linhasIcmsSt = () => state.items.filter(ehCfopSt).map(linhaIcmsSt);
  const okV = (a, b) => Math.abs(arred(a) - arred(b)) <= 0.0201;
  let linhaIbsCbs = function(r){
    const base = valorGrupo(r, 'IBS', 'vBC'),
      pUf = num(campoGrupo(r, 'IBS', 'pIBSUF')), vUf = valorGrupo(r, 'IBS', 'vIBSUF'),
      pMun = num(campoGrupo(r, 'IBS', 'pIBSMun')), vMun = valorGrupo(r, 'IBS', 'vIBSMun'),
      vIbs = valorGrupo(r, 'IBS', 'vIBS') || arred(vUf + vMun),
      pCbs = num(campoGrupo(r, 'CBS', 'pCBS')), vCbs = valorGrupo(r, 'CBS', 'vCBS'),
      temRed = Object.keys(r).some(k => k.includes('_gRed_')), cstI = String(campoGrupo(r, 'IBS', 'CST') || '').trim(), semI = SEM_TRIB_IBS.has(cstI),
      ibsEsp = semI ? 0 : arred(base * (pUf + pMun) / 100), cbsEsp = semI ? 0 : arred(base * pCbs / 100),
      tribI = CST_TRIB_IBS.has(cstI),
      okIbs = semI || (!(tribI && vIbs <= 0.005 && ibsEsp > 0.0201) && ((temRed) || okV(vIbs, ibsEsp))), okCbs = semI || (!(tribI && vCbs <= 0.005 && cbsEsp > 0.0201) && ((temRed) || okV(vCbs, cbsEsp))),
      vIcms = valorIcms(r, 'vICMS'), vPis = valorGrupo(r, 'PIS', 'vPIS'), vCof = valorGrupo(r, 'COFINS', 'vCOFINS'),
      baseCalc = arred(num(r.valor_item) + num(campoGrupo(r, 'prod', 'vFrete')) + num(campoGrupo(r, 'prod', 'vSeg')) + num(campoGrupo(r, 'prod', 'vOutro'))
        - num(campoGrupo(r, 'prod', 'vDesc')) - vPis - vCof - vIcms - valorGrupo(r, 'ICMSUFDest', 'vICMSUFDest') - valorIcms(r, 'vFCP')
        - valorGrupo(r, 'ICMSUFDest', 'vFCPUFDest') - valorIcms(r, 'vICMSMono'));
    return {
      tipo_operacao: tipoOperacao(r), chave_documento_fiscal: r.chave_documento || '', numero_documento_fiscal: r.numero_documento || '',
      data_emissao: r.data_emissao || '', numero_item: r.numero_item || '', codigo_item: r.codigo_item || '', descricao_item: r.descricao_item || '',
      ncm: r.ncm || '', cfop: r.cfop || '', cst_ibs_cbs: cstI, descricao_cst_ibs_cbs: cstI ? (CST_IBS_CBS[cstI.padStart(3, '0')] || 'CST não localizado na tabela') : '', cclasstrib: campoGrupo(r, 'IBS', 'cClassTrib'),
      valor_total_produtos: num(r.valor_item), base_ibs_cbs_calculada: baseCalc, base_ibs_cbs_xml: base,
      aliquota_ibs_uf: pUf, valor_ibs_uf: vUf, aliquota_ibs_mun: pMun, valor_ibs_mun: vMun, valor_ibs_total: vIbs,
      aliquota_cbs: pCbs, valor_cbs: vCbs,
      validacao_cst_ibs_cbs: validaCst(cstI, CST_TRIB_IBS, SEM_TRIB_IBS, vIbs + vCbs),
      validacao_base_ibs_cbs: semI || okV(base, baseCalc) ? 'VALIDADO' : 'INCORRETO',
      base_correta_ibs_cbs: semI || okV(base, baseCalc) ? 0 : baseCalc,
      validacao_ibs: okIbs ? 'VALIDADO' + (temRed && !semI ? ' (alíquota com redução — gRed)' : '') : 'INCORRETO',
      valor_correto_ibs: okIbs ? 0 : ibsEsp,
      validacao_cbs: okCbs ? 'VALIDADO' + (temRed && !semI ? ' (alíquota com redução — gRed)' : '') : 'INCORRETO',
      valor_correto_cbs: okCbs ? 0 : cbsEsp
    };
  }
  linhaIbsCbs = memo(linhaIbsCbs);
  const linhasIbsCbsTab = () => state.items.filter(r => temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS')).map(linhaIbsCbs);

  // Dashboard: alíquota de IBS = IBS UF + IBS Municipal (a tag pIBS não existe no layout).
  window.sumarioFiscal = function(){
    const d = {ICMS: novoResumo(), ST: novoResumo(), IPI: novoResumo(), PIS: novoResumo(), COFINS: novoResumo(), IBSCBS: new Map};
    for (const r of state.items){
      const o = operacao(r);
      acumular(d.ICMS[o], valorIcms(r, 'vBC'), valorIcms(r, 'vICMS'), valorIcms(r, 'pICMS'));
      acumular(d.ST[o], valorSt(r, 'vBCST'), valorSt(r, 'vICMSST'), valorSt(r, 'pICMSST'));
      for (const g of ['IPI', 'PIS', 'COFINS']) acumular(d[g][o], valorGrupo(r, g, 'vBC'), valorGrupo(r, g, 'v' + g), valorGrupo(r, g, 'p' + g));
      const cst = campoGrupo(r, 'IBS', 'CST') || '', classe = campoGrupo(r, 'IBS', 'cClassTrib') || '',
        pIbs = num(campoGrupo(r, 'IBS', 'pIBSUF')) + num(campoGrupo(r, 'IBS', 'pIBSMun')), pCbs = num(campoGrupo(r, 'CBS', 'pCBS')),
        vIbs = valorGrupo(r, 'IBS', 'vIBS'), vCbs = valorGrupo(r, 'CBS', 'vCBS');
      if (!(vIbs || vCbs || cst || classe)) continue;
      const k = [cst, classe, pIbs, pCbs].join('|');
      if (!d.IBSCBS.has(k)) d.IBSCBS.set(k, {cst: cst || 'Sem CST', classe: classe || 'Sem cClassTrib', pIbs, pCbs, ibs: {entradas: 0, saidas: 0}, cbs: {entradas: 0, saidas: 0}, base: {entradas: 0, saidas: 0}, qtd: {entradas: 0, saidas: 0}});
      const x = d.IBSCBS.get(k); x.ibs[o] += vIbs; x.cbs[o] += vCbs; x.base[o] += valorGrupo(r, 'IBS', 'vBC'); x.qtd[o]++;
    }
    return d;
  };

  window.documentosTabela = rows => new Set(rows.map(r => r.chave_nota_fiscal || r.chave_documento_fiscal || r.chave_documento || r.numero_nota_fiscal || r.numero_documento_fiscal || r.arquivo_origem).filter(Boolean)).size;

  /* ---------- paginação: todas as linhas acessíveis ---------- */
  const PAG = {};
  function paginar(tabela, linhas){
    const id = tabela.id, p = PAG[id] || (PAG[id] = {pagina: 0, tamanho: 100});
    const total = linhas.length, tam = p.tamanho, paginas = Math.max(1, Math.ceil(total / tam));
    if (p.pagina >= paginas) p.pagina = paginas - 1;
    const ini = p.pagina * tam, fim = Math.min(total, ini + tam);
    let barra = document.getElementById('pager-' + id);
    if (!barra){
      barra = document.createElement('div'); barra.id = 'pager-' + id; barra.className = 'v14-pager';
      const wrap = tabela.closest('.table-wrap') || tabela; wrap.insertAdjacentElement('afterend', barra);
    }
    barra.innerHTML = total <= 0 ? '' :
      '<button type="button" class="secondary" data-pg="0"' + (p.pagina ? '' : ' disabled') + '>«</button>'
      + '<button type="button" class="secondary" data-pg="' + (p.pagina - 1) + '"' + (p.pagina ? '' : ' disabled') + '>‹ Anterior</button>'
      + '<span>Linhas <b>' + fmtInt(ini + 1) + '–' + fmtInt(fim) + '</b> de <b>' + fmtInt(total) + '</b> · página ' + fmtInt(p.pagina + 1) + ' de ' + fmtInt(paginas) + '</span>'
      + '<button type="button" class="secondary" data-pg="' + (p.pagina + 1) + '"' + (p.pagina < paginas - 1 ? '' : ' disabled') + '>Próxima ›</button>'
      + '<button type="button" class="secondary" data-pg="' + (paginas - 1) + '"' + (p.pagina < paginas - 1 ? '' : ' disabled') + '>»</button>'
      + '<label>Linhas por página <select data-tam>' + [100, 200, 500, 1000, 5000].map(n => '<option' + (n === tam ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>';
    barra.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { p.pagina = +b.dataset.pg; redesenharTabela(id); const w = tabela.closest('.table-wrap'); if (w) w.scrollTop = 0; });
    const sel = barra.querySelector('[data-tam]'); if (sel) sel.onchange = () => { p.tamanho = +sel.value; p.pagina = 0; redesenharTabela(id); };
    return {linhas: linhas.slice(ini, fim), ini, fim, total};
  }
  function redesenharTabela(tableElId){
    if (tableElId === 'table') renderItens();
    else if (tableElId === 'loadedTable') renderCargaXml();
    else renderAba(document.querySelector('.tab.active')?.dataset.tab);
  }
  const PAR_CORRETO = {valor_correto_icms: 'validacao_icms', base_correta_icms: 'validacao_base_icms', base_correta_pis: 'validacao_base_pis', valor_correto_pis: 'validacao_valor_pis',
    base_correta_cofins: 'validacao_base_cofins', valor_correto_cofins: 'validacao_valor_cofins', valor_correto_ipi: 'validacao_ipi', base_correta_ibs_cbs: 'validacao_base_ibs_cbs',
    valor_correto_ibs: 'validacao_ibs', valor_correto_cbs: 'validacao_cbs'};
  // V32: tipo_operacao editável (ENTRADAS / SAÍDAS / automático pelo CNPJ)
  function seletorTipo(r){
    const src = r.__src || (Number.isInteger(r.__idx) ? state.items[r.__idx] : null);
    const idx = src ? (IDX_GLOBAL.has(src) ? IDX_GLOBAL.get(src) : state.items.indexOf(src)) : (Number.isInteger(r.__idx) ? r.__idx : -1);
    const atual = r.tipo_operacao || (src ? tipoOperacao(src) : ''), manual = !!(src && src.__tipoManual);
    if (idx < 0) return '<td>' + esc(atual) + '</td>';
    return '<td><select class="v32-tipo' + (manual ? ' manual' : '') + '" data-tipo-idx="' + idx + '" title="' + (manual ? 'Alterado manualmente' : 'Automático pelo CNPJ da empresa') + '">'
      + '<option value="ENTRADAS"' + (atual === 'ENTRADAS' ? ' selected' : '') + '>ENTRADAS</option>'
      + '<option value="SAÍDAS"' + (atual === 'SAÍDAS' ? ' selected' : '') + '>SAÍDAS</option>'
      + (manual ? '<option value="">↺ Automático (CNPJ)</option>' : '') + '</select></td>';
  }
  const celula = (c, r) => {
    if (c === 'tipo_operacao') return seletorTipo(r);
    let cls = String(c).startsWith('validacao_') ? 'validation-column' : '';
    if (PAR_CORRETO[c]) cls = /^(INCORRETO|NÃO VALIDADO)/.test(String(r[PAR_CORRETO[c]] || '')) ? 'v28-correto' : 'v29-ok';
    return '<td class="' + cls + '">' + cellValidacao(c, r[c]) + '</td>';
  };

  window.renderTabelaFiscal = function(id, rows, infoId, msg){
    const table = $(id + 'Table') || $(id), h = table.querySelector('thead'), b = table.querySelector('tbody'),
      cols = rows.length ? Object.keys(rows[0]) : [];
    cacheTabelas[id] = {rows};
    const filtradas = filtrarLinhas(rows, id), pg = paginar(table, filtradas);
    h.innerHTML = cabecalhoComFiltros(cols, id);
    b.innerHTML = pg.linhas.map(r => '<tr>' + cols.map(c => celula(c, r)).join('') + '</tr>').join('')
      || '<tr><td class="empty" colspan="' + Math.max(1, cols.length) + '">' + msg + '</td></tr>';
    const inc = filtradas.reduce((a, r) => a + (Object.keys(r).some(c => c.startsWith('validacao_') && /^(INCORRETO|NÃO VALIDADO)/.test(String(r[c]))) ? 1 : 0), 0);
    if ($(infoId)) $(infoId).textContent = 'Documentos analisados: ' + fmtInt(documentosTabela(rows)) + ' · itens: ' + fmtInt(rows.length)
      + (filtradas.length !== rows.length ? ' · filtrados: ' + fmtInt(filtradas.length) : '') + ' · itens NÃO VALIDADOS: ' + fmtInt(inc) + '.';
  };
  window.renderTabela = function(id, rows, infoId, msg){
    const table = $(id + 'Table') || $(id), h = table.querySelector('thead'), b = table.querySelector('tbody'), cols = columns(rows);
    cacheTabelas[id] = {rows};
    const filtradas = filtrarLinhas(rows, id), pg = paginar(table, filtradas);
    h.innerHTML = cabecalhoComFiltros(cols, id);
    b.innerHTML = pg.linhas.map(r => '<tr>' + cols.map(c => '<td>' + esc(displayValue(c, r[c])) + '</td>').join('') + '</tr>').join('')
      || '<tr><td class="empty" colspan="' + Math.max(1, cols.length) + '">' + msg + '</td></tr>';
    if ($(infoId)) $(infoId).textContent = 'Documentos: ' + fmtInt(documentosTabela(rows.map(r => ({chave_nota_fiscal: r.chave_documento || r.chave_nota_fiscal, arquivo_origem: r.arquivo_origem})))) + ' · linhas: ' + fmtInt(rows.length) + '.';
  };
  window.renderItens = function(){
    const rows = linhasItensComIcms(), raw = columns(rows),
      cols = ['tipo_operacao', ...raw.filter(c => c !== 'tipo_operacao')],
      filtradas = filtrarLinhas(rows, 'table'), table = $('table'), h = table.querySelector('thead'), b = table.querySelector('tbody');
    cacheTabelas.table = {rows};
    const pg = paginar(table, filtradas);
    h.innerHTML = cabecalhoComFiltros(cols, 'table');
    b.innerHTML = pg.linhas.map(r => '<tr>' + cols.map(c => c === 'tipo_operacao'
        ? seletorTipo(r) : celula(c, r)).join('') + '</tr>').join('')
      || '<tr><td class="empty" colspan="' + cols.length + '">Nenhum item para os filtros selecionados.</td></tr>';
    $('tableInfo').textContent = 'Documentos: ' + fmtInt(state.docs.length) + ' · itens: ' + fmtInt(rows.length)
      + (filtradas.length !== rows.length ? ' · filtrados: ' + fmtInt(filtradas.length) : '') + ' · todos os itens dos XMLs, em páginas.';
  };
  const itensIcmsOriginal = window.linhasItensComIcms;
  window.linhasItensComIcms = function(){ return itensIcmsOriginal().map((r, i) => Object.defineProperty(r, '__idx', {value: i, enumerable: false})); };

  const renderAbaOriginal = window.renderAba;
  window.renderAba = function(id){
    if (id === 'processar') return;
    if (id === 'icmsst'){ renderTabelaFiscal('icmsSt', linhasIcmsSt(), 'icmsStInfo', 'Sem grupo ICMS ST no XML.'); return; }
    if (id === 'ibscbs'){ renderTabelaFiscal('ibsCbs', linhasIbsCbsTab(), 'ibsCbsInfo', 'Sem grupo IBS/CBS no XML.'); return; }
    return renderAbaOriginal(id);
  };

  /* ---------- dashboard: cartão de validações ---------- */
  const renderDashOriginal = window.renderDashboard;
  window.renderDashboard = function(){
    renderDashOriginal();
    const grid = document.querySelector('#dashboard .dash-tax-grid'); if (!grid) return;
    let card = $('dashValidacoes');
    if (!card){
      card = document.createElement('div'); card.id = 'dashValidacoes'; card.className = 'dashboard-card dash-wide';
      grid.insertBefore(card, grid.firstChild);
    }
    if (!state.items.length){ card.innerHTML = '<h3>Validações do lote</h3><p class="subtle">Processe os XMLs para ver o resultado das validações.</p>'; return; }
    const cont = {};
    const conta = (nome, v) => { const c = cont[nome] || (cont[nome] = {ok: 0, inc: 0}); if (String(v).startsWith('VALIDADO')) c.ok++; else if (/^(INCORRETO|NÃO VALIDADO)/.test(String(v))) c.inc++; };
    for (const r of state.items){
      const f = linhaFiscal(r);
      if (temIcmsFiscal(r)){ conta('ICMS', f.validacao_icms); conta('Base ICMS', f.validacao_base_icms); }
      if (temGrupoFiscal(r, 'PIS')){ conta('Base PIS', f.validacao_base_pis); conta('PIS', f.validacao_valor_pis); }
      if (temGrupoFiscal(r, 'COFINS')){ conta('Base COFINS', f.validacao_base_cofins); conta('COFINS', f.validacao_valor_cofins); }
      if (temGrupoFiscal(r, 'PIS')) conta('CST PIS', f.validacao_cst_pis);
      if (temGrupoFiscal(r, 'COFINS')) conta('CST COFINS', f.validacao_cst_cofins);
      if (temGrupoFiscal(r, 'IPI')){ const i = window.linhaIpi(r); conta('IPI', i.validacao_ipi); conta('CST IPI', i.validacao_cst_ipi); }
      if (temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS')){ const x = linhaIbsCbs(r); conta('CST IBS/CBS', x.validacao_cst_ibs_cbs); conta('Base IBS/CBS', x.validacao_base_ibs_cbs); conta('IBS', x.validacao_ibs); conta('CBS', x.validacao_cbs); }
    }
    const ordem = ['ICMS', 'Base ICMS', 'CST IPI', 'IPI', 'CST PIS', 'CST COFINS', 'Base PIS', 'PIS', 'Base COFINS', 'COFINS', 'CST IBS/CBS', 'Base IBS/CBS', 'IBS', 'CBS'];
    const totInc = ordem.reduce((a, k) => a + (cont[k]?.inc || 0), 0);
    card.innerHTML = '<h3>Validações do lote</h3><p class="subtle">' + fmtInt(state.files.length) + ' arquivo(s) lidos · ' + fmtInt(state.docs.length) + ' documento(s) · '
      + fmtInt(state.items.length) + ' item(ns) · ' + fmtInt(state.errors.length) + ' erro(s) · ' + fmtInt(V14.duplicadas) + ' duplicado(s) ignorado(s). '
      + (totInc ? '<b style="color:#b3261e">' + fmtInt(totInc) + ' validação(ões) incorreta(s)</b> — use o filtro da coluna de validação em cada aba para localizar.' : '<b style="color:var(--ok)">Nenhuma validação incorreta.</b>') + '</p>'
      + '<table class="dash-detail-table"><thead><tr><th>Validação</th><th>Validados</th><th>Incorretos</th><th>% correto</th></tr></thead><tbody>'
      + ordem.filter(k => cont[k] && (cont[k].ok + cont[k].inc)).map(k => { const c = cont[k], t = c.ok + c.inc;
          return '<tr><td>' + k + '</td><td>' + fmtInt(c.ok) + '</td><td' + (c.inc ? ' style="color:#b3261e;font-weight:700"' : '') + '>' + fmtInt(c.inc) + '</td><td>' + brNumero(c.ok / t * 100, 1) + '%</td></tr>'; }).join('')
      + '</tbody></table>';
  };

  /* ---------- seleção: acumula arquivos + pasta, sem limite ---------- */
  function atualizarSelecao(){
    const n = state.files.length, bytes = state.files.reduce((a, f) => a + (f.size || 0), 0);
    $('mFiles').textContent = fmtInt(n);
    $('clear').disabled = !n; $('process').disabled = !n || V14.rodando;
    $('selected').textContent = n ? fmtInt(n) + ' arquivo(s) XML/TXT carregado(s) · ' + tamanho(bytes) + (V14.naoXml ? ' · ' + fmtInt(V14.naoXml) + ' arquivo(s) de outro tipo descartado(s)' : '')
      : 'Nenhum arquivo selecionado.';
    $('status').textContent = n ? 'Arquivos carregados. Clique na aba "Processar" (ou no botão Processar arquivos) para iniciar.' : 'Aguardando seleção.';
    $('status').className = 'status';
    const pInfo = $('pArquivos'); if (pInfo) pInfo.textContent = fmtInt(n);
    const pSt = $('pStatus'); if (pSt && !V14.rodando && V14.pendente) pSt.textContent = fmtInt(n) + ' arquivo(s) prontos. O processamento começa ao abrir esta aba ou ao clicar em "Iniciar processamento".';
    const bIni = $('pIniciar'); if (bIni) bIni.disabled = !n || V14.rodando;
  }
  window.setFiles = function(fs){
    const recebidos = Array.from(fs || []);
    let novos = 0;
    for (const f of recebidos){
      if (!/\.(xml|txt)$/i.test(String(f.name || ''))){ V14.naoXml++; continue; }
      const caminho = f.webkitRelativePath || f.__caminho || f.name, k = caminho + '|' + f.size + '|' + f.lastModified;
      if (V14.keys.has(k)) continue;
      V14.keys.add(k); state.files.push(f); novos++;
    }
    if (novos) V14.pendente = true;
    atualizarSelecao();
    if (!state.files.length){
      $('selected').textContent = recebidos.length ? 'Nenhum XML ou TXT foi encontrado na seleção.' : 'Nenhuma pasta ou arquivo foi selecionado.';
      $('status').textContent = 'Selecione arquivos .xml ou .txt que contenham XML.'; $('status').className = 'status warn';
    }
    $('files').value = ''; $('folder').value = '';
  };
  // arrastar e soltar pastas inteiras (com subpastas)
  function lerEntrada(entry, prefixo, saida){
    return new Promise(res => {
      if (entry.isFile) entry.file(f => { try { f.__caminho = prefixo + f.name; } catch(e){} saida.push(f); res(); }, () => res());
      else if (entry.isDirectory){
        const leitor = entry.createReader(), filhos = [];
        const lote = () => leitor.readEntries(async itens => {
          if (!itens.length){ for (const c of filhos) await lerEntrada(c, prefixo + entry.name + '/', saida); res(); }
          else { filhos.push(...itens); lote(); }
        }, () => res());
        lote();
      } else res();
    });
  }
  $('drop').ondrop = async e => {
    e.preventDefault(); $('drop').classList.remove('drag');
    const itens = e.dataTransfer.items;
    if (itens && itens.length && itens[0].webkitGetAsEntry){
      const entradas = Array.from(itens).map(i => i.webkitGetAsEntry()).filter(Boolean), saida = [];
      $('status').textContent = 'Lendo pastas arrastadas...';
      for (const en of entradas) await lerEntrada(en, '', saida);
      setFiles(saida);
    } else setFiles(e.dataTransfer.files);
  };
  $('clear').addEventListener('click', () => {
    V14.keys = new Set(); V14.naoXml = 0; V14.pendente = false; V14.duplicadas = 0; V14.cancelar = true;
    Object.keys(PAG).forEach(k => PAG[k].pagina = 0);
    atualizarSelecao(); resetPainel();
  });

  /* ---------- aba PROCESSAR ---------- */
  function resetPainel(){
    ['pDocs', 'pItens', 'pEventos', 'pDup', 'pErros', 'pLidos'].forEach(id => { if ($(id)) $(id).textContent = '0'; });
    if ($('pBar')) $('pBar').style.width = '0%';
    if ($('pErrosLista')) $('pErrosLista').innerHTML = '<div class="small">Nenhuma ocorrência.</div>';
    if ($('pStatus')) $('pStatus').textContent = 'Carregue XMLs na aba "Carregar XMLs".';
    if ($('pVerDash')) $('pVerDash').disabled = true;
  }
  async function lerTexto(f){
    const buf = await f.arrayBuffer();
    const cab = new TextDecoder('latin1').decode(buf.slice(0, 300));
    const m = cab.match(/encoding=["']([\w\-]+)["']/i);
    let txt;
    try { txt = new TextDecoder(m ? m[1].toLowerCase() : 'utf-8').decode(buf); } catch(e){ txt = new TextDecoder('utf-8').decode(buf); }
    const i = txt.indexOf('<'); if (i > 0) txt = txt.slice(i);   // TXT com texto antes do XML
    return txt.replace(/^\uFEFF/, '');
  }
  function atualizarPainel(lidos, total){
    const pct = total ? lidos / total * 100 : 0, seg = (performance.now() - V14.t0) / 1000, resta = lidos ? seg / lidos * (total - lidos) : 0;
    $('pBar').style.width = pct.toFixed(1) + '%'; $('bar').style.width = pct.toFixed(1) + '%';
    $('pLidos').textContent = fmtInt(lidos); $('pDocs').textContent = fmtInt(state.docs.length); $('pItens').textContent = fmtInt(state.items.length);
    $('pEventos').textContent = fmtInt(state.events.length); $('pDup').textContent = fmtInt(V14.duplicadas); $('pErros').textContent = fmtInt(state.errors.length);
    const t = 'Processando ' + fmtInt(lidos) + ' de ' + fmtInt(total) + ' arquivos (' + brNumero(pct, 1) + '%)' + (resta > 1 ? ' · restam cerca de ' + Math.ceil(resta) + ' s' : '');
    $('pStatus').textContent = t; $('status').textContent = t; $('status').className = 'status';
  }
  function listarOcorrencias(){
    const box = $('pErrosLista'); const e = state.errors;
    if (!e.length){ box.innerHTML = '<div class="small" style="color:var(--ok)">Nenhum arquivo com erro.</div>'; return; }
    const max = 500;
    box.innerHTML = e.slice(0, max).map(x => '<div><b>' + esc(x.pasta_origem || x.arquivo_origem) + '</b> — ' + esc(x.erro) + '</div>').join('')
      + (e.length > max ? '<div>… e mais ' + fmtInt(e.length - max) + ' ocorrência(s). Todas constam na aba Erros do Excel.</div>' : '');
  }
  async function processarV14(){
    if (V14.rodando) return;
    const files = [...state.files];
    if (!files.length){ $('pStatus').textContent = 'Nenhum arquivo carregado. Use "Importar XMLs" ou "Selecionar pasta completa" na aba Carregar XMLs.'; return; }
    const runId = ++state.runId;
    V14.rodando = true; V14.cancelar = false; V14.pendente = false; V14.duplicadas = 0; V14.t0 = performance.now();
    state.items = []; state.events = []; state.docs = []; state.errors = [];
    resetFiltrosV15();
    Object.keys(PAG).forEach(k => PAG[k].pagina = 0);
    $('process').disabled = true; $('pIniciar').disabled = true; $('pCancelar').disabled = false; $('pVerDash').disabled = true;
    $('download').disabled = true; $('downloadTop').disabled = true;
    const chaves = new Set, LOTE = 20;
    let lidos = 0;
    for (let i = 0; i < files.length; i += LOTE){
      if (V14.cancelar || runId !== state.runId) break;
      const fatia = files.slice(i, i + LOTE);
      const textos = await Promise.all(fatia.map(f => lerTexto(f).catch(err => ({__erro: err}))));
      for (let j = 0; j < fatia.length; j++){
        const f = fatia[j], txt = textos[j], pasta = f.webkitRelativePath || f.__caminho || '';
        try {
          if (typeof txt !== 'string') throw Error('Não foi possível ler o arquivo');
          const [rows, doc] = parse(f, txt);
          const linhasBrutas = Array.isArray(rows) ? rows.filter(Boolean) : [];
          if (doc.tipo_documento === 'Evento NF-e'){ state.events.push(...linhasBrutas); state.docs.push(doc); continue; }
          const ch = doc.chave_documento;
          if (ch && chaves.has(ch)){ V14.duplicadas++; state.errors.push({arquivo_origem: f.name, pasta_origem: pasta, erro: 'Documento duplicado ignorado (chave ' + ch + ')'}); continue; }
          if (ch) chaves.add(ch);
          const linhas = linhasBrutas.filter(r => possuiItemFiscal(r));
          if (linhas.length) state.items.push(...linhas);
          else state.items.push({...doc, numero_item: 1, descricao_item: 'Documento reconhecido sem linhas de itens retornadas pelo layout XML',
            observacao_item: 'Linha de rastreio criada automaticamente. A chave e os campos disponíveis no XML foram preservados; não foram inventados itens ou tributos.'});
          state.docs.push(doc);
        } catch(e){
          state.errors.push({arquivo_origem: f.name, pasta_origem: pasta, erro: e.message || String(e)});
        }
      }
      lidos += fatia.length;
      atualizarPainel(lidos, files.length);
      await new Promise(r => setTimeout(r, 0));
    }
    V14.rodando = false; $('pCancelar').disabled = true; $('pIniciar').disabled = false; $('process').disabled = false;
    if (runId !== state.runId) return;
    const cancelado = V14.cancelar;
    if (cancelado) V14.pendente = true;
    atualizarPainel(lidos, files.length);
    $('mDocs').textContent = fmtInt(state.docs.length); $('mItems').textContent = fmtInt(state.items.length); $('mErrors').textContent = fmtInt(state.errors.length);
    $('itemBadge').textContent = state.items.length; $('eventBadge').textContent = state.events.length;
    state.items = state.items.map(prepararCfop); aplicarCfop();
    atualizarBadgesTributos();
    listarOcorrencias();
    $('pStatus').textContent = 'Validando e montando as abas Itens, ICMS, ICMS ST, IPI, PIS/COFINS, IBS/CBS e Dashboard...';
    await new Promise(r => setTimeout(r, 30));
    try { render(); } catch(e){ console.error(e); }
    const seg = brNumero((performance.now() - V14.t0) / 1000, 1);
    const fim = (cancelado ? 'Cancelado pelo usuário — resultados parciais: ' : 'Concluído: ') + fmtInt(lidos) + ' arquivo(s) lidos, ' + fmtInt(state.docs.length) + ' documento(s), '
      + fmtInt(state.items.length) + ' item(ns), ' + fmtInt(state.events.length) + ' evento(s), ' + fmtInt(V14.duplicadas) + ' duplicado(s) e ' + fmtInt(state.errors.length - V14.duplicadas) + ' erro(s) em ' + seg + ' s.';
    $('pStatus').textContent = fim; $('status').textContent = fim + ' Clique em Baixar Excel no computador para salvar.'; $('status').className = 'status ok';
    $('pBar').style.width = '100%'; $('bar').style.width = '100%';
    $('download').disabled = !state.docs.length; $('downloadTop').disabled = !state.docs.length; $('pVerDash').disabled = !state.docs.length;
    if (state.docs.length && !cancelado) document.querySelector('.tab[data-tab="items"]').click();
  }
  window.process = processarV14;
  const abrirProcessar = () => { document.querySelector('.tab[data-tab="processar"]').click(); };
  $('process').onclick = abrirProcessar;
  document.querySelector('.tab[data-tab="processar"]').addEventListener('click', () => { if (V14.pendente && state.files.length && !V14.rodando) processarV14(); });
  $('pIniciar').onclick = processarV14;
  $('pCancelar').onclick = () => { V14.cancelar = true; };
  $('pVerDash').onclick = () => document.querySelector('.tab[data-tab="dashboard"]').click();
  $('pVoltar').onclick = () => document.querySelector('.tab[data-tab="load"]').click();
  $('process').textContent = 'Processar arquivos';

