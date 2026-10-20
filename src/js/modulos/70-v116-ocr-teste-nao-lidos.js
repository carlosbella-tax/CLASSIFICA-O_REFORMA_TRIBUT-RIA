  /* =====================================================================
     V116 — OCR: diagnóstico na hora, nova tentativa e nenhum PDF de fora
     - Ao escolher arquivos com PDF, o OCR é testado (e já fica aquecido) com
       um texto de prova; o aviso aparece antes do processamento, com o motivo
       técnico exato (worker, WebAssembly, política de segurança, tempo).
     - Aviso com o botão "Tentar OCR novamente" (reinicia o OCR).
     - PDF de imagem que não pôde ser lido entra na aba ISS como uma linha
       "NÃO LIDO" (número "SEM NÚMERO", nome do arquivo, leitura_pdf com o
       motivo), em vez de ficar só na lista de erros — nenhuma NFS-e some.
     ===================================================================== */
  const ambienteV116 = () => {
    const p = [];
    p.push('origem ' + (location.protocol === 'file:' ? 'arquivo local' : location.protocol.replace(':', '')));
    p.push('Worker ' + (typeof Worker === 'function' ? 'sim' : 'não'));
    p.push('WebAssembly ' + (typeof WebAssembly === 'object' ? 'sim' : 'não'));
    try { p.push('quadro ' + (window.top !== window ? 'embutido' : 'principal')); } catch(e){ p.push('quadro embutido'); }
    return p.join(', ');
  };
  // aviso com o motivo e o botão de nova tentativa
  avisoTopoV110 = function(texto){
    let el = $('avisoOcrV110');
    if (!el){
      el = document.createElement('div'); el.id = 'avisoOcrV110';
      el.style.cssText = 'margin:8px 16px;padding:10px 14px;border-radius:8px;background:#fdecea;border:1px solid #f5c2c0;color:#8a1c14;font-weight:600';
      const alvo = document.querySelector('.tabs') || document.body.firstElementChild; (alvo && alvo.parentNode ? alvo.parentNode.insertBefore(el, alvo.nextSibling) : document.body.prepend(el));
    }
    el.style.background = '#fdecea'; el.style.borderColor = '#f5c2c0'; el.style.color = '#8a1c14';
    el.innerHTML = '';
    const t = document.createElement('div'); t.textContent = '⚠ ' + texto; el.appendChild(t);
    const d = document.createElement('div'); d.style.cssText = 'font-weight:400;font-size:12px;margin-top:4px';
    d.textContent = 'Motivo técnico: ' + (ocrDesligadoV110 || '').replace(MSG_OCR_V110, '').replace(/^\s*\(|\)\s*$/g, '') + ' · Ambiente: ' + ambienteV116() + ' · Versão ' + (document.title.match(/V\d+/) || [''])[0];
    el.appendChild(d);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'secondary'; b.style.marginTop = '6px'; b.textContent = 'Tentar OCR novamente';
    b.onclick = () => { ocrDesligadoV110 = ''; travasV110 = 0; motorV109 = null; el.remove(); testarOcrV116(true); };
    el.appendChild(b);
  };
  function avisoOkV116(texto){
    let el = $('avisoOcrV110'); if (el) el.remove();
    el = $('okOcrV116');
    if (!el){
      el = document.createElement('div'); el.id = 'okOcrV116';
      el.style.cssText = 'margin:8px 16px;padding:6px 12px;border-radius:8px;background:#e7f5ec;border:1px solid #b9e2c7;color:#1c6b3a;font-size:13px';
      const alvo = document.querySelector('.tabs') || document.body.firstElementChild; (alvo && alvo.parentNode ? alvo.parentNode.insertBefore(el, alvo.nextSibling) : document.body.prepend(el));
    }
    el.textContent = '✔ ' + texto;
  }
  // teste do OCR com um texto de prova (aquece o motor para o processamento)
  let testeV116 = null;
  function testarOcrV116(forcar){
    if (typeof window.__ocrTesteV108 === 'function') return Promise.resolve(true);   // testes automáticos (jsdom)
    if (testeV116 && !forcar) return testeV116;
    testeV116 = (async () => {
      try {
        const motor = await motorOcrV109();
        const cv = document.createElement('canvas'); cv.width = 520; cv.height = 90;
        const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#000'; g.font = 'bold 40px Arial'; g.fillText('NOTA FISCAL 12345', 12, 58);
        const txt = await comLimiteV110(Promise.resolve(motor.recognize(cv)), 150000, 'o teste do OCR não respondeu em 2,5 min');
        if (!/1\s*2\s*3\s*4\s*5|NOTA|FISCAL/i.test(String(txt || ''))) throw Error('o teste do OCR não reconheceu o texto de prova');
        avisoOkV116('OCR pronto (' + motorTipoV109 + ') — NFS-e em PDF de imagem serão lidas.');
        return true;
      } catch(e){
        desligarOcrV110(String(e && e.message || e).replace(MSG_OCR_V110, '').replace(/^\s*\(|\)\s*$/g, ''));
        avisoTopoV110(MSG_OCR_V110 + '. Os demais arquivos são carregados normalmente e os PDFs de imagem entram na aba ISS como NÃO LIDO.');
        return false;
      }
    })();
    return testeV116;
  }
  const setFilesV115 = window.setFiles;
  window.setFiles = function(fs){
    const r = setFilesV115.apply(this, arguments);
    if (Array.from(fs || []).some(f => /\.pdf$/i.test(String(f && f.name || '')))) setTimeout(() => testarOcrV116(false), 50);
    return r;
  };
  // PDF de imagem não lido → linha NÃO LIDO na aba ISS
  const parseV115 = window.parse;
  window.parse = function(file, txt){
    try { return parseV115.apply(this, arguments); }
    catch(e){
      const msg = String(e && e.message || e);
      if (!/\.pdf$/i.test(String(file && file.name || '')) || !/OCR|PDF sem texto|PDF de imagem/i.test(msg)) throw e;
      const res = itemNfseV89(file, {numeroNota: 'SEM NÚMERO', chaveAcesso: 'NFSE-NAOLIDO-' + file.name, descricaoServico: 'PDF de imagem não lido — conferir o PDF'}, 'PDF');
      const r = res[0][0], motivo = /OCR bloqueado/.test(msg) ? 'OCR bloqueado neste ambiente' : msg.replace(/\s*Use o XML da nota\.?/, '').replace(/^PDF de imagem não lido:\s*/, '');
      r.leitura_pdf = 'NÃO LIDO — ' + motivo + ' — conferir o PDF'; r.dados_nfse.leitura_pdf = r.leitura_pdf;
      return res;
    }
  };
  // ambiente sem o necessário: avisa já na abertura, com o motivo
  if (ocrDesligadoV110) avisoTopoV110(MSG_OCR_V110 + '.');
  // resumo da aba ISS: quantas linhas NÃO LIDO
  const renderAbaV115 = window.renderAba;
  window.renderAba = function(id){
    const r = renderAbaV115.apply(this, arguments);
    if (id === 'iss'){
      const info = $('issInfo'), n = linhasIss().filter(x => /^NÃO LIDO/.test(String(x.leitura_pdf || ''))).length;
      if (info && n) info.textContent += ' · ATENÇÃO: ' + fmtInt(n) + ' PDF(s) de imagem NÃO LIDO(S) — filtre a coluna leitura_pdf e confira esses PDFs.';
    }
    return r;
  };
