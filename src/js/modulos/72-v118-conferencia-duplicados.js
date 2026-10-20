  /* =====================================================================
     V118 — Aba Processamento: todo arquivo carregado é explicado
     - Conferência abaixo dos indicadores: "N arquivos carregados = X
       documentos processados + Y duplicados excluídos + Z com erro"
       (alerta se a conta não fechar).
     - Lista "Duplicados excluídos automaticamente" com o arquivo de origem de
       cada duplicado (o arquivo que ficou valendo) e a chave.
     - Proteção contra duplicado falso: NFS-e com o mesmo prestador e número
       (ou qualquer documento cuja chave não seja a chave de acesso de 44
       dígitos) só é duplicada se valor e data também forem iguais; caso
       contrário a chave recebe um sufixo e o documento é processado.
     ===================================================================== */
  let runV118 = null, chavesV118 = new Map();
  const assinaturaV118 = d => [String(d.valor_total_documento ?? ''), String(d.data_emissao || '').slice(0, 10), String(d.emitente_cnpj_cpf || '')].join('|');
  const parseV117 = window.parse;
  window.parse = function(file, txt){
    if (runV118 !== state.runId){ runV118 = state.runId; chavesV118 = new Map(); }
    const res = parseV117.apply(this, arguments);
    const doc = Array.isArray(res) ? res[1] : null; if (!doc || !doc.chave_documento || doc.tipo_documento === 'Evento NF-e') return res;
    const ch = String(doc.chave_documento), ass = assinaturaV118(doc), ja = chavesV118.get(ch);
    if (!ja){ chavesV118.set(ch, {arquivo: file.name, ass}); return res; }
    const chaveAcesso = /^\d{44}$/.test(ch);
    if (chaveAcesso || ja.ass === ass) return res;   // duplicado de verdade: segue para a exclusão automática
    // mesma chave, conteúdo diferente: não é duplicado
    const nova = ch + '#' + file.name;
    doc.chave_documento = nova; for (const r of res[0] || []) if (r && r.chave_documento === ch) r.chave_documento = nova;
    chavesV118.set(nova, {arquivo: file.name, ass});
    return res;
  };
  // lista de ocorrências: erros + duplicados com o arquivo de origem
  const listarOcorrenciasV117 = listarOcorrencias;
  listarOcorrencias = function(){
    listarOcorrenciasV117.apply(this, arguments);
    const box = $('pErrosLista'), d = state.duplicados || []; if (!box || !d.length) return;
    const max = 500, linhas = d.slice(0, max).map(x => {
      const m = String(x.motivo || '').match(/chave ([^)]+)\)/), ch = m ? m[1].trim() : '', orig = chavesV118.get(ch);
      return '<div><b>' + esc(x.pasta_origem || x.arquivo_origem) + '</b> — duplicado de <b>' + esc(orig ? orig.arquivo : '(arquivo anterior)') + '</b>' + (ch ? ' <span class="small">(chave ' + esc(ch) + ')</span>' : '') + '</div>';
    }).join('');
    box.insertAdjacentHTML('beforeend', '<details style="margin-top:10px"><summary><b>Duplicados excluídos automaticamente (' + fmtInt(d.length) + ')</b> — mesmo documento em mais de um arquivo; vale o primeiro.</summary>' + linhas
      + (d.length > max ? '<div>… e mais ' + fmtInt(d.length - max) + '.</div>' : '') + '</details>');
  };
  // conferência: arquivos = processados + duplicados + erros
  function conferenciaV118(){
    const met = document.querySelector('#processar .v14-metrics'); if (!met) return;
    let el = $('pConferenciaV118');
    if (!el){ el = document.createElement('div'); el.id = 'pConferenciaV118'; el.style.cssText = 'margin-top:10px;padding:8px 12px;border-radius:8px;font-size:14px'; met.insertAdjacentElement('afterend', el); }
    const arq = (state.files || []).length, docs = (state.docs || []).length, dup = (state.duplicados || []).length, err = (state.errors || []).length, soma = docs + dup + err;
    if (!arq || !docs){ el.textContent = ''; el.style.display = 'none'; return; }
    el.style.display = '';
    const ok = soma === arq;
    el.style.background = ok ? '#e7f5ec' : '#fff4e5'; el.style.border = '1px solid ' + (ok ? '#b9e2c7' : '#f3d19c'); el.style.color = ok ? '#1c6b3a' : '#8a5300';
    el.innerHTML = '<b>Conferência:</b> ' + fmtInt(arq) + ' arquivo(s) carregado(s) = ' + fmtInt(docs) + ' documento(s) processado(s) (inclui ' + fmtInt((state.events || []).length ? state.docs.filter(x => x.tipo_documento === 'Evento NF-e').length : 0) + ' de eventos) + '
      + fmtInt(dup) + ' duplicado(s) excluído(s) + ' + fmtInt(err) + ' com erro' + (ok ? ' ✔' : ' — diferença de ' + fmtInt(arq - soma) + ' arquivo(s)')
      + '. Todos os itens dos documentos processados estão nas abas (' + fmtInt(state.items.length) + ' item(ns)).';
  }
  const renderV117 = window.render;
  window.render = function(){ const r = renderV117.apply(this, arguments); try { listarOcorrencias(); conferenciaV118(); } catch(e){ console.error(e); } return r; };
