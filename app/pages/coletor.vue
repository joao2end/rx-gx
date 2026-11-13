<template>
  <div class="space-y-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold text-[var(--ads-text-primary,#172b4d)] tracking-tight">Lista do coletor</h1>
      <p class="text-sm text-[var(--ads-text-secondary,#42526e)] max-w-[80ch] leading-relaxed">
        Visão única do que o coletor leva à loja. RX e GX aparecem juntos apenas nesta tela: uma visita, uma lista. Cada item continua guardado no seu domínio, SKU no RX e chave no GX, e o upload devolve cada resultado para o lugar certo.
      </p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-list-checks"
        title="Itens na lista"
        :value="`${fmtInt(listaColetor.length)} itens`"
        :delta="`${fmtInt(contagem.RX)} SKUs RX · ${fmtInt(contagem.GX)} chaves GX`"
        delta-direction="up"
        delta-tone="positive"
        hint="Soma das listas selecionadas em Marca, Propagado, Similar e Genérico."
      />
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-receipt"
        title="Receita coberta (3M)"
        :value="fmtCompactBRL(receitaTotal)"
        delta="Base de decisão da lista"
        delta-direction="up"
        delta-tone="positive"
      />
      <AdsMetricCard
        type="kpi"
        icon="i-lucide-database"
        title="Armazenamento"
        value="Separado"
        delta="RX por SKU · GX por chave"
        delta-direction="up"
        delta-tone="positive"
        hint="A visão junta os itens. Os dados não se misturam: a formação de preço de RX e GX continua separada."
      />
    </div>

    <AdsPanelCard
      title="Itens para pesquisar nesta visita"
      subtitle="Ordenado por domínio. A orientação muda: no RX o coletor compra o SKU exato; no GX pergunta pelo menor preço da chave."
    >
      <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)] max-h-[560px] overflow-y-auto">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
            <tr>
              <th class="py-2.5 px-3 text-left">O que pesquisar</th>
              <th class="py-2.5 px-3 text-left">Domínio</th>
              <th class="py-2.5 px-3 text-left">Orientação ao coletor</th>
              <th class="py-2.5 px-3 text-left">Guardado em</th>
              <th class="py-2.5 px-3 text-right">Receita (3M)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="item in listaColetor" :key="item.id" class="hover:bg-slate-50">
              <td class="py-2.5 px-3">
                <div class="font-semibold text-slate-800">{{ item.descricao }}</div>
                <div class="text-[11px] text-slate-500">{{ item.categoria }}</div>
              </td>
              <td class="py-2.5 px-3">
                <AdsPill
                  size="sm"
                  :status="item.dominio === 'GX' ? 'new' : 'success'"
                  :label="item.dominio === 'GX' ? `GX · ${item.departamento}` : `RX · ${item.departamento}`"
                />
              </td>
              <td class="py-2.5 px-3 text-slate-600">
                {{ item.dominio === "GX" ? "Pergunte o menor preço da chave, qualquer laboratório." : "Compre este SKU exato no balcão." }}
              </td>
              <td class="py-2.5 px-3 text-slate-500">
                {{ item.dominio === "GX" ? "Tabela GX · por chave" : "Tabela RX · por SKU" }}
              </td>
              <td class="py-2.5 px-3 text-right tabular-nums">{{ fmtCompactBRL(item.receita) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdsPanelCard>

    <AdsPanelCard
      title="Como volta o resultado"
      subtitle="O mesmo arquivo de upload serve às duas jornadas."
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700 leading-relaxed">
        <p>
          Cada linha do arquivo é identificada pelo ID do SKU ou da chave. Um preço de SKU alimenta o desconto de referência do RX. Um preço de chave alimenta o IC do GX.
        </p>
        <p>
          Quem monta a lista é a <NuxtLink to="/pesquisa" class="font-semibold underline underline-offset-2">Pesquisa</NuxtLink>. Esta tela só reúne o resultado para a visita.
        </p>
      </div>
    </AdsPanelCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { DepartamentoMed } from "~/types/pricing";
import { computeListaPesquisa } from "~/utils/flow-engines";
import { fmtCompactBRL, fmtInt } from "~/utils/formatters";

const { listaData, paramsLista, listaManualMap } = usePricingPoc();

const DEPTOS: DepartamentoMed[] = ["MARCA", "PROPAGADO", "SIMILAR", "GENERICO"];

const listaColetor = computed(() => {
  if (!listaData.value || !paramsLista.value) return [];
  return DEPTOS.flatMap((d) =>
    computeListaPesquisa(listaData.value!.candidatos, d, paramsLista.value![d], listaManualMap.value)
      .itens.filter((i) => i.selecionadoFinal)
      .map((i) => ({ ...i, departamento: d, dominio: d === "GENERICO" ? ("GX" as const) : ("RX" as const) })),
  );
});

const contagem = computed(() => ({
  RX: listaColetor.value.filter((i) => i.dominio === "RX").length,
  GX: listaColetor.value.filter((i) => i.dominio === "GX").length,
}));

const receitaTotal = computed(() => listaColetor.value.reduce((acc, i) => acc + i.receita, 0));
</script>
