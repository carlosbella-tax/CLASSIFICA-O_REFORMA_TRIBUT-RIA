  /* =====================================================================
     V55 — Base de IBS/CBS: componentes da base em colunas e nova fórmula
     Base = valor dos produtos/serviço + frete + seguro + juros + multa + outras despesas
            + desconto condicional + IS − desconto incondicional − ICMS − ISS − PIS − COFINS
     ===================================================================== */
  const somaTags = (r, tags) => { let s = 0; const ix = idx(r).tags; for (const t of tags){ const a = ix.get(t); if (a) for (const [, v] of a) s += num(v); } return s; };
  function componentesBase(r){
    const descCond = somaTags(r, ['VDESCCOND']), descIncXml = somaTags(r, ['VDESCINCOND']);
    const vDesc = num(campoGrupo(r, 'prod', 'vDesc'));
    return {
      valor_total: num(r.valor_item),
      cst_icms: cstGrupo(r, 'ICMS') || '', valor_icms: valorIcms(r, 'vICMS'),
      base_iss: valorGrupo(r, 'ISSQN', 'vBC') || somaTags(r, ['VBCISS', 'VBCISSQN']), valor_iss: somaTags(r, ['VISSQN', 'VISS']),
      cst_pis: cstGrupo(r, 'PIS') || '', valor_pis: valorGrupo(r, 'PIS', 'vPIS'),
      cst_cofins: cstGrupo(r, 'COFINS') || '', valor_cofins: valorGrupo(r, 'COFINS', 'vCOFINS'),
      cst_ipi: cstGrupo(r, 'IPI') || '', valor_ipi: valorGrupo(r, 'IPI', 'vIPI'),
      valor_frete: num(campoGrupo(r, 'prod', 'vFrete')), valor_desconto: vDesc,
      outras_despesas: num(campoGrupo(r, 'prod', 'vOutro')), valor_seguro: num(campoGrupo(r, 'prod', 'vSeg')),
      juros: somaTags(r, ['VJUROS']), multa: somaTags(r, ['VMULTA']),
      descontos_condicionais: descCond, desconto_incondicional: descIncXml || vDesc,
      imposto_seletivo_is: valorGrupo(r, 'IS', 'vIS')
    };
  }
  baseIbsArt12 = function(r){
    const c = componentesBase(r);
    return arred(c.valor_total + c.valor_frete + c.valor_seguro + c.juros + c.multa + c.outras_despesas + c.descontos_condicionais + c.imposto_seletivo_is
      - c.desconto_incondicional - c.valor_icms - c.valor_iss - c.valor_pis - c.valor_cofins);
  };
  const ibsV54 = linhaIbsCbs;
  linhaIbsCbs = function(r){
    const o = ibsV54(r), x = {}, c = componentesBase(r);
    for (const k of Object.keys(o)){
      x[k] = o[k];
      if (k === 'valor_total_produtos'){
        x.cst_icms = c.cst_icms; x.valor_icms = c.valor_icms; x.base_iss = c.base_iss; x.valor_iss = c.valor_iss;
        x.cst_pis = c.cst_pis; x.valor_pis = c.valor_pis; x.cst_cofins = c.cst_cofins; x.valor_cofins = c.valor_cofins;
        x.cst_ipi = c.cst_ipi; x.valor_ipi = c.valor_ipi; x.valor_frete = c.valor_frete; x.valor_desconto = c.valor_desconto;
        x.valor_outras_despesas = c.outras_despesas; x.valor_seguro = c.valor_seguro; x.valor_juros = c.juros; x.valor_multa = c.multa;
        x.valor_descontos_condicionais = c.descontos_condicionais; x.valor_desconto_incondicional = c.desconto_incondicional; x.valor_imposto_seletivo_is = c.imposto_seletivo_is;
      }
    }
    if (o.__src) Object.defineProperty(x, '__src', {value: o.__src, configurable: true, writable: true});
    return x;
  };
  linhaIbsCbs = memo(linhaIbsCbs);
  OBS_VAL.validacao_base_ibs_cbs = 'Base = valor dos produtos/serviço + frete + seguro + juros + multa + outras despesas + desconto condicional + IS − desconto incondicional − ICMS − ISS − PIS − COFINS. Com redução de alíquota, vale a base do XML.';
  (function(){
    const ul = [...document.querySelectorAll('#observacoes .v52-obs h3')].find(h => /7\. Base de cálculo do IBS/.test(h.textContent));
    const lista = ul && ul.nextElementSibling && ul.nextElementSibling.nextElementSibling;
    if (lista && lista.tagName === 'UL') lista.firstElementChild.innerHTML = 'No sistema: <b>Base de IBS/CBS = valor total dos produtos ou do serviço (+) frete (+) seguro (+) juros (+) multa (+) outras despesas (+) desconto condicional (+) Imposto Seletivo (−) descontos incondicionais (−) ICMS (−) ISS (−) PIS (−) COFINS</b>. Cada componente aparece em coluna própria na aba Base de IBS/CBS, logo após o valor total dos produtos. O resultado vai para base_correta_ibs_cbs quando a base do XML não confere (margem de R$ 0,02).';
  })();

