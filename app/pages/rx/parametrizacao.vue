<template>
  <div v-if="rxCockpit" class="space-y-6">
    <EtapaCabecalho dominio="rx" etapa-id="parametrizacao" titulo="Parametrização RX">
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
      title="Pacote do cluster"
      subtitle="Canal da pesquisa, canal da matriz e o ajuste de desconto vêm da estratégia ativa. Nesta etapa só dá para ler."
    >
      <div class="grid grid-cols-1 gap-[var(--ads-space-xs)] md:grid-cols-3">
        <div
          v-for="item in pacotesAtivos"
          :key="item.dept"
          class="min-w-0 space-y-[var(--ads-space-nano)]"
        >
          <div class="flex flex-wrap items-center gap-[var(--ads-space-nano)]">
            <span class="text-[length:var(--ads-font-size-xxs)] font-semibold text-ads-text-primary">{{ item.rotulo }}</span>
            <AdsPill size="sm" :status="item.status" :label="item.nome" />
          </div>
          <div
            v-if="item.linhas"
            class="space-y-[var(--ads-space-quark)] text-[length:var(--ads-font-size-xxs)] leading-[var(--ads-line-height-sm)] text-ads-text-secondary"
          >
            <p>{{ item.linhas.pesquisa }}</p>
            <p>{{ item.linhas.matriz }}</p>
            <p>{{ item.linhas.top }}</p>
            <p>{{ item.linhas.sensibilidade }}</p>
          </div>
        </div>
      </div>
      <div class="mt-[var(--ads-space-xs)] flex flex-wrap items-center gap-[var(--ads-space-xxs)]">
        <AdsButton
          type="outline"
          color="primary"
          size="sm"
          trailing
          icon="i-lucide-arrow-right"
          label="Atualizar estratégia"
          to="/estrategia/rx/configurar?modo=atualizar&voltar=/rx/parametrizacao"
        />
        <AdsButton
          type="unfilled"
          color="neutral"
          size="sm"
          label="Ver clusterização"
          to="/estrategia/clusterizacao?d=rx"
        />
      </div>
    </AdsPanelCard>

    <AdsPanelCard
      v-if="nivel === 'simples'"
      title="Parâmetros da planilha"
      subtitle="No nível Simples a simulação usa as regras já gravadas. Margem crítica, farol, folga do PMC e a matriz online ficam fechados."
    >
      <p class="max-w-[68ch] text-sm text-ads-text-secondary">
        Abra Avançado ou Completo no topo para editar essas regras de rede. O pacote do cluster se altera na estratégia.
      </p>
    </AdsPanelCard>

    <div v-else class="space-y-6">
      <div v-if="nivel === 'completo'" class="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <AdsNumberInput
            :model-value="Math.round((rxCockpit.aliquotaImpostos ?? 0) * 1000) / 10"
            label="Alíquota sobre a margem bruta (%)"
            suffix="%"
            :min="0"
            :step="0.5"
            hint="Subtraída da margem bruta já exibida. Não altera o preço."
            @update:model-value="(v) => (rxCockpit!.aliquotaImpostos = Number(v) / 100)"
          />
          <AdsNumberInput
            :model-value="Math.round((rxCockpit.margemMinimaLiquida ?? 0) * 1000) / 10"
            label="Margem líquida mínima (%)"
            suffix="%"
            :min="0"
            :step="0.5"
            hint="Abaixo deste piso a grade marca alerta. Zero só alerta margem negativa."
            @update:model-value="(v) => (rxCockpit!.margemMinimaLiquida = Number(v) / 100)"
          />
        </div>

      <div v-if="nivel === 'completo'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdsPanelCard
          title="Piso de Margem Crítica (%)"
          subtitle="Se o preço sugerido gerar margem menor ou igual à Margem Crítica, o motor recompõe o preço para Custo ÷ (1 − Margem Crítica)."
        >
          <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
            <table class="w-full text-xs border-collapse tabular-nums">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500">
                  <th class="py-2 px-2.5 text-left">Grupo</th>
                  <th class="py-2 px-2 text-right">MARCA</th>
                  <th class="py-2 px-2 text-right">PROPAGADO</th>
                  <th class="py-2 px-2 text-right">SIMILAR</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="b in (['TOP PRODUTOS', 'Super Sensível', 'Sensível', 'Pouco Sensível'] as const)" :key="b">
                  <td class="py-2.5 px-2.5 font-semibold text-slate-800">{{ b }}</td>
                  <td v-for="dept in (['MARCA', 'PROPAGADO', 'SIMILAR'] as const)" :key="dept" class="py-2 px-2 text-right">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="80"
                      :value="Math.round(rxCockpit.margemCritica[b][dept] * 100)"
                      class="w-16 text-right px-1.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                      @change="(e) => (rxCockpit!.margemCritica[b][dept] = Math.max(0, Math.min(0.85, Number((e.target as HTMLInputElement).value) / 100)))"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AdsPanelCard>

        <AdsPanelCard
          v-if="nivel === 'completo'"
          title="Farol de variação"
          subtitle="Indiferença é a variação mínima. Linear é a máxima. Indiferença 0 é ignorada."
        >
          <div class="space-y-4">
            <div class="overflow-x-auto border border-slate-200 rounded-[var(--ads-radius-sm,8px)]">
              <table class="w-full text-xs border-collapse tabular-nums">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500">
                    <th class="py-2 px-2.5 text-left">Origem do Cálculo</th>
                    <th class="py-2 px-2 text-right">Linear (máxima ±%)</th>
                    <th class="py-2 px-2 text-right">Indiferença (mínima ±%)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr v-for="m in (['PESQUISA', 'MATRIZ', 'DESC MÍNIMO'] as const)" :key="m">
                    <td class="py-2.5 px-2.5 font-semibold text-slate-800">{{ m }}</td>
                    <td class="py-2 px-2 text-right">
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="100"
                        :value="Math.round(rxCockpit.farolVariacao[m].limiar * 100)"
                        class="w-20 text-right px-2 py-1 rounded border border-slate-300 text-xs font-semibold"
                        @change="(e) => (rxCockpit!.farolVariacao[m].limiar = Math.max(0, Number((e.target as HTMLInputElement).value) / 100))"
                      />
                    </td>
                    <td class="py-2 px-2 text-right">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="30"
                        :value="Math.round(rxCockpit.farolVariacao[m].indiferenca * 100)"
                        class="w-20 text-right px-2 py-1 rounded border border-slate-300 text-xs font-semibold"
                        @change="(e) => (rxCockpit!.farolVariacao[m].indiferenca = Math.max(0, Number((e.target as HTMLInputElement).value) / 100))"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="w-56">
              <AdsNumberInput
                :model-value="Number((rxCockpit.fatorPmc * 100).toFixed(1))"
                label="Folga Abaixo do PMC (%)"
                suffix="%"
                :min="0"
                :step="0.5"
                @update:model-value="(v) => (rxCockpit!.fatorPmc = Math.max(0, Number(v) / 100))"
              />
            </div>
          </div>
        </AdsPanelCard>
      </div>

      <PesquisaColeta dominio="rx" aba="matriz" />
    </div>

    <EtapaRodape dominio="rx" etapa-id="parametrizacao" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { ChaveClusterRx, DepartamentoRx } from "~/types/pricing";
import { lerPacoteRx } from "~/utils/rx-pacote";

const toast = useToast();
const { rxCockpit, resetRxDefaults, politicaSimulacaoRx } = usePricingPoc();

const nivel = useState<"simples" | "avancado" | "completo">("poc-nivel-detalhe", () => "simples");

const DEPTS = ["MARCA", "PROPAGADO", "SIMILAR"] as const;

const ROTULO_DEPTO: Record<DepartamentoRx, string> = {
  MARCA: "Marca",
  PROPAGADO: "Propagado",
  SIMILAR: "Similar",
};

function chaveDo(dept: DepartamentoRx): ChaveClusterRx {
  return politicaSimulacaoRx.value[dept] ?? "Cluster";
}

function nomeCluster(chave: ChaveClusterRx): string {
  if (chave === "Cluster Alta") return "Cluster Alta";
  if (chave === "Cluster Moderado") return "Cluster Moderado";
  return "Cluster Baixa";
}

function statusCluster(chave: ChaveClusterRx) {
  if (chave === "Cluster Alta") return "warning" as const;
  if (chave === "Cluster Moderado") return "attention" as const;
  return "default" as const;
}

const pacotesAtivos = computed(() =>
  DEPTS.map((dept) => {
    const chave = chaveDo(dept);
    return {
      dept,
      rotulo: ROTULO_DEPTO[dept],
      nome: nomeCluster(chave),
      status: statusCluster(chave),
      linhas: rxCockpit.value ? lerPacoteRx(rxCockpit.value, chave, dept) : null,
    };
  }),
);

function handleReset() {
  resetRxDefaults();
  toast.add({ title: "Parâmetros RX restaurados ao padrão da planilha", color: "neutral" });
}
</script>
