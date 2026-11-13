<template>
  <div v-if="rxCockpit" class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-[var(--ads-space-sm)]">
      <div class="min-w-0 space-y-[var(--ads-space-xxs)]">
        <h1 class="text-2xl font-bold tracking-tight text-ads-text-primary">{{ titulo }}</h1>
        <p class="max-w-[62ch] text-[length:var(--ads-font-size-xxs)] leading-[var(--ads-line-height-md)] text-ads-text-secondary">
          Cada cluster guarda o canal da pesquisa, o canal da matriz, o ajuste do top e o ajuste por sensibilidade. Em cada departamento, a loja fica em um cluster só. A alteração vale na hora para a simulação.
        </p>
      </div>
      <AdsButton
        type="outline"
        color="primary"
        leading
        icon="i-lucide-arrow-left"
        :label="rotuloVoltar"
        :to="voltarPara"
      />
    </header>

    <section class="space-y-[var(--ads-space-xxs)]">
      <div class="flex flex-wrap items-center justify-between gap-[var(--ads-space-xxs)]">
        <p class="text-[length:var(--ads-font-size-xs)] text-ads-text-secondary">Clusters</p>
        <AdsButton
          type="outline"
          color="primary"
          size="sm"
          leading
          icon="i-lucide-plus"
          label="Novo cluster"
          @click="abrirNovo"
        />
      </div>
      <div class="grid grid-cols-1 items-start gap-[var(--ads-space-xxs)] md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="cluster in clusters"
        :key="cluster.id"
        class="flex max-h-[36rem] min-w-0 flex-col gap-[var(--ads-space-xxs)] rounded-[var(--ads-radius-sm)] border border-[var(--ads-border-subtle)] bg-[var(--ads-surface-card)] p-[var(--ads-space-xxs)]"
      >
        <div class="flex items-start justify-between gap-[var(--ads-space-nano)]">
          <h2 class="flex min-w-0 items-start gap-[var(--ads-space-nano)] text-[length:var(--ads-font-size-xxs)] font-semibold leading-[var(--ads-line-height-sm)] text-ads-text-primary">
            <span class="mt-[3px] size-2.5 shrink-0 rounded-full" :style="{ background: cluster.cor }" aria-hidden="true" />
            <span class="min-w-0">{{ cluster.nome }}</span>
          </h2>
          <AdsButton
            type="unfilled"
            color="neutral"
            size="sm"
            icon="i-lucide-x"
            aria-label="Remover cluster"
            :title="cluster.custom ? 'Remover este cluster' : 'Cluster padrão: não pode ser removido'"
            :disabled="!cluster.custom"
            @click="pedirRemocao(cluster.id)"
          />
        </div>

        <AdsSegmentedTabs
          :model-value="abaDe(cluster.id)"
          aria-label="Departamento"
          :items="abasDept"
          @update:model-value="definirAba(cluster.id, $event)"
        />

        <div :key="abaDe(cluster.id)" class="flex min-h-0 flex-1 flex-col gap-[var(--ads-space-xxs)]">
          <div class="grid grid-cols-2 items-end gap-[var(--ads-space-xxs)]">
            <AdsSelect
              type="radio"
              label="Canal da pesquisa"
              block
              :searchable="false"
              :options="OPCOES_CANAL_RX"
              placeholder="Canal"
              :model-value="valorCanal(cluster.id, 'pesquisa')"
              @update:model-value="(valor) => definirCanal(cluster.id, 'pesquisa', valor)"
            />
            <AdsSelect
              type="radio"
              label="Canal da matriz"
              block
              :searchable="false"
              :options="OPCOES_CANAL_RX"
              placeholder="Canal"
              :model-value="valorCanal(cluster.id, 'matriz')"
              @update:model-value="(valor) => definirCanal(cluster.id, 'matriz', valor)"
            />
          </div>
          <div class="grid grid-cols-4 items-end gap-[var(--ads-space-xxs)]">
            <AdsNumberInput
              label="Ajuste do top"
              suffix="pp"
              :min="-50"
              :step="1"
              info="Pontos percentuais sobre o desconto médio."
              :model-value="valorPontos(cluster.id, 'TOP PRODUTOS')"
              @update:model-value="(valor) => definirAjuste(cluster.id, 'TOP PRODUTOS', valor)"
            />
            <AdsNumberInput
              label="Pouco sensível"
              suffix="pp"
              :min="-50"
              :step="1"
              :model-value="valorPontos(cluster.id, 'Pouco Sensível')"
              @update:model-value="(valor) => definirAjuste(cluster.id, 'Pouco Sensível', valor)"
            />
            <AdsNumberInput
              label="Sensível"
              suffix="pp"
              :min="-50"
              :step="1"
              :model-value="valorPontos(cluster.id, 'Sensível')"
              @update:model-value="(valor) => definirAjuste(cluster.id, 'Sensível', valor)"
            />
            <AdsNumberInput
              label="Super sensível"
              suffix="pp"
              :min="-50"
              :step="1"
              :model-value="valorPontos(cluster.id, 'Super Sensível')"
              @update:model-value="(valor) => definirAjuste(cluster.id, 'Super Sensível', valor)"
            />
          </div>
          <div class="flex min-h-0 flex-1 flex-col gap-[var(--ads-space-nano)] border-t border-[var(--ads-border-subtle)] pt-[var(--ads-space-xxs)]">
            <p class="text-[length:var(--ads-font-size-xxxs)] font-semibold text-ads-text-secondary">Lojas neste departamento</p>
            <ul class="min-h-0 flex-1 space-y-[var(--ads-space-nano)] overflow-y-auto pr-[var(--ads-space-nano)]">
              <li
                v-for="loja in lojas"
                :key="loja.id"
                class="flex items-center justify-between gap-[var(--ads-space-xxs)]"
              >
                <AdsCheckbox
                  class="min-w-0"
                  :model-value="lojaNoCluster(cluster.id, loja.id)"
                  :label="loja.nome"
                  @update:model-value="(valor) => definirLoja(cluster.id, loja.id, Boolean(valor))"
                />
                <AdsPill
                  class="shrink-0"
                  size="sm"
                  :status="statusCanal(tipoDaLoja(loja.nome))"
                  :tone="tipoDaLoja(loja.nome) ? 'primary' : 'secondary'"
                  :label="rotuloCanal(tipoDaLoja(loja.nome))"
                />
              </li>
            </ul>
          </div>
        </div>
      </article>
      </div>
    </section>

    <EscolhaPesquisa
      v-model:open="modalPesquisa"
      dominio="rx"
      :description="descricaoPesquisa"
      :selecionadas="pesquisasEscolhidas.rx"
      @confirmar="confirmarPesquisas"
    />

    <AdsModal
      v-model:open="modalNovo"
      title="Novo cluster"
      description="O cluster nasce com o pacote da Baixa em Marca, Propagado e Similar. O nome fica neste cluster."
      icon="i-lucide-plus"
    >
      <AdsInput
        v-model="nomeNovo"
        label="Nome do cluster"
        placeholder="Ex.: Centro"
        @keydown.enter.prevent="confirmarNovo"
      />
      <template #footer>
        <AdsButton type="unfilled" size="sm" label="Cancelar" @click="modalNovo = false" />
        <AdsButton size="sm" label="Criar" :disabled="!nomeNovo.trim()" @click="confirmarNovo" />
      </template>
    </AdsModal>

    <AdsModal
      v-model:open="modalRemover"
      title="Remover cluster"
      :description="textoRemocao"
      icon="i-lucide-trash-2"
      confirm-label="Remover"
      cancel-label="Cancelar"
      @confirm="confirmarRemocao"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { usePricingPoc } from "~/composables/usePricingPoc";
import {
  chaveDoPerfilRx,
  ehClusterCustom,
  type DepartamentoRx,
  type NivelSensibilidade,
  type PerfilCluster,
  type TipoConcorrente,
} from "~/types/pricing";
import { CATALOGO_PESQUISAS } from "~/utils/pesquisas-catalogo";
import { lerPacoteRx, OPCOES_CANAL_RX } from "~/utils/rx-pacote";

type CampoCanal = "pesquisa" | "matriz";
type BucketAjuste = "TOP PRODUTOS" | NivelSensibilidade;

const route = useRoute();
const toast = useToast();
const {
  rxCockpit,
  lojas,
  pesqData,
  clustersRxCustom,
  pesquisasEscolhidas,
  guardarEstrategiaAnterior,
  escolherPesquisas,
  setPerfilLoja,
  criarClusterRx,
  removerClusterRx,
} = usePricingPoc();

const modo = computed(() => (route.query.modo === "iniciar" ? "iniciar" : "atualizar"));
const voltarPara = computed(() => {
  const bruto = Array.isArray(route.query.voltar) ? route.query.voltar[0] : route.query.voltar;
  if (typeof bruto === "string" && bruto.startsWith("/") && !bruto.startsWith("//")) return bruto;
  return "/estrategia/rx";
});
const rotuloVoltar = computed(() =>
  voltarPara.value.startsWith("/estrategia/clusterizacao") ? "Voltar à clusterização" : "Voltar à estratégia",
);
const titulo = computed(() => (modo.value === "iniciar" ? "Criar estratégia" : "Atualizar estratégia"));

const CLUSTERS_FIXOS: { id: PerfilCluster; nome: string; cor: string; custom: false }[] = [
  { id: "Alta", nome: "Cluster Alta", cor: "var(--ads-chart-data-3-400)", custom: false },
  { id: "Moderado", nome: "Cluster Moderado", cor: "var(--ads-chart-data-1-400)", custom: false },
  { id: "Baixa", nome: "Cluster Baixa", cor: "var(--ads-chart-data-4-500)", custom: false },
];
const CORES_CUSTOM = ["var(--ads-chart-data-2-500)", "var(--ads-chart-data-2-800)"];

const clusters = computed(() => [
  ...CLUSTERS_FIXOS,
  ...clustersRxCustom.value.map((cluster, indice) => ({
    id: cluster.id as PerfilCluster,
    nome: cluster.nome,
    cor: CORES_CUSTOM[indice % CORES_CUSTOM.length] ?? CORES_CUSTOM[0],
    custom: true as const,
  })),
]);

const abasDept = [
  { label: "Marca", value: "MARCA" },
  { label: "Propagado", value: "PROPAGADO" },
  { label: "Similar", value: "SIMILAR" },
];

const abas = ref<Record<string, DepartamentoRx>>({});

const modalPesquisa = ref(false);
const descricaoPesquisa = computed(() =>
  modo.value === "atualizar"
    ? "Escolha as pesquisas que vão definir a nova estratégia. A estratégia de agora fica guardada como anterior."
    : "A clusterização nasce da pesquisa que você confirmar. Na primeira vez, ainda não existe estratégia anterior.",
);

const pesquisasEmUso = computed(() =>
  pesquisasEscolhidas.value.rx
    .map((id) => CATALOGO_PESQUISAS.find((pesquisa) => pesquisa.id === id)?.nome ?? id)
    .join(", "),
);

const DEPTS = ["MARCA", "PROPAGADO", "SIMILAR"] as const;

function abaDe(perfil: PerfilCluster): DepartamentoRx {
  return abas.value[perfil] ?? "MARCA";
}

function definirAba(perfil: PerfilCluster, valor: string | number) {
  if (valor !== "MARCA" && valor !== "PROPAGADO" && valor !== "SIMILAR") return;
  abas.value = { ...abas.value, [perfil]: valor };
}

function pacoteDe(perfil: PerfilCluster) {
  const cockpit = rxCockpit.value;
  if (!cockpit) return null;
  return lerPacoteRx(cockpit, chaveDoPerfilRx(perfil), abaDe(perfil));
}

function valorCanal(perfil: PerfilCluster, campo: CampoCanal) {
  const pacote = pacoteDe(perfil);
  if (!pacote) return "";
  return (campo === "pesquisa" ? pacote.pesquisaValor : pacote.matrizValor) ?? "";
}

function valorPontos(perfil: PerfilCluster, bucket: BucketAjuste) {
  const pacote = pacoteDe(perfil);
  if (!pacote) return 0;
  if (bucket === "TOP PRODUTOS") return pacote.topPp;
  if (bucket === "Pouco Sensível") return pacote.poucoPp;
  if (bucket === "Sensível") return pacote.sensivelPp;
  return pacote.superPp;
}

function comoCanal(valor: string | string[]): TipoConcorrente | null {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  if (bruto === "TODOS" || bruto === "ABRAF" || bruto === "INDEP") return bruto;
  return null;
}

function comoPontos(valor: string | number): number | null {
  const bruto = typeof valor === "number" ? valor : Number(String(valor).replace(",", "."));
  if (!Number.isFinite(bruto)) return null;
  return Math.max(-50, Math.min(50, Math.round(bruto)));
}

function garantirCanal(mapa: Record<string, Record<DepartamentoRx, TipoConcorrente>>, chave: string) {
  if (mapa[chave]) return mapa[chave];
  const base = mapa.Cluster;
  if (!base) return null;
  mapa[chave] = { ...base };
  return mapa[chave];
}

function definirCanal(perfil: PerfilCluster, campo: CampoCanal, valor: string | string[]) {
  const cockpit = rxCockpit.value;
  const canal = comoCanal(valor);
  if (!cockpit || !canal) return;
  const chave = chaveDoPerfilRx(perfil);
  const mapa = campo === "pesquisa" ? cockpit.politicaPesquisa : cockpit.politicaMatriz;
  const registro = garantirCanal(mapa, chave);
  if (!registro) return;
  registro[abaDe(perfil)] = canal;
}

function definirAjuste(perfil: PerfilCluster, bucket: BucketAjuste, valor: string | number) {
  const cockpit = rxCockpit.value;
  const pontos = comoPontos(valor);
  if (!cockpit || pontos === null) return;
  const chave = chaveDoPerfilRx(perfil);
  const dept = abaDe(perfil);
  const porDept = cockpit.ajusteDesconto[dept];
  const atual = porDept[chave] ?? porDept.Cluster;
  if (!atual) return;
  if (!porDept[chave]) porDept[chave] = { ...atual };
  porDept[chave]![bucket] = pontos / 100;
}

function lojaNoCluster(perfil: PerfilCluster, lojaId: string) {
  const loja = lojas.value.find((item) => item.id === lojaId);
  return loja?.perfis[abaDe(perfil)] === perfil;
}

function definirLoja(perfil: PerfilCluster, lojaId: string, marcado: boolean) {
  const dept = abaDe(perfil);
  if (marcado) {
    setPerfilLoja(lojaId, dept, perfil);
    return;
  }
  if (perfil !== "Baixa") setPerfilLoja(lojaId, dept, "Baixa");
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

function statusCanal(tipo: "ABRAF" | "INDEP" | null) {
  return tipo === "ABRAF" ? ("new" as const) : ("default" as const);
}

function rotuloCanal(tipo: "ABRAF" | "INDEP" | null) {
  if (tipo === "ABRAF") return "Abrafarma";
  if (tipo === "INDEP") return "Independente";
  return "Sem canal";
}

const modalNovo = ref(false);
const nomeNovo = ref("");
const modalRemover = ref(false);
const clusterRemocao = ref<PerfilCluster | null>(null);

function abrirNovo() {
  nomeNovo.value = "";
  modalNovo.value = true;
}

function confirmarNovo() {
  const id = criarClusterRx(nomeNovo.value);
  if (!id) return;
  nomeNovo.value = "";
  modalNovo.value = false;
}

function lojasNoCluster(perfil: PerfilCluster) {
  return lojas.value.filter((loja) => DEPTS.some((dept) => loja.perfis[dept] === perfil));
}

const textoRemocao = computed(() => {
  const id = clusterRemocao.value;
  if (!id) return "";
  const nome = clusters.value.find((cluster) => cluster.id === id)?.nome ?? "Este cluster";
  const n = lojasNoCluster(id).length;
  if (n === 0) return `${nome} não tem loja. Os parâmetros dele deixam de valer.`;
  const lojasTxt = n === 1 ? "1 loja está" : `${n} lojas estão`;
  return `${lojasTxt} em ${nome}. Elas passam para a Baixa no departamento em que estavam. Cancele se quiser realocar antes.`;
});

function pedirRemocao(perfil: PerfilCluster) {
  if (!ehClusterCustom(perfil)) return;
  clusterRemocao.value = perfil;
  modalRemover.value = true;
}

function confirmarRemocao() {
  const id = clusterRemocao.value;
  if (id && ehClusterCustom(id)) removerClusterRx(id);
  modalRemover.value = false;
  clusterRemocao.value = null;
}

function confirmarPesquisas(ids: string[]) {
  if (modo.value === "atualizar") {
    guardarEstrategiaAnterior();
    const nomes = ids
      .map((id) => CATALOGO_PESQUISAS.find((pesquisa) => pesquisa.id === id)?.nome ?? id)
      .join(", ");
    toast.add({
      title: "Estratégia atualizada",
      description: `${nomes} passam a definir a estratégia. A foto anterior ficou disponível para comparação.`,
      color: "success",
    });
  }
  escolherPesquisas("rx", ids);
  modalPesquisa.value = false;
}
</script>
