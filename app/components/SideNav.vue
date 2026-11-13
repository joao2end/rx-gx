<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--ads-radius-sm,8px)] text-sm font-medium transition-colors"
        :class="classeItem(rotaAtiva('/'))"
        @click="emit('navegou')"
      >
        <UIcon name="i-lucide-chart-area" class="w-4 h-4 shrink-0" />
        <span>Simulador</span>
      </NuxtLink>
    </div>

    <div class="space-y-1">
      <NuxtLink
        :to="PESQUISA.to"
        class="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--ads-radius-sm,8px)] text-sm font-medium transition-colors"
        :class="classeItem(rotaAtiva(PESQUISA.to))"
        @click="emit('navegou')"
      >
        <UIcon :name="PESQUISA.icone" class="w-4 h-4 shrink-0" />
        <span>{{ PESQUISA.titulo }}</span>
      </NuxtLink>
    </div>

    <div class="space-y-1">
      <NuxtLink
        :to="MINHA_ESTRATEGIA.to"
        class="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--ads-radius-sm,8px)] text-sm font-medium transition-colors"
        :class="classeItem(rotaAtiva(MINHA_ESTRATEGIA.to))"
        @click="emit('navegou')"
      >
        <UIcon :name="MINHA_ESTRATEGIA.icone" class="w-4 h-4 shrink-0" />
        <span>{{ MINHA_ESTRATEGIA.titulo }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MINHA_ESTRATEGIA, PESQUISA } from "~/utils/jornada";

defineProps<{
  rotaAtiva: (to: string) => boolean;
}>();
const emit = defineEmits<{ navegou: [] }>();

function classeItem(ativo: boolean) {
  return ativo
    ? "bg-blue-50 text-[var(--ads-text-brand-strong,#074ac6)]"
    : "text-[var(--ads-text-secondary,#42526e)] hover:bg-slate-50 hover:text-[var(--ads-text-primary)]";
}
</script>
