/* V227 — O programa sempre inicia diretamente na tela Consulta NCM e NBS. */
(function(){
  const abrirConsulta=()=>{
    const consulta=document.querySelector('#v123-sidebar [data-v123-key="consulta"]');
    if(!consulta)return false;
    consulta.click();
    return document.body.classList.contains('v219-modo-consulta');
  };
  window.classificadorAbrirConsultaInicial=abrirConsulta;
  abrirConsulta();
})();
