<template>
  <AdsModal
    v-model:open="aberto"
    :title="etapa === 'arquivo' ? 'Importar base' : 'Mapear concorrentes'"
    :description="etapa === 'arquivo'
      ? 'O arquivo fica nesta tela. A prévia usa uma base de exemplo, compartilhada por RX, GX e Auto-Serviço.'
      : 'Associe o nome do arquivo a uma rede. O tipo só aparece quando a base ainda não tem essa informação.'"
    icon="i-lucide-upload"
    size="3xl"
    scrollable
  >
    <div v-if="etapa === 'arquivo'" class="space-y-3">
      <button
        type="button"
        class="flex w-full flex-col items-center gap-2 rounded-[var(--ads-radius-sm)] border border-dashed border-[var(--ads-border-subtle)] bg-[var(--ads-surface-main)] px-4 py-8 text-center"
        @click="abrirSeletor"
        @dragover.prevent
        @drop.prevent="receberSolto"
      >
        <UIcon name="i-lucide-file-up" class="size-6 text-[var(--ads-text-brand)]" />
        <span class="text-sm font-semibold text-ads-text-primary">Arraste e solte seu arquivo aqui</span>
        <span class="text-xs text-ads-text-secondary">ou clique para selecionar CSV, XLS ou XLSX (máx. 5 MB)</span>
      </button>
      <input
        ref="seletor"
        type="file"
        class="sr-only"
        accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        @change="receberArquivo"
      >
      <p v-if="erro" class="text-sm font-semibold text-ads-text-primary">{{ erro }}</p>
      <p v-else-if="arquivo" class="text-sm text-ads-text-secondary">Arquivo selecionado: {{ arquivo }}</p>
    </div>

    <div v-else class="space-y-4">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="text-xs font-semibold uppercase text-ads-text-secondary">
            <tr>
              <th class="px-2 py-2">Loja</th>
              <th class="px-2 py-2">De</th>
              <th class="px-2 py-2">Para</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="linha in linhas" :key="linha.id" class="border-t border-[var(--ads-border-subtle)] align-top">
              <td class="px-2 py-3">
                <p class="font-semibold text-ads-text-primary">{{ nomeLoja(linha.lojaId) }}</p>
                <p class="mt-0.5 max-w-xs text-xs text-ads-text-secondary">{{ linha.endereco }}</p>
              </td>
              <td class="px-2 py-3 font-medium text-ads-text-primary">{{ linha.de }}</td>
              <td class="px-2 py-3">
                <AdsSelect
                  type="radio"
                  placeholder="Selecionar rede"
                  search-placeholder="Buscar rede"
                  add-label="Cadastrar {query}"
                  :options="opcoesRede"
                  :model-value="escolhas[linha.id] ?? ''"
                  @update:model-value="escolher(linha.id, $event)"
                  @add="cadastrar(linha.id, $event)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EstrategiaTipoRedeEscolha
        v-for="rede in redesPendentes"
        :key="rede.id"
        :nome="rede.nome"
        :nome-campo="`import-${rede.id}`"
        :model-value="tipos[rede.id] ?? ''"
        @update:model-value="tipos[rede.id] = $event"
      />
    </div>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <AdsButton type="unfilled" size="sm" label="Cancelar" @click="aberto = false" />
        <AdsButton
          size="sm"
          :label="etapa === 'arquivo' ? 'Continuar' : 'Salvar e aplicar'"
          :disabled="!podeConfirmar"
          @click="avancar"
        />
      </div>
    </template>
  </AdsModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { LinhaImportacao, TipoRede } from "~/composables/useConcorrentesEstrategia";

const aberto = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  salvar: [payload: { linhas: Array<LinhaImportacao & { redeId: string }>; tipos: Record<string, TipoRede> }];
}>();

const { linhasImportacao, lojaDe, redes, redeDe, criarRede } = useConcorrentesEstrategia();

const seletor = ref<HTMLInputElement | null>(null);
const etapa = ref<"arquivo" | "depara">("arquivo");
const arquivo = ref("");
const erro = ref("");
const escolhas = reactive<Record<string, string>>({});
const tipos = reactive<Record<string, TipoRede | "">>({});
const linhas = linhasImportacao;

const opcoesRede = computed(() =>
  redes.value.map((rede) => ({
    value: rede.id,
    label: rede.nome,
    subtitle: rede.tipo ? (rede.tipo === "ABRAF" ? "Abrafarma" : "Independente") : "Tipo ainda não cadastrado",
  })),
);

const redesPendentes = computed(() => {
  const ids = [...new Set(Object.values(escolhas).filter(Boolean))];
  return ids
    .map((id) => redeDe(id))
    .filter((rede): rede is NonNullable<typeof rede> => !!rede && rede.tipo == null);
});

const podeConfirmar = computed(() => {
  if (etapa.value === "arquivo") return Boolean(arquivo.value) && !erro.value;
  const todas = linhas.every((linha) => escolhas[linha.id]);
  const tiposOk = redesPendentes.value.every((rede) => tipos[rede.id] === "ABRAF" || tipos[rede.id] === "INDEP");
  return todas && tiposOk;
});

watch(aberto, (valor) => {
  if (!valor) return;
  etapa.value = "arquivo";
  arquivo.value = "";
  erro.value = "";
  for (const chave of Object.keys(escolhas)) delete escolhas[chave];
  for (const chave of Object.keys(tipos)) delete tipos[chave];
  for (const linha of linhas) {
    if (linha.redeSugeridaId) escolhas[linha.id] = linha.redeSugeridaId;
  }
});

function nomeLoja(id: string) {
  return lojaDe(id)?.nome ?? id;
}

function abrirSeletor() {
  seletor.value?.click();
}

function aplicarArquivo(file: File | undefined) {
  erro.value = "";
  arquivo.value = "";
  if (!file) return;
  const extensao = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["csv", "xls", "xlsx"].includes(extensao)) {
    erro.value = "Formato não suportado. Use CSV, XLS ou XLSX.";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    erro.value = "O arquivo excede o tamanho máximo de 5 MB.";
    return;
  }
  arquivo.value = file.name;
}

function receberArquivo(evento: Event) {
  const input = evento.target as HTMLInputElement;
  aplicarArquivo(input.files?.[0]);
  input.value = "";
}

function receberSolto(evento: DragEvent) {
  aplicarArquivo(evento.dataTransfer?.files?.[0]);
}

function escolher(linhaId: string, valor: string | string[]) {
  escolhas[linhaId] = typeof valor === "string" ? valor : valor[0] ?? "";
}

function cadastrar(linhaId: string, nome: string) {
  const id = criarRede(nome);
  if (id) escolhas[linhaId] = id;
}

function avancar() {
  if (!podeConfirmar.value) return;
  if (etapa.value === "arquivo") {
    etapa.value = "depara";
    return;
  }
  const definidos: Record<string, TipoRede> = {};
  for (const rede of redesPendentes.value) {
    const tipo = tipos[rede.id];
    if (tipo === "ABRAF" || tipo === "INDEP") definidos[rede.id] = tipo;
  }
  emit("salvar", {
    linhas: linhas.map((linha) => ({ ...linha, redeId: escolhas[linha.id]! })),
    tipos: definidos,
  });
  aberto.value = false;
}
</script>
