<template>
  <div class="space-y-8">
    <section class="flex flex-wrap items-stretch gap-4" aria-label="Escolha a estratégia">
      <div v-for="card in cards" :key="card.title" class="flex min-w-0 self-stretch">
        <AdsFeatureCard
          class="h-full"
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :color="card.color"
          :to="card.to"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AdsFeatureCardColor } from "ads-nuxt/app/components/AdsFeatureCard.vue";

const cards: Array<{
  title: string;
  description: string;
  icon: string;
  color: AdsFeatureCardColor;
  to: string;
}> = [
  {
    title: "Minha estratégia RX",
    description: "Cluster personalizado para RX.",
    icon: "i-lucide-pill",
    color: "success",
    to: "/estrategia/rx",
  },
  {
    title: "Minha estratégia GX",
    description: "Cluster personalizado e o cálculo dos P's.",
    icon: "i-lucide-layers",
    color: "new",
    to: "/estrategia/gx",
  },
  {
    title: "Minha estratégia Auto-serviço",
    description: "Cluster e notabilidade do autosserviço.",
    icon: "i-lucide-shopping-basket",
    color: "primary",
    to: "/estrategia/auto-servico",
  },
  {
    title: "Minha estratégia da Rede",
    description: "Autosserviço, RX e GX juntos, por loja.",
    icon: "i-lucide-network",
    color: "warning",
    to: "/estrategia/rede",
  },
  {
    title: "Concorrentes",
    description: "Cadastro único de redes e lojas, compartilhado pelas estratégias.",
    icon: "i-lucide-store",
    color: "attention",
    to: "/estrategia/concorrentes",
  },
];
</script>
