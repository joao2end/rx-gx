import type { Dominio } from "~/utils/jornada";

export interface ItemPesquisaManual {
  id: string;
  descricao: string;
  fabricante: string;
  categoria: string;
  departamento: string;
}

export interface ConcorrentePesquisa {
  nome: string;
  tipo: "ABRAF" | "INDEP";
}

export type StatusColetaManual = "pendente" | "coletado" | "nao_encontrado";

export interface ColetaManual {
  preco: number | null;
  status: Exclude<StatusColetaManual, "pendente">;
}

export interface PesquisaManual {
  id: string;
  dominio: Dominio;
  nome: string;
  criadaEm: string;
  loja: string;
  itens: ItemPesquisaManual[];
  concorrentes: ConcorrentePesquisa[];
  /** Chave `concorrente|itemId`. */
  coletas: Record<string, ColetaManual>;
}

export function chaveColeta(concorrente: string, itemId: string) {
  return `${concorrente}|${itemId}`;
}

export function usePesquisasManuais() {
  const pesquisas = useState<PesquisaManual[]>("poc-pesquisas-manuais", () => []);

  function criar(entrada: Omit<PesquisaManual, "id" | "criadaEm" | "coletas">) {
    const pesquisa: PesquisaManual = {
      ...entrada,
      id: `manual-${Date.now()}`,
      criadaEm: new Date().toISOString(),
      coletas: {},
    };
    pesquisas.value = [pesquisa, ...pesquisas.value];
    return pesquisa;
  }

  function atualizarColeta(
    pesquisaId: string,
    concorrente: string,
    itemId: string,
    coleta: ColetaManual | null,
  ) {
    pesquisas.value = pesquisas.value.map((pesquisa) => {
      if (pesquisa.id !== pesquisaId) return pesquisa;
      const coletas = { ...pesquisa.coletas };
      const chave = chaveColeta(concorrente, itemId);
      if (!coleta) delete coletas[chave];
      else coletas[chave] = coleta;
      return { ...pesquisa, coletas };
    });
  }

  return { pesquisas, criar, atualizarColeta };
}
