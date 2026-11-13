import { computed, watch } from "vue";
import type { TipoConcorrente } from "~/types/pricing";

export type TipoRede = Exclude<TipoConcorrente, "TODOS">;
export type OrigemMapeamento = "importado" | "manual";
export type FiltroMapeamento = "todas" | "pendentes" | "concluidas";

export interface RedeConcorrente {
  id: string;
  nome: string;
  tipo: TipoRede | null;
  habilitada: boolean;
}

export interface LojaEstrategia {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
}

export interface VinculoConcorrente {
  id: string;
  lojaId: string;
  redeId: string;
  endereco: string;
  origem: OrigemMapeamento;
  atualizadoHaDias: number;
}

export interface PontoMapa {
  id: string;
  lojaId: string;
  nome: string;
  endereco: string;
  redeId: string;
  distanciaKm: number;
}

export interface LinhaImportacao {
  id: string;
  lojaId: string;
  de: string;
  endereco: string;
  redeSugeridaId: string | null;
}

const REDES_INICIAIS: RedeConcorrente[] = [
  { id: "RAIA", nome: "Drogasil / Raia", tipo: "ABRAF", habilitada: true },
  { id: "PACHECO", nome: "Drogarias Pacheco", tipo: "ABRAF", habilitada: true },
  { id: "DSP", nome: "Drogaria São Paulo", tipo: "ABRAF", habilitada: true },
  { id: "PAGUE_MENOS", nome: "Pague Menos", tipo: "ABRAF", habilitada: false },
  { id: "NISSEI", nome: "Nissei", tipo: "ABRAF", habilitada: false },
  { id: "MODERNA", nome: "Drogaria Moderna", tipo: "INDEP", habilitada: true },
  { id: "POVÃO", nome: "Farmácia Povão", tipo: "INDEP", habilitada: true },
  { id: "RETIRO", nome: "Drogaria Retiro", tipo: "INDEP", habilitada: true },
  { id: "ULTRA", nome: "Drogaria Ultra Popular", tipo: "INDEP", habilitada: true },
  { id: "BAIRRO", nome: "Farmácia do Bairro", tipo: null, habilitada: true },
  { id: "SAO_LUCAS", nome: "Drogaria São Lucas", tipo: null, habilitada: true },
  { id: "JARDIM", nome: "Farmácia Popular do Jardim", tipo: null, habilitada: false },
];

const LOJAS_INICIAIS: LojaEstrategia[] = [
  {
    id: "menininha",
    nome: "MENININHA",
    cnpj: "12.345.678/0001-90",
    endereco: "EST DO M BOI MIRIM, 5918, PARQUE BOLOGNE - SAO PAULO, SP",
  },
  {
    id: "capao",
    nome: "CAPÃO REDONDO",
    cnpj: "23.456.789/0001-01",
    endereco: "AVENIDA COMENDADOR SANT'ANNA, 979, CAPÃO REDONDO - SÃO PAULO, SP",
  },
  {
    id: "arariba",
    nome: "ARARIBA",
    cnpj: "34.567.890/0001-12",
    endereco: "AV SILVIO RIBEIRO ARAGAO, 145, VILA FRANCA - SAO PAULO, SP",
  },
  {
    id: "manejo",
    nome: "MANEJO",
    cnpj: "45.678.901/0001-23",
    endereco: "RUA DO RETIRO, 210, MADUREIRA - RIO DE JANEIRO, RJ",
  },
];

const VINCULOS_INICIAIS: VinculoConcorrente[] = [
  vinculo("capao", "RAIA", "AVENIDA COMENDADOR SANT'ANNA, 820", "importado", 14),
  vinculo("capao", "PACHECO", "AVENIDA COMENDADOR SANT'ANNA, 1102", "importado", 14),
  vinculo("capao", "MODERNA", "RUA DOUTOR SABOIA DE MEDEIROS, 44", "importado", 14),
  vinculo("capao", "POVÃO", "ESTRADA DO CAMPO LIMPO, 1500", "importado", 14),
  vinculo("arariba", "RAIA", "AV SILVIO RIBEIRO ARAGAO, 200", "importado", 14),
  vinculo("arariba", "RETIRO", "RUA ARARIBA, 88", "importado", 14),
  vinculo("arariba", "ULTRA", "AVENIDA VILA FRANCA, 310", "importado", 14),
];

const PONTOS: PontoMapa[] = [
  ponto("menininha", "m1", "Drogasil Parque Bologne", "EST DO M BOI MIRIM, 5800", "RAIA", 0.4),
  ponto("menininha", "m2", "Drogarias Pacheco Menininha", "EST DO M BOI MIRIM, 6102", "PACHECO", 0.5),
  ponto("menininha", "m3", "Farmácia do Bairro", "RUA DO PARQUE, 120", "BAIRRO", 0.7),
  ponto("menininha", "m4", "Drogaria São Lucas", "RUA DAS HORTENSIAS, 45", "SAO_LUCAS", 0.9),
  ponto("menininha", "m5", "Drogaria Moderna", "EST DO M BOI MIRIM, 7020", "MODERNA", 1.6),
  ponto("menininha", "m6", "Farmácia Popular do Jardim", "RUA DO JARDIM, 900", "JARDIM", 2.4),
  ponto("capao", "c1", "Drogaria São Lucas Capão", "RUA DA LIGACAO, 18", "SAO_LUCAS", 0.6),
  ponto("capao", "c2", "Farmácia do Bairro Capão", "AVENIDA COMENDADOR SANT'ANNA, 1400", "BAIRRO", 0.8),
  ponto("capao", "c3", "Pague Menos Capão Redondo", "ESTRADA DO CAMPO LIMPO, 200", "PAGUE_MENOS", 1.1),
  ponto("arariba", "a1", "Farmácia do Bairro Vila Franca", "AV SILVIO RIBEIRO ARAGAO, 320", "BAIRRO", 0.5),
  ponto("arariba", "a2", "Drogaria São Paulo Araribá", "RUA ARARIBA, 10", "DSP", 0.8),
  ponto("manejo", "j1", "Drogasil Madureira", "RUA DO RETIRO, 80", "RAIA", 0.4),
  ponto("manejo", "j2", "Drogarias Pacheco Madureira", "RUA CAROLINA MACHADO, 400", "PACHECO", 0.6),
  ponto("manejo", "j3", "Farmácia do Bairro", "RUA DO RETIRO, 350", "BAIRRO", 0.8),
  ponto("manejo", "j4", "Drogaria Moderna", "AVENIDA MINISTRO EDGARD ROMERO, 90", "MODERNA", 1.3),
];

const LINHAS_IMPORTACAO: LinhaImportacao[] = [
  {
    id: "imp-1",
    lojaId: "menininha",
    de: "DROGASIL",
    endereco: "EST DO M BOI MIRIM, 5800, PARQUE BOLOGNE - SAO PAULO, SP",
    redeSugeridaId: "RAIA",
  },
  {
    id: "imp-2",
    lojaId: "menininha",
    de: "FARMÁCIA DO BAIRRO",
    endereco: "RUA DO PARQUE, 120, PARQUE BOLOGNE - SAO PAULO, SP",
    redeSugeridaId: "BAIRRO",
  },
  {
    id: "imp-3",
    lojaId: "capao",
    de: "DROGARIA SÃO LUCAS",
    endereco: "RUA DA LIGACAO, 18, CAPÃO REDONDO - SÃO PAULO, SP",
    redeSugeridaId: "SAO_LUCAS",
  },
  {
    id: "imp-4",
    lojaId: "manejo",
    de: "DROGARIA MODERNA",
    endereco: "AVENIDA MINISTRO EDGARD ROMERO, 90, MADUREIRA - RIO DE JANEIRO, RJ",
    redeSugeridaId: "MODERNA",
  },
];

function vinculo(
  lojaId: string,
  redeId: string,
  endereco: string,
  origem: OrigemMapeamento,
  atualizadoHaDias: number,
): VinculoConcorrente {
  return { id: `${lojaId}-${redeId}`, lojaId, redeId, endereco, origem, atualizadoHaDias };
}

function ponto(
  lojaId: string,
  id: string,
  nome: string,
  endereco: string,
  redeId: string,
  distanciaKm: number,
): PontoMapa {
  return { id, lojaId, nome, endereco, redeId, distanciaKm };
}

export function rotuloTipo(tipo: TipoRede | null) {
  if (tipo === "ABRAF") return "Abrafarma";
  if (tipo === "INDEP") return "Independente";
  return "Sem tipo";
}

export function rotuloAtualizacao(dias: number) {
  if (dias <= 0) return "Atualizado hoje";
  if (dias === 1) return "Atualizado ontem";
  return `Atualizado há ${dias} dias`;
}

export function useConcorrentesEstrategia() {
  const { tiposConcorrenteMap, isLoaded, redeSeed } = usePricingPoc();
  const redes = useState<RedeConcorrente[]>("estrategia-redes", () => REDES_INICIAIS.map((rede) => ({ ...rede })));
  const lojas = useState<LojaEstrategia[]>("estrategia-lojas", () => LOJAS_INICIAIS.map((loja) => ({ ...loja })));
  const vinculos = useState<VinculoConcorrente[]>("estrategia-vinculos", () => VINCULOS_INICIAIS.map((item) => ({ ...item })));
  const pontos = useState<PontoMapa[]>("estrategia-pontos", () => PONTOS.map((ponto) => ({ ...ponto })));
  const linhasImportacao = useState<LinhaImportacao[]>("estrategia-linhas", () =>
    LINHAS_IMPORTACAO.map((linha) => ({ ...linha })),
  );
  const tiposDefinidos = useState<Record<string, TipoRede>>("estrategia-tipos-rede", () => ({}));

  watch(redeSeed, (rede) => {
    if (!rede) return;
    redes.value = rede.redes.map((item) => ({ ...item }));
    lojas.value = rede.lojasEstrategia.map((item) => ({ ...item }));
    vinculos.value = rede.vinculos.map((item) => ({ ...item }));
    pontos.value = rede.pontos.map((item) => ({ ...item }));
    linhasImportacao.value = rede.linhasImportacao.map((item) => ({ ...item }));
  }, { immediate: true });

  watch(isLoaded, (carregado) => {
    if (!carregado || !Object.keys(tiposDefinidos.value).length) return;
    tiposConcorrenteMap.value = { ...tiposConcorrenteMap.value, ...tiposDefinidos.value };
  });

  const ativas = computed(() => redes.value.filter((rede) => rede.habilitada).length);

  function redeDe(id: string) {
    return redes.value.find((rede) => rede.id === id);
  }

  function lojaDe(id: string) {
    return lojas.value.find((loja) => loja.id === id);
  }

  function vinculosDaLoja(lojaId: string) {
    return vinculos.value.filter((item) => item.lojaId === lojaId);
  }

  function resumoLoja(lojaId: string) {
    const itens = vinculosDaLoja(lojaId);
    if (!itens.length) return { pendente: true as const, quantidade: 0, origem: null, dias: null };
    const recente = [...itens].sort((a, b) => a.atualizadoHaDias - b.atualizadoHaDias)[0]!;
    return {
      pendente: false as const,
      quantidade: itens.length,
      origem: recente.origem,
      dias: recente.atualizadoHaDias,
    };
  }

  function pontosDaLoja(lojaId: string) {
    return pontos.value.filter((pontoMapa) => pontoMapa.lojaId === lojaId).sort((a, b) => a.distanciaKm - b.distanciaKm);
  }

  function definirHabilitada(id: string, habilitada: boolean) {
    redes.value = redes.value.map((rede) => (rede.id === id ? { ...rede, habilitada } : rede));
  }

  function definirTipo(redeId: string, tipo: TipoRede) {
    tiposDefinidos.value = { ...tiposDefinidos.value, [redeId]: tipo };
    redes.value = redes.value.map((rede) => (rede.id === redeId ? { ...rede, tipo } : rede));
    tiposConcorrenteMap.value = { ...tiposConcorrenteMap.value, [redeId]: tipo };
  }

  function criarRede(nome: string) {
    const limpo = nome.trim().replace(/\s+/g, " ");
    if (!limpo) return "";
    const chave = limpo.toLocaleUpperCase("pt-BR");
    const existente = redes.value.find((rede) => rede.nome.toLocaleUpperCase("pt-BR") === chave);
    if (existente) return existente.id;
    const id = `USR-${chave.replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24)}`;
    redes.value = [...redes.value, { id, nome: limpo, tipo: null, habilitada: true }];
    return id;
  }

  function incluirVinculos(
    itens: Array<Omit<VinculoConcorrente, "id" | "atualizadoHaDias"> & { id?: string }>,
  ) {
    const novos: VinculoConcorrente[] = [];
    for (const item of itens) {
      const repetido = vinculos.value.some(
        (atual) => atual.lojaId === item.lojaId && atual.redeId === item.redeId && atual.endereco === item.endereco,
      ) || novos.some(
        (atual) => atual.lojaId === item.lojaId && atual.redeId === item.redeId && atual.endereco === item.endereco,
      );
      if (repetido) continue;
      novos.push({
        id: item.id ?? `${item.lojaId}-${item.redeId}-${novos.length}-${vinculos.value.length}`,
        lojaId: item.lojaId,
        redeId: item.redeId,
        endereco: item.endereco,
        origem: item.origem,
        atualizadoHaDias: 0,
      });
    }
    if (novos.length) vinculos.value = [...vinculos.value, ...novos];
    return novos.length;
  }

  function removerVinculo(id: string) {
    vinculos.value = vinculos.value.filter((item) => item.id !== id);
  }

  return {
    redes,
    lojas,
    vinculos,
    linhasImportacao,
    ativas,
    redeDe,
    lojaDe,
    vinculosDaLoja,
    resumoLoja,
    pontosDaLoja,
    definirHabilitada,
    definirTipo,
    criarRede,
    incluirVinculos,
    removerVinculo,
  };
}
