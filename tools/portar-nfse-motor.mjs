// Porta o leitor de NFS-e (XML e PDF) do Motor de Cálculo para o Diagnóstico.
// Gera src/vendor/motor-nfse.js: os módulos do núcleo do Motor viram uma função isolada (window.NFSE_MOTOR),
// sem import/export e sem conflito de nomes com o Diagnóstico. Rodar de novo quando o Motor mudar a extração.
// Uso: node tools/portar-nfse-motor.mjs [caminho do repositório do Motor]
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const motor = process.argv[2] || join(raiz, '..', 'motor-calculo-reforma-tributaria');
const nuc = join(motor, 'supabase/functions/_shared/nucleo');
const ler = p => readFileSync(join(nuc, p), 'utf8').replace(/\r\n/g, '\n');
const limpar = t => t.replace(/^import [^;]+;\s*$/gm, '').replace(/^export \{[^}]*\};?\s*$/gm, '');
let commit = '?'; try { commit = execSync('git -C "' + motor + '" log -1 --format="%h %s"').toString().trim(); } catch (e) {}

const danfe = ler('extracao/danfe-pdf.js');
const ini = danfe.indexOf('function firstMatch'); if (ini < 0) throw Error('firstMatch não encontrado em danfe-pdf.js');
let fim = danfe.indexOf('\n}\n', ini); const firstMatch = danfe.slice(ini, fim + 2);

const partes = [
  ['util/numero.js', limpar(ler('util/numero.js'))],
  ['util/xml.js', limpar(ler('util/xml.js'))],
  ['extracao/danfe-pdf.js (só firstMatch)', firstMatch],
  ['extracao/nfse.js', limpar(ler('extracao/nfse.js'))],
  ['extracao/danfse-v2-posicao.js', limpar(ler('extracao/danfse-v2-posicao.js'))],
  ['extracao/deteccao.js', limpar(ler('extracao/deteccao.js'))]
];
const corpo = partes.map(([n, t]) => '/* ===== Motor · ' + n + ' ===== */\n' + t).join('\n');
const saida = '/* Leitor de NFS-e (XML e PDF) portado do Motor de Cálculo Reforma Tributária — TaxAdvice.\n'
  + '   Gerado por tools/portar-nfse-motor.mjs a partir do commit do Motor: ' + commit + '\n'
  + '   NÃO EDITAR À MÃO — altere no Motor e rode o script de novo. Uso interno TaxAdvice. */\n'
  + 'window.NFSE_MOTOR = (function(){\n"use strict";\n' + corpo + '\n'
  + 'return { extractServicoXML, extractServicoPDF, completarCamposNacionais, lerDANFSeV2PorPosicao, aplicarDANFSeV2, detectarTipoPorTexto, brNumToFloat };\n})();\n';
writeFileSync(join(raiz, 'src/vendor/motor-nfse.js'), saida);
console.log('OK  src/vendor/motor-nfse.js (' + saida.length + ' caracteres) — Motor ' + commit);
