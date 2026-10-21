// Abre o dist/CLASSIFICACAO_REFORMA_TRIBUTARIA_V{versao}.html no navegador simulado (jsdom), carrega XMLs e processa.
// Uso em scripts: const { w, abrirAba } = await abrirDiagnostico(['caminho/a.xml', ...]);
import { readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const esperar = ms => new Promise(r => setTimeout(r, ms));

export async function abrirDiagnostico(caminhos, { campos = {}, versao: v, ocr = {} } = {}) {   // ocr: {nome do PDF: caminho do texto reconhecido} (V108 — jsdom não tem canvas/worker)
  const versao = v || JSON.parse(readFileSync(join(raiz, 'versao.json'), 'utf8')).versao;
  const html = readFileSync(join(raiz, 'dist', `CLASSIFICACAO_REFORMA_TRIBUTARIA_V${versao}.html`), 'utf8');
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) erros.push(e.message); });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'file:///diagnostico.html',
    beforeParse(win) {
      win.TextEncoder = TextEncoder; win.TextDecoder = TextDecoder; win.structuredClone = structuredClone; win.ReadableStream = ReadableStream; win.WritableStream = WritableStream;   // navegadores atuais têm; o jsdom não (pdf.js usa)
      if (!win.Blob.prototype.arrayBuffer) win.Blob.prototype.arrayBuffer = function () {
        return new Promise((ok, erro) => { const r = new win.FileReader(); r.onload = () => ok(r.result); r.onerror = () => erro(r.error); r.readAsArrayBuffer(this); });
      };
      win.matchMedia = win.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
    }
  });
  const w = dom.window;
  w.URL.createObjectURL = () => 'blob:teste'; w.URL.revokeObjectURL = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  await esperar(50);
  for (const [id, v] of Object.entries(campos)) { const el = w.document.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new w.Event('input')); el.dispatchEvent(new w.Event('change')); } }
  if (Object.keys(ocr).length) w.__ocrTesteV108 = async nome => (ocr[nome] ? readFileSync(ocr[nome], 'utf8').replace(/\r/g, '').split('\n') : []);
  const files = caminhos.map(c => new w.File([readFileSync(c)], basename(c), { type: 'text/xml', lastModified: 0 }));
  w.setFiles(files);
  w.document.getElementById('pIniciar').click();
  for (let i = 0; i < 600 && !/^(Concluído|Cancelado)/.test(w.document.getElementById('pStatus').textContent); i++) await esperar(50);
  await esperar(100);
  const abrirAba = async aba => { w.document.querySelector(`.tab[data-tab="${aba}"]`).click(); await esperar(30); return w.document.getElementById(aba); };
  return { w, erros, abrirAba, status: w.document.getElementById('pStatus').textContent };
}
