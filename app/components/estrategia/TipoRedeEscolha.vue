<template>
  <fieldset class="space-y-2 rounded-[var(--ads-radius-sm)] border border-[var(--ads-border-subtle)] bg-[var(--ads-surface-main)] p-3">
    <legend class="px-1 text-sm font-semibold text-ads-text-primary">{{ nome }}</legend>
    <p class="text-xs leading-relaxed text-ads-text-secondary">
      Essa rede ainda não tem tipo na base. A escolha vale para RX, GX e Auto-Serviço.
    </p>
    <div class="flex flex-wrap gap-4 pt-1">
      <AdsRadio
        :model-value="modelValue"
        value="ABRAF"
        :name="nomeCampo"
        label="Abrafarma"
        @update:model-value="emitir"
      />
      <AdsRadio
        :model-value="modelValue"
        value="INDEP"
        :name="nomeCampo"
        label="Independente"
        @update:model-value="emitir"
      />
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import type { TipoRede } from "~/composables/useConcorrentesEstrategia";

defineProps<{
  nome: string;
  nomeCampo: string;
  modelValue: TipoRede | "";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: TipoRede | ""];
}>();

function emitir(valor: string | number | boolean) {
  if (valor === "ABRAF" || valor === "INDEP") emit("update:modelValue", valor);
}
</script>
