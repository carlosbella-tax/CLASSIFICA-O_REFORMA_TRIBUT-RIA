/* V152 — Administração exclusiva e painel de consulta em lote TaxAdvice. */
(function(){
  const style=document.createElement('style');style.textContent=`
.v152-specialist{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:18px 0 4px;padding:22px 28px;background:#202229;border:1px solid #464b55;border-radius:17px;box-shadow:0 5px 16px #0004;color:#f0eee8}.v152-specialist h2{margin:0 0 8px;font-size:24px;color:#f0eee8}.v152-specialist h2 strong{color:#ff761c}.v152-specialist p{margin:0;color:#bbb6aa;font-size:16px}.v152-specialist a{flex:0 0 auto;min-width:292px;padding:19px 24px;border-radius:10px;background:#ff761c;color:#17130f!important;text-align:center;font-weight:800;font-size:17px;text-decoration:none}.v152-specialist a:hover{background:#ff8a3a}@media(max-width:800px){.v152-specialist{align-items:stretch;flex-direction:column;padding:20px}.v152-specialist h2{font-size:20px}.v152-specialist a{min-width:0}}
`;document.head.appendChild(style);
  const fields=document.querySelector('.company-fields');if(fields&&!document.getElementById('v152-specialist')){const panel=document.createElement('section');panel.id='v152-specialist';panel.className='v152-specialist';panel.innerHTML='<div><h2>Conte com a <strong>TaxAdvice</strong> na transição tributária.</h2><p>Para realizar consultas em lote sem limites, a TaxAdvice estrutura e acompanha cada etapa deste plano com a sua equipe.</p></div><a href="https://wa.me/551197049434" target="_blank" rel="noopener noreferrer">◌ Falar com um especialista</a>';fields.insertAdjacentElement('afterend',panel)}
  const link=document.getElementById('v127-admin-link'),section=link?.previousElementSibling;
  const setAdmin=role=>{const visible=role==='admin_taxadvice';if(link)link.hidden=!visible;if(section?.classList.contains('v123-side-section'))section.hidden=!visible};
  setAdmin('');window.addEventListener('classificador:usuario-autenticado',e=>setAdmin(e.detail?.role||''));
})();
