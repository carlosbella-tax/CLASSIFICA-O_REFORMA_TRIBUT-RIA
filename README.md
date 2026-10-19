# Diagnóstico Operações Fiscais — Tax Advice

Lê XML de NF-e, CT-e, NFS-e e eventos (arquivos, pasta inteira, TXT com XML), valida ICMS, ICMS ST, IPI, PIS/COFINS e IBS/CBS (LC 214/2025), mostra o Dashboard por imposto e gera Excel, PDF e a apresentação em PowerPoint. O entregável é **um único arquivo HTML** que roda offline no navegador.

Versão atual: **V100** (ver [CHANGELOG.md](CHANGELOG.md)). Regras de trabalho do agente: [AGENTS.md](AGENTS.md).

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
| `src/vendor/pdfjs-complementos.js` | 1 KB | V89: Promise.allSettled quando a página não tiver (exigido pelo pdf.js) |
| `src/vendor/pdfjs-3.11.174.min.js` e `.worker.min.js` | 1.380 KB | pdf.js 3.11.174 embutido para ler PDF offline (não editar) |
| `src/vendor/motor-nfse.js` | 60 KB | leitor de NFS-e (XML/PDF) do Motor de Cálculo — gerado por `tools/portar-nfse-motor.mjs` (não editar) |
| `src/vendor/tesseract-7.0.0.min.js` e `src/vendor/ocr-dados-v108.js` | 5.900 KB | V108: OCR offline (tesseract.js 7.0.0, núcleo simd-lstm, português best_int) — gerado por `tools/portar-ocr.mjs` (não editar) |
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
| `src/js/modulos/46-v89-nfse-xml-pdf-iss.js` | 24 KB | módulo V89 (NFS-e em XML e PDF, tipo_de_documento na aba Itens, aba ISS, quadro no Dashboard e slide) |
| `src/js/modulos/47-v90-ipi-base-uso-consumo.js` | 6 KB | módulo V90 (IPI incluso na base de ICMS = USO E CONSUMO, base = produtos + IPI; coluna nas demais abas) |
| `src/js/modulos/48-v91-icms-consumidor-final.js` | 3 KB | módulo V91 (venda para consumidor final: base de ICMS = produtos + frete + IPI; leitura do indFinal) |
| `src/js/modulos/49-v92-compra-uso-consumo-sem-credito.js` | 6 KB | módulo V92 (compra de uso e consumo: CFOP 1556/2556, sem crédito, tudo VALIDADO, observação "CST informado divergente do uso") |
| `src/js/modulos/50-v93-uso-consumo-itens-dashboard.js` | 7 KB | módulo V93 (uso e consumo: coluna na aba Itens, ICMS sem validação com observação, fora das demais abas, Dashboard só com valor dos produtos) |
| `src/js/modulos/51-v94-cfop-uso-consumo-3556.js` | 1 KB | módulo V94 (uso e consumo com cfop_xml 7xxx → 3556; conversão 5→1, 6→2, 7→3 nas entradas) |
| `src/js/modulos/52-v95-icms-importacao-por-dentro.js` | 5 KB | módulo V95 (ICMS na importação: (VA + II + IPI + PIS + COFINS + IOF + despesas aduaneiras) ÷ (1 − alíquota)) |
| `src/js/modulos/53-v96-devolucao-5202-ipi-no-xml.js` | 9 KB | módulo V96 (CFOP 5202/6202: outras despesas fora da base de ICMS e como valor do IPI; IPI só na base quando o XML traz) |
| `src/js/modulos/54-v97-desconto-base-icms.js` | 1 KB | módulo V97 (desconto subtrai da base de ICMS em todas as regras; ajustes nos módulos 47, 48, 49, 52 e 53) |
| `src/js/modulos/55-v98-saida-desconto-nao-abatido.js` | 2 KB | módulo V98 (saídas: desconto não abatido da base de ICMS = VALIDADO, ICMS = base do XML × alíquota) |
| `src/js/modulos/56-v99-cfop-6110-zona-franca.js` | 2 KB | módulo V99 (CFOP 6110 ZFM/ALC: descrição, cfop 2110, ICMS VALIDADO sem recálculo, observação ZONA FRANCA) |
| `src/js/modulos/57-v100-simples-outras-ipi-nota-1632.js` | 5 KB | módulo V100 (Simples opção 3: outras despesas → valor_ipi; nota 1632 sem redução de base) |
| `src/js/modulos/61-v104-regime1-outras-fora-base.js` | 2 KB | módulo V104 (regime 1: outras despesas fora da base de ICMS, valor na observação) |
| `src/js/modulos/62-v105-imposto-seletivo.js` | 9 KB | módulo V105 (Imposto Seletivo na aba Base de IBS/CBS: colunas e validações de CST, base e valor; quadro de IS no Dashboard) |
| `src/js/modulos/63-v106-pis-cofins-observacoes-simples-uso.js` | 3 KB | módulo V106 (PIS/COFINS: CSOSN 102 + Lucro Presumido VALIDADO; observações 5107/6107, 1656, 1556/2556) |
| `src/js/modulos/64-v107-icms-st-portaria-sre-34-2026.js` | 25 KB | módulo V107 (ICMS ST: validação Portaria SRE nº 34/2026 — 174 itens excluídos do ICMS ST em SP) |
| `src/js/modulos/65-v108-nfse-pdf-ocr.js` | 14 KB | módulo V108 (NFS-e em PDF de imagem por OCR, detecção de NFS-e e leitor de leiautes SP/Barueri/Caieiras; nenhuma NFS-e fica de fora) |
| `src/js/modulos/99-fechamento.js` | 0 KB | fecha a função principal e desenha a tela — módulos novos entram antes dele |

## Origem

Arquivo único `DIAGNOSTICO_V59.html` (3.657.037 bytes, sha256 `9087863b78b95980462191ae3cfa2266e1d9585d0535ef9c63abf12824a13a8b`), preservado em `_arquivo_original/`. Versões anteriores (V4 a V49) estão no Drive em `0025- REFORMA TRIBUTARIA/00 - PAINEL AUTOMATICO/MOTOR DE CALCLULO/`.
