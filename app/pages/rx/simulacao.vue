<template>
  <div v-if="rxCockpit" class="space-y-6">
    <EtapaCabecalho dominio="rx" etapa-id="simulacao" titulo="Simulação RX">
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
      dominio="rx"
      :selecionadas="pesquisasEscolhidas.rx"
      @confirmar="(ids) => escolherPesquisas('rx', ids)"
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
      <div class="space-y-2">
        <p class="text-sm font-semibold text-ads-text-primary">Regras aplicadas</p>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="text-slate-600">Perfis vindos da clusterização:</span>
          <span
            v-for="dept in (['MARCA', 'PROPAGADO', 'SIMILAR'] as const)"
            :key="dept"
            class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1"
          >
            <span class="font-semibold text-slate-700">{{ dept }}</span>
            <span class="text-slate-500">{{ rotuloPerfil(politicaSimulacaoRx[dept]) }}</span>
          </span>
          <span class="inline-flex items-center text-slate-500">Pesquisas em uso: {{ nomesEmUso }}</span>
          <NuxtLink to="/estrategia/clusterizacao?d=rx" class="font-semibold text-[var(--ads-text-brand,#006ff7)] underline underline-offset-2">
            Alterar perfis
          </NuxtLink>
        </div>
        <p class="text-xs text-ads-text-secondary max-w-[68ch]">
          Canal, matriz de desconto, ajuste e farol ficam na parametrização.
          <span v-if="nivel === 'simples'">No nível Simples valem os parâmetros da planilha.</span>
        </p>
      </div>
      <AdsButton
        type="outline"
        color="neutral"
        size="sm"
        label="Ajustar na parametrização"
        to="/rx/parametrizacao"
      />
    </div>

    <AdsPanelCard
      title="Revisão de Preços Sugeridos RX"
      subtitle="Aceitar mantém Seguir marcado. Manter o preço atual desmarca Seguir. Editar grava um preço manual. A margem líquida é a margem bruta desta coluna menos a alíquota do cockpit."
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div class="lg:col-span-2">
            <AdsSearchInput v-model="buscaSku" placeholder="Buscar por descrição, ID ou laboratório..." size="sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Departamento</label>
            <select v-model="filtroDepto" class="w-full border border-slate-300 rounded-[var(--ads-radius-sm,8px)] px-2.5 py-1.5 text-xs bg-white">
              <option value="TODOS">Todos os Departamentos</option>
              <option value="MARCA">MARCA</option>
              <option value="PROPAGADO">PROPAGADO</option>
              <option value="SIMILAR">SIMILAR</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Método Precificação</label>
            <select v-model="filtroMetodo" class="w-full border border-slate-300 rounded-[var(--ads-radius-sm,8px)] px-2.5 py-1.5 text-xs bg-white">
              <option value="TODOS">Todos os Métodos</option>
              <option value="PESQUISA">PESQUISA (Top SKUs)</option>
              <option value="MATRIZ">MATRIZ (5×3 Online)</option>
              <option value="DESC MÍNIMO">DESC MÍNIMO</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Sensibilidade</label>
            <select v-model="filtroSens" class="w-full border border-slate-300 rounded-[var(--ads-radius-sm,8px)] px-2.5 py-1.5 text-xs bg-white">
              <option value="TODOS">Todas</option>
              <option value="Super Sensível">Super Sensível</option>
              <option value="Sensível">Sensível</option>
              <option value="Pouco Sensível">Pouco Sensível</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Recomendação</label>
            <select v-model="filtroAlteracao" class="w-full border border-slate-300 rounded-[var(--ads-radius-sm,8px)] px-2.5 py-1.5 text-xs bg-white">
              <option value="TODOS">Todas ({{ fmtInt(rxCalculatedRows.length) }})</option>
              <option value="Aumento de preço">Subir preço ({{ fmtInt(rxSummary.qtdAumento) }})</option>
              <option value="Redução de preço">Reduzir preço ({{ fmtInt(rxSummary.qtdReducao) }})</option>
              <option value="Manter o preço">Manter ({{ fmtInt(rxSummary.qtdManter) }})</option>
              <option value="ALERTA_MARGEM">Com Alerta Margem ({{ fmtInt(rxSummary.qtdAlertasMargem) }})</option>
              <option value="ALERTA_LIQUIDA">Margem líquida abaixo do piso ({{ fmtInt(qtdAlertaLiquida) }})</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
          <table class="w-full text-xs border-collapse tabular-nums min-w-[1120px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
              <tr>
                <th class="py-2.5 px-3 text-left">Medicamento</th>
                <th class="py-2.5 px-2 text-center">Depto / Método</th>
                <th class="py-2.5 px-2 text-center">Sensibilidade</th>
                <th class="py-2.5 px-2 text-right">Custo</th>
                <th class="py-2.5 px-2 text-right">PMC</th>
                <th class="py-2.5 px-2 text-right">Preço Atual</th>
                <th class="py-2.5 px-2 text-right">Desc. Efetivo</th>
                <th class="py-2.5 px-2 text-right">Sugerido</th>
                <th class="py-2.5 px-2 text-center">Editar R$</th>
                <th class="py-2.5 px-2 text-center">Aceitar</th>
                <th class="py-2.5 px-2.5 text-right bg-blue-50/60 text-blue-900">Preço Final</th>
                <th class="py-2.5 px-2 text-right">Mrg Bruta</th>
                <th class="py-2.5 px-2 text-right">Mrg Líquida</th>
                <th class="py-2.5 px-2 text-center">Auditoria</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="row in skusPaginados" :key="`${row.produtoId}|${row.cluster}`" class="hover:bg-slate-50">
                <td class="py-2.5 px-3">
                  <div class="font-semibold text-[var(--ads-text-primary)] truncate max-w-[240px]" :title="row.descricao">
                    {{ row.descricao }}
                  </div>
                  <div class="text-[11px] text-slate-500">
                    ID {{ row.produtoId }} · {{ row.laboratorio }} · {{ row.motivoRegra }}
                  </div>
                </td>
                <td class="py-2.5 px-2 text-center">
                  <div class="font-semibold text-slate-700">{{ row.departamento }}</div>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {{ row.tipoPrecificacao || "SEM PMC" }} {{ row.politicaAplicada ? `· ${row.politicaAplicada}` : "" }}
                  </span>
                </td>
                <td class="py-2.5 px-2 text-center">
                  <AdsPill
                    v-if="row.sensibilidade"
                    size="sm"
                    :status="sensibilidadePillStatus(row.sensibilidade)"
                    :label="row.sensibilidade"
                  />
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="py-2.5 px-2 text-right text-slate-600">{{ fmtBRL(row.custoComComissao) }}</td>
                <td class="py-2.5 px-2 text-right text-slate-600">{{ row.pmc > 0 ? fmtBRL(row.pmc) : "—" }}</td>
                <td class="py-2.5 px-2 text-right font-medium">{{ fmtBRL(row.precoAtual) }}</td>
                <td class="py-2.5 px-2 text-right text-teal-800 font-medium">
                  {{ row.pmc > 0 ? fmtPct(row.descontoSimulado, 1) : "—" }}
                </td>
                <td class="py-2.5 px-2 text-right font-semibold text-slate-800">
                  {{ fmtBRL(row.precoSimuladoSistema) }}
                </td>
                <td class="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    placeholder="—"
                    :value="row.ajusteManual ?? ''"
                    :aria-label="`Ajuste manual para ${row.descricao}`"
                    class="w-20 text-right px-2 py-1 rounded border text-xs font-semibold tabular-nums"
                    :class="
                      row.ajusteManual
                        ? 'border-amber-400 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-800'
                    "
                    @change="(e) => setManualPrice(row, (e.target as HTMLInputElement).value)"
                  />
                </td>
                <td class="py-2 px-2 text-center">
                  <input
                    type="checkbox"
                    :checked="row.seguir"
                    :aria-label="`Seguir recomendação para ${row.descricao}`"
                    class="w-4 h-4 accent-blue-600 cursor-pointer"
                    @change="(e) => setSeguir(row, (e.target as HTMLInputElement).checked)"
                  />
                </td>
                <td class="py-2.5 px-2.5 text-right bg-blue-50/30">
                  <div class="font-bold text-slate-900">{{ fmtBRL(row.precoFinal) }}</div>
                  <div
                    class="text-[10px] font-semibold"
                    :class="
                      row.variacaoPct > 0.001
                        ? 'text-emerald-700'
                        : row.variacaoPct < -0.001
                          ? 'text-blue-700'
                          : 'text-slate-400'
                    "
                  >
                    {{ fmtSignedPct(row.variacaoPct, 1) }}
                  </div>
                </td>
                <td class="py-2.5 px-2 text-right">
                  <span
                    class="font-semibold"
                    :class="row.margemFinal < row.margemCriticaAlvo ? 'text-red-600' : 'text-slate-800'"
                  >
                    {{ fmtPct(row.margemFinal, 1) }}
                  </span>
                </td>
                <td class="py-2.5 px-2 text-right">
                  <span class="font-semibold" :class="row.alertaMargemLiquida ? 'text-red-600' : 'text-slate-700'">
                    {{ fmtPct(row.margemLiquida, 1) }}
                  </span>
                </td>
                <td class="py-2.5 px-2 text-center">
                  <button
                    type="button"
                    class="px-2 py-1 rounded text-xs font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
                    @click="skuAuditado = row"
                  >
                    Detalhar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2 text-xs text-slate-600">
          <span>
            Exibindo {{ skusPaginados.length }} de <strong>{{ fmtInt(skusFiltrados.length) }}</strong> SKUs filtrados
          </span>
          <AdsPagination v-model:page="pagina" :total-pages="totalPaginas" />
        </div>
      </div>
    </AdsPanelCard>

    </template>

    <EtapaRodape dominio="rx" etapa-id="simulacao" />

    <!-- Audit Modal -->
    <AdsModal
      v-model:open="modalAuditoriaAberto"
      :title="skuAuditado ? `Cascata de Cálculo · ${skuAuditado.descricao}` : 'Auditoria'"
      :description="skuAuditado ? `ID ${skuAuditado.produtoId} · ${skuAuditado.departamento} · ${skuAuditado.categoria}` : ''"
      size="lg"
      confirm-label="Fechar"
      @confirm="skuAuditado = null"
      @cancel="skuAuditado = null"
    >
      <div v-if="skuAuditado" class="space-y-3 text-xs sm:text-sm tabular-nums">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <span class="text-slate-500 text-xs block">Custo + Comissão</span>
            <strong>{{ fmtBRL(skuAuditado.custoComComissao) }}</strong>
          </div>
          <div>
            <span class="text-slate-500 text-xs block">PMC Legal</span>
            <strong>{{ fmtBRL(skuAuditado.pmc) }}</strong>
          </div>
          <div>
            <span class="text-slate-500 text-xs block">Preço Atual</span>
            <strong>{{ fmtBRL(skuAuditado.precoAtual) }}</strong>
          </div>
          <div>
            <span class="text-slate-500 text-xs block">Método / Canal</span>
            <strong>{{ skuAuditado.tipoPrecificacao || "—" }} {{ skuAuditado.politicaAplicada }}</strong>
          </div>
        </div>

        <ol class="space-y-2 border border-slate-200 rounded-lg divide-y divide-slate-200">
          <li class="p-3 flex justify-between items-center">
            <span>1. Desconto Referência ({{ fmtPct(skuAuditado.descontoReferencia, 2) }}) + Ajuste ({{ fmtSignedPct(skuAuditado.ajusteDescontoPct, 1) }})</span>
            <strong>Desc. Efetivo: {{ fmtPct(skuAuditado.descontoEfetivo, 2) }}</strong>
          </li>
          <li class="p-3 flex justify-between items-center">
            <span>2. Preço de Partida = PMC × (1 − Desc. Efetivo)</span>
            <strong>{{ fmtBRL(skuAuditado.precoPartida) }}</strong>
          </li>
          <li class="p-3 flex justify-between items-center">
            <span>3. Trava de Variação (Farol: {{ skuAuditado.farolVariacao }})</span>
            <strong>{{ fmtBRL(skuAuditado.precoAposVariacao) }}</strong>
          </li>
          <li class="p-3 flex justify-between items-center">
            <span>4. Verificação Margem Crítica (Piso {{ fmtPct(skuAuditado.margemCriticaAlvo, 0) }} · {{ skuAuditado.alertaMargem }})</span>
            <strong>{{ fmtBRL(skuAuditado.precoAposMargem) }}</strong>
          </li>
          <li class="p-3 flex justify-between items-center">
            <span>5. Travas Regulatórias ({{ skuAuditado.motivoRegra }})</span>
            <strong>{{ fmtBRL(skuAuditado.precoSimuladoSistema) }}</strong>
          </li>
          <li class="p-3 flex justify-between items-center bg-blue-50/60">
            <span class="font-semibold text-blue-950">6. Preço Final Aplicado (Margem Final {{ fmtPct(skuAuditado.margemFinal, 1) }})</span>
            <strong class="text-base text-blue-900">{{ fmtBRL(skuAuditado.precoFinal) }}</strong>
          </li>
        </ol>
      </div>
    </AdsModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { ChaveClusterRx, RxCalculatedSku } from "~/types/pricing";
import { rotuloPesquisas } from "~/utils/pesquisas-catalogo";
import { fmtBRL, fmtInt, fmtPct, fmtSignedPct, sensibilidadePillStatus } from "~/utils/formatters";

const {
  rxCockpit,
  rxManualPriceMap,
  rxSeguirMap,
  rxCalculatedRows,
  rxSummary,
  politicaSimulacaoRx,
  pesquisasEscolhidas,
  escolherPesquisas,
} = usePricingPoc();

const modalPesquisas = ref(false);
const temPesquisa = computed(() => pesquisasEscolhidas.value.rx.length > 0);
const nomesEmUso = computed(() => rotuloPesquisas(pesquisasEscolhidas.value.rx));

const nivel = useState<"simples" | "avancado" | "completo">("poc-nivel-detalhe", () => "simples");

const qtdAlertaLiquida = computed(() => rxCalculatedRows.value.filter((r) => r.alertaMargemLiquida).length);

function rotuloPerfil(chave: ChaveClusterRx): string {
  if (chave === "Cluster Alta") return "Alta";
  if (chave === "Cluster Moderado") return "Moderado";
  return "Baixa";
}
const buscaSku = ref("");
const filtroDepto = ref("TODOS");
const filtroMetodo = ref("TODOS");
const filtroSens = ref("TODOS");
const filtroAlteracao = ref("TODOS");
const pagina = ref(1);
const pageSize = 40;
const skuAuditado = ref<RxCalculatedSku | null>(null);

const modalAuditoriaAberto = computed({
  get: () => skuAuditado.value !== null,
  set: (v: boolean) => {
    if (!v) skuAuditado.value = null;
  },
});

const skusFiltrados = computed(() => {
  const q = buscaSku.value.trim().toLowerCase();
  return rxCalculatedRows.value.filter((r) => {
    if (filtroDepto.value !== "TODOS" && r.departamento !== filtroDepto.value) return false;
    if (filtroMetodo.value !== "TODOS" && r.tipoPrecificacao !== filtroMetodo.value) return false;
    if (filtroSens.value !== "TODOS" && r.sensibilidade !== filtroSens.value) return false;
    if (filtroAlteracao.value === "ALERTA_MARGEM") {
      if (r.alertaMargem !== "Alerta MRG Crítica" && r.alertaMargem !== "Alerta MRG Negativa") return false;
    } else if (filtroAlteracao.value === "ALERTA_LIQUIDA") {
      if (!r.alertaMargemLiquida) return false;
    } else if (filtroAlteracao.value !== "TODOS" && r.alteracaoStatus !== filtroAlteracao.value) {
      return false;
    }
    if (!q) return true;
    return (
      r.descricao.toLowerCase().includes(q) ||
      r.produtoId.toLowerCase().includes(q) ||
      r.laboratorio.toLowerCase().includes(q)
    );
  });
});

watch([buscaSku, filtroDepto, filtroMetodo, filtroSens, filtroAlteracao], () => {
  pagina.value = 1;
});

const totalPaginas = computed(() => Math.max(1, Math.ceil(skusFiltrados.value.length / pageSize)));
const skusPaginados = computed(() => {
  const start = (pagina.value - 1) * pageSize;
  return skusFiltrados.value.slice(start, start + pageSize);
});

function setManualPrice(row: RxCalculatedSku, rawVal: string) {
  const key = `${row.produtoId}|${row.cluster}`;
  const num = parseFloat(rawVal);
  rxManualPriceMap.value = {
    ...rxManualPriceMap.value,
    [key]: Number.isFinite(num) && num > 0 ? num : null,
  };
}

function setSeguir(row: RxCalculatedSku, seguir: boolean) {
  const key = `${row.produtoId}|${row.cluster}`;
  rxSeguirMap.value = {
    ...rxSeguirMap.value,
    [key]: seguir,
  };
}

</script>
