  /* =====================================================================
     V108 — NFS-e em PDF: nenhuma nota de serviço fica de fora
     1. OCR embutido (Tesseract 7, português, offline): PDF sem camada de
        texto (ex.: "Microsoft: Print To PDF", digitalizado) é renderizado
        página a página pelo pdf.js e lido por OCR. tipo_de_documento
        "NFS-e (PDF)" e coluna leitura_pdf = "OCR (PDF de imagem) — conferir".
     2. Detecção de NFS-e mais robusta: o detector do Motor tratava como DANFE
        notas com "NOTA FISCAL ELETRÔNICA" + "NCM" em qualquer ponto e não
        reconhecia "NFSe" sem hífen / "NOTA FISCAL ELETRONICA DE SERVICOS"
        (ex.: Barueri). É DANFE só com DANFE + NCM + CFOP e sem sinais de
        serviço (prestador/tomador, ISS/ISSQN, NFS-e).
     3. Leitor complementar de leiautes (texto ou OCR): linhas de rótulos
        seguidas da linha de valores — Prefeitura de São Paulo (retenções,
        deduções/base/alíquota/ISS), Barueri (ISSQN, retenções, item com
        código e alíquota), Caieiras (número "3.452/NFE", retenções de INSS,
        ISS e PIS/COFINS/CSLL). Os valores encontrados aqui prevalecem sobre os
        do leitor do Motor; nomes e CNPJs só completam o que faltar.
        CSLL retida das "Contribuições Sociais - Retidas" (PIS+COFINS+CSLL) =
        total ÷ 4,65 (1% de 4,65%). ISS sem valor impresso = base × alíquota.
     4. NFS-e reconhecida, mas sem número nem valor legíveis, também entra na
        aba ISS (número "SEM NÚMERO", leitura_pdf "Leitura parcial — conferir
        o PDF"), em vez de ficar só na lista de erros.
     ===================================================================== */
  const SERVICO_V108 = /NFS-?E\b|NFSE|NOTA FISCAL (ELETR[ÔO]NICA )?DE SERVI[ÇC]OS|PRESTADOR DE SERVI[ÇC]OS|TOMADOR DE SERVI[ÇC]O|ISSQN|IMPOSTO SOBRE SERVI[ÇC]OS|DANFSE|C[ÓO]DIGO DO SERVI[ÇC]O/;
  let arqAtualV108 = '';
  const nBRV108 = s => { const t = String(s || '').replace(/[^\d.,-]/g, ''); if (!t) return 0; return num(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t); };
  const valoresV108 = s => (String(s || '').match(/-?\d{1,3}(?:\.\d{3})*,\d{2,4}/g) || []).map(nBRV108);
  const limpaNomeV108 = s => String(s || '').replace(/\s+(CPF|CNPJ)\s*\/?.*$/i, '').replace(/^[^A-Za-zÀ-ú0-9]+/, '').replace(/[\s:;|-]+$/g, '').replace(/\s{2,}/g, ' ');
  // linha de rótulos (2 ou mais) + linha seguinte com os valores, na ordem em que os rótulos aparecem
  function porCabecalhoV108(linhas, rotulos, minimo = 2){
    for (let i = 0; i < linhas.length - 1; i++){
      const l = linhas[i], achados = [];
      for (const [re, campo] of rotulos){ const m = l.match(re); if (m) achados.push([m.index, campo]); }
      if (achados.length < minimo) continue;
      achados.sort((a, b) => a[0] - b[0]);
      let j = i + 1; while (j < linhas.length && !valoresV108(linhas[j]).length && j <= i + 2) j++;
      const vals = valoresV108(linhas[j] || ''); if (!vals.length) continue;
      const o = {__linha: linhas[j]}; achados.forEach(([, campo], k) => { if (k < vals.length) o[campo] = vals[k]; });
      return o;
    }
    return null;
  }
  function leiautesV108(linhas){
    const L = linhas.map(s => String(s || '').trim()).filter(Boolean), T = L.join('\n'), f = {};
    const set = (k, v) => { if (v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && isNaN(v))) f[k] = v; };
    // número da nota
    let m = T.match(/N[úu]mero (?:da )?NFS-?e\s*[|:\]]?\s*(\d{1,15})/i) || T.match(/(?:^|\n)\s*([\d.]{1,12})\s*\/\s*NF-?S?E\b/i);
    if (!m){ const i = L.findIndex(l => /N[úu]mero da Nota/i.test(l)); if (i >= 0){ const a = (L[i].match(/(\d{4,15})\s*$/) || L[i + 1] && L[i + 1].match(/(\d{4,15})\s*$/)); if (a) m = a; } }
    if (m) set('numeroNota', String(+String(m[1]).replace(/\D/g, '')));
    // data de emissão
    m = T.match(/Data (?:e Hora )?(?:de )?Emiss[ãa]o[^\n]*\n?[^\n]*?(\d{2}\/\d{2}\/\d{2,4})/i) || T.match(/NFS?-?E\s+(\d{2}\/\d{2}\/\d{2,4})/i);
    if (m) set('dataEmissao', m[1].replace(/\/(\d{2})$/, '/20$1'));
    // município emissor
    m = T.match(/PREFEITURA (?:DO )?MUNIC[ÍI]P(?:IO|AL) DE ([A-ZÀ-Úa-zà-ú ]{3,40}?)\s*(?:\n|$|[^A-Za-zÀ-ú ])/i);
    if (m) set('municipioEmissor', m[1].trim().replace(/(\s+\S{1,2})+$/, '').replace(/\b\w/g, c => c.toUpperCase()));
    // valor do serviço
    m = T.match(/VALOR TOTAL D[OA] (?:SERVI[ÇC]O|NOTA)\s*=?\s*R?\$?\s*([\d.]+,\d{2})/i);
    if (m) set('valorServico', nBRV108(m[1]));
    // São Paulo: retenções / deduções, base, alíquota e ISS
    const sp1 = porCabecalhoV108(L, [[/Contribui[çc][ãa]o Previdenci/i, 'inss'], [/IRRF/i, 'ir'], [/COFINS/i, 'cofins'], [/PIS\/PASEP/i, 'pis'], [/\bIPI\b/i, 'ipi']], 3);
    if (sp1){ set('inssRetido', sp1.inss); set('irRetido', sp1.ir); }
    const sp2 = porCabecalhoV108(L, [[/Contribui[çc][õo]es Sociais\s*-\s*Retidas/i, 'csrf'], [/Descri[çc][ãa]o Contribui/i, 'desc']]);
    if (sp2 && sp2.csrf > 0.005 && !/N[ãa]o Retid/i.test(sp2.__linha)) set('csllRetido', arred(sp2.csrf / 4.65));
    const sp3 = porCabecalhoV108(L, [[/Dedu[çc][õo]es/i, 'deducao'], [/Base de C[áa]lculo/i, 'base'], [/Al[íi]quota/i, 'aliq'], [/Valor do ISS/i, 'iss'], [/Cr[ée]dito/i, 'credito']], 3);
    if (sp3){ set('deducoes', sp3.deducao); set('baseISS', sp3.base); set('aliqISS', sp3.aliq); set('valorISS', sp3.iss); }
    // Barueri: quadro do ISSQN
    const ba1 = porCabecalhoV108(L, [[/Valor total dos servi/i, 'valor'], [/Desconto Incond/i, 'descInc'], [/Dedu[çc][õo]es/i, 'deducao'], [/Base de C[áa]lculo/i, 'base'], [/Total do ISSQN/i, 'iss'], [/Desconto Condic/i, 'descCond']], 3);
    if (ba1){ set('valorServico', ba1.valor); set('deducoes', ba1.deducao); set('baseISS', ba1.base); set('valorISS', ba1.iss); f.issRetido = /\bSim\b/i.test(ba1.__linha) ? 'SIM' : 'NÃO'; }
    const ba2 = porCabecalhoV108(L, [[/^PIS\b/i, 'pis'], [/COFINS/i, 'cofins'], [/\bINSS\b/i, 'inss'], [/IRRF/i, 'ir'], [/CSLL/i, 'csll'], [/Outras Reten/i, 'outras']], 4);
    if (ba2){ set('inssRetido', ba2.inss); set('irRetido', ba2.ir); set('csllRetido', ba2.csll); }
    // item com código do serviço e alíquota (Barueri e semelhantes)
    const iItem = L.findIndex(l => /C[óo]digo (?:do )?Servi[çc]o/i.test(l) && /Al[íi]quota/i.test(l) && /Valor/i.test(l));
    if (iItem >= 0 && L[iItem + 1]){
      const prox = L[iItem + 1], cod = prox.match(/\b(\d{5,10})\b/), vals = valoresV108(prox);
      if (cod) set('codigoServico', cod[1]);
      if (vals.length >= 2){ set('aliqISS', vals[0]); if (!f.valorServico) set('valorServico', vals[vals.length - 1]); }
    }
    if (!f.codigoServico){ const i = L.findIndex(l => /^C[óo]digo do Servi[çc]o\s*$/i.test(l)); m = i >= 0 && L[i + 1] ? L[i + 1].match(/^(\d{4,10})\s*-/) : null; if (m) set('codigoServico', m[1]); }
    // Caieiras e semelhantes: retenções escritas por extenso
    m = T.match(/Reten[çc][ãa]o INSS[^\n]*R\$\s*([\d.]+,\d{2})\s*$/im); if (m) set('inssRetido', nBRV108(m[1]));
    m = T.match(/Reten[çc][ãa]o ISS\s+([\d,]+)\s*%\s+(?:R\$\s*)?([\d.]+,\d{2})/i); if (m){ set('aliqISS', nBRV108(m[1])); set('valorISS', nBRV108(m[2])); f.issRetido = 'SIM'; }
    m = T.match(/Reten[çc][ãa]o PIS\/COFINS\/CSLL\s+([\d,]+)\s*%\s*R\$\s*([\d.]+,\d{2})/i); if (m) set('csllRetido', arred(nBRV108(m[2]) / nBRV108(m[1])));
    m = T.match(/Reten[çc][ãa]o (?:IR|IRRF)\b[^\n]*R\$\s*([\d.]+,\d{2})\s*$/im); if (m) set('irRetido', nBRV108(m[1]));
    if (/ISS(?:QN)?\s+Retido\s*[:|]?\s*Sim\b/i.test(T) || /retido pelo tomador/i.test(T)) f.issRetido = 'SIM';
    // CNPJs e nomes (só completam o que faltar)
    const cnpjs = []; for (const x of T.matchAll(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g)){ const c = x[0].replace(/\D/g, ''); if (c.length === 14 && !cnpjs.includes(c)) cnpjs.push(c); }
    if (cnpjs[0]) set('prestadorCNPJ', cnpjs[0]); if (cnpjs[1]) set('tomadorCNPJ', cnpjs[1]);
    const nomeNaLinha = c => { const l = L.find(x => x.replace(/\D/g, '').includes(c) && /[A-Z]{3,}/.test(x.replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, ''))); return l ? limpaNomeV108(l.replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, '').replace(/C(?:PF|NPJ)\s*\/?\s*C?(?:PF|NPJ)?\s*:?/gi, '').replace(/Inscri[çc][ãa]o Municipal.*$/i, '')) : ''; };
    m = T.match(/Prestador de Servi[çc]os\s+([A-ZÀ-Ú0-9][^\n]{4,})/); if (m) set('prestadorNome', limpaNomeV108(m[1]));
    if (!f.prestadorNome){ const l = L.find(x => /\b(LTDA|S\.?\/?A\.?|EIRELI|EPP)\b\.?\s*$/i.test(x) && !(cnpjs[1] && x.replace(/\D/g, '').includes(cnpjs[1]))); if (l) set('prestadorNome', limpaNomeV108(l.replace(/^.*?(?:Raz[ãa]o Social|Nome)\s*:?\s*/i, ''))); }
    if (cnpjs[1]){ const n = nomeNaLinha(cnpjs[1]); if (n.length >= 5) set('tomadorNome', n); }
    return f;
  }
  if (window.NFSE_MOTOR){
    const detectarV107 = NFSE_MOTOR.detectarTipoPorTexto;
    NFSE_MOTOR.detectarTipoPorTexto = function(text){
      const t = String(text || '').toUpperCase();
      if (/DACTE|CONHECIMENTO DE TRANSPORTE ELETR/.test(t) && !SERVICO_V108.test(t)) return 'transporte';
      const produto = /DANFE\b/.test(t) && /\bNCM\b/.test(t) && /\bCFOP\b/.test(t);
      if (SERVICO_V108.test(t) && !produto) return 'servico';
      return detectarV107(text);
    };
    const extrairV107 = NFSE_MOTOR.extractServicoPDF;
    NFSE_MOTOR.extractServicoPDF = function(texto, linhas){
      let f = {};
      try { f = extrairV107(texto, linhas) || {}; } catch(e){ f = {}; }
      const g = leiautesV108(linhas && linhas.length ? linhas : String(texto || '').split('\n'));
      const VALORES = ['valorServico', 'deducoes', 'baseISS', 'aliqISS', 'valorISS', 'issRetido', 'inssRetido', 'irRetido', 'csllRetido', 'numeroNota', 'dataEmissao', 'codigoServico'];
      for (const k of VALORES) if (g[k] !== undefined) f[k] = g[k];
      for (const k of ['prestadorCNPJ', 'tomadorCNPJ', 'prestadorNome', 'tomadorNome', 'municipioEmissor']) if (g[k] && !String(f[k] || '').trim()) f[k] = g[k];
      // nome do prestador lido do lugar errado (com o CNPJ do tomador ou igual ao tomador) → usa o do leiaute
      const dig = s => String(s || '').replace(/\D/g, '');
      if (g.prestadorNome && f.tomadorCNPJ && (dig(f.prestadorNome).includes(dig(f.tomadorCNPJ)) || limpaNomeV108(f.prestadorNome) === limpaNomeV108(f.tomadorNome))) f.prestadorNome = g.prestadorNome;
      for (const k of ['prestadorMunicipio', 'municipioEmissor']) if (f[k]) f[k] = String(f[k]).replace(/\s+[a-zà-ú]$/, '').trim();   // letra solta do OCR no fim
      for (const k of ['prestadorNome', 'tomadorNome']) if (f[k]) f[k] = limpaNomeV108(String(f[k]).replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, ''));
      if (g.valorISS === undefined && !nV89(f.valorISS) && nV89(f.aliqISS) > 0 && (nV89(f.baseISS) || nV89(f.valorServico))) f.valorISS = arred((nV89(f.baseISS) || nV89(f.valorServico)) * nV89(f.aliqISS) / 100);
      if (!nV89(f.baseISS) && nV89(f.valorISS) && nV89(f.valorServico)) f.baseISS = arred(nV89(f.valorServico) - nV89(f.deducoes));
      if (!f.numeroNota && !nV89(f.valorServico)){ f.numeroNota = 'SEM NÚMERO'; f.chaveAcesso = 'NFSE-ARQ-' + arqAtualV108; f.__parcialV108 = true; }
      return f;
    };
  }

  /* ---------- OCR: PDF sem camada de texto ---------- */
  let ocrWorkerV108 = null;
  async function ocrWorkerTesseractV108(){
    if (ocrWorkerV108) return ocrWorkerV108;
    const O = window.__OCR_V108;
    if (!window.Tesseract || !O) throw Error('OCR indisponível nesta versão do arquivo.');
    const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
    const coreUrl = URL.createObjectURL(new Blob([O.core], {type: 'text/javascript'}));
    const porUrl = URL.createObjectURL(new Blob([b64(O.por)], {type: 'application/octet-stream'}));
    const prel = 'var __CORE=' + JSON.stringify(coreUrl) + ',__POR=' + JSON.stringify(porUrl) + ';'
      + 'var __is=self.importScripts.bind(self);self.importScripts=function(){return __is.apply(self,[].map.call(arguments,function(u){return /tesseract-core/.test(String(u))?__CORE:u;}));};'
      + 'var __f=self.fetch.bind(self);self.fetch=function(u,o){return /traineddata/.test(String(u&&u.url||u))?__f(__POR):__f(u,o);};\n';
    const workerUrl = URL.createObjectURL(new Blob([prel + O.worker], {type: 'text/javascript'}));
    ocrWorkerV108 = await Tesseract.createWorker('por', 1, {workerPath: workerUrl, corePath: 'https://ocr.local/tesseract-core-simd-lstm.wasm.js', langPath: 'https://ocr.local/lang', gzip: true, cacheMethod: 'none', workerBlobURL: false, logger: () => {}});
    return ocrWorkerV108;
  }
  async function ocrPdfV108(buf, nome){
    if (typeof window.__ocrTesteV108 === 'function') return window.__ocrTesteV108(nome);   // gancho dos testes (jsdom não tem canvas/worker)
    const worker = await ocrWorkerTesseractV108();
    const pdf = await window.pdfjsLib.getDocument({data: new Uint8Array(buf), isEvalSupported: false}).promise, linhas = [];
    for (let p = 1; p <= Math.min(pdf.numPages, 6); p++){
      const page = await pdf.getPage(p), vp = page.getViewport({scale: 2.8}), cv = document.createElement('canvas');
      cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
      await page.render({canvasContext: cv.getContext('2d'), viewport: vp}).promise;
      const {data} = await worker.recognize(cv);
      linhas.push(...String(data.text || '').split('\n').map(s => s.trim()), '');
    }
    try { pdf.destroy(); } catch(e){}
    return linhas;
  }
  const lerTextoV107 = lerTexto;
  lerTexto = async function(f){
    const txt = await lerTextoV107(f);
    if (typeof txt !== 'string' || !txt.startsWith(MARCA_PDF_V89)) return txt;
    const pdf = JSON.parse(txt.slice(MARCA_PDF_V89.length)), letras = (pdf.linhas || []).join(' ').replace(/[^A-Za-zÀ-ú]/g, '');
    if (letras.length >= 40) return txt;
    try {
      const linhas = await ocrPdfV108(await f.arrayBuffer(), f.name || '');
      if (linhas && linhas.join('').replace(/[^A-Za-zÀ-ú]/g, '').length >= 40) return MARCA_PDF_V89 + JSON.stringify({linhas, itens: null, ocr: true});
    } catch(e){ console.error('OCR', e); return MARCA_PDF_V89 + JSON.stringify({linhas: [], itens: null, ocrErro: String(e && e.message || e)}); }
    return txt;
  };
  const parseV107 = window.parse;
  window.parse = function(file, txt){
    arqAtualV108 = (file && file.name) || '';
    let info = null;
    if (typeof txt === 'string' && txt.startsWith(MARCA_PDF_V89)){ try { info = JSON.parse(txt.slice(MARCA_PDF_V89.length)); } catch(e){} }
    if (info && info.ocrErro) throw Error('PDF sem texto e o OCR falhou (' + info.ocrErro + '). Use o XML da nota.');
    const res = parseV107.apply(this, arguments);
    if (info && Array.isArray(res) && res[0] && res[0][0] && res[0][0].dados_nfse){
      const r = res[0][0], parcial = r.dados_nfse && r.numero_documento === 'SEM NÚMERO';
      r.leitura_pdf = parcial ? 'Leitura parcial — conferir o PDF' : info.ocr ? 'OCR (PDF de imagem) — conferir' : 'Texto do PDF';
      r.dados_nfse.leitura_pdf = r.leitura_pdf;
    }
    return res;
  };
  // aba ISS: coluna leitura_pdf no fim
  const linhasIssV107 = window.linhasIss;
  window.linhasIss = (...a) => { const src = new Map(); for (const r of (itensTodosV70 || state.items)) if (r && r.dados_nfse) src.set(r.arquivo_origem + '|' + r.numero_documento, r);
    return linhasIssV107(...a).map(row => { const r = src.get(row.arquivo_origem + '|' + row.numero_nota); row.leitura_pdf = r && r.leitura_pdf || (r && r.origem_documento === 'XML' ? 'XML' : ''); return row; }); };
