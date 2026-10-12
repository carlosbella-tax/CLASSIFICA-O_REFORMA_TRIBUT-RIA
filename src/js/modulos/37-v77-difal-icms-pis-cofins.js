  /* =====================================================================
     V77 — ICMS DIFAL (vICMSUFDest + vICMSUFRemet)
     - Abas ICMS e Base de PIS/COFINS: coluna valor_icms_difal logo após
       valor_icms_xml (na aba Base de IBS/CBS ela já fica após valor_icms, V76).
     - Base de PIS/COFINS: o ICMS DIFAL não compõe a base. Base = valor da
       operação − ICMS destacado − ICMS DIFAL (aceita também valor dos
       produtos − ICMS − DIFAL), margem de R$ 0,05; o valor de PIS/COFINS é
       conferido sobre a base do XML (base validada) ou sobre a base correta.
     - Base de IBS/CBS: DIFAL já excluído desde a V76.
     ===================================================================== */
  const CST_PC_TRIB_V77 = new Set(['01', '02', '50', '51', '52', '53', '54', '55', '56']);
  const comDifalV77 = row => {
    const r = row.__src; if (!r) return row;
    const difal = difalV76(r).difal, x = {};
    for (const k of Object.keys(row)){ if (k === 'valor_icms_difal') continue; x[k] = row[k]; if (k === 'valor_icms_xml') x.valor_icms_difal = difal; }
    if (!('valor_icms_difal' in x)) x.valor_icms_difal = difal;
    for (const p of ['__src', '__idx']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], configurable: true, writable: true});
    return x;
  };
  const linhasIcmsV76 = window.linhasIcms;
  window.linhasIcms = (...a) => linhasIcmsV76(...a).map(comDifalV77);

  function pisCofinsSemDifalV77(x){
    const r = x.__src, difal = num(x.valor_icms_difal); if (!r || difal <= 0.005) return x;
    const prod = num(x.valor_total_produtos), icms = num(x.valor_icms_xml);
    const bruto = prod + num(campoGrupo(r, 'prod', 'vFrete')) + num(campoGrupo(r, 'prod', 'vSeg')) + num(campoGrupo(r, 'prod', 'vOutro')) - num(campoGrupo(r, 'prod', 'vDesc'));
    const esp = arred(bruto - icms - difal), alt = arred(prod - icms - difal);
    for (const [t, nome] of [['pis', 'PIS'], ['cofins', 'COFINS']]){
      const cst = String(x['cst_' + t] || '').padStart(2, '0'), kb = 'validacao_base_' + t, kv = 'validacao_valor_' + t;
      if (!CST_PC_TRIB_V77.has(cst) || /Simples|importa/i.test(String(x[kb] || ''))) continue;
      const bXml = arred(num(x['base_' + t + '_xml'])), aliq = num(x['aliquota_' + t]), vXml = arred(num(x['valor_' + t + '_xml']));
      const ok = Math.abs(bXml - esp) <= 0.0501 || Math.abs(bXml - alt) <= 0.0501;
      x[kb] = ok ? 'VALIDADO (base = valor da operação − ICMS − ICMS DIFAL ' + brl(difal) + ')'
        : 'NÃO VALIDADO (base de ' + nome + ' deve ser o valor da operação − ICMS destacado − ICMS DIFAL: ' + brl(esp) + ') diferença: ' + brl(arred(bXml - esp));
      x['base_correta_' + t] = ok ? 0 : esp;
      const baseUsada = ok ? bXml : esp, calc = arred(baseUsada * aliq / 100), okV = Math.abs(vXml - calc) <= 0.0501;
      x[kv] = okV ? 'VALIDADO' : 'NÃO VALIDADO (valor de ' + nome + ' sobre a base ' + (ok ? 'do XML' : 'correta') + ': ' + brl(baseUsada) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ') diferença: ' + brl(arred(vXml - calc));
      x['valor_correto_' + t] = okV ? 0 : calc;
    }
    return x;
  }
  const linhasPisCofinsV76 = window.linhasPisCofins;
  window.linhasPisCofins = (...a) => linhasPisCofinsV76(...a).map(row => pisCofinsSemDifalV77(comDifalV77(row)));
  for (const k of ['validacao_base_pis', 'validacao_base_cofins']) if (OBS_VAL[k]) OBS_VAL[k] += ' O ICMS DIFAL (UF de destino) não compõe a base: base = valor da operação − ICMS − ICMS DIFAL.';
