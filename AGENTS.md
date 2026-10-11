# Diagnóstico Operações Fiscais — regras de trabalho para o agente

Ferramenta da Tax Advice que lê XML de NF-e, CT-e, NFS-e e eventos, valida ICMS, ICMS ST, IPI, PIS/COFINS e IBS/CBS (LC 214/2025) e gera Excel, PDF e a apresentação em PowerPoint. Entregável final: **um único arquivo HTML** (`dist/DIAGNOSTICO_VN.html`), que roda offline no navegador.

1. **Edite só em `src/`.** Nunca edite `dist/` nem `_arquivo_original/`. A ordem de montagem está em `src/manifest.json`.
2. **Toda mudança abre uma versão nova**: `npm run nova-versao -- N "descrição"` antes de editar. Registre cada mudança no `CHANGELOG.md` e, no código, com um comentário `/* VN — ... */` (padrão herdado do arquivo único).
3. **Regras novas** entram como módulo novo em `src/js/modulos/NN-vN-assunto.js`, adicionado no `manifest.json` antes de `src/js/modulos/99-fechamento.js`, com um caso de teste em `tests/casos/`. Correção pontual em regra existente pode ser feita no próprio módulo, sempre com comentário `VN`.
4. **Rode `npm test` antes de entregar.** O teste funcional compara cada aba com `tests/referencia.json`. Se uma aba mudar, confira se a mudança é a esperada para a versão; só então grave a nova referência com `node tests/testar.mjs --atualizar` e explique ao usuário o que mudou.
5. **Nunca converta fim de linha nem reformate arquivos inteiros** (`.gitattributes` com `* -text`). Arquivos de dados (`src/js/dados/`, `imagens-pptx.js`, `vendor/`) não devem ser reformatados.
6. **Entrega**: `npm run drive` gera o HTML e copia para `G:/Drives compartilhados/0025- REFORMA TRIBUTARIA/00 - PAINEL AUTOMATICO/MOTOR DE CALCLULO/DD_MM_AAAA/`. Disponibilize também o arquivo como download na conversa.
7. **Git**: um commit por versão (`vN: descrição`) e tag `vN`, com `Co-Authored-By: G4 OS <g4os@g4business.com>`.
8. O Motor de Cálculo (`../motor-calculo-reforma-tributaria`) é outro produto, com repositório próprio. Não altere arquivos dele a partir deste projeto.
