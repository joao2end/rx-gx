<template>
  <div class="space-y-6">
    <EtapaCabecalho :dominio="dominio" etapa-id="resultados" :titulo="`Resultados ${def.nomeCurto}`" />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdsMetricCard
        type="metric"
        :title="`Receita simulada ${def.nomeCurto} (1M)`"
        :value="fmtCompactBRL(resumo.receitaSimulada)"
        :delta="fmtSignedPct(resumo.variacaoReceitaPct)"
        :delta-direction="resumo.variacaoReceita >= 0 ? 'up' : 'down'"
        :delta-tone="resumo.variacaoReceita >= 0 ? 'positive' : 'negative'"
        comparison-label="Receita atual"
        :comparison-value="fmtCompactBRL(resumo.receitaAtual)"
        comparison-inline
      />
      <AdsMetricCard
        type="metric"
        :title="`Lucro bruto simulado ${def.nomeCurto} (1M)`"
        :value="fmtCompactBRL(resumo.lucroSimulado)"
        :delta="`${fmtCompactBRL(resumo.variacaoLucroAnual)}/ano`"
        :delta-direction="resumo.variacaoLucro >= 0 ? 'up' : 'down'"
        :delta-tone="resumo.variacaoLucro >= 0 ? 'positive' : 'negative'"
        comparison-label="Lucro atual"
        :comparison-value="fmtCompactBRL(resumo.lucroAtual)"
        comparison-inline
      />
      <AdsMetricCard
        type="metric"
        title="Margem bruta"
        :value="fmtPct(resumo.margemSimulada, 2)"
        :delta="fmtSignedPct(resumo.margemSimulada - resumo.margemAtual, 2)"
        :delta-direction="resumo.margemSimulada >= resumo.margemAtual ? 'up' : 'down'"
        :delta-tone="resumo.margemSimulada >= resumo.margemAtual ? 'positive' : 'negative'"
        comparison-label="Margem atual"
        :comparison-value="fmtPct(resumo.margemAtual, 2)"
        comparison-inline
      />
      <AdsMetricCard
        v-if="dominio === 'rx'"
        type="metric"
        title="Desconto médio s/ PMC"
        :value="fmtPct(rxResumo.descontoMedioSimulado, 2)"
        :delta="`${fmtInt(resumo.qtdAumento)} ↑ · ${fmtInt(resumo.qtdReducao)} ↓`"
        delta-direction="down"
        delta-tone="positive"
        comparison-label="Desc. atual"
        :comparison-value="fmtPct(rxResumo.descontoMedioAtual, 2)"
        comparison-inline
      />
      <AdsMetricCard
        v-else
        type="metric"
        title="IC médio ponderado (P1)"
        :value="fmtPct(gxResumo.icMedioSimuladoP1, 1)"
        :delta="`${fmtInt(gxResumo.totalChaves)} chaves`"
        delta-direction="down"
        delta-tone="positive"
        comparison-label="IC P1 atual"
        :comparison-value="fmtPct(gxResumo.icMedioAtualP1, 1)"
        comparison-inline
      />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-calendar-range"
        title="Impacto anual na receita"
        :value="fmtCompactBRL(resumo.variacaoReceita * 12)"
        delta="Simulado menos atual, vezes 12"
        :delta-direction="resumo.variacaoReceita >= 0 ? 'up' : 'down'"
        :delta-tone="resumo.variacaoReceita >= 0 ? 'positive' : 'negative'"
      />
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-trending-up"
        title="Impacto anual no lucro"
        :value="fmtCompactBRL(resumo.variacaoLucroAnual)"
        :delta="fmtSignedPct(resumo.variacaoLucroPct)"
        :delta-direction="resumo.variacaoLucro >= 0 ? 'up' : 'down'"
        :delta-tone="resumo.variacaoLucro >= 0 ? 'positive' : 'negative'"
      />
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-arrow-up-down"
        title="Variação de preço"
        :value="`${fmtInt(resumo.qtdAumento + resumo.qtdReducao + resumo.qtdManter)} itens`"
        :delta="`${fmtInt(resumo.qtdAumento)} sobem · ${fmtInt(resumo.qtdReducao)} descem · ${fmtInt(resumo.qtdManter)} mantêm`"
        delta-direction="up"
        delta-tone="positive"
      />
    </div>

    <AdsPanelCard
      :title="dominio === 'rx' ? 'Resultado por sensibilidade e departamento' : 'Resultado por degrau e sensibilidade'"
      subtitle="Atual e simulado no mesmo recorte do cockpit do Excel."
    >
      <div class="overflow-x-auto rounded-[var(--ads-radius-sm,8px)] border border-slate-200">
        <table class="w-full border-collapse text-xs tabular-nums sm:text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <th class="px-4 py-3 text-left">Recorte</th>
              <th class="px-3 py-3 text-right">Itens</th>
              <th class="px-3 py-3 text-right">Receita atual</th>
              <th class="px-3 py-3 text-right">Receita simulada</th>
              <th class="px-3 py-3 text-right">Lucro atual</th>
              <th class="px-3 py-3 text-right">Lucro simulado</th>
              <th class="px-3 py-3 text-right">Margem atual</th>
              <th class="px-3 py-3 text-right">Margem simulada</th>
              <th v-if="dominio === 'rx'" class="px-3 py-3 text-right">Desc. atual</th>
              <th v-if="dominio === 'rx'" class="px-3 py-3 text-right">Desc. simulado</th>
              <th class="px-3 py-3 text-right">Sobe</th>
              <th class="px-3 py-3 text-right">Desce</th>
              <th class="px-3 py-3 text-right">Mantém</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="linha in linhas"
              :key="linha.chave"
              :class="linha.destaque ? 'bg-slate-50/90 font-semibold' : 'hover:bg-slate-50'"
            >
              <td class="px-4 py-2.5" :class="linha.destaque ? 'text-slate-900' : 'pl-8 text-slate-600'">
                {{ linha.rotulo }}
              </td>
              <td class="px-3 py-2.5 text-right">{{ fmtInt(linha.metrics.totalSkus) }}</td>
              <td class="px-3 py-2.5 text-right">{{ fmtBRL(linha.metrics.receitaAtual) }}</td>
              <td class="px-3 py-2.5 text-right">{{ fmtBRL(linha.metrics.receitaSimulada) }}</td>
              <td class="px-3 py-2.5 text-right">{{ fmtBRL(linha.metrics.lucroAtual) }}</td>
              <td
                class="px-3 py-2.5 text-right font-semibold"
                :class="linha.metrics.lucroSimulado >= linha.metrics.lucroAtual ? 'text-emerald-700' : 'text-red-600'"
              >
                {{ fmtBRL(linha.metrics.lucroSimulado) }}
              </td>
              <td class="px-3 py-2.5 text-right">{{ fmtPct(linha.metrics.margemAtual, 1) }}</td>
              <td class="px-3 py-2.5 text-right">{{ fmtPct(linha.metrics.margemSimulada, 1) }}</td>
              <template v-if="dominio === 'rx'">
                <td class="px-3 py-2.5 text-right">{{ fmtPct(descontoDe(linha.metrics).atual, 1) }}</td>
                <td class="px-3 py-2.5 text-right text-teal-800">{{ fmtPct(descontoDe(linha.metrics).simulado, 1) }}</td>
              </template>
              <td class="px-3 py-2.5 text-right">{{ fmtInt(linha.metrics.qtdAumento) }}</td>
              <td class="px-3 py-2.5 text-right">{{ fmtInt(linha.metrics.qtdReducao) }}</td>
              <td class="px-3 py-2.5 text-right">{{ fmtInt(linha.metrics.qtdManter) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdsPanelCard>

    <EtapaRodape :dominio="dominio" etapa-id="resultados" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { DepartamentoRx } from "~/types/pricing";
import { fmtBRL, fmtCompactBRL, fmtInt, fmtPct, fmtSignedPct } from "~/utils/formatters";
import { summarizeGxSimulation, type GxSummaryMetrics } from "~/utils/gx-calculator";
import { DOMINIOS, type Dominio } from "~/utils/jornada";
import { summarizeRxSimulation, type RxSummaryMetrics } from "~/utils/rx-calculator";

type Metricas = RxSummaryMetrics | GxSummaryMetrics;

type LinhaResultado = {
  chave: string;
  rotulo: string;
  destaque: boolean;
  metrics: Metricas;
};

const props = defineProps<{ dominio: Dominio }>();

const { rxCalculatedRows, rxSummary, gxCalculatedRows, gxSummary } = usePricingPoc();

const def = computed(() => DOMINIOS[props.dominio]);
const resumo = computed(() => (props.dominio === "rx" ? rxSummary.value : gxSummary.value));
const rxResumo = computed(() => rxSummary.value);
const gxResumo = computed(() => gxSummary.value);

const linhas = computed<LinhaResultado[]>(() => {
  if (props.dominio === "rx") {
    const saida: LinhaResultado[] = [];
    for (const sens of ["Super Sensível", "Sensível", "Pouco Sensível"]) {
      const doNivel = rxCalculatedRows.value.filter((linha) => linha.sensibilidade === sens);
      saida.push({
        chave: sens,
        rotulo: sens,
        destaque: true,
        metrics: summarizeRxSimulation(doNivel),
      });
      for (const dept of ["MARCA", "PROPAGADO", "SIMILAR"] as DepartamentoRx[]) {
        saida.push({
          chave: `${sens}-${dept}`,
          rotulo: dept,
          destaque: false,
          metrics: summarizeRxSimulation(doNivel.filter((linha) => linha.departamento === dept)),
        });
      }
    }
    saida.push({ chave: "total", rotulo: "Total RX", destaque: true, metrics: rxSummary.value });
    return saida;
  }

  const grupos = [
    { chave: "p1", rotulo: "Degrau P1", filtro: (ordem: string) => ordem === "P1" },
    { chave: "p2", rotulo: "Degrau P2", filtro: (ordem: string) => ordem === "P2" },
    { chave: "p3", rotulo: "Degrau P3+", filtro: (ordem: string) => ordem !== "P1" && ordem !== "P2" },
  ];
  const porDegrau = grupos.map((grupo) => ({
    chave: grupo.chave,
    rotulo: grupo.rotulo,
    destaque: true,
    metrics: summarizeGxSimulation(gxCalculatedRows.value.filter((linha) => grupo.filtro(linha.ordemPreco))),
  }));
  const porSens = ["Super Sensível", "Sensível", "Pouco Sensível"].map((sens) => ({
    chave: sens,
    rotulo: sens,
    destaque: true,
    metrics: summarizeGxSimulation(gxCalculatedRows.value.filter((linha) => linha.sensibilidade === sens)),
  }));
  return [
    ...porDegrau,
    ...porSens,
    { chave: "total", rotulo: "Total GX", destaque: true, metrics: gxSummary.value },
  ];
});

function descontoDe(metrics: Metricas) {
  if ("descontoMedioAtual" in metrics) {
    return { atual: metrics.descontoMedioAtual, simulado: metrics.descontoMedioSimulado };
  }
  return { atual: 0, simulado: 0 };
}
</script>
