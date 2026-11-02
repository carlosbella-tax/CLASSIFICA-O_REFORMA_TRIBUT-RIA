/* V125/V186 — Suporte TaxAdvice direcionado ao WhatsApp, sem tela de contato duplicada. */
(function(){
  const side=document.getElementById('v123-sidebar');
  if(!side || document.getElementById('v125-contact-link')) return;
  const mensagem='Gostaria de saber mais da ferramenta de auditoria';
  const whatsapp='https://wa.me/551197049434?text='+encodeURIComponent(mensagem);
  const style=document.createElement('style');
  style.textContent='.v125-contact-link{text-decoration:none}.v125-contact-link:hover{color:#fff!important}';
  document.head.appendChild(style);
  const section=document.createElement('div');
  section.className='v123-side-section';
  section.textContent='Suporte';
  const link=document.createElement('a');
  link.id='v125-contact-link';
  link.className='v123-link v125-contact-link';
  link.href=whatsapp;
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.innerHTML='Fale Conosco <small>›</small>';
  side.appendChild(section);
  side.appendChild(link);
})();
