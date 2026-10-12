  /* =====================================================================
     V89 — Notas de serviço (NFS-e) em XML e PDF
     - Carga: aceita .pdf além de .xml/.txt. PDF de NFS-e é lido no próprio
       navegador (pdf.js 3.11.174 embutido, sem internet) com o leitor de
       NFS-e do Motor de Cálculo (DANFSe nacional v2.0 e layouts municipais).
       PDF de NF-e (DANFE) não é lido: use o XML da nota.
     - XML de NFS-e: padrão nacional (infNFSe/DPS) e ABRASF (InfNfse).
     - Aba Itens: coluna tipo_de_documento logo antes de arquivo_origem
       (NF-e modelo 55, NFC-e modelo 65, CT-e modelo 57, NFS-e).
     - Aba ISS (antes da aba ICMS): dados da NFS-e — número, emissão, emitente,
       destinatário, municípios, código do serviço, NBS, valor, dedução, ISS
       (alíquota, base, valor, retido), INSS, IR, CSLL e IBS/CBS.
     - Dashboard (antes do ICMS) e apresentação: resumo das notas de serviço.
     ===================================================================== */

  /* ---------- carga: XML, TXT e PDF ---------- */
  for (const id of ['files', 'folder']){ const el = $(id); if (el) el.setAttribute('accept', '.xml,.txt,.pdf,text/xml,text/plain,application/xml,application/pdf'); }
  const RE_ARQ_V89 = /\.(xml|txt|pdf)$/i;
  window.setFiles = function(fs){
    const recebidos = Array.from(fs || []);
    let novos = 0;
    for (const f of recebidos){
      if (!RE_ARQ_V89.test(String(f.name || ''))){ V14.naoXml++; continue; }
      const caminho = f.webkitRelativePath || f.__caminho || f.name, k = caminho + '|' + f.size + '|' + f.lastModified;
      if (V14.keys.has(k)) continue;
      V14.keys.add(k); state.files.push(f); novos++;
    }
    if (novos) V14.pendente = true;
    atualizarSelecao();
    if (!state.files.length){
      $('selected').textContent = recebidos.length ? 'Nenhum XML, TXT ou PDF foi encontrado na seleção.' : 'Nenhuma pasta ou arquivo foi selecionado.';
      $('status').textContent = 'Selecione arquivos .xml, .txt (com XML) ou .pdf (NFS-e).'; $('status').className = 'status warn';
    }
    $('files').value = ''; $('folder').value = '';
  };

  /* ---------- PDF → linhas de texto (mesmo algoritmo do Motor) ---------- */
  const MARCA_PDF_V89 = '\u0000PDF-V89\u0000';
  async function linhasDoPdfV89(buf){
    if (!window.pdfjsLib) throw Error('Leitor de PDF indisponível nesta versão do arquivo.');
    const pdf = await window.pdfjsLib.getDocument({data: new Uint8Array(buf), isEvalSupported: false}).promise;   // isEvalSupported: false — proteção do pdf.js 3.x
    const linhas = []; let itensPagina1 = null;
    for (let p = 1; p <= pdf.numPages; p++){
      const page = await pdf.getPage(p), content = await page.getTextContent();
      const itens = content.items.map(it => ({str: it.str, x: it.transform[4], y: it.transform[5], font: it.fontName})).filter(it => it.str && it.str.trim() !== '');
      if (p === 1 && itens.length <= 5000) itensPagina1 = itens.map(i => ({str: i.str, x: Math.round(i.x * 100) / 100, y: Math.round(i.y * 100) / 100, font: i.font}));
      itens.sort((a, b) => (b.y - a.y) || (a.x - b.x));
      let cur = [], curY = null;
      for (const it of itens){
        if (curY === null || Math.abs(it.y - curY) <= 3){ cur.push(it); if (curY === null) curY = it.y; }
        else { linhas.push(cur.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()); cur = [it]; curY = it.y; }
      }
      if (cur.length) linhas.push(cur.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim());
      linhas.push('');
    }
    try { pdf.destroy(); } catch(e){}
    return {linhas, itens: itensPagina1};
  }
  const lerTextoV88 = lerTexto;
  lerTexto = async function(f){
    if (!/\.pdf$/i.test(String(f.name || ''))) return lerTextoV88(f);
    return MARCA_PDF_V89 + JSON.stringify(await linhasDoPdfV89(await f.arrayBuffer()));
  };

  /* ---------- NFS-e: campos normalizados (aba ISS) ---------- */
  const nV89 = v => v === null || v === undefined || v === '' ? 0 : num(String(v).replace(/R\$\s?/g, '').replace(/%/g, '').trim());
  const pctV89 = (valor, base) => base > 0.005 && valor > 0.005 ? arred(valor / base * 100) : 0;
  const simNaoV89 = v => { const t = String(v ?? '').trim().toLowerCase(); if (!t) return 'NÃO';
    if (/^(1|n[ãa]o|nao retido|não retido)/.test(t) || /n[ãa]o\s*retid/.test(t)) return 'NÃO';
    return /^(2|3|s|sim)/.test(t) || /retid/.test(t) ? 'SIM' : 'NÃO'; };
  // PDF: tira ':' e espaços que sobram dos rótulos ao lado do nome
  const limpaV89 = s => String(s || '').replace(/^[\s:;-]+|[\s:;-]+$/g, '').replace(/\s{2,}/g, ' ');
  function dadosNfseV89(f){
    const valor = nV89(f.valorServico), deducao = nV89(f.deducoes), inss = nV89(f.inssRetido), ir = nV89(f.irRetido), csll = nV89(f.csllRetido);
    const baseIbs = nV89(f.baseIBSCBS), aUf = nV89(f.aliqIBSUf), aMun = nV89(f.aliqIBSMun);
    let aliqIss = nV89(f.aliqISS); if (aliqIss > 0 && aliqIss < 0.3) aliqIss = arred(aliqIss * 100);   // ABRASF 1.0 informa 0,05 para 5%
    return {
      numero_nota: String(f.numeroNota || '').trim(), data_emissao: String(f.dataEmissao || '').trim(),
      cnpj_emitente: String(f.prestadorCNPJ || '').replace(/\D/g, ''), nome_emitente: limpaV89(f.prestadorNome),
      cnpj_destinatario: String(f.tomadorCNPJ || '').replace(/\D/g, ''), nome_destinatario: limpaV89(f.tomadorNome),
      municipio_emitente: limpaV89(f.prestadorMunicipio || f.municipioEmissor).replace(/\s+UF$/i, ''), municipio_destinatario: limpaV89(f.tomadorMunicipio).replace(/\s+UF$/i, ''),
      codigo_servico: String(f.codigoServico || f.codigoTribNacional || '').trim(), nbs: String(f.nbs || '').trim(), descricao_servico: String(f.descricaoServico || '').trim(),
      valor_servico: valor, deducao, aliquota_iss: aliqIss, base_iss: nV89(f.baseISS) || (nV89(f.valorISS) ? arred(valor - deducao) : 0), valor_iss: nV89(f.valorISS),
      iss_retido: simNaoV89(f.issRetido),
      base_inss: inss > 0.005 ? valor : 0, aliquota_inss: pctV89(inss, valor), valor_inss: inss,
      valor_ir: ir, aliquota_ir: pctV89(ir, valor), valor_csll: csll, aliquota_csll: pctV89(csll, valor),
      base_ibs: baseIbs, base_cbs: baseIbs, cst_ibs_cbs: String(f.cstIBSCBS || '').trim(), cclasstrib: String(f.cclasstrib || '').trim(),
      aliquota_ibs: arred(aUf + aMun), aliquota_cbs: nV89(f.aliqCBS),
      valor_ibs_estadual: nV89(f.valorIBSUf), valor_ibs_municipal: nV89(f.valorIBSMun), valor_cbs: nV89(f.valorCBS),
      chave: String(f.chaveAcesso || f.codigoVerificacao || '').trim()
    };
  }
  // leitura por nome local (qualquer prefixo de namespace)
  const tagsV89 = (el, nome) => el ? Array.from(el.getElementsByTagNameNS('*', nome)) : [];
  const tV89 = (el, nomes) => { for (const n of [].concat(nomes)){ const e = tagsV89(el, n)[0]; if (e && e.textContent.trim()) return e.textContent.trim(); } return ''; };
  const filhoV89 = (el, nome) => el ? Array.from(el.children).find(c => (c.localName || c.nodeName.split(':').pop()) === nome) || null : null;
  function nfseNacionalV89(doc){
    const inf = tagsV89(doc, 'infNFSe')[0] || doc.documentElement, dps = tagsV89(doc, 'infDPS')[0];
    const emit = filhoV89(inf, 'emit') || tagsV89(doc, 'emit')[0], prest = dps ? tagsV89(dps, 'prest')[0] : null, toma = tagsV89(doc, 'toma')[0];
    const valNfse = filhoV89(inf, 'valores'), serv = tagsV89(doc, 'serv')[0];
    const ibs = filhoV89(inf, 'IBSCBS') || tagsV89(doc, 'IBSCBS')[0];
    const tribIbs = dps ? tagsV89(dps, 'IBSCBS')[0] : null;
    return {
      numeroNota: tV89(inf, ['nNFSe']) || tV89(dps, ['nDPS']), dataEmissao: tV89(dps, ['dhEmi']) || tV89(inf, ['dhProc']),
      prestadorNome: tV89(emit, ['xNome']) || tV89(prest, ['xNome']), prestadorCNPJ: tV89(emit, ['CNPJ', 'CPF']) || tV89(prest, ['CNPJ', 'CPF']),
      prestadorMunicipio: tV89(inf, ['xLocEmi']) || (tV89(emit, ['cMun']) ? 'IBGE ' + tV89(emit, ['cMun']) : ''),
      tomadorNome: tV89(toma, ['xNome']), tomadorCNPJ: tV89(toma, ['CNPJ', 'CPF', 'NIF']),
      tomadorMunicipio: tV89(toma, ['xMun', 'xCidade']) || (tV89(toma, ['cMun']) ? 'IBGE ' + tV89(toma, ['cMun']) : ''),
      codigoServico: [tV89(serv, ['cTribNac']), tV89(serv, ['cTribMun'])].filter(Boolean).join(' / '), nbs: tV89(serv, ['cNBS', 'NBS']), descricaoServico: tV89(serv, ['xDescServ']),
      valorServico: tV89(doc, ['vServ']), deducoes: tV89(doc, ['vDR']),
      aliqISS: tV89(valNfse, ['pAliqAplic']) || tV89(doc, ['pAliq']), baseISS: tV89(valNfse, ['vBC']), valorISS: tV89(valNfse, ['vISSQN']) || tV89(doc, ['vISSQN']),
      issRetido: tV89(doc, ['tpRetISSQN']),
      inssRetido: tV89(doc, ['vRetCP']), irRetido: tV89(doc, ['vRetIRRF']), csllRetido: tV89(doc, ['vRetCSLL']),
      cstIBSCBS: tV89(tribIbs || ibs, ['CST']), cclasstrib: tV89(doc, ['cClassTrib']), baseIBSCBS: tV89(ibs, ['vBC']) || tV89(tribIbs, ['vBC']),
      aliqIBSUf: tV89(ibs || doc, ['pIBSUF']), aliqIBSMun: tV89(ibs || doc, ['pIBSMun']), aliqCBS: tV89(ibs || doc, ['pCBS']),
      valorIBSUf: tV89(doc, ['vIBSUF']), valorIBSMun: tV89(doc, ['vIBSMun']), valorCBS: tV89(doc, ['vCBS']),
      chaveAcesso: (inf.getAttribute && (inf.getAttribute('Id') || '').replace(/\D/g, '')) || ''
    };
  }
  function nfseAbrasfV89(doc){
    const inf = tagsV89(doc, 'InfNfse')[0] || tagsV89(doc, 'infNfse')[0] || doc.documentElement;
    const prest = tagsV89(inf, 'PrestadorServico')[0] || tagsV89(inf, 'Prestador')[0], toma = tagsV89(inf, 'TomadorServico')[0] || tagsV89(inf, 'Tomador')[0];
    const serv = tagsV89(inf, 'Servico')[0], val = serv ? tagsV89(serv, 'Valores')[0] : null;
    const mun = el => tV89(el, ['Cidade', 'xMun', 'NomeMunicipio']) || (tV89(el, ['CodigoMunicipio']) ? 'IBGE ' + tV89(el, ['CodigoMunicipio']) : '');
    return {
      numeroNota: tV89(inf, ['Numero', 'NumeroNfse']), dataEmissao: tV89(inf, ['DataEmissao', 'DataEmissaoNfse']),
      prestadorNome: tV89(prest, ['RazaoSocial', 'NomeFantasia']), prestadorCNPJ: tV89(prest, ['Cnpj', 'CNPJ', 'Cpf']), prestadorMunicipio: mun(tagsV89(prest, 'Endereco')[0] || prest),
      tomadorNome: tV89(toma, ['RazaoSocial']), tomadorCNPJ: tV89(toma, ['Cnpj', 'CNPJ', 'Cpf']), tomadorMunicipio: mun(tagsV89(toma, 'Endereco')[0] || toma),
      codigoServico: [tV89(serv, ['ItemListaServico']), tV89(serv, ['CodigoTributacaoMunicipio'])].filter(Boolean).join(' / '), nbs: tV89(serv, ['CodigoNbs', 'NBS']),
      descricaoServico: tV89(serv, ['Discriminacao']),
      valorServico: tV89(val || serv, ['ValorServicos']), deducoes: tV89(val || serv, ['ValorDeducoes']),
      aliqISS: tV89(val || serv, ['Aliquota']), baseISS: tV89(val || serv, ['BaseCalculo']), valorISS: tV89(val || serv, ['ValorIss']),
      issRetido: tV89(serv, ['IssRetido']), inssRetido: tV89(val || serv, ['ValorInss']), irRetido: tV89(val || serv, ['ValorIr']), csllRetido: tV89(val || serv, ['ValorCsll']),
      codigoVerificacao: tV89(inf, ['CodigoVerificacao'])
    };
  }
  function itemNfseV89(file, f, origem){
    const d = dadosNfseV89(f);
    const chave = d.chave || ('NFSE-' + d.cnpj_emitente + '-' + d.numero_nota);
    const h = {arquivo_origem: file.name, pasta_origem: file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(0, -1).join('/') : '',
      tipo_documento: 'NFS-e', modelo: 'NFS-e', origem_documento: origem, chave_documento: chave, fonte_chave_documento: d.chave ? 'Chave/código do documento' : 'CNPJ do prestador + número',
      numero_documento: d.numero_nota, data_emissao: d.data_emissao, emitente_cnpj_cpf: d.cnpj_emitente, emitente_razao_social: d.nome_emitente,
      destinatario_cnpj_cpf: d.cnpj_destinatario, destinatario_razao_social: d.nome_destinatario, valor_total_documento: d.valor_servico};
    const r = Object.assign({}, h, {numero_item: 1, codigo_item: d.codigo_servico, descricao_item: d.descricao_servico || 'Serviço', valor_item: d.valor_servico, dados_nfse: d});
    return [[r], h];
  }

  /* ---------- parse: NFS-e (XML nacional/ABRASF e PDF) ---------- */
  const parseV88 = window.parse;
  window.parse = function(file, txt){
    if (typeof txt === 'string' && txt.startsWith(MARCA_PDF_V89)){
      if (!window.NFSE_MOTOR) throw Error('Leitor de NFS-e em PDF indisponível.');
      const pdf = JSON.parse(txt.slice(MARCA_PDF_V89.length)), linhas = pdf.linhas || [], texto = linhas.join('\n');
      if (!texto.trim()) throw Error('PDF sem texto (digitalizado como imagem): não é possível ler. Use o XML da nota.');
      const tipo = NFSE_MOTOR.detectarTipoPorTexto(texto);
      if (tipo !== 'servico'){
        if (tipo === 'transporte') throw Error('PDF de CT-e (DACTE) não é lido: use o XML do CT-e.');
        if (/DANFE|NOTA FISCAL ELETR[ÔO]NICA|CHAVE DE ACESSO/i.test(texto)) throw Error('PDF de NF-e (DANFE) não é lido: use o XML da nota.');
        throw Error('PDF não reconhecido como nota fiscal de serviço (NFS-e): envie o PDF da NFS-e ou o XML da nota.');
      }
      let f = NFSE_MOTOR.extractServicoPDF(texto, linhas);
      if (pdf.itens) f = NFSE_MOTOR.completarCamposNacionais(NFSE_MOTOR.aplicarDANFSeV2(f, NFSE_MOTOR.lerDANFSeV2PorPosicao(pdf.itens)));
      if (!f.numeroNota && !nV89(f.valorServico)) throw Error('PDF de NFS-e sem número nem valor do serviço reconhecidos.');
      return itemNfseV89(file, f, 'PDF');
    }
    if (typeof txt === 'string' && /<(?:\w+:)?(?:infNFSe|infDPS|InfNfse|infNfse|CompNfse)\b/.test(txt) && !/<(?:\w+:)?infNFe\b/.test(txt)){
      const doc = new DOMParser().parseFromString(txt, 'application/xml');
      if (doc.querySelector('parsererror')) throw Error('XML inválido');
      const nacional = tagsV89(doc, 'infNFSe').length || tagsV89(doc, 'infDPS').length;
      return itemNfseV89(file, nacional ? nfseNacionalV89(doc) : nfseAbrasfV89(doc), 'XML');
    }
    return parseV88(file, txt);
  };

  /* ---------- aba Itens: tipo_de_documento antes de arquivo_origem ---------- */
  const tipoDocV89 = r => {
    const t = String(r.tipo_documento || ''), m = String(r.modelo || '').trim();
    if (t === 'NFS-e') return 'NFS-e' + (r.origem_documento === 'PDF' ? ' (PDF)' : '');
    if (/CT-e/i.test(t)) return 'CT-e (modelo 57)';
    if (m === '65') return 'NFC-e (modelo 65)';
    if (m === '55' || /NF-e/i.test(t)) return 'NF-e (modelo 55)';
    return t || 'Não identificado';
  };
  const comTipoDocV89 = (row, src) => {
    if (!src) return row;
    const x = {}; let pos = false;
    for (const k of Object.keys(row)){ if (k === 'tipo_de_documento') continue; if (k === 'arquivo_origem'){ x.tipo_de_documento = tipoDocV89(src); pos = true; } x[k] = row[k]; }
    if (!pos) x.tipo_de_documento = tipoDocV89(src);
    for (const p of ['__idx', '__src']) if (row[p] !== undefined) Object.defineProperty(x, p, {value: row[p], enumerable: false, writable: true, configurable: true});
    return x;
  };
  const semObjetosV89 = row => { if (row && typeof row.dados_nfse === 'object') delete row.dados_nfse; return row; };
  const itensComIcmsV88 = window.linhasItensComIcms;
  window.linhasItensComIcms = function(){ const fonte = state.items; return itensComIcmsV88().map((row, i) => semObjetosV89(comTipoDocV89(row, fonte[i]))); };
  const itensVisaoV88 = linhasItensVisao;
  linhasItensVisao = function(lista){ return itensVisaoV88(lista).map((row, i) => semObjetosV89(comTipoDocV89(row, lista[i]))); };

  /* ---------- aba ISS ---------- */
  const COLS_ISS_V89 = ['numero_nota', 'data_emissao', 'nome_emitente', 'nome_destinatario', 'municipio_emitente', 'municipio_destinatario', 'codigo_servico', 'nbs',
    'valor_servico', 'deducao', 'aliquota_iss', 'base_iss', 'valor_iss', 'iss_retido', 'base_inss', 'aliquota_inss', 'valor_inss', 'valor_ir', 'aliquota_ir',
    'valor_csll', 'aliquota_csll', 'base_ibs', 'base_cbs', 'cst_ibs_cbs', 'cclasstrib', 'aliquota_ibs', 'aliquota_cbs', 'valor_ibs_estadual', 'valor_ibs_municipal', 'valor_cbs',
    'cnpj_emitente', 'cnpj_destinatario', 'descricao_servico'];
  window.linhasIss = () => semCanceladasV70(() => state.items.filter(r => r && r.dados_nfse).map(r => {
    const d = r.dados_nfse, x = {tipo_operacao: tipoOperacao(r), tipo_de_documento: tipoDocV89(r)};
    for (const c of COLS_ISS_V89) x[c] = d[c] ?? '';
    x.arquivo_origem = r.arquivo_origem || '';
    Object.defineProperty(x, '__src', {value: r, configurable: true, writable: true});
    return x;
  }));
  (function criarAbaIss(){
    if ($('iss')) return;
    const tabIcms = document.querySelector('.tab[data-tab="icms"]'), secIcms = $('icms'); if (!tabIcms || !secIcms) return;
    tabIcms.insertAdjacentHTML('beforebegin', '<button class="tab" data-tab="iss">ISS <span class="pill" id="issBadge"></span></button>');
    secIcms.insertAdjacentHTML('beforebegin', '<section id="iss" class="panel"><div class="card"><div class="actions"><button id="backIss" class="secondary">Carregar mais XMLs</button>'
      + '<span id="issInfo" class="hint">Nenhuma nota de serviço (NFS-e) processada.</span></div><p class="small" style="margin:6px 0 0">Notas de serviço (NFS-e) em XML (padrão nacional ou ABRASF) ou PDF. Alíquotas de INSS, IR e CSLL calculadas sobre o valor do serviço quando o documento informa só o valor retido.</p></div>'
      + '<div class="card" style="padding:0"><div id="issHScroll" class="horizontal-scroll"><div></div></div><div class="table-wrap" id="issWrap"><table id="issTable"><thead></thead><tbody><tr><td class="empty">Processe uma NFS-e (XML ou PDF) para consultar o ISS.</td></tr></tbody></table></div></div></section>');
    const t = document.querySelector('.tab[data-tab="iss"]');
    t.onclick = () => { document.querySelectorAll('.tab,.panel').forEach(x => x.classList.remove('active')); t.classList.add('active'); $('iss').classList.add('active'); renderAba('iss'); };
    const back = $('backIss'); if (back) back.onclick = () => document.querySelector('.tab[data-tab="load"]').click();
    // exportar em Excel (mesmo padrão da V45), respeitando os filtros da aba
    const barra = document.createElement('div'); barra.className = 'v45-bar';
    barra.innerHTML = '<button type="button" class="v45-btn" id="expIssV89">⬇ Exportar esta aba em Excel</button><span>Todas as linhas da aba, respeitando os filtros ativos.</span>'
      + '<button type="button" class="secondary v45-btn2" data-salvar>💾 Salvar diagnóstico completo</button>';
    $('iss').insertBefore(barra, $('iss').firstChild);
    $('expIssV89').onclick = () => {
      const rows = filtrarLinhas(linhasIss(), 'iss');
      if (!rows.length){ alert('Não há notas de serviço (NFS-e) nesta aba para exportar.'); return; }
      gerarXlsx('iss_' + sufixoArq() + '.xlsx', [['ISS', rows]]);
    };
  })();
  const renderAbaV88 = window.renderAba;
  window.renderAba = function(id){
    if (id === 'iss'){
      aplicarCfop(); renderTabelaFiscal('iss', linhasIss(), 'issInfo', 'Nenhuma nota de serviço (NFS-e) carregada.');
      const info = $('issInfo');   // a aba ISS não valida imposto: resumo sem contagem de NÃO VALIDADOS
      if (info) info.textContent = info.textContent.replace(/^Documentos analisados/, 'Notas de serviço').replace(/ · itens: [\d.]+/, '').replace(/ · itens NÃO VALIDADOS: [\d.]+/, '');
      return;
    }
    return renderAbaV88(id);
  };
  const badgesV88 = window.atualizarBadgesTributos;
  window.atualizarBadgesTributos = function(){ const r = badgesV88.apply(this, arguments); const b = $('issBadge'); if (b) b.textContent = linhasIss().length || ''; return r; };

  /* ---------- Dashboard e apresentação: resumo das NFS-e ---------- */
  const CAMPOS_RES_V89 = [['valor_servico', 'Valor dos serviços'], ['base_iss', 'Base ISS'], ['valor_iss', 'ISS'], ['iss_retido_valor', 'ISS retido'], ['valor_inss', 'INSS'],
    ['valor_ir', 'IR/IRRF'], ['valor_csll', 'CSLL'], ['base_ibs', 'Base IBS/CBS'], ['valor_ibs_estadual', 'IBS estadual'], ['valor_ibs_municipal', 'IBS municipal'], ['valor_cbs', 'CBS']];
  function resumoServicosV89(){
    const z = () => Object.fromEntries([['n', 0], ...CAMPOS_RES_V89.map(([k]) => [k, 0])]), R = {E: z(), S: z()};
    for (const r of linhasIss()){
      const lado = R[r.tipo_operacao === 'SAÍDAS' ? 'S' : 'E']; lado.n++;
      for (const [k] of CAMPOS_RES_V89) lado[k] += k === 'iss_retido_valor' ? (r.iss_retido === 'SIM' ? num(r.valor_iss) : 0) : num(r[k]);
    }
    R.T = z(); for (const k of Object.keys(R.T)) R.T[k] = R.E[k] + R.S[k];
    return R;
  }
  function quadroServicosV89(){
    const R = resumoServicosV89();
    let h = '<h3>Notas de serviço (NFS-e) — ISS, retenções e IBS/CBS</h3>';
    if (!R.T.n) return h + '<p class="subtle">Notas de serviço em XML (padrão nacional ou ABRASF) ou PDF.</p><div class="v50-vazio">Nenhuma nota de serviço (NFS-e) carregada.</div>';
    h += '<p class="subtle">' + fmtInt(R.T.n) + ' nota(s) de serviço · Entradas ' + fmtInt(R.E.n) + ' · Saídas ' + fmtInt(R.S.n) + '. Detalhe por nota na aba ISS.</p>'
      + '<div class="v33-scroll"><table class="dash-detail-table v89-serv"><thead><tr><th>Movimento</th><th>Notas</th>' + CAMPOS_RES_V89.map(([, t]) => '<th>' + t + '</th>').join('') + '</tr></thead><tbody>'
      + [['Entradas', R.E, ''], ['Saídas', R.S, ' class="v35-sai"'], ['Total', R.T, ' class="dash-total-row"']].map(([rot, o, cls]) => '<tr' + cls + '><td>' + rot + '</td><td>' + fmtInt(o.n) + '</td>'
          + CAMPOS_RES_V89.map(([k]) => '<td>' + brl(o[k]) + '</td>').join('') + '</tr>').join('')
      + '</tbody></table></div>';
    return h;
  }
  const renderDashImpostosV88 = renderDashImpostos;
  renderDashImpostos = function(){
    renderDashImpostosV88();
    const grid = document.querySelector('#dashboard .dash-tax-grid'); if (!grid) return;
    let c = $('dashServicos');
    if (!c){ c = document.createElement('div'); c.id = 'dashServicos'; c.className = 'dashboard-card dash-wide dash-tax-card'; }
    const primeiro = [...grid.querySelectorAll(':scope > .dashboard-card.dash-tax-card')].find(x => x !== c);   // ICMS RESUMO
    if (primeiro && c.nextElementSibling !== primeiro) primeiro.insertAdjacentElement('beforebegin', c);
    else if (!c.parentNode) grid.prepend(c);
    c.innerHTML = quadroServicosV89();
  };
  const dadosApresentacaoV88 = dadosApresentacao;
  dadosApresentacao = function(){
    const D = dadosApresentacaoV88();
    D.servicos = Object.assign(resumoServicosV89(), {campos: CAMPOS_RES_V89});
    return D;
  };
