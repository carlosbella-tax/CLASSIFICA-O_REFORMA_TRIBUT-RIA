/* V271 — Botão "Imprimir apuração em PDF" na Apuração assistida da CBS. Monta uma folha própria com:
   identificação da empresa (nome, CNPJ, regime), indicadores da carga, descrição da tela e o quadro
   Apuração da CBS (período, débitos, créditos, valor apurado, comparação com a Receita e observações).
   A folha é cópia do que está na tela no momento do clique; não recalcula nem altera dados. */
(function(){
  if (window.V271_CARREGADO) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const $=id=>document.getElementById(id);
  const P='html body[data-v271-folha]';
  const st=document.createElement('style');st.id='v271-style';st.textContent=`
#v271-folha{display:none}
#v271-imprimir{margin-left:auto}
@media print{
${P}>*:not(#v271-folha):not(#_#_#_):not(#_#_#_){display:none!important}
${P}>#v271-folha:not(#_#_#_):not(#_#_#_){display:block!important;margin:0!important;padding:0!important;background:#fff!important;color:#161616;font:13px system-ui,Segoe UI,Arial,sans-serif}
${P}{background:#fff!important;margin:0!important;padding:0!important;height:auto!important;overflow:visible!important}
#v271-folha *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
#v271-folha .v271-cab{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #F26B21;padding-bottom:6px;margin-bottom:10px}
#v271-folha .v271-cab h1{margin:0;font:700 19px system-ui;color:#0F2A4A}
#v271-folha .v271-marca{font:800 20px system-ui;color:#0F2A4A}#v271-folha .v271-marca i{font-style:normal;color:#F26B21}
#v271-folha .v271-emp{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-bottom:10px}
#v271-folha .v271-emp div,#v271-folha .v271-kpis div{border:1px solid #C6C6C6;padding:6px 9px;break-inside:avoid}
#v271-folha label{display:block;font:600 10px system-ui;color:#525252;text-transform:uppercase;letter-spacing:.04em}
#v271-folha .v271-emp b{font:600 13px system-ui}
#v271-folha .v271-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:10px}
#v271-folha .v271-kpis div{border-top:3px solid #0F62FE}
#v271-folha .v271-kpis b{display:block;font:600 16px system-ui;font-variant-numeric:tabular-nums}
#v271-folha .v271-kpis small{font-size:10px;color:#525252}
#v271-folha .v271-desc{font-size:11.5px;color:#393939;margin:0 0 10px}
#v271-folha h2{margin:0 0 2px!important;font:700 15px system-ui!important;color:#0F2A4A!important}
#v271-folha .v271-periodo{font-size:12px;margin:0 0 8px}
#v271-folha .v264-grade{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important}
#v271-folha .v264-q{break-inside:avoid}
#v271-folha table{width:100%;border-collapse:collapse;margin-top:8px}#v271-folha th,#v271-folha td{border:1px solid #C6C6C6;padding:4px 7px;font-size:11.5px;text-align:right}#v271-folha th{background:#E0E0E0}#v271-folha td:first-child,#v271-folha th:first-child{text-align:left}
#v271-folha .table-wrap{overflow:visible!important;height:auto!important;max-height:none!important}
#v271-folha .v271-rod{margin-top:12px;padding-top:5px;border-top:1px solid #C6C6C6;font-size:10px;color:#525252;display:flex;justify-content:space-between}
}`;
  document.head.appendChild(st);

  function dados(){
    const sec=$('apuracaocbs'),card=$('v264-apuracao'),sel=$('v264Periodo'),reg=$('regimeEmpresa');
    const hint=sec&&sec.querySelector(':scope > .card .hint');
    return {
      empresa:($('empresa')&&$('empresa').value||'').trim(),cnpj:($('cnpjEmpresa')&&$('cnpjEmpresa').value||'').trim(),
      regime:reg&&reg.selectedIndex>0?reg.options[reg.selectedIndex].text.trim():'',
      kpis:[...document.querySelectorAll('#v260-kpis .v260-kpi')].map(k=>({rotulo:(k.querySelector('label')||{}).textContent||'',valor:(k.querySelector('b')||{}).textContent||'',nota:(k.querySelector('small')||{}).textContent||''})),
      descricao:hint?hint.textContent.trim():'',
      periodo:sel&&sel.selectedIndex>=0?sel.options[sel.selectedIndex].text.trim():'Todos os períodos',
      corpo:card&&$('v264Corpo')?$('v264Corpo').innerHTML:'',receita:card&&$('v264-receita')?$('v264-receita').innerHTML:'',notas:card&&$('v264-notas')?$('v264-notas').innerHTML:''
    };
  }
  function montar(d,agora){
    const tira=h=>String(h||'').replace(/\sid="[^"]*"/g,'');   /* a cópia não repete os id da tela */
    return '<div class="v271-cab"><h1>Apuração assistida da CBS</h1><span class="v271-marca">Tax<i>Advice</i></span></div>'
      +'<div class="v271-emp"><div><label>Nome da empresa</label><b>'+esc(d.empresa||'Não informado')+'</b></div><div><label>CNPJ da empresa</label><b>'+esc(d.cnpj||'Não informado')+'</b></div><div><label>Regime tributário</label><b>'+esc(d.regime||'Não informado')+'</b></div></div>'
      +(d.kpis.length?'<div class="v271-kpis">'+d.kpis.map(k=>'<div><label>'+esc(k.rotulo)+'</label><b>'+esc(k.valor)+'</b><small>'+esc(k.nota)+'</small></div>').join('')+'</div>':'')
      +(d.descricao?'<p class="v271-desc">'+esc(d.descricao)+'</p>':'')
      +'<h2>Apuração da CBS</h2><p class="v271-periodo">Período de apuração: <b>'+esc(d.periodo)+'</b></p>'
      +tira(d.corpo)+tira(d.receita)+'<div class="v271-notas">'+tira(d.notas)+'</div>'
      +'<div class="v271-rod"><span>Emitido em '+esc(agora)+'</span><span>Desenvolvedor — Carlos Bella · +55 11 99479-7347</span></div>';
  }
  function limpar(){delete document.body.dataset.v271Folha;const f=$('v271-folha');if(f)f.innerHTML=''}
  function imprimir(){
    let f=$('v271-folha');if(!f){f=document.createElement('div');f.id='v271-folha';document.body.appendChild(f)}
    const d=dados();if(!d.corpo)return false;
    f.innerHTML=montar(d,new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}));
    document.body.dataset.v271Folha='1';
    const titulo=document.title;document.title='Apuracao_CBS_'+(d.cnpj.replace(/\D/g,'')||'empresa')+'_'+d.periodo.replace(/\D+/g,'-').replace(/^-|-$/g,'');
    const depois=()=>{document.title=titulo;limpar();window.removeEventListener('afterprint',depois)};
    window.addEventListener('afterprint',depois);
    try{window.print()}catch(e){depois()}
    return true;
  }
  function botao(){
    const topo=document.querySelector('#v264-apuracao .v264-topo');if(!topo||$('v271-imprimir'))return;
    const b=document.createElement('button');b.type='button';b.id='v271-imprimir';b.className='secondary';b.textContent='🖨 Imprimir apuração em PDF';
    b.title='Abre a impressão do navegador; escolha "Salvar como PDF" no destino.';
    b.addEventListener('click',imprimir);topo.appendChild(b);
  }
  botao();setInterval(botao,1500);
  window.classificadorV271={dados,montar,imprimir,limpar};
  window.V271_CARREGADO=true;
})();
