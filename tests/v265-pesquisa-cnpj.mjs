/* V265 — Regressão: pesquisa cadastral pelo CNPJ com várias bases, nova tentativa e campo "Pesquisa da empresa". */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/135-v265-pesquisa-cnpj.js'),'utf8');
const m125=fs.readFileSync(path.join(root,'src/js/modulos/125-v253-painel-fornecedores-impacto.js'),'utf8');
const BB='00000000000191',PETRO='33000167000101';
const brasil={razao_social:'BANCO DO BRASIL SA',nome_fantasia:'DIRECAO GERAL',descricao_situacao_cadastral:'ATIVA',data_situacao_cadastral:'2005-11-03',porte:'DEMAIS',cnae_fiscal_descricao:'Bancos múltiplos, com carteira comercial',
 data_inicio_atividade:'1966-08-01',natureza_juridica:'Sociedade de Economia Mista',capital_social:120000000000,opcao_pelo_simples:false,opcao_pelo_mei:false,ddd_telefone_1:'6134939002',email:null,qsa:[{nome_socio:'FULANO DE TAL'}],municipio:'BRASILIA',uf:'DF'};
const cnpja={alias:'Direcao Geral',founded:'1966-08-01',statusDate:'2005-11-03',status:{text:'Ativa'},company:{name:'BANCO DO BRASIL SA',equity:120000000000,nature:{text:'Sociedade de Economia Mista'},size:{text:'Demais'},simples:{optant:false},simei:{optant:false},members:[{person:{name:'Fulano de Tal'}}]},
 address:{city:'Brasília',state:'DF'},phones:[{area:'61',number:'34939002'}],emails:[{address:'SECEX@BB.COM.BR'}],mainActivity:{text:'Bancos múltiplos, com carteira comercial'}};
const ws={razao_social:'BANCO DO BRASIL SA',capital_social:'120000000000.00',porte:{descricao:'Demais'},natureza_juridica:{descricao:'Sociedade de Economia Mista'},socios:[{nome:'Fulano de Tal'}],simples:{simples:'Sim',mei:'Não'},
 estabelecimento:{nome_fantasia:'DIRECAO GERAL',situacao_cadastral:'Ativa',data_situacao_cadastral:'2005-11-03',data_inicio_atividade:'1966-08-01',ddd1:'61',telefone1:'34939002',email:'secex@bb.com.br',atividade_principal:{descricao:'Bancos múltiplos'},cidade:{nome:'Brasília'},estado:{sigla:'DF'}}};
function abrir(responder){const dom=new JSDOM('<html><body></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;w.__ch=[];
 w.fetch=async url=>{w.__ch.push(url);const r=await responder(url);if(r instanceof Error)throw r;return {status:r.status,ok:r.status>=200&&r.status<300,json:async()=>r.corpo}};w.eval(src);return w}
const host=u=>new URL(u).host;
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V265: '+n)};
await teste('dígito verificador: CNPJ inválido não gera consulta e é informado',async()=>{const w=abrir(()=>({status:200,corpo:brasil})),A=w.classificadorV265;
 assert.equal(A.validarCnpj(BB),true);assert.equal(A.validarCnpj('00.000.000/0001-91'),true);assert.equal(A.validarCnpj('12345678000255'),false);assert.equal(A.validarCnpj('11111111111111'),false);
 const r=await A.consultar('12345678000255');assert.match(r.situacao,/CNPJ inválido/);assert.equal(w.__ch.length,0);assert.equal(await A.consultar('12345678901'),null);w.close()});
await teste('primeira base responde: situação, razão social e dados da empresa',async()=>{const w=abrir(()=>({status:200,corpo:brasil})),r=await w.classificadorV265.consultar(BB);
 assert.equal(r.situacao,'ATIVA');assert.equal(r.razao,'BANCO DO BRASIL SA');assert.equal(r.simples,false);assert.equal(r.telefone,'(61) 3493-9002');assert.equal(w.__ch.length,1);assert.equal(r.falha,undefined);w.close()});
await teste('base fora do ar ou com limite (429): a ferramenta passa para a próxima',async()=>{let n=0;const w=abrir(u=>{n++;return n===1?Error('rede'):n===2?{status:429,corpo:{}}:{status:200,corpo:/cnpja/.test(u)?cnpja:/cnpj\.ws/.test(u)?ws:brasil}});
 const r=await w.classificadorV265.consultar(BB);assert.equal(r.situacao,'ATIVA');assert.equal(r.razao,'BANCO DO BRASIL SA');assert.equal(w.__ch.length,3);assert.equal(new Set(w.__ch.map(host)).size,3);w.close()});
await teste('os três formatos de resposta são convertidos para o mesmo registro',async()=>{const w=abrir(()=>({status:200,corpo:{}})),A=w.classificadorV265;
 const a=A.normalizar(A.FONTES[0].ler(brasil)),b=A.normalizar(A.FONTES[2].ler(cnpja)),c=A.normalizar(A.FONTES[3].ler(ws));
 for(const x of [a,b,c]){assert.equal(x.razao,'BANCO DO BRASIL SA');assert.equal(x.situacao,'ATIVA');assert.equal(x.abertura,'1966-08-01');assert.equal(x.capital,120000000000);assert.equal(x.porte,'Demais');assert.equal(x.telefone,'(61) 3493-9002');assert.equal(x.uf,'DF');assert.equal(x.socios.length,1)}
 assert.equal(b.email,'secex@bb.com.br');assert.equal(a.simples,false);assert.equal(c.simples,true);assert.equal(c.mei,false);assert.throws(()=>A.normalizar({}));w.close()});
await teste('todas as bases falham: resposta marcada como falha, não é guardada e a próxima consulta tenta de novo',async()=>{let falhar=true;const w=abrir(()=>falhar?Error('rede'):{status:200,corpo:brasil}),A=w.classificadorV265;
 const r=await A.consultar(BB);assert.equal(r.falha,true);assert.match(r.situacao,/tenta de novo/);assert.doesNotMatch(r.situacao,/indisponível/);assert.equal(w.__ch.length,4);assert.equal(w.localStorage.getItem('classificador.v265.cnpj'),null);
 falhar=false;const r2=await A.consultar(BB);assert.equal(r2.situacao,'ATIVA');w.close()});
await teste('limite de consultas em todas as bases: mensagem própria e falha recuperável',async()=>{const w=abrir(()=>({status:429,corpo:{}})),r=await w.classificadorV265.consultar(BB);assert.equal(r.falha,true);assert.match(r.situacao,/limite de consultas/);w.close()});
await teste('CNPJ que não existe no cadastro: informado como não localizado, sem repetir',async()=>{const w=abrir(()=>({status:404,corpo:{}})),r=await w.classificadorV265.consultar(PETRO);assert.equal(r.naoLocalizado,true);assert.equal(r.falha,undefined);assert.match(r.situacao,/não localizado/);w.close()});
await teste('resultado bom fica guardado no navegador: segunda consulta não usa a internet; limpar força nova consulta',async()=>{const w=abrir(()=>({status:200,corpo:brasil})),A=w.classificadorV265;await A.consultar(BB);const n=w.__ch.length;
 const r=await A.consultar(BB);assert.equal(w.__ch.length,n);assert.equal(r.guardado,true);assert.equal(r.situacao,'ATIVA');A.limparCache();await A.consultar(BB);assert.equal(w.__ch.length,n+1);w.close()});
await teste('rodízio: consultas seguidas começam por bases diferentes',async()=>{const w=abrir(()=>({status:200,corpo:brasil})),A=w.classificadorV265;await A.consultar(BB);await A.consultar(PETRO);assert.notEqual(host(w.__ch[0]),host(w.__ch[1]));w.close()});
await teste('campo Pesquisa da empresa: traz as informações, sem endereço de site de busca',async()=>{const w=abrir(()=>({status:200,corpo:cnpja})),A=w.classificadorV265;const l=A.resumo(A.normalizar(A.FONTES[2].ler(cnpja)));const t=l.join(' | ');
 assert.match(t,/Atividade: Bancos múltiplos/);assert.match(t,/Porte: Demais/);assert.match(t,/Abertura: 01\/08\/1966/);assert.match(t,/Capital social: R\$ 120\.000\.000\.000,00/);assert.match(t,/Simples Nacional: não optante/);assert.match(t,/Sede: Brasília\/DF/);
 assert.match(t,/Telefone: \(61\) 3493-9002 · E-mail: secex@bb\.com\.br/);assert.match(t,/Sócios\/administradores: Fulano de Tal/);assert.doesNotMatch(t,/https?:|google|brasilapi|cnpja/i);
 assert.deepEqual([...A.resumo({em_consulta:true})],['pesquisando…']);assert.equal(A.resumo({falha:true,situacao:'x'}).length,0);assert.equal(A.resumo(null).length,0);w.close()});
await teste('regime pelo cadastro só quando há a informação',async()=>{const w=abrir(()=>({status:200,corpo:{}})),A=w.classificadorV265;assert.match(A.regime({razao:'X',simples:true,mei:false}),/^Simples Nacional \(cadastro/);assert.match(A.regime({razao:'X',simples:true,mei:true}),/MEI/);
 assert.match(A.regime({razao:'X',simples:false}),/Não optante/);assert.equal(A.regime({razao:'X',simples:null}),'');assert.equal(A.regime({falha:true}),'');w.close()});
await teste('tela Fornecedores: sem links de fontes, sem a mensagem antiga, com nova tentativa e regime dos documentos em primeiro lugar',()=>{
 assert.doesNotMatch(m125,/google\.com\/search|v253-chip" href|Consulta indisponível \(sem internet|BrasilAPI\)/);assert.match(m125,/<th>Pesquisa da empresa<\/th>/);assert.match(m125,/class="v265-pesq"/);
 assert.match(m125,/c\.falha && \(c\.tentativas \|\| 0\) < 3/);assert.match(m125,/\[\.\.\.x\.regimes\]\.join\(' \| '\) \|\| \(window\.classificadorV265 && window\.classificadorV265\.regime\(c\)\)/)});
await teste('build: título da versão e módulo presente',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('V265_CARREGADO'))});
console.log(`${ok} testes focados V265 OK`);process.exit(0);
