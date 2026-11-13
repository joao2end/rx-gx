<template>
  <div class="space-y-4">
    <p class="max-w-[68ch] text-sm text-ads-text-secondary">
      Papel da categoria no autosserviço. Em medicamentos, o equivalente no RX é a sensibilidade. Os papéis abaixo são da base ilustrativa.
    </p>
    <AdsPanelCard title="Papéis por categoria">
      <AdsTable :data="categorias" :columns="colunasNotabilidade" density="sm" :framed="false">
        <template #papel-cell="{ row }">
          <AdsPill size="sm" :status="row.original.status" :label="row.original.papel" />
        </template>
      </AdsTable>
    </AdsPanelCard>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";

const categorias = [
  { categoria: "Analgésicos", papel: "Destino", status: "success" as const, receita: "Alta" },
  { categoria: "Higiene pessoal", papel: "Rotina", status: "default" as const, receita: "Média" },
  { categoria: "Dermocosméticos", papel: "Conveniência", status: "new" as const, receita: "Média" },
  { categoria: "Protetor solar", papel: "Sazonal", status: "attention" as const, receita: "Baixa" },
];

const colunasNotabilidade: TableColumn<(typeof categorias)[number]>[] = [
  { id: "categoria", accessorKey: "categoria", header: "Categoria" },
  { id: "papel", header: "Papel" },
  { id: "receita", accessorKey: "receita", header: "Receita" },
];
</script>
