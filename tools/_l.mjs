import puppeteer from 'puppeteer-core';
const ex = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
for (const o of [{ pipe: true }, { userDataDir: process.env.TEMP + '/edgepp', args: ['--no-first-run'] }]) { try { const b = await puppeteer.launch({ executablePath: ex, headless: 'new', timeout: 60000, ...o }); console.log('ok', JSON.stringify(o), await b.version()); await b.close(); } catch (e) { console.log('falhou', JSON.stringify(o), String(e.message).replace(/\s+/g, ' ').slice(0, 300)); } }
