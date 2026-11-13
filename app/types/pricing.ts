export type DepartamentoMed = "MARCA" | "PROPAGADO" | "SIMILAR" | "GENERICO";
export type DepartamentoRx = "MARCA" | "PROPAGADO" | "SIMILAR";
export type Cronicidade = "EVENTUAL" | "FREQUENTE" | "CRONICO";
export type FaixaPreco = "FAIXA 1" | "FAIXA 2" | "FAIXA 3" | "FAIXA 4" | "FAIXA 5";
export type NivelSensibilidade = "Pouco Sensível" | "Sensível" | "Super Sensível";
export type TipoConcorrente = "TODOS" | "ABRAF" | "INDEP";
export type BalizadorPreco = "MIN" | "MED" | "MAX";

export type PerfilFixo = "Alta" | "Moderado" | "Baixa";
export type IdClusterRxCustom = `rxc_${string}`;
export type PerfilCluster = PerfilFixo | IdClusterRxCustom;
export type EixoCluster = "AUTOSSERVICO" | "MARCA" | "PROPAGADO" | "SIMILAR" | "GENERICO";
export type ChaveClusterRx = "Cluster Alta" | "Cluster" | "Cluster Moderado";

export interface ClusterRxCustom {
  id: IdClusterRxCustom;
  nome: string;
}

export const PERFIL_PARA_CHAVE_RX: Record<PerfilFixo, ChaveClusterRx> = {
  Alta: "Cluster Alta",
  Moderado: "Cluster Moderado",
  Baixa: "Cluster",
};

export function chaveDoPerfilRx(perfil: PerfilCluster): string {
  if (perfil === "Alta" || perfil === "Moderado" || perfil === "Baixa") return PERFIL_PARA_CHAVE_RX[perfil];
  return perfil;
}

export function ehClusterCustom(perfil: PerfilCluster): perfil is IdClusterRxCustom {
  return perfil.startsWith("rxc_");
}

export interface LojaCluster {
  id: string;
  nome: string;
  origem: "planilha" | "demonstrativo" | "mock";
  perfis: Record<EixoCluster, PerfilCluster>;
}

export interface ConcorrenteUsuario {
  id: string;
  nome: string;
  tipo: "ABRAF" | "INDEP" | null;
}

export type TipoPrecificacaoRx = "PESQUISA" | "MATRIZ" | "DESC MÍNIMO" | "";
export type TipoPrecificacaoGx = "PESQ MANUAL" | "PESQ INTERNET" | "MARGEM OBJETIVO" | "";

export interface ClasseCronicidade {
  categoria: string;
  cronicidade: Cronicidade;
}

export interface QuintilFaixa {
  quintil: number;
  faixa: FaixaPreco;
  inicio: number;
  fim: number;
  qtd: number;
  departamento: string;
}

export type Matriz5x3<T> = Record<FaixaPreco, Record<Cronicidade, T>>;

export interface SensibilidadeDataset {
  totalSkus: number;
  classesCronicidade: ClasseCronicidade[];
  faixasQuintis: QuintilFaixa[];
  matrizSensibilidade: Matriz5x3<NivelSensibilidade>;
  distribuicao: Array<{
    departamento: string;
    faixa: string;
    cronicidade: string;
    sensibilidade: string;
    skus: number;
    receita12m: number;
  }>;
}

export interface GxSelecaoItem {
  produtoId: string;
  produto: string;
  chave: string;
  fabricante: string;
  fabricantePlug: string;
  pmc: number;
  precoAtual: number;
  custoAtual: number;
  estoqueAtual: number;
  coberturaLojas: number;
  receita3m: number;
  custo3m: number;
  qtd3m: number;
  receita12m: number;
  qtd12m: number;
  scoreQtd: number;
  scoreCusto: number;
  scoreFinal: number;
  indexChave: number;
  sugestao: string;
  overrideP: number | null;
  pFim: number | null;
}

export interface GxSelecaoDataset {
  pesosDefault: { cobertura: number; quantidade: number; custo: number };
  maxPDefault: number;
  itens: GxSelecaoItem[];
}

export interface ParametrosListaDepto {
  pesoReceita: number;
  pesoQuantidade: number;
  qtdMeta: number;
  pbm: boolean;
  farmaciaPopular: boolean;
  marcaPropria: boolean;
  precoTabelado: boolean;
  precoMaximo: number;
}

export interface CandidatoLista {
  id: string;
  descricao: string;
  departamento: DepartamentoMed;
  categoria: string;
  faixa: string;
  cronicidade: string;
  sensibilidade: string;
  fabricante: string;
  receita: number;
  quantidade: number;
  pmc: number;
  pbm: boolean;
  marcaPropria: boolean;
  farmaciaPopular: boolean;
  precoTabelado: boolean;
  origemExcel: string;
  selecaoManual: number | null;
  selecaoFinalExcel: boolean;
  selecaoAutoExcel: boolean;
}

export interface ListaPesquisaDataset {
  parametrosDefault: Record<DepartamentoMed, ParametrosListaDepto>;
  candidatos: CandidatoLista[];
}

export interface ConcorrenteInfo {
  id: string;
  nome: string;
  tipo: "ABRAF" | "INDEP";
  uf: string;
  lojasMapeadas: number;
  distanciaMediaKm: number;
}

export interface ColetaRxRow {
  produtoId: string;
  ean: string;
  produto: string;
  fabricante: string;
  departamento: string;
  categoria: string;
  faixa: string;
  cronicidade: string;
  sensibilidade: string;
  receita: number;
  quantidade: number;
  pmc: number;
  precoRedeMed: number;
  loja: string;
  concorrente: string;
  tipoConc: "ABRAF" | "INDEP";
  precoConc: number;
  descConc: number;
  descRedeMed: number;
  flagValido: boolean;
}

export interface PesquisaCompetitivaDataset {
  concorrentes: ConcorrenteInfo[];
  coletasRx: ColetaRxRow[];
  gxPesqManual: Record<string, Record<BalizadorPreco, Record<TipoConcorrente, number | null>>>;
  gxPesqInternetCount: number;
}

export interface RxCockpitParams {
  politicaPesquisa: Record<string, Record<DepartamentoRx, TipoConcorrente>>;
  politicaMatriz: Record<string, Record<DepartamentoRx, TipoConcorrente>>;
  ajusteDesconto: Record<
    DepartamentoRx,
    Record<string, Record<"TOP PRODUTOS" | NivelSensibilidade, number>>
  >;
  descontoMinimo: Record<NivelSensibilidade, Record<DepartamentoRx, number>>;
  margemCritica: Record<"TOP PRODUTOS" | NivelSensibilidade, Record<DepartamentoRx, number>>;
  farolVariacao: Record<"PESQUISA" | "MATRIZ" | "DESC MÍNIMO", { limiar: number; indiferenca: number }>;
  fatorPmc: number;
  /** Alíquota extra sobre a margem bruta já exibida. Zero até a regra tributária ser configurada. */
  aliquotaImpostos?: number;
  /** Piso da margem líquida. Zero não dispara alerta enquanto a líquida não ficar negativa. */
  margemMinimaLiquida?: number;
}

export interface RxSkuInput {
  cluster: string;
  produtoId: string;
  descricao: string;
  divisao: string;
  departamento: DepartamentoRx;
  categoria: string;
  faixa: string;
  cronicidade: string;
  laboratorio: string;
  qtd1m: number;
  receita1m: number;
  custo1m: number;
  tributos: number;
  precoTabelado: number | null;
  marcaPropria: boolean;
  pbm: boolean;
  farmaciaPopular: boolean;
  sensibilidade: string;
  custo: number;
  custoComComissao: number;
  pmc: number;
  precoAtual: number;
  tipoPrecificacao: TipoPrecificacaoRx;
  descTodosExcel: number | null;
  descAbrafExcel: number | null;
  descIndepExcel: number | null;
  ajusteManual: number | null;
  seguir: boolean;
  precoFinalExcel: number | null;
}

export interface RxCalculatedSku extends RxSkuInput {
  politicaAplicada: TipoConcorrente | "";
  descontoReferencia: number;
  ajusteDescontoPct: number;
  descontoEfetivo: number;
  precoPartida: number;
  farolVariacao: string;
  precoAposVariacao: number;
  margemPartida: number;
  margemCriticaAlvo: number;
  alertaMargem: "OK" | "Alerta MRG Crítica" | "Alerta MRG Negativa" | "";
  precoAposMargem: number;
  precoSimuladoSistema: number;
  motivoRegra: string;
  precoFinal: number;
  margemAtual: number;
  margemFinal: number;
  aliquotaImpostos: number;
  margemLiquida: number;
  alertaMargemLiquida: boolean;
  descontoAtual: number;
  descontoSimulado: number;
  variacaoPct: number;
  alteracaoStatus: "Manter o preço" | "Redução de preço" | "Aumento de preço";
  receitaAtualCalc: number;
  receitaSimuladaCalc: number;
  lucroAtualCalc: number;
  lucroSimuladoCalc: number;
}

export interface RxSimuladorDataset {
  cockpitDefault: RxCockpitParams;
  matrizDesconto: Array<{
    departamento: DepartamentoRx;
    conc: TipoConcorrente;
    faixa: FaixaPreco;
    cronicidade: Cronicidade;
    desconto: number | null;
  }>;
  topPesquisa: Record<
    string,
    { produto: string; TODOS: number | null; INDEP: number | null; ABRAF: number | null }
  >;
  skus: RxSkuInput[];
}

export interface GxCockpitParams {
  farolVariacao: Record<"PESQ MANUAL" | "PESQ INTERNET" | "MARGEM OBJETIVO", { limiar: number; indiferenca: number }>;
  aumentoMinimo: number;
  aumentoMaximoP1: number;
  regrasPesquisa: Record<
    "PBM" | "Farmácia Popular" | "Marca Própria" | "Preço Tabelado",
    Record<"PESQ MANUAL" | "PESQ INTERNET" | "MARGEM OBJETIVO", boolean>
  >;
  fatorPmc: number;
  icManual: {
    concorrencia: Matriz5x3<TipoConcorrente>;
    balizador: Matriz5x3<BalizadorPreco>;
    politicaIc: Matriz5x3<number>;
  };
  icInternet: {
    balizador: Matriz5x3<BalizadorPreco>;
    politicaIc: Matriz5x3<number>;
  };
  margemObjetivo: Matriz5x3<number>;
  margemSemPmc: Record<Cronicidade, number>;
  margemCritica: Record<"PESQ MANUAL" | "PESQ INTERNET" | "MARGEM OBJETIVO", Matriz5x3<number>>;
  aliquotaImpostos?: number;
  margemMinimaLiquida?: number;
}

export interface GxP1Input {
  uf: string;
  cluster: string;
  chave: string;
  produtoId: string;
  descricao: string;
  categoria: string;
  faixa: string;
  cronicidade: string;
  laboratorio: string;
  qtd1m: number;
  receita1m: number;
  custo1m: number;
  tributos: number;
  precoTabelado: number | null;
  marcaPropria: boolean;
  pbm: boolean;
  farmaciaPopular: boolean;
  sensibilidade: string;
  custo: number;
  custoComComissao: number;
  pmc: number;
  precoAtual: number;
  tipoPrecificacao: TipoPrecificacaoGx;
  ajusteManualP1: number | null;
  precoFimP1Excel: number | null;
}

export interface GxSkuInput {
  uf: string;
  cluster: string;
  chave: string;
  produtoId: string;
  descricao: string;
  categoria: string;
  faixa: string;
  cronicidade: string;
  laboratorio: string;
  qtd1m: number;
  receita1m: number;
  custo1m: number;
  tributos: number;
  precoTabelado: number | null;
  marcaPropria: boolean;
  farmaciaPopular: boolean;
  pbm: boolean;
  sensibilidade: string;
  custo: number;
  custoComComissao: number;
  pmc: number;
  precoAtual: number;
  ordemPreco: string;
  tipoPrecificacao: TipoPrecificacaoGx;
  precoP1ManualLinha: number | null;
  seguirPrecoP1: boolean;
  ajusteManual: number | null;
  seguir: boolean;
  precoFinalExcel: number | null;
}

export interface GxCalculatedSku extends GxSkuInput {
  precoP1Chave: number;
  pmcPonderadoChave: number | null;
  degrauAplicadoPct: number | null;
  precoRefConcorrente: number | null;
  icAlvoAplicado: number | null;
  precoPartida: number;
  farolVariacao: string;
  precoAposVariacao: number;
  margemPartida: number;
  margemCriticaAlvo: number;
  alertaMargem: "OK" | "Alerta MRG Crítica" | "Alerta MRG Negativa" | "";
  precoAposMargem: number;
  precoSimuladoSistema: number;
  motivoRegra: string;
  precoFinal: number;
  margemAtual: number;
  margemFinal: number;
  aliquotaImpostos: number;
  margemLiquida: number;
  alertaMargemLiquida: boolean;
  descontoAtual: number;
  descontoSimulado: number;
  icAtual: number | null;
  icSimulado: number | null;
  variacaoPct: number;
  alteracaoStatus: "Manter o preço" | "Redução de preço" | "Aumento de preço";
  receitaAtualCalc: number;
  receitaSimuladaCalc: number;
  lucroAtualCalc: number;
  lucroSimuladoCalc: number;
}

export interface GxSimuladorDataset {
  cockpitDefault: GxCockpitParams;
  pesqManual: Record<string, Record<BalizadorPreco, Record<TipoConcorrente, number | null>>>;
  pesqInternet: Record<string, Record<BalizadorPreco, number | null>>;
  chaveP1Manual: Record<string, number>;
  p1Rows: GxP1Input[];
  skus: GxSkuInput[];
}
