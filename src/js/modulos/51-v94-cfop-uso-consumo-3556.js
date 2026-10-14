  /* =====================================================================
     V94 — CFOP das entradas na aba Itens (e em todas as abas)
     - Entradas: cfop_xml 5xxx → 1xxx, 6xxx → 2xxx, 7xxx → 3xxx (regra da V17,
       mantida).
     - Compra de uso e consumo: cfop_xml 5xxx → 1556, 6xxx → 2556, 7xxx → 3556
       (o mapeamento fica em cfopUsoConsumoV92, módulo 49 — comentário V94).
     - O reconhecimento de uso e consumo (IPI na base de ICMS) passa a valer
       também para entradas com cfop_xml 7xxx.
     ===================================================================== */
  const usoConsumoV93 = usoConsumoV90;
  usoConsumoV90 = function(r){
    if (!r) return null;
    const c = String(r.cfop_xml || r.cfop || '').trim();
    if (c.charAt(0) !== '7' || tipoOperacao(r) !== 'ENTRADAS') return usoConsumoV93(r);
    if (r.__ucV94 !== undefined) return r.__ucV94;
    const copia = Object.assign({}, r, {cfop_xml: '5' + c.slice(1), cfop: '5' + c.slice(1)});
    const uc = usoConsumoV93(copia), res = uc ? Object.assign({}, uc, {cfop: c}) : null;
    try { Object.defineProperty(r, '__ucV94', {value: res, configurable: true, writable: true}); } catch(e){}
    return res;
  };
