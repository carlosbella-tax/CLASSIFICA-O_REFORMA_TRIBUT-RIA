  /* =====================================================================
     V18 — Layout da aba Itens (colunas removidas, renomeadas e blocos de
     ICMS, ICMS ST e PIS/COFINS com CST e descrição).
     ===================================================================== */

  // V18: a V13 juntava todas as chaves num só texto e "PRED...CST" (redução de BC + CST do PIS) virava ICMS ST por engano.
  const RE_ST = /_ICMS_ICMS(10|30|60|70|90)_|_ICMS_ICMSSN(201|202|203|500|900)_|VBCST|VICMSST|VICMSSUBSTITUTO|VICMSSTRET|PMVAST|PREDBCST/;
  // V23: ICMS ST só quando o XML traz as tags de valor de ST
  const temValorSt = r => cacheTem(r, '__st', () => chavesTributarias(r).some(k => /_VBCST$|_VICMSST$|_VBCSTRET$|_VICMSSTRET$|_VICMSSUBSTITUTO$/.test(k)));
  window.temIcmsStFiscal = temValorSt;
  const CST_IPI = {"00": "Entrada com Recuperação de Crédito", "01": "Entrada Tributável com Alíquota Zero", "02": "Entrada Isenta", "03": "Entrada Não-Tributada", "04": "Entrada Imune", "05": "Entrada com Suspensão", "49": "Outras Entradas", "50": "Saída Tributada", "51": "Saída Tributável com Alíquota Zero", "52": "Saída Isenta", "53": "Saída Não-Tributada", "54": "Saída Imune", "55": "Saída com Suspensão", "99": "Outras Saídas"};
  const CST_PIS_COFINS = {"01": "Operação Tributável com Alíquota Básica", "02": "Operação Tributável com Alíquota Diferenciada", "03": "Operação Tributável com Alíquota por Unidade de Medida de Produto", "04": "Operação Tributável Monofásica – Revenda a Alíquota Zero", "05": "Operação Tributável por Substituição Tributária", "06": "Operação Tributável a Alíquota Zero", "07": "Operação Isenta da Contribuição", "08": "Operação sem Incidência da Contribuição", "09": "Operação com Suspensão da Contribuição", "49": "Outras Operações de Saída", "50": "Operação com Direito a Crédito – Vinculada Exclusivamente a Receita Tributada no Mercado Interno", "51": "Operação com Direito a Crédito – Vinculada Exclusivamente a Receita Não Tributada no Mercado Interno", "52": "Operação com Direito a Crédito – Vinculada Exclusivamente a Receita de Exportação", "53": "Operação com Direito a Crédito – Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno", "54": "Operação com Direito a Crédito – Vinculada a Receitas Tributadas no Mercado Interno e de Exportação", "55": "Operação com Direito a Crédito – Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação", "56": "Operação com Direito a Crédito – Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação", "60": "Crédito Presumido – Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno", "61": "Crédito Presumido – Operação de Aquisição Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno", "62": "Crédito Presumido – Operação de Aquisição Vinculada Exclusivamente a Receita de Exportação", "63": "Crédito Presumido – Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno", "64": "Crédito Presumido – Operação de Aquisição Vinculada a Receitas Tributadas no Mercado Interno e de Exportação", "65": "Crédito Presumido – Operação de Aquisição Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação", "66": "Crédito Presumido – Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação", "67": "Crédito Presumido – Outras Operações", "70": "Operação de Aquisição sem Direito a Crédito", "71": "Operação de Aquisição com Isenção", "72": "Operação de Aquisição com Suspensão", "73": "Operação de Aquisição a Alíquota Zero", "74": "Operação de Aquisição sem Incidência da Contribuição", "75": "Operação de Aquisição por Substituição Tributária", "98": "Outras Operações de Entrada", "99": "Outras Operações"};
  const descCstPc = c => { const k = String(c || '').trim(); return k ? (CST_PIS_COFINS[k.padStart(2, '0')] || 'CST não localizado na tabela') : ''; };
  const REMOVER_ITENS = new Set(['pasta_origem', 'fonte_chave_documento', 'protocolo_autorizacao', 'item_det_prod_xProd', 'item_det_prod_NCM',
    'item_det_prod_CFOP', 'item_det_prod_uCom', 'item_det_prod_qCom', 'item_det_prod_vUnCom', 'item_det_prod_vProd', 'item_det_prod_cEANTrib',
    'item_det_prod_uTrib', 'item_det_prod_qTrib', 'item_det_prod_vUnTrib', 'item_det_prod_indTot', 'item_det_imposto_vTotTrib',
    'icms_base_xml', 'icms_cst', 'icms_aliquota', 'icms_valor_xml', 'validacao_icms',
    'item_det_@nItem', 'item_det_prod_cProd', 'item_det_imposto_PIS_PISNT_CST', 'item_det_imposto_COFINS_COFINSNT_CST']);
  const RENOMEAR_ITENS = {'item_det_@nItem': 'ITEM', 'item_det_prod_vDesc': 'DESCONTO'};
  const JA_INSERIDOS = new Set(['cfop', 'cfop_xml', 'descricao_cfop', 'descricao_cst_icms']);
  const vazio = v => v ? v : '';
  function blocoIcms(r, ctx){
    const tem = temIcmsFiscal(r), o = {};
    o.cst_icms = tem ? cstGrupo(r, 'ICMS') : '';
    o.descricao_cst_icms = tem ? descCstIcms(o.cst_icms) : '';
    if (ctx.st){ const st = temValorSt(r); o.base_icms_st = st ? valorSt(r, 'vBCST') : ''; o.valor_icms_st = st ? valorSt(r, 'vICMSST') : ''; }
    // V19: bloco de IPI logo após o ICMS ST
    const ipi = temGrupoFiscal(r, 'IPI'), cstIpi = ipi ? cstGrupo(r, 'IPI') : '';
    o.base_ipi = ipi ? valorGrupo(r, 'IPI', 'vBC') : '';
    o.cst_ipi = cstIpi;
    o.descricao_cst_ipi = cstIpi ? (CST_IPI[String(cstIpi).trim().padStart(2, '0')] || 'CST não localizado na tabela') : '';
    o.aliquota_ipi = ipi && valorGrupo(r, 'IPI', 'pIPI') ? valorGrupo(r, 'IPI', 'pIPI') : '';
    o.valor_ipi = ipi ? valorGrupo(r, 'IPI', 'vIPI') : '';
    o.base_icms = tem ? valorIcms(r, 'vBC') : '';
    o.aliquota_icms = tem ? valorIcms(r, 'pICMS') : '';
    if (ctx.red){ const p = valorIcms(r, 'pRedBC'); o['redução_bc_icms'] = p ? brNumero(p, 2) + '%' : ''; }
    o.valor_icms = tem ? valorIcms(r, 'vICMS') : '';
    return o;
  }
  function blocoPisCofins(r){
    const temP = temGrupoFiscal(r, 'PIS'), temC = temGrupoFiscal(r, 'COFINS'), cp = temP ? cstGrupo(r, 'PIS') : '', cc = temC ? cstGrupo(r, 'COFINS') : '';
    return {base_pis: temP ? valorGrupo(r, 'PIS', 'vBC') : '', base_cofins: temC ? valorGrupo(r, 'COFINS', 'vBC') : '',
      cst_pis: cp, descricao_cst_pis: descCstPc(cp), cst_cofins: cc, descricao_cst_cofins: descCstPc(cc),
      valor_pis: temP ? valorGrupo(r, 'PIS', 'vPIS') : '', valor_cofins: temC ? valorGrupo(r, 'COFINS', 'vCOFINS') : ''};
  }
  // V21: bloco de IBS/CBS (base, CST e cClassTrib são comuns aos dois tributos no grupo IBSCBS do XML)
  const CST_IBS_CBS = {"000": "Tributação integral", "010": "Tributação com alíquotas uniformes", "011": "Tributação com alíquotas uniformes reduzidas", "200": "Alíquota reduzida", "210": "Alíquota reduzida com redutor de base de cálculo", "220": "Alíquota fixa", "221": "Alíquota fixa proporcional", "222": "Redução de base de cálculo", "400": "Isenção", "410": "Imunidade e não incidência", "510": "Diferimento", "515": "Diferimento com redução de alíquota", "550": "Suspensão", "620": "Tributação monofásica", "800": "Transferência de crédito", "810": "Ajuste de IBS na ZFM", "811": "Ajustes", "820": "Tributação em declaração de regime específico", "830": "Exclusão de base de cálculo"};
  function blocoIbsCbs(r){
    const tem = temGrupoFiscal(r, 'IBS') || temGrupoFiscal(r, 'CBS'), c = tem ? String(campoGrupo(r, 'IBS', 'CST') || '').trim() : '';
    const pIbs = num(campoGrupo(r, 'IBS', 'pIBSUF')) + num(campoGrupo(r, 'IBS', 'pIBSMun')), vUf = valorGrupo(r, 'IBS', 'vIBSUF'), vMun = valorGrupo(r, 'IBS', 'vIBSMun');
    return {base_ibs_cbs: tem ? valorGrupo(r, 'IBS', 'vBC') : '', cst_ibs_cbs: c,
      descricao_cst_ibs_cbs: c ? (CST_IBS_CBS[c.padStart(3, '0')] || 'CST não localizado na tabela') : '',
      cclasstrib: tem ? campoGrupo(r, 'IBS', 'cClassTrib') : '',
      aliquota_ibs: tem ? pIbs : '', valor_ibs: tem ? (valorGrupo(r, 'IBS', 'vIBS') || arred(vUf + vMun)) : '',
      aliquota_cbs: tem ? num(campoGrupo(r, 'CBS', 'pCBS')) : '', valor_cbs: tem ? valorGrupo(r, 'CBS', 'vCBS') : ''};
  }
  function moldarItem(r, ctx){
    const o = {};
    let pisFeito = false;
    for (const k of Object.keys(r)){
      if (!pisFeito && (k.startsWith('item_det_imposto_PIS') || k.startsWith('item_det_imposto_COFINS'))){ Object.assign(o, blocoPisCofins(r), blocoIbsCbs(r)); pisFeito = true; }
      if (REMOVER_ITENS.has(k) || JA_INSERIDOS.has(k)) continue;
      if (k === 'tipo_documento') o.regime_tributario = textoRegime(regimeItem(r));   // V42
      if (k === 'item_det_prod_vDesc'){ o.DESCONTO = brl(num(r[k])); continue; }
      o[RENOMEAR_ITENS[k] || k] = r[k];
      if (k === 'ncm'){  // CFOP: original do XML com descrição, depois o CFOP da operação com descrição
        const xml = r.cfop_xml || r.cfop || '';
        o.cfop_xml = xml; o.descricao_cfop_xml = xml ? descTabela(xml) || 'CFOP não localizado na tabela de referência' : '';
        o.cfop = r.cfop || ''; o.descricao_cfop = r.descricao_cfop || (r.cfop ? descCfop(r.cfop, xml) : '');
      }
      if (k === 'valor_item') Object.assign(o, blocoIcms(r, ctx));
    }
    if (!('valor_item' in r)) Object.assign(o, blocoIcms(r, ctx));
    if (!pisFeito) Object.assign(o, blocoPisCofins(r), blocoIbsCbs(r));
    if (!('ncm' in r) && r.cfop){ o.cfop_xml = r.cfop_xml || r.cfop; o.descricao_cfop_xml = descTabela(o.cfop_xml); o.cfop = r.cfop; o.descricao_cfop = r.descricao_cfop || ''; }
    return o;
  }
  const MOLDE = new WeakMap;   // V25: linha da aba Itens montada uma vez por item
  function contextoItens(lista){
    return {st: lista.some(temValorSt), red: lista.some(r => valorIcms(r, 'pRedBC') > 0)};
  }
  // V20: campo sem informação no XML aparece com 0 (nunca vazio)
  const ZERO_ESPECIAL = {'DESCONTO': () => brl(0), 'redução_bc_icms': () => '0,00%'};
  function preencherZeros(rows){
    const cols = columns(rows);
    for (const r of rows) for (const c of cols){
      const v = r[c];
      if (v === undefined || v === null || v === '') r[c] = ZERO_ESPECIAL[c] ? ZERO_ESPECIAL[c]() : 0;
    }
    return rows;
  }
  function linhasItensVisao(lista){ aplicarCfop(); const ctx = contextoItens(state.items); return preencherZeros(lista.map(r => ({tipo_operacao: tipoOperacao(r), ...moldarItem(r, ctx)}))); }
  window.linhasItensComIcms = function(){
    const ctx = contextoItens(state.items);
    const base = ctx.st + '|' + ctx.red + '|';
    return preencherZeros(state.items.map((r, i) => {
      const k = base + tipoOperacao(r) + '|' + (r.cfop || '');
      let c = MOLDE.get(r);
      if (!c || c.k !== k){ c = {k, v: {tipo_operacao: tipoOperacao(r), ...moldarItem(r, ctx)}}; MOLDE.set(r, c); }   // V26: tipo_operacao como coluna comum, com filtro ▾ igual a arquivo_origem
      return Object.defineProperty(c.v, '__idx', {value: IDX_GLOBAL.has(r) ? IDX_GLOBAL.get(r) : i, enumerable: false, writable: true, configurable: true});
    }));
  };
  function downloadV18() {
    const summary = [{
        metrica: 'Empresa informada',
        quantidade: $('empresa').value || ''
    }, {
        metrica: 'CNPJ informado',
        quantidade: $('cnpjEmpresa').value || ''
    }, {
        metrica: 'Mês processado',
        quantidade: $('periodo').value || ''
    }, {
        metrica: 'Ano processado',
        quantidade: $('anoPeriodo').value || ''
    }, {
        metrica: 'Cenário de validação',
        quantidade: 'São Paulo interno'
    }, {
        metrica: 'Regime analisado',
        quantidade: $('regimeEmpresa').value || ''
    }, {
        metrica: 'UF de origem selecionada',
        quantidade: $('ufOrigem').value || 'Conforme XML'
    }, {
        metrica: 'UF de destino selecionada',
        quantidade: $('ufDestino').value || 'Conforme XML'
    }, {
        metrica: 'XMLs selecionados',
        quantidade: state.files.length
    }, {
        metrica: 'Documentos processados',
        quantidade: state.docs.length
    }, {
        metrica: 'Itens / serviços',
        quantidade: state.items.length
    }, {
        metrica: 'Erros',
        quantidade: state.errors.length
    }];
    const sheets = [
        ['Dashboard', dashboardRows()],
        ['Itens', linhasItensVisao(state.items)],
        ['Regime Tributario', taxRows()],
        ['ICMS', linhasIcms()],
        ['ICMS ST', linhasIcmsSt()],
        ['IPI', linhasIpi()],
        ['Base de PIS-COFINS', linhasPisCofins()],
        ['Base de IBS-CBS', linhasIbsCbsTab()],
        ['Eventos', state.events],
        ['Documentos', state.docs],
        ['Erros', state.errors],
        ['Resumo', summary]
    ].filter(x => x[0] === 'Resumo' || x[1].length);
    const files = [
        ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
        ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
        ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + xe(s[0]) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'],
        ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '</Relationships>']
    ];
    sheets.forEach((s, i) => files.push(['xl/worksheets/sheet' + (i + 1) + '.xml', sheet(s[1])]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip(files));
    a.download = 'diagnostico-operacoes-fiscais.xlsx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

  $('download').onclick = downloadV18;
  $('downloadTop').onclick = downloadV18;

