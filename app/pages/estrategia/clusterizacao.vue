<template>
  <div v-if="!dominioEscolhido" class="space-y-8">
    <section class="flex flex-wrap items-stretch gap-4" aria-label="Escolha a clusterização">
      <div v-for="card in clusterizacoes" :key="card.title" class="flex min-w-0 self-stretch">
        <AdsFeatureCard
          class="h-full"
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :color="card.color"
          :to="card.to"
          :disabled="card.disabled"
          :badges="card.badges"
        />
      </div>
    </section>
  </div>

  <div v-else class="space-y-6">
    <EtapaCabecalho :dominio="dominio" etapa-id="clusterizacao" :titulo="tituloClusterizacao" />
    <EstrategiaClusterPainel :dominio="dominio" />
    <EtapaRodape :dominio="dominio" etapa-id="clusterizacao" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import type { AdsFeatureCardColor } from "ads-nuxt/app/components/AdsFeatureCard.vue";
import { useDominio } from "~/composables/useDominio";

const route = useRoute();
const { dominio } = useDominio();
const dominioEscolhido = computed(() => route.query.d === "rx" || route.query.d === "gx");
const tituloClusterizacao = computed(() => (dominio.value === "gx" ? "Clusterização GX" : "Clusterização RX"));

const clusterizacoes: Array<{
  title: string;
  description: string;
  icon: string;
  color: AdsFeatureCardColor;
  to?: string;
  disabled?: boolean;
  badges?: Array<{ label: string }>;
}> = [
  {
    title: "Clusterização GX",
    description: "Lojas agrupadas no Genérico, com um único IC.",
    icon: "i-lucide-layers",
    color: "new",
    to: "/estrategia/clusterizacao?d=gx",
    badges: [{ label: "Genérico" }],
  },
  {
    title: "Clusterização RX",
    description: "Perfil da loja por departamento: Marca, Propagado e Similar.",
    icon: "i-lucide-pill",
    color: "success",
    to: "/estrategia/clusterizacao?d=rx",
    badges: [{ label: "Marca" }, { label: "Propagado" }, { label: "Similar" }],
  },
  {
    title: "Clusterização de Auto Serviço",
    description: "Perfil das lojas no autosserviço.",
    icon: "i-lucide-shopping-basket",
    color: "blocked",
    disabled: true,
  },
];
</script>
