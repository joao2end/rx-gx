<template>
  <nav aria-label="Trilha" class="mb-[var(--ads-space-xs)]">
    <ol
      class="flex flex-wrap items-center gap-[var(--ads-space-nano)] text-[length:var(--ads-font-size-xxs)] leading-[var(--ads-line-height-md)]"
    >
      <li
        v-for="(item, index) in itens"
        :key="`${item.label}-${index}`"
        class="flex items-center gap-[var(--ads-space-nano)]"
      >
        <NuxtLink
          v-if="item.to && index < itens.length - 1"
          :to="item.to"
          class="text-ads-text-secondary transition-colors hover:text-ads-text-primary"
        >
          {{ item.label }}
        </NuxtLink>
        <span v-else class="font-medium text-ads-text-primary" aria-current="page">
          {{ item.label }}
        </span>
        <UIcon
          v-if="index < itens.length - 1"
          name="i-lucide-chevron-right"
          class="size-4 text-ads-text-tertiary"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useDominio } from "~/composables/useDominio";
import { NOME_SIMULACAO_PADRAO, useNomeSimulacao } from "~/composables/useNomeSimulacao";
import {
  MINHA_ESTRATEGIA,
  PESQUISA,
  type DefinicaoDominio,
  type EtapaId,
  type EtapaJornada,
} from "~/utils/jornada";

interface ItemTrilha {
  label: string;
  to?: string;
}

const route = useRoute();
const { definicao } = useDominio();
const { nomeDe } = useNomeSimulacao();

function rotuloEtapa(etapa: EtapaJornada, def: DefinicaoDominio): string {
  const porId: Partial<Record<EtapaId, string>> = {
    visao: `Jornada ${def.nome}`,
    sensibilidade: `Sensibilidade ${def.nomeCurto}`,
    parametrizacao: `Parametrização ${def.nomeCurto}`,
    simulacao: `Simulação ${def.nomeCurto}`,
    resultados: `Resultados ${def.nomeCurto}`,
    exportacao: `Exportação ${def.nomeCurto}`,
  };
  return porId[etapa.id] ?? etapa.titulo;
}

const itens = computed<ItemTrilha[]>(() => {
  const path = route.path;
  if (path === "/" || path === "") return [{ label: "Simulador" }];

  const inicio: ItemTrilha = { label: "Simulador", to: "/" };
  if (path === "/coletor") return [inicio, { label: "Lista do coletor" }];

  if (path === PESQUISA.to) return [{ label: PESQUISA.titulo }];

  if (path === MINHA_ESTRATEGIA.to || path.startsWith(`${MINHA_ESTRATEGIA.to}/`)) {
    if (path === MINHA_ESTRATEGIA.to) return [inicio, { label: MINHA_ESTRATEGIA.titulo }];
    const rotulosExtras: Record<string, string> = {
      "/estrategia/rx": "Minha estratégia RX",
      "/estrategia/gx": "Minha estratégia GX",
      "/estrategia/auto-servico": "Minha estratégia Auto-serviço",
      "/estrategia/rede": "Minha estratégia da Rede",
      "/estrategia/rx/configurar": "Configurar estratégia",
      "/estrategia/concorrentes": "Concorrentes",
      "/estrategia/notabilidade": "Notabilidade",
      "/estrategia/clusterizacao": "Clusterização",
    };
    const rotulo = rotulosExtras[path] ?? "Página";
    const trilha = [
      inicio,
      { label: MINHA_ESTRATEGIA.titulo, to: MINHA_ESTRATEGIA.to },
      { label: rotulo },
    ];
    if (path === "/estrategia/clusterizacao" && (route.query.d === "gx" || route.query.d === "rx")) {
      trilha[2] = { label: "Clusterização", to: "/estrategia/clusterizacao" };
      trilha.push({ label: `Clusterização ${route.query.d === "gx" ? "GX" : "RX"}` });
    }
    return trilha;
  }

  const def = definicao.value;
  const etapa = def.etapas.find((item) => item.to.split("?")[0] === path);
  const jornada: ItemTrilha = { label: `Jornada ${def.nome}`, to: `/${def.id}` };

  if (!etapa) {
    const pedaco = path.split("/").filter(Boolean).pop() ?? "Página";
    const label = pedaco.charAt(0).toUpperCase() + pedaco.slice(1).replace(/-/g, " ");
    const noDominio = path.startsWith("/rx/") || path.startsWith("/gx/");
    return noDominio ? [inicio, jornada, { label }] : [inicio, { label }];
  }

  if (etapa.id === "simulacao") {
    const bruto = nomeDe(def.id).trim();
    return [
      { label: `Simulador ${def.nomeCurto}`, to: `/${def.id}` },
      { label: bruto || NOME_SIMULACAO_PADRAO },
    ];
  }

  if (etapa.id === "visao") return [inicio, { label: rotuloEtapa(etapa, def) }];

  return [inicio, jornada, { label: rotuloEtapa(etapa, def) }];
});
</script>
