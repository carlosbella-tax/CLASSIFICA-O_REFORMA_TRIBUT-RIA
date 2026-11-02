/* V183 — Ações por aba, resumos de carga e painel consolidado de CNAE/enquadramento. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalizar=v=>String(v||'').replace(/\D/g,'');
  const itens=()=>typeof state==='undefined'?[]:(state.items||[]);
  const cnaes=()=>[...new Set((document.getElementById('cnaesEmpresa')?.value||'').split(/[;,\n]+/).map(normalizar).filter(Boolean))];
  const ncmFmt=v=>v.length===8?v.slice(0,4)+'.'+v.slice(4,6)+'.'+v.slice(6):v;
  const nbsFmt=v=>v.length===9?v.slice(0,1)+'.'+v.slice(1,5)+'.'+v.slice(5,7)+'.'+v.slice(7):v;
  function removerAcoesAntigas(){
    ['backIss','backIbs','back'].forEach(id=>document.getElementById(id)?.remove());
  }
  function moverDownload(){
    const download=document.getElementById('download'),box=document.querySelector('#load .v45-diag');
    if(download&&box&&!box.querySelector('#download'))box.querySelector('[data-salvar]')?.insertAdjacentElement('beforebegin',download);
  }
  function acoesEnquadramento(){
    const sec=document.querySelector('#observacoes .v180-enquadramento');if(!sec||sec.querySelector('.v183-enquadramento-acoes'))return;
    const barra=document.createElement('div');barra.className='v45-bar v183-enquadramento-acoes';barra.innerHTML='<button type="button" class="v45-btn" data-v183-exportar>⬇ Exportar esta aba em Excel</button><span>Todas as linhas da aba, respeitando os filtros ativos.</span><button type="button" class="secondary v45-btn2" data-v183-imprimir>🖨 Imprimir / PDF</button><button type="button" class="secondary v45-btn2" data-salvar>💾 Salvar diagnóstico completo</button>';
    sec.insertBefore(barra,sec.firstChild);
  }
  function grupos(){
    const ncm=new Map,nbs=new Map;
    itens().forEach(r=>{
      const nc=normalizar(r.ncm||r.codigo_ncm),nb=normalizar(r.nbs||r.codigo_nbs||r.codigo_servico_nbs),serv=String(r.codigo_servico||r.item_lista_servico||'Não informado').trim();
      if(nc){const x=ncm.get(nc)||{codigo:nc,descricao:r.descricao_item||r.descricao_produto||r.xProd||'Descrição não informada',qtd:0};x.qtd++;ncm.set(nc,x);}
      if(nb){const k=nb+'|'+serv,x=nbs.get(k)||{codigo:nb,servico:serv,descricao:r.descricao_servico||r.descricao_item||r.discriminacao||'Descrição não informada',qtd:0};x.qtd++;nbs.set(k,x);}
    });
    return {ncm:[...ncm.values()].sort((a,b)=>a.codigo.localeCompare(b.codigo)),nbs:[...nbs.values()].sort((a,b)=>a.codigo.localeCompare(b.codigo)||a.servico.localeCompare(b.servico))};
  }
  function tabelaNcm(lista){return lista.length?'<div class="v183-scroll"><table><thead><tr><th>NCM</th><th>Descrição</th><th>Quantidade de itens</th></tr></thead><tbody>'+lista.map(x=>'<tr><td><b>'+esc(ncmFmt(x.codigo))+'</b></td><td>'+esc(x.descricao)+'</td><td>'+x.qtd+'</td></tr>').join('')+'</tbody></table></div>':'<p class="hint">Nenhuma NCM identificada na carga atual.</p>';}
  function tabelaNbs(lista){return lista.length?'<div class="v183-scroll"><table><thead><tr><th>NBS</th><th>Código de serviço (LC 116/2003)</th><th>Descrição</th><th>Quantidade de itens</th></tr></thead><tbody>'+lista.map(x=>'<tr><td><b>'+esc(nbsFmt(x.codigo))+'</b></td><td>'+esc(x.servico)+'</td><td>'+esc(x.descricao)+'</td><td>'+x.qtd+'</td></tr>').join('')+'</tbody></table></div>':'<p class="hint">Nenhuma NBS identificada na carga atual.</p>';}
  function grafico(titulo,lista,chave){const max=Math.max(1,...lista.map(x=>x.qtd));return '<section class="v183-grafico"><h4>'+titulo+'</h4>'+(lista.length?lista.map(x=>'<div class="v183-bar"><span>'+esc(chave(x))+'</span><i><b style="width:'+Math.max(4,x.qtd/max*100)+'%"></b></i><strong>'+x.qtd+'</strong></div>').join(''):'<p class="hint">Sem dados para este gráfico.</p>')+'</section>';}
  function painelDashboard(){
    const raiz=document.querySelector('#dashboard .dashboard-v6');if(!raiz)return;
    const {ncm,nbs}=grupos();let card=document.getElementById('v183-dashboard');if(!card){card=document.createElement('section');card.id='v183-dashboard';card.className='dashboard-card dash-wide v183-dashboard';raiz.prepend(card);}
    const lista=cnaes(),validos=lista.filter(x=>x.length===7);
    card.innerHTML='<h3>Dashboard da análise fiscal</h3><p class="v183-resumo">'+(typeof state==='undefined'?0:(state.docs||[]).length)+' documento(s) e '+itens().length+' item(ns) consolidados da carga atual.</p><section class="v183-bloco"><h4>1. Validação de atividade (CNAE)</h4><p><b>'+lista.length+' CNAE(s) informado(s) · '+validos.length+' CNAE(s) validado(s)</b></p>'+(lista.length?'<p>'+lista.map(x=>esc(x.length===7?(x.slice(0,4)+'-'+x.slice(4,5)+'/'+x.slice(5)):x)).join(' · ')+'</p>':'<p class="hint">Nenhum CNAE informado.</p>')+'</section><section class="v183-bloco"><h4>2. Enquadramento recomendado consolidado</h4><p class="subtle">NCMs repetidas são consolidadas por código. Para NBS, cada combinação de NBS e código de serviço da LC 116/2003 permanece separada.</p><h5>NCMs recomendadas para análise</h5>'+tabelaNcm(ncm)+'<h5>NBS e códigos de serviço recomendados para análise</h5>'+tabelaNbs(nbs)+'</section><div class="v183-graficos">'+grafico('Quantidade de itens por NCM recomendada para análise',ncm,x=>ncmFmt(x.codigo))+grafico('Quantidade de itens por NBS e código de serviço recomendados',nbs,x=>nbsFmt(x.codigo)+' · '+x.servico)+'</div>';
  }
  function acaoCte(){
    const link=document.querySelector('#v123-sidebar [data-v123-key="cte"]');if(!link||document.getElementById('v183-exportar-cte'))return;
    const botao=document.createElement('button');botao.id='v183-exportar-cte';botao.type='button';botao.textContent='⬇ Exportar esta aba em Excel';
    botao.onclick=()=>document.querySelector('#items [data-exp="items"]')?.click();link.insertAdjacentElement('afterend',botao);
  }
  function atualizarDocumentoAuditado(){
    const atalho=document.getElementById('v140-audit-tool');if(!atalho)return;
    const s=typeof state==='undefined'?{}:state,arquivos=(s.files||[]).length,docs=(s.docs||[]).length,quantidadeItens=(s.items||[]).length;
    let dados=atalho.querySelector('.v183-documento-dados');
    if(!dados){dados=document.createElement('small');dados.className='v183-documento-dados';atalho.querySelector('span:last-child')?.appendChild(dados);}
    dados.innerHTML=arquivos+' arquivo(s) carregado(s)<br>'+docs+' documento(s) · '+quantidadeItens+' item(ns)<br>Modelo oficial · Versão 183<br>atualizado em 02/11/2026';
  }
  function atualizarTudo(){removerAcoesAntigas();moverDownload();acoesEnquadramento();painelDashboard();acaoCte();atualizarDocumentoAuditado();}
  document.addEventListener('click',e=>{if(e.target.closest('[data-v183-exportar]')){const tabela=document.querySelector('#observacoes .v180-scroll table');const linhas=typeof tabelaParaLinhas==='function'?tabelaParaLinhas(tabela):[];if(typeof gerarXlsx==='function'&&linhas.length)gerarXlsx('enquadramento_recomendado_'+new Date().toISOString().slice(0,10)+'.xlsx',[['Enquadramento recomendado',linhas]]);}if(e.target.closest('[data-v183-imprimir]'))window.print();if(e.target.closest('[data-v123-key="enquadramento"]')||e.target.closest('.tab[data-tab="observacoes"]'))setTimeout(atualizarTudo,70);});
  const anterior=window.renderDashboard;if(typeof anterior==='function')window.renderDashboard=function(){const r=anterior.apply(this,arguments);painelDashboard();return r;};
  const css=document.createElement('style');css.textContent='#v183-exportar-cte{display:block;width:calc(100% - 30px);margin:-2px 15px 8px;padding:7px 9px;border:1px solid #7198b6;border-radius:6px;background:#174b73;color:#fff;text-align:left;font:800 11px system-ui;cursor:pointer}#v183-exportar-cte:hover{background:#f26a21}.v183-documento-dados{display:block;margin-top:8px;color:#d6e6f2;font:600 10px/1.45 system-ui}.v183-dashboard h3,.v183-dashboard h4,.v183-dashboard h5{color:#fff!important;font-weight:800}.v183-dashboard{background:#123d60!important;color:#fff!important}.v183-dashboard .subtle,.v183-dashboard .hint{color:#d6e6f2!important}.v183-dashboard p{color:#fff!important}.v183-resumo{font-weight:800}.v183-bloco{margin-top:16px;padding:14px;border:1px solid #547894;border-radius:8px;background:#174b73}.v183-bloco h4{margin:0 0 8px}.v183-bloco h5{margin:18px 0 8px;font-size:14px}.v183-scroll{overflow:auto;border:1px solid #6b8ca5;border-radius:7px}.v183-scroll table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px}.v183-scroll th,.v183-scroll td{padding:8px 10px;border:1px solid #6688a2;text-align:left}.v183-scroll th{background:#0c304c;color:#fff}.v183-graficos{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:16px}.v183-grafico{padding:14px;border:1px solid #547894;border-radius:8px;background:#174b73;overflow:auto;max-height:430px}.v183-grafico h4{margin:0 0 12px}.v183-bar{display:grid;grid-template-columns:minmax(110px,1fr) 2fr 35px;gap:8px;align-items:center;margin:7px 0;font-size:11px}.v183-bar i{height:12px;background:#0c304c;border-radius:9px;overflow:hidden}.v183-bar i b{display:block;height:100%;background:#f26a21;border-radius:9px}.v183-bar strong{text-align:right}@media(max-width:900px){.v183-graficos{grid-template-columns:1fr}}';document.head.appendChild(css);
  const setFilesAnterior=window.setFiles;if(typeof setFilesAnterior==='function')window.setFiles=function(){const r=setFilesAnterior.apply(this,arguments);setTimeout(atualizarTudo,0);return r;};
  const badgesAnterior=window.atualizarBadgesTributos;if(typeof badgesAnterior==='function')window.atualizarBadgesTributos=function(){const r=badgesAnterior.apply(this,arguments);setTimeout(atualizarTudo,0);return r;};
  document.getElementById('v123-sidebar')?.addEventListener('click',e=>{const b=e.target.closest('[data-v123-key]');if(!b)return;const s=typeof state==='undefined'?{}:state;const docs=(s.docs||[]).length,itensAtual=(s.items||[]).length;const titulo=document.getElementById('v123-title');if(titulo&&['nfe','nfse','cte','ibs','enquadramento','dashboard'].includes(b.dataset.v123Key))titulo.textContent=titulo.textContent+' — Documentos: '+docs+' · itens: '+itensAtual+' · todos os itens dos XMLs, em páginas.';setTimeout(atualizarTudo,80);});
  setTimeout(atualizarTudo,0);
})();
