import type { DepartamentoRx, RxCockpitParams, TipoConcorrente } from "~/types/pricing";

export const ROTULO_CANAL_RX: Record<TipoConcorrente, string> = {
  TODOS: "Todos",
  ABRAF: "Abrafarma",
  INDEP: "Independente",
};

export const OPCOES_CANAL_RX: { value: TipoConcorrente; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ABRAF", label: "Abrafarma" },
  { value: "INDEP", label: "Independente" },
];

export interface LinhasPacoteRx {
  pesquisa: string;
  matriz: string;
  top: string;
  sensibilidade: string;
  pesquisaValor: TipoConcorrente | null;
  matrizValor: TipoConcorrente | null;
  topPp: number;
  poucoPp: number;
  sensivelPp: number;
  superPp: number;
}

function pontos(valor: number): string {
  const n = Math.round(valor * 100);
  return n > 0 ? `+${n}` : String(n);
}

function canalDe(
  mapa: Record<string, Record<DepartamentoRx, TipoConcorrente>> | undefined,
  chave: string,
  dept: DepartamentoRx,
): TipoConcorrente | null {
  return mapa?.[chave]?.[dept] ?? mapa?.Cluster?.[dept] ?? null;
}

export function lerPacoteRx(cockpit: RxCockpitParams, chave: string, dept: DepartamentoRx): LinhasPacoteRx {
  const pesquisaValor = canalDe(cockpit.politicaPesquisa, chave, dept);
  const matrizValor = canalDe(cockpit.politicaMatriz, chave, dept);
  const ajuste = cockpit.ajusteDesconto[dept]?.[chave] ?? cockpit.ajusteDesconto[dept]?.Cluster;
  const top = ajuste?.["TOP PRODUTOS"] ?? 0;
  const pouco = ajuste?.["Pouco Sensível"] ?? 0;
  const sensivel = ajuste?.["Sensível"] ?? 0;
  const superSensivel = ajuste?.["Super Sensível"] ?? 0;
  return {
    pesquisa: pesquisaValor ? `Pesquisa ${ROTULO_CANAL_RX[pesquisaValor]}` : "Pesquisa sem canal",
    matriz: matrizValor ? `Matriz ${ROTULO_CANAL_RX[matrizValor]}` : "Matriz sem canal",
    top: `Top ${pontos(top)} pp`,
    sensibilidade: `Pouco ${pontos(pouco)} · Sensível ${pontos(sensivel)} · Super ${pontos(superSensivel)}`,
    pesquisaValor,
    matrizValor,
    topPp: Math.round(top * 100),
    poucoPp: Math.round(pouco * 100),
    sensivelPp: Math.round(sensivel * 100),
    superPp: Math.round(superSensivel * 100),
  };
}

export function pacotesIguais(a: LinhasPacoteRx, b: LinhasPacoteRx) {
  return a.pesquisa === b.pesquisa && a.matriz === b.matriz && a.top === b.top && a.sensibilidade === b.sensibilidade;
}
