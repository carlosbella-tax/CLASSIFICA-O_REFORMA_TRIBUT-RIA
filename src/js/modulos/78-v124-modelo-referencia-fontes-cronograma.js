/* =====================================================================
   V124 — Modelo funcional de referência: paleta, cronograma, fórmula
   da base IBS/CBS e rastreabilidade das fontes de pesquisa.
   Não altera resultados já calculados; explicita a metodologia aplicada.
   ===================================================================== */
(function(){
  const main = document.querySelector('main.wrap');
  const side = document.getElementById('v123-sidebar');
  const topTitle = document.getElementById('v123-title');
  if (!main || !side || document.getElementById('v124-metodologia')) return;

  const style = document.createElement('style');
  style.textContent = `
    :root{--v123-navy:#103c63;--v123-blue:#1d6f9e;--v123-orange:#dd8c2d;--v123-bg:#eef4f8;--v123-line:#d6e0e8}
    #v123-sidebar{background:#103c63}.v123-link:hover,.v123-link.active{background:#1d6f9e}.v123-query b{background:#1d6f9e}.v123-query button{background:#164c78}.v123-clear{background:#dd8c2d}.v123-section-title:before{background:#dd8c2d}
    .v124-view{display:none;padding:24px 29px 32px;max-width:none}.v124-view.active{display:block}.v124-hero{display:flex;justify-content:space-between;gap:22px;align-items:flex-start;background:linear-gradient(135deg,#103c63,#1d6f9e);color:#fff;border-radius:10px;padding:24px;margin-bottom:18px}.v124-hero h2{font-size:22px;margin:0 0 7px}.v124-hero p{margin:0;color:#dceffc;line-height:1.5;max-width:830px}.v124-tag{background:#e2f4ff;color:#124f76;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;white-space:nowrap}.v124-grid{display:grid;grid-template-columns:1.18fr .82fr;gap:18px}.v124-card{background:#fff;border:1px solid #d6e0e8;border-radius:9px;padding:18px}.v124-card h3{margin:0 0 8px;color:#183c56;font-size:16px}.v124-card p,.v124-card li{color:#405563;font-size:13px;line-height:1.5}.v124-table{width:100%;border-collapse:collapse;font-size:12px;min-width:660px}.v124-table th{background:#164c78;color:#fff}.v124-table th,.v124-table td{padding:9px 8px;border:1px solid #d6e0e8;text-align:center}.v124-table td:first-child{text-align:left;font-weight:700;color:#183c56}.v124-scroll{overflow:auto}.v124-formula{margin:12px 0;padding:12px;border-left:4px solid #dd8c2d;background:#fff6e9;color:#4c5b66;font-size:13px;line-height:1.55}.v124-sources{margin:0;padding-left:18px}.v124-sources a{color:#17679a;font-weight:700}.v124-note{margin-top:16px;color:#667784;font-size:11px;line-height:1.5}@media(max-width:1000px){.v124-grid{grid-template-columns:1fr}}@media(max-width:620px){.v124-hero{flex-direction:column}.v124-view{padding:18px}}
  `;
  document.head.appendChild(style);

  const schedule = [
    ['CBS', '0,90%', '8,40%', '8,40%', '8,50%', '8,50%', '8,50%', '8,50%', '8,50%'],
    ['IBS estadual', '0,10%', '0,05%', '0,05%', '1,60%', '3,20%', '4,80%', '6,48%', '16,20%'],
    ['IBS municipal', '0,00%', '0,05%', '0,05%', '0,25%', '0,50%', '0,75%', '1,00%', '2,50%']
  ];
  const years = [2026,2027,2028,2029,2030,2031,2032,2033];
  const view = document.createElement('section');
  view.id = 'v124-metodologia'; view.className = 'v124-view';
  view.innerHTML = '<div class="v124-hero"><div><h2>Metodologia, cronograma e fontes</h2><p>Referência operacional para a classificação IBS/CBS. A tela separa parâmetros de validação, fórmula de cálculo e bases normativas para tornar cada resultado auditável.</p></div><span class="v124-tag">Modelo de referência V20</span></div>'
    + '<div class="v124-grid"><div class="v124-card"><h3>Cronograma de alíquotas de referência</h3><p>Parâmetros anuais exibidos no modelo fornecido. O valor efetivamente destacado no XML é preservado; divergências exigem revisão técnica.</p><div class="v124-scroll"><table class="v124-table"><thead><tr><th>Tributo</th>' + years.map(y => '<th>'+y+'</th>').join('') + '</tr></thead><tbody>' + schedule.map(r => '<tr>' + r.map(c => '<td>'+c+'</td>').join('') + '</tr>').join('') + '</tbody></table></div><div class="v124-formula"><strong>Fórmula da base IBS/CBS:</strong> valor do bem ou serviço + frete + seguro + juros, multas e outras despesas + Imposto Seletivo − desconto incondicional. IBS, CBS, IPI, ICMS, ISS, PIS, COFINS e reembolsos documentados não integram a própria base.</div></div>'
    + '<div class="v124-card"><h3>Fontes de pesquisa e rastreabilidade</h3><ul class="v124-sources"><li><a href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm" target="_blank" rel="noopener">Lei Complementar nº 214/2025</a> — regra de base, regimes e anexos.</li><li><a href="https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda" target="_blank" rel="noopener">Receita Federal — Reforma Tributária do Consumo</a> — orientação institucional e transição.</li><li>TIPI 2026 — base completa incorporada ao aplicativo para consulta de NCM.</li><li>CST IBS/CBS e cClassTrib oficiais — publicação de referência de 01/06/2026, incorporada ao aplicativo.</li></ul><p class="v124-note">A classificação automática é indicativa. Quando não houver correlação oficial suficiente entre NCM/NBS, CST e cClassTrib, o sistema mantém o status “NÃO VALIDADO — REVISÃO OBRIGATÓRIA”.</p></div></div>';
  main.appendChild(view);

  const section = document.createElement('div'); section.className = 'v123-side-section'; section.textContent = 'Referências';
  const link = document.createElement('button'); link.type = 'button'; link.className = 'v123-link'; link.dataset.v124View = 'metodologia'; link.innerHTML = 'Cronograma e fontes <small>i</small>';
  side.insertBefore(section, side.querySelector('.v123-status')); side.insertBefore(link, side.querySelector('.v123-status'));

  const closeView = () => view.classList.remove('active');
  side.addEventListener('click', event => {
    if (event.target.closest('[data-v123-tab]')) closeView();
    const button = event.target.closest('[data-v124-view]');
    if (!button) return;
    document.querySelectorAll('.panel.active').forEach(panel => panel.classList.remove('active'));
    view.classList.add('active');
    side.querySelectorAll('.v123-link').forEach(item => item.classList.toggle('active', item === button));
    if (topTitle) topTitle.textContent = 'Cronograma e fontes de pesquisa';
  });
})();
