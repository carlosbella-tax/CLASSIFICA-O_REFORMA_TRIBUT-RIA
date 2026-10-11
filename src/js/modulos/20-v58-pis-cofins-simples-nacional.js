  /* =====================================================================
     V58 — PIS/COFINS no Simples Nacional, valor correto a partir da base
     correta e "NÃO VALIDADO" no lugar de "INCORRETO" em todo o sistema
     ===================================================================== */
  const CSOSN_SN = new Set(['101', '102', '103', '201', '202', '203', '300', '400', '500', '900']);
  const linhasPisV57 = window.linhasPisCofins;
  window.linhasPisCofins = () => linhasPisV57().map(row => {
    const r = row.__src; if (!r) return row;
    const cfx = String(row.cfop_xml || '').charAt(0), imp = cfx === '3';
    const prod = num(row.valor_total_produtos !== undefined ? row.valor_total_produtos : r.valor_item);
    const cstI = String(row.cst_icms || '').trim(), ehSt60 = cstI === '60', sn = CSOSN_SN.has(cstI) || ehSt60, rotSn = ehSt60 ? 'ICMS-ST (CST 60)' : 'Simples Nacional';
    for (const t of [{cst: 'cst_pis', base: 'base_pis_xml', aliq: 'aliquota_pis', valor: 'valor_pis_xml', vBase: 'validacao_base_pis', bCor: 'base_correta_pis', vVal: 'validacao_valor_pis', vCor: 'valor_correto_pis', nome: 'PIS', padrao: imp ? 2.10 : 1.65},
                     {cst: 'cst_cofins', base: 'base_cofins_xml', aliq: 'aliquota_cofins', valor: 'valor_cofins_xml', vBase: 'validacao_base_cofins', bCor: 'base_correta_cofins', vVal: 'validacao_valor_cofins', vCor: 'valor_correto_cofins', nome: 'COFINS', padrao: imp ? 9.65 : 7.60}]){
      const cst = String(row[t.cst] || '').padStart(2, '0'), base = num(row[t.base]);
      // Simples Nacional (CSOSN no ICMS): não há ICMS destacado a excluir — a base de PIS/COFINS é o valor dos produtos
      if (sn && !imp && !SEM_TRIB_PC.has(cst) && (base > 0.005 || CST_BASE_PC.has(cst))){
        const ok = Math.abs(arred(base) - arred(prod)) <= 0.0201;
        row[t.vBase] = ok ? 'VALIDADO (' + rotSn + ': base = valor total dos produtos)' : 'NÃO VALIDADO (' + rotSn + ': base de ' + t.nome + ' deve ser o valor total dos produtos: ' + brl(prod) + ')';
        row[t.bCor] = ok ? 0 : prod;
      }
      // com base correta informada, o valor correto é recalculado sobre ela e a validação do valor fica NÃO VALIDADO
      const bc = num(row[t.bCor]);
      if (bc > 0.005 && t.vCor in row){
        const aliq = num(row[t.aliq]) || t.padrao, vc = arred(bc * aliq / 100);
        row[t.vCor] = vc;
        row[t.vVal] = 'NÃO VALIDADO (valor de ' + t.nome + ' sobre a base correta: ' + brl(bc) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(vc) + ')';
      }
    }
    return row;
  });

  // "INCORRETO" passa a ser "NÃO VALIDADO" em todas as abas de validação, no Dashboard, no Excel e na apresentação
  const trocarInc = o => { if (o) for (const k of Object.keys(o)){ const v = o[k]; if (typeof v === 'string' && v.startsWith('INCORRETO')) o[k] = 'NÃO VALIDADO' + v.slice(9); } return o; };
  for (const nome of ['linhasIcms', 'linhasIcmsSt', 'linhasIpi', 'linhasPisCofins']){
    const f = window[nome]; window[nome] = (...a) => f(...a).map(trocarInc);
  }
  const lIpiV57 = window.linhaIpi; window.linhaIpi = r => trocarInc(lIpiV57(r));
  const lFiscV57 = window.linhaFiscal; window.linhaFiscal = r => trocarInc(lFiscV57(r));
  const lIbsV57 = linhaIbsCbs; linhaIbsCbs = r => trocarInc(lIbsV57(r));

