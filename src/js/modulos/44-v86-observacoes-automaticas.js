  /* =====================================================================
     V86 — Observações automáticas (o texto digitado pelo usuário sempre
     substitui o padrão; vários padrões no mesmo item são unidos por " | ").
     Base de PIS/COFINS — validacao_cst_pis "NÃO VALIDADO (CST 01 tributado,
     mas o XML não traz valor do imposto)":
       ICMS "Tributada integralmente" ......... "CST do XML como tributado,
                                                  porém sem valor do imposto"
       ICMS "Não tributada pelo Simples Nacional" "CST como tributado, mas deve
                                                  ser CST 99 (Outras Operações)"
     Base de IBS/CBS:
       base NÃO VALIDADA com diferença = PIS + COFINS → "Valor da base não
         deduziu o valor de PIS e da COFINS"
       cClassTrib divergente do candidato do NCM → validacao_cclasstrib e
         validacao_ncm_cclasstrib VALIDADO, observação "Analisar cClassTrib"
       bonificação (CFOP 5910/6910) com CST ou cClassTrib divergente →
         validacao_ncm_cclasstrib NÃO VALIDADO (vermelho), observação
         "Bonificação CST 410 cClassTrib 410999"
     ===================================================================== */
  const comObsPadraoV86 = (row, aba, textos) => {
    if (!textos.length || !('observacao' in row)) return row;
    const k = chaveObsV71(row), usuario = obsUsuarioV71(aba)[k];
    if (usuario !== undefined) return row;
    const atual = String(row.observacao || '').split(' | ').filter(Boolean);
    for (const t of textos) if (!atual.includes(t)) atual.push(t);
    row.observacao = valorObsV71(k, atual.join(' | '), aba);
    return row;
  };
  // Base de PIS/COFINS
  const RE_CST01_SEM_VALOR_V86 = /^NÃO VALIDADO \(CST 01 tributado, mas o XML não traz valor do imposto/;
  const linhasPisCofinsV85 = window.linhasPisCofins;
  window.linhasPisCofins = (...a) => linhasPisCofinsV85(...a).map(row => {
    if (!RE_CST01_SEM_VALOR_V86.test(String(row.validacao_cst_pis || ''))) return row;
    const d = String(row.descricao_cst_icms || '').trim().toLowerCase(), t = [];
    if (d.startsWith('tributada integralmente')) t.push('CST do XML como tributado, porém sem valor do imposto');
    else if (d.startsWith('não tributada pelo simples nacional')) t.push('CST como tributado, mas deve ser CST 99 (Outras Operações)');
    return comObsPadraoV86(row, 'piscofins', t);
  });
  // Base de IBS/CBS
  const linhaIbsCbsV85 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV85(r); if (!o) return o;
    const t = [];
    // base sem a dedução de PIS e COFINS
    const bc = typeof o.base_correta_ibs_cbs === 'number' ? o.base_correta_ibs_cbs : 0, pc = arred(num(o.valor_pis) + num(o.valor_cofins));
    if (bc > 0 && pc > 0.005 && /^(NÃO VALIDADO|INCORRETO)/.test(String(o.validacao_base_ibs_cbs || ''))
        && Math.abs(arred(num(o.base_ibs_cbs_xml) - bc) - pc) <= 0.0501) t.push('Valor da base não deduziu o valor de PIS e da COFINS');
    // cClassTrib divergente do candidato do NCM: VALIDADO, analisar
    if (/diverge do cClassTrib candidato/.test(String(o.validacao_cclasstrib || '') + String(o.validacao_ncm_cclasstrib || ''))){
      const cands = String(o.cclasstrib_candidato_capitulo || '').match(/\d{6}/g) || [];
      const txt = 'VALIDADO (cClassTrib ' + (o.cclasstrib || '') + ' do XML diferente do candidato do NCM: ' + cands.join(' / ') + '; analisar cClassTrib)';
      o.validacao_cclasstrib = txt; if ('validacao_ncm_cclasstrib' in o) o.validacao_ncm_cclasstrib = txt;
      t.push('Analisar cClassTrib');
    }
    // bonificação divergente
    const src = o.__src || r || {}, cfop = String(o.cfop_xml || src.cfop_xml || src.cfop || '').trim(), g = REGRA_POR_CFOP_V80.get(cfop);
    if (g && /bonificação/.test(g.nome)){
      const cst = String(o.cst_ibs_cbs || '').trim().padStart(3, '0'), cc = String(o.cclasstrib || '').trim();
      if (cst !== '410' || !g.codigos.includes(cc)){
        if ('validacao_ncm_cclasstrib' in o) o.validacao_ncm_cclasstrib = 'NÃO VALIDADO (CFOP ' + cfop + ' — bonificação: o XML traz CST ' + (o.cst_ibs_cbs || 'vazio') + ' e cClassTrib ' + (cc || 'vazio') + '; deve ser CST 410 e cClassTrib ' + g.codigos.join(' ou ') + ')';
        t.push('Bonificação CST 410 cClassTrib 410999');
      }
    }
    return comObsPadraoV86(o, 'ibscbs', t);
  };
