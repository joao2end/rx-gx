<template>
  <AdsModal
    v-model:open="aberto"
    title="Mapear concorrentes"
    :description="loja ? loja.endereco : undefined"
    icon="i-lucide-map-pinned"
    size="3xl"
    scrollable
  >
    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <AdsButton
          type="unfilled"
          size="sm"
          :label="etapa === 'tipo' ? 'Voltar' : 'Cancelar'"
          @click="voltarOuFechar"
        />
        <AdsButton
          size="sm"
          :label="rotuloConfirmar"
          :disabled="!podeConfirmar"
          @click="avancar"
        />
      </div>
    </template>
    <div v-if="loja && etapa === 'lista'" class="grid gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
      <div class="space-y-3">
        <AdsSelect
          v-model="raio"
          type="radio"
          label="Raio de proximidade"
          :options="opcoesRaio"
        />
        <AdsSelect
          v-model="ordem"
          type="radio"
          label="Ordenar lista por"
          :options="[
            { value: 'perto', label: 'Mais perto' },
            { value: 'longe', label: 'Mais distante' },
          ]"
        />
        <p class="text-xs leading-relaxed text-ads-text-secondary">
          {{ visiveis.length }} estabelecimentos neste raio. O tipo só é pedido para rede que a base ainda não classificou.
        </p>
        <ul class="max-h-80 space-y-2 overflow-y-auto">
          <li v-for="ponto in visiveis" :key="ponto.id">
            <button
              type="button"
              class="flex w-full items-start gap-3 rounded-[var(--ads-radius-sm)] border px-3 py-2 text-left"
              :class="selecionados.has(ponto.id) ? 'border-[var(--ads-border-focused)] bg-[var(--ads-surface-main)]' : 'border-[var(--ads-border-subtle)] bg-white'"
              :aria-pressed="selecionados.has(ponto.id)"
              @click="alternar(ponto.id)"
            >
              <span class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-[var(--ads-border-subtle)]">
                <UIcon v-if="selecionados.has(ponto.id)" name="i-lucide-check" class="size-3 text-[var(--ads-text-brand)]" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-ads-text-primary">{{ ponto.nome }}</span>
                <span class="mt-0.5 block truncate text-xs text-ads-text-secondary">{{ ponto.endereco }}</span>
                <span class="mt-1 flex flex-wrap items-center gap-2">
                  <AdsPill size="sm" :status="pillTipo(ponto.redeId)" :label="rotuloRede(ponto.redeId)" />
                  <span class="text-xs tabular-nums text-ads-text-tertiary">{{ ponto.distanciaKm.toLocaleString('pt-BR') }} km</span>
                </span>
              </span>
            </button>
          </li>
          <li v-if="!visiveis.length" class="py-6 text-center text-sm text-ads-text-secondary">
            Nenhum estabelecimento neste raio.
          </li>
        </ul>
      </div>

      <div
        class="relative min-h-72 overflow-hidden rounded-[var(--ads-radius-sm)] border border-[var(--ads-border-subtle)] bg-[var(--ads-surface-main)]"
        aria-hidden="true"
      >
        <div
          class="absolute inset-0 opacity-70"
          style="background-image: linear-gradient(to right, var(--ads-border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--ads-border-subtle) 1px, transparent 1px); background-size: 48px 48px;"
        />
        <button
          v-for="(ponto, index) in visiveis"
          :key="`pin-${ponto.id}`"
          type="button"
          class="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
          :style="posicao(ponto, index)"
          :aria-label="ponto.nome"
          @click="alternar(ponto.id)"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-7"
            :class="selecionados.has(ponto.id) ? 'text-[var(--ads-text-brand)]' : 'text-ads-text-secondary'"
          />
        </button>
        <p class="absolute bottom-3 left-3 rounded-[var(--ads-radius-sm)] bg-white/90 px-2 py-1 text-xs text-ads-text-secondary">
          Mapa ilustrativo da praça de {{ loja.nome }}
        </p>
      </div>
    </div>

    <div v-else-if="loja" class="space-y-3">
      <p class="text-sm text-ads-text-secondary">
        Estas redes entram no cadastro compartilhado. Redes que já têm tipo na base não pedem nada além do vínculo com a loja.
      </p>
      <EstrategiaTipoRedeEscolha
        v-for="rede in redesPendentes"
        :key="rede.id"
        :nome="rede.nome"
        :nome-campo="`mapa-${rede.id}`"
        :model-value="tipos[rede.id] ?? ''"
        @update:model-value="tipos[rede.id] = $event"
      />
    </div>
  </AdsModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { LojaEstrategia, PontoMapa, TipoRede } from "~/composables/useConcorrentesEstrategia";
import { rotuloTipo } from "~/composables/useConcorrentesEstrategia";

const aberto = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  loja: LojaEstrategia | null;
}>();

const emit = defineEmits<{
  salvar: [payload: { pontos: PontoMapa[]; tipos: Record<string, TipoRede> }];
}>();

const { pontosDaLoja, redeDe } = useConcorrentesEstrategia();

const raio = ref("2000");
const ordem = ref("perto");
const etapa = ref<"lista" | "tipo">("lista");
const selecionados = ref(new Set<string>());
const tipos = reactive<Record<string, TipoRede | "">>({});

const opcoesRaio = [
  { value: "500", label: "500 m" },
  { value: "1000", label: "1 km" },
  { value: "2000", label: "2 km" },
  { value: "5000", label: "5 km" },
];

const visiveis = computed(() => {
  if (!props.loja) return [];
  const limite = Number(raio.value) / 1000;
  const lista = pontosDaLoja(props.loja.id).filter((ponto) => ponto.distanciaKm <= limite + 0.001);
  return ordem.value === "longe" ? [...lista].reverse() : lista;
});

const escolhidos = computed(() => {
  if (!props.loja) return [];
  return pontosDaLoja(props.loja.id).filter((ponto) => selecionados.value.has(ponto.id));
});

const redesPendentes = computed(() => {
  const ids = [...new Set(escolhidos.value.map((ponto) => ponto.redeId))];
  return ids
    .map((id) => redeDe(id))
    .filter((rede): rede is NonNullable<typeof rede> => !!rede && rede.tipo == null);
});

const tiposCompletos = computed(() =>
  redesPendentes.value.every((rede) => tipos[rede.id] === "ABRAF" || tipos[rede.id] === "INDEP"),
);

const rotuloConfirmar = computed(() => {
  if (etapa.value === "tipo") return "Salvar mapeamento";
  const n = selecionados.value.size;
  if (n === 1) return "Avançar com 1 selecionado";
  return `Avançar com ${n} selecionados`;
});

const podeConfirmar = computed(() => {
  if (etapa.value === "lista") return selecionados.value.size > 0;
  return tiposCompletos.value;
});

watch(aberto, (valor) => {
  if (!valor) return;
  etapa.value = "lista";
  selecionados.value = new Set();
  raio.value = "2000";
  ordem.value = "perto";
  for (const chave of Object.keys(tipos)) delete tipos[chave];
});

function rotuloRede(redeId: string) {
  const rede = redeDe(redeId);
  if (!rede) return "Sem rede";
  return rede.tipo ? rotuloTipo(rede.tipo) : "Tipo pendente";
}

function pillTipo(redeId: string) {
  const tipo = redeDe(redeId)?.tipo;
  if (tipo === "ABRAF") return "new";
  if (tipo === "INDEP") return "default";
  return "attention";
}

function alternar(id: string) {
  const proximo = new Set(selecionados.value);
  if (proximo.has(id)) proximo.delete(id);
  else proximo.add(id);
  selecionados.value = proximo;
}

function posicao(ponto: PontoMapa, index: number) {
  const angulo = ((index * 57) % 360) * (Math.PI / 180);
  const alcance = 16 + Math.min(ponto.distanciaKm, 3) * 10;
  return {
    left: `${50 + Math.cos(angulo) * alcance}%`,
    top: `${48 + Math.sin(angulo) * alcance}%`,
  };
}

function voltarOuFechar() {
  if (etapa.value === "tipo") {
    etapa.value = "lista";
    return;
  }
  aberto.value = false;
}

function avancar() {
  if (!props.loja || !escolhidos.value.length) return;
  if (redesPendentes.value.length && etapa.value === "lista") {
    for (const rede of redesPendentes.value) {
      if (!(rede.id in tipos)) tipos[rede.id] = "";
    }
    etapa.value = "tipo";
    return;
  }
  if (!tiposCompletos.value) return;
  const definidos: Record<string, TipoRede> = {};
  for (const rede of redesPendentes.value) {
    const tipo = tipos[rede.id];
    if (tipo === "ABRAF" || tipo === "INDEP") definidos[rede.id] = tipo;
  }
  emit("salvar", { pontos: escolhidos.value, tipos: definidos });
  aberto.value = false;
}
</script>
