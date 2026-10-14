  /* =====================================================================
     V90 — IPI incluso na base de ICMS = USO E CONSUMO
     Quando a base de ICMS do XML inclui o valor do IPI (operações internas e
     interestaduais — CFOP 1xxx, 2xxx, 5xxx, 6xxx — com IPI destacado), o item
     recebe a coluna uso_e_consumo = "USO E CONSUMO" e, somente neste caso, a
     base de ICMS é validada por:
         base = produtos + IPI   (com a redução do pRedBC, quando houver)
     O ICMS é recalculado sobre essa base (margem de R$ 0,05).
     Reconhecimento do IPI na base: base do XML = (produtos + IPI) ou
     (produtos − desconto + frete + seguro + outras + IPI), e diferente da base
     sem o IPI. A mesma coluna aparece nas abas ICMS ST, IPI, Base de
     PIS/COFINS e Base de IBS/CBS (logo depois de cfop_xml / cfop).
     ===================================================================== */
  const TOL_V90 = 0.0501, TXT_UC_V90 = 'USO E CONSUMO';
  const CSOSN_SEM_V90 = new Set(['101', '102', '103', '201', '202', '203', '300', '400', '500']);
  // conta da regra a partir do item do XML (null = IPI não está na base de ICMS)
  function usoConsumoV90(r){
    if (!r) return null;
    if (r.__ucV90 !== undefined) return r.__ucV90;
    let res = null;
    const cfop = String(r.cfop_xml || r.cfop || '').trim(), cst = String(cstGrupo(r, 'ICMS') || '').trim();
    const ipi = arred(valorGrupo(r, 'IPI', 'vIPI')), bc = arred(valorIcms(r, 'vBC'));
    if (['1', '2', '5', '6'].includes(cfop.charAt(0)) && !SEM_BASE_ICMS.has(cst) && !CSOSN_SEM_V90.has(cst) && ipi > TOL_V90 && bc > 0.005){
      const prod = num(r.valor_item), red = valorIcms(r, 'pRedBC'), fator = red > 0 && red < 100 ? 1 - red / 100 : 1;
      const frete = num(campoGrupo(r, 'prod', 'vFrete')), seg = num(campoGrupo(r, 'prod', 'vSeg')), desc = num(campoGrupo(r, 'prod', 'vDesc')), outras = num(campoGrupo(r, 'prod', 'vOutro'));
      const semIpi = arred(arred(prod - desc + frete + seg + outras) * fator);
      const cheia = arred(prod - desc + ipi), base = arred(cheia * fator), comp = arred(arred(prod - desc + frete + seg + outras + ipi) * fator);
      const semDesc = arred(arred(prod + ipi) * fator);   // V97: reconhece o IPI na base mesmo quando o XML não subtraiu o desconto
      if ((Math.abs(bc - base) <= TOL_V90 || Math.abs(bc - comp) <= TOL_V90 || Math.abs(bc - semDesc) <= TOL_V90) && Math.abs(bc - semIpi) > TOL_V90)
        res = {cfop, prod, desc, ipi, red, fator, cheia, base, bc};   // V97: com desconto
    }
    try { Object.defineProperty(r, '__ucV90', {value: res, configurable: true, writable: true}); } catch(e){}
    return res;
  }
  // insere a coluna uso_e_consumo logo depois de "depois" (ou no fim)
  const comUsoConsumoV90 = (row, r, depois) => {
    if (!row || 'uso_e_consumo' in row) return row;
    const v = usoConsumoV90(r) ? TXT_UC_V90 : '', x = {};
    for (const c of Object.keys(row)){ x[c] = row[c]; if (c === depois) x.uso_e_consumo = v; }
    if (!('uso_e_consumo' in x)) x.uso_e_consumo = v;
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    return x;
  };
  // item do XML de uma linha sem __src (ICMS ST): chave do documento + número do item
  const itemDaLinhaV90 = row => {
    if (row.__src) return row.__src;
    const ch = row.chave_documento_fiscal || row.chave_nota_fiscal || '', n = String(row.numero_item || '');
    return (itensTodosV70 || state.items).find(r => (r.chave_documento || '') === ch && String(r.numero_item || '') === n) || null;
  };

  /* ---------- Aba ICMS: coluna + regra da base (produtos + IPI) ---------- */
  const linhasIcmsV89 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV89(...a).map(row0 => {
    const r = row0.__src, uc = usoConsumoV90(r), row = comUsoConsumoV90(row0, r, 'cfop_xml');
    if (!uc) return row;
    const baseXml = arred(num(row.base_icms_xml)), ok = Math.abs(baseXml - uc.base) <= TOL_V90;
    const conta = 'uso e consumo — IPI incluso na base de ICMS, CFOP ' + uc.cfop + ': produtos ' + brl(uc.prod) + (uc.desc > 0.005 ? ' − desconto ' + brl(uc.desc) : '') + ' + IPI ' + brl(uc.ipi) + ' = ' + brl(uc.cheia)
      + (uc.fator !== 1 ? ' × (1 − ' + brNumero(uc.red, 2) + '%) = ' + brl(uc.base) : '');
    row.validacao_base_icms = ok ? 'VALIDADO (' + conta + ')' : 'NÃO VALIDADO (base deve ser ' + brl(uc.base) + ' — ' + conta + ') diferença: ' + brl(arred(baseXml - uc.base));
    if ('base_icms_calculada' in row) row.base_icms_calculada = ok ? 'VALIDADO' : uc.base;
    if ('base_correta_icms' in row) row.base_correta_icms = ok ? 0 : uc.base;
    const cst = String(row.cst_icms || '').trim();
    if (cst !== '51' && 'validacao_icms' in row){
      const aliq = num(row.aliquota_icms), icmsXml = arred(num(row.valor_icms_xml));
      const usada = ok ? baseXml : uc.base, calc = arred(usada * aliq / 100), okI = Math.abs(icmsXml - calc) <= TOL_V90;
      row.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = okI ? 0 : calc;
    }
    // a observação automática de arredondamento (V88) não se aplica a esta regra
    if ('observacao' in row && obsUsuarioV71('icms')[chaveObsV71(row)] === undefined){
      const resto = String(row.observacao || '').split(' | ').filter(t => t && t !== 'Erro de cálculo de arredondamento');
      row.observacao = valorObsV71(chaveObsV71(row), resto.join(' | '), 'icms');
    }
    return row;
  });
  OBS_VAL.validacao_base_icms += ' Uso e consumo (IPI incluso na base de ICMS do XML, CFOP 1xxx, 2xxx, 5xxx, 6xxx): base = produtos + IPI, com a redução do pRedBC.';

  /* ---------- demais abas de impostos: a mesma informação ---------- */
  const linhasIcmsStV89 = window.linhasIcmsSt;
  window.linhasIcmsSt = (...a) => linhasIcmsStV89(...a).map(row => comUsoConsumoV90(row, itemDaLinhaV90(row), 'cfop'));
  const linhasIpiV89 = window.linhasIpi;
  window.linhasIpi = (...a) => linhasIpiV89(...a).map(row => comUsoConsumoV90(row, row.__src, 'cfop_xml'));
  const linhasPisCofinsV89 = window.linhasPisCofins;
  window.linhasPisCofins = (...a) => linhasPisCofinsV89(...a).map(row => comUsoConsumoV90(row, row.__src, 'cfop_xml'));
  const linhaIbsCbsV89 = linhaIbsCbs;
  linhaIbsCbs = r => { const o = linhaIbsCbsV89(r); return o ? comUsoConsumoV90(o, o.__src || r, 'cfop_xml') : o; };
