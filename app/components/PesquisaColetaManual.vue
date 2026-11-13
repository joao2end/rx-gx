<template>
  <div v-if="pesquisa" class="space-y-4">
    <div
      class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--ads-radius-sm)] bg-[var(--ads-surface-main)] px-4 py-3 text-sm"
    >
      <p class="flex min-w-0 items-center gap-2">
        <UIcon name="i-lucide-store" class="size-4 shrink-0 text-[var(--ads-text-brand)]" />
        <span class="font-semibold text-[var(--ads-text-primary)]">Loja</span>
        <span class="truncate text-[var(--ads-text-secondary)]">{{ pesquisa.loja }}</span>
      </p>
      <p v-if="concorrente" class="flex min-w-0 items-center gap-2">
        <UIcon name="i-lucide-users" class="size-4 shrink-0 text-[var(--ads-text-brand)]" />
        <span class="font-semibold text-[var(--ads-text-primary)]">Concorrente</span>
        <span class="truncate text-[var(--ads-text-secondary)]">{{ concorrente }}</span>
      </p>
      <p class="text-[var(--ads-text-secondary)]">
        {{ pesquisa.dominio === "gx" ? "Colete o menor preço da chave, de qualquer laboratório." : "Colete o preço do SKU exato no balcão." }}
      </p>
    </div>

    <div v-if="!concorrente" class="space-y-3">
      <AdsCard v-for="rede in pesquisa.concorrentes" :key="rede.nome" :title="rede.nome">
        <template #actions>
          <AdsPill size="sm" :status="rede.tipo === 'ABRAF' ? 'new' : 'default'" :label="rede.tipo === 'ABRAF' ? 'Abrafarma' : 'Independente'" />
        </template>
        <div class="space-y-3">
          <div class="h-2 overflow-hidden rounded-full bg-[var(--ads-surface-main)]">
            <div
              class="h-full bg-[var(--ads-text-brand)]"
              :style="{ width: `${progresso(rede.nome).percentual}%` }"
            />
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-[var(--ads-text-secondary)]">
              {{ fmtInt(progresso(rede.nome).feitos) }} de {{ fmtInt(pesquisa.itens.length) }} coletas
              <span v-if="progresso(rede.nome).faltam > 0"> · faltam {{ fmtInt(progresso(rede.nome).faltam) }}</span>
            </p>
            <AdsButton
              size="sm"
              :type="progresso(rede.nome).faltam === 0 ? 'unfilled' : 'filled'"
              :color="progresso(rede.nome).faltam === 0 ? 'success' : 'primary'"
              :label="progresso(rede.nome).faltam === 0 ? 'Concluído' : 'Coletar'"
              :trailing="progresso(rede.nome).faltam > 0"
              icon="i-lucide-arrow-right"
              @click="concorrente = rede.nome"
            />
          </div>
        </div>
      </AdsCard>
    </div>

    <div v-else class="space-y-4">
      <AdsSearchInput v-model="busca" placeholder="Buscar produto..." aria-label="Buscar produto da coleta" />
      <AdsSegmentedTabs v-model="filtro" :items="abas" />
      <p class="text-sm text-[var(--ads-text-secondary)]">
        Exibindo <strong class="text-[var(--ads-text-primary)]">{{ fmtInt(itensFiltrados.length) }}</strong>
        de <strong class="text-[var(--ads-text-primary)]">{{ fmtInt(pesquisa.itens.length) }}</strong> produtos
      </p>

      <AdsCard>
        <AdsEmptyState
          v-if="itensFiltrados.length === 0"
          small
          title="Nenhum produto neste filtro"
          subtitle="Troque a busca ou o status da coleta."
          :show-actions="false"
        />
        <div v-else class="divide-y divide-[var(--ads-border-subtle)]">
          <div
            v-for="(item, indice) in itensFiltrados"
            :key="item.id"
            class="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 lg:flex-row lg:items-center"
          >
            <div class="flex min-w-0 flex-1 items-start gap-3">
              <span
                class="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--ads-surface-main)] text-sm font-medium text-[var(--ads-text-secondary)]"
              >
                {{ indice + 1 }}
              </span>
              <div class="min-w-0">
                <p class="font-semibold text-[var(--ads-text-primary)]">{{ item.descricao }}</p>
                <p class="text-sm text-[var(--ads-text-secondary)]">{{ item.fabricante }}</p>
                <div class="mt-1">
                  <AdsPill size="sm" tone="secondary" :label="item.categoria || item.departamento" />
                </div>
              </div>
            </div>
            <div class="flex flex-wrap items-end gap-2 lg:w-[22rem] lg:justify-end">
              <div class="w-36">
                <AdsNumberInput
                  :model-value="rascunho[item.id] ?? textoPreco(item.id)"
                  placeholder="0,00"
                  :min="0"
                  :step="0.01"
                  :disabled="statusDe(item.id) === 'nao_encontrado'"
                  aria-label="Preço coletado"
                  @update:model-value="(valor) => (rascunho[item.id] = String(valor ?? ''))"
                  @blur="confirmarPreco(item.id)"
                />
              </div>
              <AdsButton
                type="outline"
                color="neutral"
                size="sm"
                :label="statusDe(item.id) === 'nao_encontrado' ? 'Desfazer' : 'Não encontrado'"
                @click="alternarNaoEncontrado(item.id)"
              />
              <AdsPill size="sm" :status="pillStatus(item.id)" :label="rotuloStatus(item.id)" />
            </div>
          </div>
        </div>
      </AdsCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { chaveColeta, usePesquisasManuais, type StatusColetaManual } from "~/composables/usePesquisasManuais";
import { fmtInt } from "~/utils/formatters";

const props = defineProps<{ id: string }>();
const concorrente = defineModel<string | null>("concorrente", { default: null });

const { pesquisas, atualizarColeta } = usePesquisasManuais();
const pesquisa = computed(() => pesquisas.value.find((item) => item.id === props.id) ?? null);
const busca = ref("");
const filtro = ref<"pendente" | "coletado" | "nao_encontrado" | "todos">("pendente");
const rascunho = reactive<Record<string, string>>({});

watch(concorrente, () => {
  busca.value = "";
  filtro.value = "pendente";
  for (const chave of Object.keys(rascunho)) delete rascunho[chave];
});

function coletaDe(itemId: string) {
  if (!pesquisa.value || !concorrente.value) return undefined;
  return pesquisa.value.coletas[chaveColeta(concorrente.value, itemId)];
}

function statusDe(itemId: string): StatusColetaManual {
  return coletaDe(itemId)?.status ?? "pendente";
}

function progresso(rede: string) {
  const total = pesquisa.value?.itens.length ?? 0;
  const feitos = pesquisa.value
    ? pesquisa.value.itens.filter((item) => pesquisa.value?.coletas[chaveColeta(rede, item.id)]).length
    : 0;
  return {
    feitos,
    faltam: Math.max(0, total - feitos),
    percentual: total === 0 ? 0 : Math.round((feitos / total) * 100),
  };
}

const contagem = computed(() => {
  const itens = pesquisa.value?.itens ?? [];
  const base = { pendente: 0, coletado: 0, nao_encontrado: 0, todos: itens.length };
  for (const item of itens) base[statusDe(item.id)] += 1;
  return base;
});

const abas = computed(() => [
  { label: `Pendentes (${contagem.value.pendente})`, value: "pendente" },
  { label: `Coletados (${contagem.value.coletado})`, value: "coletado" },
  { label: `Não encontrados (${contagem.value.nao_encontrado})`, value: "nao_encontrado" },
  { label: "Todos", value: "todos" },
]);

const itensFiltrados = computed(() => {
  const q = busca.value.trim().toLowerCase();
  return (pesquisa.value?.itens ?? []).filter((item) => {
    if (filtro.value !== "todos" && statusDe(item.id) !== filtro.value) return false;
    if (!q) return true;
    return `${item.descricao} ${item.fabricante} ${item.categoria}`.toLowerCase().includes(q);
  });
});

function textoPreco(itemId: string) {
  const preco = coletaDe(itemId)?.preco;
  return preco == null ? "" : String(preco);
}

function pillStatus(itemId: string) {
  const status = statusDe(itemId);
  if (status === "coletado") return "success";
  if (status === "nao_encontrado") return "warning";
  return "default";
}

function rotuloStatus(itemId: string) {
  const status = statusDe(itemId);
  if (status === "coletado") return "Coletado";
  if (status === "nao_encontrado") return "Não encontrado";
  return "Pendente";
}

function confirmarPreco(itemId: string) {
  if (!concorrente.value || statusDe(itemId) === "nao_encontrado") return;
  const bruto = (rascunho[itemId] ?? textoPreco(itemId)).trim().replace(",", ".");
  delete rascunho[itemId];
  if (!bruto) {
    atualizarColeta(props.id, concorrente.value, itemId, null);
    return;
  }
  const preco = Number(bruto);
  if (!Number.isFinite(preco) || preco <= 0) return;
  atualizarColeta(props.id, concorrente.value, itemId, { preco, status: "coletado" });
}

function alternarNaoEncontrado(itemId: string) {
  if (!concorrente.value) return;
  delete rascunho[itemId];
  if (statusDe(itemId) === "nao_encontrado") {
    atualizarColeta(props.id, concorrente.value, itemId, null);
    return;
  }
  atualizarColeta(props.id, concorrente.value, itemId, { preco: null, status: "nao_encontrado" });
}
</script>
