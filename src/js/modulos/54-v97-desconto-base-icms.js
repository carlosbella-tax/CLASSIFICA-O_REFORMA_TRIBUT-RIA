  /* =====================================================================
     V97 — Aba ICMS: o desconto (vDesc) SUBTRAI da base de cálculo do ICMS
     em todas as regras: valor total dos produtos (−) desconto.
     Já subtraíam: regra base (V14), operação própria (V62/V63) e devolução
     5202/6202 (V96). Passam a subtrair (alterado nos próprios módulos,
     comentários V97): uso e consumo (V90/V92), consumidor final (V91/V96) e
     importação quando o valor aduaneiro vem dos produtos (V95/V96).
     O desconto aparece na conta da validação quando houver.
     ===================================================================== */
  OBS_VAL.validacao_base_icms += ' Desconto (vDesc) sempre subtrai da base de ICMS: valor dos produtos − desconto.';
