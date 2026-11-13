<template>
  <AdsModal
    v-model:open="aberta"
    title="Escolher pesquisas"
    :description="description"
    icon="i-lucide-folder-search"
    size="xl"
    scrollable
    @cancel="fechar"
    @dismiss="fechar"
  >
    <div class="space-y-4">
      <AdsSearchInput
        v-model="busca"
        placeholder="Buscar pesquisa"
        aria-label="Buscar pesquisa"
        size="sm"
      />
      <p class="text-xs text-ads-text-secondary">
        {{ rascunho.length }}
        {{ rascunho.length === 1 ? "pesquisa selecionada" : "pesquisas selecionadas" }}.
        Selecione ao menos uma para aplicar.
      </p>

      <p v-if="grupos.length === 0" class="text-sm text-ads-text-secondary">
        Nenhuma pesquisa encontrada.
      </p>

      <div v-else class="overflow-hidden rounded-[var(--ads-radius-sm)] border border-ads-border-subtle">
        <section v-for="(grupo, grupoIndex) in grupos" :key="grupo.label">
          <div class="flex items-center gap-3 px-4 py-2.5">
            <span class="shrink-0 text-xs font-bold tracking-wide text-ads-text-secondary">
              {{ grupo.label }}
            </span>
            <span class="h-px flex-1 bg-ads-border-subtle" aria-hidden="true" />
          </div>
          <div
            v-for="(p, itemIndex) in grupo.itens"
            :key="p.id"
            class="space-y-1 px-4 py-3"
            :class="{
              'border-b border-ads-border-subtle':
                itemIndex < grupo.itens.length - 1 || grupoIndex < grupos.length - 1,
            }"
          >
            <AdsCheckbox v-model="marcadas[p.id]" :label="p.nome" />
            <p class="ps-7 text-xs text-ads-text-secondary">
              {{ p.origem }} · {{ p.cobre }} · {{ detalhe(p.id) }}
            </p>
          </div>
        </section>
      </div>
    </div>

    <template #footer>
      <AdsButton type="unfilled" size="sm" label="Cancelar" @click="fechar" />
      <AdsButton size="sm" label="Aplicar" :disabled="rascunho.length === 0" @click="aplicar" />
    </template>
  </AdsModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { usePricingPoc } from "~/composables/usePricingPoc";
import { fmtInt } from "~/utils/formatters";
import type { Dominio } from "~/utils/jornada";
import { pesquisasDoDominio, type IdPesquisa, type PesquisaCatalogo } from "~/utils/pesquisas-catalogo";

const props = withDefaults(
  defineProps<{ dominio: Dominio; selecionadas: string[]; description?: string }>(),
  { description: "A simulação calcula só com as pesquisas que você confirmar." },
);
const emit = defineEmits<{ confirmar: [ids: string[]] }>();
const aberta = defineModel<boolean>("open", { default: false });

const { pesqData, gxSimData } = usePricingPoc();
const lista = computed(() => pesquisasDoDominio(props.dominio));
const busca = ref("");
const marcadas = reactive<Record<string, boolean>>({});

const filtradas = computed(() => {
  const q = busca.value.trim().toLowerCase();
  if (!q) return lista.value;
  return lista.value.filter((p) =>
    `${p.nome} ${p.origem} ${p.cobre} ${p.grupo}`.toLowerCase().includes(q),
  );
});

const grupos = computed(() => {
  const mapa = new Map<string, PesquisaCatalogo[]>();
  for (const p of filtradas.value) {
    const itens = mapa.get(p.grupo) ?? [];
    itens.push(p);
    mapa.set(p.grupo, itens);
  }
  return [...mapa.entries()].map(([label, itens]) => ({ label, itens }));
});

const rascunho = computed(() => lista.value.filter((p) => marcadas[p.id]).map((p) => p.id));

watch(
  aberta,
  (aberto) => {
    if (!aberto) return;
    busca.value = "";
    const atuais = new Set(props.selecionadas);
    for (const p of lista.value) marcadas[p.id] = atuais.has(p.id);
  },
  { immediate: true },
);

function detalhe(id: IdPesquisa): string {
  if (id === "rx-competitiva-rj") {
    const skus = new Set((pesqData.value?.coletasRx ?? []).map((c) => c.produtoId)).size;
    return `${fmtInt(skus)} SKUs`;
  }
  if (id === "gx-manual-rj") {
    return `${fmtInt(Object.keys(gxSimData.value?.pesqManual ?? {}).length)} chaves`;
  }
  const comPreco = Object.values(gxSimData.value?.pesqInternet ?? {}).filter((b) =>
    Object.values(b).some((v) => v != null),
  ).length;
  return `${fmtInt(comPreco)} chaves`;
}

function fechar() {
  aberta.value = false;
}

function aplicar() {
  if (rascunho.value.length === 0) return;
  emit("confirmar", [...rascunho.value]);
  aberta.value = false;
}
</script>
