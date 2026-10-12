  /* =====================================================================
     V82 — Regra única da base de PIS/COFINS (exceto importação, CFOP 3xxx):
       Base = vProd + vFrete + vSeg + vOutro − vDesc − vICMS − vICMSUFDest
     Vale para as CST tributadas 01, 02 e 50–56 (nas CST 50–56 só quando o
     XML traz base). Substitui as variações anteriores (valor dos produtos −
     ICMS; valor dos produtos no Simples/ICMS-ST; DIFAL só quando houvesse).
     Margem de R$ 0,05. Valor = base do XML × alíquota (base validada) ou
     base correta × alíquota; CST não tributada (04–09, 70–75) e por
     quantidade (03) seguem as regras anteriores.
     ===================================================================== */
  const CST_FORMULA_V82 = new Set(['01', '02', '50', '51', '52', '53', '54', '55', '56']);
  const MARGEM_V82 = 0.0501;
  function basePisFormulaV82(r, row){
    const g = t => num(campoGrupo(r, 'prod', t));
    const c = {vProd: num(row.valor_total_produtos !== undefined ? row.valor_total_produtos : r.valor_item), vFrete: g('vFrete'), vSeg: g('vSeg'), vOutro: g('vOutro'), vDesc: g('vDesc'),
      vICMS: num(row.valor_icms_xml), vICMSUFDest: valorGrupo(r, 'ICMSUFDest', 'vICMSUFDest')};
    c.base = arred(c.vProd + c.vFrete + c.vSeg + c.vOutro - c.vDesc - c.vICMS - c.vICMSUFDest);
    c.conta = 'vProd ' + brl(c.vProd) + ' + vFrete ' + brl(c.vFrete) + ' + vSeg ' + brl(c.vSeg) + ' + vOutro ' + brl(c.vOutro) + ' − vDesc ' + brl(c.vDesc)
      + ' − vICMS ' + brl(c.vICMS) + ' − vICMSUFDest ' + brl(c.vICMSUFDest) + ' = ' + brl(c.base);
    return c;
  }
  function pisCofinsFormulaV82(x){
    const r = x.__src; if (!r) return x;
    if (String(x.cfop_xml || r.cfop_xml || '').charAt(0) === '3') return x;   // importação: regra própria (V52/V59)
    let c = null;
    for (const [t, nome] of [['pis', 'PIS'], ['cofins', 'COFINS']]){
      const cst = String(x['cst_' + t] || '').padStart(2, '0'), kb = 'validacao_base_' + t, kv = 'validacao_valor_' + t;
      const bXml = arred(num(x['base_' + t + '_xml'])), vXml = arred(num(x['valor_' + t + '_xml'])), aliq = num(x['aliquota_' + t]);
      if (!CST_FORMULA_V82.has(cst)) continue;
      if (cst !== '01' && cst !== '02' && bXml <= 0.005) continue;           // CST de entrada sem base: regra anterior (V40)
      c = c || basePisFormulaV82(r, x);
      if (c.base < 0.05 && vXml <= 0.005){                                    // V67: base irrelevante sem valor
        x[kb] = 'VALIDADO (base de ' + nome + ' de ' + brl(c.base) + ', abaixo de R$ 0,05, e sem valor no XML — valor irrelevante)'; x['base_correta_' + t] = 0;
        x[kv] = x[kb]; x['valor_correto_' + t] = 0; continue;
      }
      const ok = Math.abs(bXml - c.base) <= MARGEM_V82;
      x[kb] = ok ? 'VALIDADO' + (Math.abs(bXml - c.base) > 0.005 ? ' (diferença de ' + brl(Math.abs(arred(bXml - c.base))) + ', dentro da margem de R$ 0,05)' : '')
        : 'NÃO VALIDADO (base de ' + nome + ' = ' + c.conta + ') diferença: ' + brl(arred(bXml - c.base));
      x['base_correta_' + t] = ok ? 0 : c.base;
      const usada = ok ? bXml : c.base, calc = arred(usada * aliq / 100), okV = Math.abs(vXml - calc) <= MARGEM_V82;
      x[kv] = okV ? 'VALIDADO' + (Math.abs(vXml - calc) > 0.005 ? ' (diferença de ' + brl(Math.abs(arred(vXml - calc))) + ', dentro da margem de R$ 0,05)' : '') : 'NÃO VALIDADO (valor de ' + nome + ' sobre a base ' + (ok ? 'do XML' : 'correta') + ': ' + brl(usada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ') diferença: ' + brl(arred(vXml - calc));
      x['valor_correto_' + t] = okV ? 0 : calc;
    }
    return x;
  }
  const linhasPisCofinsV81 = window.linhasPisCofins;
  window.linhasPisCofins = (...a) => linhasPisCofinsV81(...a).map(pisCofinsFormulaV82);
  OBS_VAL.validacao_base_pis = OBS_VAL.validacao_base_cofins = 'Base de PIS/COFINS = vProd + vFrete + vSeg + vOutro − vDesc − vICMS − vICMSUFDest (CST 01, 02 e 50–56), margem de R$ 0,05. Base abaixo de R$ 0,05 sem valor no XML: VALIDADO (valor irrelevante). Na importação, base = valor aduaneiro (art. 7º, I, Lei 10.865/2004).';
