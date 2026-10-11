// Abre uma nova versão: atualiza o selo "VERSÃO N" do cabeçalho, versao.json, package.json e o CHANGELOG.
// Uso: npm run nova-versao -- 60 "Descrição curta da mudança"
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const [n, ...desc] = process.argv.slice(2);
const versao = Number(n), descricao = desc.join(' ').trim();
const atual = JSON.parse(readFileSync(join(raiz, 'versao.json'), 'utf8'));
if (!Number.isInteger(versao) || versao <= atual.versao || !descricao) {
  console.error(`Uso: npm run nova-versao -- ${atual.versao + 1} "Descrição da mudança"   (versão atual: ${atual.versao})`);
  process.exit(1);
}
const data = new Date().toISOString().slice(0, 10);
const corpo = join(raiz, 'src/10-corpo.html');
const html = readFileSync(corpo, 'utf8');
const novo = html.replace(/class="build">VERSÃO \d+/, `class="build">VERSÃO ${versao}`);
if (novo === html) { console.error('Selo de versão não encontrado em src/10-corpo.html'); process.exit(1); }
writeFileSync(corpo, novo);
writeFileSync(join(raiz, 'versao.json'), JSON.stringify({ versao, data, descricao }, null, 2) + '\n');
const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
pkg.version = `${versao}.0.0`;
writeFileSync(join(raiz, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
const cl = join(raiz, 'CHANGELOG.md');
const txt = readFileSync(cl, 'utf8');
const marca = '<!-- novas versões abaixo desta linha -->\n';
writeFileSync(cl, txt.replace(marca, `${marca}\n## V${versao} — ${data}\n\n- ${descricao}\n`));
console.log(`Versão ${versao} aberta. Edite os fontes em src/, rode npm test e depois npm run drive.`);
