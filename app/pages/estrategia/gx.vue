<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-ads-text-primary">Minha estratégia GX</h1>
    </header>

    <AdsTabs v-model="aba" :content="false" :items="abas" />

    <EstrategiaClusterPainel v-if="aba === 'cluster'" dominio="gx" />
    <EstrategiaCalculoPs v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const aba = ref("cluster");
const abas = [
  { label: "Cluster (Personalizado GX)", value: "cluster" },
  { label: "Cálculo dos P's", value: "ps" },
];
</script>
