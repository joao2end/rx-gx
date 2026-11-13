import type { Dominio } from "~/utils/jornada";

export type IdPesquisa = "rx-competitiva-rj" | "gx-manual-rj" | "gx-internet-rj";

export interface PesquisaCatalogo {
  id: IdPesquisa;
  dominio: Dominio;
  /** Agrupamento na modal. RX cobre os três departamentos numa pesquisa só; GX é o eixo Genérico. */
  grupo: string;
  nome: string;
  origem: string;
  cobre: string;
}

/** Só o que a aba/arquivo Pesquisa traz. Nada além desses três blocos entra na modal. */
export const CATALOGO_PESQUISAS: PesquisaCatalogo[] = [
  {
    id: "rx-competitiva-rj",
    dominio: "rx",
    grupo: "Marca, Propagado e Similar",
    nome: "Pesquisa competitiva RX",
    origem: "Base falsa",
    cobre: "Desconto por SKU de Marca, Propagado e Similar",
  },
  {
    id: "gx-manual-rj",
    dominio: "gx",
    grupo: "Genérico",
    nome: "Pesquisa manual",
    origem: "Base falsa",
    cobre: "Menor, médio e maior preço da chave por canal",
  },
  {
    id: "gx-internet-rj",
    dominio: "gx",
    grupo: "Genérico",
    nome: "Pesquisa internet",
    origem: "Base falsa",
    cobre: "Preço de referência da chave fora da pesquisa manual",
  },
];

export function pesquisasDoDominio(dominio: Dominio): PesquisaCatalogo[] {
  return CATALOGO_PESQUISAS.filter((p) => p.dominio === dominio);
}

export function rotuloPesquisas(ids: string[]): string {
  const nomes = ids
    .map((id) => CATALOGO_PESQUISAS.find((p) => p.id === id)?.nome)
    .filter((nome): nome is string => Boolean(nome));
  return nomes.join(", ");
}
