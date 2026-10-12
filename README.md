# Diagnóstico Operações Fiscais — Tax Advice

Lê XML de NF-e, CT-e, NFS-e e eventos (arquivos, pasta inteira, TXT com XML), valida ICMS, ICMS ST, IPI, PIS/COFINS e IBS/CBS (LC 214/2025), mostra o Dashboard por imposto e gera Excel, PDF e a apresentação em PowerPoint. O entregável é **um único arquivo HTML** que roda offline no navegador.

Versão atual: **V88** (ver [CHANGELOG.md](CHANGELOG.md)). Regras de trabalho do agente: [AGENTS.md](AGENTS.md).

## Comandos

```bash
npm install                                   # uma vez (jsdom, para os testes)
npm run build                                 # gera dist/DIAGNOSTICO_V{versão}.html
npm test                                      # build + sintaxe + versão + teste funcional com XMLs reais
npm run nova-versao -- 60 "descrição"         # abre a próxima versão (selo, versao.json, CHANGELOG)
npm run drive                                 # build + cópia para a pasta do dia no Google Drive
node tests/testar.mjs --atualizar             # grava nova referência (só depois de conferir as diferenças)
```

## Fluxo de uma atualização

1. `npm run nova-versao -- N "o que muda"`
2. Editar em `src/` (regra nova → módulo novo em `src/js/modulos/` e inclusão no `src/manifest.json`)
3. `npm test` → conferir as abas que mudaram; se for o esperado, `node tests/testar.mjs --atualizar`
4. `npm run drive` e commit `vN: descrição` + tag `vN`

## Testes

| Bloco | O que garante |
|---|---|
| Sintaxe | cada um dos 4 blocos `<script>` compila |
| Versão | selo VERSÃO N do cabeçalho = `versao.json` |
| Identidade | na V59, o build é idêntico byte a byte ao arquivo recebido (`_arquivo_original/`) |
| Casos de regra | `tests/casos/*.json`: XML(s), campos do cabeçalho, resultado esperado por item e conferências no Dashboard e nos slides da apresentação (ex.: V60 importação 3101/3102/3556) |
| Funcional | carrega os 9 XMLs de `tests/fixtures` no navegador simulado, processa (6 documentos, 105 itens) e compara o conteúdo de cada aba (Itens, ICMS, ICMS ST, IPI, PIS/COFINS, IBS/CBS, Eventos, Dashboard, Apresentação, Observações) com `tests/referencia.json`, incluindo contagem de VALIDADO / NÃO VALIDADO |

## Mapa dos arquivos (ordem de montagem)

Os arquivos são concatenados exatamente na ordem de `src/manifest.json`. Os módulos `src/js/modulos/` ficam dentro de uma única função `(function(){ … })()` que começa em `01-v14` e fecha em `99-fechamento.js`; a numeração é a ordem de carga (a V33, por exemplo, roda antes da V18).

| Arquivo | Tamanho | Conteúdo |
|---|---|---|
| `src/00-cabecalho.html` | 0 KB | doctype, head e título |
| `src/css/estilo.css` | 43 KB | todo o CSS (tela e impressão) |
| `src/10-corpo.html` | 17 KB | marcação das abas, cabeçalho (empresa, CNPJ, regime, período) e selo VERSÃO |
| `src/js/dados/cfop-cst-icms.js` | 44 KB | tabela CFOP, CST de ICMS, cfopDesc/cstDesc |
| `src/js/dados/icms-st-exclusoes.js` | 36 KB | NCMs excluídos do ICMS ST |
| `src/js/dados/tipi-2026.js` | 1.743 KB | TIPI 2026 completa (1.7 MB) e tipiNcm |
| `src/js/base/leitura-xml-e-telas.js` | 44 KB | estado global, leitura de NF-e/CT-e/NFS-e/eventos, formatação, filtros, Excel, abas fiscais (V10) |
| `src/js/base/v13-importacao-xml-txt.js` | 5 KB | V13: XML salvo como TXT |
| `src/vendor/pptxgenjs-4.0.1.bundle.js` | 450 KB | biblioteca PptxGenJS 4.0.1 (não editar) |
| `src/js/apresentacao/gerador-pptx.js` | 30 KB | montagem dos slides (modelo Tax Advice) |
| `src/js/apresentacao/imagens-pptx.js` | 103 KB | logos e fundo da apresentação em base64 |
| `src/js/base/auxiliares-v25-v29.js` | 6 KB | CST ICMS/CSOSN, alíquota exibida, leitura XML rápida, auxiliares do Excel |
| `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js` | 40 KB | módulo V14 (IIFE principal) |
| `src/js/modulos/02-v15-filtros-consulta-por-aba.js` | 17 KB | módulo V15 (IIFE principal) |
| `src/js/modulos/03-v17-cfop-entradas-convertido-com.js` | 59 KB | módulo V17 (IIFE principal) |
| `src/js/modulos/04-v33-resumo-geral-dashboard-icms.js` | 10 KB | módulo V33 (IIFE principal) |
| `src/js/modulos/05-v18-layout-aba-itens-colunas.js` | 15 KB | módulo V18 (IIFE principal) |
| `src/js/modulos/06-v25-desempenho-indice-por-tag.js` | 13 KB | módulo V25 (IIFE principal) |
| `src/js/modulos/07-v34-filtros-das-colunas-lista.js` | 3 KB | módulo V34 (IIFE principal) |
| `src/js/modulos/08-v35-base-ibs-cbs-reducao.js` | 18 KB | módulo V35 (IIFE principal) |
| `src/js/modulos/09-v39-base-ibs-cbs-validada.js` | 630 KB | módulo V39 (IIFE principal) |
| `src/js/modulos/10-v42-regime-tributario-opsimpnac-crt.js` | 13 KB | módulo V42 (IIFE principal) |
| `src/js/modulos/11-v45-exportar-cada-aba-excel.js` | 12 KB | módulo V45 (IIFE principal) |
| `src/js/modulos/12-v46-impressao-pdf-todas-linhas.js` | 3 KB | módulo V46 (IIFE principal) |
| `src/js/modulos/13-v49-cabecalho-impressao-com-dados.js` | 2 KB | módulo V49 (IIFE principal) |
| `src/js/modulos/14-v50-aba-apresentacao-monta-powerpoint.js` | 14 KB | módulo V50 (IIFE principal) |
| `src/js/modulos/15-v52-pis-cofins-importacao-cst.js` | 14 KB | módulo V52 (IIFE principal) |
| `src/js/modulos/16-v53-inconsistencias-coleta-unica-tudo.js` | 10 KB | módulo V53 (IIFE principal) |
| `src/js/modulos/17-v54-ipi-cst-valor-ibs.js` | 165 KB | módulo V54 (IIFE principal) |
| `src/js/modulos/18-v55-base-ibs-cbs-componentes.js` | 4 KB | módulo V55 (IIFE principal) |
| `src/js/modulos/19-v56-pis-cofins-cst-nao.js` | 3 KB | módulo V56 (IIFE principal) |
| `src/js/modulos/20-v58-pis-cofins-simples-nacional.js` | 3 KB | módulo V58 (IIFE principal) |
| `src/js/modulos/21-v59-icms-importacao-cfop-3xxx.js` | 3 KB | módulo V59 (IIFE principal) |
| `src/js/modulos/22-v60-icms-colunas-importacao.js` | 4 KB | módulo V60 (colunas da aba ICMS e base nos CFOP 3101/3102/3556) |
| `src/js/modulos/23-v61-icms-reducao-base.js` | 6 KB | módulo V61 (origem e % de redução da base do ICMS em todas as regras) |
| `src/js/modulos/24-v62-icms-base-interna-interestadual.js` | 3 KB | módulo V62/V63 (base do ICMS nas operações internas e interestaduais: produtos − desconto + frete + seguro + outras despesas, com redução) |
| `src/js/modulos/25-v64-simples-csosn-102.js` | 2 KB | módulo V64 (CSOSN 102: ICMS e IPI sempre VALIDADO, sem recálculo) |
| `src/js/modulos/26-v65-lucro-presumido-pis-cofins.js` | 3 KB | módulo V65 (Lucro Presumido: PIS/COFINS sem inconsistências das entradas e apuração só pelas saídas) |
| `src/js/modulos/27-v66-apresentacao-lucro-presumido.js` | 1 KB | módulo V66 (informa o Lucro Presumido à apresentação; regra no gerador-pptx.js) |
| `src/js/modulos/28-v67-base-abaixo-005.js` | 4 KB | módulo V67 (base abaixo de R$ 0,05 sem valor no XML = VALIDADO em PIS, COFINS, ICMS, IPI e IBS/CBS) |
| `src/js/modulos/29-v68-diferenca-base-ibs-cbs.js` | 1 KB | módulo V68 (diferença da base de IBS/CBS no NÃO VALIDADO) |
| `src/js/modulos/30-v69-margem-005.js` | 3 KB | módulo V69 (margem única de R$ 0,05 em todas as validações de valor e base) |
| `src/js/modulos/31-v70-eventos-nfe.js` | 13 KB | módulo V70 (eventos de NF-e: cancelamento fora das abas de impostos, observação na aba Itens, aba Eventos no Dashboard, slide de eventos) |
| `src/js/modulos/32-v71-observacao-icms-filtro-eventos.js` | 5 KB | módulo V71/V75 (observação editável nas abas ICMS, IPI, PIS/COFINS e IBS/CBS; filtro de observacao_evento por evento) |
| `src/js/modulos/33-v72-dashboard-quadro-eventos.js` | 4 KB | módulo V72 (quadro de eventos ao lado de Montante por imposto) |
| `src/js/modulos/34-v73-ibs-valor-produtos-apos-ncm.js` | 1 KB | módulo V73 (valor total dos produtos logo após o NCM na aba Base de IBS/CBS) |
| `src/js/modulos/35-v74-ibs-cst-cclasstrib-apos-is.js` | 1 KB | módulo V74 (cclasstrib e cst_ibs_cbs após valor_imposto_seletivo_is na aba Base de IBS/CBS) |
| `src/js/modulos/36-v76-ibs-sem-difal.js` | 3 KB | módulo V76 (ICMS DIFAL e FCP do DIFAL fora da base de IBS/CBS; IBS/CBS sobre a base correta) |
| `src/js/modulos/37-v77-difal-icms-pis-cofins.js` | 3 KB | módulo V77 (coluna do ICMS DIFAL nas abas ICMS e PIS/COFINS; base de PIS/COFINS sem o DIFAL) |
| `src/js/modulos/38-v78-cfop-6911-amostra-gratis.js` | 2 KB | módulo V78–V80 (CST 410 por CFOP: amostra grátis, bonificação/doação, exportação, perda/roubo e 410037 — sem base e sem IBS/CBS) |
| `src/js/modulos/39-v81-filtro-observacao-vazia.js` | 1 KB | módulo V81 (opção "(sem observação)" no filtro da coluna observacao) |
| `src/js/modulos/40-v82-base-pis-cofins-formula.js` | 4 KB | módulo V82 (base de PIS/COFINS = vProd + vFrete + vSeg + vOutro − vDesc − vICMS − vICMSUFDest) |
| `src/js/modulos/41-v83-cclasstrib-candidato-divergente.js` | 2 KB | módulo V83 (cClassTrib fora do candidato do NCM = NÃO VALIDADO) |
| `src/js/modulos/42-v84-tributacao-integral-analisar.js` | 2 KB | módulo V84 (tributação integral em NCM com candidato: VALIDADO + observação "Analisar cClassTrib") |
| `src/js/modulos/43-v85-icms-regime-frete-simples.js` | 2 KB | módulo V85 (regime tributário na aba ICMS; observação de frete não destacado no Simples Nacional) |
| `src/js/modulos/44-v86-observacoes-automaticas.js` | 4 KB | módulo V86 (observações automáticas em PIS/COFINS e IBS/CBS; cClassTrib divergente = VALIDADO com "Analisar cClassTrib"; bonificação divergente) |
| `src/js/modulos/45-v88-obs-arredondamento-ibs.js` | 2 KB | módulo V88 (observações de arredondamento no ICMS reduzido e de base de IBS/CBS sem o próprio IBS/CBS) |
| `src/js/modulos/99-fechamento.js` | 0 KB | fecha a função principal e desenha a tela — módulos novos entram antes dele |

## Origem

Arquivo único `DIAGNOSTICO_V59.html` (3.657.037 bytes, sha256 `9087863b78b95980462191ae3cfa2266e1d9585d0535ef9c63abf12824a13a8b`), preservado em `_arquivo_original/`. Versões anteriores (V4 a V49) estão no Drive em `0025- REFORMA TRIBUTARIA/00 - PAINEL AUTOMATICO/MOTOR DE CALCLULO/`.
