/* V89 — complementos para o pdf.js: a biblioteca do PowerPoint (core-js do JSZip) pode trocar o Promise da página
   por uma versão sem allSettled; o pdf.js precisa dele. Só age quando o recurso falta. */
if (typeof Promise.allSettled !== 'function') Promise.allSettled = ps => Promise.all(Array.from(ps, p => Promise.resolve(p).then(value => ({status: 'fulfilled', value}), reason => ({status: 'rejected', reason}))));
