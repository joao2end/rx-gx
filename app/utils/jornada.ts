export type Dominio = "rx" | "gx";

export type EtapaId =
  | "visao"
  | "sensibilidade"
  | "ps"
  | "pesquisa"
  | "clusterizacao"
  | "parametrizacao"
  | "simulacao"
  | "resultados"
  | "exportacao";

export interface Conceito {
  termo: string;
  definicao: string;
}

export interface EtapaJornada {
  id: EtapaId;
  titulo: string;
  icone: string;
  to: string;
  modulo?: boolean;
  resumo: string;
  oQue: string;
  porque: string;
  fazer: string[];
  conceitos: string[];
  saida: string;
}

export interface DefinicaoDominio {
  id: Dominio;
  nome: string;
  nomeCurto: string;
  escopo: string;
  unidade: string;
  cor: { texto: string; fundo: string; borda: string; solido: string };
  etapas: EtapaJornada[];
}

export const CONCEITOS: Record<string, Conceito> = {
  pmc: {
    termo: "PMC",
    definicao:
      "Preço Máximo ao Consumidor definido pela CMED. É o teto legal: nenhum medicamento pode ser vendido acima dele.",
  },
  faixa: {
    termo: "Faixa de preço",
    definicao:
      "Quintil do PMC dentro do próprio departamento. A Faixa 5 reúne os 20% de itens mais caros, a Faixa 1 os 20% mais baratos.",
  },
  cronicidade: {
    termo: "Cronicidade",
    definicao:
      "Frequência de uso da classe terapêutica: eventual, frequente ou crônico. Quem usa todo mês compara preço com mais atenção.",
  },
  sensibilidade: {
    termo: "Sensibilidade",
    definicao:
      "Cruzamento de faixa com cronicidade. Super Sensível pede preço competitivo; Pouco Sensível permite mais margem.",
  },
  canal: {
    termo: "Abrafarma × Independente",
    definicao:
      "As grandes redes associadas à Abrafarma praticam descontos diferentes das independentes. Cada departamento escolhe contra qual grupo competir.",
  },
  desconto: {
    termo: "Desconto sobre o PMC",
    definicao:
      "Medida competitiva do RX. Em vez de comparar reais, compara o quanto cada rede tira do PMC: 20% de desconto significa preço = PMC × 0,80.",
  },
  matriz: {
    termo: "Matriz online 5×3",
    definicao:
      "Desconto médio por faixa e cronicidade vindo da pesquisa online. Precifica os SKUs que não entraram na pesquisa física.",
  },
  outlier: {
    termo: "Tratamento de outliers",
    definicao:
      "Remove preços acima do PMC, amostras únicas e valores fora do intervalo interquartil (IQR 1,5). Evita que um erro de coleta puxe o preço.",
  },
  chave: {
    termo: "Chave",
    definicao:
      "Princípio ativo + forma + dosagem + quantidade. No genérico o cliente compra a chave; o laboratório é intercambiável.",
  },
  p1: {
    termo: "P1 e escada Pn",
    definicao:
      "P1 é o laboratório de combate, com o menor preço da chave. P2, P3… sobem em degraus geométricos a partir dele.",
  },
  ic: {
    termo: "IC (índice de competitividade)",
    definicao:
      "Meu preço do P1 ÷ preço do concorrente. IC 0,97 significa estar 3% abaixo da praça. O genérico usa um único IC.",
  },
  margemObjetivo: {
    termo: "Margem objetivo",
    definicao:
      "Para chaves sem pesquisa, o P1 sai de custo ÷ (1 − margem). A margem varia por sensibilidade.",
  },
  margemCritica: {
    termo: "Margem crítica",
    definicao:
      "Piso de proteção. Se o preço calculado deixar a margem abaixo dele, o motor recompõe o preço para custo ÷ (1 − margem crítica).",
  },
  farol: {
    termo: "Farol de variação",
    definicao:
      "Limita o quanto o preço pode subir ou cair de uma vez em relação ao preço atual, evitando choques na gôndola e no caixa.",
  },
  margemLiquida: {
    termo: "Margem líquida",
    definicao:
      "Margem bruta exibida menos a alíquota de impostos configurada. Gera alerta quando fica abaixo da margem mínima.",
  },
  clusterComposto: {
    termo: "Cluster composto",
    definicao:
      "A loja recebe um perfil por departamento. A mesma loja pode ser Alta em Marca e Baixa em Similar.",
  },
  pesquisaBase: {
    termo: "Pesquisa base",
    definicao:
      "A rodada de pesquisa usada como referência. Clusterização e simulação leem a mesma pesquisa base.",
  },
  decisao: {
    termo: "Aceitar, manter ou editar",
    definicao:
      "Aceitar aplica o preço sugerido. Manter preserva o preço atual. Editar grava um preço manual para o item.",
  },
  plugpharma: {
    termo: "PlugPharma",
    definicao:
      "Destino dos preços de medicamentos com PMC: lista de desconto e tabloide. Medicamentos não usam planejamento de etiquetas.",
  },
  aderencia: {
    termo: "Aderência",
    definicao:
      "Distância entre o preço simulado e o preço praticado na loja. Mostra quanto da estratégia chegou ao caixa.",
  },
};

export const DOMINIOS: Record<Dominio, DefinicaoDominio> = {
  rx: {
    id: "rx",
    nome: "Medicamentos RX",
    nomeCurto: "RX",
    escopo: "Marca, Propagado e Similar",
    unidade: "SKU",
    cor: {
      texto: "text-teal-800",
      fundo: "bg-teal-50",
      borda: "border-teal-200",
      solido: "bg-teal-700",
    },
    etapas: [
      {
        id: "visao",
        titulo: "Visão da jornada RX",
        icone: "i-lucide-map",
        to: "/rx",
        resumo: "Como o RX é precificado e em que ordem.",
        oQue:
          "A jornada RX precifica cada SKU de Marca, Propagado e Similar como um desconto sobre o PMC, calibrado pela praça e pela sensibilidade do item.",
        porque:
          "Medicamento de balcão tem teto legal (PMC) e o cliente compara o desconto que recebe. O trabalho é decidir quanto desconto dar, item a item, sem abrir mão da margem.",
        fazer: [
          "Percorra as etapas na ordem: cada uma alimenta a próxima.",
          "A Pesquisa é uma página própria e serve às duas jornadas. A Clusterização fica em Minha estratégia.",
          "Termine na exportação para PlugPharma.",
        ],
        conceitos: ["pmc", "desconto", "sensibilidade"],
        saida: "Preços RX aprovados e prontos para PlugPharma.",
      },
      {
        id: "sensibilidade",
        titulo: "Sensibilidade",
        icone: "i-lucide-gauge",
        to: "/rx/sensibilidade",
        resumo: "Quais SKUs o cliente percebe mais.",
        oQue:
          "Classifica cada SKU em Super Sensível, Sensível ou Pouco Sensível cruzando a faixa de PMC (quintil dentro do departamento) com a cronicidade da classe terapêutica.",
        porque:
          "No balcão o cliente sente o preço de remédios caros e de uso contínuo. É nesses itens que o desconto precisa estar; nos demais, a margem pode ser preservada. Ocupa o lugar da notabilidade do autosserviço.",
        fazer: [
          "Consulte a matriz. Faixas, cronicidade e níveis são fixos e não se editam nesta etapa.",
        ],
        conceitos: ["pmc", "faixa", "cronicidade", "sensibilidade"],
        saida: "Cada SKU RX com um nível de sensibilidade, usado por ajustes de desconto e margem crítica.",
      },
      {
        id: "pesquisa",
        titulo: "Pesquisa",
        icone: "i-lucide-radar",
        to: "/pesquisa?d=rx",
        modulo: true,
        resumo: "Que desconto a praça pratica.",
        oQue:
          "A pesquisa manual nasce dos parâmetros da lista: você escolhe os SKUs, inicia a coleta e registra o preço em cada concorrente. A pesquisa que veio do Excel já está no gerenciador de pesquisa, com o desconto tratado e a matriz online. Importação de arquivo e upload por robô ficam para um próximo momento.",
        porque:
          "O preço RX nasce do desconto observado. Pesquisa sem tratamento leva erro de coleta direto para o preço. O que não é pesquisado fisicamente recebe o desconto da matriz online.",
        fazer: [
          "Crie a pesquisa manual, ajuste os parâmetros e inicie a coleta.",
          "No gerenciador de pesquisa, abra a do Excel para conferir desconto, outliers e a matriz online.",
        ],
        conceitos: ["canal", "desconto", "outlier", "matriz"],
        saida: "Desconto de referência por SKU e por canal, e matriz online para o restante.",
      },
      {
        id: "clusterizacao",
        titulo: "Clusterização",
        icone: "i-lucide-network",
        to: "/estrategia/clusterizacao?d=rx",
        modulo: true,
        resumo: "Quão agressiva cada loja é por departamento.",
        oQue:
          "Agrupa as lojas por agressividade competitiva, com um cluster por departamento: Marca, Propagado e Similar. Dentro de cada um a loja é Alta, Moderada ou Baixa.",
        porque:
          "A mesma loja pode ter concorrência forte em Marca e fraca em Similar. O perfil define o canal de referência e o ajuste de desconto que a simulação aplica.",
        fazer: [
          "Em Atualizar estratégia, escolha as pesquisas que definem a estratégia.",
          "Defina o perfil de cada loja em cada departamento.",
          "Compare com a estratégia anterior.",
          "Leve o perfil do departamento para a simulação.",
        ],
        conceitos: ["clusterComposto", "pesquisaBase", "canal"],
        saida: "Perfil Alta, Moderado ou Baixa por departamento, aplicado na simulação RX.",
      },
      {
        id: "parametrizacao",
        titulo: "Parametrização",
        icone: "i-lucide-sliders-horizontal",
        to: "/rx/parametrizacao",
        resumo: "As regras de desconto antes de ver o preço.",
        oQue:
          "Mostra o pacote do cluster (canal da pesquisa, canal da matriz e ajuste de desconto) só para leitura. Aqui se editam a margem crítica, o farol, a folga abaixo do PMC, a alíquota, a margem líquida e a matriz online.",
        porque:
          "O preço só faz sentido depois das regras de rede. O pacote do cluster vem da estratégia; aqui ficam a margem, o farol e a matriz online.",
        fazer: [
          "Confira o pacote do cluster. Para mudar canal ou ajuste, atualize a estratégia.",
          "No nível Simples as regras de rede ficam fechadas. Avançado abre a matriz online. Completo abre margem, farol, alíquota e margem líquida.",
        ],
        conceitos: ["canal", "desconto", "matriz", "margemCritica", "farol"],
        saida: "Regras RX que a simulação aplica em cada SKU.",
      },
      {
        id: "simulacao",
        titulo: "Simulação",
        icone: "i-lucide-calculator",
        to: "/rx/simulacao",
        resumo: "O preço sugerido e a decisão item a item.",
        oQue:
          "Calcula preço = PMC × (1 − desconto de referência − ajuste), passa pelo farol de variação, pela margem crítica e pelas travas de PBM, Farmácia Popular, tabelado e PMC.",
        porque:
          "É onde a estratégia vira preço. As regras vieram da parametrização. Os alertas mostram onde elas entraram em conflito com margem ou variação, para você decidir com contexto.",
        fazer: [
          "Veja os preços sugeridos, o farol e o impacto em receita e margem.",
          "Aceite, mantenha o preço atual ou edite cada item.",
        ],
        conceitos: ["margemCritica", "farol", "margemLiquida", "decisao"],
        saida: "Preço final RX por SKU com a decisão registrada.",
      },
      {
        id: "resultados",
        titulo: "Resultados",
        icone: "i-lucide-chart-column",
        to: "/rx/resultados",
        resumo: "Os totais da simulação, como no cockpit do Excel.",
        oQue:
          "Reúne receita, lucro, margem, desconto e a quantidade de aumentos, reduções e preços mantidos. O recorte segue sensibilidade e departamento, no mesmo desenho do cockpit do simulador RX.",
        porque:
          "O resultado da rede fica num lugar só, depois da decisão item a item e antes de gerar os arquivos.",
        fazer: [
          "Confira os totais do mês e o impacto anual.",
          "Compare atual e simulado por sensibilidade e departamento.",
        ],
        conceitos: ["margemCritica", "farol"],
        saida: "Totais RX aprovados para exportação.",
      },
      {
        id: "exportacao",
        titulo: "Exportação",
        icone: "i-lucide-file-down",
        to: "/rx/exportacao",
        resumo: "Enviar para PlugPharma e acompanhar.",
        oQue:
          "Gera os arquivos PlugPharma com os preços RX aprovados e mostra a aderência entre o simulado e o praticado.",
        porque:
          "Medicamento com PMC segue para PlugPharma, sem planejamento de etiquetas. A aderência mostra se a estratégia chegou ao caixa.",
        fazer: [
          "Baixe o tabloide e a lista de desconto numa ação só.",
          "A memória de cálculo fica como ação secundária.",
        ],
        conceitos: ["plugpharma", "aderencia"],
        saida: "Arquivos RX enviados e aderência acompanhada.",
      },
    ],
  },
  gx: {
    id: "gx",
    nome: "Genéricos GX",
    nomeCurto: "GX",
    escopo: "Genérico por chave",
    unidade: "chave",
    cor: {
      texto: "text-indigo-800",
      fundo: "bg-indigo-50",
      borda: "border-indigo-200",
      solido: "bg-indigo-700",
    },
    etapas: [
      {
        id: "visao",
        titulo: "Visão da jornada GX",
        icone: "i-lucide-map",
        to: "/gx",
        resumo: "Como o genérico é precificado e em que ordem.",
        oQue:
          "A jornada GX precifica a chave. Um laboratório de combate (P1) disputa a praça; os demais laboratórios da mesma chave sobem em escada a partir dele.",
        porque:
          "No genérico o cliente pede o princípio ativo e leva o mais barato. Quem decide a percepção de preço é o P1; a escada recupera margem nos outros laboratórios.",
        fazer: [
          "Percorra as etapas na ordem: cada uma alimenta a próxima.",
          "A Pesquisa é uma página própria e serve às duas jornadas. A Clusterização fica em Minha estratégia.",
          "Termine na exportação para PlugPharma.",
        ],
        conceitos: ["chave", "p1", "ic"],
        saida: "Preços GX aprovados e prontos para PlugPharma.",
      },
      {
        id: "sensibilidade",
        titulo: "Sensibilidade",
        icone: "i-lucide-gauge",
        to: "/gx/sensibilidade",
        resumo: "Quais chaves o cliente percebe mais.",
        oQue:
          "Classifica cada item genérico em Super Sensível, Sensível ou Pouco Sensível cruzando a faixa de PMC do departamento Genérico com a cronicidade da classe.",
        porque:
          "A sensibilidade escolhe o IC alvo e a margem objetivo. Chave crônica e cara pede IC mais agressivo; chave eventual e barata aceita margem maior.",
        fazer: [
          "Consulte a matriz. Faixas, cronicidade e níveis são fixos e não se editam nesta etapa.",
        ],
        conceitos: ["faixa", "cronicidade", "sensibilidade"],
        saida: "Cada item GX com sensibilidade, usada pelo IC alvo e pela margem objetivo.",
      },
      {
        id: "ps",
        titulo: "Validação dos Ps",
        icone: "i-lucide-list-ordered",
        to: "/gx/ps",
        resumo: "Qual laboratório combate em cada chave.",
        oQue:
          "Ordena os laboratórios de cada chave por um score fixo: cobertura 35%, quantidade 45% e custo 20%. O primeiro vira P1; os demais, P2..Pn. Os pesos não se editam nesta tela.",
        porque:
          "O P1 precisa estar em todas as lojas, girar e ter custo que suporte o preço de combate. Errar o P1 coloca o preço agressivo no laboratório errado. Esta etapa fica fora da simulação de propósito: a ordem dos laboratórios é decidida aqui, e a simulação só consome o resultado aprovado.",
        fazer: [
          "Confira o P1 sugerido e troque a posição do laboratório quando houver motivo comercial. A lista permanece no lugar.",
          "Envie os Ps aprovados à simulação GX. Os pesos do score ficam fixos.",
        ],
        conceitos: ["chave", "p1"],
        saida: "P1 e ordem P2..Pn definidos por chave.",
      },
      {
        id: "pesquisa",
        titulo: "Pesquisa",
        icone: "i-lucide-radar",
        to: "/pesquisa?d=gx",
        modulo: true,
        resumo: "Qual o menor preço da chave na praça.",
        oQue:
          "A pesquisa manual nasce dos parâmetros da lista: você escolhe as chaves, inicia a coleta e registra o menor preço em cada concorrente. A pesquisa manual e a de internet que vieram do Excel já estão no gerenciador de pesquisa. Importação de arquivo e upload por robô ficam para um próximo momento.",
        porque:
          "O P1 é comparado ao menor preço que o cliente encontra. Pesquisar um laboratório específico distorceria o IC.",
        fazer: [
          "Crie a pesquisa manual, ajuste os parâmetros e inicie a coleta.",
          "No gerenciador de pesquisa, abra a do Excel para conferir o menor, o médio e o maior preço da chave.",
        ],
        conceitos: ["chave", "canal", "ic"],
        saida: "Preço de referência da praça por chave.",
      },
      {
        id: "clusterizacao",
        titulo: "Clusterização",
        icone: "i-lucide-network",
        to: "/estrategia/clusterizacao?d=gx",
        modulo: true,
        resumo: "Agrupar lojas, com um único IC.",
        oQue:
          "Agrupa as lojas no eixo Genérico. O tratamento de pesquisa é próprio do GX e existe um único IC para o genérico.",
        porque:
          "O agrupamento registra a estratégia da rede e entra na visão consolidada com RX e autosserviço. A política de IC permanece única para não fragmentar o preço da chave.",
        fazer: [
          "Em Atualizar estratégia, escolha as pesquisas que definem a estratégia.",
          "Defina o perfil de cada loja no Genérico.",
          "Compare com a estratégia anterior.",
        ],
        conceitos: ["pesquisaBase", "ic"],
        saida: "Lojas agrupadas no Genérico, com o mesmo IC para todas.",
      },
      {
        id: "parametrizacao",
        titulo: "Parametrização",
        icone: "i-lucide-sliders-horizontal",
        to: "/gx/parametrizacao",
        resumo: "IC, margem e escada antes dos preços.",
        oQue:
          "Define o IC da pesquisa manual e da internet, a margem objetivo, o piso de margem crítica, o farol e os limites da escada. O preço forçado do P1 da chave também entra aqui.",
        porque:
          "O IC e a margem viram o preço do P1. Definir isso antes da grade separa a regra do resultado. A ordem dos laboratórios continua na Validação dos Ps.",
        fazer: [
          "Defina IC, margem, escada e o P1 da chave antes de ver os preços.",
          "No nível Simples valem os parâmetros da planilha. Avançado e Completo abrem a edição.",
        ],
        conceitos: ["ic", "margemObjetivo", "margemCritica", "farol", "p1"],
        saida: "Regras GX que a simulação aplica no P1 e na escada.",
      },
      {
        id: "simulacao",
        titulo: "Simulação",
        icone: "i-lucide-calculator",
        to: "/gx/simulacao",
        resumo: "Preço do P1, escada e decisão.",
        oQue:
          "Precifica o P1 por IC sobre a pesquisa manual, pela pesquisa internet ou pela margem objetivo por sensibilidade. Depois monta a escada geométrica dos demais laboratórios.",
        porque:
          "Aqui o IC e a margem objetivo, definidos na parametrização, viram preço. Os alertas mostram quando o P1 ficou abaixo da margem crítica ou quando a escada encostou no teto. A ordem dos laboratórios não muda nesta tela: vem da etapa Validação dos Ps.",
        fazer: [
          "Veja os preços sugeridos, o farol e o impacto. O degrau de 5% e a abertura de 50% são fixos.",
          "Aceite, mantenha o preço atual ou edite cada item.",
        ],
        conceitos: ["ic", "margemObjetivo", "p1", "margemLiquida", "decisao"],
        saida: "Preço final GX por laboratório com a decisão registrada.",
      },
      {
        id: "resultados",
        titulo: "Resultados",
        icone: "i-lucide-chart-column",
        to: "/gx/resultados",
        resumo: "Os totais da simulação, como no cockpit do Excel.",
        oQue:
          "Reúne receita, lucro, margem, IC do P1 e a quantidade de aumentos, reduções e preços mantidos. O recorte segue o degrau e a sensibilidade, no mesmo desenho do cockpit do simulador GX.",
        porque:
          "O resultado da rede fica num lugar só, depois da decisão item a item e antes de gerar os arquivos.",
        fazer: [
          "Confira os totais do mês e o impacto anual.",
          "Compare atual e simulado por degrau e sensibilidade.",
        ],
        conceitos: ["ic", "margemObjetivo"],
        saida: "Totais GX aprovados para exportação.",
      },
      {
        id: "exportacao",
        titulo: "Exportação",
        icone: "i-lucide-file-down",
        to: "/gx/exportacao",
        resumo: "Enviar para PlugPharma e acompanhar.",
        oQue:
          "Gera os arquivos PlugPharma com os preços GX aprovados e mostra a aderência entre o simulado e o praticado.",
        porque:
          "Genérico com PMC segue para PlugPharma, sem planejamento de etiquetas. A aderência mostra se a escada chegou ao caixa.",
        fazer: [
          "Baixe o tabloide e a lista de desconto numa ação só.",
          "A memória de cálculo fica como ação secundária.",
        ],
        conceitos: ["plugpharma", "aderencia"],
        saida: "Arquivos GX enviados e aderência acompanhada.",
      },
    ],
  },
};

export const PESQUISA = {
  id: "pesquisa" as const,
  titulo: "Pesquisa",
  icone: "i-lucide-radar",
  to: "/pesquisa",
  resumo: "Pesquisa manual e a rodada que veio do Excel. Importação e upload ficam para depois.",
};

export const MINHA_ESTRATEGIA = {
  titulo: "Minha estratégia",
  icone: "i-lucide-target",
  to: "/estrategia",
};

export const MODULOS = [
  PESQUISA,
  {
    id: "coletor" as const,
    titulo: "Lista do coletor",
    icone: "i-lucide-clipboard-list",
    to: "/coletor",
    resumo: "Visão única da visita: RX e GX juntos, armazenamento separado.",
  },
];

export function etapasDe(dominio: Dominio): EtapaJornada[] {
  return DOMINIOS[dominio].etapas;
}

export function etapaDe(dominio: Dominio, id: EtapaId): EtapaJornada {
  return DOMINIOS[dominio].etapas.find((e) => e.id === id) ?? DOMINIOS[dominio].etapas[0]!;
}

export function etapasDoFluxo(dominio: Dominio): EtapaJornada[] {
  return DOMINIOS[dominio].etapas.filter((e) => e.id !== "visao" && !e.modulo);
}

export function vizinhas(dominio: Dominio, id: EtapaId) {
  const atual = etapaDe(dominio, id);
  const lista = atual.modulo
    ? DOMINIOS[dominio].etapas.filter((e) => e.modulo)
    : etapasDoFluxo(dominio);
  const i = lista.findIndex((e) => e.id === id);
  return { anterior: i > 0 ? lista[i - 1] : undefined, proxima: i >= 0 ? lista[i + 1] : undefined };
}
