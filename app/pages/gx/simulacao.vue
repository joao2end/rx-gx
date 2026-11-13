<template>
  <div v-if="gxCockpit" class="space-y-6">
    <EtapaCabecalho dominio="gx" etapa-id="simulacao" titulo="Simulação GX">
      <template #actions>
        <AdsButton
          type="outline"
          color="neutral"
          size="sm"
          :label="temPesquisa ? 'Alterar pesquisas' : 'Escolher pesquisas'"
          @click="modalPesquisas = true"
        />
      </template>
    </EtapaCabecalho>

    <EscolhaPesquisa
      v-model:open="modalPesquisas"
      dominio="gx"
      :selecionadas="pesquisasEscolhidas.gx"
      @confirmar="(ids) => escolherPesquisas('gx', ids)"
    />

    <AdsEmptyState
      v-if="!temPesquisa"
      title="Nenhuma pesquisa escolhida"
      subtitle="Escolha ao menos uma pesquisa de preço para calcular esta simulação."
    >
      <AdsButton type="filled" label="Escolher pesquisas" @click="modalPesquisas = true" />
    </AdsEmptyState>
    <template v-else>

    <div class="flex flex-col gap-3 rounded-[var(--ads-radius-md,12px)] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-semibold text-ads-text-primary">Regras aplicadas</p>
        <p class="text-xs text-ads-text-secondary">Pesquisas em uso: {{ nomesEmUso }}</p>
        <p class="text-sm text-ads-text-secondary max-w-[68ch]">
          IC, margem, escada e o preço forçado do P1 ficam na parametrização.
          Degrau mínimo de {{ Math.round(gxCockpit.aumentoMinimo * 100) }}% e abertura máxima de {{ Math.round(gxCockpit.aumentoMaximoP1 * 100) }}% sobre o P1.
          <span v-if="nivel === 'simples'">No nível Simples valem os parâmetros da planilha.</span>
        </p>
      </div>
      <AdsButton
        type="outline"
        color="neutral"
        size="sm"
        label="Ajustar na parametrização"
        to="/gx/parametrizacao"
      />
    </div>

    <div class="space-y-6">
      <AdsPanelCard
        title="Grade Completa de SKUs Genéricos"
        subtitle="Filtre por método de precificação, degrau (P1, P2, P3) ou alertas de margem."
      >
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div class="lg:col-span-2">
              <AdsSearchInput v-model="buscaSkuGx" placeholder="Buscar produto, chave ou laboratório..." size="sm" />
            </div>
            <select v-model="filtroMetodoGx" class="border border-slate-300 rounded-[var(--ads-radius-sm,8px)] px-2.5 py-1.5 text-xs bg-white">
              <option value="TODOS">Todos os Métodos</option>
              <option value="PESQ MANUAL">PESQ MANUAL (Top 30 Chaves)</option>
              <option value="PESQ INTERNET">PESQ INTERNET (Provedores)</option>
              <option value="MARGEM OBJETIVO">MARGEM OBJETIVO</option>
            </select>
            <select v-model="filtroOrdemGx" class="border border-slate-300 rounded-[var(--ads-radius-sm,8px)] px-2.5 py-1.5 text-xs bg-white">
              <option value="TODOS">Todos os Ps</option>
              <option value="P1">Apenas P1 (Combate)</option>
              <option value="P2">Apenas P2</option>
              <option value="P3">Apenas P3+</option>
            </select>
            <select v-model="filtroSensGx" class="border border-slate-300 rounded-[var(--ads-radius-sm,8px)] px-2.5 py-1.5 text-xs bg-white">
              <option value="TODOS">Todas as Sensibilidades</option>
              <option value="Super Sensível">Super Sensível</option>
              <option value="Sensível">Sensível</option>
              <option value="Pouco Sensível">Pouco Sensível</option>
            </select>
          </div>

          <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
            <table class="w-full text-xs border-collapse tabular-nums min-w-[1060px]">
              <thead class="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                <tr>
                  <th class="py-2.5 px-3 text-left">Chave / Apresentação</th>
                  <th class="py-2.5 px-2 text-center">Ordem</th>
                  <th class="py-2.5 px-2 text-center">Método</th>
                  <th class="py-2.5 px-2 text-right">Custo</th>
                  <th class="py-2.5 px-2 text-right">PMC</th>
                  <th class="py-2.5 px-2 text-right">Atual</th>
                  <th class="py-2.5 px-2 text-right">P1 Chave</th>
                  <th class="py-2.5 px-2.5 text-right bg-indigo-50/60 text-indigo-950">Preço Final</th>
                  <th class="py-2.5 px-2 text-right">Mrg Bruta</th>
                  <th class="py-2.5 px-2 text-right">Mrg Líquida</th>
                  <th class="py-2.5 px-2 text-center">Aceitar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="row in skusGxPaginados" :key="`${row.produtoId}|${row.cluster}`" class="hover:bg-slate-50">
                  <td class="py-2.5 px-3">
                    <div class="font-semibold text-[var(--ads-text-primary)] truncate max-w-[260px]" :title="row.chave">
                      {{ row.descricao }}
                    </div>
                    <div class="text-[11px] text-slate-500 truncate max-w-[260px]">
                      {{ row.chave }} · {{ row.laboratorio }}
                    </div>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <AdsPill size="sm" :status="row.ordemPreco === 'P1' ? 'new' : 'default'" :label="row.ordemPreco" />
                  </td>
                  <td class="py-2.5 px-2 text-center text-[11px] font-medium text-slate-600">
                    {{ row.tipoPrecificacao || "—" }}
                  </td>
                  <td class="py-2.5 px-2 text-right text-slate-600">{{ fmtBRL(row.custoComComissao) }}</td>
                  <td class="py-2.5 px-2 text-right text-slate-600">{{ fmtBRL(row.pmc) }}</td>
                  <td class="py-2.5 px-2 text-right">{{ fmtBRL(row.precoAtual) }}</td>
                  <td class="py-2.5 px-2 text-right font-medium text-indigo-700">{{ fmtBRL(row.precoP1Chave) }}</td>
                  <td class="py-2.5 px-2.5 text-right bg-indigo-50/30">
                    <div class="font-bold text-slate-900">{{ fmtBRL(row.precoFinal) }}</div>
                    <div
                      class="text-[10px] font-semibold"
                      :class="row.variacaoPct >= 0 ? 'text-emerald-700' : 'text-blue-700'"
                    >
                      {{ fmtSignedPct(row.variacaoPct, 1) }}
                    </div>
                  </td>
                  <td class="py-2.5 px-2 text-right font-semibold">{{ fmtPct(row.margemFinal, 1) }}</td>
                  <td class="py-2.5 px-2 text-right font-semibold" :class="row.alertaMargemLiquida ? 'text-red-600' : 'text-slate-700'">
                    {{ fmtPct(row.margemLiquida, 1) }}
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <input
                      type="checkbox"
                      :checked="row.seguir"
                      class="w-4 h-4 accent-indigo-600 cursor-pointer"
                      @change="(e) => setSeguirGx(row, (e.target as HTMLInputElement).checked)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between pt-2 text-xs text-slate-600">
            <span>Exibindo {{ skusGxPaginados.length }} de <strong>{{ fmtInt(skusGxFiltrados.length) }}</strong> SKUs</span>
            <AdsPagination v-model:page="paginaGx" :total-pages="totalPaginasGx" />
          </div>
        </div>
      </AdsPanelCard>
    </div>

    </template>

    <EtapaRodape dominio="gx" etapa-id="simulacao" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import { rotuloPesquisas } from "~/utils/pesquisas-catalogo";
import { fmtBRL, fmtInt, fmtPct, fmtSignedPct } from "~/utils/formatters";

const {
  gxCockpit,
  gxSeguirMap,
  gxCalculatedRows,
  pesquisasEscolhidas,
  escolherPesquisas,
} = usePricingPoc();

const modalPesquisas = ref(false);
const temPesquisa = computed(() => pesquisasEscolhidas.value.gx.length > 0);
const nomesEmUso = computed(() => rotuloPesquisas(pesquisasEscolhidas.value.gx));

const nivel = useState<"simples" | "avancado" | "completo">("poc-nivel-detalhe", () => "simples");

const buscaSkuGx = ref("");
const filtroMetodoGx = ref("TODOS");
const filtroOrdemGx = ref("TODOS");
const filtroSensGx = ref("TODOS");
const paginaGx = ref(1);
const pageSizeGx = 40;

function setSeguirGx(row: { produtoId: string; cluster: string }, checked: boolean) {
  const key = `${row.produtoId}|${row.cluster}`;
  gxSeguirMap.value = {
    ...gxSeguirMap.value,
    [key]: checked,
  };
}

const skusGxFiltrados = computed(() => {
  const q = buscaSkuGx.value.trim().toLowerCase();
  return gxCalculatedRows.value.filter((r) => {
    if (filtroMetodoGx.value !== "TODOS" && r.tipoPrecificacao !== filtroMetodoGx.value) return false;
    if (filtroOrdemGx.value === "P3") {
      if (r.ordemPreco === "P1" || r.ordemPreco === "P2") return false;
    } else if (filtroOrdemGx.value !== "TODOS" && r.ordemPreco !== filtroOrdemGx.value) {
      return false;
    }
    if (filtroSensGx.value !== "TODOS" && r.sensibilidade !== filtroSensGx.value) return false;
    if (!q) return true;
    return (
      r.descricao.toLowerCase().includes(q) ||
      r.chave.toLowerCase().includes(q) ||
      r.laboratorio.toLowerCase().includes(q)
    );
  });
});

watch([buscaSkuGx, filtroMetodoGx, filtroOrdemGx, filtroSensGx], () => {
  paginaGx.value = 1;
});

const totalPaginasGx = computed(() => Math.max(1, Math.ceil(skusGxFiltrados.value.length / pageSizeGx)));
const skusGxPaginados = computed(() => {
  const start = (paginaGx.value - 1) * pageSizeGx;
  return skusGxFiltrados.value.slice(start, start + pageSizeGx);
});

</script>
