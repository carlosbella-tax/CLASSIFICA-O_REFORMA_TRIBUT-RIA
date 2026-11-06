/* V205 — Relação NCM × Imposto Seletivo (IS), com referência de 2027.
   Fonte: LC 214/2025, Anexo XVII, e MP 1.399/2026 (regras transitórias e
   alíquotas de 2027 informadas pelo usuário). A tela não estima cenários que
   dependem de dados técnicos do produto ou de confirmação de vigência. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatar=n=>String(n||'').length===8?String(n).slice(0,4)+'.'+String(n).slice(4,6)+'.'+String(n).slice(6):String(n||'—');
  function chaveNcm(valor){
    let n=String(valor||'').replace(/\D/g,'');
    if(/^0{4}\d{4}$/.test(n))n=n.slice(4);
    return n;
  }
  function resultadoNcmIs(valor){
    const n=chaveNcm(valor), tem=p=>n.startsWith(p);
    const base='LC 214/2025, Anexo XVII';
    const sujeito=(produto,aliquota,observacao='')=>({situacao:'SUJEITO AO IS',produto,aliquota,referencia:base+' · MP 1.399/2026, 2027',observacao});
    const zero=(produto,observacao)=>({situacao:'ALÍQUOTA ZERO EM 2027',produto,aliquota:'0,00%',referencia:base+' · MP 1.399/2026, art. 6º',observacao});
    if(!n)return {situacao:'NCM NÃO INFORMADO',produto:'—',aliquota:'—',referencia:base,observacao:'Informe um NCM para verificar o enquadramento no IS.'};
    if(tem('2601')||tem('27090010')||tem('27111100')||tem('27112100'))return zero('Bem mineral listado no Anexo XVII','O IS dos bens minerais listados está zerado até 31/12/2027; a LC prevê limite de 0,25% após a regra transitória.');
    if(tem('22021000'))return sujeito('Bebida açucarada','2,60%');
    if(tem('2203'))return sujeito('Cerveja de malte','4,20%');
    if(tem('2205'))return sujeito('Vermute ou outra bebida da posição 22.05','12,00%');
    if(/^(22042100|22042211|22042219|22042910|22060090)$/.test(n))return sujeito('Bebida com alíquota específica do Anexo IV','16,00%');
    if(tem('22084000'))return sujeito('Rum ou aguardente de cana, exceto de melaço','20,00%');
    if(tem('2204')||tem('2206')||tem('22089000'))return sujeito('Bebida alcoólica — confirmar a descrição e exceções do Anexo IV','8,00%','Algumas bebidas da posição podem ter alíquota de 16,00%, conforme código e características do produto.');
    if(tem('2208'))return sujeito('Demais bebidas da posição 22.08','24,00%');
    if(tem('24022000'))return sujeito('Cigarro','66,70% + R$ 3,50 por vintena','A alíquota específica por vintena deve ser calculada com a quantidade tributável.');
    if(tem('24021000'))return sujeito('Cigarrilha — confirmar o enquadramento Ex 01','66,70% + R$ 3,50 por vintena','A regra específica alcança a cigarrilha classificada no Ex 01; confirme a TIPI.');
    if(tem('2401')||tem('2402')||tem('2403')||tem('2404'))return sujeito('Produto fumígeno','37,50%','Confirmar exceções e o enquadramento específico de cigarros e cigarrilhas.');
    if(tem('8802')&&!tem('88026000'))return sujeito('Aeronave','6,80%','Aeronave sustentável pode ter alíquota zero; confirme a tecnologia de propulsão e os requisitos legais.');
    if(tem('89033'))return sujeito('Barco a motor da subposição 8903.3','12,00%','Embarcação sustentável sem emissão direta de CO₂ pode ter alíquota zero.');
    if(tem('8903'))return sujeito('Embarcação de recreio ou esporte a motor','7,80%','Confirme se o NCM e a motorização atendem à hipótese; embarcação sustentável pode ter alíquota zero.');
    if(tem('8703'))return {situacao:'SUJEITO AO IS — DADOS TÉCNICOS NECESSÁRIOS',produto:'Automóvel da posição 87.03',aliquota:'A calcular',referencia:base+' · MP 1.399/2026, Anexos I, II e V',observacao:'A alíquota depende da propulsão, potência, eficiência energética, segurança e reciclabilidade; aplicar fator de conversão 1,21.'};
    if(/^(870421|870431|87044100|87045100|87046000|87049000)/.test(n))return {situacao:'SUJEITO AO IS — DADOS TÉCNICOS NECESSÁRIOS',produto:'Picape ou utilitário elegível da posição 87.04',aliquota:'A calcular',referencia:base+' · MP 1.399/2026, Anexos I, III e V',observacao:'A alíquota depende das características técnicas; caminhões com PBT igual ou superior a 3.500 kg não incidem. Aplicar fator 1,21 quando cabível.'};
    return {situacao:'FORA DA LISTA FECHADA DO IS',produto:'NCM sem hipótese identificada no Anexo XVII',aliquota:'Sem IS identificado',referencia:base,observacao:'A ausência de enquadramento nesta referência não substitui a conferência do NCM, da descrição e da vigência aplicável.'};
  }
  window.classificadorImpostoSeletivoNcm=resultadoNcmIs;
  function incluirNoResultado(termo){
    const painel=document.getElementById('v153-result');if(!painel)return;
    const anterior=painel.querySelector('#v205-is');if(anterior)anterior.remove();
    const r=resultadoNcmIs(termo),cls=/SUJEITO|ZERO/.test(r.situacao)?'v205-is-alerta':'v205-is-neutro';
    const bloco=document.createElement('section');bloco.id='v205-is';bloco.className='v205-is '+cls;
    bloco.innerHTML='<h3>Imposto Seletivo (IS) — relação com o NCM</h3><div class="v205-is-grid"><div><span>Situação</span><b>'+esc(r.situacao)+'</b></div><div><span>Produto / hipótese</span><b>'+esc(r.produto)+'</b></div><div><span>Alíquota IS em 2027</span><b>'+esc(r.aliquota)+'</b></div><div><span>Referência</span><b>'+esc(r.referencia)+'</b></div></div><p>'+esc(r.observacao)+'</p>';
    painel.insertBefore(bloco,painel.querySelector('.v159-calc')||null);
  }
  const topo=document.getElementById('v123-topbar');
  topo?.addEventListener('click',e=>{const b=e.target.closest('[data-v123-consulta="ncm"]');if(b){const termo=document.getElementById('v123-ncm')?.value.trim();if(termo)setTimeout(()=>incluirNoResultado(termo),35);}});
  topo?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('#v123-ncm')){const termo=e.target.value.trim();if(termo)setTimeout(()=>incluirNoResultado(termo),35);}},true);
  const style=document.createElement('style');style.textContent='.v205-is{margin:16px 0;padding:15px;border:1px solid #d8dde5;border-radius:10px}.v205-is-alerta{border-left:5px solid #f26a21;background:#fff9f5}.v205-is-neutro{border-left:5px solid #607086;background:#f7f9fc}.v205-is h3{margin:0 0 12px;color:#164c78;font-size:16px}.v205-is-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.v205-is-grid div{padding:9px;background:#fff;border:1px solid #e2e6ec;border-radius:6px}.v205-is-grid span{display:block;color:#667085;font-size:10px;font-weight:800;text-transform:uppercase;margin-bottom:4px}.v205-is-grid b{font-size:12px;line-height:1.35;color:#17202d}.v205-is p{margin:12px 0 0;font-size:12px;line-height:1.45;color:#364152}@media(max-width:850px){.v205-is-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.v205-is-grid{grid-template-columns:1fr}}';document.head.appendChild(style);
})();
