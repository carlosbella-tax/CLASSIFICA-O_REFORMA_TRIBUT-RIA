import { abrirDiagnostico } from './navegador.mjs';
import { readdirSync } from 'node:fs';
const fx = readdirSync('tests/fixtures').filter(f=>/\.xml$/i.test(f)).map(f=>'tests/fixtures/'+f);
const { w } = await abrirDiagnostico(fx);
const I = w.linhasIcms(); console.log('ICMS cols:', Object.keys(I[0]).join(','));
const c = I.filter(r => r.valor_ipi > 0); console.log('icms com ipi', c.length, 'de', I.length);
for (const r of c.slice(0,8)) console.log(r.cfop, r.cst_icms, r.valor_total_produtos, r.valor_ipi, r.valor_frete, r.base_icms_xml, String(r.validacao_base_icms).slice(0,120));
for (const [n,f] of [['ipi','linhasIpi'],['pis','linhasPisCofins'],['ibs','linhasIbsCbsTabela']]) { const L = w[f](); console.log(n, L.length, !!(L[0]&&L[0].__src), Object.keys(L[0]||{}).slice(0,16).join(',')); }
process.exit(0);
