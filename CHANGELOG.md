# Histórico de versões — Diagnóstico Operações Fiscais

Convenção: a versão é o número do selo **VERSÃO N** no cabeçalho do sistema e o nome do arquivo gerado (`DIAGNOSTICO_VN.html`).
Para abrir uma versão nova: `npm run nova-versao -- N "descrição"` (atualiza selo, `versao.json`, `package.json` e esta lista).

<!-- novas versões abaixo desta linha -->

## V67 — 2026-10-11

- **Base abaixo de R$ 0,05 e XML sem valor do imposto = VALIDADO** (valor irrelevante), sem nenhum valor recalculado (base correta e valor correto = 0). Vale para **PIS, COFINS, ICMS, IPI e IBS/CBS**, nas abas, no Dashboard (inconsistências) e na apresentação.
- A base considerada é a maior entre a base do XML e a base correta calculada; no IPI sem base no XML, o valor do produto. Exatamente R$ 0,05 ou mais continua com a regra normal.
- Só muda validações que estavam NÃO VALIDADO; o que já estava VALIDADO fica igual. Texto: "VALIDADO (base de PIS de R$ 0,04, abaixo de R$ 0,05, e sem valor no XML — valor irrelevante)".
- Nos XMLs de teste existentes, nenhuma mudança de status. Casos `tests/casos/v67-*` (item de R$ 0,04 validado nos 5 impostos; itens de R$ 10,00 e R$ 0,05 seguem NÃO VALIDADO).
  `src/js/modulos/28-v67-base-abaixo-005.js`

## V66 — 2026-10-11

Apresentação em PowerPoint quando o regime é **Lucro Presumido** (PIS e COFINS cumulativos, sem crédito das entradas):
- **Slide "PIS e COFINS"**: cada painel mostra "Entradas (informativo)", "Saídas" e **"A recolher (saídas)"** = somente o valor das saídas (antes: "Saldo (E − S)"). O rodapé do slide explica que as entradas não são deduzidas.
- **Slide "Saldo por imposto"**: PIS e COFINS (marcados com *) continuam mostrando as entradas, mas o saldo é só o das saídas (−saídas); o total do saldo também deixa de deduzir as entradas de PIS/COFINS. Nota explicativa no rodapé.
- **Slide "Resumo"**: o cartão de saldo passa a "SALDO (SEM PIS/COFINS DAS ENTRADAS)", e o título do slide usa esse saldo.
- Lucro Real, Simples Nacional e regime não informado: nada muda.
- Testes: os casos `v65-lucro-presumido` e `v65-lucro-real-controle` passam a conferir os slides (o executor de casos aceita `apresentacao`).
  `src/js/apresentacao/gerador-pptx.js` (comentário V66) e `src/js/modulos/27-v66-apresentacao-lucro-presumido.js`

## V65 — 2026-10-11

Vale quando o regime tributário do cabeçalho é **Lucro Presumido** (PIS e COFINS no regime cumulativo, 0,65% e 3% sobre a receita bruta, sem crédito das compras):
- **Dashboard › Inconsistências encontradas — detalhamento** (resumo por tipo e itens não validados) e **slides de observações da apresentação**: nenhuma inconsistência de PIS/COFINS das notas de **entrada**. As de saída continuam.
- **Quadro PIS/COFINS do Resumo geral**: as entradas continuam aparecendo como "Entradas (informativo)"; a linha "Entradas (−) Saídas" passa a ser **"A recolher — somente saídas (Lucro Presumido)"**, com a base e os valores de PIS e COFINS só das saídas, e uma nota explicando o regime.
- **Entradas e Saídas por imposto › PIS e COFINS**: o cartão "SALDO (Entradas − Saídas)" passa a **"A RECOLHER — somente saídas"**.
- Lucro Real, Simples Nacional e regime não informado: nada muda.
- O executor de casos aceita várias notas (`arquivos`), campos do cabeçalho (`campos`) e conferências no Dashboard (`dashboard`). Casos `v65-lucro-presumido` e `v65-lucro-real-controle`.
  `src/js/modulos/26-v65-lucro-presumido-pis-cofins.js`

## V64 — 2026-10-11

- **Simples Nacional sem permissão de crédito (CSOSN 102)**: o item não gera crédito de ICMS nem de IPI, então não há base a validar. Nas abas **ICMS** e **IPI**, todas as colunas de validação ficam "VALIDADO (Simples Nacional — CSOSN 102, sem permissão de crédito: não gera crédito de ICMS e IPI)" e nenhum valor é recalculado (base correta, valor correto = 0; colunas calculadas = VALIDADO).
- Antes: a aba ICMS já validava o CSOSN 102, mas a aba IPI recalculava o IPI (ex.: NÃO VALIDADO com valor correto de R$ 100,00) e o item ia para as Inconsistências do Dashboard e da apresentação.
- CSOSN 101 (com permissão de crédito) e os demais CSOSN seguem as regras anteriores.
- Casos de teste `tests/casos/v64-simples-csosn-102-icms` e `-ipi` (o executor de casos aceita `chave`, para abas sem `numero_item`).
  `src/js/modulos/25-v64-simples-csosn-102.js`

## V63 — 2026-10-11

- **Aba ICMS — correção da fórmula da V62** nas operações internas (CFOP 1xxx/5xxx) e interestaduais (CFOP 2xxx/6xxx): base do ICMS = valor dos produtos − desconto + frete + seguro + outras despesas, com a redução do `pRedBC`: base = (produtos − desconto + frete + seguro + outras despesas) × (1 − % redução). O IPI continua fora.
- O ICMS segue calculado e validado sobre essa base, com margem de R$ 0,02. Importação (CFOP 3xxx) continua com as regras da V59/V60/V61.
- Efeito nos XMLs de teste: nenhuma mudança de status; NF 123 passa a ter base correta de R$ 10.600,00 (continua NÃO VALIDADO).
- Caso de teste novo `tests/casos/v63-base-desconto-outras` e caso da V62 atualizado para a fórmula nova.
  `src/js/modulos/24-v62-icms-base-interna-interestadual.js` (comentário V63)

## V62 — 2026-10-11

- **Aba ICMS — operações internas (CFOP 1xxx/5xxx) e interestaduais (CFOP 2xxx/6xxx)**: base do ICMS = valor dos produtos + frete + seguro, com a redução do `pRedBC`: base = (produtos + frete + seguro) × (1 − % redução). Outras despesas, desconto e IPI não entram nesta base.
- O ICMS é calculado e validado sobre essa base (base do XML quando validada; senão, a base correta), com margem de R$ 0,02. Diferimento (CST 51), CST sem ICMS e XML sem base seguem a regra anterior.
- Importação (CFOP 3xxx) continua com as regras da V59/V60/V61.
- Efeito nos XMLs de teste: 1 mudança de status em 104 linhas — NF 123 (base XML R$ 10.000,00, correta R$ 10.400,00): o valor do ICMS passa a NÃO VALIDADO (correto R$ 1.872,00).
- Caso de teste `tests/casos/v62-base-interna-interestadual` (interna com outras despesas, interestadual com redução de 51,11%, XML com IPI na base, XML com desconto deduzido).
  `src/js/modulos/24-v62-icms-base-interna-interestadual.js`

## V61 — 2026-10-11

- **Aba ICMS — colunas novas**: `reducao_base_icms` (% de redução da base, tag `pRedBC` do XML), antes de `base_icms_xml`, e `origem_icms` (tag `orig`, com a descrição: 0 - Nacional, 1 - Estrangeira — importação direta etc.), antes de `cst_icms`.
- **Redução aplicada na base do ICMS em todas as regras**: base reduzida = base cheia × (1 − % redução). O ICMS é calculado e validado sobre a base reduzida.
  - CFOP 3101, 3102 e 3556 (V60): (produtos + frete + seguro + desconto + outras despesas + II + IPI) × (1 − % redução), margem de R$ 0,03.
  - Demais CFOP 3xxx (V59): (VA + II + IPI + PIS + COFINS + despesas aduaneiras, com ou sem o ICMS por dentro) × (1 − % redução).
  - Demais operações: a redução já era aplicada desde a V14; agora o texto da validação mostra a conta (base cheia × (1 − %) = base).
- Casos de teste: `tests/casos/v61-reducao-saida` (CST 20, 51,11%) e `v61-reducao-importacao` (3102 e 3556 com 51,11%).
- Ferramenta: `nova-versao` aceita CHANGELOG com fim de linha do Windows (a V61 não tinha sido registrada por isso).
  `src/js/modulos/23-v61-icms-reducao-base.js`

## V60 — 2026-10-11

- **Aba ICMS — colunas novas** logo após `valor_total_produtos`: `valor_frete`, `valor_seguro`, `valor_desconto`, `valor_outras_despesas`, `valor_ii` (II – valor) e `valor_ipi`. Valem para a tela, o filtro, o Excel e a impressão.
- **CFOP 3101, 3102 e 3556 — base do ICMS** = valor total dos produtos + frete + seguro + desconto + outras despesas + II + IPI. Diferença de até R$ 0,03 para mais ou para menos = VALIDADO; acima disso, NÃO VALIDADO com a base correta.
- **Valor do ICMS nesses CFOP** = base × alíquota do XML (a base do XML quando validada; senão, a base correta), também com margem de R$ 0,03.
- Os demais CFOP 3xxx continuam com a regra da V59. Itens sem base no XML ou com CST sem ICMS seguem a regra anterior (V37).
- Projeto: fechamento da função principal separado em `src/js/modulos/99-fechamento.js`; teste de casos de regra em `tests/casos/` (NF-e de importação com 4 itens).
  `src/js/modulos/22-v60-icms-colunas-importacao.js`

## V59 — 2026-10-11 — base trazida para o G4 OS

- ICMS na importação (CFOP 3xxx): base = valor aduaneiro + II + IPI + PIS + COFINS + despesas aduaneiras, com o ICMS por dentro.
- Projeto decomposto em `src/` (módulos por versão), com build que remonta o arquivo único idêntico byte a byte ao `DIAGNOSTICO_V59.html` recebido (sha256 `9087863b…13a8b`) e teste funcional com XMLs reais.

---

## Histórico anterior (reconstruído dos comentários `Vxx` do código-fonte)

Cada item indica o arquivo em `src/` onde a regra está hoje. Versões sem comentário no código (V1–V9, V11, V12, V16, V22, V27, V36, V44, V48, V51) não deixaram registro no fonte.

### V59

- ICMS na importação (CFOP 3xxx): base = valor aduaneiro + II + IPI + PIS + COFINS + despesas aduaneiras (com o ICMS "por dentro")  
  `src/js/modulos/21-v59-icms-importacao-cfop-3xxx.js`

### V58

- PIS/COFINS no Simples Nacional, valor correto a partir da base correta e "NÃO VALIDADO" no lugar de "INCORRETO" em todo o sistema  
  `src/js/modulos/20-v58-pis-cofins-simples-nacional.js`

### V57

- Aba ICMS: base_icms_calculada mostra "VALIDADO" quando a base do XML confere  
  `src/js/modulos/19-v56-pis-cofins-cst-nao.js`

### V56

- PIS/COFINS: CST não validada torna a base INCORRETA, com a base correta = valor total dos produtos − ICMS; NCM 4818.10.00 (papel higiênico)  
  `src/js/modulos/19-v56-pis-cofins-cst-nao.js`

### V55

- Base de IBS/CBS: componentes da base em colunas e nova fórmula Base = valor dos produtos/serviço + frete + seguro + juros + multa + outras despesas + desconto condicional + IS − desconto incondicional − ICMS − ISS − PIS − COFINS  
  `src/js/modulos/18-v55-base-ibs-cbs-componentes.js`

### V54

- IPI (CST × valor), IBS/CBS: CST 410/620, CST candidato do NCM e base pela regra do Art. 12 da LC 214/2025.  
  `src/js/modulos/17-v54-ipi-cst-valor-ibs.js`

### V53

- Inconsistências: coleta única de tudo que não foi validado, detalhamento no Dashboard e slides de Observações na apresentação.  
  `src/js/modulos/16-v53-inconsistencias-coleta-unica-tudo.js`

### V52

- PIS/COFINS na importação e CST de entrada (Informativo Tax Advice) Lei 10.865/2004 · Leis 10.637/2002 e 10.833/2003 · Lei 14.973/2024  
  `src/js/modulos/15-v52-pis-cofins-importacao-cst.js`

### V50

- Aba APRESENTAÇÃO: monta o PowerPoint (modelo Tax Advice) com os dados do Dashboard da empresa analisada.  
  `src/js/modulos/14-v50-aba-apresentacao-monta-powerpoint.js`

### V49

- Cabeçalho da impressão com os dados da empresa (nome, CNPJ, regime, período, UFs), a aba impressa e a data/hora.  
  `src/js/modulos/13-v49-cabecalho-impressao-com-dados.js`

### V47

- largura útil com folga (A4/Carta paisagem, margens padrão do navegador)  
  `src/js/modulos/12-v46-impressao-pdf-todas-linhas.js`

### V46

- Impressão/PDF: todas as linhas da aba aberta, fonte menor e tabelas reduzidas para caber na largura da página (A4 paisagem).  
  `src/js/modulos/12-v46-impressao-pdf-todas-linhas.js`

### V45

- IBS e CBS não validados — separado em ENTRADAS e SAÍDAS  
  `src/js/modulos/10-v42-regime-tributario-opsimpnac-crt.js`
- Simples Nacional — separado em ENTRADAS e SAÍDAS  
  `src/js/modulos/10-v42-regime-tributario-opsimpnac-crt.js`
- Exportar cada aba em Excel e salvar/importar o diagnóstico completo  
  `src/js/modulos/11-v45-exportar-cada-aba-excel.js`

### V43

- margem de R$ 0,02  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`

### V42

- if (k === 'item_det_prod_vDesc'){ o.DESCONTO = brl(num(r[k])); continue; }  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`
- Regime tributário (opSimpNac / CRT), resumo do Simples Nacional e resumo de IBS/CBS não validados no Dashboard.  
  `src/js/modulos/10-v42-regime-tributario-opsimpnac-crt.js`

### V41

- validação NCM × cClassTrib pela aba "TIPI - Base Completa" (colunas A/B → F, G, H, I de cada NCM)  
  `src/js/modulos/09-v39-base-ibs-cbs-validada.js`

### V40

- CST diferente de 01/02 (tributadas pela alíquota básica/diferenciada) e sem base no XML → VALIDADO (não há base de PIS/COFINS)  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`

### V39

- Base de IBS/CBS validada pela planilha REFORMA TRIBUTÁRIA (TIPI - Base Completa × Correlação Capítulo x Anexo × cClassTrib Oficial)  
  `src/js/modulos/09-v39-base-ibs-cbs-validada.js`

### V38

- base de PIS/COFINS — CST não tributado (04 a 09, 70 a 75) ou por quantidade (03) não é calculado; demais: valor da operação − ICMS destacado, aceitando arredondamento de até R$ 0,10  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- Lei 14.592/2023 (art. 1º, § 2º das Leis 10.637 e 10.833) — base = valor da operação − ICMS destacado na nota  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`

### V37

- sem base no XML → só CST 00 fica NÃO VALIDADO; qualquer outra CST fica VALIDADO  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`

### V35

- base zerada no XML → VALIDADO se a CST não é tributada; INCORRETO se a CST é tributada (00, 10, 20, 51, 70, 90)  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- Base de IBS/CBS: % de redução de alíquota, validação do cClassTrib (LC 214/2025) e anexo/artigo; base validada quando há redução.  
  `src/js/modulos/08-v35-base-ibs-cbs-reducao.js`

### V34

- filtros das colunas: a lista de valores considera os outros filtros já aplicados (como no Excel) e uma faixa mostra os filtros ativos, com opção de remover um a um ou todos.  
  `src/js/modulos/07-v34-filtros-das-colunas-lista.js`

### V33

- Resumo geral do Dashboard: ICMS RESUMO, ICMS ST sem alíquota, IPI e PIS/COFINS com uma linha por alíquota, IBS/CBS por CFOP e alíquota com ENTRADAS e SAÍDAS lado a lado.  
  `src/js/modulos/04-v33-resumo-geral-dashboard-icms.js`

### V32

- tipo_operacao editável (ENTRADAS / SAÍDAS / automático pelo CNPJ)  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- troca manual do tipo de operação — aplicada a todos os itens da mesma nota  
  `src/js/modulos/06-v25-desempenho-indice-por-tag.js`

### V31

- classificação conforme as planilhas CST_DE_ICMS, CST_PIS_E_COFINS e CST_DE_IPI  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- CST não tributado — não calcula, sempre VALIDADO  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- quadro por imposto (padrão ICMS) — resumo por CFOP e alíquota; ENTRADAS e SAÍDAS em listas lado a lado, sem linhas vazias  
  `src/js/modulos/03-v17-cfop-entradas-convertido-com.js`
- filtro das colunas — campo de pesquisa estável, "Selecionar todos" sobre os resultados e aplicar com Enter  
  `src/js/modulos/06-v25-desempenho-indice-por-tag.js`

### V30

- planilha CFOP_DE_SUBSTITUIÇÃO_TRIBUTARIA.xlsx  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- barra Consultar removida também do Dashboard  
  `src/js/modulos/02-v15-filtros-consulta-por-aba.js`
- contagem da aba ICMS ST pelos CFOP de substituição tributária  
  `src/js/modulos/06-v25-desempenho-indice-por-tag.js`

### V29

- CST do ICMS e CSOSN conforme a planilha CFOP.xlsx (aba CST ICMS)  
  `src/js/base/auxiliares-v25-v29.js`
- CST que não gera imposto → o XML deve vir sem base/valor; CST tributado → o XML deve trazer valor  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`

### V28

- alíquota exibida sempre como consta no XML  
  `src/js/base/auxiliares-v25-v29.js`
- validação do IPI = Base × Alíquota (ou Qtd × Valor por unidade); se INCORRETO, mostra o valor correto  
  `src/js/modulos/02-v15-filtros-consulta-por-aba.js`

### V26

- o filtro ▾ das colunas usa as linhas exibidas na aba (inclui tipo_operacao e as colunas montadas)  
  `src/js/modulos/02-v15-filtros-consulta-por-aba.js`
- barra Consultar removida das abas de listas  
  `src/js/modulos/02-v15-filtros-consulta-por-aba.js`
- tipo_operacao como coluna comum, com filtro ▾ igual a arquivo_origem  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`

### V25

- leitura de XML mais rápida (mesmo resultado da V13, sem cópias de listas)  
  `src/js/base/auxiliares-v25-v29.js`
- Resumo geral — Base, Alíquota e Valor de cada imposto, por movimento (sem quebra por CST)  
  `src/js/modulos/03-v17-cfop-entradas-convertido-com.js`
- linha da aba Itens montada uma vez por item  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`
- desempenho: índice por tag em cada item, detecção de grupos em cache, renderização só da aba aberta e campos do cabeçalho sem travar.  
  `src/js/modulos/06-v25-desempenho-indice-por-tag.js`

### V24

- Resumo geral — Base, CST, Alíquota e Valor de cada imposto (Entradas e Saídas)  
  `src/js/modulos/03-v17-cfop-entradas-convertido-com.js`

### V23

- linha fiscal única que alimenta as abas ICMS e Base de PIS/COFINS  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- ICMS ST só quando o XML traz as tags de valor de ST  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`

### V21

- bloco de IBS/CBS (base, CST e cClassTrib são comuns aos dois tributos no grupo IBSCBS do XML)  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`

### V20

- campo sem informação no XML aparece com 0 (nunca vazio)  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`

### V19

- bloco de IPI logo após o ICMS ST  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`

### V18

- Layout da aba Itens (colunas removidas, renomeadas e blocos de ICMS, ICMS ST e PIS/COFINS com CST e descrição).  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`
- a V13 juntava todas as chaves num só texto e "PRED...CST" (redução de BC + CST do PIS) virava ICMS ST por engano.  
  `src/js/modulos/05-v18-layout-aba-itens-colunas.js`

### V17

- CFOP de ENTRADAS convertido (5→1, 6→2, 7→3) com descrição da tabela CFOP.xlsx, e Dashboard com uma aba por imposto (Entradas × Saídas).  
  `src/js/modulos/03-v17-cfop-entradas-convertido-com.js`

### V15

- Filtros de consulta por aba: CNPJ (emitente/destinatário), operação, CFOP, NCM e CST, com seleção múltipla e opção "Todos".  
  `src/js/modulos/02-v15-filtros-consulta-por-aba.js`

### V14

- funções auxiliares do Excel que estavam ausentes na V13 (o download falhava com "xe is not defined").  
  `src/js/base/auxiliares-v25-v29.js`
- Carga ilimitada de XML (arquivos + pasta + arrastar pastas), aba PROCESSAR que inicia o processamento, paginação para exibir TODOS os itens, correções de cálculo e dashboard de validações.  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`

### V13

- Importação de XML salvo como TXT e visões fiscais específicas  
  `src/js/base/v13-importacao-xml-txt.js`
- "IMPOSTO" contém "ST", o que zerava todo o ICMS próprio. Agora o filtro é pela tag final.  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`
- a base esperada de PIS/COFINS usava a função valorIcms em vez do valor → sempre "INCORRETO".  
  `src/js/modulos/01-v14-carga-ilimitada-xml-arquivos.js`

### V10

- grupos fiscais são identificados pela presença de tags, não pelo valor  
  `src/js/base/leitura-xml-e-telas.js`
