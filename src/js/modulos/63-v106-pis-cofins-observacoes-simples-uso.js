  /* =====================================================================
     V106 — Aba Base de PIS/COFINS
     1. CST de ICMS (CSOSN) 102 — Tributada pelo Simples Nacional sem
        permissão de crédito — e empresa do diagnóstico no Lucro Presumido:
        todas as validações de PIS/COFINS (CST, base e valor) VALIDADO, sem
        cálculo (valores corretos = 0) e observação "OPTANTE PELO SIMPLES
        NACIONAL".
     2. Observações automáticas (somadas às demais; o texto digitado pelo
        usuário prevalece):
        · venda CFOP 5107/6107 → "VENDA NÃO CONTRIBUINTE";
        · CFOP 1656 → "COMPRA PARA USO E CONSUMO";
        · entrada com CFOP 1556/2556 → "USO E CONSUMO COM CRÉDITO".
     3. As compras de uso e consumo (CFOP 1556/2556), que desde a V93 ficavam
        fora desta aba, voltam para a aba Base de PIS/COFINS com a validação
        normal de PIS/COFINS (com crédito). As abas ICMS ST, IPI e IBS/CBS e o
        Dashboard continuam como na V93.
     ===================================================================== */
  ABAS_SEM_USO_V93.delete('piscofins');
  const MOTIVO_SN_V106 = 'VALIDADO (Simples Nacional — CSOSN 102, sem permissão de crédito; empresa no Lucro Presumido: sem cálculo de PIS/COFINS)';
  const cfopV106 = (row, r) => String(row.cfop || (r && r.cfop) || '').trim();
  const cfopXmlV106 = (row, r) => String(row.cfop_xml || (r && (r.cfop_xml || r.cfop)) || '').trim();
  window.linhasPisCofins = (...a) => linhasPisCofinsV91(...a).map(row0 => {
    const row = moverUsoV93(row0), r = row.__src, obs = [];
    const cfop = cfopV106(row, r), cfx = cfopXmlV106(row, r);
    // 1. CSOSN 102 + Lucro Presumido
    if (r && String(cstGrupo(r, 'ICMS') || '').trim() === '102' && lucroPresumido()){
      for (const k of Object.keys(row)){
        if (k.startsWith('validacao_')) row[k] = MOTIVO_SN_V106;
        else if (/^(valor|base)_corret/.test(k)) row[k] = 0;
        else if (/_calculad[ao]$/.test(k)) row[k] = 'VALIDADO';
      }
      if ('observacao' in row && obsUsuarioV71('piscofins')[chaveObsV71(row)] === undefined) row.observacao = valorObsV71(chaveObsV71(row), '', 'piscofins');
      obs.push('OPTANTE PELO SIMPLES NACIONAL');
    }
    // 2. observações por CFOP
    if (cfx === '5107' || cfx === '6107') obs.push('VENDA NÃO CONTRIBUINTE');
    if (cfop === '1656' || cfx === '1656') obs.push('COMPRA PARA USO E CONSUMO');
    if (row.tipo_operacao === 'ENTRADAS' && (cfop === '1556' || cfop === '2556')) obs.push('USO E CONSUMO COM CRÉDITO');
    return obs.length ? comObsPadraoV86(row, 'piscofins', obs) : row;
  });
  OBS_VAL.validacao_base_pis = (OBS_VAL.validacao_base_pis || '') + ' CSOSN 102 com empresa no Lucro Presumido: VALIDADO, sem cálculo (OPTANTE PELO SIMPLES NACIONAL). Compras de uso e consumo (1556/2556): validação normal, com crédito.';
