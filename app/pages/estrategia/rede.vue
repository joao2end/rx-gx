<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-ads-text-primary">Minha estratégia da Rede</h1>
      <p class="mt-[var(--ads-space-xxs)] max-w-[62ch] text-[length:var(--ads-font-size-xxs)] text-ads-text-secondary">
        Autosserviço, RX e GX na mesma grade. Cada loja mostra o perfil de Marca, Propagado, Similar e Genérico.
      </p>
    </header>

    <AdsTable
      :data="lojas"
      :columns="colunas"
      density="sm"
      sticky="header"
      :framed="false"
    >
      <template #nome-cell="{ row }">
        <span class="font-semibold text-ads-text-primary">{{ row.original.nome }}</span>
      </template>
      <template v-for="eixo in eixos" :key="eixo.id" #[`${eixo.id}-header`]>
        <span class="flex flex-col">
          <span>{{ eixo.label }}</span>
          <span class="font-normal normal-case text-[length:var(--ads-font-size-xxxs)] text-ads-text-tertiary">{{ eixo.dono }}</span>
        </span>
      </template>
      <template v-for="eixo in eixos" :key="`${eixo.id}-cell`" #[`${eixo.id}-cell`]="{ row }">
        <AdsPill size="sm" :status="statusPerfil(row.original.perfis[eixo.id])" :label="nomePerfilCluster(row.original.perfis[eixo.id])" />
      </template>
    </AdsTable>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { EixoCluster, LojaCluster, PerfilCluster } from "~/types/pricing";

const { lojas, nomePerfilCluster } = usePricingPoc();

const eixos: { id: EixoCluster; label: string; dono: string }[] = [
  { id: "AUTOSSERVICO", label: "Autosserviço", dono: "MVP atual" },
  { id: "MARCA", label: "Marca", dono: "Jornada RX" },
  { id: "PROPAGADO", label: "Propagado", dono: "Jornada RX" },
  { id: "SIMILAR", label: "Similar", dono: "Jornada RX" },
  { id: "GENERICO", label: "Genérico", dono: "Jornada GX" },
];

const colunas: TableColumn<LojaCluster>[] = [
  {
    id: "nome",
    accessorKey: "nome",
    header: "Loja",
    meta: { class: { th: "w-full", td: "w-full" } },
  },
  ...eixos.map((eixo) => ({
    id: eixo.id,
    header: eixo.label,
    meta: { class: { th: "whitespace-nowrap", td: "whitespace-nowrap" } },
  })),
];

function statusPerfil(perfil: PerfilCluster) {
  if (perfil === "Alta") return "warning" as const;
  if (perfil === "Moderado") return "attention" as const;
  if (perfil === "Baixa") return "default" as const;
  return "new" as const;
}
</script>
