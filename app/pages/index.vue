<template>
  <div class="space-y-8">
    <section class="flex flex-wrap items-stretch gap-4" aria-label="Escolha a jornada">
      <div v-for="d in (['rx', 'gx'] as const)" :key="d" class="flex min-w-0 self-stretch">
        <AdsFeatureCard
          class="h-full"
          :title="`Simulador ${DOMINIOS[d].nomeCurto}`"
          :description="d === 'rx' ? 'Desconto sobre o PMC, por SKU.' : 'Preço da chave: um laboratório de combate e a escada dos demais.'"
          :icon="d === 'rx' ? 'i-lucide-pill' : 'i-lucide-layers'"
          :color="d === 'rx' ? 'success' : 'new'"
          @click="abrirEscolha(d)"
          :badges="d === 'rx'
            ? [{ label: 'Marca' }, { label: 'Propagado' }, { label: 'Similar' }]
            : [{ label: 'Genérico' }]"
        />
      </div>
      <div class="flex min-w-0 self-stretch">
        <AdsFeatureCard
          class="h-full"
          title="Simulador Auto Serviço"
          description="Preço de não medicamento no autosserviço, por SKU."
          icon="i-lucide-shopping-basket"
          color="blocked"
          disabled
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { DOMINIOS, type Dominio } from "~/utils/jornada";
import { usePricingPoc } from "~/composables/usePricingPoc";

const { limparPesquisas } = usePricingPoc();
const pendenteSimulacao = useState<Dominio | null>("poc-escolha-simulacao-pendente", () => null);
const destinoAposPesquisa = useState<"jornada" | "simulacao">("poc-destino-apos-pesquisa", () => "simulacao");

function abrirEscolha(d: Dominio) {
  limparPesquisas(d);
  destinoAposPesquisa.value = "jornada";
  pendenteSimulacao.value = null;
  pendenteSimulacao.value = d;
}
</script>
