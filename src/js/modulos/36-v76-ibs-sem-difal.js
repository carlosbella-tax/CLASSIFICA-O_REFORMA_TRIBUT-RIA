  /* =====================================================================
     V76 — Base de IBS/CBS sem o ICMS DIFAL: o ICMS devido à UF de destino
     (vICMSUFDest), o FCP do DIFAL (vFCPUFDest) e a parcela do remetente
     (vICMSUFRemet, quando houver) saem da base de cálculo do IBS e da CBS
     (NT 2025.002). Colunas valor_icms_difal e valor_fcp_difal logo após
     valor_icms; a validação da base (e da diferença) usa a base corrigida.
     Base NÃO VALIDADA: IBS e CBS passam a ser conferidos sobre a base
     correta (alíquotas do XML), com margem de R$ 0,05.
     ===================================================================== */
  const difalV76 = r => ({
    difal: arred(valorGrupo(r, 'ICMSUFDest', 'vICMSUFDest') + valorGrupo(r, 'ICMSUFDest', 'vICMSUFRemet')),
    fcp: arred(valorGrupo(r, 'ICMSUFDest', 'vFCPUFDest'))
  });
  const baseIbsArt12V75 = baseIbsArt12;
  baseIbsArt12 = function(r){ const d = difalV76(r); return arred(baseIbsArt12V75(r) - d.difal - d.fcp); };
  const linhaIbsCbsV75 = linhaIbsCbs;
  linhaIbsCbs = r => {
    const o = linhaIbsCbsV75(r);
    if (!o || !('valor_icms' in o)) return o;
    const d = difalV76(r || o.__src || {}), x = {};
    for (const k of Object.keys(o)){ x[k] = o[k]; if (k === 'valor_icms'){ x.valor_icms_difal = d.difal; x.valor_fcp_difal = d.fcp; } }
    for (const p of ['__src', '__idx']) if (o[p] !== undefined) Object.defineProperty(x, p, {value: o[p], configurable: true, writable: true});
    // base não validada: IBS e CBS sobre a base correta (sem redução de alíquota gRed)
    const bc = typeof x.base_correta_ibs_cbs === 'number' ? x.base_correta_ibs_cbs : 0, cst = String(x.cst_ibs_cbs || '').trim().padStart(3, '0');
    if (bc > 0 && /^(NÃO VALIDADO|INCORRETO)/.test(String(x.validacao_base_ibs_cbs || '')) && !SEM_TRIB_IBS.has(cst)){
      const confere = (kv, kx, kc, aliq, nome) => {
        if (/gRed|redução/.test(String(x[kv] || ''))) return;
        const calc = arred(bc * aliq / 100), xml = arred(num(x[kx]));
        if (Math.abs(xml - calc) <= 0.0501){ if (!/^VALIDADO/.test(String(x[kv]))) x[kv] = 'VALIDADO'; x[kc] = 0; return; }
        x[kv] = 'NÃO VALIDADO (' + nome + ' sobre a base correta: ' + brl(bc) + ' × ' + brNumero(aliq, 2) + '% = ' + brl(calc) + ') diferença: ' + brl(arred(xml - calc));
        x[kc] = calc;
      };
      confere('validacao_ibs', 'valor_ibs_total', 'valor_correto_ibs', num(x.aliquota_ibs_uf) + num(x.aliquota_ibs_mun), 'IBS');
      confere('validacao_cbs', 'valor_cbs', 'valor_correto_cbs', num(x.aliquota_cbs), 'CBS');
    }
    return x;
  };
  OBS_VAL.validacao_base_ibs_cbs = String(OBS_VAL.validacao_base_ibs_cbs || '').replace('− ICMS − ISS', '− ICMS − ICMS DIFAL (UF destino) − FCP do DIFAL − ISS');
