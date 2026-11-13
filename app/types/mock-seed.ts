import type { ClusterRxCustom, LojaCluster } from "./pricing";

export interface LojaMock extends LojaCluster {
  codigo: string;
  cnpj: string;
  endereco: string;
}

export interface RedeMock {
  id: string;
  nome: string;
  tipo: "ABRAF" | "INDEP" | null;
  habilitada: boolean;
}

export interface LojaEstrategiaMock {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
}

export interface VinculoMock {
  id: string;
  lojaId: string;
  redeId: string;
  endereco: string;
  origem: "importado" | "manual";
  atualizadoHaDias: number;
}

export interface PontoMock {
  id: string;
  lojaId: string;
  nome: string;
  endereco: string;
  redeId: string | null;
  distanciaKm: number;
}

export interface LinhaImportacaoMock {
  id: string;
  lojaId: string;
  de: string;
  endereco: string;
  redeSugeridaId: string;
}

export interface PesquisaMock {
  id: string;
  dominio: "rx" | "gx";
  nome: string;
  concorrentes: string[];
}

export interface MockRede {
  fonte: "mock";
  pesquisasIniciais: { rx: string[]; gx: string[] };
  clustersCustom: ClusterRxCustom[];
  lojas: LojaMock[];
  redes: RedeMock[];
  lojasEstrategia: LojaEstrategiaMock[];
  vinculos: VinculoMock[];
  pontos: PontoMock[];
  linhasImportacao: LinhaImportacaoMock[];
  pesquisas: PesquisaMock[];
}
