/* V125 — Aba Fale Conosco: suporte especializado TaxAdvice e WhatsApp. */
(function(){
  const side=document.getElementById('v123-sidebar'), topTitle=document.getElementById('v123-title');
  if(!side || document.getElementById('v125-contact')) return;
  const style=document.createElement('style');
  style.textContent=`.v125-contact{display:none;padding:24px 29px 32px;max-width:none}.v125-contact.active{display:block}.v125-contact-card{max-width:780px;background:#fff;border:1px solid #d7e2eb;border-radius:10px;box-shadow:0 1px 3px #173b5412;padding:28px}.v125-contact-card h2{margin:0 0 12px;color:#173f64;font-size:22px}.v125-contact-card h2:before{content:'';display:inline-block;width:5px;height:25px;vertical-align:-5px;background:#f26a21;border-radius:3px;margin-right:10px}.v125-contact-card p{margin:0 0 20px;color:#405563;font-size:15px;line-height:1.65}.v125-whatsapp{display:inline-flex;align-items:center;gap:9px;border-radius:7px;background:#176b45;color:#fff!important;padding:12px 16px;text-decoration:none;font:800 14px system-ui;box-shadow:0 2px 4px #10382022}.v125-whatsapp:hover{background:#125a39}.v125-phone{margin-top:13px!important;font-weight:700;color:#173f64!important}`;
  document.head.appendChild(style);
  const button=document.createElement('button'); button.className='v123-link'; button.type='button'; button.dataset.v125Contact='1'; button.innerHTML='Fale Conosco <small>›</small>';
  const section=document.createElement('div'); section.className='v123-side-section'; section.textContent='Suporte'; side.appendChild(section); side.appendChild(button);
  const view=document.createElement('section'); view.id='v125-contact'; view.className='v125-contact';
  view.innerHTML='<div class="v125-contact-card"><h2>Fale Conosco</h2><p>A otimização da cadeia de suprimentos diante da Reforma exige acompanhamento técnico contínuo, oferecido pela TaxAdvice.</p><a class="v125-whatsapp" href="https://wa.me/551197049434?text=Olá%2C%20quero%20falar%20com%20um%20especialista%20da%20TaxAdvice." target="_blank" rel="noopener noreferrer">Falar com um especialista</a><p class="v125-phone">WhatsApp: (11) 9704-9434</p></div>';
  document.body.appendChild(view);
  const fechar=()=>{view.classList.remove('active');};
  side.addEventListener('click',e=>{const b=e.target.closest('.v123-link');if(b && !b.dataset.v125Contact) fechar();},true);
  button.addEventListener('click',()=>{document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.v123-link').forEach(b=>b.classList.remove('active'));button.classList.add('active');view.classList.add('active');if(topTitle)topTitle.textContent='Fale Conosco';});
})();
