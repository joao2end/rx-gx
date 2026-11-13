<template>
  <UApp :locale="uiLocale" :tooltip="{ delayDuration: 300 }" :toaster="adsToaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { uiLocale } from "ads-nuxt/app/locale/pt-br";
import { adsToaster } from "ads-nuxt/app/theme/ads-theme";
import { usePricingPoc } from "~/composables/usePricingPoc";

const { ensureLoaded } = usePricingPoc();

onMounted(() => {
  ensureLoaded();
});
</script>

<style>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
