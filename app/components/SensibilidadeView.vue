<template>
  <div class="space-y-6">
    <EtapaCabecalho :dominio="dominio" etapa-id="sensibilidade" />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdsMetricCard
        v-for="nivel in NIVEIS"
        :key="nivel.id"
        type="kpi"
        :icon="nivel.icone"
        :title="nivel.id"
        :value="`${fmtInt(resumoNiveis[nivel.id].skus)} ${unidadePlural}`"
        :delta="`${fmtPct(resumoNiveis[nivel.id].shareReceita)} da receita`"
        delta-direction="up"
        delta-tone="positive"
        :hint="nivel.hint[dominio]"
      />
    </div>

    <AdsTabs v-model="aba" :items="abas" :content="false" />

    <AdsPanelCard
      v-if="aba === 'matriz'"
      :title="`Matriz 5×3 do ${def.nomeCurto}`"
      subtitle="Consulta. Faixa, cronicidade e nível vêm da planilha e não se editam aqui."
    >
      <div class="space-y-4">
        <AdsSegmentedTabs v-if="dominio === 'rx'" v-model="filtroDepto" :items="abasRx" />
        <p class="text-xs text-[var(--ads-text-secondary)] max-w-[72ch]">
          {{ notaMatriz }}
        </p>

        <div v-if="matriz" class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <th class="py-3 px-4 text-left font-semibold w-32">Faixa PMC</th>
                <th v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-3 px-4 text-center font-semibold">
                  {{ cron }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="faixa in FAIXAS_ORDEM" :key="faixa">
                <td class="py-3.5 px-4 font-semibold text-[var(--ads-text-primary)] bg-slate-50/50">
                  <div>{{ faixa }}</div>
                  <div v-if="faixaRangeLabel(faixa)" class="text-[11px] font-normal text-slate-500 tabular-nums">
                    {{ faixaRangeLabel(faixa) }}
                  </div>
                </td>
                <td
                  v-for="cron in CRONICIDADES_ORDEM"
                  :key="cron"
                  class="py-3 px-3 text-center align-middle transition-colors"
                  :class="cellSurfaceClass(matriz[faixa][cron])"
                >
                  <div class="inline-flex flex-col items-center gap-1.5 w-full py-1" :aria-label="`${faixa} ${cron}: ${matriz[faixa][cron]}`">
                    <AdsPill
                      size="sm"
                      :status="sensibilidadePillStatus(matriz[faixa][cron])"
                      :label="matriz[faixa][cron]"
                    />
                    <span class="text-xs font-semibold text-slate-800 tabular-nums">
                      {{ fmtInt(cellStats(faixa, cron).skus) }} {{ unidadePlural }}
                    </span>
                    <span class="text-[11px] text-slate-600 tabular-nums">
                      {{ fmtCompactBRL(cellStats(faixa, cron).receita) }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdsPanelCard>

    <AdsPanelCard
      v-else-if="aba === 'cortes'"
      title="Cortes de faixa de preço"
      subtitle="Quintis de PMC da aba Bases de RX_Sensibilidade.xlsx. Cada faixa concentra 20% dos itens do departamento."
    >
      <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
        <table class="w-full text-xs sm:text-sm border-collapse tabular-nums">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <th class="py-2.5 px-3 text-left">Departamento</th>
              <th v-for="q in [1, 2, 3, 4, 5]" :key="q" class="py-2.5 px-3 text-right">Faixa {{ q }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="dept in departamentos" :key="dept" class="hover:bg-slate-50">
              <td class="py-2.5 px-3 font-semibold text-[var(--ads-text-primary)]">{{ dept }}</td>
              <td v-for="q in [1, 2, 3, 4, 5]" :key="q" class="py-2.5 px-3 text-right text-slate-700">
                {{ quintilTexto(dept, q) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdsPanelCard>

    <AdsPanelCard
      v-else
      title="Cronicidade por classe terapêutica"
      subtitle="Consulta. A cronicidade da classe vem da planilha."
    >
      <div class="space-y-3">
        <AdsSearchInput v-model="buscaClasse" placeholder="Buscar classe terapêutica..." size="sm" />
        <div class="max-h-[560px] overflow-y-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)] divide-y divide-slate-200">
          <div
            v-for="cls in classesFiltradas"
            :key="cls.categoria"
            class="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white hover:bg-slate-50"
          >
            <p class="min-w-0 text-sm font-medium text-[var(--ads-text-primary)] truncate">{{ cls.categoria }}</p>
            <AdsPill size="sm" status="default" :label="getCronClasse(cls.categoria)" />
          </div>
        </div>
      </div>
    </AdsPanelCard>

    <EtapaRodape :dominio="dominio" etapa-id="sensibilidade" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { Cronicidade, FaixaPreco, NivelSensibilidade } from "~/types/pricing";
import { CRONICIDADES_ORDEM, FAIXAS_ORDEM } from "~/utils/flow-engines";
import { fmtBRL, fmtCompactBRL, fmtInt, fmtPct, sensibilidadePillStatus } from "~/utils/formatters";
import { DOMINIOS, type Dominio } from "~/utils/jornada";

const props = defineProps<{ dominio: Dominio }>();

const { sensData, cronicidadePorDominio, matrizSensPorDominio } = usePricingPoc();

const def = computed(() => DOMINIOS[props.dominio]);
const cronMap = computed(() => cronicidadePorDominio[props.dominio]);
const matrizRef = computed(() => matrizSensPorDominio[props.dominio]);
const matriz = computed(() => matrizRef.value.value);

const DEPTOS_RX = ["MARCA", "PROPAGADO", "SIMILAR"];
const departamentos = computed(() => (props.dominio === "rx" ? DEPTOS_RX : ["GENERICO"]));
const unidadePlural = computed(() => (props.dominio === "rx" ? "SKUs" : "itens"));

const filtroDepto = ref<string>("TODOS");
const buscaClasse = ref("");
const aba = ref<"matriz" | "cortes" | "cronicidade">("matriz");

const abas = [
  { label: "Matriz", value: "matriz" },
  { label: "Cortes de faixa de preço", value: "cortes" },
  { label: "Cronicidade por classe terapêutica", value: "cronicidade" },
];

const abasRx = [
  { label: "Todo o RX", value: "TODOS" },
  { label: "Marca", value: "MARCA" },
  { label: "Propagado", value: "PROPAGADO" },
  { label: "Similar", value: "SIMILAR" },
];

const NIVEIS = [
  {
    id: "Super Sensível" as const,
    icone: "i-lucide-flame",
    hint: {
      rx: "Uso contínuo e desembolso alto. Recebe o desconto mais competitivo.",
      gx: "Chaves crônicas e caras. Recebem o IC mais agressivo e a menor margem objetivo.",
    },
  },
  {
    id: "Sensível" as const,
    icone: "i-lucide-activity",
    hint: {
      rx: "Equilíbrio entre percepção de preço e margem.",
      gx: "IC e margem objetivo intermediários.",
    },
  },
  {
    id: "Pouco Sensível" as const,
    icone: "i-lucide-shield-check",
    hint: {
      rx: "Uso eventual ou desembolso baixo. Permite desconto menor e mais margem.",
      gx: "Chaves eventuais e baratas. Aceitam IC menos agressivo e margem objetivo maior.",
    },
  },
];

const notaMatriz = computed(() =>
  props.dominio === "rx"
    ? "A matriz é única para Marca, Propagado e Similar; cada departamento tem seus próprios cortes de faixa. As abas filtram a contagem."
    : "A matriz do GX é independente da do RX. Os cortes de faixa vêm do departamento Genérico.",
);

function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function getCronClasse(cat: string): Cronicidade {
  return cronMap.value.value[norm(cat)] ?? "EVENTUAL";
}

const classesFiltradas = computed(() => {
  const q = buscaClasse.value.trim().toLowerCase();
  const list = sensData.value?.classesCronicidade ?? [];
  if (!q) return list;
  return list.filter((c) => c.categoria.toLowerCase().includes(q));
});

function deptosDaCelula(): string[] {
  if (props.dominio === "gx") return ["GENERICO"];
  return filtroDepto.value === "TODOS" ? DEPTOS_RX : [filtroDepto.value];
}

function cellStats(faixa: FaixaPreco, cron: Cronicidade, deptos = deptosDaCelula()) {
  const dist = sensData.value?.distribuicao ?? [];
  let skus = 0;
  let receita = 0;
  for (const d of dist) {
    if (!deptos.includes(d.departamento)) continue;
    if (d.faixa === faixa && d.cronicidade === cron) {
      skus += d.skus;
      receita += d.receita12m;
    }
  }
  return { skus, receita };
}

const resumoNiveis = computed(() => {
  const base = {
    "Super Sensível": { skus: 0, receita: 0, shareReceita: 0 },
    "Sensível": { skus: 0, receita: 0, shareReceita: 0 },
    "Pouco Sensível": { skus: 0, receita: 0, shareReceita: 0 },
  };
  const m = matriz.value;
  if (!m) return base;
  const deptos = props.dominio === "gx" ? ["GENERICO"] : DEPTOS_RX;
  let recTotal = 0;
  for (const f of FAIXAS_ORDEM) {
    for (const c of CRONICIDADES_ORDEM) {
      const st = cellStats(f, c, deptos);
      const niv = m[f][c];
      base[niv].skus += st.skus;
      base[niv].receita += st.receita;
      recTotal += st.receita;
    }
  }
  for (const k of Object.keys(base) as NivelSensibilidade[]) {
    base[k].shareReceita = recTotal > 0 ? base[k].receita / recTotal : 0;
  }
  return base;
});

function cellSurfaceClass(sens: NivelSensibilidade): string {
  if (sens === "Super Sensível") return "bg-rose-50/50";
  if (sens === "Sensível") return "bg-amber-50/50";
  return "bg-emerald-50/40";
}

function faixaRangeLabel(faixa: FaixaPreco): string {
  const dept = props.dominio === "gx" ? "GENERICO" : filtroDepto.value;
  if (dept === "TODOS") return "";
  return quintilTexto(dept, parseInt(faixa.replace("FAIXA ", ""), 10));
}

function quintilTexto(dept: string, quintil: number): string {
  const item = sensData.value?.faixasQuintis.find((x) => x.departamento === dept && x.quintil === quintil);
  if (!item) return "—";
  return `${fmtBRL(item.inicio)} – ${fmtBRL(item.fim)}`;
}
</script>
