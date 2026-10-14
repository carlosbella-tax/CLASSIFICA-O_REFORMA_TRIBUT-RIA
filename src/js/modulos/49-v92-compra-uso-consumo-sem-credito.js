  /* =====================================================================
     V92 — Compra de uso e consumo (IPI embutido na base de ICMS)
     Toda ENTRADA em que a base de ICMS do XML inclui o IPI é USO E CONSUMO
     (reconhecimento da V90, mais a variante produtos + frete + IPI):
     - CFOP da entrada: 1556 (fornecedor do estado, CFOP 5xxx/1xxx) ou 2556
       (interestadual, CFOP 6xxx/2xxx), qualquer que seja a correlação normal.
     - Sem crédito de nenhum imposto: nas abas ICMS, ICMS ST, IPI, Base de
       PIS/COFINS e Base de IBS/CBS todas as validações ficam VALIDADO e nada é
       recalculado (base/valor corretos = 0, calculados = VALIDADO).
     - Se a CST do XML daquele imposto for tributada (ou houver imposto
       destacado), a observação recebe "CST informado divergente do uso".
       O texto digitado pelo usuário continua prevalecendo.
     ===================================================================== */
  const OBS_CST_USO_V92 = 'CST informado divergente do uso';
  const MOTIVO_V92 = 'VALIDADO (uso e consumo — compra sem crédito do imposto; nada recalculado)';
  // V92: reconhece também base = produtos + frete + IPI (consumidor final)
  const usoConsumoV90base = usoConsumoV90;
  usoConsumoV90 = function(r){
    const uc = usoConsumoV90base(r); if (uc || !r || r.__ucV92 === false) return uc;
    let res = null;
    const cfop = String(r.cfop_xml || r.cfop || '').trim(), cst = String(cstGrupo(r, 'ICMS') || '').trim();
    const ipi = arred(valorGrupo(r, 'IPI', 'vIPI')), bc = arred(valorIcms(r, 'vBC')), frete = num(campoGrupo(r, 'prod', 'vFrete'));
    if (['1', '2', '5', '6'].includes(cfop.charAt(0)) && !SEM_BASE_ICMS.has(cst) && ipi > 0.0501 && bc > 0.005 && frete > 0.005){
      const prod = num(r.valor_item), red = valorIcms(r, 'pRedBC'), fator = red > 0 && red < 100 ? 1 - red / 100 : 1;
      const base = arred(arred(prod + frete + ipi) * fator), semIpi = arred(arred(prod + frete) * fator);
      if (Math.abs(bc - base) <= 0.0501 && Math.abs(bc - semIpi) > 0.0501) res = {cfop, prod, ipi, red, fator, cheia: arred(prod + ipi), base: arred(arred(prod + ipi) * fator), bc};
    }
    if (res){ try { Object.defineProperty(r, '__ucV90', {value: res, configurable: true, writable: true}); } catch(e){} }
    else { try { Object.defineProperty(r, '__ucV92', {value: false, configurable: true, writable: true}); } catch(e){} }
    return res;
  };
  const compraUsoConsumoV92 = r => !!r && tipoOperacao(r) === 'ENTRADAS' && !r.dados_nfse && !!usoConsumoV90(r);
  // V94: cfop_xml 5xxx → 1556, 6xxx → 2556, 7xxx → 3556
  const cfopUsoConsumoV92 = r => { const d = String(r.cfop_xml || r.cfop || '').trim().charAt(0); return d === '7' || d === '3' ? '3556' : d === '6' || d === '2' ? '2556' : '1556'; };

  /* ---------- CFOP 1556 / 2556 nas entradas de uso e consumo ---------- */
  const aplicarCfopV91 = aplicarCfop;
  aplicarCfop = function(){
    const x = aplicarCfopV91.apply(this, arguments);
    for (const r of (itensTodosV70 || state.items)){
      if (!r || !('cfop_xml' in r) || !compraUsoConsumoV92(r)) continue;
      const c = cfopUsoConsumoV92(r);
      if (r.cfop !== c){ r.cfop = c; r.descricao_cfop = descCfop(c, r.cfop_xml); }
    }
    return x;
  };

  /* ---------- sem crédito: tudo VALIDADO + observação da CST ---------- */
  const zerarV92 = o => {
    for (const k of Object.keys(o)){
      if (k.startsWith('validacao_')) o[k] = MOTIVO_V92;
      else if (/^(valor|base)_corret/.test(k)) o[k] = 0;
      else if (/_calculad[ao]$/.test(k)) o[k] = 'VALIDADO';
    }
    return o;
  };
  const cfopLinhaV92 = (o, r) => { const c = cfopUsoConsumoV92(r); if ('cfop' in o){ o.cfop = c; if ('descricao_cfop' in o) o.descricao_cfop = descCfop(c, r.cfop_xml); } return o; };
  // observação automática: só a da CST (as demais observações automáticas não valem para item sem crédito)
  const obsV92 = (o, aba, tributado) => {
    if (!('observacao' in o)) return o;
    const k = chaveObsV71(o); if (obsUsuarioV71(aba)[k] !== undefined) return o;
    o.observacao = valorObsV71(k, tributado ? OBS_CST_USO_V92 : '', aba);
    return o;
  };
  const tribIcmsV92 = r => ['00', '10', '20', '51', '70', '90'].includes(String(cstGrupo(r, 'ICMS') || '').trim()) || valorIcms(r, 'vICMS') > 0.005;
  const tribIpiV92 = r => ['00', '50'].includes(String(cstGrupo(r, 'IPI') || '').trim().padStart(2, '0')) || valorGrupo(r, 'IPI', 'vIPI') > 0.005;
  const tribPcV92 = r => CST_TRIB_PC.has(String(cstGrupo(r, 'PIS') || '').trim()) || CST_TRIB_PC.has(String(cstGrupo(r, 'COFINS') || '').trim())
    || valorGrupo(r, 'PIS', 'vPIS') > 0.005 || valorGrupo(r, 'COFINS', 'vCOFINS') > 0.005;
  const tribIbsV92 = r => CST_TRIB_IBS.has(String(campoGrupo(r, 'IBS', 'CST') || '').trim()) || valorGrupo(r, 'IBS', 'vIBS') > 0.005 || valorGrupo(r, 'CBS', 'vCBS') > 0.005;
  const semCreditoV92 = (row, r, aba, trib) => compraUsoConsumoV92(r) ? obsV92(cfopLinhaV92(zerarV92(row), r), aba, trib(r)) : row;

  const linhasIcmsV91 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV91(...a).map(row => semCreditoV92(row, row.__src, 'icms', tribIcmsV92));
  const linhasIcmsStV91 = window.linhasIcmsSt;
  window.linhasIcmsSt = (...a) => linhasIcmsStV91(...a).map(row => semCreditoV92(row, itemDaLinhaV90(row), 'icmsst', tribIcmsV92));
  const linhasIpiV91 = window.linhasIpi;
  window.linhasIpi = (...a) => linhasIpiV91(...a).map(row => semCreditoV92(row, row.__src, 'ipi', tribIpiV92));
  const linhasPisCofinsV91 = window.linhasPisCofins;
  window.linhasPisCofins = (...a) => linhasPisCofinsV91(...a).map(row => semCreditoV92(row, row.__src, 'piscofins', tribPcV92));
  const linhaIbsCbsV91 = linhaIbsCbs;
  linhaIbsCbs = r => { const o = linhaIbsCbsV91(r); return o ? semCreditoV92(o, o.__src || r, 'ibscbs', tribIbsV92) : o; };

  const NOTA_V92 = ' Compra de uso e consumo (IPI embutido na base de ICMS): CFOP 1556/2556, sem crédito — sempre VALIDADO, nada recalculado; CST tributada no XML → observação "' + OBS_CST_USO_V92 + '".';
  for (const k of ['validacao_base_icms', 'validacao_ipi', 'validacao_base_pis', 'validacao_base_ibs_cbs']) if (OBS_VAL[k]) OBS_VAL[k] += NOTA_V92;
