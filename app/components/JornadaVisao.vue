<template>
  <div class="space-y-8">
    <EtapaCabecalho :dominio="dominio" etapa-id="visao" :titulo="`Jornada ${def.nome}`">
      <template #actions>
        <AdsButton
          type="filled"
          size="sm"
          trailing
          icon="i-lucide-arrow-right"
          :label="`Começar por ${primeira.titulo}`"
          :to="primeira.to"
        />
      </template>
    </EtapaCabecalho>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <AdsPanelCard
        class="xl:col-span-7"
        title="O caminho, etapa por etapa"
        subtitle="Cada etapa entrega algo que a próxima usa."
      >
        <ol class="relative space-y-0">
          <li v-for="(etapa, i) in fluxo" :key="etapa.id" class="relative flex gap-4 pb-6 last:pb-0">
            <span
              v-if="i < fluxo.length - 1"
              class="absolute left-[13px] top-7 bottom-0 w-px bg-slate-200"
              aria-hidden="true"
            />
            <span
              class="relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white tabular-nums"
              :class="def.cor.solido"
            >
              {{ i + 1 }}
            </span>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <NuxtLink :to="etapa.to" class="text-sm font-semibold text-[var(--ads-text-primary)] hover:text-[var(--ads-text-brand,#006ff7)]">
                  {{ etapa.titulo }}
                </NuxtLink>
                <AdsPill v-if="etapa.modulo" size="sm" status="default" label="Módulo compartilhado" />
              </div>
              <p class="text-sm text-[var(--ads-text-secondary)]">{{ etapa.resumo }}</p>
              <p class="text-xs text-[var(--ads-text-tertiary,#5e6c84)]">
                <span class="font-semibold text-slate-600">Entrega:</span> {{ etapa.saida }}
              </p>
            </div>
          </li>
        </ol>
        <p class="text-sm text-[var(--ads-text-secondary)] border-t border-[var(--ads-border-subtle,#dfe1e6)] pt-4">
          A <NuxtLink to="/pesquisa" class="font-semibold text-[var(--ads-text-brand,#006ff7)] underline underline-offset-2">Pesquisa</NuxtLink> é uma página própria.
          A Clusterização fica em
          <NuxtLink to="/estrategia" class="font-semibold text-[var(--ads-text-brand,#006ff7)] underline underline-offset-2">Minha estratégia</NuxtLink>.
        </p>
      </AdsPanelCard>

      <AdsPanelCard
        class="xl:col-span-5"
        title="Como o preço é formado"
        :subtitle="dominio === 'rx' ? 'Cada SKU passa por esta sequência na simulação.' : 'Cada chave passa por esta sequência na simulação.'"
      >
        <div class="space-y-4">
          <div class="rounded-[var(--ads-radius-sm,8px)] px-4 py-3 font-mono text-sm" :class="[def.cor.fundo, def.cor.texto]">
            {{ formula }}
          </div>
          <ol class="space-y-3 text-sm text-slate-700">
            <li v-for="(passo, i) in passosPreco" :key="passo.titulo" class="flex gap-3">
              <span class="mt-0.5 text-xs font-bold text-slate-400 tabular-nums w-4 shrink-0">{{ i + 1 }}</span>
              <div>
                <p class="font-semibold text-slate-900">{{ passo.titulo }}</p>
                <p class="text-xs text-slate-600 leading-relaxed">{{ passo.texto }}</p>
              </div>
            </li>
          </ol>
        </div>
      </AdsPanelCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DOMINIOS, etapasDoFluxo, type Dominio } from "~/utils/jornada";

const props = defineProps<{ dominio: Dominio }>();

const def = computed(() => DOMINIOS[props.dominio]);
const fluxo = computed(() => etapasDoFluxo(props.dominio));
const primeira = computed(() => fluxo.value[0]!);

const formula = computed(() =>
  props.dominio === "rx"
    ? "Preço = PMC × (1 − desconto de referência − ajuste)"
    : "P1 = preço da praça × IC   ·   Pn = P1 × (1 + degrau)^(n−1)",
);

const passosPreco = computed(() =>
  props.dominio === "rx"
    ? [
        { titulo: "Desconto de referência", texto: "Vem da pesquisa (SKUs da lista), da matriz online (demais SKUs) ou do desconto mínimo, no canal escolhido para o departamento." },
        { titulo: "Ajuste por sensibilidade", texto: "O cockpit soma ou subtrai pontos de desconto conforme a sensibilidade e o perfil do cluster." },
        { titulo: "Farol de variação", texto: "Limita o salto em relação ao preço atual." },
        { titulo: "Margem crítica", texto: "Se a margem ficar abaixo do piso, o preço é recomposto." },
        { titulo: "Travas", texto: "PBM, Farmácia Popular, tabelado e teto do PMC prevalecem sobre o cálculo." },
      ]
    : [
        { titulo: "Escolha do P1", texto: "O laboratório de combate definido na Validação dos Ps." },
        { titulo: "Preço do P1", texto: "IC sobre a pesquisa manual, IC sobre a pesquisa internet, ou margem objetivo por sensibilidade quando não há pesquisa." },
        { titulo: "Margem crítica e farol", texto: "Protegem o P1 contra margem abaixo do piso e saltos bruscos." },
        { titulo: "Escada P2..Pn", texto: "Degraus geométricos com mínimo de 5% e abertura máxima de 50% sobre o P1, sem passar do PMC." },
      ],
);
</script>
