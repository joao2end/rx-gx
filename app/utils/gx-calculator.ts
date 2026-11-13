import type {
  BalizadorPreco,
  Cronicidade,
  FaixaPreco,
  GxCalculatedSku,
  GxCockpitParams,
  GxP1Input,
  GxSimuladorDataset,
  GxSkuInput,
  TipoConcorrente,
} from "../types/pricing";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface GxP1Calculated {
  chaveCluster: string;
  chave: string;
  cluster: string;
  produtoId: string;
  laboratorio: string;
  tipoPrecificacao: GxP1Input["tipoPrecificacao"];
  politicaConc: TipoConcorrente | "";
  balizador: BalizadorPreco | "";
  icAlvo: number;
  precoRefConcorrente: number | null;
  precoPartidaP1: number;
  precoSimuladoP1: number;
  precoFinalChaveP1: number;
}

export function calculateGxSimulation(
  p1Rows: GxP1Input[],
  skus: GxSkuInput[],
  params: GxCockpitParams,
  pesqManual: GxSimuladorDataset["pesqManual"],
  pesqInternet: GxSimuladorDataset["pesqInternet"],
  chaveP1ManualOverrides: Record<string, number | null>,
): { p1Map: Record<string, GxP1Calculated>; rows: GxCalculatedSku[] } {
  // STAGE 1: Calculate P1 price per Chave + Cluster (Sheet 'P1' + 'Preço Chave P1')
  const p1ByChaveManualInSheet: Record<string, number> = {};
  for (const p of p1Rows) {
    if (p.ajusteManualP1 !== null && p.ajusteManualP1 !== undefined && p.ajusteManualP1 > 0) {
      if (p1ByChaveManualInSheet[p.chave] === undefined) {
        p1ByChaveManualInSheet[p.chave] = p.ajusteManualP1;
      }
    }
  }

  const p1CalcByChaveCluster: Record<string, GxP1Calculated> = {};
  const maxP1FinalByChaveCluster: Record<string, number> = {};

  for (const p of p1Rows) {
    const tipo = p.tipoPrecificacao;
    const faixa = p.faixa as FaixaPreco;
    const cron = p.cronicidade as Cronicidade;

    let politicaConc: TipoConcorrente | "" = "";
    let balizador: BalizadorPreco | "" = "";
    let icAlvo = 1;
    let precoRefConcorrente: number | null = null;
    let mrgObj: number | null = null;

    if (tipo === "PESQ MANUAL") {
      politicaConc = params.icManual.concorrencia[faixa]?.[cron] ?? "INDEP";
      balizador = params.icManual.balizador[faixa]?.[cron] ?? "MED";
      icAlvo = params.icManual.politicaIc[faixa]?.[cron] ?? 1;
      precoRefConcorrente = pesqManual[p.chave]?.[balizador]?.[politicaConc] ?? null;
    } else if (tipo === "PESQ INTERNET") {
      balizador = params.icInternet.balizador[faixa]?.[cron] ?? "MED";
      icAlvo = params.icInternet.politicaIc[faixa]?.[cron] ?? 1;
      precoRefConcorrente = pesqInternet[p.chave]?.[balizador] ?? null;
    } else if (tipo === "MARGEM OBJETIVO") {
      if (!p.sensibilidade) {
        mrgObj = params.margemSemPmc[cron] ?? 0.5;
      } else {
        mrgObj = params.margemObjetivo[faixa]?.[cron] ?? 0.5;
      }
    }

    // Preço de partida do P1 (AJ)
    let precoPartidaP1 = p.precoAtual;
    if (p.custoComComissao > 0) {
      if (tipo === "MARGEM OBJETIVO") {
        if (mrgObj && mrgObj > 0 && mrgObj < 1) {
          precoPartidaP1 = p.custoComComissao / (1 - mrgObj);
        }
      } else if (icAlvo > 0 && precoRefConcorrente && precoRefConcorrente > 0) {
        precoPartidaP1 = precoRefConcorrente * icAlvo;
      }
    }

    // Farol variação do P1 (AK, AL, AM)
    const varP1 = p.precoAtual > 0 ? precoPartidaP1 / p.precoAtual - 1 : 0;
    const regraVar = tipo ? params.farolVariacao[tipo] : undefined;
    const limiar = regraVar?.limiar ?? 0;
    const indif = regraVar?.indiferenca ?? 0;

    let precoAposVarP1 = round2(precoPartidaP1);
    if (limiar > 0 && varP1 > limiar) {
      precoAposVarP1 = round2(p.precoAtual * (1 + limiar));
    } else if (limiar > 0 && varP1 < -limiar) {
      precoAposVarP1 = round2(p.precoAtual * (1 - limiar));
    } else if (indif > 0 && varP1 < indif && varP1 > -indif) {
      precoAposVarP1 = round2(p.precoAtual);
    }

    // Margem Crítica do P1 (AO, AP, AQ, AR)
    const mrgPartidaP1 =
      precoAposVarP1 > 0
        ? (precoAposVarP1 - precoAposVarP1 * p.tributos - p.custoComComissao) / precoAposVarP1
        : 0;
    const mrgCriticaP1 =
      tipo && params.margemCritica[tipo]?.[faixa]?.[cron] !== undefined
        ? params.margemCritica[tipo][faixa][cron]
        : 0.35;

    let alertaP1 = false;
    if (mrgPartidaP1 < 0) {
      alertaP1 = true;
    } else if (tipo !== "MARGEM OBJETIVO" && mrgPartidaP1 < mrgCriticaP1) {
      alertaP1 = true;
    }

    const precoSimuladoP1 = alertaP1
      ? p.custoComComissao / (1 - (mrgCriticaP1 || 0.05))
      : precoAposVarP1;

    // Ajuste manual P1 na aba P1 ou aba Preço Chave P1
    let precoFimLinhaP1 = precoSimuladoP1;
    if (p.ajusteManualP1 !== null && p.ajusteManualP1 !== undefined && p.ajusteManualP1 > 0) {
      precoFimLinhaP1 = p.ajusteManualP1;
    } else if (p1ByChaveManualInSheet[p.chave] !== undefined) {
      precoFimLinhaP1 = p1ByChaveManualInSheet[p.chave]!;
    }

    const chaveOverride = chaveP1ManualOverrides[p.chave];
    if (chaveOverride !== null && chaveOverride !== undefined && chaveOverride > 0) {
      precoFimLinhaP1 = chaveOverride;
    }

    const ck = `${p.chave}|${p.cluster}`;
    const prevMax = maxP1FinalByChaveCluster[ck] ?? 0;
    const finalChave = Math.max(prevMax, precoFimLinhaP1);
    maxP1FinalByChaveCluster[ck] = finalChave;

    p1CalcByChaveCluster[ck] = {
      chaveCluster: ck,
      chave: p.chave,
      cluster: p.cluster,
      produtoId: p.produtoId,
      laboratorio: p.laboratorio,
      tipoPrecificacao: tipo,
      politicaConc,
      balizador,
      icAlvo,
      precoRefConcorrente,
      precoPartidaP1,
      precoSimuladoP1,
      precoFinalChaveP1: finalChave,
    };
  }

  for (const ck of Object.keys(p1CalcByChaveCluster)) {
    p1CalcByChaveCluster[ck]!.precoFinalChaveP1 = maxP1FinalByChaveCluster[ck]!;
  }

  // Pre-aggregate per Chave+Cluster for Stage 2 geometric ladder (AG, AH, AI, AJ, AK, AL)
  interface ChaveStats {
    nonP1TotalQtd: number;
    nonP1WeightedPmc: number;
    nonP1SimplePmcSum: number;
    nonP1Count: number;
    maxOrdemNum: number;
    minLineManualP1: number | null;
  }
  const statsByChaveCluster: Record<string, ChaveStats> = {};

  for (const s of skus) {
    const ck = `${s.chave}|${s.cluster}`;
    if (!statsByChaveCluster[ck]) {
      statsByChaveCluster[ck] = {
        nonP1TotalQtd: 0,
        nonP1WeightedPmc: 0,
        nonP1SimplePmcSum: 0,
        nonP1Count: 0,
        maxOrdemNum: 1,
        minLineManualP1: null,
      };
    }
    const st = statsByChaveCluster[ck]!;
    const pNum = parseInt(s.ordemPreco.replace("P", ""), 10) || 1;
    if (pNum > st.maxOrdemNum) st.maxOrdemNum = pNum;

    if (s.precoP1ManualLinha !== null && s.precoP1ManualLinha > 0) {
      st.minLineManualP1 =
        st.minLineManualP1 === null
          ? s.precoP1ManualLinha
          : Math.min(st.minLineManualP1, s.precoP1ManualLinha);
    }

    if (s.ordemPreco !== "P1") {
      st.nonP1Count += 1;
      st.nonP1TotalQtd += s.qtd1m;
      st.nonP1WeightedPmc += s.pmc * s.qtd1m;
      st.nonP1SimplePmcSum += s.pmc;
    }
  }

  // Compute min Distância % PMC x P1 per Chave+Cluster (AJ -> AK)
  const stepByChaveCluster: Record<string, { pmcPond: number | null; stepEfetivo: number | null; precoP1Efetivo: number }> = {};

  for (const s of skus) {
    const ck = `${s.chave}|${s.cluster}`;
    if (stepByChaveCluster[ck]) continue;
    const st = statsByChaveCluster[ck]!;
    const p1Info = p1CalcByChaveCluster[ck];
    const overrideChave = chaveP1ManualOverrides[s.chave];
    const precoP1Simulado =
      overrideChave !== null && overrideChave !== undefined && overrideChave > 0
        ? overrideChave
        : (p1Info?.precoFinalChaveP1 ?? s.precoAtual);
    const precoP1Efetivo = st.minLineManualP1 !== null ? st.minLineManualP1 : precoP1Simulado;

    if (st.nonP1Count === 0 || st.nonP1SimplePmcSum === 0) {
      stepByChaveCluster[ck] = { pmcPond: null, stepEfetivo: null, precoP1Efetivo };
      continue;
    }

    const pmcPond =
      st.nonP1TotalQtd === 0
        ? st.nonP1SimplePmcSum / st.nonP1Count
        : st.nonP1WeightedPmc / st.nonP1TotalQtd;

    // Find min AJ across all non-P1 rows of this chave+cluster
    let minAj: number | null = null;
    for (const item of skus) {
      if (`${item.chave}|${item.cluster}` !== ck || item.ordemPreco === "P1") continue;
      const k = parseInt(item.ordemPreco.replace("P", ""), 10) || 2;
      if (k > 1 && precoP1Efetivo > 0 && pmcPond > 0) {
        // Note: In Excel AG, if nonP1TotalQtd == 0, AG is "", so SUMIFS(AG)=0, and AI uses AVERAGEIFS(Z).
        const aj = Math.pow(pmcPond / precoP1Efetivo, 1 / (k - 1)) - 1;
        if (Number.isFinite(aj)) {
          minAj = minAj === null ? aj : Math.min(minAj, aj);
        }
      }
    }

    const distChave =
      minAj === null || minAj < params.aumentoMinimo ? params.aumentoMinimo : minAj;

    const maxK = Math.max(2, st.maxOrdemNum);
    const distMaxAjustada = Math.pow(1 + params.aumentoMaximoP1, 1 / (maxK - 1)) - 1;
    const stepEfetivo = distChave > distMaxAjustada ? distMaxAjustada : distChave;

    stepByChaveCluster[ck] = { pmcPond, stepEfetivo, precoP1Efetivo };
  }

  // STAGE 2: Calculate each SKU row in 'Análise'
  const calculatedRows: GxCalculatedSku[] = skus.map((sku) => {
    const ck = `${sku.chave}|${sku.cluster}`;
    const p1Info = p1CalcByChaveCluster[ck];
    const ladder = stepByChaveCluster[ck]!;
    const isP1 = sku.ordemPreco === "P1";
    const k = parseInt(sku.ordemPreco.replace("P", ""), 10) || 1;
    const tipo = p1Info?.tipoPrecificacao ?? sku.tipoPrecificacao;
    const faixa = sku.faixa as FaixaPreco;
    const cron = sku.cronicidade as Cronicidade;

    const precoP1 = ladder.precoP1Efetivo;

    // Preço de Partida (AM / AN for non-P1, AF for P1)
    let precoPartida = precoP1;
    if (!isP1) {
      if (ladder.stepEfetivo !== null && precoP1 > 0) {
        precoPartida = precoP1 * Math.pow(1 + ladder.stepEfetivo, k - 1);
      } else {
        precoPartida = sku.precoAtual;
      }
    }

    // Farol Variação (AO, AP, AQ) — applied to non-P1 in Análise (P1 already went through Farol in Stage 1)
    const regraVar = tipo ? params.farolVariacao[tipo] : undefined;
    const limiar = regraVar?.limiar ?? 0;
    const indif = regraVar?.indiferenca ?? 0;

    let farolVariacao = "OK";
    let precoAposVariacao = round2(precoPartida);

    if (!isP1) {
      const varPct = sku.precoAtual > 0 ? precoPartida / sku.precoAtual - 1 : 0;
      if (limiar > 0 && varPct > limiar) {
        farolVariacao = `>${Math.round(limiar * 100)}%`;
        precoAposVariacao = round2(sku.precoAtual * (1 + limiar));
      } else if (limiar > 0 && varPct < -limiar) {
        farolVariacao = `<-${Math.round(limiar * 100)}%`;
        precoAposVariacao = round2(sku.precoAtual * (1 - limiar));
      } else if (indif > 0 && varPct < indif && varPct > -indif) {
        farolVariacao = `<${Math.round(indif * 100)}%`;
        precoAposVariacao = round2(sku.precoAtual);
      }
    }

    // Margem Crítica (AS, AT, AU, AV)
    const margemAtual =
      sku.precoAtual > 0
        ? (sku.precoAtual - sku.precoAtual * sku.tributos - sku.custoComComissao) / sku.precoAtual
        : 0;
    const margemPartida =
      precoAposVariacao > 0
        ? (precoAposVariacao - precoAposVariacao * sku.tributos - sku.custoComComissao) /
          precoAposVariacao
        : 0;
    const margemCriticaAlvo =
      tipo && params.margemCritica[tipo]?.[faixa]?.[cron] !== undefined
        ? params.margemCritica[tipo][faixa][cron]
        : 0.35;

    let alertaMargem: GxCalculatedSku["alertaMargem"] = "OK";
    let precoAposMargem = isP1 ? precoP1 : precoAposVariacao;

    if (!isP1) {
      if (margemPartida < 0) {
        alertaMargem = "Alerta MRG Negativa";
      } else if (tipo !== "MARGEM OBJETIVO" && margemPartida < margemCriticaAlvo) {
        alertaMargem = "Alerta MRG Crítica";
      }
      if (alertaMargem === "Alerta MRG Negativa" || alertaMargem === "Alerta MRG Crítica") {
        precoAposMargem = sku.custoComComissao / (1 - (margemCriticaAlvo || 0.05));
      }
    } else {
      // Check if P1 triggered margin floor in Stage 1
      if (margemPartida < 0) alertaMargem = "Alerta MRG Negativa";
      else if (tipo !== "MARGEM OBJETIVO" && margemPartida < margemCriticaAlvo) {
        alertaMargem = "Alerta MRG Crítica";
      }
    }

    // Regras Pesquisa SIM/NÃO + PMC Base (AW & AX)
    const precificarPbm = tipo ? (params.regrasPesquisa.PBM[tipo] ?? true) : true;
    const precificarFp = tipo ? (params.regrasPesquisa["Farmácia Popular"][tipo] ?? true) : true;
    const precificarMp = tipo ? (params.regrasPesquisa["Marca Própria"][tipo] ?? true) : true;
    const precificarPt = tipo ? (params.regrasPesquisa["Preço Tabelado"][tipo] ?? true) : true;

    const bloqueiaMp = sku.marcaPropria && !precificarMp;
    const bloqueiaFp = sku.farmaciaPopular && !precificarFp;
    const bloqueiaPbm = sku.pbm && !precificarPbm;
    const naoPrecificarEspecial = bloqueiaMp || bloqueiaFp || bloqueiaPbm;
    const hasTabelado = sku.precoTabelado !== null && sku.precoTabelado !== 0;

    const pmcBase = round2(sku.pmc * (1 - params.fatorPmc));
    const precoSimR = round2(isP1 && tipo !== "" ? precoP1 : precoAposMargem);
    const precoAtualR = round2(sku.precoAtual);
    const precoTabR = sku.precoTabelado ? round2(sku.precoTabelado) : 0;

    const origemLabel =
      tipo === ""
        ? "Preço Calculado (sem P1)"
        : isP1
          ? "Preço Calculado P1"
          : `Escada ${sku.ordemPreco}`;

    let precoSimuladoSistema = precoSimR;
    let motivoRegra = origemLabel;

    if (!sku.sensibilidade) {
      precoSimuladoSistema = precoSimR;
      motivoRegra = `${origemLabel} · Sem Sensibilidade`;
    } else if (naoPrecificarEspecial) {
      const tags = [
        bloqueiaMp ? "Marca Própria" : "",
        bloqueiaFp ? "Farmácia Popular" : "",
        bloqueiaPbm ? "PBM" : "",
      ]
        .filter(Boolean)
        .join(" / ");
      if (sku.pmc > 0) {
        precoSimuladoSistema = precoAtualR <= pmcBase ? precoAtualR : pmcBase;
        motivoRegra = `${tags} · Não Precificar`;
      } else {
        precoSimuladoSistema = precoAtualR;
        motivoRegra = `${tags} · Manter Atual`;
      }
    } else if (hasTabelado && !precificarPt) {
      precoSimuladoSistema = sku.pmc > 0 ? Math.min(precoTabR, pmcBase) : precoTabR;
      motivoRegra = "Preço Tabelado Mantido";
    } else if (sku.pmc > 0) {
      if (precoSimR <= pmcBase) {
        precoSimuladoSistema = precoSimR;
        motivoRegra = origemLabel;
      } else {
        precoSimuladoSistema = pmcBase;
        motivoRegra = `${origemLabel} limitado ao PMC`;
      }
    } else {
      precoSimuladoSistema = precoAtualR;
      motivoRegra = "Manter Atual (PMC <= 0)";
    }

    precoSimuladoSistema = round2(precoSimuladoSistema);

    // Seguir Preço P1 (AY), Ajuste Manual (AZ), Seguir? (BB) -> Preço Final (BC)
    let precoCalculadoFinal = precoSimuladoSistema;
    if (sku.ajusteManual !== null && sku.ajusteManual !== undefined && sku.ajusteManual > 0) {
      precoCalculadoFinal = round2(sku.ajusteManual);
      motivoRegra = "Ajuste Manual";
    } else if (sku.seguirPrecoP1) {
      precoCalculadoFinal = round2(precoP1);
      motivoRegra = "Seguir Preço P1";
    }

    const precoFinal = sku.seguir ? precoCalculadoFinal : precoAtualR;
    const margemFinal =
      precoFinal > 0
        ? (precoFinal - precoFinal * sku.tributos - sku.custoComComissao) / precoFinal
        : 0;
    const aliquotaImpostos = params.aliquotaImpostos ?? 0;
    const margemLiquida = margemFinal - aliquotaImpostos;
    const alertaMargemLiquida = margemLiquida + 1e-9 < (params.margemMinimaLiquida ?? 0);

    const descontoAtual = sku.pmc > 0 ? 1 - sku.precoAtual / sku.pmc : 0;
    const descontoSimulado = sku.pmc > 0 ? 1 - precoFinal / sku.pmc : 0;
    const variacaoPct = sku.precoAtual > 0 ? precoFinal / sku.precoAtual - 1 : 0;

    let alteracaoStatus: GxCalculatedSku["alteracaoStatus"] = "Manter o preço";
    if (precoFinal < precoAtualR - 0.001) {
      alteracaoStatus = "Redução de preço";
    } else if (precoFinal > precoAtualR + 0.001) {
      alteracaoStatus = "Aumento de preço";
    }

    // Competitor reference & IC (for P1s: in GX Excel, IC = Preço Conc / Meu Preço; let's check!)
    // Wait: let's inspect Excel Pesquisa formula R2 col 8: `Receita * PreçoP1 / TODOS` -> `Meu Preço / Preço Conc`!
    // Look at Pesquisa R2 col 8: `=Pesq_Manual[Receita] * Pesq_Manual[PreçoP1] / Pesq_Manual[TODOS]`!!
    // Despite the text note in R11, the ACTUAL Excel formula in Pesquisa!I2 is `Meu Preço P1 / Preço Concorrente`!
    const refConc = isP1 ? (p1Info?.precoRefConcorrente ?? null) : null;
    const icAtual = isP1 && refConc && refConc > 0 ? sku.precoAtual / refConc : null;
    const icSimulado = isP1 && refConc && refConc > 0 ? precoFinal / refConc : null;

    const receitaAtualCalc = sku.receita1m;
    const receitaSimuladaCalc = precoFinal * sku.qtd1m;
    const lucroAtualCalc = sku.qtd1m * (sku.precoAtual - sku.custoComComissao);
    const lucroSimuladoCalc = sku.qtd1m * (precoFinal - sku.custoComComissao);

    return {
      ...sku,
      tipoPrecificacao: tipo,
      precoP1Chave: round2(precoP1),
      pmcPonderadoChave: ladder.pmcPond ? round2(ladder.pmcPond) : null,
      degrauAplicadoPct: isP1 ? 0 : ladder.stepEfetivo,
      precoRefConcorrente: refConc,
      icAlvoAplicado: isP1 ? (p1Info?.icAlvo ?? null) : null,
      precoPartida,
      farolVariacao,
      precoAposVariacao,
      margemPartida,
      margemCriticaAlvo,
      alertaMargem,
      precoAposMargem: round2(precoAposMargem),
      precoSimuladoSistema,
      motivoRegra,
      precoFinal,
      margemAtual,
      margemFinal,
      aliquotaImpostos,
      margemLiquida,
      alertaMargemLiquida,
      descontoAtual,
      descontoSimulado,
      icAtual,
      icSimulado,
      variacaoPct,
      alteracaoStatus,
      receitaAtualCalc,
      receitaSimuladaCalc,
      lucroAtualCalc,
      lucroSimuladoCalc,
    };
  });

  return { p1Map: p1CalcByChaveCluster, rows: calculatedRows };
}

export interface GxSummaryMetrics {
  totalSkus: number;
  totalChaves: number;
  receitaAtual: number;
  receitaSimulada: number;
  variacaoReceita: number;
  variacaoReceitaPct: number;
  lucroAtual: number;
  lucroSimulado: number;
  variacaoLucro: number;
  variacaoLucroAnual: number;
  variacaoLucroPct: number;
  margemAtual: number;
  margemSimulada: number;
  icMedioAtualP1: number;
  icMedioSimuladoP1: number;
  qtdAumento: number;
  qtdReducao: number;
  qtdManter: number;
  qtdAlertasMargem: number;
}

export function summarizeGxSimulation(rows: GxCalculatedSku[]): GxSummaryMetrics {
  let receitaAtual = 0;
  let receitaSimulada = 0;
  let lucroAtual = 0;
  let lucroSimulado = 0;
  let icPondAtual = 0;
  let icPondSim = 0;
  let icPesoReceita = 0;
  let qtdAumento = 0;
  let qtdReducao = 0;
  let qtdManter = 0;
  let qtdAlertasMargem = 0;
  const chavesSet = new Set<string>();

  for (const r of rows) {
    chavesSet.add(r.chave);
    receitaAtual += r.receita1m;
    receitaSimulada += r.receitaSimuladaCalc;
    lucroAtual += r.lucroAtualCalc;
    lucroSimulado += r.lucroSimuladoCalc;

    if (r.ordemPreco === "P1" && r.icAtual !== null && r.icSimulado !== null && r.receita1m > 0) {
      icPondAtual += r.icAtual * r.receita1m;
      icPondSim += r.icSimulado * r.receita1m;
      icPesoReceita += r.receita1m;
    }

    if (r.alteracaoStatus === "Aumento de preço") qtdAumento++;
    else if (r.alteracaoStatus === "Redução de preço") qtdReducao++;
    else qtdManter++;

    if (r.alertaMargem === "Alerta MRG Crítica" || r.alertaMargem === "Alerta MRG Negativa") {
      qtdAlertasMargem++;
    }
  }

  const variacaoReceita = receitaSimulada - receitaAtual;
  const variacaoLucro = lucroSimulado - lucroAtual;

  return {
    totalSkus: rows.length,
    totalChaves: chavesSet.size,
    receitaAtual,
    receitaSimulada,
    variacaoReceita,
    variacaoReceitaPct: receitaAtual > 0 ? variacaoReceita / receitaAtual : 0,
    lucroAtual,
    lucroSimulado,
    variacaoLucro,
    variacaoLucroAnual: variacaoLucro * 12,
    variacaoLucroPct: lucroAtual > 0 ? variacaoLucro / lucroAtual : 0,
    margemAtual: receitaAtual > 0 ? lucroAtual / receitaAtual : 0,
    margemSimulada: receitaSimulada > 0 ? lucroSimulado / receitaSimulada : 0,
    icMedioAtualP1: icPesoReceita > 0 ? icPondAtual / icPesoReceita : 0,
    icMedioSimuladoP1: icPesoReceita > 0 ? icPondSim / icPesoReceita : 0,
    qtdAumento,
    qtdReducao,
    qtdManter,
    qtdAlertasMargem,
  };
}
