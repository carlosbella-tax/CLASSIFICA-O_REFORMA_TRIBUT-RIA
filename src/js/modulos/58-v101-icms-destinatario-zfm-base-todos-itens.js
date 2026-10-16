  /* =====================================================================
     V101 — Aba ICMS (pedido de 16/10/2026)
     1. Colunas destinatario_municipio e destinatario_uf (as mesmas da aba
        Itens) logo depois de cnpj_destinatario.
     2. Destinatário na Zona Franca de Manaus / Amazônia Ocidental ou em Área
        de Livre Comércio — AM, AC, RO e RR (inclusive as ALC Tabatinga,
        Brasiléia, Epitaciolândia, Cruzeiro do Sul, Guajará-Mirim, Boa Vista e
        Bonfim) e, no Amapá, Macapá e Santana — em operação interestadual: a
        base de ICMS do XML (base_icms_xml) é a base correta, as validações
        ficam VALIDADO e a observação é "OPERAÇÃO COM ZFM" (o texto digitado
        pelo usuário continua prevalecendo). CFOP 6110 segue a V99.
     3. XML com mais de um item em que a base de ICMS de TODOS os itens foi
        lançada em um só item (ex.: NF-e 199): a base desse item é conferida
        com a soma dos itens da nota → VALIDADO, e ICMS = base do XML ×
        alíquota. Os demais itens recebem a observação de onde está a base.
     ===================================================================== */
  const TOL_V101 = 0.0501;
  const UF_ZFM_V101 = new Set(['AM', 'AC', 'RO', 'RR']);
  const ALC_AP_V101 = new Set(['MACAPA', 'SANTANA']);
  const normV101 = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  /* "MANAUS/AM" quando o destinatário está na ZFM/ALC; senão null. */
  function destinoZfmV101(r){
    if (!r) return null;
    const uf = normV101(r.destinatario_uf), mun = normV101(r.destinatario_municipio), ufE = normV101(r.emitente_uf);
    const naArea = UF_ZFM_V101.has(uf) || (uf === 'AP' && ALC_AP_V101.has(mun));
    if (!naArea || !uf || uf === ufE) return null;   // só operação interestadual
    return (r.destinatario_municipio ? String(r.destinatario_municipio).trim() + '/' : '') + uf;
  }
  function obsV101(row, texto, substituir){
    if (!('observacao' in row) || obsUsuarioV71('icms')[chaveObsV71(row)] !== undefined) return;
    const atual = String(row.observacao || '').split(' | ').filter(Boolean);
    const lista = substituir ? [texto] : atual.filter(t => t !== texto).concat(texto);
    row.observacao = valorObsV71(chaveObsV71(row), lista.join(' | '), 'icms');
  }

  const linhasIcmsV100 = window.linhasIcms;
  window.linhasIcms = (...a) => {
    const linhas = linhasIcmsV100(...a).map(row => {
      const r = row.__src;
      // 1. município e UF do destinatário depois do CNPJ
      const x = {};
      for (const k of Object.keys(row)){
        if (k === 'destinatario_municipio' || k === 'destinatario_uf') continue;
        x[k] = row[k];
        if (k === 'cnpj_destinatario'){ x.destinatario_municipio = (r && r.destinatario_municipio) || ''; x.destinatario_uf = (r && r.destinatario_uf) || ''; }
      }
      Object.defineProperty(x, '__src', {value: r, configurable: true, writable: true});
      return x;
    });

    // 3. base de todos os itens lançada em um só item da nota
    const porNota = new Map();
    for (const row of linhas){ const k = row.chave_nota_fiscal || row.numero_nota_fiscal; if (!porNota.has(k)) porNota.set(k, []); porNota.get(k).push(row); }
    for (const grupo of porNota.values()){
      if (grupo.length < 2) continue;
      const comBase = grupo.filter(row => arred(num(row.base_icms_xml)) > 0.005);
      if (comBase.length !== 1) continue;
      const row = comBase[0];
      if (!/^NÃO VALIDADO/.test(String(row.validacao_base_icms || '')) || (row.__src && ehZfmV99(null, row.__src))) continue;
      const baseXml = arred(num(row.base_icms_xml));
      const red = num(row.reducao_base_icms), f = red > 0 && red < 100 ? 1 - red / 100 : 1;
      const prodTodos = arred(grupo.reduce((s, g) => s + num(g.valor_total_produtos), 0));
      const cheioTodos = arred(grupo.reduce((s, g) => s + num(g.valor_total_produtos) - num(g.valor_desconto) + num(g.valor_frete) + num(g.valor_seguro) + num(g.valor_outras_despesas), 0));
      const comIpi = arred(cheioTodos + grupo.reduce((s, g) => s + num(g.valor_ipi), 0));
      const opcoes = [[cheioTodos, ''], [comIpi, ' + IPI'], [prodTodos, '']].map(([v, t]) => [arred(v * f), t, v]);
      const achou = opcoes.find(([v]) => Math.abs(baseXml - v) <= TOL_V101);
      if (!achou) continue;
      const nItens = grupo.length;
      const conta = grupo.map(g => brl(num(g.valor_total_produtos))).join(' + ') + (achou[1] ? achou[1] : '') + ' = ' + brl(achou[2]) + (f !== 1 ? ' × (1 − ' + brNumero(red, 2) + '%) = ' + brl(achou[0]) : '');
      row.validacao_base_icms = 'VALIDADO (base de ICMS de todos os ' + nItens + ' itens da nota lançada no item ' + row.numero_item + ': ' + conta + ')';
      if ('base_icms_calculada' in row) row.base_icms_calculada = 'VALIDADO';
      if ('base_correta_icms' in row) row.base_correta_icms = 0;
      if ('validacao_icms' in row && String(row.cst_icms || '').trim() !== '51'){
        const aliq = num(row.aliquota_icms), calc = arred(baseXml * aliq / 100), icmsXml = arred(num(row.valor_icms_xml)), okI = Math.abs(icmsXml - calc) <= TOL_V101;
        row.validacao_icms = okI ? 'VALIDADO' : 'NÃO VALIDADO (ICMS deve ser ' + brl(baseXml) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ')';
        if ('valor_correto_icms' in row) row.valor_correto_icms = okI ? 0 : calc;
      }
      obsV101(row, 'Base de ICMS de todos os itens da nota lançada neste item', false);
      for (const g of grupo) if (g !== row) obsV101(g, 'Base de ICMS deste item lançada no item ' + row.numero_item + ' (soma de todos os itens)', false);
    }

    // 2. destinatário na ZFM / ALC: base do XML é a correta → VALIDADO, "OPERAÇÃO COM ZFM"
    for (const row of linhas){
      const r = row.__src, destino = destinoZfmV101(r);
      if (!destino || ehZfmV99(row, r)) continue;
      const baseXml = arred(num(row.base_icms_xml)), icmsXml = arred(num(row.valor_icms_xml));
      const txt = 'VALIDADO (OPERAÇÃO COM ZFM — destinatário em ' + destino + ': base de ICMS do XML ' + brl(baseXml) + ' aceita, sem novo cálculo)';
      if ('validacao_base_icms' in row) row.validacao_base_icms = txt;
      if ('base_icms_calculada' in row) row.base_icms_calculada = baseXml;
      if ('base_correta_icms' in row) row.base_correta_icms = baseXml;
      if ('validacao_icms' in row) row.validacao_icms = 'VALIDADO (OPERAÇÃO COM ZFM — destinatário em ' + destino + ': ICMS do XML ' + brl(icmsXml) + ')';
      if ('valor_correto_icms' in row) row.valor_correto_icms = icmsXml;
      obsV101(row, 'OPERAÇÃO COM ZFM', true);
    }
    return linhas;
  };
  OBS_VAL.validacao_base_icms += ' Destinatário na ZFM/ALC (AM, AC, RO, RR; no AP, Macapá e Santana), operação interestadual: base do XML aceita, VALIDADO, observação OPERAÇÃO COM ZFM. Base de todos os itens lançada em um só item: conferida com a soma dos itens da nota.';
