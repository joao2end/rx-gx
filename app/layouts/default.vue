<template>
  <div class="h-dvh overflow-hidden flex flex-col bg-[var(--ads-surface-main,#f4f5f7)] text-[var(--ads-text-primary,#172b4d)]">
    <header class="sticky top-0 z-30 shrink-0 bg-white border-b border-[var(--ads-border-subtle,#dfe1e6)]">
      <div class="flex items-center justify-between px-4 h-14 gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            class="lg:hidden p-2 rounded-[var(--ads-radius-sm,8px)] hover:bg-slate-100 text-slate-700"
            aria-label="Alternar menu lateral"
            @click="mobileOpen = !mobileOpen"
          >
            <UIcon name="i-lucide-menu" class="w-5 h-5" />
          </button>
          <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0">
            <AdsProductTag product="pricing" label="Radar Pricing" />
            <span class="hidden sm:inline text-sm font-semibold text-[var(--ads-text-primary)] truncate">
              Medicamentos
            </span>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-1">
          <AdsButton
            type="unfilled"
            color="neutral"
            size="sm"
            leading
            icon="i-lucide-book-open"
            label="Guia"
            aria-haspopup="dialog"
            :aria-expanded="guiaAberta"
            @click="abrirGuia"
          />
          <UDropdownMenu
            :items="opcoesNivel"
            :ui="adsDropdownMenuUi"
            :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
          >
            <button
              type="button"
              class="inline-flex h-[var(--ads-button-sm-icon-box,32px)] shrink-0 items-center gap-1 rounded-[var(--ads-button-radius,8px)] px-2 text-[var(--ads-text-secondary)] hover:bg-[var(--ads-surface-main)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ads-border-focused)]"
              :aria-label="`Nível de detalhe: ${nivelAtual.label}`"
            >
              <UIcon name="i-lucide-settings" class="size-4" aria-hidden="true" />
              <UIcon :name="nivelAtual.icon" class="size-4" aria-hidden="true" />
            </button>
            <template #item-label="{ item }">
              <span class="font-bold text-[var(--ads-text-primary)]">{{ item.label }}</span>
            </template>
          </UDropdownMenu>
        </div>
      </div>
    </header>

    <div class="flex flex-1 min-h-0 overflow-hidden relative">
      <aside
        class="w-64 shrink-0 min-h-0 overflow-hidden bg-white border-r border-[var(--ads-border-subtle,#dfe1e6)] flex-col hidden lg:flex"
      >
        <nav class="min-h-0 flex-1 overflow-y-auto p-3 space-y-5" aria-label="Navegação da POC">
          <SideNav :rota-ativa="isActive" />
        </nav>
      </aside>

      <div v-if="mobileOpen" class="fixed inset-0 z-40 lg:hidden flex">
        <div class="fixed inset-0 bg-slate-900/40" @click="mobileOpen = false" />
        <aside class="relative z-10 w-72 max-w-[85vw] bg-white h-full p-4 overflow-y-auto space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <span class="font-semibold text-sm">Navegação</span>
            <button type="button" class="p-1 text-slate-500" aria-label="Fechar menu" @click="mobileOpen = false">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <SideNav :rota-ativa="isActive" @navegou="mobileOpen = false" />
        </aside>
      </div>

      <main class="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
        <div v-if="isLoaded" class="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Trilha />
          <div
            v-if="emJornada || proximaEtapa"
            class="mb-[var(--ads-space-xs)] flex flex-wrap items-center justify-between gap-3"
          >
            <NomeSimulacao />
            <AdsButton
              v-if="proximaEtapa"
              class="ml-auto"
              type="filled"
              trailing
              icon="i-lucide-arrow-right"
              :label="`Próxima etapa: ${proximaEtapa.titulo}`"
              :to="proximaEtapa.to"
            />
          </div>
          <slot />
        </div>
      </main>
    </div>

    <GuiaConsulta v-model:open="guiaAberta" />
    <EscolhaPesquisa
      v-model:open="modalPesquisas"
      :dominio="dominioModal"
      :selecionadas="pesquisasEscolhidas[dominioModal]"
      @confirmar="confirmarEntrada"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { adsDropdownMenuUi } from "ads-nuxt/app/theme/ads-theme";
import { useDominio } from "~/composables/useDominio";
import { usePricingPoc } from "~/composables/usePricingPoc";
import { DOMINIOS, vizinhas, type Dominio } from "~/utils/jornada";

const route = useRoute();
const mobileOpen = ref(false);
const guiaAberta = ref(false);

function abrirGuia() {
  mobileOpen.value = false;
  guiaAberta.value = true;
}
const { isLoaded, pesquisasEscolhidas, escolherPesquisas } = usePricingPoc();
const overlayCarregamento = useOverlayLoading();

function abrirOverlayCarregamento() {
  if (isLoaded.value || overlayCarregamento.isOpen()) return;
  overlayCarregamento.show({
    variant: "loading",
    title: "Carregando a simulação",
    description: "Aguarde enquanto preparamos os dados de preço.",
  });
}

onMounted(abrirOverlayCarregamento);

watch(isLoaded, (carregado) => {
  if (carregado) overlayCarregamento.close();
  else abrirOverlayCarregamento();
});
const pendenteSimulacao = useState<Dominio | null>("poc-escolha-simulacao-pendente", () => null);
const liberarEntradaSimulacao = useState<boolean>("poc-liberar-entrada-simulacao", () => false);
const modalPesquisas = ref(false);
const dominioModal = ref<Dominio>("rx");

watch(pendenteSimulacao, (dominio) => {
  if (!dominio) {
    modalPesquisas.value = false;
    return;
  }
  dominioModal.value = dominio;
  modalPesquisas.value = true;
}, { immediate: true });

watch(modalPesquisas, (aberta) => {
  if (!aberta) pendenteSimulacao.value = null;
});

const destinoAposPesquisa = useState<"jornada" | "simulacao">("poc-destino-apos-pesquisa", () => "simulacao");

function primeiraEtapa(d: Dominio) {
  return DOMINIOS[d].etapas.find((etapa) => etapa.id !== "visao")?.to ?? `/${d}/sensibilidade`;
}

function confirmarEntrada(ids: string[]) {
  const dominio = dominioModal.value;
  const destino = destinoAposPesquisa.value;
  escolherPesquisas(dominio, ids);
  pendenteSimulacao.value = null;
  if (destino === "jornada") {
    navigateTo(primeiraEtapa(dominio));
    return;
  }
  liberarEntradaSimulacao.value = true;
  navigateTo(`/${dominio}/simulacao`);
}
const { dominio, ultimo } = useDominio();

const emDominio = computed(
  () => route.path !== "/" || route.query.d === "rx" || route.query.d === "gx",
);

const emJornada = computed(
  () => route.path === "/rx" || route.path.startsWith("/rx/") || route.path === "/gx" || route.path.startsWith("/gx/"),
);

const proximaEtapa = computed(() => {
  const escolha =
    (route.path === "/pesquisa" || route.path === "/estrategia/clusterizacao") &&
    route.query.d !== "rx" &&
    route.query.d !== "gx";
  if (escolha) return undefined;
  const etapa = DOMINIOS[dominio.value].etapas.find((item) => item.to.split("?")[0] === route.path);
  if (!etapa || etapa.modulo) return undefined;
  return vizinhas(dominio.value, etapa.id).proxima;
});

watch(
  dominio,
  (d) => {
    if (emDominio.value) ultimo.value = d;
  },
  { immediate: true },
);

type NivelDetalhe = "simples" | "avancado" | "completo";
const nivelDetalhe = useState<NivelDetalhe>("poc-nivel-detalhe", () => "simples");

const opcoesNivelBase: { value: NivelDetalhe; label: string; description: string; icon: string }[] = [
  {
    value: "simples",
    label: "Simples",
    icon: "i-lucide-circle-dot",
    description: "Calcula com os parâmetros da planilha. Na Parametrização, IC, farol e as regras de rede ficam fechados. O pacote do cluster RX fica na estratégia.",
  },
  {
    value: "avancado",
    label: "Avançado",
    icon: "i-lucide-sliders-horizontal",
    description: "Na Parametrização do RX abre a matriz online. No GX abre a escada, o P1 da chave e as matrizes de IC e margem.",
  },
  {
    value: "completo",
    label: "Completo",
    icon: "i-lucide-layout-grid",
    description: "Na Parametrização soma farol, alíquota e margem mínima. No RX também a margem crítica. O pacote do cluster fica na estratégia.",
  },
];

const nivelAtual = computed(
  () => opcoesNivelBase.find((opcao) => opcao.value === nivelDetalhe.value) ?? opcoesNivelBase[0],
);

const opcoesNivel = computed(() => {
  const opcoes = opcoesNivelBase;
  return opcoes.map((opcao) => ({
    label: opcao.label,
    description: opcao.description,
    icon: opcao.icon,
    type: "checkbox" as const,
    checked: nivelDetalhe.value === opcao.value,
    onSelect: () => {
      nivelDetalhe.value = opcao.value;
    },
    onUpdateChecked: () => {
      nivelDetalhe.value = opcao.value;
    },
    class: "!items-start whitespace-normal max-w-sm",
    ui: {
      item: "!items-start",
      itemLeadingIcon: "!mt-0.5 !self-start",
      itemWrapper: "!items-start",
      itemDescription: "!font-normal !whitespace-normal !text-[var(--ads-text-secondary)]",
    },
  }));
});

function isActive(to: string): boolean {
  const [path, query] = to.split("?");
  if (path === "/") return route.path === "/";
  if (query) {
    const d = new URLSearchParams(query).get("d");
    return route.path === path && (!d || d === dominio.value);
  }
  return route.path === path;
}
</script>
