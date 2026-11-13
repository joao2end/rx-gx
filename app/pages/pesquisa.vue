<template>
  <div v-if="!dominioEscolhido" class="space-y-8">
    <section class="flex flex-wrap items-stretch gap-4" aria-label="Escolha a pesquisa">
      <div v-for="card in pesquisas" :key="card.title" class="flex min-w-0 self-stretch">
        <AdsFeatureCard
          class="h-full"
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :color="card.color"
          :to="card.to"
          :disabled="card.disabled"
          :badges="card.badges"
        />
      </div>
    </section>
  </div>

  <div v-else class="space-y-6">
    <EtapaCabecalho :dominio="dominio" etapa-id="pesquisa" :titulo="tituloPesquisa" :mostrar-titulo="false" />

    <template v-if="vista.tipo === 'hub'">
      <section class="space-y-3" aria-label="Nova pesquisa">
        <h2 class="text-base font-bold text-ads-text-primary">Nova pesquisa</h2>
        <div class="flex flex-wrap items-stretch gap-4">
          <AdsFeatureCard
            title="Criar pesquisa manual"
            description="Escolha os produtos pelos parâmetros da lista e inicie a coleta em loja."
            icon="i-lucide-store"
            color="success"
            @click="abrirCriacao"
          />
          <AdsFeatureCard
            title="Importar pesquisa"
            description="Trazer uma pesquisa já coletada em arquivo."
            icon="i-lucide-file-up"
            color="blocked"
            disabled
          />
          <AdsFeatureCard
            title="Upload e robô"
            description="Pesquisa com uma ferramenta que ainda será desenvolvida."
            icon="i-lucide-bot"
            color="blocked"
            disabled
          />
        </div>
      </section>

      <section class="flex flex-wrap items-stretch gap-4" aria-label="Gerenciador de pesquisa">
        <AdsFeatureCard
          title="Gerenciador de pesquisa"
          description="Lista as pesquisas concluídas e as que ainda estão em coleta."
          icon="i-lucide-clipboard-list"
          color="primary"
          @click="vista = { tipo: 'gerenciador' }"
        />
      </section>

      <EtapaRodape :dominio="dominio" etapa-id="pesquisa" />
    </template>

    <template v-else-if="vista.tipo === 'gerenciador'">
      <div class="flex min-w-0 items-start gap-2">
        <AdsButton
          type="unfilled"
          color="neutral"
          icon="i-lucide-arrow-left"
          aria-label="Voltar para a pesquisa"
          @click="vista = { tipo: 'hub' }"
        />
        <div class="min-w-0 space-y-2">
          <h2 class="text-xl font-bold text-ads-text-primary">Gerenciador de pesquisa</h2>
          <p class="max-w-[68ch] text-sm text-ads-text-secondary">
            Pesquisas concluídas e as que ainda estão em coleta.
          </p>
        </div>
      </div>

      <div
        v-if="pesquisasExcel.length === 0 && pesquisasDoDominioAtual.length === 0"
        class="text-sm text-ads-text-secondary"
      >
        Nenhuma pesquisa neste domínio.
      </div>
      <div v-else class="space-y-3">
        <AdsCard
          v-for="item in pesquisasExcel"
          :key="item.id"
          as="button"
          class="w-full"
          :title="item.nome"
          :description="`${item.origem} · ${item.cobre}`"
          :footer-text="item.detalhe"
          @click="abrirExcel(item.id)"
        >
          <template #actions>
            <AdsPill size="sm" status="success" label="Concluída" />
          </template>
        </AdsCard>

        <AdsCard
          v-for="item in pesquisasDoDominioAtual"
          :key="item.id"
          as="button"
          class="w-full"
          :title="item.nome"
          description="Pesquisa manual criada nesta sessão."
          :footer-text="resumoManual(item)"
          @click="abrirManual(item.id)"
        >
          <template #actions>
            <AdsPill
              size="sm"
              :status="concluida(item) ? 'success' : 'attention'"
              :label="concluida(item) ? 'Concluída' : 'Em andamento'"
            />
          </template>
        </AdsCard>
      </div>
    </template>

    <template v-else-if="vista.tipo === 'criar'">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="flex min-w-0 items-start gap-2">
          <AdsButton
            type="unfilled"
            color="neutral"
            icon="i-lucide-arrow-left"
            aria-label="Voltar para a pesquisa"
            @click="vista = { tipo: 'hub' }"
          />
          <div class="min-w-0 space-y-2">
            <h2 class="text-xl font-bold text-ads-text-primary">Nova pesquisa manual</h2>
            <p class="max-w-[68ch] text-sm text-ads-text-secondary">
              Ajuste os parâmetros, revise quem entra na lista e inicie a coleta.
            </p>
          </div>
        </div>
      </div>

      <div class="max-w-xl">
        <AdsInput v-model="nomePesquisa" label="Nome da pesquisa" placeholder="Nome da pesquisa" />
      </div>

      <PesquisaLista :dominio="dominio" />

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ads-radius-md)] border border-[var(--ads-border-subtle)] bg-[var(--ads-surface-card)] p-4"
      >
        <p class="text-sm text-ads-text-secondary">
          <strong class="text-ads-text-primary">{{ fmtInt(itensSelecionados.length) }}</strong>
          {{ dominio === "gx" ? "chaves na lista" : "produtos na lista" }}
        </p>
        <AdsButton
          label="Iniciar pesquisa"
          trailing
          icon="i-lucide-arrow-right"
          :disabled="itensSelecionados.length === 0 || !nomePesquisa.trim()"
          @click="iniciarPesquisa"
        />
      </div>
    </template>

    <template v-else-if="vista.tipo === 'excel'">
      <div class="flex min-w-0 items-start gap-2">
        <AdsButton
          type="unfilled"
          color="neutral"
          icon="i-lucide-arrow-left"
          aria-label="Voltar para o gerenciador"
          @click="vista = { tipo: 'gerenciador' }"
        />
        <div class="min-w-0 space-y-1">
          <h2 class="text-xl font-bold text-ads-text-primary">{{ pesquisaExcelAberta?.nome }}</h2>
          <p class="text-sm text-ads-text-secondary">
            {{ pesquisaExcelAberta?.origem }}. Coleta já tratada a partir do arquivo.
          </p>
        </div>
      </div>

      <template v-if="vista.id === 'gx-internet-rj'">
        <AdsPanelCard
          title="Preço de referência da internet"
          :subtitle="`${fmtInt(chavesInternet.length)} chaves fora da pesquisa manual.`"
        >
          <div class="space-y-3">
            <div class="w-full sm:w-80">
              <AdsSearchInput v-model="buscaInternet" placeholder="Buscar chave..." size="sm" />
            </div>
            <div class="max-h-[540px] overflow-auto rounded-[var(--ads-radius-sm)] border border-[var(--ads-border-subtle)]">
              <table class="w-full min-w-[32rem] border-collapse text-xs tabular-nums">
                <thead class="sticky top-0 z-10 bg-[var(--ads-surface-main)] text-[11px] uppercase text-ads-text-secondary">
                  <tr>
                    <th class="px-3 py-2 text-left">Chave</th>
                    <th class="px-3 py-2 text-right">Mínimo</th>
                    <th class="px-3 py-2 text-right">Médio</th>
                    <th class="px-3 py-2 text-right">Máximo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--ads-border-subtle)]">
                  <tr v-for="chave in chavesInternetFiltradas" :key="chave.chave">
                    <td class="px-3 py-2.5 font-semibold text-ads-text-primary">{{ chave.chave }}</td>
                    <td class="px-3 py-2.5 text-right">{{ fmtBRL(chave.precos.MIN) }}</td>
                    <td class="px-3 py-2.5 text-right">{{ fmtBRL(chave.precos.MED) }}</td>
                    <td class="px-3 py-2.5 text-right">{{ fmtBRL(chave.precos.MAX) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </AdsPanelCard>
      </template>

      <template v-else>
        <AdsSegmentedTabs v-if="dominio === 'rx'" v-model="abaExcel" :items="abasExcel" />
        <PesquisaColeta
          :dominio="dominio"
          :aba="dominio === 'gx' ? 'coleta' : abaExcel"
        />
      </template>
    </template>

    <template v-else>
      <div class="flex min-w-0 items-start gap-2">
        <AdsButton
          type="unfilled"
          color="neutral"
          icon="i-lucide-arrow-left"
          :aria-label="vista.concorrente ? 'Voltar para os concorrentes' : 'Voltar para o gerenciador'"
          @click="voltarManual"
        />
        <div class="min-w-0 space-y-1">
          <h2 class="text-xl font-bold text-ads-text-primary">
            {{ vista.concorrente ? "Coleta de preços" : "Coleta da pesquisa" }}
          </h2>
          <p class="truncate text-sm text-ads-text-secondary">{{ pesquisaManualAberta?.nome }}</p>
        </div>
      </div>
      <PesquisaColetaManual :id="vista.id" v-model:concorrente="concorrenteManual" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDominio } from "~/composables/useDominio";
import { usePesquisasManuais, chaveColeta, type PesquisaManual } from "~/composables/usePesquisasManuais";
import { usePricingPoc } from "~/composables/usePricingPoc";
import type { DepartamentoMed } from "~/types/pricing";
import { computeListaPesquisa } from "~/utils/flow-engines";
import { fmtBRL, fmtInt } from "~/utils/formatters";
import { pesquisasDoDominio, type IdPesquisa } from "~/utils/pesquisas-catalogo";

type Vista =
  | { tipo: "hub" }
  | { tipo: "gerenciador" }
  | { tipo: "criar" }
  | { tipo: "excel"; id: IdPesquisa }
  | { tipo: "manual"; id: string; concorrente: string | null };

const route = useRoute();
const toast = useToast();
const { dominio } = useDominio();
const { listaData, paramsLista, listaManualMap, gxSimData, analiseCompetitivaRx, tiposConcorrenteMap, lojas } =
  usePricingPoc();
const { pesquisas: pesquisasManuais, criar } = usePesquisasManuais();

const dominioEscolhido = computed(() => route.query.d === "rx" || route.query.d === "gx");
const tituloPesquisa = computed(() => (dominio.value === "gx" ? "Pesquisa GX" : "Pesquisa RX"));
const vista = ref<Vista>({ tipo: "hub" });
const nomePesquisa = ref("");
const abaExcel = ref<"concorrentes" | "coleta" | "matriz">("coleta");
const buscaInternet = ref("");

const pesquisas = [
  {
    title: "Pesquisa GX",
    description: "Menor preço da chave na praça, de qualquer laboratório.",
    icon: "i-lucide-layers",
    color: "new" as const,
    to: "/pesquisa?d=gx",
    badges: [{ label: "Genérico" }],
  },
  {
    title: "Pesquisa RX",
    description: "Desconto sobre o PMC que a praça pratica, por SKU.",
    icon: "i-lucide-pill",
    color: "success" as const,
    to: "/pesquisa?d=rx",
    badges: [{ label: "Marca" }, { label: "Propagado" }, { label: "Similar" }],
  },
  {
    title: "Pesquisa de Auto Serviço",
    description: "Preço de não medicamento no autosserviço, por SKU.",
    icon: "i-lucide-shopping-basket",
    color: "blocked" as const,
    disabled: true,
  },
];

const abasExcel = [
  { label: "Concorrentes", value: "concorrentes" },
  { label: "Coleta e tratamento", value: "coleta" },
  { label: "Matriz online", value: "matriz" },
];

const departamentos = computed<DepartamentoMed[]>(() =>
  dominio.value === "gx" ? ["GENERICO"] : ["MARCA", "PROPAGADO", "SIMILAR"],
);

const itensSelecionados = computed(() => {
  if (!listaData.value || !paramsLista.value) return [];
  return departamentos.value.flatMap((depto) =>
    computeListaPesquisa(
      listaData.value!.candidatos,
      depto,
      paramsLista.value![depto],
      listaManualMap.value,
    ).itens.filter((item) => item.selecionadoFinal),
  );
});

const chavesManuais = computed(() => Object.keys(gxSimData.value?.pesqManual ?? {}));

const chavesInternet = computed(() => {
  const manuais = new Set(chavesManuais.value);
  return Object.entries(gxSimData.value?.pesqInternet ?? {})
    .filter(([chave, precos]) => !manuais.has(chave) && Object.values(precos).some((valor) => valor != null))
    .map(([chave, precos]) => ({ chave, precos }));
});

const chavesInternetFiltradas = computed(() => {
  const q = buscaInternet.value.trim().toLowerCase();
  if (!q) return chavesInternet.value;
  return chavesInternet.value.filter((chave) => chave.chave.toLowerCase().includes(q));
});

function detalheExcel(id: IdPesquisa) {
  if (id === "rx-competitiva-rj") {
    return `${fmtInt(analiseCompetitivaRx.value.produtos.length)} SKUs em ${fmtInt(analiseCompetitivaRx.value.rankingConcorrentes.length)} redes`;
  }
  if (id === "gx-manual-rj") return `${fmtInt(chavesManuais.value.length)} chaves com menor, médio e maior preço`;
  return `${fmtInt(chavesInternet.value.length)} chaves com preço de referência`;
}

const pesquisasExcel = computed(() =>
  pesquisasDoDominio(dominio.value).map((item) => ({
    ...item,
    detalhe: detalheExcel(item.id),
  })),
);

const pesquisasDoDominioAtual = computed(() =>
  pesquisasManuais.value.filter((item) => item.dominio === dominio.value),
);

const pesquisaExcelAberta = computed(() =>
  vista.value.tipo === "excel" ? pesquisasExcel.value.find((item) => item.id === vista.value.id) : undefined,
);

const pesquisaManualAberta = computed(() =>
  vista.value.tipo === "manual" ? pesquisasManuais.value.find((item) => item.id === vista.value.id) : undefined,
);

const concorrenteManual = computed({
  get: () => (vista.value.tipo === "manual" ? vista.value.concorrente : null),
  set: (concorrente) => {
    if (vista.value.tipo === "manual") vista.value = { ...vista.value, concorrente };
  },
});

watch(dominio, () => {
  vista.value = { tipo: "hub" };
  abaExcel.value = "coleta";
  buscaInternet.value = "";
});

function nomePadrao() {
  const agora = new Date();
  const data = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(agora);
  const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(agora);
  return `Pesquisa manual ${data} ${hora}`;
}

function abrirCriacao() {
  nomePesquisa.value = nomePadrao();
  vista.value = { tipo: "criar" };
}

function abrirExcel(id: IdPesquisa) {
  abaExcel.value = "coleta";
  buscaInternet.value = "";
  vista.value = { tipo: "excel", id };
}

function abrirManual(id: string) {
  vista.value = { tipo: "manual", id, concorrente: null };
}

function voltarManual() {
  if (vista.value.tipo !== "manual") return;
  if (vista.value.concorrente) {
    vista.value = { ...vista.value, concorrente: null };
    return;
  }
  vista.value = { tipo: "gerenciador" };
}

function concluida(pesquisa: PesquisaManual) {
  const total = pesquisa.itens.length * pesquisa.concorrentes.length;
  if (total === 0) return false;
  return pesquisa.itens.every((item) =>
    pesquisa.concorrentes.every((rede) => pesquisa.coletas[chaveColeta(rede.nome, item.id)]),
  );
}

function resumoManual(pesquisa: PesquisaManual) {
  const total = pesquisa.itens.length * pesquisa.concorrentes.length;
  const feitos = Object.keys(pesquisa.coletas).length;
  const unidade = pesquisa.dominio === "gx" ? "chaves" : "produtos";
  return `${fmtInt(pesquisa.itens.length)} ${unidade} · ${fmtInt(pesquisa.concorrentes.length)} concorrentes · ${fmtInt(feitos)} de ${fmtInt(total)} coletas`;
}

function iniciarPesquisa() {
  const nome = nomePesquisa.value.trim();
  if (!nome || itensSelecionados.value.length === 0) return;
  const loja = lojas.value.find((item) => item.origem === "planilha" || item.origem === "mock")?.nome ?? lojas.value[0]?.nome ?? "MANEJO";
  const concorrentes = Object.entries(tiposConcorrenteMap.value).map(([nomeRede, tipo]) => ({
    nome: nomeRede,
    tipo,
  }));
  const pesquisa = criar({
    dominio: dominio.value,
    nome,
    loja,
    concorrentes,
    itens: itensSelecionados.value.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      fabricante: item.fabricante,
      categoria: item.categoria,
      departamento: item.departamento,
    })),
  });
  toast.add({
    title: "Pesquisa iniciada",
    description: `${nome} está pronta para a coleta em ${loja}.`,
    color: "success",
  });
  vista.value = { tipo: "manual", id: pesquisa.id, concorrente: null };
}
</script>
