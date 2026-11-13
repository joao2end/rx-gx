import type {
  Cronicidade,
  DepartamentoRx,
  FaixaPreco,
  NivelSensibilidade,
  RxCalculatedSku,
  RxCockpitParams,
  RxSimuladorDataset,
  RxSkuInput,
  TipoConcorrente,
} from "../types/pricing";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function buildMatrizLookup(
  matrizRows: RxSimuladorDataset["matrizDesconto"],
  overrides: Record<string, number | null> = {},
): Record<string, number | null> {
  const map: Record<string, number | null> = {};
  for (const r of matrizRows) {
    const key = `${r.departamento}|${r.cronicidade}|${r.faixa}|${r.conc}`;
    map[key] = overrides[key] !== undefined && overrides[key] !== null ? overrides[key]! : r.desconto;
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== null && v !== undefined) {
      map[k] = v;
    }
  }
  return map;
}

export function calculateRxSimulation(
  skus: RxSkuInput[],
  params: RxCockpitParams,
  topPesquisa: RxSimuladorDataset["topPesquisa"],
  matrizMap: Record<string, number | null>,
): RxCalculatedSku[] {
  return skus.map((sku) => {
    const dept = sku.departamento;
    const sens = sku.sensibilidade as NivelSensibilidade | "";
    const tipo = sku.tipoPrecificacao;
    const clusterKey = params.politicaPesquisa[sku.cluster] ? sku.cluster : "Cluster";

    // 1. Lookup discounts per competitor channel (TODOS, ABRAF, INDEP)
    let descTodos: number | null = null;
    let descAbraf: number | null = null;
    let descIndep: number | null = null;

    if (sens !== "" && tipo !== "") {
      if (tipo === "DESC MÍNIMO") {
        const dm = params.descontoMinimo[sens as NivelSensibilidade]?.[dept] ?? 0.049;
        descTodos = dm;
        descAbraf = dm;
        descIndep = dm;
      } else if (tipo === "MATRIZ") {
        descTodos = matrizMap[`${dept}|${sku.cronicidade}|${sku.faixa}|TODOS`] ?? sku.descTodosExcel;
        descAbraf = matrizMap[`${dept}|${sku.cronicidade}|${sku.faixa}|ABRAF`] ?? sku.descAbrafExcel;
        descIndep = matrizMap[`${dept}|${sku.cronicidade}|${sku.faixa}|INDEP`] ?? sku.descIndepExcel;
      } else if (tipo === "PESQUISA") {
        const tp = topPesquisa[sku.produtoId];
        // Note: In RX_Simulador Excel col AB/AC, PESQUISA pulls TODOS or channel-specific from Top Research;
        // let's check both tp channel and fallback to TODOS if channel has no sample
        descTodos = tp?.TODOS ?? sku.descTodosExcel;
        descAbraf = tp?.ABRAF ?? tp?.TODOS ?? sku.descAbrafExcel;
        descIndep = tp?.INDEP ?? tp?.TODOS ?? sku.descIndepExcel;
      }
    }

    // Note: Excel col AB/AC had a quirk where PESQUISA looked up Produtos_Top[TODOS] for all 3 columns when channel was missing,
    // wait: let's check if sku.descAbrafExcel matches! If user didn't change matrix, let's support channel-specific from topPesquisa when user picks ABRAF/INDEP,
    // Wait: in Excel formula AB7: `IF($Z7="PESQUISA", XLOOKUP($D7, Produtos_Top[ProdutoID], Produtos_Top[TODOS]))`!
    // Wait: let's check why: for PESQUISA in RX_Simulador, let's check if topPesquisa[ABRAF] or TODOS was used in Excel! We'll verify in our parity check script!

    let politicaAplicada: TipoConcorrente | "" = "";
    if (tipo === "PESQUISA") {
      politicaAplicada = params.politicaPesquisa[clusterKey]?.[dept] ?? "TODOS";
    } else if (tipo === "MATRIZ") {
      politicaAplicada = params.politicaMatriz[clusterKey]?.[dept] ?? "TODOS";
    }

    const chosenDesc =
      politicaAplicada === "ABRAF"
        ? descAbraf
        : politicaAplicada === "INDEP"
          ? descIndep
          : descTodos;

    // 2. Ajuste Desconto %
    let ajusteDescontoPct = 0;
    if (tipo !== "" && tipo !== "DESC MÍNIMO" && !(tipo !== "PESQUISA" && sens === "")) {
      const bucket = tipo === "PESQUISA" ? "TOP PRODUTOS" : (sens as NivelSensibilidade);
      ajusteDescontoPct = params.ajusteDesconto[dept]?.[clusterKey]?.[bucket] ?? 0;
    }

    // 3. Preço de Partida (AF)
    let precoPartida = sku.precoAtual;
    const hasAnyDesc = descTodos !== null || descAbraf !== null || descIndep !== null;
    if (hasAnyDesc && chosenDesc !== null && chosenDesc !== 0 && sku.pmc > 0) {
      precoPartida = sku.pmc * (1 - chosenDesc - ajusteDescontoPct);
    }

    // 4. Farol Variação (AG, AH, AI)
    const varPartida = sku.precoAtual > 0 ? precoPartida / sku.precoAtual - 1 : 0;
    const regraVar = tipo ? params.farolVariacao[tipo] : undefined;
    const limiar = regraVar?.limiar ?? 0;
    const indif = regraVar?.indiferenca ?? 0;
    const temMaior = limiar > 0;
    const temMenor = indif > 0;

    let farolVariacao = "OK";
    let precoAposVariacao = round2(precoPartida);

    if (temMaior && varPartida > limiar) {
      farolVariacao = `>${Math.round(limiar * 100)}%`;
      precoAposVariacao = round2(sku.precoAtual * (1 + limiar));
    } else if (temMaior && varPartida < -limiar) {
      farolVariacao = `<-${Math.round(limiar * 100)}%`;
      precoAposVariacao = round2(sku.precoAtual * (1 - limiar));
    } else if (temMenor && varPartida < indif && varPartida > -indif) {
      farolVariacao = `<${Math.round(indif * 100)}%`;
      precoAposVariacao = round2(sku.precoAtual);
    }

    // 5. Margem Crítica (AK, AL, AM)
    const margemAtual =
      sku.precoAtual > 0
        ? (sku.precoAtual - sku.precoAtual * sku.tributos - sku.custoComComissao) / sku.precoAtual
        : 0;
    const margemPartida =
      precoAposVariacao > 0
        ? (precoAposVariacao - precoAposVariacao * sku.tributos - sku.custoComComissao) / precoAposVariacao
        : 0;

    const bucketMrg = tipo === "PESQUISA" ? "TOP PRODUTOS" : (sens as NivelSensibilidade);
    const margemCriticaAlvo = sens !== "" ? (params.margemCritica[bucketMrg]?.[dept] ?? 0) : 0;

    let alertaMargem: RxCalculatedSku["alertaMargem"] = "OK";
    if (margemPartida < 0) {
      alertaMargem = "Alerta MRG Negativa";
    } else if (sens === "") {
      alertaMargem = "";
    } else if (margemPartida >= 0 && margemPartida <= margemCriticaAlvo) {
      alertaMargem = "Alerta MRG Crítica";
    }

    let precoAposMargem = precoAposVariacao;
    if (alertaMargem === "Alerta MRG Negativa" || alertaMargem === "Alerta MRG Crítica") {
      if (1 - margemCriticaAlvo > 0) {
        precoAposMargem = sku.custoComComissao / (1 - margemCriticaAlvo);
      }
    }

    // 6. Travas Regulatórias, PBM/FP/MP, Preço Tabelado e PMC (AN & AO)
    const pmcBase = sku.pmc * (1 - params.fatorPmc);
    const precoAtualR = round2(sku.precoAtual);
    const precoTabR = sku.precoTabelado ? round2(sku.precoTabelado) : 0;
    const isEspecial = sku.marcaPropria || sku.pbm || sku.farmaciaPopular;
    const hasTabelado = sku.precoTabelado !== null && sku.precoTabelado !== 0;

    let precoSimuladoSistema = precoAposMargem;
    let motivoRegra = "Preço Calculado";

    if (isEspecial) {
      const tags = [
        sku.pbm ? "PBM" : "",
        sku.farmaciaPopular ? "Farmácia Popular" : "",
        sku.marcaPropria ? "Marca Própria" : "",
      ]
        .filter(Boolean)
        .join(" / ");
      if (sku.pmc > 0) {
        if (precoAtualR <= pmcBase) {
          precoSimuladoSistema = precoAtualR;
          motivoRegra = `${tags} · Manter Preço Atual`;
        } else {
          precoSimuladoSistema = round2(pmcBase);
          motivoRegra = `${tags} · Teto PMC`;
        }
      } else {
        precoSimuladoSistema = precoAtualR;
        motivoRegra = `${tags} · Manter Preço Atual`;
      }
    } else if (hasTabelado) {
      if (sku.pmc > 0) {
        if (precoTabR <= pmcBase) {
          precoSimuladoSistema = precoTabR;
          motivoRegra = "Preço Tabelado";
        } else {
          precoSimuladoSistema = round2(pmcBase);
          motivoRegra = "Preço Tabelado limitado ao PMC";
        }
      } else {
        precoSimuladoSistema = precoTabR;
        motivoRegra = "Preço Tabelado";
      }
    } else if (sku.pmc > 0) {
      if (precoAposMargem < pmcBase) {
        precoSimuladoSistema = round2(precoAposMargem);
        motivoRegra = "Preço Calculado";
      } else {
        precoSimuladoSistema = round2(pmcBase);
        motivoRegra = "Limitado ao Teto PMC";
      }
    } else {
      precoSimuladoSistema = precoAtualR;
      motivoRegra = "Sem PMC · Preço Atual";
    }

    // 7. Ajuste Manual e Seguir? (AP, AQ, AR, AS)
    const precoCalculadoFinal =
      sku.ajusteManual !== null && sku.ajusteManual !== undefined && sku.ajusteManual > 0
        ? round2(sku.ajusteManual)
        : round2(precoSimuladoSistema);

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

    let alteracaoStatus: RxCalculatedSku["alteracaoStatus"] = "Manter o preço";
    if (precoFinal < precoAtualR - 0.001) {
      alteracaoStatus = "Redução de preço";
    } else if (precoFinal > precoAtualR + 0.001) {
      alteracaoStatus = "Aumento de preço";
    }

    const receitaAtualCalc = sku.precoAtual * sku.qtd1m;
    const receitaSimuladaCalc = precoFinal * sku.qtd1m;
    const lucroAtualCalc = sku.qtd1m * (sku.precoAtual - sku.custoComComissao);
    const lucroSimuladoCalc = sku.qtd1m * (precoFinal - sku.custoComComissao);

    return {
      ...sku,
      politicaAplicada,
      descontoReferencia: chosenDesc ?? 0,
      ajusteDescontoPct,
      descontoEfetivo: (chosenDesc ?? 0) + ajusteDescontoPct,
      precoPartida,
      farolVariacao,
      precoAposVariacao,
      margemPartida,
      margemCriticaAlvo,
      alertaMargem,
      precoAposMargem: round2(precoAposMargem),
      precoSimuladoSistema: round2(precoSimuladoSistema),
      motivoRegra,
      precoFinal,
      margemAtual,
      margemFinal,
      aliquotaImpostos,
      margemLiquida,
      alertaMargemLiquida,
      descontoAtual,
      descontoSimulado,
      variacaoPct,
      alteracaoStatus,
      receitaAtualCalc,
      receitaSimuladaCalc,
      lucroAtualCalc,
      lucroSimuladoCalc,
    };
  });
}

export interface RxSummaryMetrics {
  totalSkus: number;
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
  descontoMedioAtual: number;
  descontoMedioSimulado: number;
  qtdAumento: number;
  qtdReducao: number;
  qtdManter: number;
  qtdAlertasMargem: number;
}

export function summarizeRxSimulation(rows: RxCalculatedSku[]): RxSummaryMetrics {
  let receitaAtual = 0;
  let receitaSimulada = 0;
  let lucroAtual = 0;
  let lucroSimulado = 0;
  let pesoDescAtual = 0;
  let pesoDescSim = 0;
  let baseReceitaComPmc = 0;
  let qtdAumento = 0;
  let qtdReducao = 0;
  let qtdManter = 0;
  let qtdAlertasMargem = 0;

  for (const r of rows) {
    receitaAtual += r.receita1m;
    receitaSimulada += r.receitaSimuladaCalc;
    lucroAtual += r.lucroAtualCalc;
    lucroSimulado += r.lucroSimuladoCalc;
    if (r.pmc > 0) {
      pesoDescAtual += r.descontoAtual * r.receita1m;
      pesoDescSim += r.descontoSimulado * r.receita1m;
      baseReceitaComPmc += r.receita1m;
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
    descontoMedioAtual: baseReceitaComPmc > 0 ? pesoDescAtual / baseReceitaComPmc : 0,
    descontoMedioSimulado: baseReceitaComPmc > 0 ? pesoDescSim / baseReceitaComPmc : 0,
    qtdAumento,
    qtdReducao,
    qtdManter,
    qtdAlertasMargem,
  };
}
