/* V207 — Análise do Imposto Seletivo por NCM após processamento da planilha.
   Não altera a tela de carregamento V202. Fonte: LC 214/2025, Anexo XVII,
   e MP 1.399/2026 para as alíquotas transitórias de 2027. */
(function(){
  function chave(v){let n=String(v||'').replace(/\D/g,'');return /^0{4}\d{4}$/.test(n)?n.slice(4):n;}
  function analisarIsNcm(valor){
    const n=chave(valor),tem=p=>n.startsWith(p),base='LC 214/2025, Anexo XVII';
    const sim=(produto,aliquota,obs='')=>({situacao:'SUJEITO AO IS',produto,aliquota,referencia:base+' · MP 1.399/2026, 2027',observacao:obs});
    const zero=(produto,obs)=>({situacao:'ALÍQUOTA ZERO EM 2027',produto,aliquota:'0,00%',referencia:base+' · MP 1.399/2026, regra transitória',observacao:obs});
    if(!n)return {situacao:'',produto:'',aliquota:'',referencia:'',observacao:''};
    if(tem('2601')||tem('27090010')||tem('27111100')||tem('27112100'))return zero('Bem mineral listado','IS zerado até 31/12/2027; confirmar a classificação e a vigência aplicável.');
    if(tem('22021000'))return sim('Bebida açucarada','2,60%');
    if(tem('2203'))return sim('Cerveja de malte','4,20%');
    if(tem('2205'))return sim('Vermute ou bebida da posição 22.05','12,00%');
    if(/^(22042100|22042211|22042219|22042910|22060090)$/.test(n))return sim('Bebida com regra específica','16,00%');
    if(tem('22084000'))return sim('Rum ou aguardente selecionada','20,00%');
    if(tem('2204')||tem('2206')||tem('22089000'))return sim('Bebida alcoólica','8,00%','Confirme exceções do Anexo IV; certos códigos possuem alíquota de 16,00%.');
    if(tem('2208'))return sim('Demais bebidas da posição 22.08','24,00%');
    if(tem('24022000'))return sim('Cigarro','66,70% + R$ 3,50 por vintena','A parcela específica depende da quantidade tributável.');
    if(tem('24021000'))return sim('Cigarrilha','66,70% + R$ 3,50 por vintena','Confirmar enquadramento no Ex 01 da TIPI.');
    if(tem('2401')||tem('2402')||tem('2403')||tem('2404'))return sim('Produto fumígeno','37,50%','Confirmar exceções e o enquadramento específico.');
    if(tem('8802')&&!tem('88026000'))return sim('Aeronave','6,80%','Aeronave sustentável pode ter alíquota zero; confirmar os requisitos legais.');
    if(tem('89033'))return sim('Embarcação da subposição 8903.3','12,00%','Embarcação sustentável pode ter alíquota zero.');
    if(tem('8903'))return sim('Embarcação de recreio ou esporte','7,80%','Confirmar NCM, motorização e exceções legais.');
    if(tem('8703'))return {situacao:'SUJEITO AO IS — DADOS TÉCNICOS NECESSÁRIOS',produto:'Automóvel da posição 87.03',aliquota:'A calcular',referencia:base+' · MP 1.399/2026, Anexos I, II e V',observacao:'Depende de propulsão, potência, eficiência energética, segurança e reciclabilidade; fator de conversão 1,21.'};
    if(/^(870421|870431|87044100|87045100|87046000|87049000)/.test(n))return {situacao:'SUJEITO AO IS — DADOS TÉCNICOS NECESSÁRIOS',produto:'Picape ou utilitário elegível da posição 87.04',aliquota:'A calcular',referencia:base+' · MP 1.399/2026, Anexos I, III e V',observacao:'Depende das características técnicas; caminhão com PBT igual ou superior a 3.500 kg não incide.'};
    return {situacao:'NÃO SE ENQUADRA',produto:'',aliquota:'',referencia:'',observacao:''};
  }
  window.classificadorImpostoSeletivoNcm=analisarIsNcm;
})();
