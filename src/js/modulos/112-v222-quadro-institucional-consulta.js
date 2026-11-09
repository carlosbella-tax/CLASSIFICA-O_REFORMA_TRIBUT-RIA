/* V222 — Quadro institucional Tax Advice exclusivo da área azul da Consulta NCM/NBS. */
(function(){
  const top=document.getElementById('v123-topbar');
  if(!top||document.getElementById('v222-contato-consulta'))return;

  const quadro=document.createElement('section');
  quadro.id='v222-contato-consulta';
  quadro.className='v222-contato-consulta';
  quadro.setAttribute('aria-label','Fale com a Tax Advice');
  quadro.innerHTML=`
    <div class="v222-apresentacao">
      <p class="v222-selo">TAX ADVICE · ASSESSORIA FISCAL TRIBUTÁRIA</p>
      <h2>Fale com a Tax Advice</h2>
      <p class="v222-subtitulo">Auditoria Reforma Tributária · Consulta NCM e NBS</p>
      <div class="v222-cartao">
        <div class="v222-consultor">
          <span>CONSULTOR TRIBUTÁRIO</span>
          <strong>Carlos Bella</strong>
        </div>
        <div class="v222-canais">
          <a href="mailto:carlos.bella@taxadvice.com.br" aria-label="Enviar e-mail para Carlos Bella"><span aria-hidden="true">✉</span> carlos.bella@taxadvice.com.br</a>
          <a href="tel:+5511994797347" aria-label="Ligar para Carlos Bella"><span aria-hidden="true">☎</span> +55 11 99479-7347</a>
          <a href="https://taxadvice.com.br" target="_blank" rel="noopener noreferrer" aria-label="Abrir o site da Tax Advice"><span aria-hidden="true">↗</span> taxadvice.com.br</a>
        </div>
      </div>
      <p class="v222-rodape">CARLOS BELLA — ESPECIALISTA TRIBUTÁRIO — 11 99479-7347</p>
    </div>
    <div class="v222-marca" aria-hidden="true"><span>A</span><i></i></div>`;
  top.insertAdjacentElement('afterend',quadro);

  const css=document.createElement('style');
  css.textContent=`
    #v222-contato-consulta{display:none}
    body.v219-modo-consulta #v222-contato-consulta{display:grid;grid-template-columns:minmax(0,1fr) 170px;align-items:center;gap:24px;margin:96px 29px 24px;padding:26px 30px 20px;border:1px solid #3b769f;border-radius:12px;background:linear-gradient(115deg,#164f78 0%,#1c658f 72%,#21749c 100%);color:#fff;box-shadow:0 12px 28px #031d3138}
    body.v219-modo-consulta #v153-result+#v222-contato-consulta{margin-top:0}
    .v222-selo{margin:0 0 12px;color:#ff7a27;font:800 11px/1.3 system-ui,sans-serif;letter-spacing:2.5px}
    .v222-apresentacao h2{margin:0;color:#fff!important;font:800 29px/1.08 system-ui,sans-serif}
    .v222-subtitulo{margin:7px 0 18px;color:#e9f5fc;font:400 15px/1.4 system-ui,sans-serif}
    .v222-cartao{display:grid;grid-template-columns:minmax(180px,.75fr) minmax(260px,1.25fr);gap:22px;align-items:center;max-width:760px;padding:17px 20px;border:1px solid #3b769f;border-radius:7px;background:#0f3858}
    .v222-consultor span{display:block;margin-bottom:7px;color:#ff7a27;font:800 10px/1.2 system-ui,sans-serif;letter-spacing:1.5px}
    .v222-consultor strong{display:block;color:#fff;font:800 22px/1.15 system-ui,sans-serif}
    .v222-canais{display:grid;gap:8px}
    .v222-canais a{display:flex;align-items:center;gap:9px;color:#f6fbff!important;text-decoration:none;font:500 13px/1.3 system-ui,sans-serif}
    .v222-canais a:hover,.v222-canais a:focus{text-decoration:underline;color:#fff!important}
    .v222-canais a span{display:inline-grid;place-items:center;width:22px;color:#ff7a27;font-size:17px}
    .v222-rodape{margin:15px 0 0;color:#d5e9f5;font:800 9px/1.3 system-ui,sans-serif}
    .v222-marca{position:relative;display:grid;place-items:center;min-height:165px}
    .v222-marca span{color:#fff;font:900 112px/1 Arial,sans-serif;letter-spacing:-13px;transform:scaleX(1.08)}
    .v222-marca i{position:absolute;left:50%;bottom:24px;width:34px;height:50px;border-radius:7px 7px 16px 16px;background:#ff7626;transform:translateX(-42%) skewY(-1deg)}
    @media(max-width:900px){body.v219-modo-consulta #v222-contato-consulta{grid-template-columns:1fr;margin-left:18px;margin-right:18px;padding:22px}.v222-marca{display:none}.v222-cartao{grid-template-columns:1fr}.v222-apresentacao h2{font-size:25px}}
    @media(max-width:560px){.v222-cartao{padding:15px}.v222-canais a{font-size:12px;overflow-wrap:anywhere}.v222-selo{letter-spacing:1.5px}}
    @media print{#v222-contato-consulta{display:none!important}}
  `;
  document.head.appendChild(css);
  window.classificadorQuadroInstitucionalConsulta=quadro;
})();
