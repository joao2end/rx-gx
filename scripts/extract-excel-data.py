import json
import math
import os
import openpyxl

DOWNLOADS = "C:/Users/jhonx/Downloads"
OUT_DIR = "C:/Users/jhonx/Projetos/princing-gx-rx/public/data"
os.makedirs(OUT_DIR, exist_ok=True)


def clean_num(val, decimals=6):
    if val is None or val == "" or isinstance(val, str):
        return None
    if isinstance(val, bool):
        return val
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return round(f, decimals)
    except Exception:
        return None


def clean_str(val):
    if val is None:
        return ""
    return str(val).strip()


print("1/6 Extracting RX_Sensibilidade.xlsx...")
wb = openpyxl.load_workbook(f"{DOWNLOADS}/RX_Sensibilidade.xlsx", read_only=True, data_only=True)
ws_bases = wb["Bases"]
classes_cronicidade = []
faixas_quintis = []
for r_idx, row in enumerate(ws_bases.iter_rows(min_row=2, max_row=25, max_col=20, values_only=True), 2):
    if len(row) >= 12 and row[10] and row[11] and r_idx >= 2:
        cat = clean_str(row[10])
        cron = clean_str(row[11])
        if cat and cat != "CLASSE TERAPÊUTICA":
            classes_cronicidade.append({"categoria": cat, "cronicidade": cron})
    if r_idx >= 4 and len(row) >= 7 and row[1] is not None and row[6]:
        faixas_quintis.append({
            "quintil": int(row[1]),
            "faixa": clean_str(row[2]),
            "inicio": clean_num(row[3], 2),
            "fim": clean_num(row[4], 2),
            "qtd": int(row[5] or 0),
            "departamento": clean_str(row[6]),
        })

ws_prod_sens = wb["Produtos"]
sens_summary = {}
total_sens_skus = 0
for row in ws_prod_sens.iter_rows(min_row=2, values_only=True):
    if not row or row[0] is None:
        continue
    total_sens_skus += 1
    dept = clean_str(row[5])
    faixa = clean_str(row[23]) if len(row) > 23 else ""
    cron = clean_str(row[24]) if len(row) > 24 else ""
    sens = clean_str(row[25]) if len(row) > 25 else ""
    rec = clean_num(row[20], 2) or 0
    key = f"{dept}|{faixa}|{cron}"
    if key not in sens_summary:
        sens_summary[key] = {"departamento": dept, "faixa": faixa, "cronicidade": cron, "sensibilidade": sens, "skus": 0, "receita12m": 0.0}
    sens_summary[key]["skus"] += 1
    sens_summary[key]["receita12m"] = round(sens_summary[key]["receita12m"] + rec, 2)
wb.close()

with open(f"{OUT_DIR}/sensibilidade.json", "w", encoding="utf-8") as f:
    json.dump({
        "totalSkus": total_sens_skus,
        "classesCronicidade": classes_cronicidade,
        "faixasQuintis": faixas_quintis,
        "matrizSensibilidade": {
            "FAIXA 5": {"EVENTUAL": "Sensível", "FREQUENTE": "Super Sensível", "CRONICO": "Super Sensível"},
            "FAIXA 4": {"EVENTUAL": "Sensível", "FREQUENTE": "Sensível", "CRONICO": "Super Sensível"},
            "FAIXA 3": {"EVENTUAL": "Pouco Sensível", "FREQUENTE": "Sensível", "CRONICO": "Super Sensível"},
            "FAIXA 2": {"EVENTUAL": "Pouco Sensível", "FREQUENTE": "Pouco Sensível", "CRONICO": "Sensível"},
            "FAIXA 1": {"EVENTUAL": "Pouco Sensível", "FREQUENTE": "Pouco Sensível", "CRONICO": "Sensível"},
        },
        "distribuicao": list(sens_summary.values()),
    }, f, ensure_ascii=False)

print("2/6 Extracting Gx_P1.xlsx & Gx_Seleção P1.xlsx...")
wb_sel = openpyxl.load_workbook(f"{DOWNLOADS}/Gx_Seleção P1.xlsx", read_only=True, data_only=True)
ws_sel = wb_sel["Base Seleção"]
sel_map = {}
max_p_default = 3
for r_idx, row in enumerate(ws_sel.iter_rows(min_row=2, values_only=True), 2):
    if not row or row[0] is None:
        continue
    if r_idx == 2 and len(row) > 15 and row[15] is not None:
        max_p_default = int(row[15])
    pid = str(int(row[0])) if isinstance(row[0], (int, float)) else clean_str(row[0])
    sel_map[pid] = {
        "indexChave": int(row[1]) if row[1] is not None else 9999,
        "sugestao": clean_str(row[10]),
        "overrideP": int(row[12]) if len(row) > 12 and isinstance(row[12], (int, float)) else None,
        "pFim": int(row[13]) if len(row) > 13 and isinstance(row[13], (int, float)) else None,
    }
wb_sel.close()

wb_p1 = openpyxl.load_workbook(f"{DOWNLOADS}/Gx_P1.xlsx", read_only=True, data_only=True)
ws_p1 = wb_p1["Base"]
gx_p1_items = []
for row in ws_p1.iter_rows(min_row=2, values_only=True):
    if not row or row[0] is None:
        continue
    pid = str(int(row[0])) if isinstance(row[0], (int, float)) else clean_str(row[0])
    s_info = sel_map.get(pid, {})
    gx_p1_items.append({
        "produtoId": pid,
        "produto": clean_str(row[1]),
        "chave": clean_str(row[2]),
        "fabricante": clean_str(row[3]),
        "fabricantePlug": clean_str(row[4]),
        "pmc": clean_num(row[5], 2) or 0,
        "precoAtual": clean_num(row[6], 2) or 0,
        "custoAtual": clean_num(row[7], 4) or 0,
        "estoqueAtual": int(row[9] or 0),
        "coberturaLojas": clean_num(row[10], 4) or 0,
        "receita3m": clean_num(row[11], 2) or 0,
        "custo3m": clean_num(row[12], 2) or 0,
        "qtd3m": int(row[13] or 0),
        "receita12m": clean_num(row[14], 2) or 0,
        "qtd12m": int(row[16] or 0),
        "scoreQtd": clean_num(row[17], 4) or 0,
        "scoreCusto": clean_num(row[18], 4) or 0,
        "scoreFinal": clean_num(row[19], 4) or 0,
        "indexChave": s_info.get("indexChave", 9999),
        "sugestao": s_info.get("sugestao", ""),
        "overrideP": s_info.get("overrideP"),
        "pFim": s_info.get("pFim"),
    })
wb_p1.close()

# Also add any items in Gx_Seleção P1 that had high rank (top chaves) if not in Gx_P1
existing_pids = {x["produtoId"] for x in gx_p1_items}
wb_sel2 = openpyxl.load_workbook(f"{DOWNLOADS}/Gx_Seleção P1.xlsx", read_only=True, data_only=True)
ws_sel2 = wb_sel2["Base Seleção"]
for row in ws_sel2.iter_rows(min_row=2, values_only=True):
    if not row or row[0] is None:
        continue
    pid = str(int(row[0])) if isinstance(row[0], (int, float)) else clean_str(row[0])
    if pid not in existing_pids:
        gx_p1_items.append({
            "produtoId": pid,
            "produto": f"{clean_str(row[2])} ({clean_str(row[4])})",
            "chave": clean_str(row[2]),
            "fabricante": clean_str(row[3]),
            "fabricantePlug": clean_str(row[4]),
            "pmc": 0,
            "precoAtual": 0,
            "custoAtual": clean_num(row[8], 4) or 0,
            "estoqueAtual": int(row[9] or 0),
            "coberturaLojas": clean_num(row[5], 4) or 0,
            "receita3m": clean_num(row[6], 2) or 0,
            "custo3m": 0,
            "qtd3m": int(row[7] or 0),
            "receita12m": round((clean_num(row[6], 2) or 0) * 4, 2),
            "qtd12m": int((row[7] or 0) * 4),
            "scoreQtd": 0,
            "scoreCusto": 0,
            "scoreFinal": 0,
            "indexChave": int(row[1]) if row[1] is not None else 9999,
            "sugestao": clean_str(row[10]),
            "overrideP": int(row[12]) if len(row) > 12 and isinstance(row[12], (int, float)) else None,
            "pFim": int(row[13]) if len(row) > 13 and isinstance(row[13], (int, float)) else None,
        })
wb_sel2.close()

with open(f"{OUT_DIR}/gx-selecao-p1.json", "w", encoding="utf-8") as f:
    json.dump({
        "pesosDefault": {"cobertura": 0.35, "quantidade": 0.45, "custo": 0.20},
        "maxPDefault": max_p_default,
        "itens": gx_p1_items,
    }, f, ensure_ascii=False)

print(f"   -> Saved {len(gx_p1_items)} GX lab items.")

print("3/6 Extracting RX_Lista de Pesquisa.xlsx...")
wb_lp = openpyxl.load_workbook(f"{DOWNLOADS}/RX_Lista de Pesquisa.xlsx", read_only=True, data_only=True)
lista_candidatos = []
# Extract top 250 by revenue/selection per sheet so UI is super responsive while keeping 100% of selected + top candidates
for sname in ["MARCA", "PROPAGADO", "SIMILAR"]:
    ws = wb_lp[sname]
    rows_sheet = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or row[0] is None:
            continue
        sel_final = int(row[50]) if len(row) > 50 and isinstance(row[50], (int, float)) else 0
        sel_ajustes = int(row[47]) if len(row) > 47 and isinstance(row[47], (int, float)) else 0
        sel_manual = int(row[49]) if len(row) > 49 and isinstance(row[49], (int, float)) else None
        rows_sheet.append({
            "id": str(int(row[0])) if isinstance(row[0], (int, float)) else clean_str(row[0]),
            "descricao": clean_str(row[1]),
            "departamento": clean_str(row[2]),
            "categoria": clean_str(row[3]),
            "faixa": clean_str(row[4]),
            "cronicidade": clean_str(row[5]),
            "sensibilidade": clean_str(row[6]),
            "fabricante": clean_str(row[7]),
            "receita": clean_num(row[8], 2) or 0,
            "quantidade": int(row[9] or 0),
            "pmc": clean_num(row[10], 2) or 0,
            "pbm": clean_str(row[11]) == "S",
            "marcaPropria": clean_str(row[12]) == "S",
            "farmaciaPopular": clean_str(row[13]) == "S",
            "precoTabelado": clean_str(row[14]) == "S",
            "origemExcel": clean_str(row[48]) if len(row) > 48 else "",
            "selecaoManual": sel_manual,
            "selecaoFinalExcel": sel_final == 1,
            "selecaoAutoExcel": sel_ajustes == 1,
        })
    # Keep all selected or manual + top 180 by revenue
    selected = [x for x in rows_sheet if x["selecaoFinalExcel"] or x["selecaoAutoExcel"] or x["selecaoManual"] is not None]
    sel_ids = {x["id"] for x in selected}
    rest = sorted([x for x in rows_sheet if x["id"] not in sel_ids], key=lambda x: x["receita"], reverse=True)[:180]
    lista_candidatos.extend(selected + rest)

ws_gx_lp = wb_lp["GENÉRICO"]
gx_lp_rows = []
for row in ws_gx_lp.iter_rows(min_row=2, values_only=True):
    if not row or row[0] is None:
        continue
    sel_final = int(row[50]) if len(row) > 50 and isinstance(row[50], (int, float)) else 0
    sel_ajustes = int(row[47]) if len(row) > 47 and isinstance(row[47], (int, float)) else 0
    sel_manual = int(row[49]) if len(row) > 49 and isinstance(row[49], (int, float)) else None
    gx_lp_rows.append({
        "id": clean_str(row[0]),
        "descricao": clean_str(row[0]),
        "departamento": "GENERICO",
        "categoria": clean_str(row[3]),
        "faixa": clean_str(row[4]),
        "cronicidade": clean_str(row[5]),
        "sensibilidade": clean_str(row[6]),
        "fabricante": "CHAVE GENÉRICO (P1 CONCORRENTE)",
        "receita": clean_num(row[11], 2) or 0,
        "quantidade": int(row[12] or 0),
        "pmc": clean_num(row[13], 2) or 0,
        "precoTabelado": clean_str(row[7]) == "S",
        "farmaciaPopular": clean_str(row[8]) == "S",
        "marcaPropria": clean_str(row[9]) == "S",
        "pbm": clean_str(row[10]) == "S",
        "origemExcel": clean_str(row[48]) if len(row) > 48 else "",
        "selecaoManual": sel_manual,
        "selecaoFinalExcel": sel_final == 1,
        "selecaoAutoExcel": sel_ajustes == 1,
    })
selected_gx = [x for x in gx_lp_rows if x["selecaoFinalExcel"] or x["selecaoAutoExcel"] or x["selecaoManual"] is not None]
sel_gx_ids = {x["id"] for x in selected_gx}
rest_gx = sorted([x for x in gx_lp_rows if x["id"] not in sel_gx_ids], key=lambda x: x["receita"], reverse=True)[:180]
lista_candidatos.extend(selected_gx + rest_gx)
wb_lp.close()

with open(f"{OUT_DIR}/lista-pesquisa.json", "w", encoding="utf-8") as f:
    json.dump({
        "parametrosDefault": {
            "GENERICO": {"pesoReceita": 0.7, "pesoQuantidade": 0.3, "qtdMeta": 30, "pbm": True, "farmaciaPopular": True, "marcaPropria": True, "precoTabelado": True, "precoMaximo": 450.0},
            "MARCA": {"pesoReceita": 0.7, "pesoQuantidade": 0.3, "qtdMeta": 20, "pbm": True, "farmaciaPopular": True, "marcaPropria": True, "precoTabelado": True, "precoMaximo": 450.0},
            "PROPAGADO": {"pesoReceita": 0.7, "pesoQuantidade": 0.3, "qtdMeta": 20, "pbm": True, "farmaciaPopular": True, "marcaPropria": True, "precoTabelado": True, "precoMaximo": 450.0},
            "SIMILAR": {"pesoReceita": 0.7, "pesoQuantidade": 0.3, "qtdMeta": 20, "pbm": True, "farmaciaPopular": True, "marcaPropria": True, "precoTabelado": True, "precoMaximo": 450.0},
        },
        "candidatos": lista_candidatos,
    }, f, ensure_ascii=False)
print(f"   -> Saved {len(lista_candidatos)} research list candidates.")

print("4/6 Extracting RX_Pesquisa.xlsx...")
wb_pesq = openpyxl.load_workbook(f"{DOWNLOADS}/RX_Pesquisa.xlsx", read_only=True, data_only=True)
ws_ms = wb_pesq["Marca_e_Similar"]
coletas_rx = []
for row in ws_ms.iter_rows(min_row=2, values_only=True):
    if not row or row[0] is None:
        continue
    coletas_rx.append({
        "produtoId": clean_str(row[0]),
        "ean": clean_str(row[1]),
        "produto": clean_str(row[2]),
        "fabricante": clean_str(row[3]),
        "departamento": clean_str(row[6]),
        "categoria": clean_str(row[7]),
        "faixa": clean_str(row[8]),
        "cronicidade": clean_str(row[9]),
        "sensibilidade": clean_str(row[10]),
        "receita": clean_num(row[14], 2) or 0,
        "quantidade": int(row[15] or 0),
        "pmc": clean_num(row[16], 2) or 0,
        "precoRedeMed": clean_num(row[25], 2) or 0,
        "loja": clean_str(row[19]),
        "concorrente": clean_str(row[20]),
        "tipoConc": clean_str(row[29]),
        "precoConc": clean_num(row[21], 2) or 0,
        "descConc": clean_num(row[22], 6) or 0,
        "descRedeMed": clean_num(row[26], 6) or 0,
        "flagValido": int(row[30] or 0) == 1,
    })
wb_pesq.close()

print("5/6 Extracting RX_Simulador 260804 Final.xlsx...")
wb_rx = openpyxl.load_workbook(f"{DOWNLOADS}/RX_Simulador 260804 Final.xlsx", read_only=True, data_only=True)

# Extract Matriz Desc (135 rows unpivoted in cols 46..51 + also check calculated vs manual)
ws_md = wb_rx["Matriz Desc"]
matriz_rx = []
for row in ws_md.iter_rows(min_row=2, max_row=136, values_only=True):
    if len(row) >= 50 and row[45] and row[46]:
        matriz_rx.append({
            "departamento": clean_str(row[45]),
            "conc": clean_str(row[46]),
            "faixa": clean_str(row[47]),
            "cronicidade": clean_str(row[48]),
            "desconto": clean_num(row[49], 6) if row[49] != "" else None,
        })

# Extract Pesquisa Top products in RX_Simulador
ws_rx_pesq = wb_rx["Pesquisa"]
rx_top_pesquisa = {}
rx_online_flag = {}
for row in ws_rx_pesq.iter_rows(min_row=2, values_only=True):
    if row and row[1] is not None and row[0] is not None:
        pid = str(int(row[1])) if isinstance(row[1], (int, float)) else clean_str(row[1])
        rx_top_pesquisa[pid] = {
            "produto": clean_str(row[0]),
            "TODOS": clean_num(row[2], 6),
            "INDEP": clean_num(row[3], 6),
            "ABRAF": clean_num(row[4], 6),
        }
    if row and len(row) > 22 and row[19] is not None:
        pid2 = str(int(row[19])) if isinstance(row[19], (int, float)) else clean_str(row[19])
        rx_online_flag[pid2] = clean_num(row[22], 6)

ws_rx_an = wb_rx["Análise"]
rx_skus = []
for row in ws_rx_an.iter_rows(min_row=7, values_only=True):
    if not row or row[3] is None:
        continue
    pid = str(int(row[3])) if isinstance(row[3], (int, float)) else clean_str(row[3])
    # Note: In RX_Simulador Análise, col I (idx 8) has header 'CRONICIDADE' but value 'FAIXA 5', and col J (idx 9) has header 'FAIXA DE PREÇO' but value 'EVENTUAL'!
    val_i = clean_str(row[8])
    val_j = clean_str(row[9])
    faixa = val_i if val_i.startswith("FAIXA") else val_j
    cronicidade = val_j if not val_j.startswith("FAIXA") else val_i
    rx_skus.append({
        "cluster": clean_str(row[1]),
        "produtoId": pid,
        "descricao": clean_str(row[4]),
        "divisao": clean_str(row[5]),
        "departamento": clean_str(row[6]),
        "categoria": clean_str(row[7]),
        "faixa": faixa,
        "cronicidade": cronicidade,
        "laboratorio": clean_str(row[10]),
        "qtd1m": clean_num(row[11], 4) or 0,
        "receita1m": clean_num(row[12], 4) or 0,
        "custo1m": clean_num(row[13], 4) or 0,
        "tributos": clean_num(row[15], 4) or 0,
        "precoTabelado": clean_num(row[16], 2),
        "marcaPropria": clean_str(row[17]) == "S",
        "pbm": clean_str(row[18]) == "S",
        "farmaciaPopular": clean_str(row[19]) == "S",
        "sensibilidade": clean_str(row[20]),
        "custo": clean_num(row[21], 4) or 0,
        "custoComComissao": clean_num(row[22], 4) or 0,
        "pmc": clean_num(row[23], 2) or 0,
        "precoAtual": clean_num(row[24], 2) or 0,
        "tipoPrecificacao": clean_str(row[25]),
        "descTodosExcel": clean_num(row[26], 6),
        "descAbrafExcel": clean_num(row[27], 6),
        "descIndepExcel": clean_num(row[28], 6),
        "ajusteManual": clean_num(row[41], 2),
        "seguir": clean_str(row[43]) != "NÃO",
        "precoFinalExcel": clean_num(row[44], 2),
    })
wb_rx.close()

with open(f"{OUT_DIR}/rx-simulador.json", "w", encoding="utf-8") as f:
    json.dump({
        "cockpitDefault": {
            "politicaPesquisa": {
                "Cluster Alta": {"MARCA": "TODOS", "PROPAGADO": "TODOS", "SIMILAR": "TODOS"},
                "Cluster": {"MARCA": "ABRAF", "PROPAGADO": "TODOS", "SIMILAR": "INDEP"},
            },
            "politicaMatriz": {
                "Cluster Alta": {"MARCA": "TODOS", "PROPAGADO": "TODOS", "SIMILAR": "TODOS"},
                "Cluster": {"MARCA": "ABRAF", "PROPAGADO": "TODOS", "SIMILAR": "INDEP"},
            },
            "ajusteDesconto": {
                "MARCA": {
                    "Cluster Alta": {"TOP PRODUTOS": 0, "Pouco Sensível": 0, "Sensível": 0, "Super Sensível": 0},
                    "Cluster": {"TOP PRODUTOS": 0.02, "Pouco Sensível": -0.10, "Sensível": 0, "Super Sensível": 0.01},
                },
                "PROPAGADO": {
                    "Cluster Alta": {"TOP PRODUTOS": 0, "Pouco Sensível": 0, "Sensível": 0, "Super Sensível": 0},
                    "Cluster": {"TOP PRODUTOS": 0.02, "Pouco Sensível": -0.10, "Sensível": 0, "Super Sensível": 0.01},
                },
                "SIMILAR": {
                    "Cluster Alta": {"TOP PRODUTOS": 0, "Pouco Sensível": 0, "Sensível": 0, "Super Sensível": 0},
                    "Cluster": {"TOP PRODUTOS": 0.05, "Pouco Sensível": -0.20, "Sensível": 0, "Super Sensível": 0.03},
                },
            },
            "descontoMinimo": {
                "Super Sensível": {"MARCA": 0.049, "PROPAGADO": 0.049, "SIMILAR": 0.049},
                "Sensível": {"MARCA": 0.049, "PROPAGADO": 0.049, "SIMILAR": 0.049},
                "Pouco Sensível": {"MARCA": 0.049, "PROPAGADO": 0.049, "SIMILAR": 0.049},
            },
            "margemCritica": {
                "TOP PRODUTOS": {"MARCA": 0.08, "PROPAGADO": 0.08, "SIMILAR": 0.30},
                "Super Sensível": {"MARCA": 0.10, "PROPAGADO": 0.10, "SIMILAR": 0.40},
                "Sensível": {"MARCA": 0.12, "PROPAGADO": 0.12, "SIMILAR": 0.45},
                "Pouco Sensível": {"MARCA": 0.20, "PROPAGADO": 0.20, "SIMILAR": 0.50},
            },
            "farolVariacao": {
                "PESQUISA": {"limiar": 0.0, "indiferenca": 0.0},
                "MATRIZ": {"limiar": 0.30, "indiferenca": 0.0},
                "DESC MÍNIMO": {"limiar": 0.25, "indiferenca": 0.0},
            },
            "fatorPmc": 0.0,
        },
        "matrizDesconto": matriz_rx,
        "topPesquisa": rx_top_pesquisa,
        "skus": rx_skus,
    }, f, ensure_ascii=False)
print(f"   -> Saved {len(rx_skus)} RX simulator SKUs and {len(matriz_rx)} matrix cells.")

print("6/6 Extracting Gx_Simulador 260928 v4 - final.xlsx...")
wb_gx = openpyxl.load_workbook(f"{DOWNLOADS}/Gx_Simulador 260928 v4 - final.xlsx", read_only=True, data_only=True)

# Pesquisa Manual & Internet in GX
ws_gx_pesq = wb_gx["Pesquisa"]
gx_pesq_manual = {}
gx_pesq_internet = {}
for r_idx, row in enumerate(ws_gx_pesq.iter_rows(min_row=2, values_only=True), 2):
    if not row:
        continue
    if row[0] and row[1]:
        chave = clean_str(row[0])
        medida = clean_str(row[1])  # MAX, MED, MIN
        if chave not in gx_pesq_manual:
            gx_pesq_manual[chave] = {}
        gx_pesq_manual[chave][medida] = {
            "TODOS": clean_num(row[2], 4),
            "INDEP": clean_num(row[3], 4),
            "ABRAF": clean_num(row[4], 4),
        }
    if len(row) > 22 and row[19]:
        chave_int = clean_str(row[19])
        gx_pesq_internet[chave_int] = {
            "MED": clean_num(row[20], 4),
            "MIN": clean_num(row[21], 4),
            "MAX": clean_num(row[22], 4),
        }

# Preço Chave P1 manual overrides
ws_pcp1 = wb_gx["Preço Chave P1"]
chave_p1_manual = {}
for row in ws_pcp1.iter_rows(min_row=2, values_only=True):
    if row and len(row) > 5 and row[2] and row[5] is not None and row[5] != "":
        c_val = clean_num(row[5], 2)
        if c_val is not None:
            chave_p1_manual[clean_str(row[2])] = c_val

# P1 sheet
ws_gx_p1 = wb_gx["P1"]
gx_p1_rows = []
for row in ws_gx_p1.iter_rows(min_row=7, values_only=True):
    if not row or row[5] is None:
        continue
    pid = str(int(row[5])) if isinstance(row[5], (int, float)) else clean_str(row[5])
    gx_p1_rows.append({
        "uf": clean_str(row[1]),
        "cluster": clean_str(row[2]),
        "chave": clean_str(row[4]),
        "produtoId": pid,
        "descricao": clean_str(row[6]),
        "categoria": clean_str(row[9]),
        "faixa": clean_str(row[10]),
        "cronicidade": clean_str(row[11]),
        "laboratorio": clean_str(row[12]),
        "qtd1m": clean_num(row[13], 4) or 0,
        "receita1m": clean_num(row[14], 4) or 0,
        "custo1m": clean_num(row[15], 4) or 0,
        "tributos": clean_num(row[17], 4) or 0,
        "precoTabelado": clean_num(row[18], 2),
        "marcaPropria": clean_str(row[19]) == "S",
        "pbm": clean_str(row[20]) == "S",
        "farmaciaPopular": clean_str(row[21]) == "S",
        "sensibilidade": clean_str(row[22]),
        "custo": clean_num(row[23], 4) or 0,
        "custoComComissao": clean_num(row[24], 4) or 0,
        "pmc": clean_num(row[25], 2) or 0,
        "precoAtual": clean_num(row[26], 2) or 0,
        "tipoPrecificacao": clean_str(row[27]),
        "ajusteManualP1": clean_num(row[44], 2),
        "precoFimP1Excel": clean_num(row[45], 2),
    })

# Análise sheet (all Ps)
ws_gx_an = wb_gx["Análise"]
gx_skus = []
for row in ws_gx_an.iter_rows(min_row=7, values_only=True):
    if not row or row[5] is None:
        continue
    pid = str(int(row[5])) if isinstance(row[5], (int, float)) else clean_str(row[5])
    gx_skus.append({
        "uf": clean_str(row[1]),
        "cluster": clean_str(row[2]),
        "chave": clean_str(row[4]),
        "produtoId": pid,
        "descricao": clean_str(row[6]),
        "categoria": clean_str(row[9]),
        "faixa": clean_str(row[10]),
        "cronicidade": clean_str(row[11]),
        "laboratorio": clean_str(row[12]),
        "qtd1m": clean_num(row[13], 4) or 0,
        "receita1m": clean_num(row[14], 4) or 0,
        "custo1m": clean_num(row[15], 4) or 0,
        "tributos": clean_num(row[17], 4) or 0,
        "precoTabelado": clean_num(row[18], 2),
        "marcaPropria": clean_str(row[19]) == "S",
        "farmaciaPopular": clean_str(row[20]) == "S",
        "pbm": clean_str(row[21]) == "S",
        "sensibilidade": clean_str(row[22]),
        "custo": clean_num(row[23], 4) or 0,
        "custoComComissao": clean_num(row[24], 4) or 0,
        "pmc": clean_num(row[25], 2) or 0,
        "precoAtual": clean_num(row[26], 2) or 0,
        "ordemPreco": clean_str(row[27]),
        "tipoPrecificacao": clean_str(row[28]),
        "precoP1ManualLinha": clean_num(row[30], 2),
        "seguirPrecoP1": bool(row[50]),
        "ajusteManual": clean_num(row[51], 2),
        "seguir": clean_str(row[53]) != "NÃO",
        "precoFinalExcel": clean_num(row[54], 2),
    })
wb_gx.close()

with open(f"{OUT_DIR}/pesquisa-competitiva.json", "w", encoding="utf-8") as f:
    json.dump({
        "concorrentes": [
            {"id": "RAIA", "nome": "Drogasil / Raia", "tipo": "ABRAF", "uf": "RJ", "lojasMapeadas": 11, "distanciaMediaKm": 0.4},
            {"id": "PACHECO", "nome": "Drogarias Pacheco", "tipo": "ABRAF", "uf": "RJ", "lojasMapeadas": 11, "distanciaMediaKm": 0.5},
            {"id": "MODERNA", "nome": "Drogaria Moderna", "tipo": "INDEP", "uf": "RJ", "lojasMapeadas": 9, "distanciaMediaKm": 0.6},
            {"id": "POVÃO", "nome": "Farmácia Povão", "tipo": "INDEP", "uf": "RJ", "lojasMapeadas": 8, "distanciaMediaKm": 0.8},
            {"id": "RETIRO", "nome": "Drogaria Retiro", "tipo": "INDEP", "uf": "RJ", "lojasMapeadas": 7, "distanciaMediaKm": 1.1},
            {"id": "ULTRA", "nome": "Drogaria Ultra Popular", "tipo": "INDEP", "uf": "RJ", "lojasMapeadas": 6, "distanciaMediaKm": 1.4},
        ],
        "coletasRx": coletas_rx,
        "gxPesqManual": gx_pesq_manual,
        "gxPesqInternetCount": len(gx_pesq_internet),
    }, f, ensure_ascii=False)

with open(f"{OUT_DIR}/gx-simulador.json", "w", encoding="utf-8") as f:
    json.dump({
        "cockpitDefault": {
            "farolVariacao": {
                "PESQ MANUAL": {"limiar": 0.0, "indiferenca": 0.0},
                "PESQ INTERNET": {"limiar": 0.50, "indiferenca": 0.0},
                "MARGEM OBJETIVO": {"limiar": 0.50, "indiferenca": 0.0},
            },
            "aumentoMinimo": 0.05,
            "aumentoMaximoP1": 0.50,
            "regrasPesquisa": {
                "PBM": {"PESQ MANUAL": True, "PESQ INTERNET": True, "MARGEM OBJETIVO": True},
                "Farmácia Popular": {"PESQ MANUAL": True, "PESQ INTERNET": True, "MARGEM OBJETIVO": True},
                "Marca Própria": {"PESQ MANUAL": True, "PESQ INTERNET": True, "MARGEM OBJETIVO": True},
                "Preço Tabelado": {"PESQ MANUAL": True, "PESQ INTERNET": True, "MARGEM OBJETIVO": True},
            },
            "fatorPmc": 0.0,
            "icManual": {
                "concorrencia": {
                    "FAIXA 5": {"EVENTUAL": "INDEP", "FREQUENTE": "INDEP", "CRONICO": "INDEP"},
                    "FAIXA 4": {"EVENTUAL": "INDEP", "FREQUENTE": "INDEP", "CRONICO": "INDEP"},
                    "FAIXA 3": {"EVENTUAL": "INDEP", "FREQUENTE": "INDEP", "CRONICO": "INDEP"},
                    "FAIXA 2": {"EVENTUAL": "INDEP", "FREQUENTE": "INDEP", "CRONICO": "INDEP"},
                    "FAIXA 1": {"EVENTUAL": "INDEP", "FREQUENTE": "INDEP", "CRONICO": "INDEP"},
                },
                "balizador": {
                    "FAIXA 5": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 4": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 3": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 2": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 1": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                },
                "politicaIc": {
                    "FAIXA 5": {"EVENTUAL": 0.97, "FREQUENTE": 0.97, "CRONICO": 0.96},
                    "FAIXA 4": {"EVENTUAL": 0.98, "FREQUENTE": 0.98, "CRONICO": 0.97},
                    "FAIXA 3": {"EVENTUAL": 0.99, "FREQUENTE": 0.99, "CRONICO": 0.98},
                    "FAIXA 2": {"EVENTUAL": 1.00, "FREQUENTE": 1.00, "CRONICO": 0.99},
                    "FAIXA 1": {"EVENTUAL": 1.05, "FREQUENTE": 1.02, "CRONICO": 1.00},
                },
            },
            "icInternet": {
                "balizador": {
                    "FAIXA 5": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 4": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 3": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 2": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                    "FAIXA 1": {"EVENTUAL": "MED", "FREQUENTE": "MED", "CRONICO": "MED"},
                },
                "politicaIc": {
                    "FAIXA 5": {"EVENTUAL": 0.97, "FREQUENTE": 0.97, "CRONICO": 0.96},
                    "FAIXA 4": {"EVENTUAL": 0.98, "FREQUENTE": 0.98, "CRONICO": 0.97},
                    "FAIXA 3": {"EVENTUAL": 1.07, "FREQUENTE": 0.99, "CRONICO": 0.98},
                    "FAIXA 2": {"EVENTUAL": 1.10, "FREQUENTE": 1.00, "CRONICO": 0.99},
                    "FAIXA 1": {"EVENTUAL": 1.15, "FREQUENTE": 1.02, "CRONICO": 1.00},
                },
            },
            "margemObjetivo": {
                "FAIXA 5": {"EVENTUAL": 0.50, "FREQUENTE": 0.40, "CRONICO": 0.40},
                "FAIXA 4": {"EVENTUAL": 0.50, "FREQUENTE": 0.50, "CRONICO": 0.40},
                "FAIXA 3": {"EVENTUAL": 0.60, "FREQUENTE": 0.50, "CRONICO": 0.40},
                "FAIXA 2": {"EVENTUAL": 0.60, "FREQUENTE": 0.60, "CRONICO": 0.50},
                "FAIXA 1": {"EVENTUAL": 0.60, "FREQUENTE": 0.60, "CRONICO": 0.50},
            },
            "margemSemPmc": {"EVENTUAL": 0.68, "FREQUENTE": 0.56, "CRONICO": 0.50},
            "margemCritica": {
                "PESQ MANUAL": {
                    "FAIXA 5": {"EVENTUAL": 0.40, "FREQUENTE": 0.35, "CRONICO": 0.35},
                    "FAIXA 4": {"EVENTUAL": 0.40, "FREQUENTE": 0.40, "CRONICO": 0.35},
                    "FAIXA 3": {"EVENTUAL": 0.45, "FREQUENTE": 0.40, "CRONICO": 0.35},
                    "FAIXA 2": {"EVENTUAL": 0.45, "FREQUENTE": 0.45, "CRONICO": 0.40},
                    "FAIXA 1": {"EVENTUAL": 0.45, "FREQUENTE": 0.45, "CRONICO": 0.40},
                },
                "PESQ INTERNET": {
                    "FAIXA 5": {"EVENTUAL": 0.30, "FREQUENTE": 0.25, "CRONICO": 0.25},
                    "FAIXA 4": {"EVENTUAL": 0.30, "FREQUENTE": 0.30, "CRONICO": 0.25},
                    "FAIXA 3": {"EVENTUAL": 0.35, "FREQUENTE": 0.30, "CRONICO": 0.25},
                    "FAIXA 2": {"EVENTUAL": 0.35, "FREQUENTE": 0.35, "CRONICO": 0.30},
                    "FAIXA 1": {"EVENTUAL": 0.35, "FREQUENTE": 0.35, "CRONICO": 0.30},
                },
                "MARGEM OBJETIVO": {
                    "FAIXA 5": {"EVENTUAL": 0.30, "FREQUENTE": 0.25, "CRONICO": 0.25},
                    "FAIXA 4": {"EVENTUAL": 0.30, "FREQUENTE": 0.30, "CRONICO": 0.25},
                    "FAIXA 3": {"EVENTUAL": 0.35, "FREQUENTE": 0.30, "CRONICO": 0.25},
                    "FAIXA 2": {"EVENTUAL": 0.35, "FREQUENTE": 0.35, "CRONICO": 0.30},
                    "FAIXA 1": {"EVENTUAL": 0.35, "FREQUENTE": 0.35, "CRONICO": 0.30},
                },
            },
        },
        "pesqManual": gx_pesq_manual,
        "pesqInternet": gx_pesq_internet,
        "chaveP1Manual": chave_p1_manual,
        "p1Rows": gx_p1_rows,
        "skus": gx_skus,
    }, f, ensure_ascii=False)

print(f"   -> Saved {len(gx_p1_rows)} GX P1 rows and {len(gx_skus)} GX total lab SKUs.")
print("ALL DATA EXTRACTED SUCCESSFULLY!")
