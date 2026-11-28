/* =====================================================================
   V253 — Painel de Fornecedores e Impacto da Reforma
   - Fontes: XML (NF-e/NFC-e/CT-e/NFS-e), PDF (DANFE e DANFSe), SPED
     EFD ICMS/IPI e EFD Contribuições (texto de colunas fixas).
   - Aba Fornecedores: movimentação por CNPJ com regime tributário
     inferido (opSimpNac/CRT/CSOSN/0110 do SPED), consulta pública
     BrasilAPI e links de pesquisa em redes.
   - Aba Análise por NCM: movimentação por NCM/NBS com TIPI, anexo e
     efeito na reforma (LC 214/2025), alíquotas efetivas com redução
     única, cronograma IBS estadual/municipal/CBS 2026–2033 e semáforo
     de impacto com alerta de aplicação do RAD.
   - Processamento 100% local; consulta de CNPJ é a única chamada
     externa (cadastro público de CNPJ, V265), disparada ao abrir a aba Fornecedores.
   - Leituras usadas: Guia Prático EFD-Contribuições (RFB) e leiaute
     EFD ICMS/IPI — C100/C170/A100/A170/F100/0150/0200/0000/0110.
   ===================================================================== */
(function(){
'use strict';
if (window.V253_CARREGADO) return;
window.V253_CARREGADO = true;

/* ---------- helpers ---------- */
const $id = id => document.getElementById(id);
const soDigV253 = v => String(v || '').replace(/\D/g, '');
const numV253 = v => { let x = String(v ?? '').trim().replace(/[^0-9,.-]/g, ''); if (x.includes(',')) x = x.replace(/\./g, '').replace(',', '.'); const n = Number(x); return Number.isFinite(n) ? n : 0; };
const fmtCnpjV253 = v => {
  const d = soDigV253(v);
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return String(v || '');
};
const dtV253 = s => { const d = soDigV253(String(s || '')); if (d.length === 8){ const a = new Date(d.slice(4) + '-' + d.slice(2, 4) + '-' + d.slice(0, 2)); return isNaN(a.getTime()) ? String(s || '') : a.toISOString().slice(0, 10); } return String(s || ''); };
const pctV253 = v => Number.isFinite(Number(v)) ? brNumero(v, 2) + '%' : String(v || '—');
const escV253 = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const COD_MUN_UF_V253 = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'};

/* ---------- cronograma 2026–2033 (mesmos valores do cronograma padrão da V252) ---------- */
const V253 = {
  ANOS: [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033],
  CRONO: {cbs: [0.9, 11.3, 11.3, 11.3, 11.3, 11.3, 11.3, 11.3], ibsE: [0.1, 0.05, 0.05, 1.6, 3.2, 4.8, 6.48, 16.2], ibsM: [0, 0.05, 0.05, 0.25, 0.5, 0.75, 1, 2.5]}
};
(function carregarCronogramaV253(){
  try{
    const salva = JSON.parse(localStorage.getItem('classificador.v168.cronograma') || 'null');
    if (salva && salva.tabela){
      const pega = (rot, alvo) => { const arr = salva.tabela[rot]; if (Array.isArray(arr)) for (let i = 0; i < 8; i++) if (Number.isFinite(Number(arr[i]))) alvo[i] = Number(arr[i]); };
      pega('CBS (%)', V253.CRONO.cbs); pega('IBS Estadual (%)', V253.CRONO.ibsE); pega('IBS Municipal (%)', V253.CRONO.ibsM);
    }
  }catch(e){}
})();

/* ---------- referência fiscal por NCM/NBS (base embarcada da V252) ---------- */
const REF_V253 = new Map();
function refV253(tipo, codigo){
  const t = tipo === 'NBS' ? 'NBS' : 'NCM', cod = String(codigo || '').replace(/\D/g, '').padStart(t === 'NCM' ? 8 : 9, '0');
  const k = t + cod;
  if (REF_V253.has(k)) return REF_V253.get(k);
  let out = {tipo: t, codigo: cod, classe: '000001', cst: '000', reducao: null, anexo: '', fonte: 'Tributação integral (sem benefício na base)'};
  try{
    const lista = typeof window.classificadorReferenciaPortal === 'function' ? window.classificadorReferenciaPortal(t, cod) : [];
    const validos = (lista || []).filter(x => x && (!x.vinculo || x.vinculo.TipoPermissao !== 'VEDADO'));
    const melhor = validos.find(x => Number.isFinite(Number(x.classificacao && x.classificacao.PercRedIbs)) && Number(x.classificacao.PercRedIbs) > 0) || validos[0];
    if (melhor){
      const cl = melhor.classificacao || {}, v = melhor.vinculo || {};
      const rIbs = cl.PercRedIbs === undefined || cl.PercRedIbs === null || cl.PercRedIbs === '' ? null : Number(cl.PercRedIbs);
      const rCbs = cl.PercRedCbs === undefined || cl.PercRedCbs === null || cl.PercRedCbs === '' ? null : Number(cl.PercRedCbs);
      out = {tipo: t, codigo: cod, classe: cl.CodClassTrib || v.cClassTrib || '000001', cst: cl.Cst || v.cst || '000',
        reducao: rIbs !== null ? rIbs : (rCbs !== null ? rCbs : null),
        anexo: v.NroAnexo && v.NroItemAnexoLei ? 'LC 214/2025 — Anexo ' + v.NroAnexo + ', item ' + v.NroItemAnexoLei : '',
        fonte: v.Fonte || v.fonte || 'Base oficial embarcada'};
    } else if (t === 'NCM' && typeof window.classificadorReferenciaNcm === 'function'){
      const r = window.classificadorReferenciaNcm(cod);
      if (r){ out.anexo = r.anexo || ''; if (r.cclasstrib) out.classe = r.cclasstrib; if (r.cst) out.cst = r.cst; }
    }
  }catch(e){}
  REF_V253.set(k, out);
  return out;
}
function efeitoV253(tipo, codigo, linhaOrigem){
  /* 1ª escolha: motor oficial da V252 (redução única, anexo, artigo e fonte) */
  try{
    const eng = window.classificadorV252DadosEnquadramento;
    if (typeof eng === 'function'){
      const linha = linhaOrigem ? Object.assign({}, linhaOrigem) : (tipo === 'NBS' || tipo === 'SERVIÇO'
        ? {tipo_documento: 'NFS-e', dados_nfse: {codigo_servico: String(codigo || ''), nbs: tipo === 'NBS' ? String(codigo || '').replace(/(\d)(\d{4})(\d{2})(\d{2})/, '$1.$2.$3.$4') : ''}}
        : {tipo_documento: 'NF-e', ncm: String(codigo || '')});
      const d = eng(linha);
      if (d && d.status && d.status !== 'ANÁLISE NECESSÁRIA'){
        const legal = d.legais && d.legais[0];
        const numRed = d.reducao ? Number(String(d.reducao).replace('%', '').replace(',', '.')) : null;
        let texto;
        if (d.divergenciaMotor) texto = 'Motor e Classificador apontam anexos diferentes (' + d.divergenciaMotor.texto + '): revisão obrigatória, sem redução aplicada (V254).';
        else if (d.status === 'REVISÃO NECESSÁRIA') texto = 'Hipóteses distintas na base oficial: revisão obrigatória antes de aplicar alíquota efetiva (V252).';
        else if (numRed && numRed > 0) texto = 'Redução única de ' + d.reducao + ' aplicada a IBS e CBS: alíquota efetiva = alíquota × (1 − ' + d.reducao + '/100).';
        else if (numRed === 100) texto = 'Cesta de consumo — alíquota zero na LC 214/2025.';
        else texto = 'Tributação integral: sem redução identificada para este código na base embarcada (V252).';
        return {ref: {tipo, codigo: String(codigo || ''), classe: d.classe || '000001', cst: d.cst || '000', reducao: d.status === 'REVISÃO NECESSÁRIA' ? null : numRed,
          anexo: d.divergenciaMotor ? d.divergenciaMotor.texto : (legal ? (legal.anexo + (legal.artigo ? ' — art. ' + legal.artigo : '')) : ''), fonte: d.fonte || ''}, texto, revisao: d.status === 'REVISÃO NECESSÁRIA'};
      }
    }
  }catch(e){}
  /* 2ª escolha: referências do portal embarcadas */
  const r = refV253(tipo, codigo);
  let texto;
  if (r.reducao !== null && r.reducao > 0) texto = 'Redução única de ' + brNumero(r.reducao, 2) + '% aplicada a IBS e CBS: alíquota efetiva = alíquota × (1 − ' + brNumero(r.reducao, 2) + '%/100).';
  else if (/cesta/i.test(r.anexo + ' ' + r.fonte)) texto = 'Cesta de consumo — alíquota zero na LC 214/2025.';
  else if (/^000/.test(String(r.classe))) texto = 'Tributação integral: sem redução identificada para este código na base embarcada.';
  else texto = 'Enquadramento específico (cClassTrib ' + r.classe + '): confirmar redução aplicável com a TaxAdvice.';
  return {ref: r, texto, revisao: false};
}

/* ---------- alíquotas por ano e semáforo ---------- */
const idxAnoV253 = ano => Math.max(0, V253.ANOS.indexOf(Number(ano)));
function taxasAnoV253(indice, reducao){
  const f = reducao === null || reducao === undefined ? 1 : Math.max(0, 1 - reducao / 100);
  return {cbs: V253.CRONO.cbs[indice] * f, ibsE: V253.CRONO.ibsE[indice] * f, ibsM: V253.CRONO.ibsM[indice] * f};
}
function semaforoV253(atual, novo2033){
  if (!atual && !novo2033) return {rot: '—', cls: 'cinza', titulo: 'Sem carga comparável (nenhum PIS/COFINS/IPI destacado e nenhuma alíquota efetiva calculada).'};
  if (!atual && novo2033 > 0) return {rot: 'NEGATIVO', cls: 'vermelho', titulo: 'Item sem PIS/COFINS/IPI destacado na carga atual, mas com IBS/CBS efetivo calculado — verificar perda de isenção/benefício.'};
  const rel = atual ? (novo2033 - atual) / atual : 0;
  if (novo2033 < atual * 0.98) return {rot: 'FAVORÁVEL', cls: 'verde', titulo: 'Reforma reduz a carga estimada em ' + brNumero(Math.abs(rel) * 100, 2) + '% (2033 × carga atual destacada).'};
  if (novo2033 > atual * 1.02) return {rot: 'NEGATIVO', cls: 'vermelho', titulo: 'Reforma aumenta a carga estimada em ' + brNumero(rel * 100, 2) + '% (2033 × carga atual destacada).'};
  return {rot: 'NEUTRO', cls: 'amarelo', titulo: 'Diferença dentro da margem de ±2% entre a carga atual destacada e a carga reformada estimada.'};
}

/* ---------- SPED: EFD ICMS/IPI e EFD Contribuições ---------- */
function parseSpedV253(file, txt){
  const linhas = String(txt || '').split(/\r?\n/).filter(l => l.trim().startsWith('|'));
  if (!linhas.length) throw Error('SPED sem registros reconhecidos.');
  const recs = linhas.map(l => l.split('|'));
  const campo = (r, i, def) => (r && r[i] !== undefined && r[i] !== '' ? r[i] : (def || ''));
  const porReg = reg => recs.filter(r => r[1] === reg);
  /* 0000: CNPJ = primeiro campo de 14 dígitos; nome = primeiro campo com letras */
  let cnpj0000 = '', nome0000 = '', uf0000 = '';
  const r0000 = porReg('0000')[0] || [];
  for (let i = 2; i < r0000.length && i < 14; i++){
    const v = String(r0000[i] || '').trim();
    if (!cnpj0000 && /^\d{14}$/.test(soDigV253(v))) cnpj0000 = soDigV253(v);
    else if (!nome0000 && /[A-Za-zÀ-ÿ]{4,}/.test(v) && !/^\d/.test(v) && !/^\d{8}$/.test(v)) nome0000 = v;
    else if (/^[A-Z]{2}$/.test(v.toUpperCase())) uf0000 = v.toUpperCase();
  }
  const ehContrib = porReg('A100').length > 0 || porReg('F100').length > 0 || porReg('0110').length > 0;
  const map150 = new Map(); porReg('0150').forEach(r => {
    const codMun = soDigV253(campo(r, 8)).slice(0, 2);
    map150.set(campo(r, 2), {nome: campo(r, 3), cnpj: soDigV253(campo(r, 5) || campo(r, 6)), uf: COD_MUN_UF_V253[codMun] || ''});
  });
  const map200 = new Map(); porReg('0200').forEach(r => map200.set(campo(r, 2), {desc: campo(r, 4), ncm: soDigV253(campo(r, 10)).slice(0, 8), unid: campo(r, 7) || campo(r, 8)}));
  const reg110 = porReg('0110')[0] || [];
  const regimeDeclarante = campo(reg110, 2) === '1' ? 'Regime não cumulativo (competência) — indica Lucro Real no SPED'
    : campo(reg110, 2) === '2' ? 'Regime cumulativo (caixa) — indica Lucro Presumido no SPED' : '';
  const rows = [], docs = [];
  function docHeader(o){
    const h = {
      arquivo_origem: file.name, pasta_origem: file.webkitRelativePath ? String(file.webkitRelativePath).split('/').slice(0, -1).join('/') : '',
      tipo_documento: o.tipoDoc, fonte_chave_documento: o.chv ? 'Chave de acesso do registro ' + o.reg : 'Composição SPED (participante + número + série)',
      chave_documento: o.chv || ('SPED|' + o.codPart + '|' + o.num + '|' + o.ser),
      numero_documento: o.num, serie: o.ser, modelo: o.mod, data_emissao: dtV253(o.dt),
      emitente_cnpj_cpf: o.emit, emitente_razao_social: o.nomeEmit, emitente_uf: o.ufEmit,
      destinatario_cnpj_cpf: o.dest, destinatario_razao_social: o.nomeDest,
      valor_total_documento: o.vDoc
    };
    if (regimeDeclarante) h.regime_sped = regimeDeclarante;
    docs.push(h);
    return h;
  }
  if (ehContrib){
    /* EFD Contribuições: C100 (mercadorias) com C170, A100 (serviços) com A170, F100 (outras operações) */
    let hCorrente = null;
    for (const r of recs){
      const reg = r[1];
      if (reg === 'C100'){
        const sit = campo(r, 6);
        if (sit === '02'){ hCorrente = null; continue; }
        const part = map150.get(campo(r, 4)) || {};
        const entrada = campo(r, 2) === '0';
        hCorrente = docHeader({tipoDoc: 'SPED EFD Contribuições', reg: 'C100', chv: '', codPart: campo(r, 4), num: campo(r, 8), ser: campo(r, 7), mod: campo(r, 5),
          dt: campo(r, 9), vDoc: campo(r, 11),
          emit: entrada ? (part.cnpj || '') : cnpj0000, nomeEmit: entrada ? (part.nome || '') : nome0000, ufEmit: part.uf || '',
          dest: entrada ? cnpj0000 : (part.cnpj || ''), nomeDest: entrada ? nome0000 : (part.nome || '')});
      } else if (reg === 'C170' && hCorrente){
        const it = map200.get(campo(r, 3)) || {};
        rows.push(Object.assign({}, hCorrente, {
          numero_item: campo(r, 2), codigo_item: campo(r, 3), descricao_item: campo(r, 4) || it.desc || 'Item do SPED',
          ncm: it.ncm || '', cfop: campo(r, 11), unidade: it.unid || '', quantidade: campo(r, 5), valor_item: campo(r, 7),
          item_ICMS_CST: campo(r, 10), item_ICMS_vBC: campo(r, 12), item_ICMS_pICMS: campo(r, 13), item_ICMS_vICMS: campo(r, 14),
          item_PIS_CST: campo(r, 15), item_PIS_vBC: campo(r, 16), item_PIS_pPIS: campo(r, 17), item_PIS_vPIS: campo(r, 19),
          item_COFINS_CST: campo(r, 20), item_COFINS_vBC: campo(r, 21), item_COFINS_pCOFINS: campo(r, 22), item_COFINS_vCOFINS: campo(r, 23),
          observacao_item: 'Item lido do registro C170 do EFD Contribuições. NCM conforme cadastro 0200 do arquivo.'
        }));
      } else if (reg === 'A100'){
        const sit = campo(r, 5);
        if (sit === '02'){ continue; }
        const part = map150.get(campo(r, 4)) || {};
        const entrada = campo(r, 2) === '0';
        const h = docHeader({tipoDoc: 'SPED EFD Contribuições', reg: 'A100', chv: soDigV253(campo(r, 9)), codPart: campo(r, 4), num: campo(r, 8), ser: campo(r, 6), mod: 'SERV',
          dt: campo(r, 10), vDoc: campo(r, 12),
          emit: entrada ? (part.cnpj || '') : cnpj0000, nomeEmit: entrada ? (part.nome || '') : nome0000, ufEmit: part.uf || '',
          dest: entrada ? cnpj0000 : (part.cnpj || ''), nomeDest: entrada ? nome0000 : (part.nome || '')});
        h.__pendA = {bcPis: campo(r, 15), vPis: campo(r, 16), bcCof: campo(r, 17), vCof: campo(r, 18), iss: campo(r, 21), nfe: campo(r, 9), desc: campo(r, 4)};
      } else if (reg === 'A170'){
        const hPai = docs[docs.length - 1];
        const pend = hPai && hPai.__pendA;
        const it = map200.get(campo(r, 3)) || {};
        rows.push(Object.assign({}, hPai || {}, {
          numero_item: campo(r, 2), codigo_item: campo(r, 3) || (pend ? pend.desc : ''), descricao_item: campo(r, 4) || it.desc || 'Serviço do SPED (A170)',
          ncm: it.ncm || '', cfop: '', unidade: it.unid || '', quantidade: '', valor_item: campo(r, 5),
          item_PIS_CST: campo(r, 8), item_PIS_vBC: campo(r, 9) || (pend ? pend.bcPis : ''), item_PIS_pPIS: campo(r, 10), item_PIS_vPIS: campo(r, 11) || (pend ? pend.vPis : ''),
          item_COFINS_CST: campo(r, 12), item_COFINS_vBC: campo(r, 13) || (pend ? pend.bcCof : ''), item_COFINS_pCOFINS: campo(r, 14), item_COFINS_vCOFINS: campo(r, 15) || (pend ? pend.vCof : ''),
          observacao_item: 'Item do registro A170 (detalhamento da nota de serviço) do EFD Contribuições.'
        }));
        if (hPai && hPai.__pendA) delete hPai.__pendA;
      } else if (reg === 'F100'){
        rows.push(Object.assign({}, {
          arquivo_origem: file.name, pasta_origem: '', tipo_documento: 'SPED EFD Contribuições',
          chave_documento: 'SPED|F100|' + campo(r, 3) + '|' + campo(r, 4), fonte_chave_documento: 'Registro F100 (outras operações)',
          numero_documento: campo(r, 4) || campo(r, 5), data_emissao: dtV253(campo(r, 5)), emitente_cnpj_cpf: cnpj0000, emitente_razao_social: nome0000, emitente_uf: uf0000,
          valor_total_documento: campo(r, 6), regime_sped: regimeDeclarante
        }, {
          numero_item: 1, codigo_item: 'F100/' + campo(r, 4), descricao_item: 'Outras operações geradoras de PIS/COFINS (bloco F): ' + (campo(r, 19) || campo(r, 5)),
          valor_item: campo(r, 6),
          item_PIS_CST: campo(r, 7), item_PIS_vBC: campo(r, 8), item_PIS_pPIS: campo(r, 9), item_PIS_vPIS: campo(r, 10),
          item_COFINS_CST: campo(r, 11), item_COFINS_vBC: campo(r, 12), item_COFINS_pCOFINS: campo(r, 13), item_COFINS_vCOFINS: campo(r, 14),
          observacao_item: 'Operação do bloco F do EFD Contribuições (sem documento fiscal vinculante).'
        }));
      }
    }
  } else {
    /* EFD ICMS/IPI: C100 com CHV_NFE (campo 9), DT_DOC (10), VL_DOC (12) e C170 com ST/IPI/PIS/COFINS */
    let hCorrente = null;
    for (const r of recs){
      const reg = r[1];
      if (reg === 'C100'){
        const sit = campo(r, 6);
        if (sit === '02'){ hCorrente = null; continue; }
        const part = map150.get(campo(r, 4)) || {};
        const entrada = campo(r, 2) === '0';
        const chv = soDigV253(campo(r, 9));
        hCorrente = docHeader({tipoDoc: 'SPED EFD ICMS/IPI', reg: 'C100', chv: chv.length === 44 ? chv : '', codPart: campo(r, 4), num: campo(r, 8), ser: campo(r, 7), mod: campo(r, 5),
          dt: campo(r, 10), vDoc: campo(r, 12),
          emit: entrada ? (part.cnpj || '') : cnpj0000, nomeEmit: entrada ? (part.nome || '') : nome0000, ufEmit: part.uf || '',
          dest: entrada ? cnpj0000 : (part.cnpj || ''), nomeDest: entrada ? nome0000 : (part.nome || '')});
      } else if (reg === 'C170' && hCorrente){
        const it = map200.get(campo(r, 3)) || {};
        rows.push(Object.assign({}, hCorrente, {
          numero_item: campo(r, 2), codigo_item: campo(r, 3), descricao_item: campo(r, 4) || it.desc || 'Item do SPED',
          ncm: it.ncm || '', cfop: campo(r, 11), unidade: it.unid || '', quantidade: campo(r, 5), valor_item: campo(r, 7),
          item_ICMS_CST: campo(r, 10), item_ICMS_vBC: campo(r, 12), item_ICMS_pICMS: campo(r, 13), item_ICMS_vICMS: campo(r, 14),
          item_ICMS_vBCST: campo(r, 15), item_ICMS_vICMSST: campo(r, 17),
          item_IPI_CST: campo(r, 19), item_IPI_vBC: campo(r, 21), item_IPI_pIPI: campo(r, 22), item_IPI_vIPI: campo(r, 23),
          item_PIS_CST: campo(r, 24), item_PIS_vBC: campo(r, 25), item_PIS_pPIS: campo(r, 26), item_PIS_vPIS: campo(r, 28),
          item_COFINS_CST: campo(r, 29), item_COFINS_vBC: campo(r, 30), item_COFINS_pCOFINS: campo(r, 31), item_COFINS_vCOFINS: campo(r, 33),
          observacao_item: 'Item lido do registro C170 do SPED EFD ICMS/IPI. NCM conforme cadastro 0200 do arquivo.'
        }));
      }
    }
  }
  if (!rows.length){
    const h0 = docs[0] || {arquivo_origem: file.name, tipo_documento: ehContrib ? 'SPED EFD Contribuições' : 'SPED EFD ICMS/IPI', chave_documento: 'SPED|' + file.name, numero_documento: ''};
    rows.push(Object.assign({}, h0, {numero_item: 1, descricao_item: 'Documento SPED sem itens detalhados (C170/A170)', valor_item: h0.valor_total_documento || '',
      observacao_item: 'O SPED foi lido (0000, 0150, 0200 e documentos), mas não há itens detalhados. Cadastros e cabeçalhos foram preservados; itens não são inventados.'}));
  }
  return [rows, docs[0] || {arquivo_origem: file.name, tipo_documento: 'SPED', chave_documento: 'SPED|' + file.name, numero_documento: ''}];
}

/* ---------- DANFE (NF-e em PDF) — leitura parcial e honesta ---------- */
function lerDanfeV253(file, pdf){
  const linhas = pdf.linhas || [], texto = linhas.join('\n');
  if (!texto.trim()) throw Error('PDF sem texto (digitalizado como imagem).');
  const digitos = texto.replace(/\D/g, '');
  let chave = '';
  const mChaves = digitos.match(/35\d{42}/g);
  if (mChaves && mChaves.length){ chave = mChaves[0]; if (mChaves.length > 1) chave = mChaves.find(c => digitos.indexOf(c) < digitos.length / 2) || mChaves[0]; }
  if (chave.length !== 44){
    const m = texto.match(/CHAVE[\s\S]{0,600}?(\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/);
    if (m) chave = m[1].replace(/\D/g, '');
  }
  if (chave.length !== 44) throw Error('DANFE sem chave de acesso de 44 dígitos reconhecida. Use o XML da nota.');
  const dados = typeof window.dadosChaveNfe === 'function' ? window.dadosChaveNfe(chave) : {cnpj: chave.slice(6, 20), modelo: chave.slice(20, 22), serie: String(Number(chave.slice(22, 25))), numero: String(Number(chave.slice(25, 34)))};
  const cnpjEmit = soDigV253(dados.cnpj || '');
  const buscaCnpj = cnpjEmit.length === 14 ? cnpjEmit.slice(0, 2) + '.' + cnpjEmit.slice(2, 5) + '.' + cnpjEmit.slice(5, 8) + '/' + cnpjEmit.slice(8, 12) + '-' + cnpjEmit.slice(12) : '';
  let nomeEmit = '';
  if (buscaCnpj){
    for (let i = 0; i < linhas.length && !nomeEmit; i++){
      if (linhas[i].includes(buscaCnpj) || linhas[i].includes(cnpjEmit)){
        for (let j = i - 1; j >= Math.max(0, i - 4); j--){
          const t = linhas[j].trim();
          if (t.length >= 5 && !/\d{2}\.\d{3}/.test(t) && !/CHAVE|CNPJ|DANFE|ENTRADA|SA[ÍI]DA/i.test(t)){ nomeEmit = t.split(/\s{2,}/)[0].slice(0, 120); break; }
        }
      }
    }
  }
  const pegaValor = re => { const m = texto.match(re); return m ? numV253(m[1]) : 0; };
  const vNF = pegaValor(/VALOR TOTAL DA NOTA[\s\S]{0,80}?([\d.]{1,15},\d{2})/);
  const vICMS = pegaValor(/VALOR TOTAL DO ICMS[\s\S]{0,80}?([\d.]{1,15},\d{2})/);
  const vIPI = pegaValor(/VALOR TOTAL DO IPI[\s\S]{0,80}?([\d.]{1,15},\d{2})/);
  const linhasProd = linhas.filter(l => /\b\d{8}\b/.test(l) && /\b[1-6]\d{3}\b/.test(l) && /\d+,\d{2}/.test(l) && !/CHAVE|TOTAL|ICMS|CNPJ/i.test(l)).slice(0, 2000);
  const h = {
    arquivo_origem: file.name, pasta_origem: file.webkitRelativePath ? String(file.webkitRelativePath).split('/').slice(0, -1).join('/') : '',
    tipo_documento: 'NF-e/NFC-e', chave_documento: chave, fonte_chave_documento: 'Chave impressa no DANFE (PDF)',
    numero_documento: dados.numero || '', serie: dados.serie || '', modelo: dados.modelo || '55',
    emitente_cnpj_cpf: cnpjEmit, emitente_razao_social: nomeEmit || '',
    destinatario_cnpj_cpf: '', valor_total_documento: vNF || ''
  };
  const rows = [];
  linhasProd.forEach((l, i) => {
    const ncm = (l.match(/\b(\d{8})\b/) || [])[1] || '';
    const cfop = (l.match(/\b([1-6]\d{3})\b/) || [])[1] || '';
    const valores = l.match(/([\d.]+,\d{2})/g) || [];
    const desc = l.replace(/\b\d{8}\b/, '').replace(/\b[1-6]\d{3}\b/, '').replace(/[\d.,]+/g, ' ').replace(/\s+/g, ' ').trim();
    rows.push(Object.assign({}, h, {
      numero_item: i + 1, codigo_item: (l.split(/\s+/)[0] || '').slice(0, 30), descricao_item: desc || 'Item reconhecido no DANFE',
      ncm, cfop, valor_item: valores.length ? numV253(valores[valores.length - 1]) : '',
      observacao_item: 'Leitura parcial de DANFE em PDF (chave, emitente, NCM e CFOP reconhecidos por padrão). Confirme valores pelo XML; este não substitui o documento eletrônico.'
    }));
  });
  if (!rows.length){
    rows.push(Object.assign({}, h, {numero_item: 1, descricao_item: 'Documento lido do DANFE (PDF) sem itens reconhecíveis individualmente', valor_item: vNF || '',
      observacao_item: 'Chave, emitente (pela chave) e totais do DANFE foram lidos. Itens não são inventados; carregue o XML para análise por item.'}));
  }
  return [rows, h];
}

/* ---------- cadeia de parse ---------- */
const MARCA_PDF_V89 = '\u0000PDF-V89\u0000';
/* Predicado exposto para teste: DANFE de NF-e/NFC-e apenas — exclui NFS-e/DANFSe */
window.v253InterceptaDanfe = function(texto){
  const t = String(texto || '');
  const temSinalNfse = /NFS-?e|NOTA FISCAL DE SERVIÇO|DANFS-?e|PRESTAÇÃO DE SERVIÇOS|CÓDIGO DE VERIFICAÇÃO|CODIGO DE VERIFICACAO|ISS/i.test(t);
  const temSinalDanfe = /CHAVE DE ACESSO/i.test(t) && /DANFE|NOTA FISCAL ELETR[ÔO]NICA|MODELO 55|MODELO 65/i.test(t);
  return temSinalDanfe && !temSinalNfse;
};
const parseAntesV253 = window.parse;
window.parse = function(file, txt){
  try{
    if (typeof txt === 'string' && /^\s*HDR?\|/.test(txt)){ const out = parseSpedV253(file, txt); return out; }
    if (typeof txt === 'string' && txt.trimStart().startsWith('|0000|')){ const out = parseSpedV253(file, txt); return out; }
    if (typeof txt === 'string' && txt.startsWith(MARCA_PDF_V89)){
      const pdf = JSON.parse(txt.slice(MARCA_PDF_V89.length)), t = (pdf.linhas || []).join('\n');
      /* DANFE de NF-e apenas: exige CHAVE DE ACESSO e sinais de NF-e, exclui qualquer sinal de NFS-e
         (a DANFSe nacional imprime "NOTA FISCAL ELETRÔNICA DE SERVIÇO" e usa chave de 50 dígitos) */
      if (window.v253InterceptaDanfe(t)){
        try {
          const resultado = lerDanfeV253(file, pdf);
          const modelo = String((resultado[1] && resultado[1].modelo) || '');
          if (modelo === '55' || modelo === '65') return resultado;   /* só NF-e/NFC-e; demais modelos voltam ao fluxo padrão */
        } catch (e){ /* segue o tratamento padrão da V89 */ }
      }
    }
  }catch(e){ if (/SPED/.test(String(e.message || ''))) throw e; }
  return parseAntesV253(file, txt);
};

/* ---------- consulta pública de CNPJ (V265: várias bases, com nova tentativa) ---------- */
const CACHE_CNPJ_V253 = new Map();
let consultandoV253 = false;
async function consultarCnpjV253(cnpj){
  const d = soDigV253(cnpj);
  if (d.length !== 14) return null;
  const ant = CACHE_CNPJ_V253.get(d);
  if (ant && !ant.falha) return ant;
  CACHE_CNPJ_V253.set(d, {em_consulta: true});
  let out;
  try{ out = await window.classificadorV265.consultar(d); }
  catch(e){ out = {razao: '', fantasia: '', situacao: 'Consulta não concluída — a ferramenta tenta de novo', falha: true}; }
  out = out || {razao: '', fantasia: '', situacao: ''};
  out.tentativas = ((ant && ant.tentativas) || 0) + 1;
  CACHE_CNPJ_V253.set(d, out);
  return out;
}
async function consultarTodosV253(){
  if (consultandoV253) return;
  consultandoV253 = true;
  const redesenhar = () => { const ativo = document.querySelector('.tab.active'); if (ativo && ativo.dataset.tab === 'fornecedores') renderFornecedoresV253(); };
  try{
    /* até 3 passadas: a 2ª e a 3ª repetem só o que falhou por rede ou por limite de consultas */
    for (let passada = 0; passada < 3; passada++){
      const pendentes = [];
      fornecedoresCacheV253.forEach(x => { const d = soDigV253(x.cnpj), c = CACHE_CNPJ_V253.get(d); if (d.length === 14 && (!c || (c.falha && (c.tentativas || 0) < 3)) && !pendentes.includes(d)) pendentes.push(d); });
      if (!pendentes.length) break;
      if (passada) await new Promise(r => setTimeout(r, 4000));
      for (const d of pendentes.slice(0, 400)){
        const out = await consultarCnpjV253(d);
        redesenhar();
        if (!out || !out.guardado) await new Promise(r => setTimeout(r, 350));
      }
    }
  } finally { consultandoV253 = false; redesenhar(); }
}

/* ---------- regime tributário inferido ---------- */
const OPSIMPNAC_V253 = {'1': 'Não optante do Simples (Lucro Presumido ou Real)', '2': 'Optante — MEI', '3': 'Optante — ME/EPP (Simples Nacional)', '4': 'Optante — pendente de homologação'};
function regimeDoItemV253(r){
  const achar = (obj, fim) => { for (const k in obj){ if (k.endsWith(fim) && String(obj[k]).trim()) return String(obj[k]).trim(); } return ''; };
  const op = achar(r, 'opSimpNac');
  if (op) return 'Simples Nacional — opSimpNac ' + op + ': ' + (OPSIMPNAC_V253[op] || 'código não tabelado');
  const crt = achar(r, '_CRT') || achar(r, 'CRT');
  if (crt === '1' || crt === '2') return 'Simples Nacional (CRT ' + crt + ')';
  if (crt === '3') return 'Regime comum — Lucro Real ou Presumido (CRT 3)';
  if (window.taxPick){
    const csosn = taxPick(r, 'ICMS', 'CSOSN') || '';
    if (csosn && /^\d{3}$/.test(String(csosn))) return 'Simples Nacional (CSOSN ' + csosn + ')';
  }
  if (r.regime_sped) return 'Declarante do SPED: ' + r.regime_sped;
  return '';
}

/* ---------- agregação de fornecedores ---------- */
let fornecedoresCacheV253 = [];
function linhasFornecedoresV253(){
  const m = new Map, emp = soDigV253($id('cnpjEmpresa') ? $id('cnpjEmpresa').value : '');
  const reducoesV270 = new Map, i2033 = idxAnoV253(2033);
  state.items.forEach(r => {
    if (!r) return;
    const e = soDigV253(r.emitente_cnpj_cpf), d = soDigV253(r.destinatario_cnpj_cpf);
    let papel, cnpj, nome, uf, muni;
    if (emp && d === emp && e){ papel = 'Fornecedor'; cnpj = e; nome = r.emitente_razao_social || ''; uf = r.emitente_uf; muni = r.emitente_municipio; }
    else if (emp && e === emp && d){ papel = 'Cliente'; cnpj = d; nome = r.destinatario_razao_social || ''; uf = r.destinatario_uf; muni = r.destinatario_municipio; }
    else if (e && d && (!emp || (e !== emp && d !== emp))){ papel = 'Fornecedor'; cnpj = e; nome = r.emitente_razao_social || ''; uf = r.emitente_uf; muni = r.emitente_municipio; }
    else if (e){ papel = 'Fornecedor (emitente)'; cnpj = e; nome = r.emitente_razao_social || ''; uf = r.emitente_uf; muni = r.emitente_municipio; }
    else if (d){ papel = 'Cliente (destinatário)'; cnpj = d; nome = r.destinatario_razao_social || ''; uf = r.destinatario_uf; muni = r.destinatario_municipio; }
    else return;
    if (!cnpj) return;
    const k = cnpj + '|' + papel;
    const x = m.get(k) || {cnpj, nome, papel, docs: new Set, itens: 0, valor: 0, credito: 0, semCredito: 0, pis: 0, cofins: 0, ipi: 0, icms: 0, ibs: 0, cbs: 0, regimes: new Set, uf, muni};
    x.docs.add(r.chave_documento || r.numero_documento || r.arquivo_origem);
    x.itens++; x.valor += num(r.valor_item);
    x.pis += valorGrupo(r, 'PIS', 'vPIS'); x.cofins += valorGrupo(r, 'COFINS', 'vCOFINS');
    x.ipi += valorGrupo(r, 'IPI', 'vIPI'); x.icms += valorIcms(r, 'vICMS');
    x.ibs += valorGrupo(r, 'IBS', 'vIBS'); x.cbs += valorGrupo(r, 'CBS', 'vCBS');
    /* V270 — IBS/CBS de 2033 sobre o item, com a redução do enquadramento do NCM/NBS: base do crédito potencial */
    { const ncmI = soDigV253(r.ncm); let tp = '', cd = '';
      if (ncmI.length === 8){ tp = 'NCM'; cd = ncmI; }
      else if (/NFS/i.test(String(r.tipo_documento || ''))){
        const nbsI = r.dados_nfse && r.dados_nfse.nbs ? String(r.dados_nfse.nbs).replace(/\D/g, '') : '';
        if (nbsI.length >= 7){ tp = 'NBS'; cd = nbsI.padStart(9, '0'); } else if (r.codigo_item){ tp = 'SERVIÇO'; cd = String(r.codigo_item); }
      }
      let red = null;
      if (tp){ const kk = tp + cd; if (!reducoesV270.has(kk)) reducoesV270.set(kk, efeitoV253(tp, cd).ref.reducao); red = reducoesV270.get(kk); }
      const t = taxasAnoV253(i2033, red), vi = num(r.valor_item);
      x.credito += vi * (t.cbs + t.ibsE + t.ibsM) / 100; if (red !== null && red >= 100) x.semCredito += vi; }
    const reg = regimeDoItemV253(r); if (reg) x.regimes.add(reg);
    if (!x.uf && (r.emitente_uf || r.destinatario_uf)){ x.uf = uf; x.muni = muni; }
    m.set(k, x);
  });
  const total = [...m.values()].reduce((a, x) => a + x.valor, 0);
  fornecedoresCacheV253 = [...m.values()].map(x => {
    const c = CACHE_CNPJ_V253.get(soDigV253(x.cnpj));
    const emConsulta = c && c.em_consulta;
    return {
      papel: x.papel, cnpj: fmtCnpjV253(x.cnpj), nome_documento: x.nome || '',
      razao_social: c && c.razao ? c.razao : (emConsulta ? 'consultando…' : ''),
      nome_fantasia: c && c.fantasia ? c.fantasia : '',
      situacao: c && c.situacao ? c.situacao : (emConsulta ? 'consultando…' : ''),
      porte: c && c.porte ? c.porte : '', cnae: c && c.cnae ? c.cnae : '',
      pesquisa: window.classificadorV265 ? window.classificadorV265.resumo(c).join(' | ') : '',
      regime: [...x.regimes].join(' | ') || (window.classificadorV265 && window.classificadorV265.regime(c)) || 'Não identificado nos documentos',
      uf: x.uf || '', municipio: x.muni || '',
      notas: x.docs.size, itens: x.itens, valor_total: x.valor, participacao: total ? x.valor / total * 100 : 0,
      pis: x.pis, cofins: x.cofins, ipi: x.ipi, icms: x.icms, ibs: x.ibs, cbs: x.cbs,
      ibs_cbs_2033: x.credito, valor_aliquota_zero: x.semCredito
    };
  }).sort((a, b) => b.valor_total - a.valor_total);
  return fornecedoresCacheV253;
}

/* ---------- agregação por NCM/NBS ---------- */
let ncmCacheV253 = [];
function linhasNcmV253(){
  const m = new Map, emp = soDigV253($id('cnpjEmpresa') ? $id('cnpjEmpresa').value : '');
  state.items.forEach(r => {
    if (!r) return;
    const ehNfs = /NFS/i.test(String(r.tipo_documento || ''));
    const ncm = soDigV253(r.ncm);
    let chave, tipo, cod;
    if (ncm.length === 8){ chave = 'NCM ' + ncm; tipo = 'NCM'; cod = ncm; }
    else if (ehNfs){
      const nbs = r.dados_nfse && r.dados_nfse.nbs ? String(r.dados_nfse.nbs).replace(/\D/g, '') : '';
      if (nbs.length >= 7){ chave = 'NBS ' + nbs.padStart(9, '0'); tipo = 'NBS'; cod = nbs.padStart(9, '0'); }
      else if (r.codigo_item){ chave = 'SERVIÇO ' + r.codigo_item; tipo = 'SERVIÇO'; cod = r.codigo_item; }
      else return;
    } else return;
    const x = m.get(chave) || {chave, tipo, cod, desc: '', docs: new Set, forn: new Set, qtd: 0, valor: 0, pis: 0, cofins: 0, ipi: 0};
    if (!x.desc) x.desc = tipo === 'NCM' ? ((window.classificadorReferenciaNcm ? (window.classificadorReferenciaNcm(ncm) || {}).descricao : '') || '') : (tipo === 'NBS' ? 'Serviço (NBS)' : 'Serviço (código municipal)');
    x.docs.add(r.chave_documento || r.numero_documento || r.arquivo_origem);
    const em = soDigV253(r.emitente_cnpj_cpf);
    x.forn.add(em && em !== emp ? em : (soDigV253(r.destinatario_cnpj_cpf) || '—'));
    x.qtd += num(r.quantidade); x.valor += num(r.valor_item);
    x.pis += valorGrupo(r, 'PIS', 'vPIS'); x.cofins += valorGrupo(r, 'COFINS', 'vCOFINS'); x.ipi += valorGrupo(r, 'IPI', 'vIPI');
    m.set(chave, x);
  });
  ncmCacheV253 = [...m.values()].map(x => {
    const ef = efeitoV253(x.tipo, x.cod);
    const cargaAtual = x.pis + x.cofins + x.ipi;
    const t2033 = taxasAnoV253(idxAnoV253(2033), ef.ref.reducao);
    const novo2033 = x.valor * (t2033.cbs + t2033.ibsE + t2033.ibsM) / 100;
    const sem = semaforoV253(cargaAtual, novo2033);
    return {
      chave: x.chave, tipo: x.tipo, codigo: x.cod, descricao: x.desc,
      anexo: ef.ref.anexo || (x.tipo === 'NCM' ? 'Sem anexo específico na base' : 'Anexo VIII (serviços) — quando aplicável'),
      cclasstrib: ef.ref.classe, cst: ef.ref.cst, efeito: ef.texto,
      qtd: x.qtd, valor_total: x.valor, notas: x.docs.size, fornecedores: x.forn.size,
      pis: x.pis, cofins: x.cofins, ipi: x.ipi, carga_atual: cargaAtual,
      aliq_cbs_ef: t2033.cbs, aliq_ibsE_ef: t2033.ibsE, aliq_ibsM_ef: t2033.ibsM,
      novo_2033: novo2033, diferenca: novo2033 - cargaAtual,
      semaforo: sem.rot, semaforo_cls: sem.cls, semaforo_titulo: sem.titulo, reducao: ef.ref.reducao
    };
  }).sort((a, b) => b.diferenca - a.diferenca || b.valor_total - a.valor_total);
  return ncmCacheV253;
}
function timelineV253(row){
  const corpo = V253.ANOS.map((a, i) => {
    const t = taxasAnoV253(i, row.reducao), v = row.valor_total;
    const vcbs = v * t.cbs / 100, vie = v * t.ibsE / 100, vim = v * t.ibsM / 100;
    const marco = a === 2026 ? 'Fase de teste' : a === 2027 ? 'CBS integral — extinção PIS/COFINS' : a === 2028 ? 'CBS integral' : a === 2033 ? 'IBS integral — regime pleno' : 'Transição do IBS';
    return '<tr><td><b>' + a + '</b></td><td>' + pctV253(t.cbs) + '</td><td>' + brl(vcbs) + '</td><td>' + pctV253(t.ibsE) + '</td><td>' + brl(vie) + '</td><td>' + pctV253(t.ibsM) + '</td><td>' + brl(vim) + '</td><td>' + brl(vcbs + vie + vim) + '</td><td class="v253-obs">' + marco + '</td></tr>';
  }).join('');
  return '<table class="v253-timeline"><thead><tr><th>Ano</th><th>Alíq. CBS ef.</th><th>CBS</th><th>Alíq. IBS Est. ef.</th><th>IBS Estadual</th><th>Alíq. IBS Mun. ef.</th><th>IBS Municipal</th><th>Total IBS+CBS</th><th>Fase</th></tr></thead><tbody>' + corpo + '</tbody></table>';
}

/* ---------- abas ---------- */
/* V272 — exportação: todo valor numérico sai com duas casas decimais no padrão 0.000,00 (percentuais com %);
   contagens (notas, itens, códigos, fornecedores) continuam inteiras. */
const INTEIROS_EXPORT_V253 = new Set(['notas', 'itens', 'codigos', 'fornecedores']);
function formatarExportV253(rows){
  return (rows || []).map(r => { const o = {};
    for (const k in r){ const v = r[k];
      o[k] = typeof v === 'number' && Number.isFinite(v) && !INTEIROS_EXPORT_V253.has(k) ? brNumero(v, 2) + (/^(participacao|aliq_)/.test(k) ? '%' : '') : v; }
    return o; });
}
function criarAbaV253(){
  if ($id('fornecedores')) return;
  const tabIcms = document.querySelector('.tab[data-tab="icms"]'), secIcms = $id('icms');
  if (!tabIcms || !secIcms) return;
  tabIcms.insertAdjacentHTML('beforebegin', '<button class="tab" data-tab="fornecedores">Fornecedores <span class="pill" id="fornBadge"></span></button>'
    + '<button class="tab" data-tab="ncm2">Análise por NCM <span class="pill" id="ncmBadge2"></span></button>');
  secIcms.insertAdjacentHTML('beforebegin',
    '<section id="fornecedores" class="panel"><div class="card"><div class="actions"><b style="font-size:17px;color:var(--blue)">Movimentação de fornecedores e clientes (V253)</b>'
    + '<span class="hint">Consolidação por CNPJ de todas as fontes carregadas (XML, PDF, SPED EFD). Regime tributário inferido de opSimpNac/CRT/CSOSN e do registro 0110 do SPED. A pesquisa cadastral de cada CNPJ é feita ao abrir esta aba e traz situação, razão social e os dados da empresa; o que falhar por internet ou limite é repetido automaticamente.</span></div>'
    + '<div class="v253-filtros"><input type="search" id="v253FornBusca" placeholder="Pesquisar nome ou CNPJ"><select id="v253FornPapel"><option value="">Papel: todos</option><option value="Fornecedor">Fornecedores</option><option value="Cliente">Clientes</option></select>'
    + '<select id="v253FornRegime"><option value="">Regime: todos</option></select>'
    + '<button type="button" id="v253FornConsultar">Pesquisar empresas pelo CNPJ</button>'
    + '<button type="button" id="v253FornExportar" class="secondary">⬇ Exportar Excel</button></div>'
    + '<div id="v253FornInfo" class="hint" style="margin-top:6px">Nenhum documento processado.</div></div>'
    + '<div class="card" style="padding:0"><div class="table-wrap" style="max-height:560px"><table id="v253FornTable"><thead></thead><tbody><tr><td class="empty">Processe arquivos para ver a movimentação de fornecedores.</td></tr></tbody></table></div></div></section>'
    + '<section id="ncm2" class="panel"><div id="v253Rad"></div><div class="card"><div class="actions"><b style="font-size:17px;color:var(--blue)">Análise por NCM/NBS — efeitos da Reforma (V253)</b>'
    + '<span class="hint">Movimentação por NCM (e NBS/serviços), com TIPI, anexo da LC 214/2025, efeito na reforma, alíquotas efetivas com redução única, cronograma IBS estadual/municipal/CBS 2026–2033 e semáforo de impacto. Clique na linha para ver a linha do tempo ano a ano.</span></div>'
    + '<div class="v253-filtros"><input type="search" id="v253NcmBusca" placeholder="Pesquisar NCM, descrição ou anexo"><select id="v253NcmSemaforo"><option value="">Semáforo: todos</option><option value="NEGATIVO">Somente impacto negativo</option><option value="FAVORÁVEL">Somente favoráveis</option><option value="NEUTRO">Somente neutros</option></select>'
    + '<button type="button" id="v253NcmExportar" class="secondary">⬇ Exportar Excel</button></div>'
    + '<div id="v253NcmInfo" class="hint" style="margin-top:6px">Nenhum documento processado.</div></div>'
    + '<div class="card" style="padding:0"><div class="table-wrap" style="max-height:600px" id="v253NcmWrap"><table id="v253NcmTable"><thead></thead><tbody><tr><td class="empty">Processe arquivos para ver a análise por NCM.</td></tr></tbody></table></div></div>'
    + '<div class="card" id="v253NcmResumo" hidden></div></section>');
  const tF = document.querySelector('.tab[data-tab="fornecedores"]'), tN = document.querySelector('.tab[data-tab="ncm2"]');
  /* entradas no menu lateral V123 (mesmo padrão das abas de análise) */
  const side = $id('v123-sidebar');
  if (side){
    const ref = side.querySelector('[data-v123-key="ibs"]');
    const tpl = document.createElement('template');
    tpl.innerHTML = '<button class="v123-link" data-v123-tab="fornecedores" data-v123-key="fornecedores">Fornecedores e clientes<small data-v123-count="fornecedores">0</small></button>'
      + '<button class="v123-link" data-v123-tab="ncm2" data-v123-key="ncmanalise">Análise por NCM — Reforma<small data-v123-count="ncmanalise">0</small></button>';
    const nos = [...tpl.content.children];
    if (ref) nos.forEach(n => ref.after(n)); else if (side.querySelector('.v123-status')) nos.forEach(n => side.insertBefore(n, side.querySelector('.v123-status')));
  }
  const titulosV253 = {fornecedores: 'Fornecedores e clientes — movimentação e regime (V253)', ncm2: 'Análise por NCM/NBS — impacto da Reforma (V253)'};
  const ativa = t => { document.querySelectorAll('.tab,.panel').forEach(x => x.classList.remove('active')); t.classList.add('active'); $id(t.dataset.tab).classList.add('active'); renderAba(t.dataset.tab); const tt = $id('v123-title'); if (tt && titulosV253[t.dataset.tab]) tt.textContent = titulosV253[t.dataset.tab]; };
  tF.onclick = () => ativa(tF);
  tN.onclick = () => ativa(tN);
  ['v253FornBusca', 'v253FornPapel', 'v253FornRegime'].forEach(id => { const el = $id(id); if (el) el.addEventListener('input', renderFornecedoresV253); });
  ['v253NcmBusca', 'v253NcmSemaforo'].forEach(id => { const el = $id(id); if (el) el.addEventListener('input', renderNcmV253); });
  const bc = $id('v253FornConsultar'); if (bc) bc.onclick = () => { CACHE_CNPJ_V253.clear(); if (window.classificadorV265) window.classificadorV265.limparCache(); renderFornecedoresV253(); consultarTodosV253(); };
  const ef = $id('v253FornExportar'); if (ef) ef.onclick = () => {
    const p = planilhasFornV253();
    if (!p.length) return alert('Não há fornecedores para exportar.');
    gerarXlsx('FORNECEDORES_V253_' + (new Date()).toISOString().slice(0, 10) + '.xlsx', p);
  };
  const en = $id('v253NcmExportar'); if (en) en.onclick = () => {
    const p = planilhasNcmV253();
    if (!p.length) return alert('Não há análise de NCM para exportar.');
    gerarXlsx('ANALISE_NCM_V253_' + (new Date()).toISOString().slice(0, 10) + '.xlsx', p);
  };
}

/* V278 — as planilhas do Excel; a impressão em PDF usa as mesmas */
function planilhasFornV253(){
  const rows = fornecedoresCacheV253.map(x => Object.assign({}, x));
  return rows.length ? [['Fornecedores', formatarExportV253(rows)]] : [];
}
function planilhasNcmV253(){
  const cols = ['chave', 'descricao', 'anexo', 'efeito', 'cclasstrib', 'cst', 'qtd', 'valor_total', 'notas', 'fornecedores', 'carga_atual', 'aliq_cbs_ef', 'aliq_ibsE_ef', 'aliq_ibsM_ef', 'novo_2033', 'diferenca', 'semaforo'];
  const rows = ncmCacheV253.map(x => { const y = {}; cols.forEach(c => y[c] = x[c]); return y; });
  if (!rows.length) return [];
  const rs = resumoSemaforoV253(ncmCacheV253);
  const ex = explicacaoSemaforoV253(ncmCacheV253, rs);
  const comoLer = ex.geral.map(x => ({assunto: 'O que o resultado mostra', explicacao: x})).concat(ex.cores.map(x => ({assunto: x.semaforo, explicacao: x.texto})),
    ex.colunas.map(c => ({assunto: 'Coluna: ' + c[0], explicacao: c[1]})), ex.exemplo ? [{assunto: 'Exemplo de cálculo', explicacao: ex.exemplo}] : [], ex.avisos.map(x => ({assunto: 'Atenção ao interpretar', explicacao: x})));
  const resumo = rs.linhas.concat([rs.total]).map(x => ({semaforo: x.semaforo, o_que_significa: x.leitura, o_que_fazer: x.acao || '', codigos: x.codigos, valor_movimentado: x.valor_total, participacao: x.participacao, carga_atual: x.carga_atual, ibs_cbs_2033: x.novo_2033, diferenca_2033: x.diferenca}));
  return [['Análise por NCM', formatarExportV253(rows)], ['Resumo por semáforo', formatarExportV253(resumo)], ['Como ler o resumo', comoLer]];
}

function renderFornecedoresV253(){
  if (!state.items.length){ const i = $id('v253FornInfo'); if (i) i.textContent = 'Nenhum documento processado.'; return; }
  const rows = linhasFornecedoresV253();
  const busca = ($id('v253FornBusca') ? $id('v253FornBusca').value : '').toLowerCase();
  const papelF = $id('v253FornPapel') ? $id('v253FornPapel').value : '';
  const regimeF = $id('v253FornRegime') ? $id('v253FornRegime').value : '';
  const sel = $id('v253FornRegime');
  if (sel){
    const atuais = [...new Set(rows.map(r => r.regime))].filter(Boolean).sort();
    const atual = sel.value;
    sel.innerHTML = '<option value="">Regime: todos</option>' + atuais.map(r => '<option' + (r === atual ? ' selected' : '') + '>' + escV253(r) + '</option>').join('');
  }
  const vis = rows.filter(r =>
    (!papelF || r.papel.startsWith(papelF)) && (!regimeF || r.regime === regimeF) &&
    (!busca || (r.nome_documento + ' ' + r.razao_social + ' ' + r.nome_fantasia + ' ' + r.cnpj).toLowerCase().includes(busca)));
  const h = $id('v253FornTable').querySelector('thead'), b = $id('v253FornTable').querySelector('tbody');
  h.innerHTML = '<tr class="excel-header"><th>Papel</th><th>CNPJ</th><th>Nome no documento</th><th>Razão social (cadastro)</th><th>Nome fantasia</th><th>Situação cadastral</th><th>Regime tributário (inferido)</th><th>UF</th><th>Município</th><th>Notas</th><th>Itens</th><th>Valor total</th><th>Participação</th><th>PIS</th><th>COFINS</th><th>IPI</th><th>ICMS</th><th>IBS</th><th>CBS</th><th>Pesquisa da empresa</th></tr>';
  b.innerHTML = vis.slice(0, 400).map(r => {
    const q = encodeURIComponent((r.razao_social || r.nome_documento || r.cnpj) + ' ' + r.cnpj);
    return '<tr><td>' + escV253(r.papel) + '</td><td><b>' + escV253(r.cnpj) + '</b></td><td>' + escV253(r.nome_documento) + '</td><td>' + escV253(r.razao_social) + '</td><td>' + escV253(r.nome_fantasia) + '</td><td>' + escV253(r.situacao) + '</td><td>' + escV253(r.regime) + '</td><td>' + escV253(r.uf) + '</td><td>' + escV253(r.municipio) + '</td><td>' + r.notas + '</td><td>' + r.itens + '</td><td><b>' + brl(r.valor_total) + '</b></td><td>' + pctV253(r.participacao) + '</td><td>' + brl(r.pis) + '</td><td>' + brl(r.cofins) + '</td><td>' + brl(r.ipi) + '</td><td>' + brl(r.icms) + '</td><td>' + brl(r.ibs) + '</td><td>' + brl(r.cbs) + '</td><td class="v265-pesq">' + String(r.pesquisa || '').split(' | ').filter(Boolean).map(escV253).join('<br>') + '</td></tr>';
  }).join('') || '<tr><td class="empty" colspan="20">Nenhum fornecedor/cliente para os filtros selecionados.</td></tr>';
  $id('v253FornInfo').textContent = rows.length ? 'CNPJs distintos: ' + new Set(rows.map(r => r.cnpj)).size + '; vínculos: ' + rows.length + '; valor movimentado: ' + brl(rows.reduce((a, r) => a + r.valor_total, 0)) + '.' : 'Nenhum documento processado.';
  const badge = $id('fornBadge'); if (badge) badge.textContent = rows.length ? new Set(rows.map(r => r.cnpj)).size : '';
  if (window.classificadorV270) try{ window.classificadorV270.render(rows); }catch(e){}
}

/* V270 — resumo por semáforo: quantidade de códigos e valores somados de cada cor, com o total geral */
/* V276 — cada cor traz o que significa e o que fazer, em linguagem direta */
const ORDEM_SEMAFORO_V253 = [
  ['NEGATIVO', 'vermelho', 'A carga estimada de 2033 fica mais de 2% acima da atual, ou o item hoje não tem PIS, COFINS nem IPI destacados e passa a ter IBS e CBS.', 'Rever preço, margem e contratos e conferir se o código tem redução ou benefício aplicável.'],
  ['NEUTRO', 'amarelo', 'A carga estimada de 2033 fica até 2% acima ou abaixo da atual.', 'Acompanhar; sem ação imediata.'],
  ['FAVORÁVEL', 'verde', 'A carga estimada de 2033 fica mais de 2% abaixo da atual.', 'Confirmar o enquadramento que dá a redução antes de contar com o ganho.'],
  ['—', 'cinza', 'O item não tem PIS, COFINS nem IPI destacados e também não tem IBS e CBS calculados (alíquota zero, por exemplo).', 'Conferir o enquadramento do código.']];
function resumoSemaforoV253(rows){
  const total = {semaforo: 'TOTAL', cls: '', leitura: '', codigos: 0, valor_total: 0, carga_atual: 0, novo_2033: 0, diferenca: 0, participacao: 0};
  const linhas = ORDEM_SEMAFORO_V253.map(([rot, cls, leitura, acao]) => {
    const g = (rows || []).filter(r => r.semaforo === rot);
    const x = {semaforo: rot === '—' ? 'SEM COMPARAÇÃO' : rot, cls, leitura, acao, codigos: g.length, valor_total: 0, carga_atual: 0, novo_2033: 0, diferenca: 0, participacao: 0};
    g.forEach(r => { x.valor_total += Number(r.valor_total) || 0; x.carga_atual += Number(r.carga_atual) || 0; x.novo_2033 += Number(r.novo_2033) || 0; x.diferenca += Number(r.diferenca) || 0; });
    total.codigos += x.codigos; total.valor_total += x.valor_total; total.carga_atual += x.carga_atual; total.novo_2033 += x.novo_2033; total.diferenca += x.diferenca;
    return x;
  });
  linhas.forEach(x => { x.participacao = total.valor_total ? x.valor_total / total.valor_total * 100 : 0; });
  total.participacao = total.valor_total ? 100 : 0;
  return {linhas, total};
}
/* V276 — explicação do resumo: conclusão com os números da carga, exemplo de cálculo, significado das colunas e avisos */
function explicacaoSemaforoV253(rows, r){
  r = r || resumoSemaforoV253(rows);
  const t = r.total, i = idxAnoV253(2033), cbs = V253.CRONO.cbs[i], ibsE = V253.CRONO.ibsE[i], ibsM = V253.CRONO.ibsM[i], cheia = cbs + ibsE + ibsM;
  const sentido = t.diferenca > 0 ? 'aumento' : t.diferenca < 0 ? 'redução' : '';
  const geral = ['Foram analisados ' + t.codigos + ' código(s), com ' + brl(t.valor_total) + ' movimentados nos documentos carregados (entradas e saídas somadas).',
    'Hoje esses itens têm ' + brl(t.carga_atual) + ' de PIS, COFINS e IPI destacados. Em 2033 teriam ' + brl(t.novo_2033) + ' de IBS e CBS estimados: '
      + (sentido ? sentido + ' de ' + brl(Math.abs(t.diferenca)) + (t.carga_atual ? ' (' + pctV253(Math.abs(t.diferenca) / t.carga_atual * 100) + ')' : '') : 'sem diferença') + '.'];
  const cores = r.linhas.filter(x => x.codigos).map(x => {
    const base = x.codigos + ' código(s), ' + brl(x.valor_total) + ' movimentados (' + pctV253(x.participacao) + ' do total): ';
    const fim = x.semaforo === 'NEGATIVO' ? 'a carga estimada sobe ' + brl(Math.abs(x.diferenca)) + '.'
      : x.semaforo === 'FAVORÁVEL' ? 'a carga estimada cai ' + brl(Math.abs(x.diferenca)) + '.'
      : x.semaforo === 'NEUTRO' ? 'a carga praticamente não muda (diferença de ' + brl(x.diferenca) + ').'
      : 'sem tributo destacado hoje e sem IBS e CBS calculados.';
    return {semaforo: x.semaforo, cls: x.cls, texto: base + fim};
  });
  const comValor = (rows || []).filter(x => x.valor_total > 0 && x.novo_2033 > 0);
  const m = comValor.filter(x => x.semaforo === 'NEGATIVO')[0] || comValor[0];
  let exemplo = '';
  if (m){
    const ef = m.aliq_cbs_ef + m.aliq_ibsE_ef + m.aliq_ibsM_ef;
    exemplo = m.chave + ': ' + brl(m.valor_total) + ' movimentados × ' + pctV253(ef) + (m.reducao ? ' (alíquota de 2033 já com a redução de ' + pctV253(m.reducao) + ')' : ' (alíquota de 2033, sem redução)')
      + ' = ' + brl(m.novo_2033) + ' de IBS e CBS. Carga atual destacada: ' + brl(m.carga_atual) + '. Diferença: ' + brl(m.diferenca) + ', por isso o código está em ' + m.semaforo + '.';
  }
  const colunas = [
    ['Códigos', 'Quantidade de NCM, NBS ou serviços diferentes em cada cor.'],
    ['Valor movimentado', 'Soma do valor dos itens desses códigos, entradas e saídas juntas.'],
    ['Participação', 'Quanto esse valor representa do total movimentado.'],
    ['Carga atual (PIS+COFINS+IPI)', 'PIS, COFINS e IPI destacados nos documentos. ICMS e ISS não entram nesta conta.'],
    ['IBS+CBS 2033 estimado', 'Valor movimentado × alíquota de 2033 (CBS ' + pctV253(cbs) + ' + IBS estadual ' + pctV253(ibsE) + ' + IBS municipal ' + pctV253(ibsM) + ' = ' + pctV253(cheia) + '), já com a redução do enquadramento de cada código. Código em revisão entra sem redução.'],
    ['Diferença 2033', 'IBS+CBS 2033 estimado menos a carga atual. Valor positivo (vermelho) é carga maior; valor negativo (verde) é carga menor.']];
  const avisos = [
    'O IBS substitui o ICMS e o ISS, e esses dois tributos não estão na carga atual deste quadro. Por isso o aumento tende a aparecer maior do que o efeito real: para comparar a carga completa, some o ICMS e o ISS de hoje.',
    'É uma estimativa sobre o valor dos documentos carregados, sem descontar os créditos de IBS e CBS das compras. Não é apuração nem valor a recolher.',
    'Os totais consideram todos os códigos analisados; os filtros da pesquisa da tabela acima não mudam este quadro.'];
  return {geral, cores, exemplo, colunas, avisos};
}
function renderResumoSemaforoV253(rows){
  const box = $id('v253NcmResumo'); if (!box) return;
  if (!rows.length){ box.hidden = true; box.innerHTML = ''; return; }
  const r = resumoSemaforoV253(rows), e = explicacaoSemaforoV253(rows, r);
  const tr = (x, t) => '<tr' + (t ? ' class="v253-resumo-total"' : '') + '><td>' + (t ? '<b>TOTAL</b>' : '<span class="v253-semaforo ' + x.cls + '">' + x.semaforo + '</span>') + '</td><td class="v276-leitura">' + (t ? '' : escV253(x.leitura) + '<small><b>O que fazer:</b> ' + escV253(x.acao) + '</small>') + '</td><td class="v253-num">' + x.codigos + '</td><td class="v253-num">' + brl(x.valor_total) + '</td><td class="v253-num">' + pctV253(x.participacao) + '</td><td class="v253-num">' + brl(x.carga_atual) + '</td><td class="v253-num">' + brl(x.novo_2033) + '</td><td class="v253-num ' + (x.diferenca > 0 ? 'v253-neg' : 'v253-pos') + '"><b>' + brl(x.diferenca) + '</b></td></tr>';
  box.hidden = false;
  box.innerHTML = '<b style="font-size:15px;color:var(--blue)">Resumo por semáforo</b>'
    + '<p class="v276-intro">Este quadro soma, por cor do semáforo, todos os códigos dos documentos carregados e compara o tributo que eles carregam hoje com o que carregariam em 2033, quando a Reforma Tributária estiver completa.</p>'
    + '<div class="v276-conclusao"><b>O que o resultado mostra</b>' + e.geral.map(x => '<p>' + escV253(x) + '</p>').join('')
    + '<ul>' + e.cores.map(x => '<li><span class="v253-semaforo ' + x.cls + '">' + x.semaforo + '</span> ' + escV253(x.texto) + '</li>').join('') + '</ul></div>'
    + '<div class="table-wrap"><table id="v253NcmResumoTable"><thead><tr class="excel-header"><th>Semáforo</th><th>O que significa</th><th>Códigos</th><th>Valor movimentado</th><th>Participação</th><th>Carga atual (PIS+COFINS+IPI)</th><th>IBS+CBS 2033 estimado</th><th>Diferença 2033</th></tr></thead><tbody>'
    + r.linhas.map(x => tr(x, false)).join('') + tr(r.total, true) + '</tbody></table></div>'
    + '<div class="v276-ajuda"><div><b>Como ler cada coluna</b><dl>' + e.colunas.map(c => '<dt>' + escV253(c[0]) + '</dt><dd>' + escV253(c[1]) + '</dd>').join('') + '</dl>'
    + (e.exemplo ? '<p class="v276-exemplo"><b>Exemplo de cálculo.</b> ' + escV253(e.exemplo) + '</p>' : '') + '</div>'
    + '<div class="v276-avisos"><b>Atenção ao interpretar</b><ul>' + e.avisos.map(x => '<li>' + escV253(x) + '</li>').join('') + '</ul></div></div>';
}
function renderNcmV253(){
  if (!state.items.length){ const i = $id('v253NcmInfo'); if (i) i.textContent = 'Nenhum documento processado.'; return; }
  const rows = linhasNcmV253();
  const busca = ($id('v253NcmBusca') ? $id('v253NcmBusca').value : '').toLowerCase();
  const semF = $id('v253NcmSemaforo') ? $id('v253NcmSemaforo').value : '';
  const vis = rows.filter(r => (!semF || r.semaforo === semF) && (!busca || (r.chave + ' ' + r.descricao + ' ' + r.anexo + ' ' + r.efeito).toLowerCase().includes(busca)));
  const rad = $id('v253Rad');
  if (rad){
    const neg = rows.filter(r => r.semaforo === 'NEGATIVO');
    const perda = neg.reduce((a, r) => a + Math.max(0, r.diferenca), 0);
    rad.innerHTML = neg.length ? '<div class="v253-rad v253-rad-ativo"><b>Aplicação do RAD recomendada</b><span>' + neg.length + ' item(ns) com impacto negativo estimado — perda total de <b>' + brl(perda) + '</b> por período comparável (carga 2033 × carga atual destacada). Recomenda-se aplicar o RAD da Reforma Tributária.</span></div>'
      : rows.length ? '<div class="v253-rad v253-rad-ok"><b>Sem exposição negativa relevante</b><span>Nenhum item com impacto negativo acima da margem de ±2%. O RAD não é requerido por esta análise.</span></div>' : '';
  }
  renderResumoSemaforoV253(rows);
  const h = $id('v253NcmTable').querySelector('thead'), b = $id('v253NcmTable').querySelector('tbody');
  h.innerHTML = '<tr class="excel-header"><th>Código</th><th>Descrição (TIPI/base)</th><th>Anexo LC 214/2025</th><th>Efeito na reforma</th><th>cClassTrib ref.</th><th>CST ref.</th><th>Qtd.</th><th>Valor movimentado</th><th>Notas</th><th>Fornecedores</th><th>Carga atual (PIS+COFINS+IPI)</th><th>Alíq. CBS ef. 2033</th><th>Alíq. IBS Est. ef. 2033</th><th>Alíq. IBS Mun. ef. 2033</th><th>IBS+CBS 2033 estimado</th><th>Diferença 2033</th><th>Semáforo</th></tr>';
  b.innerHTML = vis.slice(0, 500).map(r =>
    '<tr class="v253-ncm-row v253-sem-' + r.semaforo_cls + '" data-v253-k="' + escV253(r.chave) + '"><td><b>' + escV253(r.chave) + '</b></td><td>' + escV253(r.descricao) + '</td><td>' + escV253(r.anexo) + '</td><td class="v253-efeito">' + escV253(r.efeito) + '</td><td>' + escV253(r.cclasstrib) + '</td><td>' + escV253(r.cst) + '</td><td>' + (r.qtd ? brNumero(r.qtd, 2) : '—') + '</td><td><b>' + brl(r.valor_total) + '</b></td><td>' + r.notas + '</td><td>' + r.fornecedores + '</td><td>' + brl(r.carga_atual) + '</td><td>' + pctV253(r.aliq_cbs_ef) + '</td><td>' + pctV253(r.aliq_ibsE_ef) + '</td><td>' + pctV253(r.aliq_ibsM_ef) + '</td><td>' + brl(r.novo_2033) + '</td><td class="' + (r.diferenca > 0 ? 'v253-neg' : 'v253-pos') + '"><b>' + brl(r.diferenca) + '</b></td><td><span class="v253-semaforo ' + r.semaforo_cls + '" title="' + escV253(r.semaforo_titulo) + '">' + r.semaforo + '</span></td></tr>'
  ).join('') || '<tr><td class="empty" colspan="17">Nenhum código para os filtros selecionados.</td></tr>';
  $id('v253NcmInfo').textContent = rows.length ? 'Códigos analisados: ' + rows.length + '; exibindo ' + Math.min(vis.length, 500) + '. Valor movimentado: ' + brl(rows.reduce((a, r) => a + r.valor_total, 0)) + '. Alíquotas efetivas aplicam a redução única sobre o cronograma 2026–2033.' : 'Nenhum documento processado.';
  b.querySelectorAll('.v253-ncm-row').forEach(tr => tr.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    const k = tr.dataset.v253K, row = ncmCacheV253.find(x => x.chave === k);
    if (!row) return;
    const aberto = tr.nextElementSibling && tr.nextElementSibling.classList.contains('v253-timeline-tr');
    document.querySelectorAll('.v253-timeline-tr').forEach(x => x.remove());
    if (!aberto){
      const t = document.createElement('tr'); t.className = 'v253-timeline-tr';
      t.innerHTML = '<td colspan="17"><div class="v253-timeline-wrap"><b>Linha do tempo ' + escV253(k) + ' — alíquotas efetivas e valores estimados (base ' + brl(row.valor_total) + ')</b>' + timelineV253(row) + '<p class="v253-obs">Cronograma padrão da V252 (CBS 11,30% de referência em 2027; transição do IBS até 2033). Alíquota efetiva = alíquota × (1 − redução/100). Carga atual = PIS + COFINS + IPI destacados nos documentos.</p></div></td>';
      tr.after(t);
    }
  }));
  const badge = $id('ncmBadge2'); if (badge) badge.textContent = rows.length ? rows.length : '';
}

/* ---------- integração com renderAba/badges ---------- */
const renderAbaV252 = window.renderAba;
window.renderAba = function(id){
  if (id === 'fornecedores'){ renderFornecedoresV253(); if (!consultandoV253) setTimeout(consultarTodosV253, 1500); return; }
  if (id === 'ncm2'){ renderNcmV253(); return; }
  return renderAbaV252(id);
};
const badgesV252 = window.atualizarBadgesTributos;
window.atualizarBadgesTributos = function(){
  const r = badgesV252.apply(this, arguments);
  try{
    const bf = $id('fornBadge'), bn = $id('ncmBadge2');
    if (bf) bf.textContent = state.items.length ? String(new Set(state.items.map(x => soDigV253(x.emitente_cnpj_cpf) || soDigV253(x.destinatario_cnpj_cpf)).filter(Boolean)).size) : '';
    if (bn) bn.textContent = state.items.length ? String(new Set(state.items.map(x => { const n = soDigV253(x.ncm); return n.length === 8 ? n : ''; }).filter(Boolean)).size) : '';
  }catch(e){}
  return r;
};

/* ---------- CSS ---------- */
const style = document.createElement('style');
style.textContent = [
  '.v253-filtros{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}',
  '.v253-filtros input[type=search]{flex:1;min-width:180px;padding:8px 10px;border:1px solid #c5d3df;border-radius:8px;font:inherit}',
  '.v253-filtros select{padding:8px;border:1px solid #c5d3df;border-radius:8px;font:inherit;max-width:340px}',
  '.v253-links{display:flex;gap:6px}',
  '.v265-pesq{min-width:340px;max-width:460px;white-space:normal!important;font-size:12px;line-height:1.5;color:#33475B}',
  '.v253-chip{padding:3px 9px;border-radius:999px;background:#e8f1f8;color:#164c78;font-size:11px;font-weight:700;text-decoration:none;border:1px solid #c5d3df;white-space:nowrap}',
  '.v253-chip:hover{background:#d4e6f3}',
  '.v253-rad{display:flex;gap:14px;align-items:center;padding:14px 18px;border-radius:10px;margin:0 0 12px;font-size:13px;flex-wrap:wrap}',
  '.v253-rad b{font-size:14px}',
  '.v253-rad-ativo{background:#fdecec;border:1px solid #e5b4b4;color:#8c1f1f}',
  '.v253-rad-ok{background:#eef7ee;border:1px solid #bcdcbc;color:#1f5c1f}',
  '.v253-semaforo{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap}',
  '.v253-semaforo.verde{background:#e2f4e2;color:#1c6b1c}.v253-semaforo.vermelho{background:#fde3e3;color:#8c1f1f}',
  '.v253-semaforo.amarelo{background:#fff3da;color:#8a5a06}.v253-semaforo.cinza{background:#eef2f5;color:#54636f}',
  '.v253-ncm-row{cursor:pointer}.v253-ncm-row:hover{background:#f4f8fb}',
  'tr.v253-sem-vermelho td:first-child{box-shadow:inset 4px 0 0 #d84a4a}',
  'tr.v253-sem-verde td:first-child{box-shadow:inset 4px 0 0 #4caf50}',
  '.v253-timeline-tr td{background:#f7fafc;padding:14px}',
  '.v253-timeline-wrap b{display:block;margin-bottom:8px;color:#123d60}',
  '.v253-timeline{width:100%;border-collapse:collapse;font-size:12px;background:#fff}',
  '.v253-timeline th,.v253-timeline td{border:1px solid #d8e2ea;padding:6px 8px;text-align:right}',
  '.v253-timeline thead th{background:#eaf1f7;color:#123d60}',
  '.v253-obs{font-size:11px;color:#54636f}',
  '.v253-neg{color:#a32020}.v253-pos{color:#1c6b1c}',
  '#v253NcmResumo .table-wrap{height:auto!important;min-height:0!important;max-height:none!important}#v253NcmResumoTable{width:100%}#v253NcmResumoTable th{white-space:normal!important}#v253NcmResumoTable td.v253-num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}#v253NcmResumoTable td{font-size:12px}#v253NcmResumoTable tr.v253-resumo-total td{font-weight:700;border-top:2px solid #8d8d8d;background:#f4f4f4}',
  '.v276-intro{margin:4px 0 10px;font-size:13px;line-height:1.5;color:#33475B}',
  '.v276-conclusao{margin:0 0 12px;padding:12px 14px;border:1px solid #C6C6C6;border-left:4px solid #123D60;background:#F4F7FA;font-size:13px;line-height:1.55;color:#182936}',
  '.v276-conclusao>b{display:block;margin-bottom:4px;color:#123D60}.v276-conclusao p{margin:0 0 4px}.v276-conclusao ul{margin:8px 0 0;padding:0;list-style:none}.v276-conclusao li{margin:5px 0}',
  '#v253NcmResumoTable{table-layout:auto!important;min-width:0!important;width:100%!important}#v253NcmResumoTable th,#v253NcmResumoTable td{padding-left:8px!important;padding-right:8px!important;min-width:0!important;width:auto!important}#v253NcmResumoTable th:nth-child(n+3){text-align:right!important}#v253NcmResumoTable td.v276-leitura{white-space:normal!important;min-width:230px;line-height:1.45}#v253NcmResumoTable td.v276-leitura small{display:block;margin-top:4px;font-size:11px;color:#54636f}',
  '.v276-ajuda{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-top:12px;font-size:12px;line-height:1.5;color:#33475B}.v276-ajuda>div{border:1px solid #C6C6C6;padding:12px 14px;background:#fff}.v276-ajuda b{color:#123D60}',
  '.v276-ajuda dl{margin:6px 0 0;display:grid;grid-template-columns:minmax(150px,auto) 1fr;gap:5px 12px}.v276-ajuda dt{font-weight:700;color:#182936}.v276-ajuda dd{margin:0}',
  '.v276-exemplo{margin:10px 0 0;padding-top:8px;border-top:1px solid #E0E0E0}.v276-avisos{border-left:4px solid #F1C21B!important}.v276-avisos ul{margin:6px 0 0;padding-left:18px}.v276-avisos li{margin:5px 0}',
  '@media(max-width:1100px){.v276-ajuda{grid-template-columns:1fr}}',
  '#v253FornTable td,#v253NcmTable td{font-size:12px}',
  '#v253FornTable td:nth-child(12),#v253NcmTable td:nth-child(8){white-space:nowrap}'
].join('');
document.head.appendChild(style);

criarAbaV253();
/* exposição para testes focados e uso avançado */
window.v253Semaforo = semaforoV253;
window.v253ResumoSemaforo = resumoSemaforoV253;
window.v276ExplicacaoSemaforo = explicacaoSemaforoV253;
window.V276_CARREGADO = true;
window.v253FormatarExport = formatarExportV253;
window.v253Planilhas = {ncm: planilhasNcmV253, fornecedores: planilhasFornV253, linhasFornecedores: () => fornecedoresCacheV253};
window.v253TaxasAno = taxasAnoV253;
window.v253Efeito = efeitoV253;
})();
