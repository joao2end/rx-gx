# Contexto das planilhas de origem (RX e GX)

Fonte de verdade dos dados da POC. As planilhas abaixo foram entregues no início do projeto e copiadas de `C:/Users/jhonx/Downloads` (datadas de 12/11/2026 09:47).

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `originais/` | Cópia íntegra das 7 planilhas `.xlsx` |
| `inventario.py` | Lê `originais/` e gera `inventario.json` |
| `inventario.json` | Abas, dimensões, cabeçalhos (linhas 1–7) e valores distintos das colunas de loja/cluster/UF/concorrente |
| `../scripts/extract-excel-data.py` | Extrator que gerou `public/data/*.json` (ainda aponta para `Downloads`) |
| `../public/data/*.json` | Dados já extraídos e consumidos pelo app — reaproveitados, não reextraídos |

## Planilha → JSON consumido pelo app

| Planilha | Abas lidas | JSON em `public/data` | Observação |
| --- | --- | --- | --- |
| `RX_Sensibilidade.xlsx` | Bases, Produtos | `sensibilidade.json` | `matrizSensibilidade` está fixa no script, não lida da planilha |
| `RX_Lista de Pesquisa.xlsx` | MARCA, PROPAGADO, SIMILAR, GENÉRICO | `lista-pesquisa.json` | Recorte: selecionados + top 180 por receita em cada aba; `parametrosDefault` fixo no script |
| `RX_Pesquisa.xlsx` | Marca_e_Similar | `pesquisa-competitiva.json` (`coletasRx`) | 194 coletas, todas da loja **MANEJO** |
| `RX_Simulador 260804 Final.xlsx` | Análise, Matriz Desc, Pesquisa | `rx-simulador.json` | 2.980 SKUs, 135 células de matriz; `cockpitDefault` fixo no script (aba COCKPIT não é lida) |
| `Gx_P1.xlsx` + `Gx_Seleção P1.xlsx` | Base, Base Seleção | `gx-selecao-p1.json` | `pesosDefault` fixo no script |
| `Gx_Simulador 260928 v4 - final.xlsx` | Pesquisa, Preço Chave P1, P1, Análise | `gx-simulador.json` | `cockpitDefault` fixo no script |

`pesquisa-competitiva.json` também traz a lista `concorrentes` com `lojasMapeadas` e `distanciaMediaKm`, que foram **escritos à mão no script** e não vêm de planilha. `ULTRA` não aparece em nenhuma coleta.

## Lojas nas planilhas

- Nome de loja só existe em `RX_Pesquisa.xlsx` › `Marca_e_Similar`, coluna `LOJA` (T): valor único **MANEJO**.
- Concorrentes coletados para MANEJO: RETIRO, POVÃO (INDEP); RAIA, PACHECO (ABRAF); MODERNA (INDEP).
- Simuladores RX e GX: um único cluster (`Cluster`) e UF `RJ`; não há coluna de loja.
- `Gx_P1` / `Gx_Seleção P1` › `cobertura_lojas`: frações de 1/11, o que indica uma rede de 11 lojas, mas **sem os nomes**.

As lojas "Loja 02" a "Loja 11" do app não vêm de planilha: são geradas em `app/composables/usePricingPoc.ts` (`lojasIniciais`) com `origem: "demonstrativo"`.

## Regenerar o inventário

```bash
cd contexto-excel
python inventario.py
```
