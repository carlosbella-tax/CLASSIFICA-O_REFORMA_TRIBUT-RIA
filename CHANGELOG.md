# Histórico de versões — Diagnóstico Operações Fiscais

Convenção: a versão é o número do selo **VERSÃO N** no cabeçalho do sistema e o nome do arquivo gerado (`DIAGNOSTICO_VN.html`).
Para abrir uma versão nova: `npm run nova-versao -- N "descrição"` (atualiza selo, `versao.json`, `package.json` e esta lista).

<!-- novas versões abaixo desta linha -->

## V120 — 2026-10-20

- **Aba ICMS ST — base, alíquota e valor preenchidos no CST 60**: quando o XML não traz o grupo de ST (vBCST/pICMSST/vICMSST), `base_icms_st_xml`, `aliquota_icms_st` e `valor_icms_st_xml` são lidos do texto da descrição do item (infAdProd, ex.: "BC ICMS ST 134,28 pST 18.00% Vlr ICMS ST 15,72"); sem o texto, vêm dos campos de ST retido (vBCSTRet, pST, vICMSSTRet). `icms_proprio_xml` sem valor recebe o vICMSSubstituto. Valores do grupo de ST do XML nunca são trocados; o Dashboard não muda.
- Caso `tests/casos/v120-icms-st-infadprod` (XML real do usuário, NF 556419).
  `src/js/modulos/74-v120-icms-st-infadprod.js`

## V119 — 2026-10-20

- **Aba ICMS — colunas de PIS/COFINS do XML** logo depois de `valor_icms_difal`: `base_pis_cofins` (vBC do PIS; sem ele, vBC da COFINS), `cst_pis`, `valor_pis`, `cst_cofins` e `valor_cofins`. Somente a informação do XML, sem cálculo (a validação continua na aba Base de PIS/COFINS).
- Caso `tests/casos/v119-icms-colunas-pis-cofins`.
  `src/js/modulos/73-v119-icms-colunas-pis-cofins.js`

## V118 — 2026-10-20

- **Aba Processamento — conferência de todos os arquivos**: abaixo dos indicadores, "N arquivo(s) carregado(s) = X documento(s) processado(s) (inclui eventos) + Y duplicado(s) excluído(s) + Z com erro ✔" (em laranja, com a diferença, se a conta não fechar) e o total de itens nas abas.
- **Lista "Duplicados excluídos automaticamente"** (expansível, na caixa de ocorrências): cada arquivo duplicado com o arquivo de origem que ficou valendo e a chave.
- **Proteção contra duplicado falso**: documento cuja chave não é a chave de acesso de 44 dígitos (ex.: NFS-e identificada por prestador + número, inclusive lida por OCR) só é tratado como duplicado se valor, data e emitente também forem iguais; caso contrário é processado normalmente.
- Caso `tests/casos/v118-conferencia-duplicados`.
  `src/js/modulos/72-v118-conferencia-duplicados.js`

## V117 — 2026-10-20

- **Dashboard e impressão em PDF — "Itens analisados" igual à aba Processamento do lote**: o quadro da empresa contava os itens sem as notas canceladas (que desde a V70 ficam fora das apurações), enquanto a aba Processamento conta todos os itens carregados (ex.: 549 × 591). Agora "Documentos" e "Itens analisados" mostram os mesmos números do processamento, e o subtítulo informa quantos itens são de notas canceladas e ficam fora das apurações. Com filtro de consulta no Dashboard continua valendo a contagem filtrada (V15).
- Caso `tests/casos/v117-dashboard-itens-processamento`.
  `src/js/modulos/71-v117-dashboard-itens-iguais-processamento.js`

## V116 — 2026-10-20

- **Teste do OCR ao escolher os arquivos**: quando há PDF, o OCR é testado com um texto de prova (e já fica aquecido para o processamento). Aparece "✔ OCR pronto" ou o aviso vermelho **antes** de processar.
- **Aviso com o motivo técnico exato** (ex.: política de segurança bloqueia o WebAssembly, worker bloqueado, tempo esgotado), o ambiente (arquivo local, Worker, WebAssembly, quadro embutido) e a versão, e o botão **"Tentar OCR novamente"**.
- **Nenhum PDF de imagem fica de fora**: se o OCR não puder ler, o PDF entra na aba ISS como linha "SEM NÚMERO", com `leitura_pdf` "NÃO LIDO — motivo — conferir o PDF" e o nome do arquivo; o resumo da aba ISS conta as linhas NÃO LIDO.
- Testado em Chromium comum (sem permissões extras): 9 XMLs + 10 PDFs → 114 itens, 9 NFS-e (8 por OCR), 28 s; com política de segurança que bloqueia WebAssembly e worker → aviso com o motivo, 9 PDFs como NÃO LIDO na aba ISS, demais arquivos carregados em 1 s.
- Caso V109 atualizado (PDF não lido vira linha NÃO LIDO); `tools/testar-ocr-edge.mjs` ganhou o modo `csp` e a variável `NAVEGADOR`.
  `src/js/modulos/70-v116-ocr-teste-nao-lidos.js`

## V115 — 2026-10-19

- **OCR funciona com o arquivo aberto direto do disco em qualquer Chrome ou Edge** (corrige o aviso "OCR bloqueado neste ambiente"): num navegador comum, a página aberta do disco (file://) tem origem "null" e o worker do OCR não conseguia carregar o núcleo (importScripts de blob:null) nem o dicionário; sobrava a leitura direta na página, lenta em computadores modestos, que estourava o limite e desligava o OCR. Os testes anteriores passavam porque o Edge de teste rodava com `--allow-file-access-from-files`.
- O worker agora é **autossuficiente**: núcleo do Tesseract e dicionário de português vão dentro do próprio script do worker — nada é carregado de fora.
- Limites de tempo maiores para computadores lentos: 150 s para o OCR iniciar, 240 s por página, OCR desligado só após 3 páginas travadas seguidas; 120 s para o worker responder.
- Teste no Edge **sem** permissões extras: 10 PDFs → 9 notas na aba ISS em 22 s; quadro isolado → 9 notas; 60 PDFs → 23 s (duplicados excluídos antes da leitura); OCR travado → 106 itens carregados e aviso.
- `tools/testar-ocr-edge.mjs`: variável `SEM_FLAG=1` testa como um navegador comum.
  `src/js/modulos/69-v115-ocr-worker-autossuficiente.js`; módulos 66 e 67 (comentários V115)

## V114 — 2026-10-19

- **Aba Base de PIS/COFINS — colunas `valor_frete`, `valor_seguro`, `valor_desconto`, `valor_outras_despesas`, `valor_ii` e `valor_ipi`** depois do valor do ICMS (`valor_icms_xml` e `valor_icms_difal`, que seguem juntos como na V77) e antes de `base_pis_xml`.
  - Valores **iguais aos da aba ICMS**, inclusive os ajustes feitos lá (ex.: Simples opção 3 — outras despesas lançadas como IPI, V100); item que não está na aba ICMS traz os valores do XML.
- Caso `tests/casos/v114-pis-cofins-colunas-icms`; caso V77 atualizado (depois do DIFAL vem `valor_frete`).
  `src/js/modulos/71-v114-pis-cofins-colunas-icms.js`

## V113 — 2026-10-19

- **Aba ICMS ST — validação pela NCM (Portaria SRE nº 34/2026)**: a NCM do XML é comparada com a relação da planilha "Portaria SRE nº 342026 revogou" (colunas C e D — as mesmas 208 NCMs / 174 itens da V107).
  - NCM encontrada → `validacao_icms_st` **ANALISAR** (em vermelho), com anexo, item, CEST e descrição legal, e observação **"NCM FOI EXCLUÍDA DA LISTA DE ICMS ST EM 30/09 ATRAVÉS DA Portaria SRE nº 34/2026"**;
  - NCM não encontrada → **VALIDADO**.
  - A coluna `validacao_portaria_sre_34_2026` da V107 passou a ser `validacao_icms_st`; nova coluna `observacao` editável (o texto digitado pelo usuário prevalece).
- **Aba ICMS ST — todos os dados do ICMS 60 / CSOSN 500** (ST retido anteriormente): depois de `valor_st_retido` entram `aliquota_st_retido` (pST), `icms_substituto` (vICMSSubstituto) e o FCP ST retido (`base_fcp_st_retido`, `aliquota_fcp_st_retido`, `valor_fcp_st_retido`).
- "ANALISAR" passa a ser exibido em vermelho, como NÃO VALIDADO.
- Caso `tests/casos/v113-icms-st-validacao-ncm`; caso V107 atualizado para a coluna `validacao_icms_st`.
  `src/js/modulos/70-v113-icms-st-validacao-ncm-sre34.js`

## V112 — 2026-10-19

- **Aba Processar — campo "Duplicados ignorados" sempre vazio**: desde a V111 todo arquivo duplicado (XML ou PDF) é excluído automaticamente ao carregar, então o campo não mostra mais contagem (nem durante, nem depois do processamento). A relação dos excluídos continua em `state.duplicados`.
- Caso `tests/casos/v112-campo-duplicados-vazio` (XML e cópia com outro nome: 1 documento, 1 duplicado excluído, 0 erro e campo vazio).
  `src/js/modulos/69-v112-campo-duplicados-vazio.js`

## V111 — 2026-10-19

- **Duplicados excluídos automaticamente (XML ou PDF)**:
  - arquivo idêntico a outro já carregado (mesmo conteúdo, mesmo com nome diferente — ex.: "NF - 0038638 INTERTEK.pdf" e "… 08.2026.pdf") não é lido de novo: reaproveita a leitura do primeiro, sem OCR repetido;
  - documento duplicado (mesma chave de acesso / mesmo prestador e número) não entra nas abas e **sai da lista de erros**; a mensagem final informa "N duplicado(s) excluído(s) automaticamente". A relação dos excluídos fica em `state.duplicados`.
- **Contagem sempre visível nas abas** depois do processamento: aba sem itens mostra 0 em vez de ficar em branco.
- Teste no Edge com os 10 PDFs: 9 notas na aba ISS, "1 duplicado(s) excluído(s) automaticamente e 0 erro(s)", 27 s (o PDF repetido não passa de novo pelo OCR).
- Caso `tests/casos/v111-duplicados-automaticos`; referência de regressão: os 3 duplicados dos XMLs de teste deixam de contar como erro. PDFs de imagem dos casos V108/V109 viraram arquivos distintos (comentário no fim do PDF).
  `src/js/modulos/68-v111-duplicados-automaticos.js`

## V110 — 2026-10-19

- **O OCR nunca mais trava o processamento**: em alguns ambientes (ex.: visualizador do G4 OS) o OCR não dava erro — ficava esperando para sempre; como os arquivos são lidos em lotes, um PDF parado segurava o lote inteiro e nada era carregado (Itens 0, abas sem contagem).
  - Limite de 90 s para o OCR iniciar e de 90 s por página; PDF que não abre em 60 s vira erro.
  - Se o OCR não iniciar ou travar em 2 páginas seguidas, ele é desligado para o resto do processamento: os PDFs de imagem seguintes vão para a lista de erros com "OCR bloqueado neste ambiente — abra o arquivo DIAGNOSTICO no Chrome ou no Edge" e **todos os XMLs e PDFs com texto continuam carregando**, com as contagens nas abas.
  - A vaga da fila de OCR é sempre devolvida, mesmo com página travada.
  - Aviso vermelho no topo da tela quando o OCR estiver bloqueado.
- Testado no Edge com 9 XMLs + 10 PDFs: OCR normal (28 s, 114 itens, 9 NFS-e), OCR sem worker (71 s, mesmo resultado) e OCR travado (91 s, 106 itens, 1 NFS-e com texto, 9 PDFs de imagem na lista de erros com o aviso; antes ficava parado para sempre).
  `src/js/modulos/67-v110-ocr-sem-travar.js`; `tools/testar-ocr-edge.mjs` ganhou o modo `travado`

## V109 — 2026-10-19

- **OCR das NFS-e em PDF de imagem funciona em qualquer ambiente**: se o ambiente bloquear o worker do OCR (ex.: visualizador do G4 OS ou quadro isolado), o núcleo do Tesseract roda direto na página (TesseractCore + TessBaseAPI), com o mesmo dicionário de português embutido.
- **Mais rápido e sem estourar a memória com dezenas de PDFs**: grupo de workers de OCR, um por núcleo do processador (até 4), criados sob demanda, e fila de PDFs. A V108 criava um worker por PDF em andamento, sem limite. Teste no Edge com 60 PDFs (54 de imagem): 220 s (antes 625 s).
- **Andamento visível**: "Lendo NFS-e em PDF de imagem por OCR — arquivo · página p de q · arquivo n de total".
- **Aba ISS avisa os PDFs não lidos**: o resumo mostra "ATENÇÃO: N PDF(s) não lido(s)" com o motivo (lista completa na aba Carregar XMLs); duplicados não entram na conta.
- Testado no Edge: arquivo aberto direto, em quadro isolado e com o worker bloqueado — as 9 notas distintas dos 10 PDFs entram na aba ISS nos três casos.
- Caso `tests/casos/v109-iss-aviso-pdf-nao-lido`; `tools/testar-ocr-edge.mjs` (teste real no Edge).
  `src/js/modulos/66-v109-ocr-robusto.js`

## V108 — 2026-10-19

- **NFS-e em PDF de imagem (OCR embutido, sem internet)**: PDF sem camada de texto (ex.: gerado pelo "Microsoft: Print To PDF" ou digitalizado) é renderizado página a página pelo pdf.js e lido por OCR (Tesseract 7, português `best_int`), dentro do próprio HTML. A nota entra na aba ISS como "NFS-e (PDF)" e a nova coluna `leitura_pdf` informa "OCR (PDF de imagem) — conferir" (ou "Texto do PDF" / "XML"). Cerca de 4 s por página.
- **Detecção de NFS-e mais robusta**: deixa de tratar como DANFE notas com "NOTA FISCAL ELETRÔNICA" e "NCM" em qualquer ponto do texto e passa a reconhecer "NFSe" sem hífen e "NOTA FISCAL ELETRONICA DE SERVICOS" (ex.: Prefeitura de Barueri).
- **Leitor complementar de leiautes** (PDF com texto ou OCR): linhas de rótulos seguidas da linha de valores — Prefeitura de São Paulo (retenções, deduções, base, alíquota e ISS), Barueri (ISSQN, retenções e item com código do serviço e alíquota) e Caieiras (número "3.452/NFE" e retenções de INSS, IR, ISS e PIS/COFINS/CSLL). CSLL das "Contribuições Sociais - Retidas" = total ÷ 4,65; ISS sem valor impresso = base × alíquota. Números de nota normalizados (ex.: "3.346/NFSE" → 3346).
- **Nenhuma NFS-e fica de fora**: nota de serviço reconhecida, mas sem número nem valor legíveis, entra na aba ISS como "SEM NÚMERO", com `leitura_pdf` "Leitura parcial — conferir o PDF".
- Testado no Edge com 10 PDFs reais (9 de imagem): 9 notas na aba ISS e 1 duplicada (mesma nota da Intertek em dois arquivos).
- Caso `tests/casos/v108-nfse-pdf-ocr` (textos de OCR reais de São Paulo, Barueri e da FORT SYSTEM/Caieiras); `tools/navegador.mjs` aceita textos de OCR prontos (opção `ocr`), porque o jsdom não tem canvas nem worker.
  `src/js/modulos/65-v108-nfse-pdf-ocr.js`, `src/vendor/tesseract-7.0.0.min.js` e `src/vendor/ocr-dados-v108.js` (gerados por `tools/portar-ocr.mjs`)

## V107 — 2026-10-18

- **Aba ICMS ST — coluna `validacao_portaria_sre_34_2026`** (última coluna): a NCM de cada item é comparada com as NCMs dos **174 itens** excluídos do ICMS ST em São Paulo pela **Portaria SRE nº 34/2026** (Anexos VII, VIII, XIV, XVIII, XXI e XXII itens 2 a 10 e 15 da Portaria CAT nº 68/2019), conforme a tabela do Informativo Tax Advice de 24/09/2026.
  - Encontrada → **"NCM EXCLUÍDA DO ICMS ST EM 30/09/2026"**, com anexo, item, CEST e descrição legal.
  - Não encontrada → "NCM não consta da relação de itens excluídos do ICMS ST pela Portaria SRE nº 34/2026".
  - Comparação pelo código mais específico que casa com o início da NCM (a tabela traz posições de 4 a 8 dígitos); quando a mesma NCM está em mais de um anexo, o CEST do XML desempata; sem CEST, todos os itens possíveis são listados.
- Caso `tests/casos/v107-icms-st-sre34`.
  `src/js/modulos/64-v107-icms-st-portaria-sre-34-2026.js`

## V106 — 2026-10-18

- **Aba Base de PIS/COFINS — CSOSN 102 (Simples Nacional sem permissão de crédito) com a empresa do diagnóstico no Lucro Presumido**: validações de CST, base e valor de PIS/COFINS **VALIDADO**, sem cálculo (valores corretos = 0), e observação **"OPTANTE PELO SIMPLES NACIONAL"**.
- **Observações automáticas na aba Base de PIS/COFINS** (somadas às demais; o texto digitado pelo usuário prevalece):
  - venda CFOP 5107/6107 → **"VENDA NÃO CONTRIBUINTE"**;
  - CFOP 1656 → **"COMPRA PARA USO E CONSUMO"**;
  - entrada com CFOP 1556/2556 → **"USO E CONSUMO COM CRÉDITO"**.
- As compras de uso e consumo (1556/2556), que desde a V93 ficavam fora da aba Base de PIS/COFINS, voltam para essa aba com a validação normal (com crédito). ICMS ST, IPI, IBS/CBS e Dashboard continuam como na V93.
- Caso `tests/casos/v106-pis-cofins-observacoes`; casos V92/V93 ajustados.
  `src/js/modulos/63-v106-pis-cofins-observacoes-simples-uso.js`

## V105 — 2026-10-18

- **Aba Base de IBS/CBS — Imposto Seletivo (IS)**, grupo `<IS>` da NF-e (NT 2025.002): colunas `cst_is`, `cclasstrib_is`, `base_is`, `aliquota_is` e `valor_is` logo depois dos valores de IBS e CBS.
- **Validações do IS** (LC 214/2025, Livro II), logo depois de `validacao_cbs`: `validacao_cst_is`, `validacao_base_is`, `validacao_is` e `valor_correto_is` (margem R$ 0,05):
  - vigência: IS cobrado a partir de 01/01/2027 — antes disso o grupo é opcional e IS destacado = NÃO VALIDADO;
  - incidência: NCM do Anexo XVII (veículos 87.03/87.04, aeronaves 88.02, embarcações 89.03, fumígenos 24.02/24.03, bebidas alcoólicas 22.03–22.06 e 22.08, bebidas açucaradas 2202.10/2202.99, bens minerais 26.01, 27.01, 27.09, 27.11); NCM sujeito sem grupo IS a partir de 2027 ou NCM fora do Anexo com IS = NÃO VALIDADO;
  - CST: com valor de IS deve ser 000 (tributada); CST 000 com base e alíquota, mas sem valor = NÃO VALIDADO;
  - base: valor da operação = produtos + frete + seguro + outras despesas − desconto incondicional (não integram IBS, CBS e o próprio IS); também aceita a conta sem ICMS, PIS e COFINS;
  - valor: base × alíquota ad valorem + quantidade × alíquota específica.
- **Dashboard**: quadro "Imposto Seletivo (IS)" logo abaixo do quadro de IBS e CBS (Resumo geral), com ENTRADAS e SAÍDAS por CST e alíquota (base, valor e quantidade de itens).
- DIFAL na base de IBS/CBS (V76) conferido: só subtrai vICMSUFDest e vFCPUFDest quando o grupo ICMSUFDest existe (venda a não contribuinte, EC 87/2015); na venda a contribuinte só o ICMS próprio é deduzido.
- Caso `tests/casos/v105-imposto-seletivo` (notas de 2026 e 2027).
  `src/js/modulos/62-v105-imposto-seletivo.js`

## V104 — 2026-10-16

- **Aba ICMS — regime_tributario 1 (Não Optante — Lucro Presumido ou Lucro Real, ex.: pelo CRT 3)**: o valor de `valor_outras_despesas` **não compõe a base de ICMS**. A base é validada de novo: produtos − desconto + frete + seguro (+ IPI, só se a base do XML o trouxer), com a redução do pRedBC; ICMS = base × alíquota (margem R$ 0,05). NÃO VALIDADO mostra a base correta e a "diferença:".
- A observação recebe **"Outras despesas R$ X não compõem a base de ICMS"** (o texto digitado pelo usuário prevalece).
- Só operações internas e interestaduais (cfop_xml 1, 2, 5, 6); importação segue a V95. Devolução 5202/6202, consumidor final e uso e consumo já tiravam as outras despesas da base; ZFM (V99/V101) e base de todos os itens em um item (V101) não são recalculadas. Simples Nacional (opção 3) segue a V100 (outras despesas = IPI).
- Caso `tests/casos/v104-regime1-outras-fora-base`; casos V62/V63 atualizados (emitentes do regime 1 com outras despesas).
  `src/js/modulos/61-v104-regime1-outras-fora-base.js` e `57-v100-simples-outras-ipi-nota-1632.js` (comentário V104)

## V103 — 2026-10-16

- **Alíquota de ICMS calculada**: quando o XML traz base (vBC) e valor (vICMS) de ICMS, mas não traz a alíquota (pICMS), `aliquota_icms` = valor do ICMS ÷ base × 100 (2 casas). Vale para a aba **Itens**, a aba **ICMS** (as validações usam essa alíquota) e o **Dashboard** (quadros por alíquota).
- **Regime opção 3 (Optante ME/EPP — Simples Nacional)**: observação **"SIMPLES NACIONAL"** na aba **Itens** (coluna `observacao` nova, no fim) e na aba **ICMS** (somada às demais observações; o texto digitado pelo usuário prevalece).
- Caso `tests/casos/v103-aliquota-icms-calculada-simples`; caso V85 atualizado (itens do Simples com a observação SIMPLES NACIONAL).
  `src/js/modulos/60-v103-aliquota-icms-calculada-simples.js`

## V102 — 2026-10-16

- **Aba IPI — IPI devolvido** (`<impostoDevol><IPI><vIPIDevol>`): o valor vai para `valor_ipi_xml`; base e alíquota de IPI não são validadas (validações VALIDADO, `valor_correto_ipi` = 0) e a observação traz **"DEVOLUÇÃO — IPI devolvido R$ X"** (o texto digitado pelo usuário prevalece). Item sem grupo de IPI, mas com vIPIDevol, também entra na aba IPI.
- **Dashboard — PIS/COFINS, empresa do Lucro Real** (campo "Regime tributário" dos dados iniciais): nas **ENTRADAS**, alíquota de PIS **1,65%** e de COFINS **7,60%**, com valor = base × alíquota (crédito da não cumulatividade); saídas com os valores do XML; "Entradas (−) Saídas" = créditos − débitos. Vale para o quadro PIS/COFINS do Resumo geral, as seções PIS e COFINS e o gráfico. Lucro Presumido segue a V65.
- Caso `tests/casos/v102-ipi-devolucao-pis-cofins-lucro-real` (NF-e 199 com vIPIDevol e entrada de fornecedor do Lucro Presumido a 0,65%/3%).
  `src/js/modulos/59-v102-ipi-devolucao-pis-cofins-lucro-real.js`

## V101 — 2026-10-16

- **Aba ICMS — colunas `destinatario_municipio` e `destinatario_uf`** (as mesmas da aba Itens) logo depois de `cnpj_destinatario`.
- **Aba ICMS — destinatário na Zona Franca de Manaus / Área de Livre Comércio**, em operação interestadual: AM, AC, RO e RR (inclusive as ALC de Tabatinga, Brasiléia, Epitaciolândia, Cruzeiro do Sul, Guajará-Mirim, Boa Vista e Bonfim) e, no Amapá, Macapá e Santana:
  - a base de ICMS do XML (`base_icms_xml`) é a base correta (`base_icms_calculada` e `base_correta_icms` = base do XML);
  - validações de base e de ICMS **VALIDADO** e observação **"OPERAÇÃO COM ZFM"** (o texto digitado pelo usuário continua prevalecendo);
  - CFOP 6110 segue a V99 (ZONA FRANCA); outras cidades do Amapá e operações internas não entram na regra.
- **Aba ICMS — XML com mais de um item e base de todos os itens lançada em um só item** (ex.: NF-e 199): a base desse item é conferida com a soma dos itens da nota (produtos − desconto + frete + seguro + outras, com ou sem IPI, com a redução) → **VALIDADO**; ICMS = base do XML × alíquota. Os demais itens da nota recebem a observação de onde está a base. Vale para todos os XML.
- Caso `tests/casos/v101-icms-destinatario-zfm-base-todos-itens` (NF-e 199 real e XMLs para Manaus/AM, Macapá/AP e Oiapoque/AP).
  `src/js/modulos/58-v101-icms-destinatario-zfm-base-todos-itens.js`

## V100 — 2026-10-15

- **Aba ICMS — regime_tributario opção 3 (Optante ME/EPP, Simples Nacional)**: o valor de `valor_outras_despesas` é o IPI e passa para `valor_ipi` (somado ao IPI destacado, se houver); `valor_outras_despesas` fica 0. A base é validada de novo: produtos − desconto + frete + seguro (+ IPI, só se a base do XML trouxer o IPI), com a redução do pRedBC; ICMS = base × alíquota. CSOSN sem base (ex.: 102) continua VALIDADO.
- **Aba ICMS — nota 1632**: o valor de `reducao_base_icms` é excluído (fica 0) e a base é validada sem redução, seguindo as demais regras.
- Vale para operações internas/interestaduais (cfop_xml 1, 2, 5, 6) com ICMS na base; não se aplica a compra de uso e consumo nem a ZFM (6110). Saída com desconto não abatido segue a V98.
- Caso `tests/casos/v100-simples-outras-ipi-nota-1632` (3 XMLs).
  `src/js/modulos/57-v100-simples-outras-ipi-nota-1632.js`

## V99 — 2026-10-15

- **CFOP 6110 — venda de mercadoria adquirida ou recebida de terceiros, destinada à ZFM ou ALC**:
  - descrição completa na tabela de CFOP (estava truncada) e a mesma descrição para o 2110;
  - conversão cfop_xml → cfop: **6110 → 2110** (entradas e saídas), na aba Itens e nas abas de impostos;
  - **aba ICMS**: todas as validações **VALIDADO**, sem novo cálculo (base e valor corretos = 0), e observação **"ZONA FRANCA"** (o texto digitado pelo usuário continua prevalecendo);
  - a venda para ZFM/ALC não é tratada como uso e consumo.
- Caso `tests/casos/v99-cfop-6110-zona-franca` (saída e entrada).
  `src/js/modulos/56-v99-cfop-6110-zona-franca.js`

## V98 — 2026-10-14

- **Aba ICMS — notas de SAÍDA com desconto não abatido da base**: quando o XML traz desconto (vDesc) e a base de ICMS do XML não o abateu (base do XML − base calculada = desconto, ou desconto × (1 − % redução)), a base fica **VALIDADO** e o ICMS é conferido como **base do XML × alíquota** (margem R$ 0,05).
- Nas **entradas** continua a regra da V97: o desconto subtrai da base e a diferença fica NÃO VALIDADO.
- Caso `tests/casos/v98-saida-desconto`; itens de saída do caso V97 com desconto não abatido passam a VALIDADO.
  `src/js/modulos/55-v98-saida-desconto-nao-abatido.js`

## V97 — 2026-10-14

- **Aba ICMS — desconto sempre subtrai da base**: valor total dos produtos (−) desconto (vDesc), em todas as regras de base de ICMS.
  - Já subtraíam: regra base (V14), operação própria interna/interestadual (V62/V63) e devolução 5202/6202 (V96).
  - Passam a subtrair: uso e consumo (V90/V92: produtos − desconto + IPI), consumidor final (V91: produtos − desconto + frete + IPI; V96 sem IPI na base: produtos − desconto + frete) e importação quando o valor aduaneiro vem dos produtos (V95/V96: produtos + frete + seguro − desconto).
  - O desconto aparece na conta da validação quando houver; XML que somou o IPI sem subtrair o desconto continua reconhecido como IPI na base e fica NÃO VALIDADO com a "diferença:".
- Caso `tests/casos/v97-desconto-base-icms` (3 XMLs).
  `src/js/modulos/54-v97-desconto-base-icms.js` e módulos 47, 48, 49, 52 e 53 (comentários V97)

## V96 — 2026-10-14

- **Aba ICMS — devolução de compra (cfop_xml 5202/6202)**: outras despesas **não** compõem a base. Base = (produtos − desconto + frete + seguro [+ IPI, só se o XML trouxer o IPI na base]) × (1 − % redução); ICMS = base × alíquota (margem R$ 0,05). A devolução não é tratada como uso e consumo.
- **Aba IPI — devolução de compra (cfop_xml 5202/6202)**: o valor de outras despesas (vOutro) é o IPI devolvido e vai para `valor_ipi_xml`. Com base e alíquota de IPI no XML, valida outras despesas = base × alíquota; sem grupo de IPI, VALIDADO (IPI devolvido em outras despesas). Item de devolução sem grupo de IPI, mas com outras despesas, também entra na aba IPI.
- **Aba ICMS — IPI só na base quando o XML traz assim**: consumidor final (V91) com o IPI fora da base do XML → base = produtos + frete; importação (V95) com o IPI fora da base do XML → a conta sem o IPI também é aceita. Nas demais operações o IPI já ficava fora (V62/V63) e, quando o XML o inclui, valem as regras de uso e consumo (V90/V92/V93).
- Caso `tests/casos/v96-devolucao-ipi-base` (3 XMLs); item 2 do caso V91 (base do XML sem IPI) passa a VALIDADO.
  `src/js/modulos/53-v96-devolucao-5202-ipi-no-xml.js`

## V95 — 2026-10-14

- **Aba ICMS — operação própria** (venda interna ou interestadual, entradas e saídas) com IPI fora da base do XML: BC = mercadoria + frete + seguro + outras despesas (juros e demais despesas cobradas do comprador) − desconto incondicional (vDesc), com a redução do pRedBC; ICMS = BC × alíquota. É a regra da V62/V63, mantida. Com IPI na base seguem as regras de uso e consumo (V90/V92/V93) e de consumidor final (V91).
- **Aba ICMS — importação** (cfop_xml 3xxx), substitui a regra da V59/V60: **BC = (valor aduaneiro + II + IPI + PIS-Importação + COFINS-Importação + IOF + despesas aduaneiras) ÷ (1 − alíquota)**, com a redução do pRedBC; ICMS = BC × alíquota; margem R$ 0,05.
  - Valor aduaneiro = vBC do grupo II; também é aceito produtos + frete + seguro (frete e seguro internacionais fora do vBC do II).
  - Despesas aduaneiras = vDespAdu; também é aceita a conta com as outras despesas (vOutro), quando o importador lança Siscomex/AFRMM/capatazia nesse campo.
  - NÃO VALIDADO mostra a base correta e a "diferença:".
- Caso `tests/casos/v95-importacao-por-dentro`; casos V60/V61 (XML montado sem o ICMS por dentro) passam a NÃO VALIDADO com a base correta da nova regra.
  `src/js/modulos/52-v95-icms-importacao-por-dentro.js`

## V94 — 2026-10-14

- **CFOP das entradas (aba Itens e todas as abas)**: `cfop_xml` iniciado em 5 → `cfop` iniciado em 1, 6 → 2, 7 → 3, com o mesmo final (regra da V17, mantida e testada).
- **Compra de uso e consumo**: `cfop_xml` 5xxx → **1556**, 6xxx → **2556** e agora 7xxx → **3556** (antes o 7 caía em 1556). O reconhecimento de uso e consumo (IPI na base de ICMS) passa a valer também para entradas com `cfop_xml` 7xxx.
- Saídas da empresa mantêm o próprio CFOP.
- Caso `tests/casos/v94-cfop-entradas-uso-consumo`.
  `src/js/modulos/51-v94-cfop-uso-consumo-3556.js` e `49-v92-compra-uso-consumo-sem-credito.js` (comentário V94)

## V93 — 2026-10-13

- **Aba Itens**: coluna `uso_e_consumo` logo depois de `cfop` — "USO E CONSUMO" quando o XML tem IPI e o IPI compõe a base de ICMS. Nas compras de uso e consumo o `cfop` é **1556** (dentro do estado) ou **2556** (fora do estado), qualquer que seja o `cfop_xml`.
- **Abas de impostos**: a coluna `uso_e_consumo` passa a ficar logo depois de `cfop`.
- **Compra de uso e consumo (entrada)**:
  - aba ICMS: os impostos do XML aparecem, sem validação (tudo VALIDADO, nada recalculado), e a observação recebe **"USO E CONSUMO"** (mais "CST informado divergente do uso" quando a CST do ICMS é tributada);
  - abas ICMS ST, IPI, Base de PIS/COFINS e Base de IBS/CBS: o item não entra — nenhuma informação de imposto segue para as outras abas;
  - Dashboard e apresentação: nenhum valor de imposto do item; no quadro de ICMS ele aparece no CFOP 1556/2556 só com o valor dos produtos (base e ICMS zerados).
- Caso `tests/casos/v93-uso-consumo-itens-dashboard`; casos V90/V92 ajustados (coluna depois de cfop; item fora das demais abas).
  `src/js/modulos/50-v93-uso-consumo-itens-dashboard.js`

## V92 — 2026-10-13

- **Compra de uso e consumo**: toda ENTRADA em que a base de ICMS do XML inclui o IPI é marcada `uso_e_consumo` = "USO E CONSUMO" (reconhecimento da V90, agora também para base = produtos + frete + IPI).
- **CFOP da entrada**: sempre **1556** (fornecedor do estado — CFOP 5xxx) ou **2556** (interestadual — CFOP 6xxx), qualquer que seja a correlação normal; vale para a aba Itens e todas as abas de impostos.
- **Sem crédito de nenhum imposto**: nas abas ICMS, ICMS ST, IPI, Base de PIS/COFINS e Base de IBS/CBS todas as validações ficam **VALIDADO** e nada é recalculado (base/valor corretos = 0), qualquer que seja a CST do XML.
- **Observação**: se a CST do XML daquele imposto for tributada (ou houver imposto destacado), a coluna `observacao` recebe **"CST informado divergente do uso"** (o texto digitado pelo usuário continua prevalecendo).
- Caso `tests/casos/v92-compra-uso-consumo`; item 3 do caso V62 (compra com IPI na base) passa a uso e consumo sem crédito.
  `src/js/modulos/49-v92-compra-uso-consumo-sem-credito.js`

## V91 — 2026-10-13

- **Aba ICMS — venda para consumidor final**: NF-e com `<indFinal>1</indFinal>`, CFOP 1xxx, 2xxx, 5xxx ou 6xxx e CST tributada → **base de ICMS = produtos + frete + IPI** (com a redução do pRedBC, quando houver); o ICMS é recalculado sobre essa base (margem R$ 0,05). NÃO VALIDADO mostra a base correta e a "diferença:". Nesses itens a regra prevalece sobre a V62/V63 e sobre a V90 (uso e consumo).
- A leitura do XML passa a guardar `ind_final` (1 = consumidor final, 0 = normal) no item — aparece na aba Itens.
- Caso `tests/casos/v91-consumidor-final`; o XML do caso V90 passou a `indFinal` 0 (operação normal), para continuar testando só a regra de uso e consumo.
  `src/js/modulos/48-v91-icms-consumidor-final.js`

## V90 — 2026-10-12

- **Aba ICMS — IPI incluso na base de ICMS = USO E CONSUMO**: quando a base de ICMS do XML inclui o valor do IPI (CFOP 1xxx, 2xxx, 5xxx, 6xxx com IPI destacado), o item recebe a nova coluna `uso_e_consumo` = **"USO E CONSUMO"** e, somente neste caso, a base é validada por **produtos + IPI** (com a redução do pRedBC, quando houver); o ICMS é recalculado sobre essa base (margem R$ 0,05). NÃO VALIDADO mostra a base correta e a "diferença:".
- Reconhecimento: base do XML = produtos + IPI, ou produtos − desconto + frete + seguro + outras + IPI, e diferente da base sem o IPI. Nos demais itens a regra da V62/V63 continua (IPI fora da base).
- **Demais abas de impostos** (ICMS ST, IPI, Base de PIS/COFINS, Base de IBS/CBS): a mesma coluna `uso_e_consumo`, logo depois de `cfop_xml` (no ICMS ST, depois de `cfop`), com filtro.
- Casos `tests/casos/v90-uso-consumo` e `v90-uso-consumo-coluna`; item 3 do caso V62 (IPI somado na base) passa a ser USO E CONSUMO validado.
  `src/js/modulos/47-v90-ipi-base-uso-consumo.js`

## V89 — 2026-10-12

- **Carga de arquivos aceita XML e PDF.** O PDF de NFS-e é lido no próprio navegador, sem internet: pdf.js 3.11.174 embutido + leitor de NFS-e do Motor de Cálculo (DANFSe nacional v2.0 e layouts municipais), portado por `tools/portar-nfse-motor.mjs` (Motor 37989db). PDF de NF-e (DANFE) ou de CT-e (DACTE) não é lido (use o XML); PDF digitalizado como imagem ou que não seja nota de serviço vira erro de leitura com o motivo.
- **XML de NFS-e**: padrão nacional (infNFSe/DPS) e ABRASF (InfNfse/CompNfse).
- **Aba Itens**: coluna `tipo_de_documento` logo antes de `arquivo_origem` — NF-e (modelo 55), NFC-e (modelo 65), CT-e (modelo 57), NFS-e ou NFS-e (PDF).
- **Aba ISS (nova, antes da aba ICMS)**: número da nota, data de emissão, emitente, destinatário, municípios do emitente e do destinatário, código do serviço, NBS, valor do serviço, dedução, alíquota/base/valor de ISS, ISS retido (SIM/NÃO), base/alíquota/valor de INSS, valor/alíquota de IR/IRRF e de CSLL, base de IBS e de CBS, CST IBS/CBS, cClassTrib, alíquotas de IBS e de CBS, IBS estadual, IBS municipal e CBS. Alíquotas de INSS, IR e CSLL calculadas sobre o valor do serviço quando a nota traz só o valor retido. Filtros por coluna e exportação em Excel.
- **Dashboard**: quadro "Notas de serviço (NFS-e)" antes do ICMS, com Entradas/Saídas/Total.
- **Apresentação**: slide "NOTAS DE SERVIÇO (NFS-e)" depois do Saldo por imposto (só quando há NFS-e).
- Casos `tests/casos/v89-nfse-iss` (2 XMLs + 3 PDFs reais) e `v89-tipo-documento-itens`; casos V70/V73 ajustados à nova coluna.
  `src/js/modulos/46-v89-nfse-xml-pdf-iss.js`, `src/vendor/` (pdf.js, motor-nfse.js) e `src/js/apresentacao/gerador-pptx.js` (slide 4b)

## V88 — 2026-10-12

- **Aba ICMS — base com redução (pRedBC) NÃO VALIDADA**: o texto da validação passa a mostrar a diferença em relação à base do XML (ex.: "… × (1 − 33,33%) = R$ 6.667,00) diferença: -R$ 0,33") e a coluna `observacao` recebe **"Erro de cálculo de arredondamento"**.
- **Aba Base de IBS/CBS**: base NÃO VALIDADA cuja diferença é igual a IBS + CBS (margem de R$ 0,05) → observação **"Cálculo errado excluindo o valor de IBS e CBS"**.
- **Dashboard — eventos sem detalhe por nota**: a aba Eventos do Dashboard deixa de carregar as tabelas ENTRADAS/SAÍDAS nota a nota (fica com os totais e o resumo por tpEvento/descEvento); o quadro do Resumo geral perde o botão "Ver todos os eventos".
- Em todas as observações automáticas, o texto digitado pelo usuário substitui o padrão.
- Caso `tests/casos/v88-arredondamento-ibs`; casos de eventos ajustados.
  `src/js/modulos/45-v88-obs-arredondamento-ibs.js`, `31-v70-eventos-nfe.js` e `33-v72-dashboard-quadro-eventos.js` (comentários V88)

## V87 — 2026-10-12

- **Dashboard › quadro "Eventos das notas fiscais"** (ao lado de Montante por imposto): passa a mostrar somente o resumo — totais (eventos, notas, entradas × saídas, cancelamentos) e a tabela por `tpEvento` e `descEvento` com entradas e saídas. A lista "Notas com evento" foi retirada; o detalhamento por nota continua na aba Eventos do Dashboard (botão "Ver todos os eventos").
- **Apresentação — slide "Eventos das notas fiscais"**: traz o mesmo resumo (cartões de eventos, notas, entradas · saídas e cancelamentos, e a tabela por tpEvento/descEvento com entradas, saídas e total), no lugar das listas de notas.
- Casos `v70-eventos-dashboard` e `v72-quadro-eventos-dashboard` ajustados.
  `src/js/modulos/33-v72-dashboard-quadro-eventos.js`, `31-v70-eventos-nfe.js` e `src/js/apresentacao/gerador-pptx.js` (comentários V87)

## V86 — 2026-10-12

Observações automáticas na coluna `observacao` (o texto digitado pelo usuário sempre substitui o padrão; mais de um padrão no mesmo item é unido por " | "):
- **Base de PIS/COFINS** — com `validacao_cst_pis` "NÃO VALIDADO (CST 01 tributado, mas o XML não traz valor do imposto)":
  - `descricao_cst_icms` "Tributada integralmente" → **"CST do XML como tributado, porém sem valor do imposto"**;
  - `descricao_cst_icms` "Não tributada pelo Simples Nacional" → **"CST como tributado, mas deve ser CST 99 (Outras Operações)"**.
- **Base de IBS/CBS**:
  - base NÃO VALIDADA cuja diferença é igual a PIS + COFINS (margem de R$ 0,05) → **"Valor da base não deduziu o valor de PIS e da COFINS"**;
  - cClassTrib divergente do candidato do NCM (V83) → `validacao_cclasstrib` e `validacao_ncm_cclasstrib` passam a **VALIDADO**, com a observação **"Analisar cClassTrib"**;
  - bonificação (CFOP 5910/6910) com CST ou cClassTrib divergente → `validacao_ncm_cclasstrib` **NÃO VALIDADO** (vermelho), com a observação **"Bonificação CST 410 cClassTrib 410999"**. O cClassTrib 410999 passa a ser aceito na bonificação, junto com 410001 e 410003.
- Casos `v86-observacoes-automaticas` (novo), `v75-observacao-piscofins`, `v80-cst-410-por-cfop` e `v84-tributacao-integral` (ajustados).
  `src/js/modulos/44-v86-observacoes-automaticas.js` e `38-v78-cfop-6911-amostra-gratis.js` (comentário V86)

## V85 — 2026-10-12

- **Aba ICMS — coluna `regime_tributario`** logo após `nome_emitente`, com a mesma informação da aba Itens (opSimpNac ou CRT do emitente; ex.: "3 — Optante - ME / EPP (… ) (pelo CRT 1)", "1 — Não Optante (Lucro Presumido ou Lucro Real)").
- **Simples Nacional sem frete no XML**: quando o regime é Simples Nacional (códigos 2 MEI, 3 ME/EPP e 4 pendente de homologação) e o item não traz `vFrete`, a coluna `observacao` vem preenchida com **"Valor do frete não destacado no XML"** (o texto digitado pelo usuário substitui o padrão). Item do Simples com frete destacado e demais regimes: observação em branco.
- Caso `tests/casos/v85-icms-regime-frete-simples`.
  `src/js/modulos/43-v85-icms-regime-frete-simples.js`

## V84 — 2026-10-12

- **Base de IBS/CBS — tributação integral em NCM com cClassTrib candidato** (CST 000 no XML e o NCM com candidato de benefício, ex.: 000001 × 200033 / 200034): não é inconsistência. `validacao_ncm_cclasstrib`, `validacao_cclasstrib`, `validacao_cst_ibs_cbs`, `validacao_base_ibs_cbs`, `validacao_ibs` e `validacao_cbs` ficam **VALIDADO** (verde) — "VALIDADO (tributação integral — o NCM tem cClassTrib candidato …; analisar cClassTrib)" —, nada é recalculado (`base_correta_ibs_cbs`, `valor_correto_ibs` e `valor_correto_cbs` = 0) e a coluna `observacao` vem preenchida com **"Analisar cClassTrib"** (o texto digitado pelo usuário substitui o padrão).
- Ajusta a V83: cClassTrib de benefício diferente do candidato (ex.: 200014 × 200033) continua NÃO VALIDADO.
- Efeito nos XMLs reais de teste: os 5 itens de 2 notas marcados na V83 voltam a VALIDADO (inclusive o `validacao_cst_ibs_cbs`, que já era NÃO VALIDADO pelo CST candidato 200) e saem das inconsistências, com "Analisar cClassTrib" na observação.
- Casos `v83-cclasstrib-candidato` (ajustado) e `v84-tributacao-integral`.
  `src/js/modulos/42-v84-tributacao-integral-analisar.js`

## V83 — 2026-10-12

- **Base de IBS/CBS — cClassTrib fora do candidato do NCM**: quando o cClassTrib do XML não está entre os códigos de `cclasstrib_candidato_capitulo`, as colunas `validacao_cclasstrib` e `validacao_ncm_cclasstrib` ficam **NÃO VALIDADO** — ex.: "NÃO VALIDADO (cClassTrib 000001 do XML diverge do cClassTrib candidato para o NCM 21069090: 200033 / 200034)". Antes ficavam VALIDADO com o aviso "confirme se o item tem benefício".
- Não se aplica quando o NCM não tem candidato, às CST de operação (não dependem do NCM, ex.: 410, 550, 620) e às operações com regra própria por CFOP (amostra grátis, bonificação/doação, exportação, perda/roubo).
- Efeito nos XMLs reais de teste: 5 itens de 2 notas (cClassTrib 000001 em NCM com candidato 200xxx) passam a NÃO VALIDADO nas duas colunas e entram nas inconsistências do Dashboard e da apresentação.
- Caso `tests/casos/v83-cclasstrib-candidato`.
  `src/js/modulos/41-v83-cclasstrib-candidato-divergente.js`

## V82 — 2026-10-12

- **Regra única da base de PIS/COFINS**: Base = vProd + vFrete + vSeg + vOutro − vDesc − vICMS − vICMSUFDest, para as CST 01, 02 e 50–56 (nas 50–56, quando o XML traz base), margem de R$ 0,05. O texto do NÃO VALIDADO mostra a conta completa e a diferença; o PIS e a COFINS são conferidos sobre a base do XML (validada) ou sobre a base correta.
- Substitui as variações anteriores: aceitar "valor dos produtos − ICMS" sem frete/seguro/outras (V38/V56); "valor total dos produtos" no Simples Nacional e no ICMS-ST (V58); DIFAL só quando houvesse (V77). Agora tudo segue a mesma fórmula — ex.: Simples com frete passa a exigir o frete na base.
- Continuam com as regras próprias: importação (CFOP 3xxx, valor aduaneiro), CST não tributada (04–09, 70–75), CST 03 (por quantidade) e base abaixo de R$ 0,05 sem valor (VALIDADO).
- Nos XMLs reais de teste, nenhuma mudança de status. Caso `tests/casos/v82-base-pis-cofins-formula` (base correta; XML sem frete/despesas; Simples com frete; CST 06).
  `src/js/modulos/40-v82-base-pis-cofins-formula.js`

## V81 — 2026-10-12

- **Filtro ▾ da coluna `observacao`** (abas ICMS, IPI, Base de PIS/COFINS e Base de IBS/CBS): a lista passa a trazer também **"(sem observação)"**, para selecionar os itens sem texto. Antes, só apareciam os textos digitados e não dava para filtrar (ou manter) os itens em branco.
- Casos `tests/casos/v81-filtro-observacao-*` (só sem observação; só com texto).
  `src/js/modulos/39-v81-filtro-observacao-vazia.js`

## V80 — 2026-10-12

Base de IBS/CBS — operações com **CST 410** (imunidade e não incidência), sem base e sem IBS/CBS, com o cClassTrib conferido pelo CFOP do XML:

| CFOP | Operação | cClassTrib aceito |
|---|---|---|
| 5911, 6911 | amostra grátis (V78/V79) | 410999 |
| 5910, 6910 | bonificação, doação ou brinde | 410001 ou 410003 |
| 7101, 7102, 7105, 7106, 7127, 7501, 7949 | exportação | 410004 ou 410027 |
| 5927 | baixa por perda, roubo ou perecimento | 410030 |
| qualquer, com cClassTrib 410037 | importação de bens materiais sem incidência | 410037 (só confere CST 410, sem base e sem IBS/CBS) |

- Cada validação aponta o que estiver diferente (CST, cClassTrib, base e valores destacados, com a diferença). NCM × cClassTrib não se aplica a essas operações. Nas entradas vale o CFOP original do XML (ex.: fornecedor com 5910).
- Definições confirmadas pelo usuário: 5910/6910 aceita 410001 ou 410003; exportação aceita 410004 ou 410027; 5927 → 410030; 410037 só com a conferência de CST 410 sem base e valor.
- Caso `tests/casos/v80-cst-410-por-cfop` (11 itens).
  `src/js/modulos/38-v78-cfop-6911-amostra-gratis.js` (tabela V80)

## V79 — 2026-10-12

- **Base de IBS/CBS — CFOP 5911 (amostra grátis dentro do estado)**: mesma regra do CFOP 6911 (V78) — CST 410, cClassTrib 410999, sem base e sem IBS/CBS; cada validação aponta o que estiver diferente.
- Caso `tests/casos/v79-cfop-5911-amostra-gratis`.
  `src/js/modulos/38-v78-cfop-6911-amostra-gratis.js` (comentário V79)

## V78 — 2026-10-12

- **Base de IBS/CBS — CFOP 6911 (remessa de amostra grátis)**: o item deve vir com **CST 410** e **cClassTrib 410999**; CST 410 não tem base nem valor de IBS/CBS. Cada validação aponta o que estiver diferente: CST ("o XML traz CST 000"), cClassTrib ("o XML traz cClassTrib 000001"), base e valores destacados (NÃO VALIDADO, com a diferença; o correto é zero). Com tudo certo, todas as validações ficam "VALIDADO (CFOP 6911 — amostra grátis …)". A validação NCM × cClassTrib não se aplica (não depende do NCM).
- Nas entradas, vale pelo CFOP original do XML (6911). Os demais CFOP não mudam.
- Antes, um item 6911 com CST 000 e IBS/CBS destacados, ou com cClassTrib diferente de 410999, passava como VALIDADO.
- Caso `tests/casos/v78-cfop-6911-amostra-gratis`.
  `src/js/modulos/38-v78-cfop-6911-amostra-gratis.js`

## V77 — 2026-10-12

- **Coluna `valor_icms_difal`** (ICMS devido à UF de destino: `vICMSUFDest` + `vICMSUFRemet`) logo após `valor_icms_xml` nas abas **ICMS** e **Base de PIS/COFINS**. Na aba Base de IBS/CBS ela já fica após `valor_icms` (V76, junto com `valor_fcp_difal`).
- **Base de PIS/COFINS sem o ICMS DIFAL**: base = valor da operação − ICMS destacado − ICMS DIFAL (aceita também valor dos produtos − ICMS − DIFAL), margem de R$ 0,05. Base NÃO VALIDADA mostra a base correta e a diferença; o PIS e a COFINS são conferidos sobre a base do XML (quando validada) ou sobre a base correta. Vale para CST 01, 02 e 50–56; Simples Nacional e importação seguem as regras próprias.
- **Base de IBS/CBS**: o DIFAL (e o FCP do DIFAL) continua excluído (V76).
- Nos XMLs reais de teste, nenhuma mudança de status (não têm DIFAL). Casos `tests/casos/v77-*`.
  `src/js/modulos/37-v77-difal-icms-pis-cofins.js`

## V76 — 2026-10-12

- **Base de IBS/CBS sem o ICMS DIFAL**: o ICMS devido à UF de destino (`vICMSUFDest`, mais `vICMSUFRemet` quando houver) e o FCP do DIFAL (`vFCPUFDest`) passam a ser excluídos da base calculada (NT 2025.002). Base = produtos + frete + seguro + juros + multa + outras despesas + desconto condicional + IS − desconto incondicional − ICMS − ICMS DIFAL − FCP do DIFAL − ISS − PIS − COFINS.
- Correção: a fórmula do Art. 12 (V54/V55) tinha deixado de excluir o DIFAL que a V14 já excluía — a nota com a base certa ficava NÃO VALIDADO e a que não tirava o DIFAL passava como VALIDADO.
- **Colunas novas** `valor_icms_difal` e `valor_fcp_difal` logo após `valor_icms`.
- **Validação após a correção**: com a base NÃO VALIDADA, o IBS e a CBS passam a ser conferidos sobre a base correta (alíquotas do XML, margem de R$ 0,05), com o valor correto e a diferença — ex.: "NÃO VALIDADO (CBS sobre a base correta: R$ 800,00 × 0,90% = R$ 7,20) diferença: R$ 0,72". Itens com redução de alíquota (gRed) seguem a regra anterior.
- Nos XMLs reais de teste, nenhuma mudança de status. Caso `tests/casos/v76-difal-base-ibs-cbs`.
  `src/js/modulos/36-v76-ibs-sem-difal.js`

## V75 — 2026-10-12

- **Abas IPI, Base de PIS/COFINS e Base de IBS/CBS — coluna `observacao`** como última coluna, com campo para digitar, igual à aba ICMS (V71). Cada aba tem as suas observações, guardadas por item (chave da nota + número do item); continuam ao trocar de aba, vão para o Excel e são salvas/importadas com o arquivo `.diagnostico`. Enter confirma.
- Aba ICMS sem mudança (observação após `base_correta_icms`); diagnósticos salvos na V71–V74 abrem com as observações de ICMS.
- Casos `tests/casos/v75-observacao-*` (texto do usuário e posição como última coluna).
  `src/js/modulos/32-v71-observacao-icms-filtro-eventos.js` (comentário V75)

## V74 — 2026-10-12

- **Aba Base de IBS/CBS**: as colunas `cclasstrib` e `cst_ibs_cbs` passam a ficar logo após `valor_imposto_seletivo_is` (fim dos componentes da base), antes de `base_ibs_cbs_xml`. `descricao_cst_ibs_cbs` e `percentual_reducao_aliquota` continuam onde estavam (após `valor_total_produtos`). Só muda a ordem; valores e validações iguais. Vale para a tela, o filtro, o Excel e a impressão.
- Caso `tests/casos/v74-ibs-cst-cclasstrib-apos-is`; caso da V73 ajustado.
  `src/js/modulos/35-v74-ibs-cst-cclasstrib-apos-is.js`

## V73 — 2026-10-12

- **Aba Base de IBS/CBS**: a coluna `valor_total_produtos` (valor total dos produtos do item) passa a ficar logo após `ncm` (antes ficava depois de `cclasstrib`). Mesmo valor; vale para a tela, o filtro, o Excel e a impressão.
- Caso `tests/casos/v73-ibs-valor-produtos-apos-ncm`.
  `src/js/modulos/34-v73-ibs-valor-produtos-apos-ncm.js`

## V72 — 2026-10-12

- **Dashboard › Resumo geral — quadro "Eventos das notas fiscais"** ao lado de "Montante por imposto": total de eventos e de notas, entradas × saídas, cancelamentos; resumo por `tpEvento` e `descEvento` (entradas e saídas); lista das notas com evento (movimento, NF, evento, emitente/destinatário, valor da nota e efeito — cancelada ou informativo), até 12 linhas, com o botão "Ver todos os eventos" que abre a aba Eventos. Sem XML de evento, o quadro informa que nenhum evento foi carregado.
- Correção da V70: dentro do Dashboard, a nota cancelada aparecia com valor R$ 0,00 no quadro de eventos (os itens dela já estavam fora da lista); agora o valor vem da lista completa.
- Caso `tests/casos/v72-quadro-eventos-dashboard` (conteúdo do quadro e posição logo após Montante por imposto).
  `src/js/modulos/33-v72-dashboard-quadro-eventos.js` e `31-v70-eventos-nfe.js` (comentário V72)

## V71 — 2026-10-12

- **Aba ICMS — coluna `observacao`** logo após `base_correta_icms`, com campo para digitar. O texto fica guardado por item (chave da nota + número do item), continua ao trocar de aba ou redesenhar, vai para o Excel (aba e diagnóstico completo) e é salvo e reimportado com o arquivo `.diagnostico`. Enter confirma.
- **Aba Itens — filtro ▾ de `observacao_evento`**: a lista mostra cada evento separadamente (mais a opção "(sem evento)") e o filtro traz somente os itens com o evento selecionado — inclusive notas com mais de um evento (ex.: Carta de Correção e Cancelamento na mesma nota). Antes, a nota com dois eventos aparecia como um terceiro valor ("evento A | evento B") e não entrava ao selecionar só um deles.
- Com o filtro de evento ativo, a lista de valores das outras colunas também respeita essa regra.
- Testes: casos `tests/casos/v71-*` (o campo `funcao` aceita uma expressão, para aplicar filtros e observações antes de conferir).
  `src/js/modulos/32-v71-observacao-icms-filtro-eventos.js`

## V70 — 2026-10-12

Eventos de NF-e (`tpEvento`, `descEvento` e `chNFe`):
- **Cancelamento** — `tpEvento` 110111 ou qualquer `descEvento` com "Cancelamento" (ex.: 110112 Cancelamento por substituição), homologado (cStat 135/136/155): os itens da nota ficam **somente na aba Itens** e no **Dashboard › Eventos**. Não entram nas abas ICMS, ICMS ST, IPI, Base de PIS/COFINS e Base de IBS/CBS, nos quadros de impostos e inconsistências do Dashboard, no Excel dessas abas nem nos valores da apresentação. Cancelamento rejeitado (outro cStat) não exclui a nota.
- **Aba Itens**: coluna nova `observacao_evento`, antes de `arquivo_origem`, com o código e a descrição do evento (ex.: "110111 - Cancelamento (nota cancelada: fora das abas de impostos)"; "110110 - Carta de Correcao"). Aparece quando a carga tem XML de evento.
- **Demais eventos** (ex.: 110110 Carta de Correção): informativos — observação na aba Itens e registro no Dashboard; a nota segue normal nas abas de impostos.
- **Dashboard › nova aba "Eventos"**: totais (eventos, cancelamentos, outros), resumo por tpEvento/descEvento (entradas × saídas) e tabelas ENTRADAS e SAÍDAS com NF, chave, emitente/destinatário, valor da nota, tpEvento, descEvento, sequência, data, cStat e efeito no diagnóstico. Evento de nota não carregada aparece como "Nota não carregada" (entrada/saída pelo CNPJ da chave).
- **Apresentação**: slide "Eventos das notas fiscais", antes das observações, com as notas de origem separadas em ENTRADAS e SAÍDAS.
- Testes: executor de casos aceita `ausentes` (linhas que não podem aparecer). Casos `tests/casos/v70-*`.
  `src/js/modulos/31-v70-eventos-nfe.js` e `src/js/apresentacao/gerador-pptx.js` (comentário V70)

## V69 — 2026-10-11

- **Margem única de R$ 0,05 em todas as abas** (ICMS, IPI, PIS, COFINS e IBS/CBS): diferença de até R$ 0,05, para mais ou para menos, entre o XML e o valor/base calculado = **VALIDADO**, sem recálculo (base correta e valor correto = 0). Texto: "VALIDADO (diferença de R$ 0,04, dentro da margem de R$ 0,05)".
- Substitui as margens anteriores de R$ 0,02 (operações comuns) e R$ 0,03 (CFOP 3101/3102/3556).
- Se a base fica validada pela margem, o valor do imposto é conferido sobre a base do XML (base × alíquota do XML), também com R$ 0,05.
- Validações de CST, cClassTrib e crédito por CFOP (que não comparam valores) não mudam.
- Nos XMLs reais de teste, nenhuma mudança de status. Casos ajustados: `v60` item 4 (diferença de R$ 0,04 passa a VALIDADO) e `v67` item 3 (R$ 0,05). Caso novo `v69-margem-005` (R$ 0,05 = VALIDADO; R$ 0,06 = NÃO VALIDADO, na base do ICMS e no valor do PIS).
  `src/js/modulos/30-v69-margem-005.js`

## V68 — 2026-10-11

- **Base de IBS/CBS (`validacao_base_ibs_cbs`)**: no NÃO VALIDADO, a diferença aparece logo após o parêntese — ex.: "NÃO VALIDADO (base de IBS/CBS calculada: R$ 287,51) diferença: R$ 12,49". Diferença = base do XML − base calculada (negativa quando o XML traz base menor, ex.: "-R$ 49,75").
- Vale na aba Base de IBS/CBS, no Excel e nas inconsistências do Dashboard/apresentação (lá o motivo fica "base de IBS/CBS calculada: R$ 287,51 — diferença: R$ 12,49").
- Caso de teste `tests/casos/v68-diferenca-base-ibs-cbs` (XML R$ 300,00 × calculada R$ 287,51; base igual; XML R$ 450,25 × calculada R$ 500,00).
  `src/js/modulos/29-v68-diferenca-base-ibs-cbs.js`

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
