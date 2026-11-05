/* V201 — Classificador liberado para uso direto, sem cadastro, senha ou limitação de consultas. */
(function(){
  const liberar=()=>{
    window.classificadorAssinante=true;
    document.querySelectorAll('#v127-login,#v177-blocked').forEach(el=>el.remove());
    document.querySelectorAll('.v139-public-lock').forEach(el=>{el.classList.remove('v139-public-lock');if(el.matches('.v123-link'))el.tabIndex=0});
    document.querySelectorAll('.v154-lock-note,#v139-query-status').forEach(el=>el.remove());
  };
  window.classificadorAbrirLogin=()=>{};
  window.addEventListener('classificador:abrir-login',liberar);
  liberar();
})();
