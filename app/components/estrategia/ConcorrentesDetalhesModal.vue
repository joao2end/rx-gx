<template>
  <AdsModal
    v-model:open="aberto"
    :title="loja?.nome ?? 'Loja'"
    :description="loja?.endereco"
    icon="i-lucide-store"
    size="3xl"
    scrollable
  >
    <p v-if="!linhas.length" class="py-6 text-center text-sm text-ads-text-secondary">
      Nenhum concorrente vinculado a esta loja.
    </p>
    <AdsTable
      v-else
      :data="linhas"
      :columns="colunas"
      density="sm"
      :framed="false"
    >
      <template #rede-cell="{ row }">
        <div class="flex min-w-0 items-center gap-2">
          <span class="truncate font-semibold text-ads-text-primary">{{ row.original.rede }}</span>
          <AdsPill size="sm" :status="row.original.statusTipo" :label="row.original.tipo" />
        </div>
      </template>
      <template #endereco-cell="{ row }">
        <span class="text-ads-text-secondary">{{ row.original.endereco }}</span>
      </template>
      <template #origem-cell="{ row }">
        <AdsPill size="sm" :status="row.original.origem === 'Importado' ? 'new' : 'default'" :label="row.original.origem" />
      </template>
      <template #acao-cell="{ row }">
        <AdsButton
          type="secondary"
          size="sm"
          leading
          icon="i-lucide-trash-2"
          label="Remover"
          @click="emit('remover', row.original.id)"
        />
      </template>
    </AdsTable>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap gap-2">
          <AdsButton type="secondary" size="sm" leading icon="i-lucide-map-pinned" label="Mapear manualmente" @click="emit('mapear')" />
          <AdsButton type="outline" size="sm" leading icon="i-lucide-upload" label="Importar arquivo" @click="emit('importar')" />
        </div>
        <AdsButton type="unfilled" size="sm" label="Fechar" @click="aberto = false" />
      </div>
    </template>
  </AdsModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { LojaEstrategia } from "~/composables/useConcorrentesEstrategia";
import { rotuloTipo } from "~/composables/useConcorrentesEstrategia";

const aberto = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  loja: LojaEstrategia | null;
}>();

const emit = defineEmits<{
  remover: [id: string];
  mapear: [];
  importar: [];
}>();

const { vinculosDaLoja, redeDe } = useConcorrentesEstrategia();

const colunas: TableColumn<{
  id: string;
  rede: string;
  tipo: string;
  statusTipo: "new" | "default" | "attention";
  endereco: string;
  origem: string;
}>[] = [
  { id: "rede", header: "Concorrente" },
  { id: "endereco", header: "Endereço" },
  { id: "origem", header: "Origem do dado" },
  { id: "acao", header: "" },
];

const linhas = computed(() => {
  if (!props.loja) return [];
  return vinculosDaLoja(props.loja.id).map((item) => {
    const rede = redeDe(item.redeId);
    const tipo = rede?.tipo ?? null;
    return {
      id: item.id,
      rede: rede?.nome ?? item.redeId,
      tipo: rotuloTipo(tipo),
      statusTipo: tipo === "ABRAF" ? "new" as const : tipo === "INDEP" ? "default" as const : "attention" as const,
      endereco: item.endereco,
      origem: item.origem === "importado" ? "Importado" : "Manual",
    };
  });
});
</script>
