/* Leitor de NFS-e (XML e PDF) portado do Motor de Cálculo Reforma Tributária — TaxAdvice.
   Gerado por tools/portar-nfse-motor.mjs a partir do commit do Motor: 37989db v4.0.0-beta.54: Dados dos produtos — base de PIS/COFINS sem ICMS (CST 60) = produto − desconto
   NÃO EDITAR À MÃO — altere no Motor e rode o script de novo. Uso interno TaxAdvice. */
window.NFSE_MOTOR = (function(){
"use strict";
/* ===== Motor · util/numero.js ===== */
/**
 * Motor de Cálculo Reforma Tributária — TaxAdvice
 * Núcleo · Conversão e formatação numérica (padrão brasileiro).
 *
 * USO EXCLUSIVO NO SERVIDOR. Propriedade da TaxAdvice — não distribuir.
 */

/* =========================================================================
   UTILITÁRIOS
   ========================================================================= */
function brNumToFloat(s){
  if (s===null||s===undefined) return null;
  s=String(s).trim(); if(s==='') return null;
  s=s.replace(/[^\d.,-]/g,''); if(s==='') return null;
  if (s.indexOf(',')!==-1) s=s.replace(/\./g,'').replace(',','.');
  const n=parseFloat(s); return isNaN(n)?null:n;
}

function fmtBRL(n){ return (n===null||n===undefined||isNaN(n)) ? '—' : n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

function fmtNum(n,dec){ return (n===null||n===undefined||isNaN(n)) ? '—' : n.toLocaleString('pt-BR',{minimumFractionDigits:dec||2,maximumFractionDigits:dec||2}); }

function fmtPct(n,dec){ return (n===null||n===undefined||isNaN(n)) ? '—' : n.toLocaleString('pt-BR',{minimumFractionDigits:dec||2,maximumFractionDigits:dec||2}) + '%'; }

function esc(s){ return (s===null||s===undefined) ? '' : String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function onlyDigits(s){ return (s||'').replace(/\D/g,''); }

function perto(a, b, tol){ return a !== null && b !== null && a !== undefined && b !== undefined && Math.abs(a-b) <= (tol ?? 0.02); }

/* Número do XML exibido no padrão brasileiro SEM arredondar nem calcular: "28938.47" → "28.938,47";
   "1.6500" → "1,6500". Vazio → vazio. */
function numeroXMLBR(s){
  if (s === null || s === undefined || s === '') return '';
  const m = String(s).trim().match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!m) return esc(String(s));
  return m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (m[3] !== undefined ? ','+m[3] : '');
}


/* ===== Motor · util/xml.js ===== */
/**
 * Motor de Cálculo Reforma Tributária — TaxAdvice
 * Núcleo · Leitura de nós XML independente de namespace.
 *
 * USO EXCLUSIVO NO SERVIDOR. Propriedade da TaxAdvice — não distribuir.
 */

function localName(el){ return el.tagName.includes(':') ? el.tagName.split(':').pop() : el.tagName; }

function getFirstTagText(root, tagNames){
  if (!root) return null;
  for (const name of tagNames){
    const els = root.getElementsByTagName(name);
    if (els.length && els[0].textContent.trim()!=='') return els[0].textContent.trim();
  }
  return null;
}

function getAllTagElements(root, tagName){ return root ? Array.from(root.getElementsByTagName(tagName)) : []; }

function findTagLike(root, regex){
  if (!root) return null;
  const all = root.getElementsByTagName('*');
  for (const el of all){ if (regex.test(localName(el)) && el.children.length===0 && el.textContent.trim()!=='') return el.textContent.trim(); }
  return null;
}

function findAllTagLike(root, regex){
  const out=[]; if(!root) return out;
  const all = root.getElementsByTagName('*');
  for (const el of all){ if (regex.test(localName(el)) && el.children.length===0 && el.textContent.trim()!=='') out.push(el.textContent.trim()); }
  return out;
}

/* =========================================================================
   EXTRAÇÃO — XML (NF-e modelo 55)
   ========================================================================= */
function firstElementChild(el){
  if (!el || !el.childNodes) return null;
  for (let i=0;i<el.childNodes.length;i++){ if (el.childNodes[i].nodeType===1) return el.childNodes[i]; }
  return null;
}

function filhosElemento(el){ const out = []; if (!el || !el.childNodes) return out; for (let i=0;i<el.childNodes.length;i++){ const c = el.childNodes[i]; if (c.nodeType===1) out.push(c); } return out; }

function nomeLocal(el){ return el.localName || String(el.nodeName).replace(/^.*:/,''); }


/* ===== Motor · extracao/danfe-pdf.js (só firstMatch) ===== */
function firstMatch(re, text){ const m = text.match(re); return m ? m[1].trim() : null; }

/* Lê tabelas do DANFE em que os rótulos ficam numa linha e os valores na linha seguinte
   (ex.: "BASE DE CÁLC. DO ICMS  VALOR DO ICMS ... V. TOTAL PRODUTOS" / "1.000,00 180,00 ...").
   Localiza cada rótulo pela posição na linha, ordena e associa ao N-ésimo número da próxima
   linha numérica — nunca mistura um valor com o do vizinho. */
const DANFE_ROTULOS = [
  ['baseICMSST', /BASE\s*(?:DE\s*)?C[ÁA]LC(?:ULO)?\.?\s*(?:DO\s*)?ICMS\s*(?:S\.?\s*T\.?|SUBST)/i],
  ['icmsST', /(?:VALOR|V\.)\s*(?:DO\s*)?ICMS\s*(?:S\.?\s*T\.?\b|SUBST)/i],
  ['baseICMS', /BASE\s*(?:DE\s*)?C[ÁA]LC(?:ULO)?\.?\s*(?:DO\s*)?ICMS/i],
  ['icmsUFRemet', /ICMS\s*UF\s*REMET/i],
  ['icmsUFDest', /ICMS\s*UF\s*DEST/i],
  ['fcp', /FCP/i],
  ['valorICMS', /(?:VALOR|V\.)\s*(?:DO\s*)?ICMS/i],
  ['vImport', /IMP(?:OSTO)?\.?\s*(?:DE\s*)?IMPORTA/i],
  ['valorPIS', /(?:VALOR|V\.)\s*(?:DO\s*)?PIS/i],
  ['valorCOFINS', /(?:VALOR|V\.)\s*(?:DA\s*)?COFINS/i],
  ['valorProdutos', /(?:VALOR|V\.)\s*TOTAL\s*(?:DOS\s*)?PRODUTOS/i],
  ['frete', /(?:VALOR|V\.)\s*(?:DO\s*)?FRETE/i],
  ['seguro', /(?:VALOR|V\.)\s*(?:DO\s*)?SEGURO/i],
  ['desconto', /DESCONTO/i],
  ['outras', /OUTRAS\s*DESP/i],
  ['valorIPI', /(?:VALOR|V\.)\s*(?:TOTAL\s*)?(?:DO\s*)?IPI/i],
  ['totTrib', /TOT(?:AL)?\.?\s*(?:APROX\.?\s*)?(?:DOS\s*)?TRIB/i],
  ['valorNota', /(?:VALOR|V\.)\s*TOTAL\s*DA\s*NOTA/i]
];

function lerTabelaDANFE(lines){
  const out = {};
  const numRe = /-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}/g;
  for (let i=0; i<lines.length; i++){
    const linha = lines[i];
    // Coleta rótulos (sem sobreposição: o primeiro padrão da lista, mais específico, vence).
    const usados = []; const achados = [];
    DANFE_ROTULOS.forEach(([key, re]) => {
      const r = new RegExp(re.source, 'gi'); let m;
      while ((m = r.exec(linha)) !== null){
        const ini = m.index, fim = m.index + m[0].length;
        if (usados.some(u => ini < u[1] && fim > u[0])) continue;
        usados.push([ini, fim]); achados.push({key, pos: ini});
      }
    });
    if (achados.length < 2) continue;
    achados.sort((a,b)=>a.pos-b.pos);
    for (let j=i+1; j<Math.min(i+3, lines.length); j++){
      const nums = lines[j].match(numRe);
      if (nums && nums.length === achados.length){
        achados.forEach((a,k) => { if (out[a.key] === undefined) out[a.key] = nums[k]; });
        break;
      }
    }
  }
  return out;
}
/* ===== Motor · extracao/nfse.js ===== */
/**
 * Motor de Cálculo Reforma Tributária — TaxAdvice
 * Núcleo · Extração da NFS-e (XML e PDF, layouts municipais e padrão nacional).
 *
 * USO EXCLUSIVO NO SERVIDOR. Propriedade da TaxAdvice — não distribuir.
 */



/* =========================================================================
   EXTRAÇÃO — NOTA FISCAL DE SERVIÇO (NFS-e)
   ========================================================================= */
function completarCamposNacionais(f){
  // Espelha os rótulos do DANFSe nacional sem substituir valores extraídos.
  if (!f.situacaoNota && f.finalidadeNFSe) f.situacaoNota = f.finalidadeNFSe;
  if (!f.informacoesComplementares && f.observacoes) f.informacoesComplementares = f.observacoes;
  if (!f.incidenciaISS && f.localPrestacao) f.incidenciaISS = f.localPrestacao;
  if (!f.incidenciaIBSCBS) f.incidenciaIBSCBS = [f.tipoOperacao, f.localFornecimento].filter(Boolean).join(' / ') || null;
  if (!f.exclusoesIBSCBS && f.deducoes) f.exclusoesIBSCBS = f.deducoes;
  if (!f.valorIBS) {
    const uf = brNumToFloat(f.valorIBSUf) || 0, mun = brNumToFloat(f.valorIBSMun) || 0;
    if (uf || mun) f.valorIBS = (uf + mun).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  // Campos combinados do leiaute da beta.46 ("CST / cClassTrib", "Red. alíquota", "Alíquota – IBS UF / IBS Mun", "Código IBGE / CEP").
  if (!f.cstCClassTribTxt && (f.cstIBSCBS || f.cclasstrib)) f.cstCClassTribTxt = [f.cstIBSCBS || '—', f.cclasstrib || '—'].join(' / ');
  if (!f.redAliqTxt && [f.redIBSUf, f.redIBSMun, f.redCBS].some(v => v !== null && v !== undefined && v !== ''))
    f.redAliqTxt = [f.redIBSUf, f.redIBSMun, f.redCBS].map(v => (v === null || v === undefined || v === '') ? '—' : v + ' %').join(' / ');
  if (!f.aliqIBSTxt && (f.aliqIBSUf || f.aliqIBSMun)) f.aliqIBSTxt = [f.aliqIBSUf || '0,00', f.aliqIBSMun || '0,00'].map(v => v + ' %').join(' / ');
  if (!f.prestadorIBGECEP && (f.prestadorIBGE || f.prestadorCEP)) f.prestadorIBGECEP = [f.prestadorIBGE || '—', f.prestadorCEP || '—'].join(' / ');
  if (!f.tomadorIBGECEP && f.tomadorIBGE) f.tomadorIBGECEP = [f.tomadorIBGE, f.tomadorCEP || '—'].join(' / ');
  return f;
}

function extractServicoXML(xmlDoc){
  const f = {};
  f.numeroNota = getFirstTagText(xmlDoc, ['nNFSe','nDPS','nFat']);
  f.dataEmissao = getFirstTagText(xmlDoc, ['dhProc','dhEmi','dCompet']);

  const prestEl = xmlDoc.getElementsByTagName('prest')[0] || xmlDoc.getElementsByTagName('emit')[0];
  f.prestadorNome = getFirstTagText(prestEl, ['xNome','xFant']);
  f.prestadorCNPJ = getFirstTagText(prestEl, ['CNPJ','CPF']);
  f.prestadorIM = getFirstTagText(prestEl, ['IM']);
  f.prestadorMunicipio = getFirstTagText(prestEl, ['xMun']) || findTagLike(prestEl, /^xMun$/i);

  const tomaEl = xmlDoc.getElementsByTagName('toma')[0] || xmlDoc.getElementsByTagName('dest')[0];
  f.tomadorNome = getFirstTagText(tomaEl, ['xNome']);
  f.tomadorCNPJ = getFirstTagText(tomaEl, ['CNPJ','CPF']);
  f.tomadorIM = getFirstTagText(tomaEl, ['IM']);
  f.tomadorMunicipio = getFirstTagText(tomaEl, ['xMun']) || findTagLike(tomaEl, /^xMun$/i);

  const servEl = xmlDoc.getElementsByTagName('serv')[0] || xmlDoc.getElementsByTagName('servico')[0];
  f.codigoServico = getFirstTagText(servEl, ['cTribNac','cServ','cLCServ','item']);
  f.descricaoServico = getFirstTagText(servEl, ['xDescServ','discriminacao']) || findTagLike(servEl, /^xDescServ$/i);
  f.nbs = getFirstTagText(servEl, ['NBS','cNBS']) || findTagLike(servEl, /^c?NBS$/i);
  f.cclasstrib = getFirstTagText(xmlDoc, ['cClassTrib']) || findTagLike(xmlDoc, /cClassTrib/i);

  const valEl = xmlDoc.getElementsByTagName('valores')[0] || xmlDoc;
  f.valorServico = getFirstTagText(valEl, ['vServPrest','vServ']) || findTagLike(valEl, /^vServ/i);
  f.aliqISS = getFirstTagText(valEl, ['pAliqAplic','pAliq']) || findTagLike(valEl, /^pAliq/i);
  f.valorISS = getFirstTagText(valEl, ['vISSQN','vISS']) || findTagLike(valEl, /^vISS/i);

  // Tributação IBS/CBS (quando o XML já traz esse bloco — notas emitidas a partir de 2026).
  const ibscbsEl = xmlDoc.getElementsByTagName('gIBSCBS')[0] || xmlDoc.getElementsByTagName('IBSCBS')[0];
  if (ibscbsEl){
    f.cstIBSCBS = getFirstTagText(xmlDoc, ['CST']) || findTagLike(xmlDoc, /^CST$/i);
    f.baseIBSCBS = getFirstTagText(ibscbsEl, ['vBC']) || findTagLike(ibscbsEl, /^vBC$/i);
    const gCBS = xmlDoc.getElementsByTagName('gCBS')[0];
    f.aliqCBS = gCBS ? getFirstTagText(gCBS, ['pCBS']) : null;
    f.valorCBS = gCBS ? getFirstTagText(gCBS, ['vCBS']) : null;
    const gIBSUF = xmlDoc.getElementsByTagName('gIBSUF')[0];
    f.aliqIBSUf = gIBSUF ? getFirstTagText(gIBSUF, ['pIBSUF']) : null;
    f.valorIBSUf = gIBSUF ? getFirstTagText(gIBSUF, ['vIBSUF']) : null;
    const gIBSMun = xmlDoc.getElementsByTagName('gIBSMun')[0];
    f.aliqIBSMun = gIBSMun ? getFirstTagText(gIBSMun, ['pIBSMun']) : null;
    f.valorIBSMun = gIBSMun ? getFirstTagText(gIBSMun, ['vIBSMun']) : null;
  }
  // Campos adicionais do modelo padrão nacional (preenche apenas o que ainda estiver vazio).
  const g = (el, tags) => el ? getFirstTagText(el, tags) : null;
  const set = (k,v) => { if (v !== null && v !== undefined && v !== '' && (f[k]===null || f[k]===undefined || f[k]==='')) f[k] = String(v).trim(); };
  const inf = xmlDoc.getElementsByTagName('infNFSe')[0];
  if (inf && inf.getAttribute){ const id = inf.getAttribute('Id') || ''; const ch = id.replace(/\D/g,''); if (ch.length >= 50) set('chaveAcesso', ch.slice(-50)); }
  set('situacaoNota', g(xmlDoc, ['xSituacao','situacao']) || (g(xmlDoc, ['cStat']) === '100' ? 'Emitida' : null));
  set('serieNota', g(xmlDoc, ['serie']));
  set('dataFatoGerador', g(xmlDoc, ['dCompet']));
  const dh = g(xmlDoc, ['dhEmi','dhProc']);
  if (dh && /T\d{2}:\d{2}/.test(dh)){ set('horaEmissao', dh.split('T')[1].slice(0,5)); }
  set('municipioEmissor', g(xmlDoc, ['xLocEmi']));
  set('codigoVerificacao', g(xmlDoc, ['cVerif','codigoVerificacao']));
  const endP = prestEl ? (prestEl.getElementsByTagName('enderNac')[0] || prestEl.getElementsByTagName('end')[0]) : null;
  set('prestadorEndereco', [g(endP,['xLgr']), g(endP,['nro']), g(endP,['xCpl'])].filter(Boolean).join(', '));
  set('prestadorBairro', g(endP,['xBairro'])); set('prestadorCEP', g(endP,['CEP']));
  set('prestadorIE', g(prestEl,['IE'])); set('prestadorEmail', g(prestEl,['email'])); set('prestadorTelefone', g(prestEl,['fone']));
  const endT = tomaEl ? (tomaEl.getElementsByTagName('end')[0] || tomaEl.getElementsByTagName('endNac')[0]) : null;
  set('tomadorEndereco', g(endT,['xLgr'])); set('tomadorNumero', g(endT,['nro'])); set('tomadorComplemento', g(endT,['xCpl']));
  set('tomadorBairro', g(endT,['xBairro'])); set('tomadorCEP', g(endT,['CEP']));
  set('codigoTribNacional', g(servEl,['cTribNac'])); set('localPrestacao', g(xmlDoc,['cLocPrestacao','xLocPrestacao']));
  set('descontoIncondicionado', g(xmlDoc,['vDescIncond'])); set('descontoCondicionado', g(xmlDoc,['vDescCond']));
  set('deducoes', g(xmlDoc,['vDR','vDedRed'])); set('baseISS', g(xmlDoc,['vBC']));
  set('irRetido', g(xmlDoc,['vRetIRRF'])); set('inssRetido', g(xmlDoc,['vRetCP'])); set('csllRetido', g(xmlDoc,['vRetCSLL']));
  set('valorLiquido', g(xmlDoc,['vLiq']));
  set('finalidadeNFSe', g(xmlDoc,['finNFSe'])); set('cstIBSCBS', g(xmlDoc,['CST']));
  set('difIBSUf', g(xmlDoc,['pDifUF'])); set('difIBSMun', g(xmlDoc,['pDifMun'])); set('difCBS', g(xmlDoc,['pDifCBS']));
  set('redIBSUf', g(xmlDoc,['pRedAliqUF'])); set('redIBSMun', g(xmlDoc,['pRedAliqMun'])); set('redCBS', g(xmlDoc,['pRedAliqCBS']));
  set('aliqEfIBSUf', g(xmlDoc,['pAliqEfetUF'])); set('aliqEfIBSMun', g(xmlDoc,['pAliqEfetMun'])); set('aliqEfCBS', g(xmlDoc,['pAliqEfetCBS']));
  set('aliqIBSUf', g(xmlDoc,['pIBSUF'])); set('aliqIBSMun', g(xmlDoc,['pIBSMun'])); set('aliqCBS', g(xmlDoc,['pCBS']));
  set('valorIBSUf', g(xmlDoc,['vIBSUF'])); set('valorIBSMun', g(xmlDoc,['vIBSMun'])); set('valorCBS', g(xmlDoc,['vCBS']));
  set('totalTributacao', g(xmlDoc,['vTotNF']));
  set('observacoes', g(xmlDoc,['xInfComp','infAdic']));
  return completarCamposNacionais(f);
}

/* =========================================================================
   NFS-e PADRÃO NACIONAL (layout tabelado — ex.: Cachoeirinha/RS): blocos com
   rótulos numa linha e valores na linha seguinte. Lê cada tabela pela posição
   dos rótulos; quando um rótulo quebra de linha (ex.: "Alíquota Efetiva IBS /
   Municipal"), a palavra que sobra na linha de valores marca a coluna cujo
   valor está na linha de baixo. Preenche também campos gerais (observações,
   vencimento do ISS, tributos aproximados) de qualquer layout.
   ========================================================================= */
const NFSE_ROT_SERV = [
  ['valorServico', /Valor\s*Servi[çc]o/i], ['codigoTribNacional', /Servi[çc]o/i],
  ['localPrestacao', /Local\s*Presta[çc][ãa]o/i], ['aliqISS', /Al[íi]quota/i],
  ['situacaoTribISS', /Situa[çc][ãa]o\s*Trib/i],
  ['descontoIncondicionado', /Desc(?:onto)?\.?\s*Incondic(?:ional|ionado|\.)?/i],
  ['descontoCondicionado', /Desc(?:onto)?\.?\s*Condicional/i],
  ['deducoes', /(?:Valor\s*)?Dedu[çc][ãa]o/i], ['valorISS', /Valor\s*ISS\b|\bISSQN\b/i],
  ['valorTotal', /Valor\s*Total/i], ['baseISS', /Base\s*de\s*C[áa]lculo/i],
  ['issRetido', /\bISSRF\b|ISS\s*Retido/i], ['irRetido', /\bIR\b|\bIRRF\b/], ['inssRetido', /\bINSS\b/],
  ['csllRetido', /\bCSLL\b/], ['cofinsRetido', /\bCOFINS\b/], ['pisRetido', /\bPIS\b/],
  ['outrasRetencoes', /Outras\s*Reten[çc][õo]es/i], ['totalTribFederais', /Total\s*Trib\.?\s*Federais/i],
  ['valorLiquido', /Valor\s*L[íi]quido/i]
];

const NFSE_ROT_IBS = [['aliqEf', /Al[íi]quota\s*Efetiva/i], ['aliq', /Al[íi]quota/i], ['dif', /Diferimento/i], ['red', /Redu[çc][ãa]o/i], ['valor', /Total\s*(?:IBS|CBS)/i]];

function nfseRotulosDaLinha(linha, rotulos){
  const usados = [], achados = [];
  rotulos.forEach(([key, re]) => {
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags+'g'); let m;
    while ((m = r.exec(linha)) !== null){
      const ini = m.index, fim = ini + m[0].length;
      if (!usados.some(u => ini < u[1] && fim > u[0])){ usados.push([ini,fim]); achados.push({key, pos:ini}); }
      if (m[0].length === 0) r.lastIndex++;
    }
  });
  return achados.sort((a,b)=>a.pos-b.pos).map(a=>a.key);
}

function nfseEhValorNumerico(t){ return /^-?[\d.]+(?:,\d+)?%?$/.test(t) || /^-?\d+(?:\.\d+)?%?$/.test(t); }

/* Associa valores às colunas. Tokens não numéricos que são palavras do cabeçalho
   (continuação de rótulo quebrado) marcam colunas pendentes, preenchidas pela linha seguinte. */
function nfseMapearValores(keys, linhaValores, linhaSeguinte, linhaCabecalho, soNumeros){
  const out = {};
  const toks = linhaValores.split(/\s+/).filter(Boolean);
  if (!soNumeros && toks.length === keys.length){ keys.forEach((k,i)=>out[k]=toks[i]); return {out, usouSeguinte:false}; }
  const palavrasCab = new Set(linhaCabecalho.toLowerCase().split(/\s+/));
  const pend = []; let k = 0;
  toks.forEach(t => {
    if (k >= keys.length) return;
    if (nfseEhValorNumerico(t)) out[keys[k++]] = t;
    else if (palavrasCab.has(t.toLowerCase())) pend.push(keys[k++]);
  });
  let usouSeguinte = false;
  if (pend.length && linhaSeguinte){
    const extra = linhaSeguinte.split(/\s+/).filter(nfseEhValorNumerico);
    pend.forEach((key,i) => { if (extra[i] !== undefined){ out[key] = extra[i]; usouSeguinte = true; } });
  }
  return {out, usouSeguinte};
}

function nfsePctBR(v){ const n = brNumToFloat(v); return n === null ? v : n.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2}); }

function nfseNormMoney(v){ const n = brNumToFloat(v); return n === null ? v : n.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2}); }

function valorAposRotulo(lines, re){
  const i = lines.findIndex(l => re.test(l));
  if (i < 0) return null;
  for (let j=i+1;j<Math.min(i+4,lines.length);j++) if (lines[j] && lines[j].trim() && lines[j].trim() !== '-') return lines[j].trim();
  return null;
}

function extrairCamposGeraisNFSe(lines, flat, f){
  const set = (k,v) => { if (v && (f[k]===null || f[k]===undefined || f[k]==='')) f[k] = String(v).trim(); };
  set('observacoes', firstMatch(/Observa[çc][õo]es:?\s*([^\n]{3,400})/i, lines.join('\n')));
  set('vencimentoISS', firstMatch(/vencimento do ISS[^:\n]*:\s*(\d{2}\/\d{2}\/\d{4})/i, flat));
  set('tributosAproximados', firstMatch(/Valor aproximado (?:dos|de) tributos:?\s*(.+?)(?:,?\s*com base na Lei|\s*-\s*FONTE|$)/i, flat));
  set('regimeISS', firstMatch(/Contribuinte enquadrado como\s*([^\n]+)/i, lines.join('\n')));
  set('chaveAcesso', firstMatch(/\b(\d{50})\b/, flat));
  set('municipioEmissor', firstMatch(/PREFEITURA\s+(?:MUNICIPAL\s+(?:DE|DO|DA)|DO\s+MUNIC[ÍI]PIO\s+DE)\s+([A-ZÀ-Üa-zà-ü' ]+?)(?:\s{2,}|\s+SECRETARIA|\s+Chave|\s+RPS|\s+Nota|$)/i, flat));
  set('prestadorIE', firstMatch(/Insc(?:ri[çc][ãa]o)?\.?\s*Estadual:?\s*(\d[\d.\-\/]{3,})/i, flat) || firstMatch(/\bIE:?\s*(\d[\d.\-\/]{5,})/i, flat));
  set('prestadorEmail', firstMatch(/E-?mail\s*:?\s*([\w.+-]+@[\w.-]+\.\w+)/i, flat));
  set('prestadorTelefone', firstMatch(/Telefone:?\s*(\(?\d[\d()\s-]{6,}\d)/i, flat));
  set('codigoTribNacional', firstMatch(/C[óo]digo\s*Tributa[çc][ãa]o\s*Nacional:?\s*([\d.]{6,12})/i, flat));
  // DANFSe nacional: o PDF traz rótulo e valor em linhas consecutivas.
  [['situacaoNota',/SITUA[ÇC][ÃA]O DA NFS-e/i],['finalidadeNFSe',/^FINALIDADE$/i],['serieNota',/S[ÉE]RIE DA DPS/i],['dataFatoGerador',/COMPET[ÊE]NCIA DA NFS-e/i],['dataEmissao',/DATA E HORA DA EMISS[ÃA]O DA NFS-e/i],['horaEmissao',/DATA E HORA DA EMISS[ÃA]O DA DPS/i],['chaveAcesso',/CHAVE DE ACESSO DA NFS-e/i],['tipoTributacaoISS',/Tipo de Tributa[ÇC][ÃA]o do ISSQN/i],['incidenciaISS',/Incid[ÊE]ncia do ISSQN/i],['issRetido',/Reten[ÇC][ÃA]o do ISSQN/i],['irRetido',/^IRRF$/i],['inssRetido',/Contribui[ÇC][ÃA]o Previdenci[ÁA]ria/i],['csllRetido',/Contribui[ÇC][ÃA]es Sociais/i]].forEach(([k,re]) => set(k, valorAposRotulo(lines,re)));
  if (f.chaveAcesso && !f.numeroNota){ const n = parseInt(f.chaveAcesso.slice(23,36),10); if (n) f.numeroNota = String(n); }
}

function extrairNFSeNacionalTabelada(lines, flat, f){
  const idxDesc = lines.findIndex(l => /DESCRI[ÇC][ÃA]O DOS SERVI[ÇC]OS PRESTADOS/i.test(l));
  if (idxDesc === -1) return false; // não é este layout
  const idxTom = lines.findIndex(l => /^TOMADOR (?:DO SERVI[ÇC]O|\/|DA OPERA)/i.test(l));
  const idxIBS = lines.findIndex(l => /^Tributa[çc][ãa]o\s*IBS\s*\/?\s*CBS/i.test(l));

  // --- Identificação ---
  const mSit = flat.match(/\b(\d{1,15})\s+(Emitida|Cancelada|Substitu[íi]da)\b/i);
  if (mSit){ f.numeroNota = mSit[1]; f.situacaoNota = mSit[2]; }
  const idxIdent = lines.findIndex(l => /^Identificador$/i.test(l));
  if (idxIdent !== -1 && /^[\d\s]{20,}$/.test(lines[idxIdent+1]||'')) f.codigoVerificacao = lines[idxIdent+1].trim();
  const idxDatas = lines.findIndex(l => /Fato\s*Gerador/i.test(l) && /Emiss[ãa]o/i.test(l));
  if (idxDatas !== -1){
    const ds = (lines[idxDatas+1]||'').match(/\d{2}\/\d{2}\/\d{4}/g) || [];
    const hr = (lines[idxDatas+1]||'').match(/\b(\d{2}:\d{2}(?::\d{2})?)\b/);
    if (ds[0]) f.dataFatoGerador = ds[0];
    if (ds[1]) f.dataEmissao = ds[1]; else if (ds[0]) f.dataEmissao = ds[0];
    if (hr) f.horaEmissao = hr[1];
  }

  // --- Prestador: tudo antes do bloco do tomador ---
  const prest = lines.slice(0, idxTom === -1 ? idxDesc : idxTom);
  if (prest.length && !/:/.test(prest[0]) && !/^\d/.test(prest[0])) f.prestadorNome = prest[0].trim();
  const pflat = prest.join(' ');
  f.prestadorCNPJ = firstMatch(/CNPJ(?:\/CPF)?:?\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i, pflat) || f.prestadorCNPJ;
  const im = firstMatch(/Insc(?:ri[çc][ãa]o)?\.?\s*Municipal:?\s*(\d[\d.\-\/]*)/i, pflat); if (im) f.prestadorIM = im;
  const ie = firstMatch(/Insc(?:ri[çc][ãa]o)?\.?\s*Estadual:?\s*(\d[\d.\-\/]*)/i, pflat); f.prestadorIE = ie || null;
  const iCnpj = prest.findIndex(l => /CNPJ/i.test(l));
  if (iCnpj !== -1 && prest[iCnpj+1] && !/^(CEP|Munic|Insc|E-?mail|Telefone)/i.test(prest[iCnpj+1]))
    f.prestadorEndereco = prest[iCnpj+1].replace(/\s+\d{1,15}\s+(Emitida|Cancelada|Substitu[íi]da)\s*$/i,'').trim();
  const cepL = prest.find(l => /CEP:?/i.test(l)) || '';
  f.prestadorCEP = firstMatch(/CEP:?\s*([\d.]{5,6}-?\d{3})/i, cepL) || f.prestadorCEP;
  f.prestadorBairro = firstMatch(/Bairro:?\s*([^\n-]+?)\s*$/i, cepL) || f.prestadorBairro;
  const munL = prest.find(l => /^Munic[íi]pio/i.test(l));
  if (munL) f.prestadorMunicipio = munL.replace(/^Munic[íi]pio\s*:?\s*/i,'').trim();

  // --- Tomador: pares cabeçalho → valores ---
  const tom = lines.slice(idxTom === -1 ? 0 : idxTom+1, idxDesc);
  tom.forEach((l,i) => {
    const v = (tom[i+1]||'').trim();
    if (/Raz[ãa]o\s*Social/i.test(l) && /CPF|CNPJ/i.test(l)){
      const c = v.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})/);
      if (c){ f.tomadorCNPJ = c[1]; f.tomadorNome = v.slice(0, c.index).trim(); } else f.tomadorNome = v;
    }
    if (/^Endere[çc]o/i.test(l)){
      let j = i+1; while (j < tom.length && /^(N[úu]mero|Complemento)$/i.test(tom[j])) j++;
      if (tom[j] && !/^Bairro/i.test(tom[j])) f.tomadorEndereco = tom[j].trim();
    }
    if (/^Bairro/i.test(l) && /CEP/i.test(l)){
      const m = v.match(/^(.*?)\s*(\d{2}\.?\d{3}-?\d{3})\s+(.+)$/);
      if (m){ f.tomadorBairro = m[1].trim() || null; f.tomadorCEP = m[2]; f.tomadorMunicipio = m[3].trim(); }
    }
    if (/Insc(?:ri[çc][ãa]o)?\.?\s*Municipal/i.test(l)){ const m = v.match(/^(\d[\d.\-\/]*)/); if (m) f.tomadorIM = m[1]; }
  });

  // --- Tabelas de serviço e valores (antes do bloco IBS/CBS) ---
  const fimServ = idxIBS === -1 ? lines.length : idxIBS;
  for (let i = idxDesc+1; i < fimServ; i++){
    const keys = nfseRotulosDaLinha(lines[i], NFSE_ROT_SERV);
    if (keys.length < 3 || !lines[i+1]) continue;
    const {out} = nfseMapearValores(keys, lines[i+1], lines[i+2], lines[i], !keys.includes('codigoTribNacional'));
    Object.keys(out).forEach(k => { if (out[k] !== undefined) f[k] = out[k]; });
    i++;
  }
  if (f.valorTotal){ f.valorServico = f.valorServico || f.valorTotal; delete f.valorTotal; }
  if (f.aliqISS) f.aliqISS = nfsePctBR(f.aliqISS);
  const cod = (f.codigoTribNacional||'').replace(/\D/g,'');
  if (cod.length >= 4){ f.codigoServico = cod.slice(0,2)+'.'+cod.slice(2,4); if (cod.length >= 6) f.codigoTribNacional = cod.slice(0,2)+'.'+cod.slice(2,4)+'.'+cod.slice(4,6); }
  const iDescS = lines.findIndex(l => /^Descri[çc][ãa]o do Servi[çc]o:?\s*$/i.test(l));
  if (iDescS !== -1 && lines[iDescS+1]) f.descricaoServico = lines[iDescS+1].trim();

  // --- Tributação IBS/CBS ---
  if (idxIBS !== -1){
    for (let i = idxIBS+1; i < lines.length; i++){
      const l = lines[i];
      if (/^Classifica[çc][ãa]o/i.test(l)) break;
      if (/Finalidade/i.test(l) && /Base\s*de\s*C[áa]lculo/i.test(l)){
        const v = lines[i+1]||'';
        const nums = v.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d+/g) || [];
        const pBase = nums.length ? v.indexOf(nums[0]) : -1;
        if (pBase > 0) f.finalidadeNFSe = v.slice(0,pBase).trim();
        if (nums[0]) f.baseIBSCBS = nums[0];
        const ultimo = v.trim().split(/\s+/).pop();
        if (nfseEhValorNumerico(ultimo) && nums.length > 1) f.totalTributacao = nfseNormMoney(ultimo);
        let meio = pBase >= 0 ? v.slice(pBase + nums[0].length) : v;
        if (f.totalTributacao) meio = meio.replace(new RegExp('\\s*'+ultimo.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*$'),'');
        const cont = (lines[i+2] && !nfseRotulosDaLinha(lines[i+2], NFSE_ROT_IBS).length && !/^\d/.test(lines[i+2])) ? ' '+lines[i+2].trim() : '';
        const sp = meio.search(/\b(Estabelecimento|Domic[íi]lio|Local\s+d[oa]|Endere[çc]o)\b/i);
        if (sp > 0){ f.tipoOperacao = (meio.slice(0,sp).trim()+cont).trim(); f.localFornecimento = meio.slice(sp).trim(); }
        else f.tipoOperacao = (meio.trim()+cont).trim();
        continue;
      }
      const suf = /IBS\s*Municipal/i.test(l) ? 'IBSMun' : /IBS\s*Estadual/i.test(l) ? 'IBSUf' : /\bCBS\b/.test(l) ? 'CBS' : null;
      if (!suf) continue;
      const keys = nfseRotulosDaLinha(l, NFSE_ROT_IBS);
      if (keys.length < 3 || !lines[i+1]) continue;
      const {out, usouSeguinte} = nfseMapearValores(keys, lines[i+1], lines[i+2], l, true);
      Object.keys(out).forEach(k => { f[k+suf] = out[k]; });
      i += usouSeguinte ? 2 : 1;
    }
  }
  f.cclasstrib = firstMatch(/Classifica[çc][ãa]o\s*Tribut[áa]ria:?\s*(\d{6})/i, flat) || f.cclasstrib;
  f.cstIBSCBS = firstMatch(/\bCST:?\s*(\d{3})\b/i, flat) || f.cstIBSCBS;

  // --- Outras informações ---
  const iSub = lines.findIndex(l => /Descri[çc][ãa]o dos subitens/i.test(l));
  if (iSub !== -1){
    const partes = [];
    for (let j = iSub+1; j < lines.length && !/^Legenda|^Outras Informa/i.test(lines[j]); j++) partes.push(lines[j].trim());
    if (partes.length) f.descricaoSubitemLC116 = partes.join(' ');
  }
  const iLeg = lines.findIndex(l => /^Legenda do Local/i.test(l));
  if (iLeg !== -1 && lines[iLeg+1]) f.legendaLocalPrestacao = lines[iLeg+1].trim();
  return true;
}

function extractServicoPDF(text, lines){
  const v2 = extrairDANFSeV2(lines || String(text || '').split(/\r?\n/));
  if (v2) return completarCamposNacionais(v2);
  const flat = text.replace(/\n/g,' ').replace(/\s+/g,' ');
  const f = {};

  // ===== NÚMERO DA NOTA E DATA DE EMISSÃO =====
  // Formato A: "Nota Nº: Emissão: Série: ..." com os valores numa linha separada logo abaixo
  // (padrão nacional de NFS-e, ex. Osasco): "0000002001 16/03/2026 E 03/2026".
  let notaHeaderIdx = -1;
  for (let i=0;i<lines.length;i++){
    if (/Nota\s*N[ºo°]/i.test(lines[i]) && /Emiss[ãa]o/i.test(lines[i]) && /S[ée]rie/i.test(lines[i])){ notaHeaderIdx = i; break; }
  }
  if (notaHeaderIdx !== -1){
    for (let j = notaHeaderIdx+1; j < Math.min(notaHeaderIdx+6, lines.length); j++){
      const numTok = lines[j].match(/^(\d{3,})\b/);
      const dateTok = lines[j].match(/(\d{2}\/\d{2}\/\d{4})/);
      if (numTok && dateTok){ f.numeroNota = numTok[1]; f.dataEmissao = dateTok[1]; break; }
    }
  }
  if (!f.numeroNota) f.numeroNota = firstMatch(/Nota\s*N[ºo°]\.?:?\s*(\d{3,})/i, flat);
  // Formato B: "Número da Nota/Série" seguido do valor (ex.: "3.346/NFSE") — pode incluir o
  // sufixo do sistema emissor (NFSE, NF-e etc.), então captura até o próximo espaço.
  if (!f.numeroNota) f.numeroNota = firstMatch(/N[úu]mero da Nota\/?S[ée]rie:?\s*([\d.]+\/?[A-Z]*)/i, flat);
  // Nesses PDFs o valor às vezes aparece ANTES do rótulo (ordem de extração do texto do PDF
  // não segue a ordem visual) — como último recurso, procura o formato típico "3.346/NFSE" em
  // qualquer lugar do texto.
  if (!f.numeroNota) f.numeroNota = firstMatch(/\b(\d[\d.]{0,10}\/(?:NFSE|NFS-E|NF-E))\b/i, flat);
  if (!f.dataEmissao) f.dataEmissao = firstMatch(/Emiss[ãa]o:?\s*(\d{2}\/\d{2}\/\d{4})/i, flat);
  if (!f.dataEmissao) f.dataEmissao = firstMatch(/Data\s*e?\s*Hora\s*de\s*Emiss[ãa]o\D{0,20}(\d{2}\/\d{2}\/\d{4})/i, flat);
  // Mesmo motivo do número da nota: procura uma data seguida de hora (padrão de emissão,
  // diferente de datas de vencimento que não têm hora), em qualquer posição do texto.
  if (!f.dataEmissao) f.dataEmissao = firstMatch(/(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}:\d{2}/, flat);

  // ===== BLOCOS PRESTADOR / TOMADOR — extraídos separadamente para não misturar CNPJ, IM e
  // Município de um com o do outro (ambos costumam usar os mesmos rótulos). =====
  const idxPrestador = flat.search(/PRESTADOR/i);
  const idxTomador = flat.search(/TOMADOR(?:\/ADQUIRENTE)?(?:\s*DO\s*SERVI[ÇC]O| DA OPERA[ÇC][ÃA]O)?/i);
  const idxFimTomador = (() => {
    const marks = ['Local de Presta', 'DESTINAT[ÁA]RIO', 'Discrimina[çc][ãa]o do Servi', 'TRIBUTA[ÇC][ÃA]O'];
    let best = flat.length;
    marks.forEach(m => { const p = flat.search(new RegExp(m,'i')); if (p !== -1 && p > (idxTomador>-1?idxTomador:0) && p < best) best = p; });
    return best;
  })();
  const blocoPrestador = (idxPrestador!==-1) ? flat.slice(idxPrestador, idxTomador!==-1?idxTomador:idxPrestador+600) : flat;
  const blocoTomador = (idxTomador!==-1) ? flat.slice(idxTomador, idxFimTomador) : '';

  function extrairCNPJ(bloco){ return firstMatch(/CNPJ(?:\/CPF)?\s*:?\s*([\d./-]{11,20})/i, bloco); }
  function extrairIM(bloco){
    // "Inscrição Municipal: 174585" OU a forma abreviada "IM: 745" — exige que o valor comece
    // com dígito, para não capturar por engano a próxima palavra (ex.: "IM: Razão Social...",
    // quando o campo está vazio no documento).
    return firstMatch(/Inscri[çc][ãa]o Municipal:?\s*([\dA-Za-z.-]+)/i, bloco) ||
           firstMatch(/\bIM:?\s*(\d[\dA-Za-z.-]*)/i, bloco);
  }
  function extrairRazaoSocial(bloco){
    return firstMatch(/Raz[ãa]o Social:?\s*([^\n]+?)\s*(?:Endere[çc]o|Inscri[çc][ãa]o|CNPJ|IE:|TOMADOR|PRESTADOR|Cód\.|NBS|Valor Total|Bairro|$)/i, bloco);
  }
  function extrairMunicipio(bloco){
    // "Município : MAIRIPORA - SP" ou "Município: MAIRIPORA - SP" — para no traço/UF ou fim de linha.
    const m = firstMatch(/Munic[íi]pio\s*:?\s*([A-ZÀ-Ü][A-ZÀ-Üa-zà-ü' ]+(?:-\s*[A-Z]{2})?)/i, bloco);
    return m ? m.replace(/\s+/g,' ').trim() : null;
  }

  f.prestadorCNPJ = extrairCNPJ(blocoPrestador);
  f.prestadorIM = extrairIM(blocoPrestador);
  f.prestadorNome = extrairRazaoSocial(blocoPrestador);
  f.prestadorMunicipio = extrairMunicipio(blocoPrestador);
  // Município do prestador também pode vir só no cabeçalho "PREFEITURA (DO) MUNICÍPIO DE X".
  if (!f.prestadorMunicipio){
    const munLine = lines.find(l => /PREFEITURA (?:MUNICIPAL\s*(?:DE|DO)|DO MUNIC[ÍI]PIO DE)/i.test(l));
    const municipio = munLine ? firstMatch(/(?:MUNICIPAL\s*(?:DE|DO)|MUNIC[ÍI]PIO DE)\s+([A-ZÀ-Üa-zà-ü' ]+)/i, munLine) : null;
    f.prestadorMunicipio = municipio ? municipio.trim() : null;
  }

  if (blocoTomador){
    f.tomadorCNPJ = extrairCNPJ(blocoTomador);
    f.tomadorIM = extrairIM(blocoTomador);
    f.tomadorNome = extrairRazaoSocial(blocoTomador);
    f.tomadorMunicipio = extrairMunicipio(blocoTomador);
  } else {
    // Formato antigo (Osasco): CNPJ/IM do tomador vêm como a 2ª ocorrência no documento todo.
    const cnpjs = allMatchesLocal(/CNPJ\/CPF:?\s*([\d./-]{11,20})/i, flat);
    f.tomadorCNPJ = cnpjs[1] || null;
    const ims = allMatchesLocal(/Inscri[çc][ãa]o Municipal:?\s*([\dA-Za-z.-]+)/i, flat);
    f.tomadorIM = ims[1] || null;
    const razoes = allMatchesLocal(/Raz[ãa]o Social:?\s*([^\n]+?)\s*(?:Endere[çc]o|Inscri[çc][ãa]o|CNPJ|TOMADOR|PRESTADOR|Cód\.|NBS|Valor Total|$)/i, flat);
    f.tomadorNome = razoes[1] || null;
    f.tomadorMunicipio = f.prestadorMunicipio;
  }
  // Alguns PDFs extraem o texto fora de ordem (o valor pode vir antes do rótulo "CNPJ:"), o que
  // faz os métodos acima falharem. Como último recurso, procura o FORMATO de CNPJ (99.999.999/
  // 9999-99) em todo o texto — o 1º encontrado costuma ser do prestador, o 2º do tomador.
  if (!f.prestadorCNPJ || !f.tomadorCNPJ){
    const cnpjsPorFormato = allMatchesLocal(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/, flat);
    if (!f.prestadorCNPJ) f.prestadorCNPJ = cnpjsPorFormato[0] || null;
    if (!f.tomadorCNPJ) f.tomadorCNPJ = cnpjsPorFormato.find(c => c !== f.prestadorCNPJ) || null;
  }
  // Mesma lógica para a Razão Social: se não achou pelo rótulo, procura o texto que vem logo
  // após "Razão Social" na ordem em que aparece no documento (1º = prestador, 2º = tomador).
  if (!f.prestadorNome || !f.tomadorNome){
    const nomes = allMatchesLocal(/Raz[ãa]o Social\s*:?\s*([^\n]+?)\s*(?:Endere[çc]o|Inscri[çc][ãa]o|CNPJ|IE:|TOMADOR|PRESTADOR|Cód\.|NBS|Valor Total|Bairro|$)/i, flat);
    if (!f.prestadorNome) f.prestadorNome = nomes[0] || null;
    if (!f.tomadorNome) f.tomadorNome = nomes.find(n => n !== f.prestadorNome) || null;
  }

  // ===== CÓDIGO DO SERVIÇO, NBS, cClassTrib =====
  // Aceita tanto a forma abreviada ("Cód. do Serviço") quanto a por extenso ("Código do Serviço").
  f.codigoServico = firstMatch(/C[óo]digo\s*(?:do\s*)?Servi[çc]o:?\s*(\d{2}\.\d{2})/i, flat) ||
                     firstMatch(/C[óo]d\.?\s*(?:do\s*)?Servi[çc]o:?\s*(\d{2}\.\d{2})/i, flat);
  f.descricaoServico = firstMatch(/Discrimina[çc][ãa]o do Servi[çc]o:?\s*([^\n]{5,200})/i, text);
  f.nbs = firstMatch(/NBS:?\s*(\d\.\d{4}\.\d{2}\.\d{2})/i, flat);
  // "Classif. Trib.: 000001" (formato antigo) ou "Class.Tributária: 000001" (formato novo).
  f.cclasstrib = firstMatch(/Classif\.?\s*Trib(?:ut[áa]ria)?\.?:?\s*(\d{5,6})/i, flat) ||
                 firstMatch(/Class\.?\s*Tribut[áa]ria:?\s*(\d{5,6})/i, flat);

  // ===== TRIBUTAÇÃO IBS/CBS (quando o documento já traz esse bloco — notas emitidas a partir
  // de 2026, no formato "CST:000 Class.Tributária:000001 ... Base Cálc. Após Reduções: X ...
  // Alíq. CBS:0,90 ... Valor:52,70 ... Alíq. IBS UF:0,10 ... Valor:5,86 ...") =====
  f.cstIBSCBS = firstMatch(/\bCST:?\s*(\d{3})\b/i, flat);
  f.baseIBSCBS = firstMatch(/Base C[áa]lc\.?\s*Ap[óo]s\s*Redu[çc][õo]es:?\s*([\d.,]+)/i, flat) ||
                 firstMatch(/Base\s*(?:de\s*)?C[áa]lculo\s*IBS\s*\/?\s*CBS:?\s*([\d.,]+)/i, flat);
  f.aliqCBS = firstMatch(/Al[íi]q\.?\s*CBS:?\s*([\d.,]+)/i, flat);
  f.valorCBS = firstMatch(/Al[íi]q\.?\s*CBS:?[^\n]*?Valor:?\s*([\d.,]+)/i, flat);
  f.aliqIBSUf = firstMatch(/Al[íi]q\.?\s*IBS\s*UF:?\s*([\d.,]+)/i, flat);
  f.valorIBSUf = firstMatch(/Al[íi]q\.?\s*IBS\s*UF:?[^\n]*?Valor:?\s*([\d.,]+)/i, flat);
  f.aliqIBSMun = firstMatch(/Al[íi]q\.?\s*IBS\s*Mun:?\s*([\d.,]+)/i, flat);
  f.valorIBSMun = firstMatch(/Al[íi]q\.?\s*IBS\s*Mun:?[^\n]*?Valor:?\s*([\d.,]+)/i, flat);

  // ===== VALOR DO SERVIÇO, BASE, ALÍQUOTA E VALOR DO ISS =====
  // Formato A (Osasco): bloco "Valor Total do Serviço (-) Deduções(%) Base de Cálculo (ISS)
  // Alíq. ISS Valor ISS a Recolher" com os 5 números numa linha própria logo abaixo.
  let issHeaderIdx = -1;
  for (let i=0;i<lines.length;i++){
    if (/Valor Total do Servi[çc]o/i.test(lines[i]) && /Valor ISS a Recolher/i.test(lines[i])){ issHeaderIdx = i; break; }
  }
  if (issHeaderIdx === -1){
    for (let i=0;i<lines.length;i++){ if (/Valor Total do Servi[çc]o/i.test(lines[i])){ issHeaderIdx = i; break; } }
  }
  if (issHeaderIdx !== -1){
    for (let j = issHeaderIdx+1; j < Math.min(issHeaderIdx+8, lines.length); j++){
      const toks = lines[j].match(/-?[\d.]+,\d{2}%?/g);
      if (toks && toks.length === 5){
        f.valorServico = toks[0];
        f.deducoes = toks[1];
        f.baseISS = toks[2];
        f.aliqISS = toks[3];
        f.valorISS = toks[4];
        break;
      }
    }
  }
  // Formato B (Mairiporã e outras prefeituras no mesmo padrão): "VALOR TOTAL DA NOTA = R$
  // 5.975,32" para o valor do serviço; tabela separada "Alíquota ISSQN (%)" / "Valor do
  // ISSQN (R$)" / "Base de Cálculo (R$)" — cada um com o valor numa linha própria (o layout do
  // PDF entrega rótulo e valor em linhas separadas, nessa ordem: valor primeiro, rótulo depois,
  // ou vice-versa dependendo do extrator — por isso procura nas linhas vizinhas dos dois lados).
  if (!f.valorServico) f.valorServico = firstMatch(/VALOR TOTAL DA NOTA\s*=?\s*R\$?\s*([\d.,]+)/i, flat);
  if (!f.valorServico) f.valorServico = firstMatch(/Valor Total do Servi[çc]o:?\s*([\d.,]+)/i, flat);

  // Tabela "Alíquota ISSQN (%) | Valor do ISSQN (R$)": num layout comum, os dois cabeçalhos
  // ficam juntos numa linha e os dois valores juntos na linha seguinte, NA MESMA ORDEM — lê os
  // dois de uma vez para nunca misturar um número com o do vizinho.
  const idxAliqValorISSQN = lines.findIndex(l => /Al[íi]quota\s*ISSQN/i.test(l) && /Valor do ISSQN/i.test(l));
  if (idxAliqValorISSQN !== -1 && idxAliqValorISSQN+1 < lines.length){
    const toks = lines[idxAliqValorISSQN+1].match(/-?[\d.]+,\d{2}/g);
    if (toks && toks.length >= 2){ f.aliqISS = toks[0]; f.valorISS = toks[1]; }
  }
  function valorPertoDoRotulo(rotuloRe, maxVal){
    const idx = lines.findIndex(l => rotuloRe.test(l));
    if (idx === -1) return null;
    for (const j of [idx, idx-1, idx+1, idx-2, idx+2, idx-3, idx+3]){
      if (j<0 || j>=lines.length) continue;
      const m = lines[j].match(/-?[\d.]+,\d{2}/);
      if (m){
        const num = brNumToFloat(m[0]);
        if (maxVal !== undefined && (num === null || Math.abs(num) > maxVal)) continue; // implausível, tenta a próxima linha
        return m[0];
      }
    }
    return null;
  }
  // Alíquota do ISS: teto legal é 5% em todo o Brasil, então qualquer valor "próximo" acima de
  // 10 quase certamente é outro número da mesma região do PDF (não a alíquota) — descarta.
  if (!f.aliqISS) f.aliqISS = valorPertoDoRotulo(/Al[íi]quota\s*ISSQN/i, 10);
  if (!f.aliqISS) f.aliqISS = firstMatch(/Al[íi]q\.?\s*ISS:?\s*([\d.,]+)/i, flat);
  if (!f.valorISS) f.valorISS = valorPertoDoRotulo(/Valor do ISSQN/i);
  if (!f.valorISS) f.valorISS = firstMatch(/Valor ISS a Recolher:?\s*([\d.,]+)/i, flat);
  if (!f.valorISS) f.valorISS = firstMatch(/Valor do ISSQN\s*\(?R?\$?\)?:?\s*([\d.,]+)/i, flat);

  // Tabela "Desconto Incondicional (R$) | Deduções (R$) | Base de Cálculo (R$) | ISSQN Retido
  // na Fonte": mesmo princípio — lê os cabeçalhos e a linha de valores juntos, mapeando os
  // números encontrados aos últimos N cabeçalhos (os primeiros, se vazios, simplesmente não
  // aparecem na linha de valores).
  const idxTabelaBase = lines.findIndex(l => /Desconto Incondicional/i.test(l) && /Base de C[áa]lculo/i.test(l));
  if (idxTabelaBase !== -1 && idxTabelaBase+1 < lines.length){
    const valoresLine = lines[idxTabelaBase+1];
    const numeros = valoresLine.match(/-?[\d.]+,\d{2}/g) || [];
    // "Desconto Incondicional", "Deduções", "Base de Cálculo" nessa ordem; o que sobrar de
    // números vai para os últimos rótulos da lista (o de Base de Cálculo é sempre o mais à
    // direita e o mais provável de estar preenchido).
    const rotulosNumericos = ['desconto','deducoes','baseISS'];
    const inicio = rotulosNumericos.length - numeros.length;
    numeros.forEach((n, idx) => {
      const campo = rotulosNumericos[inicio+idx];
      if (campo === 'baseISS' && !f.baseISS) f.baseISS = n;
      if (campo === 'deducoes' && !f.deducoes) f.deducoes = n;
    });
  }
  if (!f.baseISS) f.baseISS = valorPertoDoRotulo(/Base de C[áa]lculo\s*\(R\$\)/i);
  if (!f.baseISS && f.valorServico && !f.deducoes) f.baseISS = f.valorServico; // sem dedução: base = valor do serviço


  // Layout tabelado do padrão nacional (ex.: Cachoeirinha) + campos gerais de qualquer layout.
  extrairNFSeNacionalTabelada(lines, flat, f);
  extrairCamposGeraisNFSe(lines, flat, f);
  return completarCamposNacionais(f);
}


/* ---------- DANFSe v2.0 (padrão nacional, leiaute em blocos): cada linha de rótulos é
   seguida pela linha de valores. Lê só o que consta no documento; "-" fica em branco. ---------- */
const V2_MOEDA = /R\$\s?-?[\d.]+,\d{2}|(?<=^|\s)-(?=\s|$)/g;
function v2Moeda(t){ if (!t || t === '-') return null; const n = brNumToFloat(String(t).replace(/R\$\s?/,'')); return n === null ? null : n.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2}); }
function v2Pcts(t){ return (String(t||'').match(/-?[\d.]*\d,\d+\s?%/g) || []).map(p => p.replace(/\s?%/,'')); }
function v2Vazio(t){ t = (t||'').trim(); return !t || t === '-' ? null : t; }
function ehDANFSeV2(lines){
  return lines.some(l => /^DANFSe\s*v?\s*\d/i.test(l)) ||
    (lines.some(l => /CHAVE DE ACESSO DA NFS-e/i.test(l)) && lines.some(l => /^TRIBUTA[ÇC][ÃA]O IBS\s*\/\s*CBS\s+CST\s*\/\s*cClassTrib/i.test(l)));
}
function v2SepararMunicipio(pre, municipioDoc){
  pre = (pre||'').trim();
  if (municipioDoc && pre.toLowerCase().endsWith(municipioDoc.toLowerCase()) && pre.length > municipioDoc.length)
    return [pre.slice(0, pre.length - municipioDoc.length).trim(), municipioDoc];
  const m = pre.match(/^(.*?\S)\s+((?:[A-ZÀ-Ý][a-zà-ÿ']+)(?:\s+(?:[A-ZÀ-Ý][a-zà-ÿ']+|d[aeo]s?|de|e))*)$/);
  return m ? [m[1].trim(), m[2].trim()] : [pre, null];
}
function extrairDANFSeV2(lines){
  if (!ehDANFSeV2(lines)) return null;
  const f = {};
  const L = lines.map(l => String(l||'').trim());
  const achar = (re, de = 0) => { for (let i = de; i < L.length; i++) if (re.test(L[i])) return i; return -1; };
  const valorDe = (re, de = 0) => { const i = achar(re, de); return i < 0 ? null : (L[i+1] || ''); };
  const mCab = (L.find(l => /Munic[íi]pio:\s*/i.test(l)) || '').match(/Munic[íi]pio:\s*(.+?)\s*-\s*([A-Z]{2})\s*$/);
  const municipioDoc = mCab ? mCab[1].trim() : null;
  if (mCab) f.municipioEmissor = mCab[1].trim() + ' - ' + mCab[2];

  // Identificação
  const iChave = achar(/CHAVE DE ACESSO DA NFS-e/i);
  if (iChave >= 0){ const m = (L[iChave+1]||'').match(/\d{50}/); if (m) f.chaveAcesso = m[0]; }
  let v = valorDe(/N[ÚU]MERO DA NFS-e.*COMPET[ÊE]NCIA/i);
  let m = v && v.match(/^(\d+)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/);
  if (m){ f.numeroNota = m[1]; f.dataFatoGerador = m[2]; f.dataEmissao = m[3]; if (m[4]) f.horaEmissao = m[4]; }
  v = valorDe(/N[ÚU]MERO DA DPS.*S[ÉE]RIE DA DPS/i);
  m = v && v.match(/^(\d+)\s+(\S+)\s+(\d{2}\/\d{2}\/\d{4})/);
  if (m){ f.numeroDPS = m[1]; f.serieNota = m[2]; }
  v = valorDe(/EMITENTE DA NFS-e.*SITUA[ÇC][ÃA]O DA NFS-e/i);
  m = v && v.match(/^(\S+)\s+(NFS-e\s+\S+)\s+(NFS-e\s+.+)$/i);
  if (m){ f.emitenteNFSe = m[1]; f.situacaoNota = m[2]; f.finalidadeNFSe = m[3].trim(); }

  // Prestador e tomador (mesma estrutura de três linhas de rótulo)
  const blocoPessoa = (reIni, pref) => {
    const i0 = achar(reIni); if (i0 < 0) return;
    const doc = (L[i0+1]||'').match(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}|\S+)\s*(\S+)?\s*(.*)$/);
    if (doc){ f[pref+'CNPJ'] = v2Vazio(doc[1]); f[pref+'IM'] = v2Vazio(doc[2]); if (pref === 'prestador') f.prestadorTelefone = v2Vazio(doc[3]); }
    const iNome = achar(/^Nome\s*\/\s*Nome Empresarial/i, i0);
    if (iNome >= 0 && iNome < i0 + 4){
      const nm = (L[iNome+1]||'').match(/^(.*?)\s*\/\s*([A-Z]{2})\s+([\d.]+)\s*\/\s*([\d.\-]+)\s*$/);
      if (nm){ const [nome, mun] = v2SepararMunicipio(nm[1], municipioDoc); f[pref+'Nome'] = nome; f[pref+'Municipio'] = mun ? mun + ' - ' + nm[2] : nm[2]; f[pref+'CEP'] = nm[4]; f[pref+'IBGE'] = nm[3]; }
      else f[pref+'Nome'] = v2Vazio(L[iNome+1]);
    }
    const iEnd = achar(/^Endere[çc]o\s+E-mail/i, i0);
    if (iEnd >= 0 && iEnd < i0 + 6){
      const e = (L[iEnd+1]||'').match(/^(.*?)\s+(\S+@\S+|-)\s*$/);
      if (e){ f[pref+'Endereco'] = v2Vazio(e[1]); f[pref+'Email'] = v2Vazio(e[2]); } else f[pref+'Endereco'] = v2Vazio(L[iEnd+1]);
    }
  };
  blocoPessoa(/^PRESTADOR\s*\/\s*FORNECEDOR/i, 'prestador');
  blocoPessoa(/^TOMADOR\s*\/\s*ADQUIRENTE/i, 'tomador');
  v = valorDe(/^Simples Nacional na Data de Compet[êe]ncia/i);
  if (v){ const s = v.match(/^(.*?)\s+(\S+)$/); f.simplesNacional = v2Vazio(s ? s[1] : v); }

  // Serviço prestado
  const iServ = achar(/^SERVI[ÇC]O PRESTADO/i);
  if (iServ >= 0){
    const s = L[iServ+1] || '';
    const cod = s.match(/^(\d{2}\.\d{2}\.\d{2})(?:\s*\/\s*(\d+))?/);
    if (cod){ f.codigoTribNacional = cod[1]; f.codigoServico = cod[1].slice(0,5); if (cod[2]) f.codigoTribMunicipal = cod[2]; }
    const nbs = s.match(/\b(\d\.\d{4}\.\d{2}\.\d{2})\b/);
    if (nbs){ f.nbs = nbs[1]; f.localPrestacao = v2Vazio(s.slice(nbs.index + nbs[1].length)); }
    const iDesc = achar(/^Descri[çc][ãa]o do Servi[çc]o\s*$/i, iServ);
    if (iDesc > iServ + 1) f.descricaoSubitemLC116 = L.slice(iServ+2, iDesc).join(' ').trim() || null;
    const iFim = achar(/^TRIBUTA[ÇC][ÃA]O MUNICIPAL/i, iServ);
    if (iDesc >= 0) f.descricaoServico = L.slice(iDesc+1, iFim < 0 ? iDesc+8 : iFim).join(' ').trim() || null;
  }

  // Tributação municipal (ISSQN)
  v = valorDe(/^TRIBUTA[ÇC][ÃA]O MUNICIPAL \(ISSQN\)/i);
  if (v){
    const t = v.match(/^(Opera[çc][ãa]o Tribut[áa]vel|Imunidade|Exporta[çc][ãa]o de Servi[çc]os?|N[ãa]o Incid[êe]ncia|Isen[çc][ãa]o|Suspens[ãa]o[^/]*?)\s+(.*)$/i);
    if (t){ f.tipoTributacaoISS = t[1]; f.incidenciaISS = v2Vazio(t[2]); } else f.tipoTributacaoISS = v2Vazio(v);
  }
  v = valorDe(/^Benef[íi]cio Municipal/i);
  if (v){
    const toks = v.match(V2_MOEDA) || [];
    const ini = v.search(/\s(?:-|R\$)\s?/);
    if (ini > 0) f.beneficioMunicipal = v2Vazio(v.slice(0, ini));
    const ult = toks.slice(-3);
    if (ult.length === 3){ f.calculoBM = v2Vazio(ult[0]); f.deducoes = v2Moeda(ult[1]); f.descontoIncondicionado = v2Moeda(ult[2]); }
  }
  v = valorDe(/^BC ISSQN\s+Al[íi]quota Aplicada/i);
  if (v){
    m = v.match(/^(R\$\s?[\d.,]+|-)\s+(?:([\d.,]+)\s?%|-)\s+(.*?)\s+(R\$\s?[\d.,]+|-)\s*$/);
    if (m){ f.baseISS = v2Moeda(m[1]); if (m[2]) f.aliqISS = nfsePctBR(m[2]); f.issRetido = v2Vazio(m[3]); f.valorISS = v2Moeda(m[4]); }
  }

  // Tributação federal
  v = valorDe(/^TRIBUTA[ÇC][ÃA]O FEDERAL/i);
  if (v){ const t = v.match(V2_MOEDA) || []; if (t.length >= 3){ f.irRetido = v2Moeda(t[0]); f.inssRetido = v2Moeda(t[1]); f.csllRetido = v2Moeda(t[2]); } }
  v = valorDe(/^PIS\s*-\s*D[ée]bito Apura[çc][ãa]o Pr[óo]pria/i);
  if (v){
    const t = v.match(V2_MOEDA) || [];
    if (t.length >= 2){ f.pisDebitoProprio = v2Moeda(t[0]) || "0,00"; f.cofinsDebitoProprio = v2Moeda(t[1]) || "0,00"; }
    let resto = v; for (const x of t.slice(0, 2)) resto = resto.replace(x, '');
    f.descricaoContribSociais = v2Vazio(resto.trim());
  }

  // Tributação IBS/CBS
  v = valorDe(/^TRIBUTA[ÇC][ÃA]O IBS\s*\/\s*CBS/i);
  if (v){
    m = v.match(/^(\d{3})\s*\/\s*(\d{6})\s*(.*)$/);
    if (m){ f.cstIBSCBS = m[1]; f.cclasstrib = m[2]; f.incidenciaIBSCBS = v2Vazio(m[3]); }
  }
  v = valorDe(/^Exclus[õo]es e Redu[çc][õo]es da Base de C[áa]lculo/i);
  if (v){
    const t = v.match(/R\$\s?-?[\d.]+,\d{2}|(?<=^|\s)-(?=\s)/g) || [];
    f.exclusoesIBSCBS = v2Moeda(t[0]); f.baseIBSCBS = v2Moeda(t[1]);
    const p = v2Pcts(v);
    if (p.length >= 5){ f.redIBSUf = p[0]; f.redIBSMun = p[1]; f.redCBS = p[2]; f.aliqIBSUf = p[3]; f.aliqIBSMun = p[4]; }
    else if (p.length === 4){ f.redIBSUf = p[0]; f.redIBSMun = p[0]; f.redCBS = p[1]; f.aliqIBSUf = p[2]; f.aliqIBSMun = p[3]; }
  }
  v = valorDe(/^Al[íi]q\.\s*Efetiva Municipal\s*-\s*IBS/i);
  if (v){ const p = v2Pcts(v), t = v.match(/R\$\s?-?[\d.]+,\d{2}/g) || []; if (p.length >= 2){ f.aliqEfIBSMun = p[0]; f.aliqEfIBSUf = p[1]; } if (t.length >= 2){ f.valorIBSMun = v2Moeda(t[0]); f.valorIBSUf = v2Moeda(t[1]); } }
  v = valorDe(/^Valor Total Apurado\s*-\s*IBS/i);
  if (v){ const p = v2Pcts(v), t = v.match(/R\$\s?-?[\d.]+,\d{2}/g) || []; if (t.length >= 2){ f.valorIBS = v2Moeda(t[0]); f.valorCBS = v2Moeda(t[1]); } if (p.length >= 2){ f.aliqCBS = p[0]; f.aliqEfCBS = p[1]; } }

  // Totais
  v = valorDe(/^VALOR TOTAL DA NFS-e/i);
  if (v){
    const t = v.match(V2_MOEDA) || []; const o = t.length >= 4 ? t.slice(1) : t;
    f.valorServico = v2Moeda(o[0]);
    if (o[1] && o[1] !== '-') f.descontoIncondicionado = v2Moeda(o[1]);
    f.descontoCondicionado = v2Moeda(o[2]);
  }
  v = valorDe(/^Total das Reten[çc][õo]es/i);
  if (v){
    const t = v.match(V2_MOEDA) || [];
    f.totalRetencoes = v2Moeda(t[0]); f.valorLiquido = v2Moeda(t[1]); f.totalTributacao = v2Moeda(t[2]); f.valorLiquidoComIBSCBS = v2Moeda(t[3]);
  }

  // Informações complementares
  const iInf = achar(/^INFORMA[ÇC][ÕO]ES COMPLEMENTARES/i);
  if (iInf >= 0){
    const fim = achar(/^DATA CIENTIFICA[ÇC][ÃA]O/i, iInf);
    const inf = L.slice(iInf+1, fim < 0 ? L.length : fim).filter(Boolean);
    f.informacoesComplementares = inf.join(' ') || null;
    const ta = inf.find(l => /Totais aproximados dos Tributos/i.test(l));
    if (ta) f.tributosAproximados = ta.replace(/^.*?:\s*(?=Federais)/i, '').trim();
  }
  if (!f.baseISS && f.valorServico) f.baseISS = f.valorServico;
  Object.keys(f).forEach(k => { if (f[k] === undefined) f[k] = null; });
  f._layoutNFSe = 'DANFSe v2.0';
  return f;
}

function allMatchesLocal(re, text){
  const out = []; let m; const r = new RegExp(re,'gi');
  while ((m = r.exec(text)) !== null) out.push(m[1].trim());
  return out;
}


/* ===== Motor · extracao/danfse-v2-posicao.js ===== */
/**
 * Motor de Cálculo Reforma Tributária — TaxAdvice
 * Núcleo · DANFSe v2.0 (NFS-e padrão nacional) em PDF — leitura pela POSIÇÃO de cada texto.
 *
 * Mesma regra da v4.0.0-beta.46 (preservada a pedido de 11/10/2026): no DANFSe v2.0 os rótulos
 * (fonte em negrito) ficam numa linha e os valores logo abaixo, na mesma coluna. Cada rótulo do
 * PDF vai para o campo correspondente da aba "Dados da nota de serviço".
 * A interface envia só os textos da 1ª página com posição e fonte (documento.itens); a leitura
 * é feita aqui, no servidor.
 *
 * USO EXCLUSIVO NO SERVIDOR. Propriedade da TaxAdvice — não distribuir.
 */
const norm = t => String(t || '').replace(/\s+/g, ' ').trim();
const semAcento = t => norm(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

const MAPA = [
  [/^CHAVE DE ACESSO DA NFS-?E$/, 'chaveAcesso'], [/^NUMERO DA NFS-?E$/, 'numeroNota'], [/^COMPETENCIA DA NFS-?E$/, 'dataFatoGerador'],
  [/^DATA E HORA DA EMISSAO DA NFS-?E$/, 'dataEmissao'], [/^NUMERO DA DPS$/, 'numeroDPS'], [/^SERIE DA DPS$/, 'serieNota'],
  [/^DATA E HORA DA EMISSAO DA DPS$/, 'horaEmissao'], [/^EMITENTE DA NFS-?E$/, 'emitenteNFSe'], [/^SITUACAO DA NFS-?E$/, 'situacaoNota'],
  [/^FINALIDADE$/, 'finalidadeNFSe'],
  [/^CNPJ \/ CPF \/ NIF$/, '*CNPJ'], [/^INDICADOR MUNICIPAL/, '*IM'], [/^TELEFONE$/, '*Telefone'], [/^NOME \/ NOME EMPRESARIAL$/, '*Nome'],
  [/^MUNICIPIO \/ SIGLA UF$/, '*Municipio'], [/^CODIGO IBGE \/ CEP$/, '*IBGECEP'], [/^ENDERECO$/, '*Endereco'], [/^E-?MAIL$/, '*Email'],
  [/^SIMPLES NACIONAL NA DATA DE COMPETENCIA$/, 'simplesNacionalSituacao'], [/^REGIME DE APURACAO TRIBUTARIA PELO SN$/, 'regimeApuracaoSN'],
  [/^SERVICO PRESTADO$/, 'descricaoTribNacional'], [/^CODIGO DE TRIBUTACAO NACIONAL\/MUNICIPAL$/, 'codigoServico'], [/^CODIGO DA NBS$/, 'nbs'],
  [/^LOCAL DA PRESTACAO/, 'localPrestacao'], [/^DESCRICAO DO SERVICO$/, 'descricaoServico'],
  [/^TIPO DE TRIBUTACAO DO ISSQN$/, 'tipoTributacaoISS'], [/INCIDENCIA DO ISSQN$/, 'incidenciaISS'], [/^BENEFICIO MUNICIPAL$/, 'beneficioMunicipal'],
  [/^CALCULO DO BM$/, 'calculoBM'], [/^TOTAL DEDUCOES\/REDUCOES$/, 'deducoes'], [/^DESCONTO INCONDICIONADO$/, '#descontoIncondicionado'],
  [/^BC ISSQN$/, 'baseISS'], [/^ALIQUOTA APLICADA$/, 'aliqISS'], [/^RETENCAO DO ISSQN$/, 'issRetido'], [/^ISSQN APURADO$/, 'valorISS'],
  [/^IRRF$/, 'irRetido'], [/^CONTRIBUICAO PREVIDENCIARIA - RETIDA$/, 'inssRetido'], [/^CONTRIBUICOES SOCIAIS - RETIDAS$/, 'csllRetido'],
  [/^PIS - DEBITO APURACAO PROPRIA$/, 'pisDebitoProprio'], [/^COFINS - DEBITO APURACAO PROPRIA$/, 'cofinsDebitoProprio'],
  [/^DESCRICAO CONTRIB\. SOCIAIS - RETIDAS$/, 'descricaoContribSociais'],
  [/^CST \/ CCLASSTRIB$/, 'cstCClassTribTxt'], [/^INDICADOR DE OPERACAO/, 'incidenciaIBSCBS'],
  [/^EXCLUSOES E REDUCOES DA BASE DE CALCULO$/, 'exclusoesIBSCBS'], [/^BASE DE CALCULO APOS EXCLUSOES E REDUCOES$/, 'baseIBSCBS'],
  [/^RED\. ALIQUOTA IBS/, 'redAliqTxt'], [/^ALIQUOTA - IBS UF \/ IBS MUN$/, 'aliqIBSTxt'],
  [/^ALIQ\. EFETIVA MUNICIPAL - IBS$/, 'aliqEfIBSMun'], [/^VALOR APURADO MUNICIPAL - IBS$/, 'valorIBSMun'],
  [/^ALIQ\. EFETIVA ESTADUAL - IBS$/, 'aliqEfIBSUf'], [/^VALOR APURADO ESTADUAL - IBS$/, 'valorIBSUf'], [/^VALOR TOTAL APURADO - IBS$/, 'valorIBS'],
  [/^ALIQUOTA - CBS$/, 'aliqCBS'], [/^ALIQUOTA EFETIVA - CBS$/, 'aliqEfCBS'], [/^VALOR TOTAL APURADO - CBS$/, 'valorCBS'],
  [/^VALOR DA OPERACAO \/ SERVICO$/, 'valorServico'], [/^DESCONTO CONDICIONADO$/, 'descontoCondicionado'],
  [/^TOTAL DAS RETENCOES/, 'totalRetencoes'], [/^VALOR LIQUIDO DA NFS-?E$/, 'valorLiquido'], [/^TOTAL DO IBS\/CBS$/, 'totalIBSCBS'],
  [/^VALOR LIQUIDO DA NFS-?E \+ IBS\/CBS$/, 'valorLiquidoIBSCBS'], [/^INFORMACOES COMPLEMENTARES$/, 'informacoesComplementares']
];

/** itens: [{str, x, y, font}] da 1ª página (pdf.js). Devolve {campo: texto} ou null se não for DANFSe v2.0. */
function lerDANFSeV2PorPosicao(itens) {
  if (!Array.isArray(itens) || !itens.length) return null;
  const chave = itens.find(i => /^CHAVE DE ACESSO DA NFS-?E$/i.test(norm(i.str)));
  if (!chave || !itens.some(i => /DANFSe/i.test(i.str))) return null;
  const fonteRotulo = chave.font;
  const rot = itens.filter(i => i.font === fonteRotulo), val = itens.filter(i => i.font !== fonteRotulo);
  const valor = L => {
    const abaixo = rot.filter(o => o.y < L.y - 2).map(o => o.y);
    const lim = abaixo.length ? Math.max(...abaixo) : -Infinity;
    return val.filter(v => Math.abs(v.x - L.x) < 4 && v.y < L.y - 2 && v.y > lim)
      .sort((a, b) => b.y - a.y).map(v => norm(v.str)).join(' ').trim();
  };
  const secY = re => { const s = rot.find(o => re.test(semAcento(o.str))); return s ? s.y : null; };
  const yPrest = secY(/^PRESTADOR \/ FORNECEDOR$/), yToma = secY(/^TOMADOR \/ ADQUIRENTE$/),
        yServ = secY(/^SERVICO PRESTADO$/), yIss = secY(/^TRIBUTACAO MUNICIPAL/), yTot = secY(/^VALOR TOTAL DA NFS-?E$/);
  const secao = y => (yPrest !== null && y <= yPrest + 2 && (yToma === null || y > yToma + 2)) ? 'prest'
    : (yToma !== null && y <= yToma + 2 && (yServ === null || y > yServ + 2)) ? 'toma'
    : (yTot !== null && y <= yTot + 2) ? 'tot'
    : (yIss !== null && y <= yIss + 2) ? 'trib' : 'outro';
  const out = {};
  rot.forEach(L => {
    const t = semAcento(L.str);
    const m = MAPA.find(([re]) => re.test(t));
    if (!m) return;
    let k = m[1];
    const sec = secao(L.y);
    if (k[0] === '*') { if (sec !== 'prest' && sec !== 'toma') return; k = (sec === 'prest' ? 'prestador' : 'tomador') + k.slice(1); }
    if (k[0] === '#') k = sec === 'tot' ? 'descontoIncondicionadoTotal' : k.slice(1);
    out[k] = valor(L);
  });
  return out;
}

// Valores em R$ e % do DANFSe → formato numérico do motor; "-" em campo de valor → 0,00 (como na beta.46).
const MOEDA = ['deducoes', 'descontoIncondicionado', 'descontoIncondicionadoTotal', 'descontoCondicionado', 'baseISS', 'valorISS', 'irRetido', 'inssRetido', 'csllRetido',
  'pisDebitoProprio', 'cofinsDebitoProprio', 'exclusoesIBSCBS', 'baseIBSCBS', 'valorIBSMun', 'valorIBSUf', 'valorIBS', 'valorCBS', 'valorServico', 'totalRetencoes',
  'valorLiquido', 'totalIBSCBS', 'valorLiquidoIBSCBS'];
const PCT = ['aliqISS', 'aliqEfIBSMun', 'aliqEfIBSUf', 'aliqCBS', 'aliqEfCBS'];

/** Aplica os campos lidos por posição sobre os campos já extraídos (s). Mesma regra da beta.46. */
function aplicarDANFSeV2(s, d) {
  if (!d) return s;
  const num = v => { const t = norm(v).replace(/^R\$\s*/, '').replace(/\s*%$/, ''); return (t === '-' || t === '') ? '0,00' : t; };
  Object.keys(d).forEach(k => {
    let v = d[k];
    if (v === undefined || v === null || v === '') return;
    if (MOEDA.includes(k) || PCT.includes(k)) v = num(v);
    s[k] = v;
  });
  // Desdobramentos dos campos combinados do DANFSe
  if (d.codigoServico) { const p = d.codigoServico.split('/').map(norm); s.codigoTribNacional = p[0]; s.codigoTribMunicipal = p[1] || null; }
  if (d.cstCClassTribTxt) { const p = d.cstCClassTribTxt.split('/').map(norm); s.cstIBSCBS = p[0]; s.cclasstrib = p[1] || s.cclasstrib; }
  if (d.aliqIBSTxt) { const p = d.aliqIBSTxt.split('/').map(num); s.aliqIBSUf = p[0]; s.aliqIBSMun = p[1] || '0,00'; }
  if (d.redAliqTxt) { const p = d.redAliqTxt.split('/').map(num); s.redIBSUf = p[0]; s.redIBSMun = p[1] || null; s.redCBS = p[2] || null; }
  if (d.prestadorIBGECEP) { const p = d.prestadorIBGECEP.split('/').map(norm); s.prestadorIBGE = p[0]; s.prestadorCEP = p[1] || s.prestadorCEP; }
  if (d.tomadorIBGECEP) { const p = d.tomadorIBGECEP.split('/').map(norm); s.tomadorIBGE = p[0]; s.tomadorCEP = p[1] || s.tomadorCEP; }
  if (d.prestadorMunicipio) s.municipioEmissor = d.prestadorMunicipio;
  if (d.chaveAcesso) s.codigoVerificacao = d.chaveAcesso; // no DANFSe nacional o identificador é a chave de acesso
  if (d.descontoIncondicionadoTotal && num(d.descontoIncondicionadoTotal) !== '0,00') s.descontoIncondicionado = num(d.descontoIncondicionadoTotal);
  s._danfseV2 = true;
  return s;
}


/* ===== Motor · extracao/deteccao.js ===== */
/**
 * Motor de Cálculo Reforma Tributária — TaxAdvice
 * Núcleo · Detecção do tipo de documento pelo conteúdo.
 *
 * USO EXCLUSIVO NO SERVIDOR. Propriedade da TaxAdvice — não distribuir.
 */

/* ---------- Seleção do tipo de documento (cartões) ---------- */
function rotuloTipo(t){
  return t==='produto' ? 'NF-e — Modelo 55 (Mercadorias)' : t==='servico' ? 'Nota Fiscal de Serviço' : 'Conhecimento de Transporte (CT-e)';
}

function detectarTipoPorXML(xmlDoc){
  const raiz = xmlDoc.documentElement ? xmlDoc.documentElement.tagName.toLowerCase() : '';
  const todasTags = Array.from(xmlDoc.getElementsByTagName('*')).map(e => e.tagName.toLowerCase());
  const tem = nome => todasTags.some(t => t === nome || t.endsWith(':'+nome));
  if (raiz.includes('cte') || tem('cte') || tem('infcte')) return 'transporte';
  if (raiz.includes('nfe') || tem('nfe') || tem('infnfe')) return 'produto';
  if (raiz.includes('nfse') || tem('nfse') || tem('infdps') || tem('infnfse')) return 'servico';
  return 'produto';
}

function detectarTipoPorTexto(text){
  const t = text.toUpperCase();
  if (/DACTE|CONHECIMENTO DE TRANSPORTE/.test(t)) return 'transporte';
  const temNFSe = /NFS-E|NOTA FISCAL DE SERVI/.test(t) || /\bNBS\b/.test(t) || /C[ÓO]D\.\s*(?:DO\s*)?SERVI[ÇC]O/.test(t);
  const temDANFE = /DANFE|NOTA FISCAL ELETR[ÔO]NICA|CHAVE DE ACESSO/.test(t) && /\bNCM\b/.test(t);
  if (temNFSe && !temDANFE) return 'servico';
  if (temDANFE) return 'produto';
  if (temNFSe) return 'servico';
  return 'produto';
}


return { extractServicoXML, extractServicoPDF, completarCamposNacionais, lerDANFSeV2PorPosicao, aplicarDANFSeV2, detectarTipoPorTexto, brNumToFloat };
})();
