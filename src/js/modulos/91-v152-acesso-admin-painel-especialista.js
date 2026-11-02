/* V152 — Administração exclusiva e painel de consulta em lote TaxAdvice. */
(function(){
  const style=document.createElement('style');style.textContent=`
.v152-specialist{margin:18px 0 4px;padding:22px 28px;background:#202229;border:1px solid #464b55;border-radius:17px;box-shadow:0 5px 16px #0004;color:#f0eee8}.v152-specialist h2{margin:0 0 8px;font-size:24px;color:#f0eee8}.v152-specialist h2 strong{color:#ff761c}.v152-specialist p{margin:0;color:#bbb6aa;font-size:16px}@media(max-width:800px){.v152-specialist{padding:20px}.v152-specialist h2{font-size:20px}}
`;document.head.appendChild(style);
  const fields=document.querySelector('.company-fields');if(fields&&!document.getElementById('v152-specialist')){const panel=document.createElement('section');panel.id='v152-specialist';panel.className='v152-specialist';panel.innerHTML='<div><h2>Conte com a <strong>TaxAdvice</strong> na transição tributária.</h2><p>Para realizar consultas em lote sem limites, a TaxAdvice estrutura e acompanha cada etapa deste plano com a sua equipe.</p></div>';fields.insertAdjacentElement('afterend',panel)}
  const link=document.getElementById('v127-admin-link'),section=link?.previousElementSibling;
  const setAdmin=role=>{const visible=role==='admin_taxadvice';if(link)link.hidden=!visible;if(section?.classList.contains('v123-side-section'))section.hidden=!visible};
  setAdmin('');window.addEventListener('classificador:usuario-autenticado',e=>setAdmin(e.detail?.role||''));
})();
