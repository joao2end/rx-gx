<template>
  <header class="space-y-4">
    <AdsStepper
      v-if="etapa.id !== 'visao' && !etapa.modulo"
      :model-value="indiceAtual"
      :steps="passos"
      variant="visual"
      indicator="icon"
      clickable
      allow-forward
      :aria-label="`Etapas da jornada ${def.nomeCurto}`"
      @update:model-value="irPara"
    />

    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div class="min-w-0 space-y-2">
        <div v-if="!ehPasso && mostrarTitulo !== false" class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-bold text-ads-text-primary tracking-tight">
            {{ titulo ?? etapa.titulo }}
          </h1>
          <AdsPill size="sm" :status="dominio === 'rx' ? 'success' : 'new'" :label="def.nomeCurto" />
          <AdsPill v-if="etapa.modulo" size="sm" status="default" label="Compartilhado" />
        </div>
        <p v-if="agora && !ehPasso && !etapa.modulo" class="text-sm text-ads-text-secondary max-w-[68ch]">
          <span class="font-semibold text-ads-text-primary">Agora:</span> {{ agora }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <slot name="actions" />
        <AdsButton
          type="outline"
          color="neutral"
          size="sm"
          leading
          icon="i-lucide-book-open"
          :label="etapa.modulo ? 'Como funciona' : 'Por que esta etapa'"
          @click="guiaAberto = true"
        />
      </div>
    </div>

    <AdsModal
      v-model:open="guiaAberto"
      :title="etapa.modulo ? 'Como funciona' : 'Por que esta etapa'"
      :description="titulo ?? etapa.titulo"
      icon="i-lucide-book-open"
      size="2xl"
      scrollable
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-1">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <h3 class="text-sm font-semibold text-ads-text-primary">O que é</h3>
            <p class="text-sm text-ads-text-secondary leading-relaxed">{{ etapa.oQue }}</p>
          </div>
          <div class="space-y-1.5">
            <h3 class="text-sm font-semibold text-ads-text-primary">Por que</h3>
            <p class="text-sm text-ads-text-secondary leading-relaxed">{{ etapa.porque }}</p>
          </div>
          <div class="space-y-1.5">
            <h3 class="text-sm font-semibold text-ads-text-primary">O que sai daqui</h3>
            <p class="text-sm text-ads-text-secondary leading-relaxed">{{ etapa.saida }}</p>
          </div>
        </div>
        <div class="space-y-2.5">
          <h3 class="text-sm font-semibold text-ads-text-primary">Passos</h3>
          <ol class="space-y-2">
            <li v-for="(passo, i) in etapa.fazer" :key="passo" class="flex gap-3 text-sm text-ads-text-secondary">
              <span
                class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ads-surface-brand text-[11px] font-bold text-ads-text-contrast tabular-nums"
              >
                {{ i + 1 }}
              </span>
              <span class="leading-relaxed">{{ passo }}</span>
            </li>
          </ol>
        </div>
      </div>
      <div v-if="conceitos.length" class="mt-4 border-t border-ads-border-subtle pt-4">
        <h3 class="text-xs font-semibold text-ads-text-secondary mb-2.5">Conceitos</h3>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <div v-for="c in conceitos" :key="c.termo">
            <dt class="text-xs font-semibold text-ads-text-primary">{{ c.termo }}</dt>
            <dd class="text-xs text-ads-text-secondary leading-relaxed mt-0.5">{{ c.definicao }}</dd>
          </div>
        </dl>
      </div>
      <template #footer>
        <AdsButton type="outline" color="neutral" size="sm" label="Fechar" @click="guiaAberto = false" />
      </template>
    </AdsModal>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { CONCEITOS, DOMINIOS, etapaDe, etapasDoFluxo, type Dominio, type EtapaId } from "~/utils/jornada";

const props = defineProps<{
  dominio: Dominio;
  etapaId: EtapaId;
  titulo?: string;
  mostrarTitulo?: boolean;
}>();

const router = useRouter();
const guiaAberto = ref(false);

const def = computed(() => DOMINIOS[props.dominio]);
const etapa = computed(() => etapaDe(props.dominio, props.etapaId));
const etapasFluxo = computed(() => etapasDoFluxo(props.dominio));
const passos = computed(() => etapasFluxo.value.map((e) => ({ label: e.titulo, icon: e.icone })));
const indiceAtual = computed(() => Math.max(0, etapasFluxo.value.findIndex((e) => e.id === props.etapaId)));
const ehPasso = computed(() => etapa.value.id !== "visao" && !etapa.value.modulo);
const agora = computed(() => etapa.value.fazer[0] ?? "");
const conceitos = computed(() =>
  etapa.value.conceitos.map((k) => CONCEITOS[k]).filter((c): c is NonNullable<typeof c> => Boolean(c)),
);

function irPara(i: number) {
  const alvo = etapasFluxo.value[i];
  if (alvo && alvo.id !== props.etapaId) router.push(alvo.to);
}
</script>
