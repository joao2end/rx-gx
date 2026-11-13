<template>
  <div class="space-y-6">
    <EtapaCabecalho :dominio="dominio" etapa-id="exportacao" :titulo="`Exportação ${def.nomeCurto}`" />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-file-spreadsheet"
        title="Itens elegíveis PlugPharma"
        :value="`${fmtInt(elegiveis)} itens`"
        :delta="`${fmtInt(comTroca)} com troca de preço`"
        delta-direction="up"
        delta-tone="positive"
        hint="Entram na carga os itens com PMC maior que zero e decisão Aceitar."
      />
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-trending-up"
        :title="`Impacto mensal no lucro ${def.nomeCurto}`"
        :value="fmtBRL(resumo.variacaoLucro)"
        :delta="fmtCompactBRL(resumo.variacaoLucro * 12) + '/ano'"
        :delta-direction="resumo.variacaoLucro >= 0 ? 'up' : 'down'"
        :delta-tone="resumo.variacaoLucro >= 0 ? 'positive' : 'negative'"
      />
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-package-check"
        title="Itens sem PMC"
        :value="`${fmtInt(semPmc)} itens`"
        delta="Fora da carga PlugPharma"
        delta-direction="up"
        delta-tone="positive"
        hint="Registros sem PMC seguem a rota do ERP e nunca entram nos arquivos PlugPharma (SQA-188)."
      />
    </div>

    <AdsPanelCard
      :title="`Arquivos da jornada ${def.nomeCurto}`"
      subtitle="Uma ação gera o tabloide e a lista de desconto. A memória de cálculo fica à parte."
    >
      <div class="flex flex-wrap items-center gap-3">
        <AdsButton
          type="filled"
          leading
          icon="i-lucide-download"
          label="Baixar tabloide e lista de desconto"
          @click="baixarBalcao"
        />
        <AdsButton
          type="outline"
          color="neutral"
          size="sm"
          leading
          icon="i-lucide-file-spreadsheet"
          label="Baixar memória de cálculo"
          @click="baixarCsv('auditoria', `auditoria_simulacao_${dominio}.csv`)"
        />
      </div>
      <p class="mt-3 text-xs text-ads-text-secondary">
        {{ fmtInt(elegiveis) }} itens na lista de desconto e {{ fmtInt(comTroca) }} no tabloide.
      </p>
    </AdsPanelCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AdsPanelCard
        title="Aderência: simulado contra o preço da loja"
        subtitle="Quantos itens caem, mantêm ou sobem em relação ao preço praticado hoje."
      >
        <div class="space-y-3">
          <div v-for="faixa in faixasAderencia" :key="faixa.label" class="space-y-1">
            <div class="flex justify-between text-xs text-slate-600">
              <span class="font-semibold text-slate-800">{{ faixa.label }}</span>
              <span class="tabular-nums">{{ fmtInt(faixa.qtd) }} {{ def.unidade === "chave" ? "itens" : "SKUs" }}</span>
            </div>
            <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full" :class="def.cor.solido" :style="{ width: faixa.largura }" />
            </div>
          </div>
        </div>
      </AdsPanelCard>
      <AdsPanelCard title="Ajuste de cadastro" subtitle="Capacidade compartilhada com o autosserviço.">
        <p class="text-sm text-slate-700 leading-relaxed max-w-[64ch]">
          Separar e unir cadastro é a mesma capacidade que está em desenvolvimento para o autosserviço. A jornada {{ def.nomeCurto }} reutiliza essa tela e não abre um cadastro paralelo.
        </p>
      </AdsPanelCard>
    </div>

    <AdsPanelCard title="Prévia da carga" subtitle="Primeiros 25 itens com troca de preço.">
      <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
        <table class="w-full text-xs border-collapse tabular-nums">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
              <th v-if="dominio === 'gx'" class="py-2.5 px-3 text-left">Degrau</th>
              <th class="py-2.5 px-3 text-left">ID</th>
              <th class="py-2.5 px-3 text-left">Descrição</th>
              <th class="py-2.5 px-3 text-right">PMC</th>
              <th class="py-2.5 px-3 text-right">Preço atual</th>
              <th class="py-2.5 px-3 text-right">Preço final</th>
              <th class="py-2.5 px-3 text-right">% desc. PMC</th>
              <th class="py-2.5 px-3 text-center">Recomendação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="item in previa" :key="item.id" class="hover:bg-slate-50">
              <td v-if="dominio === 'gx'" class="py-2 px-3">
                <AdsPill size="sm" status="new" :label="item.degrau" />
              </td>
              <td class="py-2 px-3 font-mono text-slate-600">{{ item.id }}</td>
              <td class="py-2 px-3 font-medium text-slate-900">{{ item.descricao }}</td>
              <td class="py-2 px-3 text-right">{{ fmtBRL(item.pmc) }}</td>
              <td class="py-2 px-3 text-right">{{ fmtBRL(item.atual) }}</td>
              <td class="py-2 px-3 text-right font-bold text-blue-900">{{ fmtBRL(item.final) }}</td>
              <td class="py-2 px-3 text-right font-semibold text-teal-800">{{ fmtPct(item.descPmc, 1) }}</td>
              <td class="py-2 px-3 text-center">
                <span
                  class="text-[11px] font-semibold"
                  :class="item.status === 'Aumento de preço' ? 'text-emerald-700' : 'text-blue-700'"
                >
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdsPanelCard>

    <EtapaRodape :dominio="dominio" etapa-id="exportacao" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import { buildPlugPharmaCsv } from "~/utils/flow-engines";
import { fmtBRL, fmtCompactBRL, fmtInt, fmtPct } from "~/utils/formatters";
import { DOMINIOS, type Dominio } from "~/utils/jornada";

type Modo = "tabloide" | "desconto" | "auditoria";

const props = defineProps<{ dominio: Dominio }>();

const toast = useToast();
const { rxCalculatedRows, gxCalculatedRows, rxSummary, gxSummary } = usePricingPoc();

const def = computed(() => DOMINIOS[props.dominio]);
const linhas = computed(() =>
  props.dominio === "rx"
    ? rxCalculatedRows.value.map((r) => ({ ...r, degrau: "" }))
    : gxCalculatedRows.value.map((g) => ({ ...g, degrau: g.ordemPreco })),
);
const resumo = computed(() => (props.dominio === "rx" ? rxSummary.value : gxSummary.value));

const elegiveis = computed(() => linhas.value.filter((r) => r.pmc > 0 && r.seguir).length);
const comTroca = computed(
  () => linhas.value.filter((r) => r.pmc > 0 && r.alteracaoStatus !== "Manter o preço").length,
);
const semPmc = computed(() => linhas.value.filter((r) => r.pmc <= 0).length);

const faixasAderencia = computed(() => {
  const bandas = [
    { label: "Queda acima de 5%", testa: (v: number) => v < -0.05 },
    { label: "Queda até 5%", testa: (v: number) => v < -0.001 && v >= -0.05 },
    { label: "Mantém o preço", testa: (v: number) => v >= -0.001 && v <= 0.001 },
    { label: "Alta até 5%", testa: (v: number) => v > 0.001 && v <= 0.05 },
    { label: "Alta acima de 5%", testa: (v: number) => v > 0.05 },
  ];
  const base = linhas.value.filter((r) => r.precoAtual > 0);
  const contagens = bandas.map((b) => base.filter((r) => b.testa(r.variacaoPct)).length);
  const maior = Math.max(...contagens, 1);
  return bandas.map((b, i) => ({
    label: b.label,
    qtd: contagens[i]!,
    largura: `${(contagens[i]! / maior) * 100}%`,
  }));
});

const previa = computed(() =>
  linhas.value
    .filter((r) => r.pmc > 0 && r.alteracaoStatus !== "Manter o preço")
    .slice(0, 25)
    .map((r) => ({
      id: r.produtoId,
      degrau: r.degrau,
      descricao: r.descricao,
      pmc: r.pmc,
      atual: r.precoAtual,
      final: r.precoFinal,
      descPmc: r.descontoSimulado,
      status: r.alteracaoStatus,
    })),
);

function baixarBalcao() {
  const sufixo = props.dominio;
  baixarCsv("desconto", `plugpharma_lista_desconto_${sufixo}.csv`, false);
  window.setTimeout(() => baixarCsv("tabloide", `plugpharma_tabloide_${sufixo}.csv`, false), 400);
  toast.add({
    title: "Tabloide e lista de desconto gerados",
    description: "Os dois arquivos da jornada foram baixados.",
    color: "success",
  });
}

function baixarCsv(mode: Modo, filename: string, avisar = true) {
  const content =
    props.dominio === "rx"
      ? buildPlugPharmaCsv(rxCalculatedRows.value, [], mode)
      : buildPlugPharmaCsv([], gxCalculatedRows.value, mode);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (avisar) toast.add({ title: `Arquivo ${filename} gerado`, description: "Download iniciado.", color: "success" });
}
</script>
