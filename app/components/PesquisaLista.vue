<template>
  <div class="space-y-6">
    <div class="rounded-[var(--ads-radius-md,12px)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      O teto de cobertura de receita da lista ainda será definido. Enquanto isso, quantidade, PBM, Farmácia Popular, marca própria, tabelado e a inclusão manual continuam editáveis. O preço máximo de referência é R$ 450. A cota 70% receita e 30% quantidade é a hipótese da planilha.
    </div>

    <AdsSegmentedTabs
      v-if="dominio === 'rx'"
      v-model="deptoRx"
      :items="[
        { label: `Marca (${contagemSelecionadosPorDepto.MARCA})`, value: 'MARCA' },
        { label: `Propagado (${contagemSelecionadosPorDepto.PROPAGADO})`, value: 'PROPAGADO' },
        { label: `Similar (${contagemSelecionadosPorDepto.SIMILAR})`, value: 'SIMILAR' },
      ]"
    />

    <!-- Parameters & 5x3 Quadrant Coverage -->
    <div v-if="paramAtual" class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div class="xl:col-span-5">
        <AdsPanelCard
          :title="`Parâmetros · ${deptoAtivo}`"
          subtitle="Altere metas, pesos ou travas para regenerar a lista automaticamente."
        >
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <AdsNumberInput
                v-model="paramAtual.qtdMeta"
                :label="deptoAtivo === 'GENERICO' ? 'Meta de Chaves' : 'Meta de Produtos'"
                :min="5"
                :step="5"
              />
              <AdsNumberInput
                v-model="paramAtual.precoMaximo"
                label="Preço Máx. Elegível (R$)"
                :min="10"
                :step="25"
              />
              <AdsNumberInput
                :model-value="Math.round(paramAtual.pesoReceita * 100)"
                label="Cota por Receita (%)"
                suffix="%"
                :min="0"
                :step="10"
                @update:model-value="(v) => ajustarPesoReceita(Number(v))"
              />
              <AdsNumberInput
                :model-value="Math.round(paramAtual.pesoQuantidade * 100)"
                label="Cota por Quantidade (%)"
                suffix="%"
                disabled
              />
            </div>

            <div class="pt-3 border-t border-slate-200 space-y-2.5">
              <p class="text-xs font-semibold text-slate-600">
                Elegibilidade na Pesquisa (Pesquisar SIM / NÃO)
              </p>
              <div class="grid grid-cols-2 gap-2.5 text-xs">
                <AdsSwitch v-model="paramAtual.pbm" label="Incluir PBM" />
                <AdsSwitch v-model="paramAtual.farmaciaPopular" label="Farmácia Popular" />
                <AdsSwitch v-model="paramAtual.marcaPropria" label="Marca Própria" />
                <AdsSwitch v-model="paramAtual.precoTabelado" label="Preço Tabelado" />
              </div>
            </div>

            <div
              class="p-3 rounded-[var(--ads-radius-sm,8px)] border text-xs space-y-1"
              :class="
                deptoAtivo === 'GENERICO'
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                  : 'bg-teal-50/70 border-teal-200 text-teal-950'
              "
            >
              <strong class="block">Orientação ao Coletor em Loja:</strong>
              <span v-if="deptoAtivo === 'GENERICO'">
                Solicitar no balcão o <strong>menor preço da chave</strong> (qualquer laboratório = P1 do concorrente) e realizar a compra.
              </span>
              <span v-else>
                Solicitar e comprar exatamente a apresentação/marca descrita na lista para descobrir o desconto real praticado no balcão.
              </span>
            </div>
          </div>
        </AdsPanelCard>
      </div>

      <div class="xl:col-span-7">
        <AdsPanelCard
          title="Distribuição nos Quadrantes da Matriz (Selecionados / Elegíveis)"
          subtitle="Garante representatividade entre faixas de PMC e perfis de cronicidade."
        >
          <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
            <table class="w-full text-xs sm:text-sm border-collapse tabular-nums">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th class="py-2.5 px-3 text-left">Faixa PMC</th>
                  <th v-for="cron in CRONICIDADES_ORDEM" :key="cron" class="py-2.5 px-3 text-center">
                    {{ cron }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="faixa in FAIXAS_ORDEM" :key="faixa">
                  <td class="py-2.5 px-3 font-semibold text-slate-800 bg-slate-50/50">{{ faixa }}</td>
                  <td
                    v-for="cron in CRONICIDADES_ORDEM"
                    :key="cron"
                    class="py-2.5 px-3 text-center"
                  >
                    <AdsTooltip
                      :title="tituloQuadrante(resultadoLista.quadrantes[faixa][cron])"
                      :description="descricaoQuadrante(faixa, cron)"
                    >
                      <span
                        tabindex="0"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-help"
                        :class="
                          resultadoLista.quadrantes[faixa][cron].selecionados > 0
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        "
                        :aria-label="rotuloQuadrante(faixa, cron, resultadoLista.quadrantes[faixa][cron])"
                      >
                        {{ resultadoLista.quadrantes[faixa][cron].selecionados }}
                        <span class="font-normal text-slate-400">/ {{ resultadoLista.quadrantes[faixa][cron].elegiveis }}</span>
                      </span>
                    </AdsTooltip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-3 text-xs tabular-nums">
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-slate-500 block">Total Selecionados</span>
              <strong class="text-base text-slate-900">{{ itensSelecionadosCount }} itens</strong>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-slate-500 block">Receita Coberta (3M)</span>
              <strong class="text-base text-slate-900">{{ fmtCompactBRL(receitaSelecionada) }}</strong>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-slate-500 block">Desembolso Est. Coleta (1x)</span>
              <strong class="text-base text-emerald-700">{{ fmtBRL(custoUnitarioColeta) }}</strong>
            </div>
          </div>
        </AdsPanelCard>
      </div>
    </div>

    <!-- Editable Table of Items -->
    <AdsPanelCard
      :title="`Lista Editável · ${deptoAtivo}`"
      subtitle="O gestor revisa a seleção automática e inclui ou exclui itens manualmente antes de liberar a pesquisa."
    >
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="w-full sm:w-80">
            <AdsSearchInput v-model="buscaItem" placeholder="Buscar medicamento ou categoria..." size="sm" />
          </div>
          <div class="flex items-center gap-3 text-xs">
            <AdsSwitch v-model="mostrarApenasSelecionados" label="Mostrar apenas selecionados na lista" />
          </div>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)] max-h-[520px] overflow-y-auto">
          <table class="w-full text-xs sm:text-sm border-collapse tabular-nums">
            <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
              <tr>
                <th class="py-2.5 px-3 text-left">Medicamento / Chave</th>
                <th class="py-2.5 px-2.5 text-left">Classe / Quadrante</th>
                <th class="py-2.5 px-2.5 text-center">Sensibilidade</th>
                <th class="py-2.5 px-2.5 text-right">Receita</th>
                <th class="py-2.5 px-2.5 text-right">Qtd</th>
                <th class="py-2.5 px-2.5 text-right">Preço Médio</th>
                <th class="py-2.5 px-2.5 text-center">Origem Regra</th>
                <th class="py-2.5 px-3 text-center">Na Lista?</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="item in itensExibidos.slice(0, 120)"
                :key="item.id"
                :class="item.selecionadoFinal ? 'bg-blue-50/25 hover:bg-blue-50/50' : 'hover:bg-slate-50'"
              >
                <td class="py-2.5 px-3">
                  <div class="font-semibold text-[var(--ads-text-primary)]">{{ item.descricao }}</div>
                  <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                    <span>{{ item.fabricante }}</span>
                    <span v-if="item.pbm" class="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-medium">PBM</span>
                    <span v-if="item.farmaciaPopular" class="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">FP</span>
                  </div>
                </td>
                <td class="py-2.5 px-2.5 text-xs text-slate-600">
                  <div>{{ item.categoria }}</div>
                  <div class="text-[11px] text-slate-400">{{ item.faixa }} · {{ item.cronicidade }}</div>
                </td>
                <td class="py-2.5 px-2.5 text-center">
                  <AdsPill
                    v-if="item.sensibilidade"
                    size="sm"
                    :status="sensibilidadePillStatus(item.sensibilidade)"
                    :label="item.sensibilidade"
                  />
                </td>
                <td class="py-2.5 px-2.5 text-right font-medium">{{ fmtCompactBRL(item.receita) }}</td>
                <td class="py-2.5 px-2.5 text-right">{{ fmtInt(item.quantidade) }}</td>
                <td class="py-2.5 px-2.5 text-right">{{ fmtBRL(item.precoMedioVenda) }}</td>
                <td class="py-2.5 px-2.5 text-center">
                  <AdsPill
                    v-if="item.elegivel"
                    size="sm"
                    tone="secondary"
                    :status="item.origemSelecao.startsWith('MANUAL') ? 'warning' : item.selecionadoFinal ? 'success' : 'default'"
                    :label="item.origemSelecao"
                  />
                  <span v-else class="text-[11px] text-red-600 font-medium">{{ item.motivoInelegivel }}</span>
                </td>
                <td class="py-2.5 px-3 text-center">
                  <button
                    type="button"
                    class="px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer"
                    :class="
                      item.selecionadoFinal
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    "
                    @click="alternarSelecaoManual(item.id, !item.selecionadoFinal)"
                  >
                    {{ item.selecionadoFinal ? "Selecionado" : "Incluir" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdsPanelCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { Cronicidade, DepartamentoMed, FaixaPreco } from "~/types/pricing";
import { computeListaPesquisa, CRONICIDADES_ORDEM, FAIXAS_ORDEM } from "~/utils/flow-engines";
import { fmtBRL, fmtCompactBRL, fmtInt, sensibilidadePillStatus } from "~/utils/formatters";
import type { Dominio } from "~/utils/jornada";

const props = defineProps<{ dominio: Dominio }>();

const { listaData, paramsLista, listaManualMap } = usePricingPoc();

const deptoRx = ref<DepartamentoMed>("MARCA");
const deptoAtivo = computed<DepartamentoMed>(() => (props.dominio === "gx" ? "GENERICO" : deptoRx.value));
const buscaItem = ref("");
const mostrarApenasSelecionados = ref(false);

const paramAtual = computed(() => paramsLista.value?.[deptoAtivo.value] ?? null);

function ajustarPesoReceita(pct: number) {
  if (!paramAtual.value) return;
  const clamped = Math.max(0, Math.min(100, pct));
  paramAtual.value.pesoReceita = clamped / 100;
  paramAtual.value.pesoQuantidade = (100 - clamped) / 100;
}

const resultadoLista = computed(() => {
  if (!listaData.value || !paramAtual.value) {
    return {
      itens: [],
      quadrantes: {
        "FAIXA 5": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
        "FAIXA 4": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
        "FAIXA 3": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
        "FAIXA 2": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
        "FAIXA 1": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
      },
    };
  }
  return computeListaPesquisa(
    listaData.value.candidatos,
    deptoAtivo.value,
    paramAtual.value,
    listaManualMap.value,
  );
});

const contagemSelecionadosPorDepto = computed(() => {
  const res: Record<DepartamentoMed, number> = { GENERICO: 0, MARCA: 0, PROPAGADO: 0, SIMILAR: 0 };
  if (!listaData.value || !paramsLista.value) return res;
  for (const d of ["GENERICO", "MARCA", "PROPAGADO", "SIMILAR"] as DepartamentoMed[]) {
    const r = computeListaPesquisa(listaData.value.candidatos, d, paramsLista.value[d], listaManualMap.value);
    res[d] = r.itens.filter((i) => i.selecionadoFinal).length;
  }
  return res;
});

const itensSelecionadosCount = computed(
  () => resultadoLista.value.itens.filter((i) => i.selecionadoFinal).length,
);

const receitaSelecionada = computed(() =>
  resultadoLista.value.itens
    .filter((i) => i.selecionadoFinal)
    .reduce((acc, i) => acc + i.receita, 0),
);

const custoUnitarioColeta = computed(() =>
  resultadoLista.value.itens
    .filter((i) => i.selecionadoFinal)
    .reduce((acc, i) => acc + i.precoMedioVenda, 0),
);

const itensExibidos = computed(() => {
  const q = buscaItem.value.trim().toLowerCase();
  return resultadoLista.value.itens.filter((i) => {
    if (mostrarApenasSelecionados.value && !i.selecionadoFinal) return false;
    if (!q) return true;
    return i.descricao.toLowerCase().includes(q) || i.categoria.toLowerCase().includes(q);
  });
});

const PERFIL_LABEL: Record<Cronicidade, string> = {
  EVENTUAL: "eventual",
  FREQUENTE: "frequente",
  CRONICO: "crônico",
};

function tituloQuadrante(cell: { selecionados: number; elegiveis: number }) {
  const naLista =
    cell.selecionados === 0
      ? "Nenhum item na lista"
      : cell.selecionados === 1
        ? "1 item na lista"
        : `${cell.selecionados} itens na lista`;
  const elegiveis = cell.elegiveis === 1 ? "1 elegível" : `${cell.elegiveis} elegíveis`;
  return `${naLista}, de ${elegiveis}`;
}

function descricaoQuadrante(faixa: FaixaPreco, cron: Cronicidade) {
  const faixaLabel = `${faixa.charAt(0)}${faixa.slice(1).toLowerCase()}`;
  return `${faixaLabel} com perfil ${PERFIL_LABEL[cron]}. Antes da barra, quem já entrou na pesquisa. Depois, quem passou no preço máximo e nas travas de PBM, Farmácia Popular, marca própria e preço tabelado.`;
}

function rotuloQuadrante(
  faixa: FaixaPreco,
  cron: Cronicidade,
  cell: { selecionados: number; elegiveis: number },
) {
  return `${tituloQuadrante(cell)}. ${descricaoQuadrante(faixa, cron)}`;
}

function alternarSelecaoManual(id: string, incluir: boolean) {
  listaManualMap.value = {
    ...listaManualMap.value,
    [id]: incluir,
  };
}
</script>
