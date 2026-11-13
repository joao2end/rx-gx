# Base falsa de teste

Dados inventados para percorrer RX e GX sem as planilhas. A fonte editável é `seeds/gerar.py`. Rodar o script grava o mesmo JSON em `seeds/data/` e em `public/mock/`, que é o que o app lê.

```bash
python seeds/gerar.py
```

O app usa essa base por padrão (`NUXT_PUBLIC_DATA_BASE=/mock`). Para voltar ao extrato das planilhas, suba com `NUXT_PUBLIC_DATA_BASE=/data`.

O que a base cobre:

- `rede.json` — 4 lojas com código e CNPJ (MANEJO, CENTRO, TIJUCA, BANGU), clusters Alta, Moderado, Baixa e o cluster Centro, concorrentes RETIRO, RAIA, POVÃO, MODERNA e PACHECO ligados às pesquisas.
- `pesquisa-competitiva.json` — coletas RX com ID, EAN, preço, desconto e concorrente.
- `rx-simulador.json` e `gx-simulador.json` — SKUs e parâmetros para a simulação calcular receita, lucro, margem, desconto, IC e impacto anual.
- `sensibilidade.json`, `lista-pesquisa.json`, `gx-selecao-p1.json` — sensibilidade, lista e seleção P1 no mesmo formato do extrato.
- `resultados-esperados.json` — totais de entrada para conferência. A tela de Resultados recalcula os números simulados.
