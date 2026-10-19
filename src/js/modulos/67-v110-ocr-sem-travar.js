  /* =====================================================================
     V110 — O OCR nunca trava o processamento
     Em alguns ambientes (ex.: visualizador do G4 OS) o OCR não dá erro: ele
     fica esperando para sempre. Como os arquivos são lidos em lotes, um PDF
     parado segurava o lote inteiro e nada era carregado (Itens 0, abas sem
     contagem). Agora:
     - limite de 90 s para o OCR iniciar e de 60 s por página (+ 30 s);
     - se o OCR não iniciar ou travar 2 vezes, ele é desligado para o resto
       do processamento: os PDFs de imagem seguintes vão direto para a lista
       de erros ("OCR bloqueado neste ambiente — abra o arquivo no Chrome ou
       no Edge") e todos os XMLs e PDFs com texto continuam carregando;
     - a vaga da fila é sempre devolvida, mesmo com página travada;
     - aviso no topo da tela quando o OCR estiver bloqueado.
     ===================================================================== */
  const MSG_OCR_V110 = 'OCR bloqueado neste ambiente — abra o arquivo DIAGNOSTICO no Chrome ou no Edge para ler as NFS-e em PDF de imagem';
  let ocrDesligadoV110 = '', travasV110 = 0;
  const comLimiteV110 = (p, ms, msg) => { let t; return Promise.race([p, new Promise((_, erro) => { t = setTimeout(() => erro(Error(msg)), ms); })]).finally(() => clearTimeout(t)); };
  function avisoTopoV110(texto){
    let el = $('avisoOcrV110');
    if (!el){
      el = document.createElement('div'); el.id = 'avisoOcrV110';
      el.style.cssText = 'margin:8px 16px;padding:10px 14px;border-radius:8px;background:#fdecea;border:1px solid #f5c2c0;color:#8a1c14;font-weight:600';
      const alvo = document.querySelector('.tabs') || document.body.firstElementChild; (alvo && alvo.parentNode ? alvo.parentNode.insertBefore(el, alvo.nextSibling) : document.body.prepend(el));
    }
    el.textContent = '⚠ ' + texto;
  }
  function desligarOcrV110(motivo){
    if (ocrDesligadoV110) return;
    ocrDesligadoV110 = MSG_OCR_V110 + ' (' + motivo + ')';
    console.warn('OCR desligado:', motivo);
    avisoTopoV110(MSG_OCR_V110 + '. Os demais arquivos foram carregados normalmente.');
    // libera quem estava esperando vaga: eles verão o OCR desligado e seguem sem travar
    while (ocrEsperaV109.length){ const prox = ocrEsperaV109.shift(); prox(); }
  }
  // início do OCR com limite de tempo
  const motorOcrV109b = motorOcrV109;
  motorOcrV109 = async function(){
    if (ocrDesligadoV110) throw Error(ocrDesligadoV110);
    try { return await comLimiteV110(motorOcrV109b(), 150000, 'o OCR não iniciou em 2,5 min')   /* V115: 150 s */; }
    catch(e){ desligarOcrV110(e && e.message || String(e)); throw Error(ocrDesligadoV110); }
  };
  ocrPdfV108 = async function(buf, nome){
    if (typeof window.__ocrTesteV108 === 'function') return window.__ocrTesteV108(nome);   // gancho dos testes (jsdom não tem canvas/worker)
    if (ocrDesligadoV110) throw Error(ocrDesligadoV110);
    if (!ocrAtivosV109 && !ocrEsperaV109.length && ocrFeitosV109 >= ocrTotalV109){ ocrTotalV109 = 0; ocrFeitosV109 = 0; }
    ocrTotalV109++;
    const motor = await motorOcrV109();
    await vagaV109(motor.paralelo || 1);
    try {
      if (ocrDesligadoV110) throw Error(ocrDesligadoV110);
      const pdf = await comLimiteV110(window.pdfjsLib.getDocument({data: new Uint8Array(buf), isEvalSupported: false}).promise, 60000, 'PDF não abriu em 60 s');
      const linhas = [], n = Math.min(pdf.numPages, 6);
      for (let p = 1; p <= n; p++){
        if (ocrDesligadoV110) throw Error(ocrDesligadoV110);
        const t = 'Lendo NFS-e em PDF de imagem por OCR (' + motorTipoV109 + ') — ' + nome + ' · página ' + p + ' de ' + n + ' · arquivo ' + (ocrFeitosV109 + 1) + ' de ' + ocrTotalV109 + '…';
        for (const id of ['pStatus', 'status']){ const el = $(id); if (el) el.textContent = t; }
        try {
          const texto = await comLimiteV110((async () => {
            const page = await pdf.getPage(p), vp = page.getViewport({scale: 2.8}), cv = document.createElement('canvas');
            cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
            await page.render({canvasContext: cv.getContext('2d'), viewport: vp}).promise;
            return motor.recognize(cv);
          })(), 240000, 'página ' + p + ' sem resposta do OCR em 4 min');   // V115: 240 s
          linhas.push(...String(texto || '').split('\n').map(s => s.trim()), '');
          travasV110 = 0;
        } catch(e){
          if (/sem resposta/.test(e && e.message || '') && ++travasV110 >= 3) desligarOcrV110('OCR travou em 3 páginas seguidas');   // V115: 3
          throw e;
        }
      }
      try { pdf.destroy(); } catch(e){}
      return linhas;
    } finally { ocrFeitosV109++; liberaV109(); }
  };
  // o erro de OCR aparece com o motivo na lista de erros e no aviso da aba ISS
  const parseV109 = window.parse;
  window.parse = function(file, txt){
    try { return parseV109.apply(this, arguments); }
    catch(e){
      if (ocrDesligadoV110 && /OCR/.test(e && e.message || '') && /\.pdf$/i.test(file && file.name || '')) throw Error('PDF de imagem não lido: ' + MSG_OCR_V110);
      throw e;
    }
  };
  // aviso já na abertura quando o navegador não tem o necessário para o OCR
  (function(){
    const falta = [];
    if (typeof WebAssembly !== 'object') falta.push('WebAssembly');
    if (typeof Worker !== 'function' && !window.DecompressionStream) falta.push('Worker/DecompressionStream');
    if (falta.length) desligarOcrV110('navegador sem ' + falta.join(' e '));
  })();
