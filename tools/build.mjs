// Monta o arquivo único dist/CLASSIFICACAO_REFORMA_TRIBUTARIA_V{versao}.html a partir de src/ (ordem em src/manifest.json).
// Uso: node tools/build.mjs [--drive]   --drive copia também para a pasta do dia no Google Drive.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const { arquivos } = JSON.parse(readFileSync(join(raiz, 'src/manifest.json'), 'utf8'));
const { versao } = JSON.parse(readFileSync(join(raiz, 'versao.json'), 'utf8'));

const partes = arquivos.map(a => readFileSync(join(raiz, 'src', a.replace(/^src\//, ''))));
const html = Buffer.concat(partes);
const badge = html.toString('utf8').match(/class="build">VERSÃO (\d+)/);
if (!badge || Number(badge[1]) !== versao) {
  console.error(`ERRO: selo do cabeçalho (VERSÃO ${badge && badge[1]}) diferente de versao.json (${versao}). Use npm run nova-versao.`);
  process.exit(1);
}
mkdirSync(join(raiz, 'dist'), { recursive: true });
const nome = `CLASSIFICACAO_REFORMA_TRIBUTARIA_V${versao}.html`;
const destino = join(raiz, 'dist', nome);
writeFileSync(destino, html);
const sha = createHash('sha256').update(html).digest('hex');
console.log(`OK  ${destino}\n    ${html.length.toLocaleString('pt-BR')} bytes · sha256 ${sha}`);

if (process.argv.includes('--drive')) {
  const base = 'G:/Drives compartilhados/0025- REFORMA TRIBUTARIA/00 - PAINEL AUTOMATICO/MOTOR DE CALCLULO';
  const d = new Date(), p = n => String(n).padStart(2, '0');
  const pasta = join(base, `${p(d.getDate())}_${p(d.getMonth() + 1)}_${d.getFullYear()}`);
  if (!existsSync(base)) { console.error('ERRO: Google Drive não encontrado em ' + base); process.exit(1); }
  mkdirSync(pasta, { recursive: true });
  copyFileSync(destino, join(pasta, nome));
  console.log(`OK  copiado para ${join(pasta, nome)}`);
}
