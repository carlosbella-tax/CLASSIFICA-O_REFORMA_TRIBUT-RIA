  /* =====================================================================
     V49 — Cabeçalho da impressão com os dados da empresa (nome, CNPJ,
     regime, período, UFs), a aba impressa e a data/hora.
     ===================================================================== */
  (function(){
    const cab = document.createElement('div'); cab.id = 'v49Cab'; cab.className = 'v49-cab';
    const main = document.querySelector('main.wrap') || document.body;
    main.insertBefore(cab, main.firstChild);
  })();
  const textoSel = id => { const el = $(id); if (!el) return ''; if (el.tagName === 'SELECT') return el.selectedIndex >= 0 && el.value ? el.options[el.selectedIndex].text : ''; return el.value || ''; };
  function montarCabecalhoImpressao(){
    const cab = $('v49Cab'); if (!cab) return;
    const aba = document.querySelector('.tab.active'), nomeAba = aba ? aba.childNodes[0].textContent.trim() : '';
    const periodo = [textoSel('periodo'), $('anoPeriodo') ? $('anoPeriodo').value : ''].filter(Boolean).join(' / ');
    const campo = (rot, val) => '<div><span>' + rot + '</span><b>' + esc(val || 'Não informado') + '</b></div>';
    cab.innerHTML = '<div class="v49-topo"><div class="v49-tit">CLASSIFICAÇÃO REFORMA TRIBUTÁRIA — ' + esc(nomeAba.toUpperCase()) + '</div><div class="v49-data">Impresso em ' + new Date().toLocaleString('pt-BR') + '</div></div>'
      + '<div class="v49-grade">' + campo('Nome da empresa', $('empresa').value) + campo('CNPJ da empresa', $('cnpjEmpresa').value) + campo('Regime tributário', textoSel('regimeEmpresa'))
      + campo('Período processado', periodo) + campo('UF de origem', textoSel('ufOrigem') || 'Conforme XML') + campo('UF de destino', textoSel('ufDestino') || 'Conforme XML')
      + campo('Documentos / itens', fmtInt(state.docs.length) + ' documento(s) · ' + fmtInt(state.items.length) + ' item(ns)') + '</div>';
  }
  const prepV48 = prepararImpressao;
  prepararImpressao = function(){ montarCabecalhoImpressao(); return prepV48(); };
  window.prepararImpressao = prepararImpressao;
  window.removeEventListener('beforeprint', prepV48);
  window.addEventListener('beforeprint', prepararImpressao);

