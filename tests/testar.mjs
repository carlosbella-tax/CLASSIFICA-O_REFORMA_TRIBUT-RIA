// Bateria de testes do Diagnóstico Operações Fiscais.
// 1) sintaxe de cada bloco <script>  2) selo de versão  3) identidade com a V59 original (só na V59)
// 4) teste funcional: carrega os XMLs de tests/fixtures no navegador simulado (jsdom), processa
//    e compara o conteúdo de cada aba com a referência gravada em tests/referencia.json.
// Uso: npm test                 (roda tudo)
//      node tests/testar.mjs --atualizar   (grava a nova referência depois de conferir as diferenças)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { abrirDiagnostico } from '../tools/navegador.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const atualizar = process.argv.includes('--atualizar');
const { versao } = JSON.parse(readFileSync(join(raiz, 'versao.json'), 'utf8'));
const { arquivos } = JSON.parse(readFileSync(join(raiz, 'src/manifest.json'), 'utf8'));
const dist = join(raiz, 'dist', `DIAGNOSTICO_V${versao}.html`);
let falhas = 0, ok = 0;
const passou = m => { ok++; console.log('  OK    ' + m); };
const falhou = m => { falhas++; console.log('  FALHA ' + m); };
const sha = b => createHash('sha256').update(b).digest('hex');

// 1) sintaxe — cada grupo de arquivos .js entre separadores HTML é um <script>
console.log('\n[1] Sintaxe dos scripts');
let grupo = [];
const grupos = [];
for (const a of arquivos) {
  if (a.endsWith('.js')) grupo.push(a);
  else if (grupo.length) { grupos.push(grupo); grupo = []; }
}
if (grupo.length) grupos.push(grupo);
for (const g of grupos) {
  const codigo = g.map(a => readFileSync(join(raiz, a), 'utf8')).join('');
  try { new vm.Script(codigo, { filename: g[g.length - 1] }); passou(`${g.length} arquivo(s): ${g[0]}${g.length > 1 ? ' … ' + g[g.length - 1] : ''}`); }
  catch (e) {
    // localiza o arquivo do erro compilando um a um no contexto acumulado
    falhou(`erro de sintaxe no bloco iniciado em ${g[0]}: ${e.message}`);
  }
}

// 2) versão
console.log('\n[2] Versão');
const html = readFileSync(dist);
const selo = html.toString('utf8').match(/class="build">VERSÃO (\d+)/);
selo && Number(selo[1]) === versao ? passou(`selo VERSÃO ${versao} = versao.json`) : falhou('selo de versão diferente de versao.json');

// 3) identidade com o arquivo original (vale só enquanto a versão for 59)
console.log('\n[3] Identidade com a V59 original');
const shaOriginal = readFileSync(join(raiz, '_arquivo_original/SHA256SUMS.txt'), 'utf8').split(/\s+/)[0];
if (versao === 59) sha(html) === shaOriginal ? passou('build idêntico byte a byte ao DIAGNOSTICO_V59.html recebido') : falhou('build diferente do original V59');
else console.log(`  --    não se aplica (versão ${versao}); a regressão funcional abaixo é a referência`);

// 4) funcional
console.log('\n[4] Teste funcional (jsdom) com os XMLs de tests/fixtures');
const erros = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) erros.push(e.message); });
const dom = new JSDOM(html.toString('utf8'), {
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'file:///diagnostico.html',
  beforeParse(win) {
    // recursos que o navegador tem e o jsdom não
    win.TextEncoder = TextEncoder; win.TextDecoder = TextDecoder;
    if (!win.Blob.prototype.arrayBuffer) win.Blob.prototype.arrayBuffer = function () {
      return new Promise((ok, erro) => { const r = new win.FileReader(); r.onload = () => ok(r.result); r.onerror = () => erro(r.error); r.readAsArrayBuffer(this); });
    };
    win.matchMedia = win.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  }
});
const w = dom.window;
w.URL.createObjectURL = () => 'blob:teste'; w.URL.revokeObjectURL = () => {};
w.HTMLElement.prototype.scrollIntoView = function () {};
const pasta = join(raiz, 'tests/fixtures');
const nomes = readdirSync(pasta).filter(n => /\.(xml|txt)$/i.test(n)).sort();
const files = nomes.map(n => new w.File([readFileSync(join(pasta, n))], n, { type: 'text/xml', lastModified: 0 }));
const esperar = ms => new Promise(r => setTimeout(r, ms));
await esperar(50);
w.setFiles(files);
w.document.getElementById('pIniciar').click();
for (let i = 0; i < 600 && !/^(Concluído|Cancelado)/.test(w.document.getElementById('pStatus').textContent); i++) await esperar(50);
await esperar(100);
const status = w.document.getElementById('pStatus').textContent;
/^Concluído/.test(status) ? passou(status) : falhou('processamento não concluiu: ' + status);

const abas = [...w.document.querySelectorAll('.tab[data-tab]')].map(b => b.dataset.tab).filter(t => !['load', 'processar'].includes(t));
const atual = { versao, arquivos: nomes, contagens: w.eval('({docs: state.docs.length, itens: state.items.length, eventos: state.events.length, erros: state.errors.length})'), abas: {} };
const conta = (t, re) => (t.match(re) || []).length;
for (const aba of abas) {
  const b = w.document.querySelector(`.tab[data-tab="${aba}"]`);
  b.click(); await esperar(30);
  const el = w.document.getElementById(aba);
  const texto = (el ? el.textContent : '').replace(/\s+/g, ' ').replace(/\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}(:\d{2})?/g, '<data>').trim();
  atual.abas[aba] = {
    sha: sha(texto).slice(0, 16), caracteres: texto.length, linhas_tabela: el ? el.querySelectorAll('tbody tr').length : 0,
    validado: conta(texto, /(?<!NÃO )VALIDADO/g), nao_validado: conta(texto, /NÃO VALIDADO/g), incorreto: conta(texto, /INCORRETO/g)
  };
}
erros.length ? falhou('erros de JavaScript na página: ' + [...new Set(erros)].slice(0, 5).join(' | ')) : passou('nenhum erro de JavaScript na página');

const refArq = join(raiz, 'tests/referencia.json');
if (atualizar || !existsSync(refArq)) {
  writeFileSync(refArq, JSON.stringify(atual, null, 2) + '\n');
  console.log(`  --    referência gravada em tests/referencia.json (V${versao})`);
} else {
  const ref = JSON.parse(readFileSync(refArq, 'utf8'));
  const c1 = JSON.stringify(ref.contagens), c2 = JSON.stringify(atual.contagens);
  c1 === c2 ? passou('contagens ' + c2) : falhou(`contagens mudaram: V${ref.versao} ${c1} → agora ${c2}`);
  for (const aba of Object.keys({ ...ref.abas, ...atual.abas })) {
    const a = ref.abas[aba], b = atual.abas[aba];
    if (a && b && a.sha === b.sha) { passou(`aba ${aba} igual à referência V${ref.versao}`); continue; }
    const det = ['linhas_tabela', 'validado', 'nao_validado', 'incorreto', 'caracteres'].filter(k => !a || !b || a[k] !== b[k]).map(k => `${k} ${a ? a[k] : '-'}→${b ? b[k] : '-'}`).join(', ');
    falhou(`aba ${aba} mudou em relação à V${ref.versao}${det ? ': ' + det : ' (texto alterado)'}`);
  }
  if (falhas) console.log('\n  Se as mudanças forem as esperadas para esta versão, grave a nova referência: node tests/testar.mjs --atualizar');
}
w.close();

// 5) casos de regra — cada tests/casos/*.json descreve um XML e o resultado esperado por item
console.log('\n[5] Casos de regra (tests/casos)');
const pastaCasos = join(raiz, 'tests/casos');
for (const nome of (existsSync(pastaCasos) ? readdirSync(pastaCasos) : []).filter(n => n.endsWith('.json')).sort()) {
  const caso = JSON.parse(readFileSync(join(pastaCasos, nome), 'utf8'));
  const arqs = (caso.arquivos || [caso.arquivo]).map(a => join(pastaCasos, a));
  const { w: wc, erros: ec, abrirAba: abaC } = await abrirDiagnostico(arqs, { campos: caso.campos || {} });
  const linhas = caso.funcao ? wc.eval(caso.funcao + '()') : [];
  // conferências de texto no Dashboard: [{seletor, sub?, contem: [...], nao_contem: [...]}]
  for (const c of caso.dashboard || []) {
    await abaC('dashboard');
    if (c.sub) { const b = wc.document.querySelector('[data-dsub="' + c.sub + '"]'); if (b) { b.click(); await new Promise(r => setTimeout(r, 50)); } }
    const el = wc.document.querySelector(c.seletor), tx = el ? el.textContent.replace(/\s+/g, ' ') : '';
    const faltam = (c.contem || []).filter(s => !tx.includes(s)), sobram = (c.nao_contem || []).filter(s => tx.includes(s));
    if (!el) falhou(`${nome}: ${c.seletor} não encontrado no Dashboard`);
    else if (faltam.length || sobram.length) falhou(`${nome}: ${c.seletor}${faltam.length ? ' — faltou: ' + faltam.join(' | ') : ''}${sobram.length ? ' — não deveria ter: ' + sobram.join(' | ') : ''}`);
    else passou(`${nome}: Dashboard ${c.seletor}${c.sub ? ' (' + c.sub + ')' : ''} (${(c.contem || []).length + (c.nao_contem || []).length} conferências)`);
  }
  // conferências de texto nos slides da apresentação: [{slide (título do topo), contem: [...], nao_contem: [...]}]
  if ((caso.apresentacao || []).length) {
    const orig = wc.montarApresentacaoPptx; let pres = null;
    wc.montarApresentacaoPptx = (...a) => (pres = orig(...a));
    await abaC('apresentacao');
    wc.montarApresentacaoPptx = orig;
    const tx = o => o.arrTabRows ? o.arrTabRows.map(r => r.map(c => c.text).join(' | ')).join(' // ') : Array.isArray(o.text) ? o.text.map(t => t.text).join('') : (o.text || '');
    const slides = pres ? pres._slides.map(s => s._slideObjects.map(tx).filter(Boolean)) : [];
    for (const c of caso.apresentacao) {
      const s = slides.find(x => x[0] === c.slide), t = s ? s.join(' ¦ ') : '';
      const faltam = (c.contem || []).filter(v => !t.includes(v)), sobram = (c.nao_contem || []).filter(v => t.includes(v));
      if (!s) falhou(`${nome}: slide "${c.slide}" não encontrado na apresentação`);
      else if (faltam.length || sobram.length) falhou(`${nome}: slide ${c.slide}${faltam.length ? ' — faltou: ' + faltam.join(' | ') : ''}${sobram.length ? ' — não deveria ter: ' + sobram.join(' | ') : ''}`);
      else passou(`${nome}: slide ${c.slide} (${(c.contem || []).length + (c.nao_contem || []).length} conferências)`);
    }
  }
  for (const [depois, cols] of Object.entries(caso.colunas_apos || {})) {
    const ks = Object.keys(linhas[0] || {}), i = ks.indexOf(depois), achou = ks.slice(i + 1, i + 1 + cols.length);
    JSON.stringify(achou) === JSON.stringify(cols) ? passou(`${nome}: colunas após ${depois}: ${cols.join(', ')}`) : falhou(`${nome}: colunas após ${depois} = ${achou.join(', ')}`);
  }
  // linhas que NÃO devem aparecer na função (ex.: notas canceladas fora das abas de impostos)
  for (const v of caso.ausentes || []) {
    const chave = caso.chave || 'numero_item', achou = linhas.some(x => String(x[chave]) === v);
    achou ? falhou(`${nome}: ${chave} ${v} não deveria aparecer em ${caso.funcao}`) : passou(`${nome}: ${chave} ${v} ausente de ${caso.funcao}`);
  }
  for (const l of caso.linhas || []) {
    const chave = caso.chave || 'numero_item', row = linhas.find(x => String(x[chave]) === l.numero_item);
    if (!row) { falhou(`${nome}: item ${l.numero_item} não encontrado`); continue; }
    const dif = Object.entries(l.esperado).filter(([k, e]) => {
      const v = row[k];
      if (typeof e === 'string' && e.startsWith('^')) return !new RegExp(e).test(String(v));
      if (typeof e === 'number') return Math.abs(Number(v) - e) > 0.005;
      return String(v) !== String(e);
    }).map(([k, e]) => `${k}: esperado ${e}, veio ${row[k]}`);
    dif.length ? falhou(`${nome}: item ${l.numero_item} — ${dif.join(' | ')}`) : passou(`${nome}: item ${l.numero_item} (${Object.keys(l.esperado).length} campos conferidos)`);
  }
  if (ec.length) falhou(`${nome}: erros de JavaScript: ${[...new Set(ec)].slice(0, 3).join(' | ')}`);
  wc.close();
}
console.log(`\n${ok} OK, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
