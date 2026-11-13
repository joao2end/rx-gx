<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <h2 class="text-lg font-bold text-ads-text-primary">Gestão de concorrentes</h2>
        <p class="max-w-[62ch] text-sm text-ads-text-secondary">
          Um cadastro só, compartilhado por RX, GX e Auto-Serviço. Ao incluir uma rede nova, o único dado a mais é o tipo.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AdsButton
          type="unfilled"
          leading
          icon="i-lucide-download"
          label="Baixar modelo de importação"
          @click="baixarModelo"
        />
        <AdsButton
          leading
          icon="i-lucide-upload"
          label="Importar base"
          @click="importarAberto = true"
        />
      </div>
    </header>

    <section class="overflow-hidden rounded-[var(--ads-radius-md,12px)] border border-[var(--ads-border-subtle)] bg-white">
      <button
        type="button"
        class="flex w-full items-center gap-2 px-4 py-3 text-left sm:px-5"
        :aria-expanded="redesAbertas"
        @click="redesAbertas = !redesAbertas"
      >
        <UIcon name="i-lucide-settings-2" class="size-4 shrink-0 text-ads-text-secondary" />
        <span class="text-base font-bold text-ads-text-primary">Configurar redes habilitadas</span>
        <AdsPill size="sm" status="new" :label="`${ativas}/${redes.length} ativas`" />
        <UIcon
          :name="redesAbertas ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="ms-auto size-4 text-ads-text-secondary"
        />
      </button>
      <ul v-if="redesAbertas" class="flex flex-wrap gap-2 px-4 pb-4 sm:px-5">
        <li
          v-for="rede in redes"
          :key="rede.id"
          class="flex max-w-full items-center gap-2 rounded-[var(--ads-radius-sm)] border border-[var(--ads-border-subtle)] bg-white px-2.5 py-1.5"
        >
          <span
            class="size-2 shrink-0 rounded-full"
            :class="rede.habilitada ? 'bg-ads-status-success-600' : 'bg-ads-text-tertiary'"
            aria-hidden="true"
          />
          <span class="truncate text-xs font-medium text-ads-text-primary">{{ rede.nome }}</span>
          <AdsPill v-if="!rede.tipo" size="sm" status="attention" label="Sem tipo" />
          <AdsSwitch
            :model-value="rede.habilitada"
            :aria-label="`${rede.nome}, ${rede.habilitada ? 'habilitada' : 'desabilitada'}`"
            @update:model-value="definirHabilitada(rede.id, $event)"
          />
        </li>
      </ul>
    </section>

    <section class="overflow-hidden rounded-[var(--ads-radius-md,12px)] border border-[var(--ads-border-subtle)] bg-white">
      <header class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <AdsSearchInput
          v-model="busca"
          class="w-full sm:max-w-md"
          placeholder="Buscar por CNPJ, nome ou endereço..."
          aria-label="Buscar loja"
        />
        <AdsSegmentedTabs
          v-model="filtro"
          aria-label="Filtro rápido de mapeamento"
          :items="[
            { label: 'Todas', value: 'todas' },
            { label: 'Pendentes', value: 'pendentes' },
            { label: 'Concluídas', value: 'concluidas' },
          ]"
        />
      </header>

      <AdsEmptyState
        v-if="!linhas.length"
        small
        title="Nenhuma loja encontrada"
        subtitle="Ajuste a busca ou o filtro de mapeamento."
      />
      <AdsTable
        v-else
        :data="linhas"
        :columns="colunas"
        density="md"
        :framed="false"
      >
        <template #loja-cell="{ row }">
          <div class="flex min-w-0 items-start gap-3">
            <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--ads-radius-sm)] bg-[var(--ads-surface-main)] text-[var(--ads-text-brand)]">
              <UIcon name="i-lucide-store" class="size-4" />
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-ads-text-primary">{{ row.original.nome }}</p>
              <p class="mt-0.5 truncate text-xs text-ads-text-secondary">{{ row.original.endereco }}</p>
            </div>
          </div>
        </template>
        <template #status-cell="{ row }">
          <AdsPill
            size="sm"
            :status="row.original.pendente ? 'attention' : 'success'"
            :label="row.original.pendente ? 'Pendente' : rotuloQuantidade(row.original.quantidade)"
          />
        </template>
        <template #origem-cell="{ row }">
          <AdsPill
            v-if="row.original.origem"
            size="sm"
            :status="row.original.origem === 'importado' ? 'new' : 'default'"
            :label="row.original.origem === 'importado' ? 'Importado' : 'Manual'"
          />
        </template>
        <template #atualizacao-cell="{ row }">
          <span v-if="row.original.dias != null" class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-ads-text-secondary">
            <UIcon name="i-lucide-clock" class="size-3.5" />
            {{ rotuloAtualizacao(row.original.dias) }}
          </span>
        </template>
        <template #acao-cell="{ row }">
          <div class="flex justify-end">
            <AdsButton
              v-if="row.original.pendente"
              type="secondary"
              size="sm"
              leading
              icon="i-lucide-map-pinned"
              label="Mapear"
              @click="abrirMapa(row.original.id)"
            />
            <AdsButton
              v-else
              type="unfilled"
              size="sm"
              trailing
              icon="i-lucide-chevron-right"
              label="Ver detalhes"
              @click="abrirDetalhes(row.original.id)"
            />
          </div>
        </template>
      </AdsTable>
    </section>

    <EstrategiaConcorrentesMapaModal v-model:open="mapaAberto" :loja="lojaAtiva" @salvar="salvarMapa" />
    <EstrategiaConcorrentesDetalhesModal
      v-model:open="detalhesAberto"
      :loja="lojaAtiva"
      @remover="remover"
      @mapear="abrirMapaDesdeDetalhes"
      @importar="abrirImportacaoDesdeDetalhes"
    />
    <EstrategiaConcorrentesImportarModal v-model:open="importarAberto" @salvar="salvarImportacao" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { FiltroMapeamento, OrigemMapeamento, PontoMapa, TipoRede } from "~/composables/useConcorrentesEstrategia";
import { rotuloAtualizacao, useConcorrentesEstrategia } from "~/composables/useConcorrentesEstrategia";

interface LinhaLoja {
  id: string;
  nome: string;
  endereco: string;
  pendente: boolean;
  quantidade: number;
  origem: OrigemMapeamento | null;
  dias: number | null;
}

const toast = useToast();
const {
  redes,
  lojas,
  ativas,
  lojaDe,
  resumoLoja,
  definirHabilitada,
  definirTipo,
  incluirVinculos,
  removerVinculo,
} = useConcorrentesEstrategia();

const busca = ref("");
const filtro = ref<FiltroMapeamento>("todas");
const redesAbertas = ref(false);
const mapaAberto = ref(false);
const detalhesAberto = ref(false);
const importarAberto = ref(false);
const lojaAtivaId = ref<string | null>(null);

const lojaAtiva = computed(() => (lojaAtivaId.value ? lojaDe(lojaAtivaId.value) ?? null : null));

const colunas: TableColumn<LinhaLoja>[] = [
  { id: "loja", header: "Loja própria" },
  { id: "status", header: "Status de mapeamento" },
  { id: "origem", header: "Origem" },
  { id: "atualizacao", header: "Última atualização" },
  { id: "acao", header: "" },
];

const linhas = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase("pt-BR");
  const digitos = termo.replace(/\D/g, "");
  return lojas.value
    .map((loja) => {
      const resumo = resumoLoja(loja.id);
      return {
        id: loja.id,
        nome: loja.nome,
        endereco: loja.endereco,
        cnpj: loja.cnpj,
        pendente: resumo.pendente,
        quantidade: resumo.quantidade,
        origem: resumo.origem,
        dias: resumo.dias,
      };
    })
    .filter((loja) => {
      if (filtro.value === "pendentes" && !loja.pendente) return false;
      if (filtro.value === "concluidas" && loja.pendente) return false;
      if (!termo) return true;
      const texto = `${loja.nome} ${loja.endereco} ${loja.cnpj}`.toLocaleLowerCase("pt-BR");
      if (texto.includes(termo)) return true;
      return Boolean(digitos) && loja.cnpj.replace(/\D/g, "").includes(digitos);
    });
});

function rotuloQuantidade(quantidade: number) {
  return quantidade === 1 ? "1 concorrente mapeado" : `${quantidade} concorrentes mapeados`;
}

function abrirMapa(id: string) {
  lojaAtivaId.value = id;
  mapaAberto.value = true;
}

function abrirDetalhes(id: string) {
  lojaAtivaId.value = id;
  detalhesAberto.value = true;
}

function abrirMapaDesdeDetalhes() {
  detalhesAberto.value = false;
  mapaAberto.value = true;
}

function abrirImportacaoDesdeDetalhes() {
  detalhesAberto.value = false;
  importarAberto.value = true;
}

function salvarMapa(payload: { pontos: PontoMapa[]; tipos: Record<string, TipoRede> }) {
  if (!lojaAtivaId.value) return;
  for (const [redeId, tipo] of Object.entries(payload.tipos)) definirTipo(redeId, tipo);
  const quantidade = incluirVinculos(
    payload.pontos.map((ponto) => ({
      lojaId: lojaAtivaId.value!,
      redeId: ponto.redeId,
      endereco: ponto.endereco,
      origem: "manual" as const,
    })),
  );
  toast.add({
    title: "Concorrentes mapeados",
    description: quantidade
      ? `${quantidade} vínculo(s) novos no cadastro compartilhado.`
      : "Esses concorrentes já estavam vinculados à loja.",
    color: "success",
  });
}

function salvarImportacao(payload: {
  linhas: Array<{ lojaId: string; redeId: string; endereco: string }>;
  tipos: Record<string, TipoRede>;
}) {
  for (const [redeId, tipo] of Object.entries(payload.tipos)) definirTipo(redeId, tipo);
  const quantidade = incluirVinculos(
    payload.linhas.map((linha) => ({
      lojaId: linha.lojaId,
      redeId: linha.redeId,
      endereco: linha.endereco,
      origem: "importado" as const,
    })),
  );
  toast.add({
    title: "Importação concluída",
    description: `${quantidade} concorrente(s) entraram no cadastro compartilhado.`,
    color: "success",
  });
}

function remover(id: string) {
  removerVinculo(id);
  toast.add({ title: "Concorrente removido desta loja", color: "neutral" });
}

function baixarModelo() {
  const cabecalho = "CNPJ_LOJA_PROPRIA;REDE;CEP;UF;CIDADE;BAIRRO;LOGRADOURO;NUMERO;COMPLEMENTO;CNPJ_CONCORRENTE\n";
  const blob = new Blob([cabecalho], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo_importacao_concorrentes.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast.add({ title: "Modelo de importação baixado", color: "success" });
}
</script>
