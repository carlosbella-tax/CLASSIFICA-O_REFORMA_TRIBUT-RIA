/* V203 — Cabeçalho compacto e CNAEs organizados com descrição oficial do IBGE. */
(function(){
  const css=document.createElement('style');
  css.textContent=`.v123-header .company-fields{grid-template-columns:minmax(300px,1fr) 142px 185px minmax(290px,1.15fr)!important;align-items:start}.v123-header .company-fields>.field-label:nth-child(2),.v123-header .company-fields>#cnpjEmpresa{width:142px}.v123-header #cnpjEmpresa{box-sizing:border-box;width:142px;letter-spacing:.01em}.v123-header #regimeEmpresa{box-sizing:border-box;width:185px}.v123-header .v156-cnae-field.v203-cnae-field{grid-column:auto!important;width:100%}.v123-header .v156-cnae-field.v203-cnae-field textarea{box-sizing:border-box;width:100%;min-height:52px;resize:vertical}.v203-cnae-list{display:grid;gap:4px;margin-top:6px;max-height:108px;overflow:auto}.v203-cnae-row{display:grid;grid-template-columns:94px minmax(0,1fr);gap:7px;padding:5px 7px;border:1px solid #d6e1ea;border-radius:5px;background:#f7fafc;color:#324b60;font:600 11px system-ui;line-height:1.3}.v203-cnae-code{font-weight:800;color:#164c78}.v203-cnae-warn{color:#9d4f10}@media(max-width:1150px){.v123-header .company-fields{grid-template-columns:minmax(260px,1fr) 142px 185px!important}.v123-header .v156-cnae-field.v203-cnae-field{grid-column:1/-1!important}}@media(max-width:720px){.v123-header .company-fields{grid-template-columns:1fr!important}.v123-header .v156-cnae-field.v203-cnae-field{grid-column:auto!important}.v123-header #cnpjEmpresa,.v123-header #regimeEmpresa{width:100%}}`;
  document.head.appendChild(css);
  const campo=document.getElementById('cnaesEmpresa');
  if(!campo)return;
  const label=campo.closest('.v156-cnae-field');
  label?.classList.add('v203-cnae-field');
  if(label){label.firstChild.textContent='CNAE';label.querySelector('.v156-cnae-help')?.remove();}
  const lista=document.createElement('div');lista.id='v203-cnae-list';lista.className='v203-cnae-list';lista.setAttribute('aria-live','polite');label?.appendChild(lista);
  const cache=new Map(); let agendamento;
  const codigos=()=>[...new Set(campo.value.split(/[;,\n]+/).map(x=>x.replace(/\D/g,'')).filter(Boolean))];
  const formato=c=>c.length===7?c.slice(0,4)+'-'+c[4]+'/'+c.slice(5):c;
  const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  async function descricao(c){
    if(cache.has(c))return cache.get(c);
    if(c.length!==7)return 'Informe os 7 dígitos do CNAE.';
    const pendente='Consultando descrição oficial do IBGE…';cache.set(c,pendente);
    try{const r=await fetch('https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/'+c);if(!r.ok)throw new Error('CNAE não localizado');const d=await r.json();const texto=d?.descricao||'Descrição não localizada.';cache.set(c,texto);return texto}catch(_){const texto='Descrição não localizada na fonte oficial do IBGE.';cache.set(c,texto);return texto;}
  }
  async function render(){const itens=codigos();if(!itens.length){lista.innerHTML='';return}lista.innerHTML=itens.map((c,i)=>'<div class="v203-cnae-row"><span class="v203-cnae-code">'+(i?'Secundário':'Principal')+' · '+formato(c)+'</span><span class="'+(c.length===7?'':'v203-cnae-warn')+'">'+esc(cache.get(c)||'Consultando descrição oficial do IBGE…')+'</span></div>').join('');await Promise.all(itens.map(descricao));lista.innerHTML=itens.map((c,i)=>'<div class="v203-cnae-row"><span class="v203-cnae-code">'+(i?'Secundário':'Principal')+' · '+formato(c)+'</span><span class="'+(c.length===7?'':'v203-cnae-warn')+'">'+esc(cache.get(c))+'</span></div>').join('');}
  campo.addEventListener('input',()=>{clearTimeout(agendamento);agendamento=setTimeout(render,300)});render();
})();
