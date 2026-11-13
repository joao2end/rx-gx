import collections
import json
import os

import openpyxl

BASE = os.path.dirname(os.path.abspath(__file__))
ORIGINAIS = os.path.join(BASE, "originais")
SAIDA = os.path.join(BASE, "inventario.json")
CHAVES_LOJA = ("LOJA", "FILIAL", "CLUSTER", "UF", "CNPJ", "CONCORRENTE", "REDE")
LINHAS_CABECALHO = 7
MAX_DISTINTOS = 50


def texto(valor):
    return str(valor).strip() if valor is not None else ""


inventario = []
for nome in sorted(os.listdir(ORIGINAIS)):
    if not nome.lower().endswith(".xlsx"):
        continue
    print(f"Lendo {nome}...")
    wb = openpyxl.load_workbook(os.path.join(ORIGINAIS, nome), read_only=True, data_only=True)
    abas = []
    for ws in wb.worksheets:
        cabecalho = []
        colunas_loja = []
        for ri, linha in enumerate(ws.iter_rows(min_row=1, max_row=LINHAS_CABECALHO, values_only=True), 1):
            celulas = {ci: texto(v) for ci, v in enumerate(linha or []) if isinstance(v, str) and texto(v)}
            if celulas:
                cabecalho.append({"linha": ri, "celulas": celulas})
            for ci, v in celulas.items():
                if any(k in v.upper() for k in CHAVES_LOJA):
                    colunas_loja.append((ri, ci, v))
        distintos = []
        for ri, ci, rotulo in colunas_loja:
            contagem = collections.Counter()
            for (valor,) in ws.iter_rows(min_row=ri + 1, min_col=ci + 1, max_col=ci + 1, values_only=True):
                if valor is not None and texto(valor):
                    contagem[texto(valor)] += 1
            distintos.append({
                "linhaCabecalho": ri,
                "coluna": ci,
                "rotulo": rotulo,
                "qtdDistintos": len(contagem),
                "valores": dict(contagem.most_common(MAX_DISTINTOS)),
            })
        abas.append({
            "aba": ws.title,
            "linhas": ws.max_row,
            "colunas": ws.max_column,
            "cabecalho": cabecalho,
            "colunasLojaClusterUf": distintos,
        })
    wb.close()
    inventario.append({
        "arquivo": nome,
        "bytes": os.path.getsize(os.path.join(ORIGINAIS, nome)),
        "abas": abas,
    })

with open(SAIDA, "w", encoding="utf-8") as f:
    json.dump(inventario, f, ensure_ascii=False, indent=2)
print(f"Inventário salvo em {SAIDA}")
