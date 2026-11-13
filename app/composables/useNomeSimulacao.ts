import type { Dominio } from "~/utils/jornada";

export const NOME_SIMULACAO_PADRAO = "Nova simulação";

export function useNomeSimulacao() {
  const nomeRx = useState<string>("poc-nome-simulacao-rx", () => NOME_SIMULACAO_PADRAO);
  const nomeGx = useState<string>("poc-nome-simulacao-gx", () => NOME_SIMULACAO_PADRAO);

  function nomeDe(dominio: Dominio): string {
    return dominio === "gx" ? nomeGx.value : nomeRx.value;
  }

  function definirNome(dominio: Dominio, nome: string) {
    if (dominio === "gx") nomeGx.value = nome;
    else nomeRx.value = nome;
  }

  return { nomeRx, nomeGx, nomeDe, definirNome };
}
