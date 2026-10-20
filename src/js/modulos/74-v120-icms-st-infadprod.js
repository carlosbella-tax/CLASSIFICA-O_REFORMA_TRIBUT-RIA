  /* =====================================================================
     V120 — Aba ICMS ST: base, alíquota e valor do ICMS ST preenchidos
     quando o XML não traz o grupo de ST (vBCST/pICMSST/vICMSST), caso
     típico do CST 60 (ST retido anteriormente):
       1º texto da descrição do item (infAdProd), ex.:
          "BC ICMS ST 134,28 pST 18.00% Vlr ICMS ST 15,72"
       2º campos de ST retido do XML (vBCSTRet, pST, vICMSSTRet).
     icms_proprio_xml sem valor recebe o ICMS próprio do substituto
     (vICMSSubstituto). Só o que é zero é preenchido; valores do grupo de ST
     do XML nunca são trocados.
     ===================================================================== */
  const numTextoV120 = s => { s = String(s || '').trim(); if (!s) return NaN; if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); return parseFloat(s); };
  const stDoTextoV120 = txt => {
    const t = String(txt || ''), pega = re => { const m = t.match(re); return m ? numTextoV120(m[1]) : NaN; };
    return {
      base: pega(/B(?:C|ASE)(?:\s+(?:DE|DO))?\s+ICMS[\s-]*ST\s*(?:R\$\s*)?:?\s*([\d.,]*\d)/i),
      aliq: pega(/\bp(?:ST|ICMSST)\s*:?\s*([\d.,]*\d)\s*%?/i),
      valor: pega(/(?:VLR|VALOR|V\.)\s*(?:DO\s+)?ICMS[\s-]*ST\s*(?:R\$\s*)?:?\s*([\d.,]*\d)/i)
    };
  };
  const vazioV120 = v => !(Math.abs(num(v)) > 0.000001);
  const preencherStV120 = row => {
    const r = row.__src; if (!r) return row;
    const t = stDoTextoV120(r.item_det_infAdProd || campoGrupo(r, 'det', 'infAdProd') || '');
    const ret = {base: num(row.base_st_retido), aliq: num(row.aliquota_st_retido) || num(valorSt(r, 'pST')), valor: num(row.valor_st_retido)};
    const escolhe = k => (isFinite(t[k]) ? t[k] : (ret[k] || 0));
    if (vazioV120(row.base_icms_st_xml) && vazioV120(row.valor_icms_st_xml)){
      row.base_icms_st_xml = arred(escolhe('base')); row.valor_icms_st_xml = arred(escolhe('valor'));
    }
    if (vazioV120(row.aliquota_icms_st)) row.aliquota_icms_st = escolhe('aliq');
    if (vazioV120(row.icms_proprio_xml) && 'icms_substituto' in row && !vazioV120(row.icms_substituto)) row.icms_proprio_xml = num(row.icms_substituto);
    return row;
  };
  const linhasIcmsStV119 = window.linhasIcmsSt;
  const copiaV120 = row => { const x = Object.assign({}, row); for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true}); return x; };
  window.linhasIcmsSt = (...a) => linhasIcmsStV119(...a).map(row => preencherStV120(copiaV120(row)));
