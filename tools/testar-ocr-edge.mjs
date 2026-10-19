// Teste real no Edge (puppeteer-core): node tools/testar-ocr-edge.mjs <pasta com PDFs/XMLs> <versão> [sandbox|semworker|travado]
import puppeteer from 'puppeteer-core';
import { readdirSync, writeFileSync } from 'node:fs';
const [D, V, modo] = process.argv.slice(2);
const arqs = readdirSync(D).filter(f => /\.(pdf|xml)$/i.test(f)).map(f => D + '/' + f);
const url = 'file:///C:/Users/Carlos%20Bella/.g4os/workspaces/meu-workspace/main/projects/diagnostico-operacoes-fiscais/dist/DIAGNOSTICO_V' + V + '.html';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--allow-file-access-from-files'], protocolTimeout: 2400000 });
const page = await browser.newPage();
if (modo === 'travado') await page.evaluateOnNewDocument(() => { window.Worker = function(){ throw new Error('Worker bloqueado (simulação)'); }; const P = () => new Promise(() => {}); WebAssembly.instantiate = P; WebAssembly.instantiateStreaming = P; WebAssembly.compile = P; });
if (modo === 'semworker') await page.evaluateOnNewDocument(() => { window.Worker = function(){ throw new Error('Worker bloqueado (simulação)'); }; });
const erros = []; page.on('pageerror', e => erros.push(String(e))); page.on('console', m => { if (m.type() === 'error') erros.push(m.text().slice(0, 200)); else if (/ocr|worker/i.test(m.text())) console.log('console:', m.type(), m.text().slice(0, 300)); });
let alvo = page;
if (modo === 'sandbox'){
  const casca = 'C:/Users/Carlos Bella/.g4os/workspaces/meu-workspace/sessions/260930-nimble-grove/scratch/casca-sandbox.html';
  writeFileSync(casca, '<!doctype html><iframe id="f" sandbox="allow-scripts allow-downloads allow-forms allow-modals allow-popups" src="' + url + '" style="width:1400px;height:900px"></iframe>');
  await page.goto('file:///' + casca, { waitUntil: 'load', timeout: 180000 });
  await new Promise(r => setTimeout(r, 3000)); alvo = page.frames().find(f => f !== page.mainFrame());
} else await page.goto(url, { waitUntil: 'load', timeout: 180000 });
const t0 = Date.now();
const inp = await alvo.$('#files'); await inp.uploadFile(...arqs);
await alvo.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /processar/i.test(x.textContent)); if (b) b.click(); });
for (let i = 0; i < (modo === 'travado' ? 40 : 240); i++){ await new Promise(r => setTimeout(r, 10000)); const s = await alvo.evaluate(() => ((document.getElementById('status') || {}).textContent || '').slice(0, 170)); if (i % 2 === 0 || /Concluído/.test(s)) console.log(Math.round((Date.now() - t0) / 1000) + 's', s); if (/Concluído/.test(s)) break; }
const tipo = await alvo.evaluate(() => typeof motorTipoV109 !== 'undefined' ? motorTipoV109 : '?'); console.log('motor', tipo);
console.log('abas', await alvo.evaluate(() => [...document.querySelectorAll('.tab[data-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).join(' | ')));
console.log('aviso', await alvo.evaluate(() => (document.getElementById('avisoOcrV110') || {}).textContent || '(sem aviso)'));
const r = await alvo.evaluate(() => ({ erros: state.errors.map(e => e.erro), iss: linhasIss().length, leitura: linhasIss().map(x => x.leitura_pdf) }));
const cont = {}; for (const e of r.erros) { const k = e.replace(/\(chave.*\)/, '').slice(0, 110); cont[k] = (cont[k] || 0) + 1; }
console.log('ISS', r.iss, JSON.stringify(r.leitura.reduce((a, x) => (a[x] = (a[x] || 0) + 1, a), {}))); console.log('erros', JSON.stringify(cont, null, 1)); console.log('JS', erros.slice(0, 4));
await browser.close();
