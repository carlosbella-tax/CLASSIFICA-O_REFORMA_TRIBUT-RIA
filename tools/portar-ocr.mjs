// V108 — embute o OCR (tesseract.js 7.0.0 + núcleo simd-lstm + português best_int) no HTML, para funcionar sem internet.
// Gera src/vendor/tesseract-7.0.0.min.js e src/vendor/ocr-dados-v108.js (window.__OCR_V108 = {worker, core, por}).
import { readFileSync, writeFileSync } from 'node:fs';
const nm = p => new URL('../node_modules/' + p, import.meta.url);
const semFechaScript = s => s.replace(/<\/(script)/gi, '<\/$1');
const lib = readFileSync(nm('tesseract.js/dist/tesseract.min.js'), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '');
writeFileSync(new URL('../src/vendor/tesseract-7.0.0.min.js', import.meta.url), semFechaScript(lib) + '\n');
const worker = readFileSync(nm('tesseract.js/dist/worker.min.js'), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '');
const core = readFileSync(nm('tesseract.js-core/tesseract-core-simd-lstm.wasm.js'), 'utf8');
const por = readFileSync(nm('@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz')).toString('base64');
const js = '/* V108 — dados do OCR (tesseract.js 7.0.0, tesseract.js-core 7 simd-lstm, por 4.0.0_best_int) — gerado por tools/portar-ocr.mjs; não editar */\n'
  + 'window.__OCR_V108 = {worker: ' + semFechaScript(JSON.stringify(worker)) + ',\ncore: ' + semFechaScript(JSON.stringify(core)) + ',\npor: "' + por + '"};\n';
writeFileSync(new URL('../src/vendor/ocr-dados-v108.js', import.meta.url), js);
console.log('ok', lib.length, worker.length, core.length, por.length);
