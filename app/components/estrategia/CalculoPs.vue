<template>
  <div class="space-y-6">
    <div class="flex justify-end">
      <AdsButton
        type="filled"
        size="sm"
        leading
        icon="i-lucide-refresh-cw"
        label="Enviar Ps aprovados à simulação GX"
        @click="handleSyncGx"
      />
    </div>

    <AdsTableToolbar
      v-model:search="buscaChave"
      searchable
      title="Chaves"
      :description="`${fmtInt(chavesFiltradas.length)} chaves`"
      search-placeholder="Buscar princípio ativo, dosagem ou laboratório"
    >
      <div class="flex flex-wrap items-center gap-4">
        <AdsSwitch v-model="apenasMultiplosLabs" label="Apenas chaves com 2+ labs" />
        <AdsSwitch v-model="apenasEditadas" label="Com ajuste manual" />
      </div>
    </AdsTableToolbar>

    <AdsTable
      v-model:expanded="aberta"
      :data="chavesFiltradas"
      :columns="colunasChave"
      :get-row-id="(row: GxChaveGroup) => row.chave"
      density="md"
      sticky="header"
      class="max-h-[70vh]"
      empty-label="Nenhuma chave com esses filtros"
    >
      <template #chave-cell="{ row }">
        <button
          type="button"
          class="flex items-center gap-2 text-left font-semibold text-ads-text-primary"
          :aria-expanded="row.getIsExpanded()"
          @click="alternar(row.original.chave)"
        >
          <UIcon
            :name="row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="size-4 shrink-0 text-ads-text-secondary"
          />
          <span>{{ row.original.chave }}</span>
        </button>
      </template>

      <template #p1-cell="{ row }">
        <div v-if="row.original.p1Atual">
          <p class="font-semibold text-ads-text-primary">
            {{ row.original.p1Atual.fabricantePlug || row.original.p1Atual.fabricante }}
          </p>
          <p class="text-xs tabular-nums text-ads-text-secondary">
            {{ fmtBRL(row.original.p1Atual.precoAtual) }}
          </p>
        </div>
        <span v-else>—</span>
      </template>

      <template #labs-cell="{ row }">
        {{ fmtInt(row.original.laboratorios.length) }}
      </template>

      <template #receita-cell="{ row }">
        <span class="tabular-nums">{{ fmtCompactBRL(row.original.receitaTotal3m) }}</span>
      </template>

      <template #manual-cell="{ row }">
        <AdsPill
          v-if="row.original.temAlteracaoManual"
          size="sm"
          status="warning"
          label="Manual"
        />
        <span v-else class="text-ads-text-tertiary">—</span>
      </template>

      <template #expanded="{ row: chaveRow }">
        <div class="space-y-3 py-2">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-ads-text-secondary">
              A lista fica na ordem sugerida. A posição escolhida vale para este laboratório e os demais assumem as posições restantes.
            </p>
            <AdsButton
              v-if="chaveRow.original.temAlteracaoManual"
              type="unfilled"
              size="sm"
              label="Limpar ajuste desta chave"
              @click="limparOverrideChave(chaveRow.original)"
            />
          </div>

          <AdsTable
            :data="chaveRow.original.laboratorios"
            :columns="colunasLab"
            :get-row-id="(lab: GxSelecaoComputedItem) => lab.produtoId"
            density="sm"
            :framed="false"
          >
            <template #lab-cell="{ row: lab }">
              <div>
                <p class="font-semibold text-ads-text-primary">
                  {{ lab.original.fabricantePlug || lab.original.fabricante }}
                </p>
                <p class="text-xs text-ads-text-secondary">{{ lab.original.produto }}</p>
              </div>
            </template>
            <template #cobertura-cell="{ row: lab }">
              <span class="tabular-nums">{{ fmtPct(lab.original.coberturaLojas, 0) }}</span>
            </template>
            <template #quantidade-cell="{ row: lab }">
              <span class="tabular-nums">{{ fmtInt(lab.original.qtd3m) }}</span>
            </template>
            <template #custo-cell="{ row: lab }">
              <span class="tabular-nums">{{ fmtBRL(lab.original.custoAtual) }}</span>
            </template>
            <template #posicao-cell="{ row: lab }">
              <AdsPill
                v-if="chaveRow.original.laboratorios.length < 2"
                size="sm"
                status="new"
                label="P1"
              />
              <AdsSelect
                v-else
                type="radio"
                :model-value="String(lab.original.pFimCalc)"
                :options="opcoesPosicao(chaveRow.original)"
                :searchable="chaveRow.original.laboratorios.length > 10"
                search-placeholder="Buscar posição"
                placeholder="Posição"
                @update:model-value="(v) => aoEscolherPosicao(chaveRow.original, lab.original.produtoId, v)"
              />
            </template>
          </AdsTable>
        </div>
      </template>
    </AdsTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { GxChaveGroup, GxSelecaoComputedItem } from "~/utils/flow-engines";
import { fmtBRL, fmtCompactBRL, fmtInt, fmtPct } from "~/utils/formatters";

const toast = useToast();
const { gxOverridePMap, gxSelecaoChaves, aplicarPsNaSimulacaoGx } = usePricingPoc();

const buscaChave = ref("");
const apenasMultiplosLabs = ref(true);
const apenasEditadas = ref(false);
const aberta = ref<Record<string, boolean>>({});

const colunasChave: TableColumn<GxChaveGroup>[] = [
  { id: "chave", accessorKey: "chave", header: "Chave" },
  { id: "p1", header: "P1 atual" },
  { id: "labs", header: "Laboratórios" },
  { id: "receita", header: "Receita 3M", meta: { class: { th: "text-right", td: "text-right" } } },
  { id: "manual", header: "Ajuste" },
];

const colunasLab: TableColumn<GxSelecaoComputedItem>[] = [
  { id: "lab", header: "Laboratório" },
  { id: "cobertura", header: "Cobertura", meta: { class: { th: "text-right", td: "text-right" } } },
  { id: "quantidade", header: "Quantidade", meta: { class: { th: "text-right", td: "text-right" } } },
  { id: "custo", header: "Custo", meta: { class: { th: "text-right", td: "text-right" } } },
  { id: "posicao", header: "Posição" },
];

const chavesFiltradas = computed(() => {
  const q = buscaChave.value.trim().toLowerCase();
  return gxSelecaoChaves.value.filter((g) => {
    if (apenasMultiplosLabs.value && g.laboratorios.length < 2) return false;
    if (apenasEditadas.value && !g.temAlteracaoManual) return false;
    if (!q) return true;
    return (
      g.chave.toLowerCase().includes(q) ||
      g.laboratorios.some((l) => l.fabricante.toLowerCase().includes(q) || l.produto.toLowerCase().includes(q))
    );
  });
});

watch(chavesFiltradas, (list) => {
  const id = Object.keys(aberta.value).find((k) => aberta.value[k]);
  if (id && !list.some((g) => g.chave === id)) aberta.value = {};
});

function alternar(chave: string) {
  aberta.value = aberta.value[chave] ? {} : { [chave]: true };
}

function opcoesPosicao(grp: GxChaveGroup) {
  return grp.laboratorios.map((_, i) => ({
    value: String(i + 1),
    label: `P${i + 1}`,
  }));
}

function aoEscolherPosicao(grp: GxChaveGroup, produtoId: string, valor: string | string[]) {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  moverLab(grp, produtoId, Number(bruto));
}

function moverLab(grp: GxChaveGroup, produtoId: string, novoP: number) {
  if (!Number.isFinite(novoP) || novoP < 1) return;
  const ids = [...grp.laboratorios]
    .sort((a, b) => a.pFimCalc - b.pFimCalc || b.scoreFinalCalc - a.scoreFinalCalc)
    .map((lab) => lab.produtoId);
  const de = ids.indexOf(produtoId);
  const para = Math.min(novoP, ids.length) - 1;
  if (de < 0 || de === para) return;
  ids.splice(de, 1);
  ids.splice(para, 0, produtoId);
  const next = { ...gxOverridePMap.value };
  ids.forEach((id, i) => {
    next[id] = i + 1;
  });
  gxOverridePMap.value = next;
}

function limparOverrideChave(grp: GxChaveGroup) {
  const next = { ...gxOverridePMap.value };
  for (const lab of grp.laboratorios) {
    next[lab.produtoId] = null;
  }
  gxOverridePMap.value = next;
}

function handleSyncGx() {
  const qtd = aplicarPsNaSimulacaoGx();
  toast.add({
    title: "Ps aprovados enviados à simulação GX",
    description: `${qtd} SKU(s) tiveram a ordem atualizada na escada.`,
    color: "success",
  });
}
</script>
