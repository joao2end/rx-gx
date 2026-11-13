<template>
  <div v-if="gxCockpit" class="space-y-6">
    <EtapaCabecalho dominio="gx" etapa-id="parametrizacao" titulo="Parametrização GX">
      <template #actions>
        <AdsButton
          type="outline"
          color="neutral"
          size="sm"
          leading
          icon="i-lucide-rotate-ccw"
          label="Restaurar parâmetros"
          @click="handleReset"
        />
      </template>
    </EtapaCabecalho>

    <AdsPanelCard
      v-if="nivel === 'simples'"
      title="Parâmetros da planilha"
      subtitle="No nível Simples a simulação usa as regras já gravadas. IC, margem, escada e o P1 da chave ficam fechados."
    >
      <p class="text-sm text-ads-text-secondary max-w-[68ch]">
        Abra Avançado ou Completo no topo para editar o IC, a margem e a escada. Os preços continuam na simulação. A ordem dos laboratórios vem da Validação dos Ps.
      </p>
    </AdsPanelCard>

    <template v-else>
      <AdsPanelCard
        title="Simulador visual da escada por chave (P1 → P2 → P3...)"
        subtitle="A ordem P1..Pn vem da etapa Validação dos Ps e não se altera aqui. O preço forçado do P1 recalcula os degraus. A grade fica na simulação."
      >
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-5 space-y-3">
            <AdsSearchInput
              v-model="buscaChaveEscada"
              placeholder="Buscar chave (ex: TADALAFILA, OMEPRAZOL, ROSUVASTATINA)..."
              size="sm"
            />
            <div class="max-h-[340px] overflow-y-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)] divide-y divide-slate-200">
              <button
                v-for="ch in chavesAgrupadasFiltradas.slice(0, 80)"
                :key="ch.chave"
                type="button"
                class="w-full text-left px-3.5 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2"
                :class="chaveFocoNome === ch.chave ? 'bg-indigo-50/90' : 'bg-white hover:bg-slate-50'"
                @click="chaveFocoNome = ch.chave"
              >
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-[var(--ads-text-primary)] truncate">{{ ch.chave }}</div>
                  <div class="text-[11px] text-slate-500">
                    {{ ch.tipoPrecificacao || "Sem P1" }} · {{ ch.itens.length }} lab(s)
                  </div>
                </div>
                <div class="text-right shrink-0 tabular-nums">
                  <div class="text-xs font-bold text-indigo-800">P1 {{ fmtBRL(ch.precoP1) }}</div>
                  <div v-if="ch.degrauPct" class="text-[10px] text-slate-500">+{{ fmtPct(ch.degrauPct, 1) }}/degrau</div>
                </div>
              </button>
            </div>
          </div>

          <div v-if="chaveFoco" class="lg:col-span-7 space-y-4">
            <div class="p-3.5 rounded-[var(--ads-radius-sm,8px)] bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
              <div class="space-y-0.5">
                <div class="font-bold text-sm text-[var(--ads-text-primary)]">{{ chaveFoco.chave }}</div>
                <div class="text-slate-600">
                  Método P1: <strong>{{ chaveFoco.tipoPrecificacao }}</strong>
                  <span v-if="chaveFoco.pmcPonderado"> · PMC Pond. Pós-P1: <strong>{{ fmtBRL(chaveFoco.pmcPonderado) }}</strong></span>
                  <span v-if="chaveFoco.degrauPct"> · Degrau Efetivo: <strong>+{{ fmtPct(chaveFoco.degrauPct, 1) }}</strong></span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <label class="text-xs font-semibold text-indigo-900">Forçar P1 Chave (R$):</label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  placeholder="Auto"
                  :value="gxChaveP1ManualMap[chaveFoco.chave] ?? ''"
                  class="w-24 text-right px-2 py-1 rounded border border-indigo-300 bg-white text-xs font-bold text-indigo-900"
                  @change="(e) => setChaveP1Manual(chaveFoco!.chave, (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <div class="space-y-2.5">
              <div
                v-for="sku in chaveFoco.itens"
                :key="sku.produtoId"
                class="p-3 rounded-[var(--ads-radius-sm,8px)] border border-slate-200 bg-white space-y-2 tabular-nums"
              >
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-2">
                    <AdsPill
                      size="sm"
                      :status="sku.ordemPreco === 'P1' ? 'new' : 'default'"
                      :label="sku.ordemPreco"
                    />
                    <strong class="text-[var(--ads-text-primary)]">{{ sku.laboratorio }}</strong>
                    <span class="text-slate-500">{{ sku.descricao }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-slate-500">Atual: {{ fmtBRL(sku.precoAtual) }}</span>
                    <span class="text-slate-500">PMC: {{ fmtBRL(sku.pmc) }}</span>
                    <strong class="text-sm text-indigo-900">Final: {{ fmtBRL(sku.precoFinal) }}</strong>
                  </div>
                </div>

                <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    class="h-full rounded-full transition-all duration-200"
                    :class="sku.ordemPreco === 'P1' ? 'bg-indigo-600' : 'bg-blue-500'"
                    :style="{ width: `${sku.pmc > 0 ? Math.min(100, (sku.precoFinal / sku.pmc) * 100) : 50}%` }"
                  />
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                  <span>
                    Custo {{ fmtBRL(sku.custoComComissao) }} · Margem Final <strong>{{ fmtPct(sku.margemFinal, 1) }}</strong> · {{ sku.motivoRegra }}
                  </span>
                  <div class="inline-flex items-center gap-1">
                    <span>Ajuste:</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      placeholder="—"
                      :value="sku.ajusteManual ?? ''"
                      class="w-20 text-right px-1.5 py-0.5 rounded border border-slate-300 text-xs font-semibold"
                      @change="(e) => setSkuManualGx(sku, (e.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdsPanelCard>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdsPanelCard
          title="Política de Preço IC (%) · Pesquisa Manual (Top 30 Chaves)"
          subtitle="Fator multiplicado sobre o preço do P1 concorrente (ex: 97% posiciona o P1 3% abaixo do concorrente)."
        >
          <table class="w-full text-xs border-collapse tabular-nums border border-slate-200">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th class="py-2 px-3 text-left">Faixa PMC</th>
                <th v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-2 px-2 text-right">{{ cron }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="faixa in FAIXAS_ORDEM" :key="faixa">
                <td class="py-2 px-3 font-semibold text-slate-700 bg-slate-50/40">{{ faixa }}</td>
                <td v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-1.5 px-2 text-right">
                  <input
                    type="number"
                    step="1"
                    min="50"
                    max="150"
                    :value="Math.round(gxCockpit.icManual.politicaIc[faixa][cron] * 100)"
                    class="w-16 text-right px-1.5 py-1 rounded border border-slate-300 font-semibold"
                    @change="(e) => (gxCockpit!.icManual.politicaIc[faixa][cron] = Number((e.target as HTMLInputElement).value) / 100)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </AdsPanelCard>

        <AdsPanelCard
          title="Política de Preço IC (%) · Pesquisa Internet (600 Chaves)"
          subtitle="Aplicada às chaves cobertas por provedores online (Infoprice) quando não há pesquisa manual."
        >
          <table class="w-full text-xs border-collapse tabular-nums border border-slate-200">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th class="py-2 px-3 text-left">Faixa PMC</th>
                <th v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-2 px-2 text-right">{{ cron }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="faixa in FAIXAS_ORDEM" :key="faixa">
                <td class="py-2 px-3 font-semibold text-slate-700 bg-slate-50/40">{{ faixa }}</td>
                <td v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-1.5 px-2 text-right">
                  <input
                    type="number"
                    step="1"
                    min="50"
                    max="150"
                    :value="Math.round(gxCockpit.icInternet.politicaIc[faixa][cron] * 100)"
                    class="w-16 text-right px-1.5 py-1 rounded border border-slate-300 font-semibold"
                    @change="(e) => (gxCockpit!.icInternet.politicaIc[faixa][cron] = Number((e.target as HTMLInputElement).value) / 100)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </AdsPanelCard>

        <AdsPanelCard
          title="Margem Objetivo (%) · Chaves sem Pesquisa"
          subtitle="Preço Partida P1 = Custo ÷ (1 − Margem Objetivo) para chaves fora da pesquisa manual e internet."
        >
          <table class="w-full text-xs border-collapse tabular-nums border border-slate-200">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th class="py-2 px-3 text-left">Faixa PMC</th>
                <th v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-2 px-2 text-right">{{ cron }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="faixa in FAIXAS_ORDEM" :key="faixa">
                <td class="py-2 px-3 font-semibold text-slate-700 bg-slate-50/40">{{ faixa }}</td>
                <td v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-1.5 px-2 text-right">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="85"
                    :value="Math.round(gxCockpit.margemObjetivo[faixa][cron] * 100)"
                    class="w-16 text-right px-1.5 py-1 rounded border border-slate-300 font-semibold"
                    @change="(e) => (gxCockpit!.margemObjetivo[faixa][cron] = Math.min(0.9, Number((e.target as HTMLInputElement).value) / 100))"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </AdsPanelCard>

        <AdsPanelCard
          title="Piso de Margem Crítica GX (%) · Pesquisa Internet"
          subtitle="Protege a rentabilidade mínima tanto do P1 quanto dos degraus P2..Pn."
        >
          <table class="w-full text-xs border-collapse tabular-nums border border-slate-200">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th class="py-2 px-3 text-left">Faixa PMC</th>
                <th v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-2 px-2 text-right">{{ cron }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="faixa in FAIXAS_ORDEM" :key="faixa">
                <td class="py-2 px-3 font-semibold text-slate-700 bg-slate-50/40">{{ faixa }}</td>
                <td v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-1.5 px-2 text-right">
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="80"
                    :value="Math.round(gxCockpit.margemCritica['PESQ INTERNET'][faixa][cron] * 100)"
                    class="w-16 text-right px-1.5 py-1 rounded border border-slate-300 font-semibold"
                    @change="(e) => (gxCockpit!.margemCritica['PESQ INTERNET'][faixa][cron] = Math.min(0.85, Number((e.target as HTMLInputElement).value) / 100))"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </AdsPanelCard>
      </div>

      <div v-if="nivel === 'completo'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdsPanelCard
          title="Limites fixos da escada"
          subtitle="O degrau mínimo e a abertura máxima não se editam. A ordem dos laboratórios vem da Validação dos Ps."
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p class="sm:col-span-2 text-sm text-ads-text-secondary">
              Degrau mínimo de {{ Math.round(gxCockpit.aumentoMinimo * 100) }}% e abertura máxima de {{ Math.round(gxCockpit.aumentoMaximoP1 * 100) }}% sobre o P1.
            </p>
            <AdsNumberInput
              :model-value="Math.round((gxCockpit.aliquotaImpostos ?? 0) * 1000) / 10"
              label="Alíquota sobre a margem bruta (%)"
              suffix="%"
              :min="0"
              :step="0.5"
              hint="Margem líquida = margem bruta exibida − esta alíquota. O preço não muda."
              @update:model-value="(v) => (gxCockpit!.aliquotaImpostos = Number(v) / 100)"
            />
            <AdsNumberInput
              :model-value="Math.round((gxCockpit.margemMinimaLiquida ?? 0) * 1000) / 10"
              label="Margem líquida mínima (%)"
              suffix="%"
              :min="0"
              :step="0.5"
              hint="A grade marca alerta quando a líquida fica abaixo deste piso."
              @update:model-value="(v) => (gxCockpit!.margemMinimaLiquida = Number(v) / 100)"
            />
          </div>
        </AdsPanelCard>

        <AdsPanelCard
          title="Farol de variação"
          subtitle="Indiferença é a variação mínima. Linear é a máxima. Indiferença 0 é ignorada."
        >
          <div class="space-y-4">
            <p class="text-xs font-semibold text-ads-text-secondary">Linear (máxima ±%)</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <AdsNumberInput
                v-for="m in (['PESQ MANUAL', 'PESQ INTERNET', 'MARGEM OBJETIVO'] as const)"
                :key="`lim-${m}`"
                :model-value="Math.round(gxCockpit.farolVariacao[m].limiar * 100)"
                :label="m"
                suffix="%"
                :min="0"
                :step="5"
                @update:model-value="(v) => (gxCockpit!.farolVariacao[m].limiar = Math.max(0, Number(v) / 100))"
              />
            </div>
            <p class="text-xs font-semibold text-ads-text-secondary">Indiferença (mínima ±%)</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <AdsNumberInput
                v-for="m in (['PESQ MANUAL', 'PESQ INTERNET', 'MARGEM OBJETIVO'] as const)"
                :key="`ind-${m}`"
                :model-value="Math.round(gxCockpit.farolVariacao[m].indiferenca * 100)"
                :label="m"
                suffix="%"
                :min="0"
                :step="1"
                @update:model-value="(v) => (gxCockpit!.farolVariacao[m].indiferenca = Math.max(0, Number(v) / 100))"
              />
            </div>
          </div>
        </AdsPanelCard>
      </div>
    </template>

    <EtapaRodape dominio="gx" etapa-id="parametrizacao" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { GxCalculatedSku } from "~/types/pricing";
import { CRONICIDADES_ORDEM, FAIXAS_ORDEM } from "~/utils/flow-engines";
import { fmtBRL, fmtPct } from "~/utils/formatters";

const toast = useToast();
const {
  gxCockpit,
  gxChaveP1ManualMap,
  gxManualPriceMap,
  gxCalculatedRows,
  resetGxDefaults,
} = usePricingPoc();

const nivel = useState<"simples" | "avancado" | "completo">("poc-nivel-detalhe", () => "simples");
const buscaChaveEscada = ref("");
const chaveFocoNome = ref("TADALAFILA COMPRIMIDO 20 MG x 4");

interface ChaveAgrupadaEscada {
  chave: string;
  tipoPrecificacao: string;
  precoP1: number;
  pmcPonderado: number | null;
  degrauPct: number | null;
  receitaTotal: number;
  itens: GxCalculatedSku[];
}

const chavesAgrupadas = computed<ChaveAgrupadaEscada[]>(() => {
  const map = new Map<string, GxCalculatedSku[]>();
  for (const r of gxCalculatedRows.value) {
    const arr = map.get(r.chave) ?? [];
    arr.push(r);
    map.set(r.chave, arr);
  }
  const list: ChaveAgrupadaEscada[] = [];
  for (const [chave, itens] of map.entries()) {
    const sorted = [...itens].sort((a, b) => a.ordemPreco.localeCompare(b.ordemPreco));
    const nonP1 = sorted.find((x) => x.ordemPreco !== "P1");
    list.push({
      chave,
      tipoPrecificacao: sorted[0]?.tipoPrecificacao || "",
      precoP1: sorted[0]?.precoP1Chave ?? 0,
      pmcPonderado: nonP1?.pmcPonderadoChave ?? null,
      degrauPct: nonP1?.degrauAplicadoPct ?? null,
      receitaTotal: sorted.reduce((acc, x) => acc + x.receita1m, 0),
      itens: sorted,
    });
  }
  list.sort((a, b) => (b.itens.length > 1 ? 1 : 0) - (a.itens.length > 1 ? 1 : 0) || b.receitaTotal - a.receitaTotal);
  return list;
});

const chavesAgrupadasFiltradas = computed(() => {
  const q = buscaChaveEscada.value.trim().toLowerCase();
  if (!q) return chavesAgrupadas.value;
  return chavesAgrupadas.value.filter((c) => c.chave.toLowerCase().includes(q));
});

const chaveFoco = computed(
  () => chavesAgrupadas.value.find((c) => c.chave === chaveFocoNome.value) ?? chavesAgrupadasFiltradas.value[0] ?? null,
);

function setChaveP1Manual(chave: string, rawVal: string) {
  const num = parseFloat(rawVal);
  gxChaveP1ManualMap.value = {
    ...gxChaveP1ManualMap.value,
    [chave]: Number.isFinite(num) && num > 0 ? num : null,
  };
}

function setSkuManualGx(sku: GxCalculatedSku, rawVal: string) {
  const key = `${sku.produtoId}|${sku.cluster}`;
  const num = parseFloat(rawVal);
  gxManualPriceMap.value = {
    ...gxManualPriceMap.value,
    [key]: Number.isFinite(num) && num > 0 ? num : null,
  };
}

function handleReset() {
  resetGxDefaults();
  toast.add({ title: "Parâmetros GX restaurados ao padrão da planilha", color: "neutral" });
}
</script>
