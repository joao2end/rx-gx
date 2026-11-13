<template>
  <nav
    v-if="etapa.modulo || vizinho.anterior || !vizinho.proxima"
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--ads-border-subtle,#dfe1e6)] pt-5"
    :aria-label="etapa.modulo ? 'Navegação de Minha estratégia' : `Navegação da jornada ${def.nomeCurto}`"
  >
    <NuxtLink
      v-if="!etapa.modulo && vizinho.anterior"
      :to="vizinho.anterior.to"
      class="group inline-flex items-center gap-2 text-sm text-[var(--ads-text-secondary)] hover:text-[var(--ads-text-primary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
      <span>Voltar para <strong class="font-semibold">{{ vizinho.anterior.titulo }}</strong></span>
    </NuxtLink>
    <span v-else />

    <p v-if="etapa.modulo" class="text-sm text-[var(--ads-text-secondary)]">
      <NuxtLink to="/estrategia" class="font-semibold underline underline-offset-2">Voltar para Minha estratégia</NuxtLink>
    </p>
    <p v-else-if="!vizinho.proxima" class="text-sm text-[var(--ads-text-secondary)]">
      Jornada {{ def.nomeCurto }} concluída.
      <NuxtLink :to="def.etapas[0]!.to" class="font-semibold underline underline-offset-2">Voltar à visão da jornada</NuxtLink>
    </p>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DOMINIOS, etapaDe, vizinhas, type Dominio, type EtapaId } from "~/utils/jornada";

const props = defineProps<{ dominio: Dominio; etapaId: EtapaId }>();

const def = computed(() => DOMINIOS[props.dominio]);
const etapa = computed(() => etapaDe(props.dominio, props.etapaId));
const vizinho = computed(() => vizinhas(props.dominio, props.etapaId));
</script>
