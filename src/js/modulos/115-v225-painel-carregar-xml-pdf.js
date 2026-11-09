/* V225 — Substitui os campos de CNAE/lote/exportações do cabeçalho por um painel único de carga XML/PDF. */
(function(){
  /* V225 — Remove da interface os blocos solicitados sem alterar os mecanismos internos de análise. */
  document.querySelector('.v156-cnae-field')?.remove();
  document.querySelector('.v137-uploads')?.remove();

  const painel=document.getElementById('load');
  const cartao=painel?.querySelector(':scope > .card');
  const area=document.getElementById('drop');
  if(!painel||!cartao||!area)return;

  const titulo=document.createElement('h2');
  titulo.id='v225-carregar-titulo';
  titulo.textContent='Carregar XML/PDF';
  cartao.insertBefore(titulo,area);

  const chamada=area.querySelector('strong');
  const orientacao=area.querySelector('.hint');
  if(chamada)chamada.textContent='Arraste os XMLs ou a pasta para cá';
  if(orientacao)orientacao.textContent='ou use os botões abaixo';

  const selecionarArquivos=document.querySelector('label.button:has(#files)');
  if(selecionarArquivos){
    const texto=[...selecionarArquivos.childNodes].find(no=>no.nodeType===Node.TEXT_NODE);
    if(texto)texto.nodeValue='Selecionar arquivos';
  }
  const selecionarPasta=document.getElementById('selectFolderFull');
  const processar=document.getElementById('process');
  if(selecionarPasta)selecionarPasta.textContent='Selecionar pasta';
  if(processar)processar.textContent='Processar';
  /* V225 — O controle legado permanece oculto porque o motor ainda o referencia ao atualizar o estado. */
  document.getElementById('downloadTop')?.classList.add('v225-controle-interno');

  const menuCarga=document.querySelector('#v123-sidebar [data-v123-key="documentos"]');
  if(menuCarga){
    const texto=[...menuCarga.childNodes].find(no=>no.nodeType===Node.TEXT_NODE);
    if(texto)texto.nodeValue='Carregar XML/PDF';
  }
  const tituloPagina=document.getElementById('v123-title');
  if(tituloPagina?.textContent==='Carregar documentos')tituloPagina.textContent='Carregar XML/PDF';
  menuCarga?.addEventListener('click',()=>{if(tituloPagina)tituloPagina.textContent='Carregar XML/PDF';});

  const css=document.createElement('style');
  css.id='v225-carregar-style';
  css.textContent='/* V225 — Campo de carga limpo, centralizado e responsivo. */.v225-controle-interno{display:none!important}#v225-carregar-titulo{margin:0 0 14px;color:#173f64;font-size:22px}#load>.card:first-child{border-top:4px solid #f26a21}#load #drop{padding:34px 20px}#load #drop strong{font-size:18px;color:#173f64}#load #drop .hint{display:block;margin:8px 0 16px;font-size:13px}#load #drop .actions{gap:10px;flex-wrap:wrap}#load #process,#load #clear{min-width:130px}@media(max-width:650px){#v225-carregar-titulo{font-size:19px}#load #drop{padding:25px 12px}#load #drop .actions>*{width:100%;text-align:center}}';
  document.head.appendChild(css);
  window.classificadorPainelCarregarXmlPdf=true;
})();
