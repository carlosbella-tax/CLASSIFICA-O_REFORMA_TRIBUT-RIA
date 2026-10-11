/* V29 — CST do ICMS e CSOSN conforme a planilha CFOP.xlsx (aba CST ICMS) */
const __CST_ICMS = {"00": "Tributada integralmente", "10": "Tributada e com cobrança do ICMS por substituição tributária", "20": "Com redução de base de cálculo", "30": "Isenta ou não tributada e com cobrança do ICMS por substituição tributária", "40": "Isenta", "41": "Não tributada", "50": "Suspensão", "51": "Diferimento", "60": "ICMS cobrado anteriormente por substituição tributária", "70": "Com redução de base de cálculo e cobrança do ICMS por substituição tributária", "90": "Outras", "61": "Tributação monofásica de combustíveis com ICMS cobrado anteriormente"};
const __CSOSN = {"101": "Tributada pelo Simples Nacional com permissão de crédito", "102": "Tributada pelo Simples Nacional sem permissão de crédito", "103": "Isenção do ICMS no Simples Nacional para faixa de receita bruta", "201": "Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por substituição tributária", "202": "Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por substituição tributária", "203": "Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por substituição tributária", "300": "Imune", "400": "Não tributada pelo Simples Nacional", "500": "ICMS cobrado anteriormente por substituição tributária (substituído) ou por antecipação", "900": "Outros"};
function descCstIcms(c){ c = String(c || '').trim(); if (!c) return ''; if (c.length >= 3 && __CSOSN[c]) return __CSOSN[c]; return __CST_ICMS[c.slice(-2).padStart(2, '0')] || 'CST não localizado na tabela'; }
/* V28 — alíquota exibida sempre como consta no XML */
function __aliqTxt(set){ const v = [...(set || [])].filter(x => x > 0).sort((a, b) => a - b); return v.length ? v.map(x => brNumero(x, 2) + '%').join(' / ') : '0,00%'; }
function acumular(destino, base, valor, aliquota){
  destino.base += base; destino.valor += valor;
  if (aliquota){ destino.aliqQtd++; destino.aliqSoma += aliquota; if (base) destino.aliqPeso += base * aliquota; (destino.aliqs || (destino.aliqs = new Set)).add(Math.round(aliquota * 10000) / 10000); }
}
function linhasResumo(x){
  const e = x.entradas, s = x.saidas;
  return '<tr><td>Entradas</td><td>' + brl(e.base) + '</td><td>' + __aliqTxt(e.aliqs) + '</td><td>' + brl(e.valor) + '</td></tr><tr><td>Saídas</td><td>' + brl(s.base) + '</td><td>' + __aliqTxt(s.aliqs) + '</td><td>' + brl(s.valor) + '</td></tr><tr class="dash-total-row"><td>Saldo (E − S)</td><td>' + brl(e.base - s.base) + '</td><td>—</td><td>' + brl(e.valor - s.valor) + '</td></tr>';
}
// IBS e CBS por CST e cClassTrib, separando ENTRADAS e SAÍDAS
function linhasIbsCbs(map){
  const th = document.querySelector('.dash-ibscbs thead');
  if (th) th.innerHTML = '<tr><th>Movimento</th><th>CST</th><th>cClassTrib</th><th>Base IBS/CBS</th><th>Alíq. IBS</th><th>Valor IBS</th><th>Alíq. CBS</th><th>Valor CBS</th></tr>';
  const linhas = [...map.values()];
  if (!linhas.length) return '<tr><td colspan="8" class="dash-empty">Sem IBS ou CBS destacado nos XMLs.</td></tr>';
  let h = '';
  for (const [o, rot] of [['entradas', 'ENTRADAS'], ['saidas', 'SAÍDAS']]){
    const ls = linhas.filter(x => (x.qtd?.[o] || 0) > 0);
    const cls = o === 'saidas' ? 'sai' : 'ent';
    if (!ls.length){ h += '<tr><td><span class="v24-mov ' + cls + '">' + rot + '</span></td><td colspan="7" class="dash-empty">Sem IBS/CBS nas ' + rot.toLowerCase() + '.</td></tr>'; continue; }
    h += ls.map(x => '<tr><td><span class="v24-mov ' + cls + '">' + rot + '</span></td><td>' + esc(x.cst) + '</td><td>' + esc(x.classe) + '</td><td>' + brl(x.base[o]) + '</td><td>' + brNumero(x.pIbs, 2) + '%</td><td>' + brl(x.ibs[o]) + '</td><td>' + brNumero(x.pCbs, 2) + '%</td><td>' + brl(x.cbs[o]) + '</td></tr>').join('');
    h += '<tr class="dash-total-row"><td colspan="3">Total ' + rot + '</td><td>' + brl(ls.reduce((a, x) => a + x.base[o], 0)) + '</td><td></td><td>' + brl(ls.reduce((a, x) => a + x.ibs[o], 0)) + '</td><td></td><td>' + brl(ls.reduce((a, x) => a + x.cbs[o], 0)) + '</td></tr>';
  }
  return h;
}
/* V25 — leitura de XML mais rápida (mesmo resultado da V13, sem cópias de listas) */
const __PULAR_FLAT = new Set(['Signature', 'SignedInfo', 'KeyInfo', 'X509Data', 'X509Certificate']);
function __ln(n){ return n.localName || n.nodeName.split(':').pop(); }
function __tx(n){ const t = n && n.textContent; return t ? t.trim() : ''; }
function flat(n, p = '', o = {}){
  if (!n) return o;
  const name = __ln(n);
  if (__PULAR_FLAT.has(name)) return o;
  const k = p ? p + '_' + name : name;
  const at = n.attributes; if (at) for (let i = 0; i < at.length; i++) o[k + '_@' + at[i].name] = at[i].value;
  const cs = []; for (let c = n.firstElementChild; c; c = c.nextElementSibling) if (!__PULAR_FLAT.has(__ln(c))) cs.push(c);
  if (!cs.length){ const v = __tx(n); if (v) o[k] = o[k] && o[k] !== v ? o[k] + ' | ' + v : v; return o; }
  const count = {}; for (const c of cs){ const nm = __ln(c); count[nm] = (count[nm] || 0) + 1; }
  const seen = {};
  for (const c of cs){
    const nm = __ln(c); seen[nm] = (seen[nm] || 0) + 1;
    if (count[nm] > 1){
      const key = k + '_' + nm + seen[nm], a2 = c.attributes;
      if (a2) for (let i = 0; i < a2.length; i++) o[key + '_@' + a2[i].name] = a2[i].value;
      if (c.firstElementChild){ for (let g = c.firstElementChild; g; g = g.nextElementSibling) flat(g, key, o); }
      else { const v = __tx(c); if (v) o[key] = v; }
    } else flat(c, k, o);
  }
  return o;
}
// Documento completo sem repetir os itens (<det> já vão para a aba Itens)
function flatDoc(inf){
  const tmp = inf.cloneNode(false);
  for (let c = inf.firstElementChild; c; c = c.nextElementSibling) if (__ln(c) !== 'det') tmp.appendChild(c.cloneNode(true));
  return flat(tmp);
}
function child(n, name){ if (!n) return null; for (let c = n.firstElementChild; c; c = c.nextElementSibling) if (__ln(c) === name) return c; return null; }
function find(n, names){ const all = n.getElementsByTagName('*'); for (let i = 0; i < all.length; i++) if (names.includes(__ln(all[i]))) return all[i]; return undefined; }
/* V14 — funções auxiliares do Excel que estavam ausentes na V13 (o download falhava com "xe is not defined"). */
function xe(v){return String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]))}
function col(n){let s='';while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s}

