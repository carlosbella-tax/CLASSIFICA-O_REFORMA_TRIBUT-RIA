  /* =====================================================================
     V115 — OCR funciona com o arquivo aberto direto do disco (file://) em
     qualquer Chrome ou Edge
     Causa do aviso "OCR bloqueado": num navegador comum, a página aberta do
     disco tem origem "null" e o worker do OCR não consegue carregar o núcleo
     (importScripts de blob:null) nem o dicionário; restava a leitura direta
     na página, lenta em computadores mais modestos, que estourava o limite
     de tempo e desligava o OCR.
     Agora o worker é autossuficiente: o núcleo do Tesseract e o dicionário de
     português vão dentro do próprio script do worker (nada é carregado de
     fora). Limites de tempo maiores (módulo 67, comentários V115).
     ===================================================================== */
  let urlWorkerV115 = null;
  criarWorkerV109 = async function(){
    const O = window.__OCR_V108;
    if (!window.Tesseract || !O) throw Error('OCR indisponível nesta versão do arquivo.');
    if (!urlWorkerV115){
      const prel = 'var __POR_B64=' + JSON.stringify(O.por) + ';'
        + 'self.fetch=(function(f){return function(u,o){if(/traineddata/.test(String(u&&u.url||u))){var b=atob(__POR_B64),n=b.length,a=new Uint8Array(n);for(var i=0;i<n;i++)a[i]=b.charCodeAt(i);return Promise.resolve(new Response(a));}return f(u,o);};})(self.fetch.bind(self));'
        + 'self.importScripts=(function(is){return function(){var a=[].filter.call(arguments,function(u){return !/tesseract-core/.test(String(u));});return a.length?is.apply(self,a):undefined;};})(self.importScripts.bind(self));\n';
      urlWorkerV115 = URL.createObjectURL(new Blob([prel, O.core, '\n;self.TesseractCore=TesseractCore;\n', O.worker], {type: 'text/javascript'}));
    }
    return Tesseract.createWorker('por', 1, {workerPath: urlWorkerV115, corePath: 'https://ocr.local/tesseract-core-simd-lstm.wasm.js', langPath: 'https://ocr.local/lang', gzip: true, cacheMethod: 'none', workerBlobURL: false, logger: () => {}});
  };
