<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-ads-text-primary">Minha estratégia Auto-serviço</h1>
    </header>

    <AdsTabs v-model="aba" :content="false" :items="abas" />

    <AdsEmptyState
      v-if="aba === 'cluster'"
      title="Cluster do autosserviço"
      subtitle="O perfil das lojas no autosserviço fica nesta aba."
      :show-actions="false"
    />
    <EstrategiaNotabilidadePainel v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const aba = ref("cluster");
const abas = [
  { label: "Cluster", value: "cluster" },
  { label: "Notabilidade", value: "notabilidade" },
];
</script>
