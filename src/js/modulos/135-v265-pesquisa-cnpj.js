/* V265 — Pesquisa cadastral da empresa pelo CNPJ (tela Fornecedores e clientes).
   A consulta deixou de depender de um único serviço: tenta quatro bases públicas do cadastro da Receita
   Federal, em rodízio, com limite de tempo; resultado bom fica guardado no navegador por 30 dias.
   Falha de rede ou de limite não é mais gravada como resposta: a ferramenta tenta de novo.
   O campo "Pesquisa da empresa" traz as informações encontradas (atividade, porte, abertura, capital,
   Simples/MEI, contato e sócios), sem links de fontes. */
(function(){
  if (window.V265_CARREGADO) return;
  const CHAVE='classificador.v265.cnpj',VALIDADE=30*864e5,LIMITE=12000,MAX=3000;
  const dig=v=>String(v??'').replace(/\D/g,'');
  const txt=v=>String(v??'').replace(/\s+/g,' ').trim();
  const simNao=v=>v===true||/^s/i.test(String(v??''))?true:v===false||/^n/i.test(String(v??''))?false:null;
  const fone=(ddd,n)=>{const d=dig(String(ddd??'')+String(n??''));return d.length>=10?'('+d.slice(0,2)+') '+d.slice(2,d.length-4)+'-'+d.slice(-4):''};
  const maiuscula=s=>{const t=txt(s);return t?t.charAt(0).toUpperCase()+t.slice(1).toLowerCase():''};

  function validarCnpj(v){
    const d=dig(v);if(d.length!==14||/^(\d)\1{13}$/.test(d))return false;
    const dv=n=>{let s=0,p=n-7;for(let i=0;i<n;i++){s+=Number(d[i])*p--;if(p<2)p=9}const r=s%11;return r<2?0:11-r};
    return dv(12)===Number(d[12])&&dv(13)===Number(d[13]);
  }

  /* Cada base devolve um formato; todas são convertidas para o mesmo registro. */
  const padraoReceita=j=>({razao:j.razao_social,fantasia:j.nome_fantasia,situacao:j.descricao_situacao_cadastral,data:j.data_situacao_cadastral,porte:typeof j.porte==='object'&&j.porte?j.porte.descricao:j.porte,
    cnae:j.cnae_fiscal_descricao,abertura:j.data_inicio_atividade,natureza:j.natureza_juridica,capital:j.capital_social,simples:simNao(j.opcao_pelo_simples),mei:simNao(j.opcao_pelo_mei),
    telefone:fone('',j.ddd_telefone_1),email:j.email,socios:(j.qsa||[]).map(s=>s.nome_socio),municipio:j.municipio,uf:j.uf});
  const FONTES=[
    {url:d=>'https://brasilapi.com.br/api/cnpj/v1/'+d,ler:padraoReceita},
    {url:d=>'https://minhareceita.org/'+d,ler:padraoReceita},
    {url:d=>'https://open.cnpja.com/office/'+d,ler:j=>{const c=j.company||{};return {razao:c.name,fantasia:j.alias,situacao:j.status&&j.status.text,data:j.statusDate,porte:c.size&&c.size.text,cnae:j.mainActivity&&j.mainActivity.text,
      abertura:j.founded,natureza:c.nature&&c.nature.text,capital:c.equity,simples:c.simples?simNao(c.simples.optant):null,mei:c.simei?simNao(c.simei.optant):null,
      telefone:j.phones&&j.phones[0]?fone(j.phones[0].area,j.phones[0].number):'',email:j.emails&&j.emails[0]?j.emails[0].address:'',socios:(c.members||[]).map(m=>m.person&&m.person.name),municipio:j.address&&j.address.city,uf:j.address&&j.address.state}}},
    {url:d=>'https://publica.cnpj.ws/cnpj/'+d,ler:j=>{const e=j.estabelecimento||{};return {razao:j.razao_social,fantasia:e.nome_fantasia,situacao:e.situacao_cadastral,data:e.data_situacao_cadastral,porte:j.porte&&j.porte.descricao,
      cnae:e.atividade_principal&&e.atividade_principal.descricao,abertura:e.data_inicio_atividade,natureza:j.natureza_juridica&&j.natureza_juridica.descricao,capital:j.capital_social,
      simples:j.simples?simNao(j.simples.simples):null,mei:j.simples?simNao(j.simples.mei):null,telefone:fone(e.ddd1,e.telefone1),email:e.email,socios:(j.socios||[]).map(s=>s.nome),municipio:e.cidade&&e.cidade.nome,uf:e.estado&&e.estado.sigla}}}
  ];
  function normalizar(b){
    const o={razao:txt(b.razao),fantasia:txt(b.fantasia),situacao:txt(b.situacao).toUpperCase(),data:txt(b.data),porte:maiuscula(b.porte),cnae:txt(b.cnae),abertura:txt(b.abertura),natureza:txt(b.natureza),
      capital:Number(b.capital)||0,simples:b.simples??null,mei:b.mei??null,telefone:txt(b.telefone),email:txt(b.email).toLowerCase(),socios:(b.socios||[]).map(txt).filter(Boolean).slice(0,5),municipio:txt(b.municipio),uf:txt(b.uf)};
    if(!o.razao)throw Error('resposta sem razão social');
    return o;
  }

  /* ---------- memória no navegador ---------- */
  let memoria=null;
  function ler(){if(memoria)return memoria;try{memoria=JSON.parse(localStorage.getItem(CHAVE)||'{}')||{}}catch(e){memoria={}}return memoria}
  function gravar(){try{const m=ler(),k=Object.keys(m);if(k.length>MAX)k.sort((a,b)=>m[a].t-m[b].t).slice(0,k.length-MAX).forEach(x=>delete m[x]);localStorage.setItem(CHAVE,JSON.stringify(m))}catch(e){}}
  function limparCache(){memoria={};try{localStorage.removeItem(CHAVE)}catch(e){}}

  async function buscar(url){
    const ctl=typeof AbortController==='function'?new AbortController():null,t=ctl?setTimeout(()=>ctl.abort(),LIMITE):0;
    try{const r=await fetch(url,ctl?{signal:ctl.signal,headers:{Accept:'application/json'}}:undefined);return r}finally{if(t)clearTimeout(t)}
  }
  let rodizio=0;
  /* Devolve o registro da empresa; em falha devolve {falha:true} (não gravado), para nova tentativa. */
  async function consultar(cnpj){
    const d=dig(cnpj);
    if(d.length!==14)return null;
    if(!validarCnpj(d))return {razao:'',fantasia:'',situacao:'CNPJ inválido — dígito verificador não confere',invalido:true};
    const m=ler(),g=m[d];
    if(g&&Date.now()-g.t<VALIDADE)return {...g.v,guardado:true};
    if(typeof fetch!=='function')return {razao:'',fantasia:'',situacao:'Consulta não disponível neste ambiente',falha:true};
    const inicio=rodizio++%FONTES.length;let naoLocalizado=0,limite=0;
    for(let i=0;i<FONTES.length;i++){
      const f=FONTES[(inicio+i)%FONTES.length];
      try{
        const r=await buscar(f.url(d));
        if(r.status===404||r.status===400){naoLocalizado++;continue}
        if(r.status===429){limite++;continue}
        if(!r.ok)continue;
        const v=normalizar(f.ler(await r.json()));
        m[d]={t:Date.now(),v};gravar();
        return v;
      }catch(e){}
    }
    if(naoLocalizado>=2)return {razao:'',fantasia:'',situacao:'CNPJ não localizado no cadastro da Receita Federal',naoLocalizado:true};
    return {razao:'',fantasia:'',situacao:limite?'Consulta em espera — limite de consultas atingido; a ferramenta tenta de novo':'Consulta não concluída — verifique a internet; a ferramenta tenta de novo',falha:true};
  }

  const dataBr=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||''));return m?m[3]+'/'+m[2]+'/'+m[1]:''};
  const real=v=>'R$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
  /* Linhas do campo "Pesquisa da empresa". */
  function resumo(c){
    if(!c||c.em_consulta)return c&&c.em_consulta?['pesquisando…']:[];
    if(c.falha||c.invalido||c.naoLocalizado||!c.razao)return [];
    const l=[];
    if(c.cnae)l.push('Atividade: '+c.cnae);
    if(c.porte||c.natureza)l.push([c.porte&&'Porte: '+c.porte,c.natureza&&'Natureza: '+c.natureza].filter(Boolean).join(' · '));
    if(c.abertura||c.capital)l.push([dataBr(c.abertura)&&'Abertura: '+dataBr(c.abertura),c.capital?'Capital social: '+real(c.capital):''].filter(Boolean).join(' · '));
    if(c.simples!==null||c.mei!==null)l.push('Simples Nacional: '+(c.simples===null?'não informado':c.simples?'optante':'não optante')+(c.mei?' · MEI':''));
    if(c.municipio||c.uf)l.push('Sede: '+[c.municipio,c.uf].filter(Boolean).join('/'));
    if(c.telefone||c.email)l.push([c.telefone&&'Telefone: '+c.telefone,c.email&&'E-mail: '+c.email].filter(Boolean).join(' · '));
    if(c.socios&&c.socios.length)l.push('Sócios/administradores: '+c.socios.join('; '));
    return l;
  }
  /* Regime pelo cadastro, usado só quando os documentos não informam o regime. */
  function regime(c){
    if(!c||!c.razao||c.simples===null||c.simples===undefined)return '';
    return c.mei?'Simples Nacional — MEI (cadastro da Receita)':c.simples?'Simples Nacional (cadastro da Receita)':'Não optante do Simples — Lucro Presumido ou Real (cadastro da Receita)';
  }
  window.classificadorV265={consultar,validarCnpj,normalizar,resumo,regime,limparCache,FONTES};
  window.V265_CARREGADO=true;
})();
