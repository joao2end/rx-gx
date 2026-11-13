<template>
  <div class="space-y-6">
    <div v-if="aba === 'concorrentes'" class="space-y-6">
        <AdsPanelCard
          title="Agressividade capturada na pesquisa RX"
          subtitle="Desconto médio sobre o PMC ponderado pela receita de cada medicamento e número de vitórias de menor preço."
        >
          <p class="mb-3 text-sm text-ads-text-secondary">
            O tipo da rede vem do cadastro compartilhado em Minha estratégia. Redes que já estão na base não pedem essa informação de novo.
          </p>
          <div class="space-y-3">
            <div
              v-for="rk in analiseCompetitivaRx.rankingConcorrentes"
              :key="rk.concorrente"
              class="p-3.5 rounded-[var(--ads-radius-sm,8px)] border border-slate-200 bg-white space-y-2"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm text-[var(--ads-text-primary)]">{{ rk.concorrente }}</span>
                  <AdsPill
                    size="sm"
                    :status="rk.tipo === 'ABRAF' ? 'new' : 'default'"
                    :label="rk.tipo === 'ABRAF' ? 'Abrafarma' : 'Independente'"
                  />
                </div>
                <div class="text-right tabular-nums">
                  <span class="text-sm font-bold text-teal-800">{{ fmtPct(rk.descMedioPonderado, 1) }}</span>
                  <span class="text-xs text-slate-500 ml-1">desc. pond.</span>
                </div>
              </div>
              <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-200"
                  :class="rk.tipo === 'ABRAF' ? 'bg-teal-600' : 'bg-indigo-600'"
                  :style="{ width: `${Math.min(100, rk.descMedioPonderado * 160)}%` }"
                />
              </div>
              <div class="flex justify-between text-[11px] text-slate-500 tabular-nums">
                <span><strong>{{ rk.skusMenorPreco }}</strong> SKUs com menor preço da praça</span>
                <span>{{ rk.coletasValidas }} coletas válidas pós-IQR</span>
              </div>
            </div>
          </div>
        </AdsPanelCard>
    </div>

    <AdsPanelCard
      v-else-if="aba === 'coleta' && dominio === 'gx'"
      title="Preço da praça por chave"
      :subtitle="`Pesquisa manual de ${fmtInt(chavesGx.length)} chaves. Outras ${fmtInt(qtdInternetGx)} chaves têm referência da pesquisa internet.`"
    >
      <div class="space-y-3">
        <div class="w-full sm:w-80">
          <AdsSearchInput v-model="buscaColeta" placeholder="Buscar chave..." size="sm" />
        </div>
        <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)] max-h-[540px] overflow-y-auto">
          <table class="w-full text-xs border-collapse tabular-nums min-w-[900px]">
            <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
              <tr>
                <th rowspan="2" class="py-2 px-3 text-left align-bottom">Chave</th>
                <th v-for="b in BALIZADORES" :key="b.id" colspan="3" class="py-2 px-2 text-center border-l border-slate-200">
                  {{ b.label }}
                </th>
              </tr>
              <tr>
                <template v-for="b in BALIZADORES" :key="b.id">
                  <th v-for="c in CANAIS" :key="c" class="py-1.5 px-2 text-right font-medium" :class="c === 'TODOS' ? 'border-l border-slate-200' : ''">
                    {{ c }}
                  </th>
                </template>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="ch in chavesGxFiltradas" :key="ch.chave" class="hover:bg-slate-50">
                <td class="py-2.5 px-3 font-semibold text-[var(--ads-text-primary)] max-w-[320px]">{{ ch.chave }}</td>
                <template v-for="b in BALIZADORES" :key="b.id">
                  <td
                    v-for="c in CANAIS"
                    :key="c"
                    class="py-2.5 px-2 text-right"
                    :class="[c === 'TODOS' ? 'border-l border-slate-200' : '', b.id === 'MIN' ? 'font-semibold text-slate-900' : 'text-slate-600']"
                  >
                    {{ ch.precos[b.id][c] !== null ? fmtBRL(ch.precos[b.id][c]!) : "—" }}
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-slate-500">
          Cada célula é o preço da chave em qualquer laboratório. O mínimo é o que o cliente encontra de mais barato e costuma balizar o P1.
        </p>
      </div>
    </AdsPanelCard>

    <AdsPanelCard
      v-else-if="aba === 'coleta'"
      title="Coleta física e tratamento de outliers"
      subtitle="Preços riscados foram automaticamente expurgados pelo filtro IQR [Q1 − 1,5×IQR ; Q3 + 1,5×IQR], preço ≥ PMC ou amostra única no canal."
    >
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="w-full sm:w-80">
            <AdsSearchInput v-model="buscaColeta" placeholder="Buscar medicamento pesquisado..." size="sm" />
          </div>
          <div class="text-xs text-slate-600">
            Total: <strong>{{ analiseCompetitivaRx.produtos.length }}</strong> Top Medicamentos pesquisados em 6 redes
          </div>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)] max-h-[540px] overflow-y-auto">
          <table class="w-full text-xs border-collapse tabular-nums min-w-[980px]">
            <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
              <tr>
                <th class="py-2.5 px-3 text-left">Medicamento</th>
                <th class="py-2.5 px-2 text-right">PMC</th>
                <th class="py-2.5 px-2 text-right">Meu Preço</th>
                <th v-for="c in ['MODERNA', 'PACHECO', 'POVÃO', 'RAIA', 'RETIRO', 'ULTRA']" :key="c" class="py-2.5 px-2 text-right">
                  {{ c }}
                </th>
                <th class="py-2.5 px-2 text-right bg-teal-50 text-teal-800">Desc ABRAF</th>
                <th class="py-2.5 px-2 text-right bg-indigo-50 text-indigo-800">Desc INDEP</th>
                <th class="py-2.5 px-2.5 text-right bg-slate-100 text-slate-800">Desc TODOS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="p in coletasFiltradas" :key="p.produtoId" class="hover:bg-slate-50">
                <td class="py-2.5 px-3">
                  <div class="font-semibold text-[var(--ads-text-primary)]">{{ p.produto }}</div>
                  <div class="text-[11px] text-slate-500">{{ p.departamento }} · {{ p.sensibilidade }}</div>
                </td>
                <td class="py-2.5 px-2 text-right text-slate-600">{{ fmtBRL(p.pmc) }}</td>
                <td class="py-2.5 px-2 text-right font-medium">{{ fmtBRL(p.precoRede) }}</td>
                <td
                  v-for="c in ['MODERNA', 'PACHECO', 'POVÃO', 'RAIA', 'RETIRO', 'ULTRA']"
                  :key="c"
                  class="py-2.5 px-2 text-right"
                >
                  <template v-if="p.precosPorConcorrente[c]">
                    <div
                      :class="
                        p.precosPorConcorrente[c]!.valido
                          ? 'text-slate-800 font-medium'
                          : 'line-through text-red-500'
                      "
                      :title="p.precosPorConcorrente[c]!.motivoOutlier || 'Coleta válida'"
                    >
                      {{ fmtBRL(p.precosPorConcorrente[c]!.preco) }}
                    </div>
                    <div class="text-[10px] text-slate-400">
                      {{ fmtPct(p.precosPorConcorrente[c]!.desc, 0) }}
                    </div>
                  </template>
                  <span v-else class="text-slate-300">—</span>
                </td>
                <td class="py-2.5 px-2 text-right font-semibold text-teal-800 bg-teal-50/30">
                  {{ p.descAbraf !== null ? fmtPct(p.descAbraf, 1) : "—" }}
                </td>
                <td class="py-2.5 px-2 text-right font-semibold text-indigo-800 bg-indigo-50/30">
                  {{ p.descIndep !== null ? fmtPct(p.descIndep, 1) : "—" }}
                </td>
                <td class="py-2.5 px-2.5 text-right font-bold text-slate-900 bg-slate-50">
                  {{ p.descTodos !== null ? fmtPct(p.descTodos, 1) : "—" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdsPanelCard>

    <AdsPanelCard
      v-else-if="aba === 'matriz'"
      title="Matriz de desconto online RX"
      subtitle="Um departamento por vez, com TODOS, ABRAF e INDEP na mesma grade. Uma célula editada recalcula a simulação RX."
    >
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <AdsSegmentedTabs
            v-model="deptoMatriz"
            :items="[
              { label: 'MARCA', value: 'MARCA' },
              { label: 'PROPAGADO', value: 'PROPAGADO' },
              { label: 'SIMILAR', value: 'SIMILAR' },
            ]"
          />
          <AdsButton
            v-if="Object.keys(rxMatrizManualOverrides).length > 0"
            type="outline"
            color="neutral"
            size="sm"
            label="Limpar edições manuais da matriz"
            @click="rxMatrizManualOverrides = {}"
          />
        </div>

        <div class="overflow-x-auto rounded-[var(--ads-radius-sm,8px)] border border-[var(--ads-border-subtle,#dfe1e6)]">
          <table class="w-full min-w-[40rem] table-fixed border-collapse text-xs tabular-nums">
            <thead>
              <tr class="border-b border-[var(--ads-border-subtle,#dfe1e6)] text-[11px] uppercase text-ads-text-secondary">
                <th rowspan="2" class="sticky left-0 z-10 w-24 bg-[var(--ads-surface-card,#fff)] px-2.5 py-2 text-left align-bottom">
                  Faixa
                </th>
                <th
                  v-for="canal in CANAIS"
                  :key="canal"
                  colspan="3"
                  class="border-l border-[var(--ads-border-subtle,#dfe1e6)] px-2 py-2 text-center"
                  :class="canalHeaderClass(canal)"
                >
                  {{ canal }}
                </th>
              </tr>
              <tr class="border-b border-[var(--ads-border-subtle,#dfe1e6)] text-[11px] text-ads-text-tertiary">
                <template v-for="canal in CANAIS" :key="canal">
                  <th
                    v-for="(cron, indice) in CRONICIDADES_ORDEM"
                    :key="`${canal}-${cron}`"
                    class="px-1 py-1.5 text-center font-medium"
                    :class="[indice === 0 ? 'border-l border-[var(--ads-border-subtle,#dfe1e6)]' : '', canalHeaderClass(canal)]"
                  >
                    {{ rotuloCronicidade(cron) }}
                  </th>
                </template>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ads-border-subtle,#dfe1e6)]">
              <tr v-for="faixa in FAIXAS_ORDEM" :key="faixa">
                <td class="sticky left-0 z-10 bg-[var(--ads-surface-card,#fff)] px-2.5 py-1.5 font-semibold text-ads-text-primary">
                  {{ faixa }}
                </td>
                <template v-for="canal in CANAIS" :key="canal">
                  <td
                    v-for="(cron, indice) in CRONICIDADES_ORDEM"
                    :key="`${canal}-${cron}`"
                    class="px-1 py-1"
                    :class="indice === 0 ? 'border-l border-[var(--ads-border-subtle,#dfe1e6)]' : ''"
                  >
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="90"
                      :value="getMatrizCellPct(deptoMatriz, cron, faixa, canal)"
                      :aria-label="`Desconto ${deptoMatriz} ${canal} ${faixa} ${cron}`"
                      class="w-full rounded border px-1 py-1 text-right text-xs font-semibold tabular-nums focus:outline-2 focus:outline-[var(--ads-border-focused,#006ff7)]"
                      :class="
                        hasManualMatrizOverride(deptoMatriz, cron, faixa, canal)
                          ? 'border-amber-400 bg-amber-50 text-amber-900'
                          : 'border-[var(--ads-border-subtle,#dfe1e6)] bg-white text-ads-text-primary'
                      "
                      @change="(e) => setMatrizCellPct(deptoMatriz, cron, faixa, canal, (e.target as HTMLInputElement).value)"
                    />
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-[length:var(--ads-font-size-xxs)] text-ads-text-secondary">
          Célula em âmbar foi editada à mão. Os três departamentos cobrem os 2.899 SKUs sem pesquisa física.
        </p>
      </div>
    </AdsPanelCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { Cronicidade, DepartamentoRx, FaixaPreco, TipoConcorrente } from "~/types/pricing";
import { CRONICIDADES_ORDEM, FAIXAS_ORDEM } from "~/utils/flow-engines";
import { fmtBRL, fmtInt, fmtPct } from "~/utils/formatters";
import type { Dominio } from "~/utils/jornada";

const props = defineProps<{ dominio: Dominio; aba: "concorrentes" | "coleta" | "matriz" }>();

const BALIZADORES = [
  { id: "MIN" as const, label: "Mínimo" },
  { id: "MED" as const, label: "Médio" },
  { id: "MAX" as const, label: "Máximo" },
];
const CANAIS = ["TODOS", "ABRAF", "INDEP"] as const;

const {
  gxSimData,
  analiseCompetitivaRx,
  rxMatrizLookup,
  rxMatrizManualOverrides,
} = usePricingPoc();

const chavesGx = computed(() =>
  Object.entries(gxSimData.value?.pesqManual ?? {}).map(([chave, precos]) => ({ chave, precos })),
);
const qtdInternetGx = computed(() => {
  const manuais = new Set(chavesGx.value.map((c) => c.chave));
  return Object.keys(gxSimData.value?.pesqInternet ?? {}).filter((k) => !manuais.has(k)).length;
});
const chavesGxFiltradas = computed(() => {
  const q = buscaColeta.value.trim().toLowerCase();
  if (!q) return chavesGx.value;
  return chavesGx.value.filter((c) => c.chave.toLowerCase().includes(q));
});
const buscaColeta = ref("");
const deptoMatriz = ref<DepartamentoRx>("MARCA");

const ROTULO_CRONICIDADE: Record<Cronicidade, string> = {
  EVENTUAL: "Eventual",
  FREQUENTE: "Frequente",
  CRONICO: "Crônico",
};

function rotuloCronicidade(cron: Cronicidade): string {
  return ROTULO_CRONICIDADE[cron];
}

function canalHeaderClass(canal: TipoConcorrente): string {
  if (canal === "ABRAF") return "bg-teal-50 text-teal-800";
  if (canal === "INDEP") return "bg-indigo-50 text-indigo-800";
  return "bg-slate-50 text-slate-700";
}

const coletasFiltradas = computed(() => {
  const q = buscaColeta.value.trim().toLowerCase();
  if (!q) return analiseCompetitivaRx.value.produtos;
  return analiseCompetitivaRx.value.produtos.filter((p) => p.produto.toLowerCase().includes(q));
});

function getMatrizCellPct(
  dept: DepartamentoRx,
  cron: Cronicidade,
  faixa: FaixaPreco,
  canal: TipoConcorrente,
): string {
  const val = rxMatrizLookup.value[`${dept}|${cron}|${faixa}|${canal}`];
  if (val === null || val === undefined) return "";
  return (val * 100).toFixed(2);
}

function hasManualMatrizOverride(
  dept: DepartamentoRx,
  cron: Cronicidade,
  faixa: FaixaPreco,
  canal: TipoConcorrente,
): boolean {
  const k = `${dept}|${cron}|${faixa}|${canal}`;
  return rxMatrizManualOverrides.value[k] !== undefined && rxMatrizManualOverrides.value[k] !== null;
}

function setMatrizCellPct(
  dept: DepartamentoRx,
  cron: Cronicidade,
  faixa: FaixaPreco,
  canal: TipoConcorrente,
  rawVal: string,
) {
  const k = `${dept}|${cron}|${faixa}|${canal}`;
  const num = parseFloat(rawVal);
  rxMatrizManualOverrides.value = {
    ...rxMatrizManualOverrides.value,
    [k]: Number.isFinite(num) ? Math.max(0, Math.min(0.95, num / 100)) : null,
  };
}
</script>
