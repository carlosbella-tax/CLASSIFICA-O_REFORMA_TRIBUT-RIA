/* V152/V188 — controle de visibilidade da administração, sem painel institucional na consulta. */
(function(){
  const link=document.getElementById('v127-admin-link'),section=link?.previousElementSibling;
  const setAdmin=role=>{
    const visible=role==='admin_taxadvice';
    if(link)link.hidden=!visible;
    if(section?.classList.contains('v123-side-section'))section.hidden=!visible;
  };
  setAdmin('');
  window.addEventListener('classificador:usuario-autenticado',e=>setAdmin(e.detail?.role||''));
})();
