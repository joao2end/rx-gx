<template>
  <div v-if="aguardandoPesquisa" class="space-y-6">
    <section class="space-y-[var(--ads-space-xxs)]">
      <p class="text-[length:var(--ads-font-size-xs)] text-ads-text-secondary">Estratégia ativa</p>
      <article
        class="rounded-[var(--ads-radius-md)] border border-[var(--ads-border-subtle)] bg-[var(--ads-surface-card)] px-[var(--ads-space-xs)] py-[var(--ads-space-sm)]"
      >
        <AdsEmptyState
          title="Ainda não há estratégia"
          subtitle="Escolha a pesquisa para clusterizar o RX pela primeira vez. Marca, Propagado e Similar recebem um perfil por loja a partir dela."
        >
          <AdsButton type="filled" label="Escolher pesquisa" @click="abrirPesquisa('iniciar')" />
        </AdsEmptyState>
      </article>
    </section>
  </div>

  <div v-else class="space-y-6">
    <section v-for="bloco in blocos" :key="bloco.id" class="space-y-[var(--ads-space-xxs)]">
        <div class="flex flex-wrap items-center justify-between gap-[var(--ads-space-xxs)]">
          <p class="text-[length:var(--ads-font-size-xs)] text-ads-text-secondary">{{ bloco.secao }}</p>
          <AdsButton
            v-if="bloco.id === 'atual'"
            type="filled"
            color="primary"
            leading
            icon="i-lucide-refresh-cw"
            label="Atualizar estratégia"
            @click="abrirPesquisa('atualizar')"
          />
        </div>

        <article
          class="rounded-[var(--ads-radius-md)] border border-[var(--ads-border-subtle)] bg-[var(--ads-surface-card)] p-[var(--ads-space-xs)]"
        >
          <div class="flex flex-wrap items-center gap-[var(--ads-space-nano)]">
            <AdsPill
              v-if="bloco.id === 'atual'"
              variant="broadcast"
              status="success"
              label="ATIVA"
            />
            <AdsPill
              v-else
              size="sm"
              tone="secondary"
              :status="bloco.statusKind === 'blocked' ? 'blocked' : 'default'"
              :label="bloco.status"
            />
            <p class="text-[length:var(--ads-font-size-xxs)] text-ads-text-secondary">{{ bloco.apoio }}</p>
          </div>

          <h2 class="mt-[var(--ads-space-xxs)] text-[length:var(--ads-font-size-xs)] font-bold text-ads-text-primary">
            {{ bloco.titulo }}
          </h2>

          <p
            v-if="bloco.vazio"
            class="mt-[var(--ads-space-xxs)] text-[length:var(--ads-font-size-xxs)] leading-[var(--ads-line-height-md)] text-ads-text-secondary"
          >
            Ainda não há estratégia anterior. Atualize a estratégia para guardar a foto atual e comparar depois.
          </p>

          <template v-else>
            <div class="mt-[var(--ads-space-xxs)] grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] items-start gap-[var(--ads-space-xxs)]">
              <article
                v-for="cluster in bloco.clusters"
                :key="cluster.id"
                class="flex min-w-0 flex-col gap-[var(--ads-space-xxs)] rounded-[var(--ads-radius-sm)] border border-[var(--ads-border-subtle)] bg-[var(--ads-surface-card)] p-[var(--ads-space-xxs)]"
                :aria-label="cluster.nome"
              >
                <h3 class="flex items-start gap-[var(--ads-space-nano)] text-[length:var(--ads-font-size-xxs)] font-semibold leading-[var(--ads-line-height-sm)] text-ads-text-primary">
                  <span class="mt-[3px] size-2.5 shrink-0 rounded-full" :style="{ background: cluster.cor }" aria-hidden="true" />
                  <span class="min-w-0">{{ cluster.nome }}</span>
                </h3>

                <template v-if="dominio === 'rx' && cluster.departamentos.length">
                  <AdsSegmentedTabs
                    :model-value="abaDoCluster(bloco.id, cluster.id)"
                    aria-label="Departamento"
                    :items="abasRx"
                    @update:model-value="definirAba(bloco.id, cluster.id, $event)"
                  />
                  <div
                    v-if="bloco.id === 'atual'"
                    class="space-y-[var(--ads-space-quark)] text-[length:var(--ads-font-size-xxxs)] leading-[var(--ads-line-height-sm)] text-ads-text-secondary"
                  >
                    <p
                      v-for="linha in linhasPacote(cluster, abaDoCluster(bloco.id, cluster.id))"
                      :key="linha"
                    >
                      {{ linha }}
                    </p>
                  </div>
                  <p
                    v-if="bloco.id === 'atual' && cluster.copiaDaBaixa"
                    class="text-[length:var(--ads-font-size-xxxs)] leading-[var(--ads-line-height-sm)] text-ads-text-tertiary"
                  >
                    Mesma configuração da Baixa até editar este cluster.
                  </p>
                </template>

                <div
                  class="flex min-w-0 flex-wrap gap-[var(--ads-space-nano)]"
                  :aria-label="`Lojas de ${cluster.nome}`"
                >
                  <p
                    v-if="!lojasDoCluster(cluster, bloco.id).length"
                    class="text-[length:var(--ads-font-size-xxxs)] text-ads-text-tertiary"
                  >
                    Nenhuma loja neste cluster.
                  </p>
                  <AdsPill
                    v-for="loja in lojasDoCluster(cluster, bloco.id)"
                    :key="loja.id"
                    size="sm"
                    :status="statusCanal(loja.tipo)"
                    :tone="loja.tipo ? 'primary' : 'secondary'"
                    :label="rotuloTag(loja)"
                  />
                </div>
              </article>
            </div>

            <div
              class="mt-[var(--ads-space-xs)] flex flex-wrap items-center justify-between gap-[var(--ads-space-xxs)] border-t border-[var(--ads-border-subtle)] pt-[var(--ads-space-xxs)]"
            >
              <p class="max-w-[78ch] text-[length:var(--ads-font-size-xxs)] leading-[var(--ads-line-height-md)] text-ads-text-primary">
                <strong class="font-bold">{{ bloco.narrativa.titulo }}</strong>
                {{ bloco.narrativa.corpo }}
              </p>
              <AdsButton
                type="outline"
                color="primary"
                size="sm"
                trailing
                icon="i-lucide-arrow-right"
                :label="detalhes === bloco.id && filtroCluster === null ? 'Ocultar detalhes' : 'Ver detalhes'"
                @click="alternarDetalhes(bloco.id)"
              />
            </div>
          </template>
        </article>

        <AdsPanelCard
          v-if="detalhes === bloco.id"
          class="min-w-0"
          :title="tituloDetalhes"
          :subtitle="bloco.id === 'atual' ? 'Leitura dos perfis da estratégia atual.' : 'Foto guardada. A simulação continua na estratégia atual.'"
        >
          <AdsTable
            :data="linhas"
            :columns="colunasLoja"
            density="md"
            sticky="header"
            :framed="false"
            :ui="{ th: '!px-[var(--ads-space-nano)]', td: '!px-[var(--ads-space-nano)]' }"
          >
            <template #nome-cell="{ row }">
              <span class="font-semibold text-ads-text-primary">{{ row.original.nome }}</span>
            </template>
            <template #origem-cell="{ row }">
              <AdsPill
                size="sm"
                :status="row.original.origem === 'demonstrativo' ? 'default' : 'success'"
                :label="row.original.origem === 'planilha' ? 'Planilha' : row.original.origem === 'mock' ? 'Base falsa' : 'Demonstrativa'"
              />
            </template>
            <template #perfil-cell="{ row }">
              <AdsPill
                v-if="row.original.perfil"
                size="sm"
                :status="statusPerfil(row.original.perfil)"
                :label="nomeCluster(row.original.perfil)"
              />
              <span v-else class="text-ads-text-tertiary">Sem cluster</span>
            </template>
            <template #marca-cell="{ row }">
              <AdsPill
                v-if="row.original.marca"
                size="sm"
                :status="statusPerfil(row.original.marca)"
                :label="nomeCluster(row.original.marca)"
              />
              <span v-else class="text-ads-text-tertiary">Sem cluster</span>
            </template>
            <template #propagado-cell="{ row }">
              <AdsPill
                v-if="row.original.propagado"
                size="sm"
                :status="statusPerfil(row.original.propagado)"
                :label="nomeCluster(row.original.propagado)"
              />
              <span v-else class="text-ads-text-tertiary">Sem cluster</span>
            </template>
            <template #similar-cell="{ row }">
              <AdsPill
                v-if="row.original.similar"
                size="sm"
                :status="statusPerfil(row.original.similar)"
                :label="nomeCluster(row.original.similar)"
              />
              <span v-else class="text-ads-text-tertiary">Sem cluster</span>
            </template>
            <template #anterior-cell="{ row }">
              <span v-if="dominio === 'rx'" class="text-[length:var(--ads-font-size-xxxs)] text-ads-text-secondary">
                {{ textoAnteriorRx(row.original) }}
              </span>
              <AdsPill
                v-else-if="row.original.anterior"
                size="sm"
                :status="statusPerfil(row.original.anterior)"
                :label="nomeCluster(row.original.anterior)"
              />
              <span v-else class="text-ads-text-tertiary">—</span>
            </template>
          </AdsTable>
          <p class="mt-[var(--ads-space-xxs)] text-[length:var(--ads-font-size-xxxs)] text-ads-text-secondary">
            MANEJO vem da planilha; lojas 02 a 11 são demonstrativas.
          </p>
        </AdsPanelCard>
      </section>
  </div>

  <EscolhaPesquisa
    v-model:open="modalPesquisa"
    :dominio="dominio"
    :description="descricaoPesquisa"
    :selecionadas="pesquisasEscolhidas[dominio]"
    @confirmar="confirmarPesquisas"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { usePricingPoc } from "~/composables/usePricingPoc";
import { chaveDoPerfilRx, type DepartamentoRx, type LojaCluster, type PerfilCluster } from "~/types/pricing";
import { CATALOGO_PESQUISAS } from "~/utils/pesquisas-catalogo";
import { lerPacoteRx } from "~/utils/rx-pacote";
import type { Dominio } from "~/utils/jornada";

type MomentoEstrategia = "atual" | "anterior";
type IdClusterResumo = PerfilCluster | "sem";

type LinhaLoja = {
  id: string;
  nome: string;
  origem: LojaCluster["origem"];
  perfil: PerfilCluster | null;
  anterior: PerfilCluster | null;
  marca: PerfilCluster | null;
  propagado: PerfilCluster | null;
  similar: PerfilCluster | null;
  anteriorMarca: PerfilCluster | null;
  anteriorPropagado: PerfilCluster | null;
  anteriorSimilar: PerfilCluster | null;
};

type LojaResumo = {
  id: string;
  nome: string;
  origem: LojaCluster["origem"];
  tipo: "ABRAF" | "INDEP" | null;
};

const CLUSTERS_RX: { id: IdClusterResumo; nome: string; cor: string }[] = [
  { id: "Alta", nome: "Cluster Alta", cor: "var(--ads-chart-data-3-400)" },
  { id: "Moderado", nome: "Cluster Moderado", cor: "var(--ads-chart-data-1-400)" },
  { id: "Baixa", nome: "Cluster Baixa", cor: "var(--ads-chart-data-4-500)" },
];

const CLUSTERS_REDE: { id: IdClusterResumo; nome: string; cor: string }[] = [
  { id: "Alta", nome: "Cluster Agressivo", cor: "var(--ads-chart-data-3-400)" },
  { id: "Moderado", nome: "Cluster Moderado", cor: "var(--ads-chart-data-1-400)" },
  { id: "Baixa", nome: "Cluster Conservador", cor: "var(--ads-chart-data-4-500)" },
  { id: "sem", nome: "Sem Cluster", cor: "var(--ads-text-primary)" },
];

const props = defineProps<{ dominio: Dominio }>();

const route = useRoute();
const toast = useToast();
const {
  lojas,
  pesqData,
  rxCockpit,
  clustersRxCustom,
  estrategiaAnterior,
  pesquisasEscolhidas,
  guardarEstrategiaAnterior,
  escolherPesquisas,
} = usePricingPoc();

const abaPorCluster = ref<Record<string, DepartamentoRx>>({});
const detalhes = ref<MomentoEstrategia | null>(null);
const filtroCluster = ref<IdClusterResumo | null>(null);
const modalPesquisa = ref(false);
const modoPesquisa = ref<"iniciar" | "atualizar">("iniciar");
const descricaoPesquisa = computed(() =>
  modoPesquisa.value === "atualizar"
    ? "Escolha as pesquisas que vão definir a nova estratégia. A estratégia de agora fica guardada como anterior."
    : "A clusterização nasce da pesquisa que você confirmar. Na primeira vez, ainda não existe estratégia anterior.",
);
const aguardandoPesquisa = computed(
  () => props.dominio === "rx" && pesquisasEscolhidas.value.rx.length === 0,
);
const pesquisasEmUso = computed(() =>
  pesquisasEscolhidas.value[props.dominio]
    .map((id) => CATALOGO_PESQUISAS.find((p) => p.id === id)?.nome ?? id)
    .join(", "),
);

const abasRx = [
  { label: "Marca", value: "MARCA" },
  { label: "Propagado", value: "PROPAGADO" },
  { label: "Similar", value: "SIMILAR" },
];

const CORES_CUSTOM = ["var(--ads-chart-data-2-500)", "var(--ads-chart-data-2-800)"];

const clustersDoDominio = computed(() => {
  if (props.dominio !== "rx") return CLUSTERS_REDE;
  return [
    ...CLUSTERS_RX,
    ...clustersRxCustom.value.map((cluster, indice) => ({
      id: cluster.id,
      nome: cluster.nome,
      cor: CORES_CUSTOM[indice % CORES_CUSTOM.length] ?? CORES_CUSTOM[0],
    })),
  ];
});
const opcoesPerfil = computed(() =>
  clustersDoDominio.value
    .filter((cluster): cluster is { id: PerfilCluster; nome: string; cor: string } => cluster.id !== "sem")
    .map((cluster) => ({ value: cluster.id, label: cluster.nome })),
);
const DEPTS_RX = ["MARCA", "PROPAGADO", "SIMILAR"] as const;

const colunasLoja = computed<TableColumn<LinhaLoja>[]>(() => {
  const estreita = { class: { th: "w-px whitespace-nowrap", td: "w-px whitespace-nowrap" } };
  const cols: TableColumn<LinhaLoja>[] = [
    {
      id: "nome",
      accessorKey: "nome",
      header: "Loja",
      meta: { class: { th: "w-full", td: "w-full" } },
    },
    { id: "origem", header: "Origem", meta: estreita },
  ];
  if (props.dominio === "rx") {
    cols.push(
      { id: "marca", header: "Marca", meta: estreita },
      { id: "propagado", header: "Propagado", meta: estreita },
      { id: "similar", header: "Similar", meta: estreita },
    );
  } else {
    cols.push({ id: "perfil", header: "Perfil", meta: estreita });
  }
  if (detalhes.value === "atual" && estrategiaAnterior.value) {
    cols.push({ id: "anterior", header: "Anterior", meta: estreita });
  }
  return cols;
});

type LinhaConfig = {
  id: DepartamentoRx;
  pesquisa: string;
  matriz: string;
  top: string;
  sensibilidade: string;
};

function resumoDepartamentos(perfil: PerfilCluster): LinhaConfig[] {
  const cockpit = rxCockpit.value;
  if (!cockpit || props.dominio !== "rx") return [];
  const chave = chaveDoPerfilRx(perfil);
  return DEPTS_RX.map((dept) => {
    const pacote = lerPacoteRx(cockpit, chave, dept);
    return {
      id: dept,
      pesquisa: pacote.pesquisa,
      matriz: pacote.matriz,
      top: pacote.top,
      sensibilidade: pacote.sensibilidade,
    };
  });
}

function configsIguais(a: LinhaConfig[], b: LinhaConfig[]) {
  return a.length > 0 && a.every((linha) => {
    const outra = b.find((item) => item.id === linha.id);
    return Boolean(
      outra
      && linha.pesquisa === outra.pesquisa
      && linha.matriz === outra.matriz
      && linha.top === outra.top
      && linha.sensibilidade === outra.sensibilidade,
    );
  });
}

function vazioPorCluster(): Record<string, LojaResumo[]> {
  const balde: Record<string, LojaResumo[]> = { Alta: [], Moderado: [], Baixa: [], sem: [] };
  for (const cluster of clustersRxCustom.value) balde[cluster.id] = [];
  return balde;
}

function colocar(mapa: Record<string, LojaResumo[]>, chave: string, item: LojaResumo) {
  (mapa[chave] ?? mapa.sem)?.push(item);
}

function perfilDaLoja(loja: LojaCluster, momento: MomentoEstrategia, eixo: DepartamentoRx | "GENERICO"): PerfilCluster | null {
  if (momento === "anterior") return estrategiaAnterior.value?.[loja.id]?.[eixo] ?? null;
  return loja.perfis[eixo];
}

function distribuicao(momento: MomentoEstrategia, comConfiguracao: boolean) {
  const porDept: Record<DepartamentoRx, Record<string, LojaResumo[]>> = {
    MARCA: vazioPorCluster(),
    PROPAGADO: vazioPorCluster(),
    SIMILAR: vazioPorCluster(),
  };
  const porCluster = vazioPorCluster();
  const total = lojas.value.length;
  const rx = props.dominio === "rx";
  if (momento === "atual" || estrategiaAnterior.value) {
    for (const loja of lojas.value) {
      const item: LojaResumo = {
        id: loja.id,
        nome: loja.nome,
        origem: loja.origem,
        tipo: tipoDaLoja(loja.nome),
      };
      if (rx) {
        for (const dept of DEPTS_RX) {
          colocar(porDept[dept], perfilDaLoja(loja, momento, dept) ?? "sem", item);
        }
      } else {
        colocar(porCluster, perfilDaLoja(loja, momento, "GENERICO") ?? "sem", item);
      }
    }
  }
  const baixa = comConfiguracao ? resumoDepartamentos("Baixa") : [];
  return clustersDoDominio.value.map((cluster) => {
    const departamentos = comConfiguracao && cluster.id !== "sem" ? resumoDepartamentos(cluster.id) : [];
    const lojasPorDepartamento: Partial<Record<DepartamentoRx, LojaResumo[]>> = rx
      ? {
          MARCA: porDept.MARCA[cluster.id],
          PROPAGADO: porDept.PROPAGADO[cluster.id],
          SIMILAR: porDept.SIMILAR[cluster.id],
        }
      : {};
    const lojas = rx ? (lojasPorDepartamento.MARCA ?? []) : porCluster[cluster.id];
    return {
      ...cluster,
      n: lojas.length,
      pct: total ? Math.round((lojas.length / total) * 100) : 0,
      departamentos,
      lojas,
      lojasPorDepartamento,
      copiaDaBaixa: cluster.id !== "Baixa" && cluster.id !== "Alta" && cluster.id !== "sem" && configsIguais(departamentos, baixa),
    };
  });
}

function departamentosIguais(clusters: ReturnType<typeof distribuicao>) {
  return clusters.every((cluster) => {
    const marca = cluster.lojasPorDepartamento.MARCA?.length ?? 0;
    const propagado = cluster.lojasPorDepartamento.PROPAGADO?.length ?? 0;
    const similar = cluster.lojasPorDepartamento.SIMILAR?.length ?? 0;
    return marca === propagado && propagado === similar;
  });
}

function narrativaDe(clusters: ReturnType<typeof distribuicao>) {
  if (props.dominio === "rx" && !departamentosIguais(clusters)) {
    return {
      titulo: "Perfis por departamento:",
      corpo: "Marca, Propagado e Similar não têm a mesma distribuição. A configuração e as lojas estão em cada cluster.",
    };
  }
  const presentes = clusters.filter((cluster) => cluster.id !== "sem" && cluster.n > 0).sort((a, b) => b.n - a.n);
  const [primeiro, segundo] = presentes;
  const noRx = props.dominio === "rx";
  if (!primeiro) {
    return { titulo: "Sem perfil definido:", corpo: "nenhuma loja está em um cluster na rede." };
  }
  if (!segundo || primeiro.pct >= 80) {
    const lojasTxt = primeiro.n === 1 ? "loja está" : "lojas estão";
    return {
      titulo: noRx ? "Cluster composto:" : "Rede concentrada:",
      corpo: `na rede, ${primeiro.n} ${lojasTxt} no ${primeiro.nome} (${primeiro.pct}%).`,
    };
  }
  return {
    titulo: noRx ? "Cluster composto:" : "Pressão competitiva equilibrada:",
    corpo: `na rede, as lojas se dividem entre ${primeiro.nome} (${primeiro.pct}%) e ${segundo.nome} (${segundo.pct}%).`,
  };
}

const blocos = computed(() => {
  const atual = distribuicao("atual", true);
  const anterior = distribuicao("anterior", false);
  const temAnterior = Boolean(estrategiaAnterior.value);
  return [
    {
      id: "atual" as const,
      secao: "Estratégia ativa",
      titulo: "Estratégia atual",
      status: "ATIVA",
      statusKind: "success" as const,
      apoio:
        props.dominio === "rx" && !temAnterior
          ? "Primeira clusterização, a partir da pesquisa escolhida"
          : "Em uso na simulação",
      vazio: false,
      clusters: atual,
      narrativa: narrativaDe(atual),
    },
    {
      id: "anterior" as const,
      secao: "Estratégia anterior",
      titulo: "Estratégia anterior",
      status: temAnterior ? "ANTERIOR" : "SEM FOTO",
      statusKind: temAnterior ? ("default" as const) : ("blocked" as const),
      apoio: temAnterior ? "Foto guardada para comparar com a atual" : "Ainda não há estratégia anterior",
      vazio: !temAnterior,
      clusters: anterior,
      narrativa: narrativaDe(anterior),
    },
  ];
});

const linhas = computed<LinhaLoja[]>(() => {
  const momento = detalhes.value ?? "atual";
  return lojas.value
    .map((loja) => {
      const anterior = estrategiaAnterior.value?.[loja.id];
      const perfil = props.dominio === "rx" ? perfilDaLoja(loja, momento, "MARCA") : perfilDaLoja(loja, momento, "GENERICO");
      return {
        id: loja.id,
        nome: loja.nome,
        origem: loja.origem,
        perfil,
        anterior: props.dominio === "rx" ? (anterior?.MARCA ?? null) : (anterior?.GENERICO ?? null),
        marca: perfilDaLoja(loja, momento, "MARCA"),
        propagado: perfilDaLoja(loja, momento, "PROPAGADO"),
        similar: perfilDaLoja(loja, momento, "SIMILAR"),
        anteriorMarca: anterior?.MARCA ?? null,
        anteriorPropagado: anterior?.PROPAGADO ?? null,
        anteriorSimilar: anterior?.SIMILAR ?? null,
      };
    })
    .filter((linha) => {
      if (!filtroCluster.value) return true;
      if (filtroCluster.value === "sem") return !linha.perfil;
      return linha.perfil === filtroCluster.value;
    });
});

const tituloDetalhes = computed(() => {
  if (!filtroCluster.value) return "Perfis por loja";
  return clustersDoDominio.value.find((cluster) => cluster.id === filtroCluster.value)?.nome ?? "Perfis por loja";
});

function nomeCluster(perfil: PerfilCluster) {
  return opcoesPerfil.value.find((opcao) => opcao.value === perfil)?.label ?? perfil;
}

function textoAnteriorRx(linha: LinhaLoja) {
  const partes = [
    linha.anteriorMarca ? `Marca ${nomeCluster(linha.anteriorMarca)}` : null,
    linha.anteriorPropagado ? `Propagado ${nomeCluster(linha.anteriorPropagado)}` : null,
    linha.anteriorSimilar ? `Similar ${nomeCluster(linha.anteriorSimilar)}` : null,
  ].filter(Boolean);
  return partes.length ? partes.join(" · ") : "—";
}

function chaveAba(momento: MomentoEstrategia, id: IdClusterResumo) {
  return `${momento}-${id}`;
}

function abaDoCluster(momento: MomentoEstrategia, id: IdClusterResumo): DepartamentoRx {
  return abaPorCluster.value[chaveAba(momento, id)] ?? "MARCA";
}

function definirAba(momento: MomentoEstrategia, id: IdClusterResumo, valor: string | number) {
  if (valor !== "MARCA" && valor !== "PROPAGADO" && valor !== "SIMILAR") return;
  abaPorCluster.value = { ...abaPorCluster.value, [chaveAba(momento, id)]: valor };
}

function linhasPacote(cluster: { departamentos: LinhaConfig[] }, dept: DepartamentoRx) {
  const linha = cluster.departamentos.find((item) => item.id === dept);
  if (!linha) return [];
  return [linha.pesquisa, linha.matriz, linha.top, linha.sensibilidade];
}

function lojasDoCluster(
  cluster: { id: IdClusterResumo; lojas: LojaResumo[]; lojasPorDepartamento: Partial<Record<DepartamentoRx, LojaResumo[]>> },
  momento: MomentoEstrategia,
) {
  if (props.dominio !== "rx") return cluster.lojas;
  return cluster.lojasPorDepartamento[abaDoCluster(momento, cluster.id)] ?? [];
}

function statusCanal(tipo: LojaResumo["tipo"]) {
  if (tipo === "ABRAF") return "new" as const;
  return "default" as const;
}

function rotuloTag(loja: LojaResumo) {
  if (loja.tipo === "ABRAF") return `${loja.nome} · Abrafarma`;
  if (loja.tipo === "INDEP") return `${loja.nome} · Independente`;
  return `${loja.nome} · Sem canal`;
}

function tipoDaLoja(nome: string): "ABRAF" | "INDEP" | null {
  const contagem = { ABRAF: 0, INDEP: 0 };
  for (const coleta of pesqData.value?.coletasRx ?? []) {
    if (coleta.loja !== nome || !coleta.flagValido) continue;
    if (coleta.tipoConc === "ABRAF" || coleta.tipoConc === "INDEP") contagem[coleta.tipoConc] += 1;
  }
  if (contagem.ABRAF === 0 && contagem.INDEP === 0) return null;
  return contagem.INDEP > contagem.ABRAF ? "INDEP" : "ABRAF";
}

function alternarDetalhes(momento: MomentoEstrategia) {
  if (detalhes.value === momento && filtroCluster.value === null) {
    detalhes.value = null;
    return;
  }
  detalhes.value = momento;
  filtroCluster.value = null;
}

function statusPerfil(p: PerfilCluster) {
  if (p === "Alta") return "warning" as const;
  if (p === "Moderado") return "attention" as const;
  if (p === "Baixa") return "default" as const;
  return "new" as const;
}

function abrirPesquisa(modo: "iniciar" | "atualizar") {
  modoPesquisa.value = modo;
  modalPesquisa.value = true;
}

function confirmarPesquisas(ids: string[]) {
  if (!ids.length) return;
  const nomes = ids
    .map((id) => CATALOGO_PESQUISAS.find((p) => p.id === id)?.nome ?? id)
    .join(", ");
  if (modoPesquisa.value === "atualizar") {
    guardarEstrategiaAnterior();
    toast.add({
      title: "Estratégia atualizada",
      description: `${nomes} passam a definir a estratégia. A foto anterior ficou disponível para comparação.`,
      color: "success",
    });
  }
  escolherPesquisas(props.dominio, ids);
  modalPesquisa.value = false;
  if (props.dominio === "rx") {
    navigateTo({
      path: "/estrategia/rx/configurar",
      query: { modo: modoPesquisa.value, voltar: route.fullPath },
    });
  }
}
</script>
