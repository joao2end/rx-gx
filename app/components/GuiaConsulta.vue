<template>
  <AdsModal
    v-model:open="aberta"
    title="Guia"
    description="Perguntas sobre a jornada e os conceitos. Abrir o guia não altera o preço."
    icon="i-lucide-book-open"
    size="3xl"
    scrollable
  >
    <div class="flex flex-col gap-[var(--ads-space-sm)]">
      <AdsPanelCard
        v-for="grupo in grupos"
        :key="grupo.titulo"
        :title="grupo.titulo"
        :subtitle="grupo.subtitulo"
      >
        <dl>
          <div
            v-for="(item, indice) in grupo.itens"
            :key="item.pergunta"
            class="py-[var(--ads-space-xs)]"
            :class="indice < grupo.itens.length - 1 ? 'border-b border-[var(--ads-border-subtle)]' : ''"
          >
            <dt class="font-semibold text-[length:var(--ads-font-size-xs)] text-[var(--ads-text-primary)]">
              {{ item.pergunta }}
            </dt>
            <dd class="mt-[var(--ads-space-xxxs)] text-[length:var(--ads-font-size-xxs)] leading-[var(--ads-line-height-md)] text-[var(--ads-text-secondary)]">
              {{ item.resposta }}
            </dd>
          </div>
        </dl>
      </AdsPanelCard>
    </div>

    <template #footer>
      <AdsButton type="outline" color="neutral" size="sm" label="Fechar" @click="aberta = false" />
    </template>
  </AdsModal>
</template>

<script setup lang="ts">
interface ItemGuia {
  pergunta: string;
  resposta: string;
}

interface GrupoGuia {
  titulo: string;
  subtitulo: string;
  itens: ItemGuia[];
}

const aberta = defineModel<boolean>("open", { default: false });

const grupos: GrupoGuia[] = [
  {
    titulo: "A jornada",
    subtitulo: "O que cada etapa faz, como o preço se forma e o que cada nível abre.",
    itens: [
      {
        pergunta: "O que você faz na Sensibilidade?",
        resposta:
          "Na Sensibilidade você consulta quais itens o cliente compara com mais atenção. Cada item cruza a faixa de preço, quão caro ele é no departamento, com a cronicidade, o uso eventual, frequente ou crônico. O resultado é Super Sensível, Sensível ou Pouco Sensível, e essa classificação não se edita nesta etapa.",
      },
      {
        pergunta: "O que você faz na Pesquisa?",
        resposta:
          "Na Pesquisa você registra o preço dos concorrentes. No RX o resultado é o desconto sobre o PMC, o teto legal, de cada SKU. No GX, é o menor preço da chave (princípio ativo, forma, dosagem e quantidade), em qualquer laboratório.",
      },
      {
        pergunta: "O que você faz na Clusterização?",
        resposta:
          "Na Clusterização você escolhe a pesquisa base, a rodada de referência, e marca cada loja como Alta, Moderado ou Baixa. No RX o perfil é por departamento (Marca, Propagado e Similar) e muda o desconto na simulação. No GX as lojas se agrupam no Genérico e o índice de competitividade, seu preço frente ao da praça, fica único para a rede.",
      },
      {
        pergunta: "O que você faz na Parametrização?",
        resposta:
          "Na Parametrização você define as regras antes de ver os preços. No RX: canal da pesquisa e da matriz, ajuste de desconto, margem crítica e farol. No GX: IC, margem, escada e o preço do P1 da chave. No nível Simples valem os parâmetros da planilha.",
      },
      {
        pergunta: "O que você faz na Simulação?",
        resposta:
          "Na Simulação você vê o preço sugerido, o farol e o impacto, e escolhe aceitar, manter o atual ou editar. As regras vêm da Parametrização. No RX o preço é o PMC menos o desconto de referência e o ajuste do perfil. No GX o P1 segue a pesquisa ou a margem objetivo, e os demais sobem em degraus.",
      },
      {
        pergunta: "O que você faz na Exportação?",
        resposta:
          "Na Exportação você baixa o tabloide e a lista de desconto para o PlugPharma, o destino dos medicamentos com PMC. A aderência mostra a distância entre o preço simulado e o preço praticado na loja.",
      },
      {
        pergunta: "Por que a Validação dos Ps fica fora da simulação GX?",
        resposta:
          "A ordem dos laboratórios se decide nesta etapa, e a simulação GX só usa o resultado aprovado. Um score fixo, cobertura 35%, quantidade 45% e custo 20%, aponta o P1, o laboratório de combate. Os pesos não se editam, e a simulação não muda a ordem da chave.",
      },
      {
        pergunta: "Como o RX forma o preço?",
        resposta:
          "No RX, cada SKU de Marca, Propagado e Similar tem o preço como um desconto sobre o PMC, o teto legal da CMED. Desconto de 20% significa preço igual a PMC × 0,80. Cada departamento compete com as grandes redes da Abrafarma ou com as farmácias Independentes.",
      },
      {
        pergunta: "Como o GX forma o preço?",
        resposta:
          "No GX o preço é da chave: princípio ativo, forma, dosagem e quantidade. O P1, um laboratório de combate, leva o menor preço, e os demais sobem em degraus a partir dele. Com pesquisa, o P1 usa o IC, seu preço dividido pelo do concorrente; sem pesquisa, sai de custo dividido por (1 − margem objetivo), e essa margem varia com a sensibilidade.",
      },
      {
        pergunta: "O que o nível Simples calcula?",
        resposta:
          "No nível Simples a simulação calcula com os parâmetros da planilha. Na Parametrização, canal, matriz de desconto, IC, margem e farol ficam fechados.",
      },
      {
        pergunta: "O que o nível Avançado abre?",
        resposta:
          "Na Parametrização do RX, o Avançado abre o canal (Abrafarma, Independente ou todos) da pesquisa e da matriz, os parâmetros de cada perfil e a matriz de desconto. No GX, abre a escada, o P1 da chave, o IC da pesquisa manual e da internet, a margem objetivo e o piso de margem crítica da pesquisa internet.",
      },
      {
        pergunta: "O que o nível Completo soma?",
        resposta:
          "O Completo soma, na Parametrização do RX e do GX, o farol de variação, a alíquota sobre a margem bruta e a margem líquida mínima. A alíquota não muda o preço: ela só entra na margem líquida, e a grade alerta se essa líquida fica abaixo do mínimo. No RX também entram o ajuste fino de desconto, o piso de margem crítica e a folga abaixo do PMC.",
      },
    ],
  },
  {
    titulo: "Conceitos",
    subtitulo: "Termos que aparecem nas etapas.",
    itens: [
      {
        pergunta: "O que é o PMC?",
        resposta:
          "O PMC é o Preço Máximo ao Consumidor definido pela CMED. É o teto legal: nenhum medicamento pode ser vendido acima dele.",
      },
      {
        pergunta: "O que é a faixa de preço?",
        resposta:
          "A faixa de preço separa os itens do departamento em cinco grupos pelo PMC. A Faixa 5 reúne os 20% mais caros, e a Faixa 1 os 20% mais baratos.",
      },
      {
        pergunta: "O que é a cronicidade?",
        resposta:
          "Cronicidade é a frequência de uso do medicamento: eventual, frequente ou crônico. Quem compra todo mês compara o preço com mais atenção.",
      },
      {
        pergunta: "O que é a sensibilidade?",
        resposta:
          "Sensibilidade junta a faixa de preço, quão caro o item é no departamento, com a cronicidade, o uso eventual, frequente ou crônico. Super Sensível pede preço competitivo; Pouco Sensível permite mais margem.",
      },
      {
        pergunta: "O que é o cluster composto?",
        resposta:
          "O cluster composto é o perfil da loja em cada departamento: Alta, Moderado ou Baixa. A mesma loja pode ser Alta em Marca e Baixa em Similar.",
      },
      {
        pergunta: "O que é a pesquisa base?",
        resposta:
          "A pesquisa base é a rodada de coleta usada como referência. A clusterização e a simulação leem a mesma pesquisa base.",
      },
      {
        pergunta: "O que é um outlier?",
        resposta:
          "Outlier é um preço retirado da conta para um erro de coleta não puxar o resultado. Saem preços acima do PMC, amostras de uma loja só e valores fora do intervalo da maioria, com folga de 1,5.",
      },
      {
        pergunta: "O que é o farol?",
        resposta:
          "O farol limita o quanto o preço pode subir ou cair de uma vez em relação ao preço atual. Isso evita um choque grande na prateleira e no caixa.",
      },
      {
        pergunta: "O que é a margem líquida?",
        resposta:
          "A margem líquida é a margem bruta exibida menos a alíquota de impostos. A grade alerta quando ela fica abaixo da margem mínima. A alíquota não altera o preço.",
      },
      {
        pergunta: "O que é a margem crítica?",
        resposta:
          "A margem crítica é o piso de proteção da margem. Se o preço calculado deixar a margem abaixo desse piso, o sistema recompõe o preço para custo ÷ (1 − margem crítica).",
      },
    ],
  },
];
</script>
