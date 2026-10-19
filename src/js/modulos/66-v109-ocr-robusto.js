  /* =====================================================================
     V109 — OCR das NFS-e em PDF de imagem: robusto em qualquer ambiente
     - Motor do OCR em dois caminhos: (1) worker do tesseract.js; (2) se o
       ambiente bloquear o worker (ex.: visualizador do G4 OS / quadro
       isolado), o núcleo do Tesseract roda direto na página (TesseractCore +
       TessBaseAPI), com o mesmo dicionário de português embutido.
     - Grupo de workers de OCR: um por núcleo do processador (até 4), criados
       sob demanda, e fila de PDFs (workers + 1; 1 no caminho direto) — rápido
       e sem estourar a memória com dezenas de PDFs (a V108 criava um worker
       por PDF em andamento, sem limite).
     - Andamento visível: "OCR — arquivo (n de total), página p de q".
     - Aba ISS: o resumo mostra quantos PDFs não puderam ser lidos (com o
       motivo), para nenhuma nota de serviço sumir sem aviso.
     ===================================================================== */
  let motorV109 = null, motorTipoV109 = '', ocrTotalV109 = 0, ocrFeitosV109 = 0;
  const b64V109 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  async function motorDiretoV109(){
    const O = window.__OCR_V108; if (!O) throw Error('OCR indisponível nesta versão do arquivo.');
    if (typeof window.TesseractCore !== 'function'){ const s = document.createElement('script'); s.textContent = O.core; document.head.appendChild(s); }
    if (typeof window.TesseractCore !== 'function') throw Error('núcleo do OCR bloqueado neste ambiente');
    const M = await window.TesseractCore({});
    let dados = b64V109(O.por);
    if (window.DecompressionStream) dados = new Uint8Array(await new Response(new Blob([dados]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    else throw Error('navegador sem DecompressionStream');
    M.FS.writeFile('./por.traineddata', dados);
    const api = new M.TessBaseAPI();
    if (api.Init(null, 'por', 1) === -1) throw Error('falha ao iniciar o OCR');
    return {paralelo: 1, recognize: async canvas => {
      const blob = await new Promise(ok => canvas.toBlob(ok, 'image/png')), u = new Uint8Array(await blob.arrayBuffer());
      M.FS.writeFile('/input', u);
      if (api.SetImageFile(1, 0) === 1) throw Error('imagem não lida pelo OCR');
      api.Recognize(null);
      const t = api.GetUTF8Text(); try { M.FS.unlink('/input'); } catch(e){}
      await new Promise(ok => setTimeout(ok, 0));   // devolve a vez à tela entre páginas
      return t;
    }};
  }
  // grupo de workers: um OCR por núcleo do processador (até 4), criados sob demanda
  let urlsOcrV109 = null;
  async function criarWorkerV109(){
    const O = window.__OCR_V108;
    if (!window.Tesseract || !O) throw Error('OCR indisponível nesta versão do arquivo.');
    if (!urlsOcrV109){
      const coreUrl = URL.createObjectURL(new Blob([O.core], {type: 'text/javascript'}));
      const porUrl = URL.createObjectURL(new Blob([b64V109(O.por)], {type: 'application/octet-stream'}));
      const prel = 'var __CORE=' + JSON.stringify(coreUrl) + ',__POR=' + JSON.stringify(porUrl) + ';'
        + 'var __is=self.importScripts.bind(self);self.importScripts=function(){return __is.apply(self,[].map.call(arguments,function(u){return /tesseract-core/.test(String(u))?__CORE:u;}));};'
        + 'var __f=self.fetch.bind(self);self.fetch=function(u,o){return /traineddata/.test(String(u&&u.url||u))?__f(__POR):__f(u,o);};\n';
      urlsOcrV109 = {worker: URL.createObjectURL(new Blob([prel + O.worker], {type: 'text/javascript'}))};
    }
    return Tesseract.createWorker('por', 1, {workerPath: urlsOcrV109.worker, corePath: 'https://ocr.local/tesseract-core-simd-lstm.wasm.js', langPath: 'https://ocr.local/lang', gzip: true, cacheMethod: 'none', workerBlobURL: false, logger: () => {}});
  }
  async function motorOcrV109(){
    if (motorV109) return motorV109;
    motorV109 = (async () => {
      try {
        if (typeof Worker !== 'function') throw Error('sem Worker');
        const w1 = await Promise.race([criarWorkerV109(), new Promise((_, erro) => setTimeout(() => erro(Error('worker do OCR não respondeu')), 120000))   /* V115: 120 s */]);
        motorTipoV109 = 'worker';
        const N = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)), livres = [w1], espera = [];
        let criados = 1;
        const pegar = async () => {
          if (livres.length) return livres.pop();
          if (criados < N){ criados++; try { return await criarWorkerV109(); } catch(e){ criados--; } }
          return new Promise(ok => espera.push(ok));
        };
        const devolver = w => { const prox = espera.shift(); if (prox) prox(w); else livres.push(w); };
        return {paralelo: N + 1, recognize: async canvas => { const w = await pegar(); try { return (await w.recognize(canvas)).data.text; } finally { devolver(w); } }};
      } catch(e){
        console.warn('OCR: worker indisponível (' + (e && e.message || e) + '), usando a leitura direta na página');
        motorTipoV109 = 'página';
        return motorDiretoV109();
      }
    })();
    try { return await motorV109; } catch(e){ motorV109 = null; throw e; }
  }
  // fila: no máximo N PDFs em OCR ao mesmo tempo
  let ocrAtivosV109 = 0; const ocrEsperaV109 = [];
  const vagaV109 = async n => { if (ocrAtivosV109 < n){ ocrAtivosV109++; return; } await new Promise(ok => ocrEsperaV109.push(ok)); ocrAtivosV109++; };
  const liberaV109 = () => { ocrAtivosV109--; const prox = ocrEsperaV109.shift(); if (prox) prox(); };
  const avisoV109 = t => { for (const id of ['pStatus', 'status']){ const el = $(id); if (el) el.textContent = t; } };
  ocrPdfV108 = async function(buf, nome){
    if (typeof window.__ocrTesteV108 === 'function') return window.__ocrTesteV108(nome);   // gancho dos testes (jsdom não tem canvas/worker)
    if (!ocrAtivosV109 && !ocrEsperaV109.length && ocrFeitosV109 >= ocrTotalV109){ ocrTotalV109 = 0; ocrFeitosV109 = 0; }   // novo processamento
    ocrTotalV109++;
    const motor = await motorOcrV109();
    await vagaV109(motor.paralelo || 1);
    try {
      const pdf = await window.pdfjsLib.getDocument({data: new Uint8Array(buf), isEvalSupported: false}).promise, linhas = [], n = Math.min(pdf.numPages, 6);
      for (let p = 1; p <= n; p++){
        avisoV109('Lendo NFS-e em PDF de imagem por OCR (' + motorTipoV109 + ') — ' + nome + ' · página ' + p + ' de ' + n + ' · arquivo ' + (ocrFeitosV109 + 1) + ' de ' + ocrTotalV109 + '…');
        const page = await pdf.getPage(p), vp = page.getViewport({scale: 2.8}), cv = document.createElement('canvas');
        cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
        await page.render({canvasContext: cv.getContext('2d'), viewport: vp}).promise;
        linhas.push(...String(await motor.recognize(cv) || '').split('\n').map(s => s.trim()), '');
        cv.width = cv.height = 0; try { page.cleanup(); } catch(e){}
      }
      try { pdf.destroy(); } catch(e){}
      return linhas;
    } finally { ocrFeitosV109++; liberaV109(); }
  };

  // aba ISS: PDFs não lidos aparecem no resumo
  const renderAbaV108 = window.renderAba;
  window.renderAba = function(id){
    const r = renderAbaV108.apply(this, arguments);
    if (id === 'iss'){
      const info = $('issInfo'), falhas = (state.errors || []).filter(e => /\.pdf$/i.test(e.arquivo_origem || '') && !/duplicado/i.test(e.erro || ''));
      if (info && falhas.length){
        const motivos = {}; for (const e of falhas){ const k = String(e.erro || '').replace(/\(.*\)/, '').trim(); motivos[k] = (motivos[k] || 0) + 1; }
        info.textContent += ' · ATENÇÃO: ' + fmtInt(falhas.length) + ' PDF(s) não lido(s) — ' + Object.entries(motivos).map(([k, v]) => v + '× ' + k).join('; ') + ' (lista completa na aba Carregar XMLs).';
      }
    }
    return r;
  };
