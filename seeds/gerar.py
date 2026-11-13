"""Gera a base falsa de teste em seeds/data e a copia servida em public/mock."""
import json
import shutil
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
SEEDS = Path(__file__).resolve().parent / "data"
PUBLIC = RAIZ / "public" / "mock"

FAIXAS = [f"FAIXA {i}" for i in range(1, 6)]
CRONS = ["EVENTUAL", "FREQUENTE", "CRONICO"]
DEPTS = ["MARCA", "PROPAGADO", "SIMILAR"]
CONCS = ["TODOS", "ABRAF", "INDEP"]
SENSIB = ["Pouco Sensível", "Sensível", "Super Sensível"]


def matriz(valor):
    if callable(valor):
        return {faixa: {cron: valor(faixa, cron) for cron in CRONS} for faixa in FAIXAS}
    return {faixa: {cron: valor for cron in CRONS} for faixa in FAIXAS}


def params_lista(meta):
    return {
        "pesoReceita": 0.7,
        "pesoQuantidade": 0.3,
        "qtdMeta": meta,
        "pbm": True,
        "farmaciaPopular": True,
        "marcaPropria": True,
        "precoTabelado": True,
        "precoMaximo": 450.0,
    }


def sku_rx(pid, desc, dept, cat, faixa, cron, sens, lab, pmc, preco, custo, receita, qtd, tipo):
    return {
        "cluster": "Cluster",
        "produtoId": pid,
        "descricao": desc,
        "divisao": "RX",
        "departamento": dept,
        "categoria": cat,
        "faixa": faixa,
        "cronicidade": cron,
        "laboratorio": lab,
        "qtd1m": qtd,
        "receita1m": receita,
        "custo1m": round(custo * qtd, 2),
        "tributos": 0,
        "precoTabelado": None,
        "marcaPropria": False,
        "pbm": desc.startswith("(PBM)"),
        "farmaciaPopular": False,
        "sensibilidade": sens,
        "custo": custo,
        "custoComComissao": custo,
        "pmc": pmc,
        "precoAtual": preco,
        "tipoPrecificacao": tipo,
        "descTodosExcel": 0.18,
        "descAbrafExcel": 0.16,
        "descIndepExcel": 0.22,
        "ajusteManual": None,
        "seguir": True,
        "precoFinalExcel": round(pmc * 0.82, 2),
    }


def candidato(pid, desc, dept, cat, faixa, cron, sens, fab, receita, qtd, pmc):
    return {
        "id": pid,
        "descricao": desc,
        "departamento": dept,
        "categoria": cat,
        "faixa": faixa,
        "cronicidade": cron,
        "sensibilidade": sens,
        "fabricante": fab,
        "receita": receita,
        "quantidade": qtd,
        "pmc": pmc,
        "pbm": False,
        "marcaPropria": False,
        "farmaciaPopular": False,
        "precoTabelado": False,
        "origemExcel": "mock",
        "selecaoManual": None,
        "selecaoFinalExcel": True,
        "selecaoAutoExcel": True,
    }


def coleta(pid, ean, produto, fab, dept, cat, faixa, cron, sens, receita, qtd, pmc, loja, conc, tipo, preco):
    desc = round(1 - preco / pmc, 6) if pmc else 0
    return {
        "produtoId": pid,
        "ean": ean,
        "produto": produto,
        "fabricante": fab,
        "departamento": dept,
        "categoria": cat,
        "faixa": faixa,
        "cronicidade": cron,
        "sensibilidade": sens,
        "receita": receita,
        "quantidade": qtd,
        "pmc": pmc,
        "precoRedeMed": round(pmc * 0.8, 2),
        "loja": loja,
        "concorrente": conc,
        "tipoConc": tipo,
        "precoConc": preco,
        "descConc": desc,
        "descRedeMed": 0.2,
        "flagValido": True,
    }


def item_p1(pid, nome, chave, fab, pmc, preco, custo, cobertura, receita, qtd, index, p_fim):
    return {
        "produtoId": pid,
        "produto": nome,
        "chave": chave,
        "fabricante": fab,
        "fabricantePlug": fab,
        "pmc": pmc,
        "precoAtual": preco,
        "custoAtual": custo,
        "estoqueAtual": 40,
        "coberturaLojas": cobertura,
        "receita3m": receita,
        "custo3m": round(custo * qtd, 2),
        "qtd3m": qtd,
        "receita12m": round(receita * 4, 2),
        "qtd12m": qtd * 4,
        "scoreQtd": 0,
        "scoreCusto": 0,
        "scoreFinal": 0,
        "indexChave": index,
        "sugestao": f"P{p_fim}",
        "overrideP": None,
        "pFim": p_fim,
    }


def sku_gx(uf, chave, pid, desc, cat, faixa, cron, lab, qtd, receita, custo, pmc, preco, ordem, tipo, sens):
    return {
        "uf": uf,
        "cluster": "Cluster",
        "chave": chave,
        "produtoId": pid,
        "descricao": desc,
        "categoria": cat,
        "faixa": faixa,
        "cronicidade": cron,
        "laboratorio": lab,
        "qtd1m": qtd,
        "receita1m": receita,
        "custo1m": round(custo * qtd, 2),
        "tributos": 0,
        "precoTabelado": None,
        "marcaPropria": False,
        "farmaciaPopular": False,
        "pbm": False,
        "sensibilidade": sens,
        "custo": custo,
        "custoComComissao": custo,
        "pmc": pmc,
        "precoAtual": preco,
        "ordemPreco": ordem,
        "tipoPrecificacao": tipo,
        "precoP1ManualLinha": None,
        "seguirPrecoP1": True,
        "ajusteManual": None,
        "seguir": True,
        "precoFinalExcel": preco,
    }


def p1_row(chave, pid, desc, cat, faixa, cron, lab, qtd, receita, custo, pmc, preco, tipo, sens):
    return {
        "uf": "RJ",
        "cluster": "Cluster",
        "chave": chave,
        "produtoId": pid,
        "descricao": desc,
        "categoria": cat,
        "faixa": faixa,
        "cronicidade": cron,
        "laboratorio": lab,
        "qtd1m": qtd,
        "receita1m": receita,
        "custo1m": round(custo * qtd, 2),
        "tributos": 0,
        "precoTabelado": None,
        "marcaPropria": False,
        "pbm": False,
        "farmaciaPopular": False,
        "sensibilidade": sens,
        "custo": custo,
        "custoComComissao": custo,
        "pmc": pmc,
        "precoAtual": preco,
        "tipoPrecificacao": tipo,
        "ajusteManualP1": None,
        "precoFimP1Excel": preco,
    }


LOJAS = [
    ("L01", "MANEJO", "001", "45.678.901/0001-23", "RUA DO RETIRO, 210, MADUREIRA - RIO DE JANEIRO, RJ",
     {"MARCA": "Alta", "PROPAGADO": "Moderado", "SIMILAR": "Baixa", "GENERICO": "Moderado"}),
    ("L02", "CENTRO", "002", "45.678.901/0002-04", "AVENIDA RIO BRANCO, 156, CENTRO - RIO DE JANEIRO, RJ",
     {"MARCA": "Alta", "PROPAGADO": "Alta", "SIMILAR": "Moderado", "GENERICO": "Alta"}),
    ("L03", "TIJUCA", "003", "45.678.901/0003-95", "RUA CONDE DE BONFIM, 430, TIJUCA - RIO DE JANEIRO, RJ",
     {"MARCA": "Moderado", "PROPAGADO": "Moderado", "SIMILAR": "rxc_centro", "GENERICO": "Moderado"}),
    ("L04", "BANGU", "004", "45.678.901/0004-76", "RUA FRANCISCO REAL, 1200, BANGU - RIO DE JANEIRO, RJ",
     {"MARCA": "Baixa", "PROPAGADO": "Baixa", "SIMILAR": "Baixa", "GENERICO": "Baixa"}),
]

REDES = [
    ("RAIA", "Drogasil / Raia", "ABRAF"),
    ("PACHECO", "Drogarias Pacheco", "ABRAF"),
    ("MODERNA", "Drogaria Moderna", "INDEP"),
    ("POVÃO", "Farmácia Povão", "INDEP"),
    ("RETIRO", "Drogaria Retiro", "INDEP"),
]

PRODUTOS = [
    ("100100", "7891234001001", "LOSARTANA 50MG 30CP", "MARCA", "CARDIOVASCULAR", "FAIXA 2", "CRONICO", "Sensível", "EMS", 48.9, 39.9, 18.4, 8200, 210, "PESQUISA"),
    ("100200", "7891234001002", "OMEPRAZOL 20MG 28CP", "PROPAGADO", "GASTRO", "FAIXA 1", "FREQUENTE", "Pouco Sensível", "MEDLEY", 22.5, 16.9, 7.2, 5400, 320, "MATRIZ"),
    ("100300", "7891234001003", "(PBM)FOSTAIR 200+6MCG", "MARCA", "RESPIRATORIO", "FAIXA 5", "EVENTUAL", "Super Sensível", "CHIESI", 272.96, 189.9, 140.0, 12600, 48, "PESQUISA"),
    ("100400", "7891234001004", "SERTRALINA 50MG 30CP", "SIMILAR", "NEUROLOGICOS", "FAIXA 3", "CRONICO", "Sensível", "EUROFARMA", 64.2, 49.9, 21.0, 4100, 90, "MATRIZ"),
    ("100500", "7891234001005", "IBUPROFENO 600MG 20CP", "PROPAGADO", "DOR", "FAIXA 1", "EVENTUAL", "Pouco Sensível", "NEO QUIMICA", 18.4, 12.99, 5.1, 2800, 180, "DESC MÍNIMO"),
    ("100600", "7891234001006", "ROSUVASTATINA 10MG 30CP", "MARCA", "CARDIOVASCULAR", "FAIXA 3", "CRONICO", "Super Sensível", "SANOFI", 96.7, 74.5, 31.2, 9700, 130, "PESQUISA"),
]

CHAVES = [
    ("OMEPRAZOL CAPSULA 20 MG x 28", "GASTRO", "FAIXA 2", "FREQUENTE", "Pouco Sensível", [
        ("200100", "P1", "EMS", 19.9, 12.5, 6.4, 0.95, 6100, 400, "PESQ MANUAL"),
        ("200200", "P2", "MEDLEY", 21.4, 15.9, 7.1, 0.8, 2400, 150, "PESQ MANUAL"),
        ("200300", "P3", "EUROFARMA", 24.0, 18.4, 8.2, 0.55, 900, 50, "MARGEM OBJETIVO"),
    ]),
    ("LOSARTANA POTASSICA COMPRIMIDO 50 MG x 30", "CARDIOVASCULAR", "FAIXA 3", "CRONICO", "Sensível", [
        ("200400", "P1", "GEOLAB", 27.8, 18.9, 9.5, 1.0, 4800, 220, "PESQ INTERNET"),
        ("200500", "P2", "PRATI", 31.2, 22.4, 11.0, 0.72, 1600, 70, "PESQ INTERNET"),
        ("200600", "P3", "ACHE", 36.5, 27.9, 13.4, 0.4, 700, 28, "MARGEM OBJETIVO"),
    ]),
]


def main():
    sens = {
        "totalSkus": len(PRODUTOS) + sum(len(labs) for *_, labs in CHAVES),
        "classesCronicidade": [
            {"categoria": "CARDIOVASCULAR", "cronicidade": "CRONICO"},
            {"categoria": "NEUROLOGICOS", "cronicidade": "CRONICO"},
            {"categoria": "GASTRO", "cronicidade": "FREQUENTE"},
            {"categoria": "RESPIRATORIO", "cronicidade": "EVENTUAL"},
            {"categoria": "DOR", "cronicidade": "EVENTUAL"},
        ],
        "faixasQuintis": [
            {"quintil": i, "faixa": f"FAIXA {i}", "inicio": 10 * i, "fim": 10 * i + 40, "qtd": 2, "departamento": "MARCA"}
            for i in range(1, 6)
        ],
        "matrizSensibilidade": {
            "FAIXA 5": {"EVENTUAL": "Sensível", "FREQUENTE": "Super Sensível", "CRONICO": "Super Sensível"},
            "FAIXA 4": {"EVENTUAL": "Sensível", "FREQUENTE": "Sensível", "CRONICO": "Super Sensível"},
            "FAIXA 3": {"EVENTUAL": "Pouco Sensível", "FREQUENTE": "Sensível", "CRONICO": "Super Sensível"},
            "FAIXA 2": {"EVENTUAL": "Pouco Sensível", "FREQUENTE": "Pouco Sensível", "CRONICO": "Sensível"},
            "FAIXA 1": {"EVENTUAL": "Pouco Sensível", "FREQUENTE": "Pouco Sensível", "CRONICO": "Sensível"},
        },
        "distribuicao": [
            {"departamento": p[3], "faixa": p[5], "cronicidade": p[6], "sensibilidade": p[7], "skus": 1, "receita12m": p[12] * 12}
            for p in PRODUTOS
        ],
    }

    ajuste = {}
    for dept in DEPTS:
        ajuste[dept] = {
            "Cluster Alta": {"TOP PRODUTOS": 0, "Pouco Sensível": 0, "Sensível": 0, "Super Sensível": 0},
            "Cluster Moderado": {"TOP PRODUTOS": 0.01, "Pouco Sensível": -0.04, "Sensível": 0, "Super Sensível": 0.01},
            "Cluster": {"TOP PRODUTOS": 0.02, "Pouco Sensível": -0.1, "Sensível": 0, "Super Sensível": 0.01},
        }
    politica = {
        "Cluster Alta": {"MARCA": "TODOS", "PROPAGADO": "TODOS", "SIMILAR": "TODOS"},
        "Cluster Moderado": {"MARCA": "ABRAF", "PROPAGADO": "TODOS", "SIMILAR": "INDEP"},
        "Cluster": {"MARCA": "ABRAF", "PROPAGADO": "TODOS", "SIMILAR": "INDEP"},
    }
    skus_rx = [
        sku_rx(p[0], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10], p[11], p[12], p[13], p[14])
        for p in PRODUTOS
    ]
    rx = {
        "cockpitDefault": {
            "politicaPesquisa": politica,
            "politicaMatriz": politica,
            "ajusteDesconto": ajuste,
            "descontoMinimo": {s: {d: 0.049 for d in DEPTS} for s in SENSIB},
            "margemCritica": {
                "TOP PRODUTOS": {"MARCA": 0.08, "PROPAGADO": 0.08, "SIMILAR": 0.30},
                "Super Sensível": {"MARCA": 0.10, "PROPAGADO": 0.10, "SIMILAR": 0.40},
                "Sensível": {"MARCA": 0.12, "PROPAGADO": 0.12, "SIMILAR": 0.45},
                "Pouco Sensível": {"MARCA": 0.20, "PROPAGADO": 0.20, "SIMILAR": 0.50},
            },
            "farolVariacao": {
                "PESQUISA": {"limiar": 0.30, "indiferenca": 0.0},
                "MATRIZ": {"limiar": 0.30, "indiferenca": 0.0},
                "DESC MÍNIMO": {"limiar": 0.25, "indiferenca": 0.0},
            },
            "fatorPmc": 0.0,
            "aliquotaImpostos": 0,
            "margemMinimaLiquida": 0,
        },
        "matrizDesconto": [
            {
                "departamento": dept,
                "conc": conc,
                "faixa": faixa,
                "cronicidade": cron,
                "desconto": round(0.12 + FAIXAS.index(faixa) * 0.02 + (0.02 if conc == "INDEP" else 0), 4),
            }
            for dept in DEPTS
            for conc in CONCS
            for faixa in FAIXAS
            for cron in CRONS
        ],
        "topPesquisa": {
            p[0]: {"produto": p[2], "TODOS": 0.2, "INDEP": 0.24, "ABRAF": 0.16}
            for p in PRODUTOS
        },
        "skus": skus_rx,
    }

    coletas = []
    lojas_nome = [loja[1] for loja in LOJAS]
    for produto in PRODUTOS:
        for loja in lojas_nome[:2]:
            for rede_id, _nome, tipo in REDES:
                fator = 0.78 if tipo == "ABRAF" else 0.72
                coletas.append(coleta(
                    produto[0], produto[1], produto[2], produto[8], produto[3], produto[4],
                    produto[5], produto[6], produto[7], produto[12], produto[13], produto[9],
                    loja, rede_id, tipo, round(produto[9] * fator, 2),
                ))

    pesq = {
        "concorrentes": [
            {"id": rid, "nome": nome, "tipo": tipo, "uf": "RJ", "lojasMapeadas": 4, "distanciaMediaKm": 0.6}
            for rid, nome, tipo in REDES
        ],
        "coletasRx": coletas,
        "gxPesqManual": {},
        "gxPesqInternetCount": len(CHAVES),
    }

    itens = []
    skus_gx = []
    p1_rows = []
    pesq_manual = {}
    pesq_internet = {}
    for index, (chave, cat, faixa, cron, sensib, labs) in enumerate(CHAVES, 1):
        pesq_manual[chave] = {
            medida: {"TODOS": 14.9, "INDEP": 13.4, "ABRAF": 15.8}
            for medida in ("MIN", "MED", "MAX")
        }
        pesq_internet[chave] = {"MIN": 13.2, "MED": 15.1, "MAX": 17.4}
        for ordem_i, lab in enumerate(labs, 1):
            pid, ordem, fab, pmc, preco, custo, cobertura, receita, qtd, tipo = lab
            nome = f"{chave} ({fab})"
            itens.append(item_p1(pid, nome, chave, fab, pmc, preco, custo, cobertura, receita, qtd, index, ordem_i))
            skus_gx.append(sku_gx("RJ", chave, pid, nome, cat, faixa, cron, fab, qtd, receita, custo, pmc, preco, ordem, tipo, sensib))
            if ordem == "P1":
                p1_rows.append(p1_row(chave, pid, nome, cat, faixa, cron, fab, qtd, receita, custo, pmc, preco, tipo, sensib))

    gx_sel = {
        "pesosDefault": {"cobertura": 0.35, "quantidade": 0.45, "custo": 0.20},
        "maxPDefault": 3,
        "itens": itens,
    }

    def ic_faixa(base):
        return matriz(lambda faixa, cron: round(base + (0.01 if cron == "EVENTUAL" else 0) + FAIXAS.index(faixa) * 0.01, 2))

    gx = {
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
            "aliquotaImpostos": 0,
            "margemMinimaLiquida": 0,
            "icManual": {
                "concorrencia": matriz("INDEP"),
                "balizador": matriz("MED"),
                "politicaIc": ic_faixa(0.96),
            },
            "icInternet": {
                "balizador": matriz("MED"),
                "politicaIc": ic_faixa(0.97),
            },
            "margemObjetivo": matriz(0.45),
            "margemSemPmc": {"EVENTUAL": 0.68, "FREQUENTE": 0.56, "CRONICO": 0.50},
            "margemCritica": {
                origem: matriz(0.35)
                for origem in ("PESQ MANUAL", "PESQ INTERNET", "MARGEM OBJETIVO")
            },
        },
        "pesqManual": pesq_manual,
        "pesqInternet": pesq_internet,
        "chaveP1Manual": {},
        "p1Rows": p1_rows,
        "skus": skus_gx,
    }

    lista = {
        "parametrosDefault": {dept: params_lista(20 if dept != "GENERICO" else 30) for dept in (*DEPTS, "GENERICO")},
        "candidatos": [
            candidato(p[0], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[12], p[13], p[9])
            for p in PRODUTOS
        ] + [
            candidato(lab[0], f"{chave} ({lab[2]})", "GENERICO", cat, faixa, cron, sensib, lab[2], lab[7], lab[8], lab[3])
            for chave, cat, faixa, cron, sensib, labs in CHAVES
            for lab in labs
        ],
    }

    perfis_base = {"AUTOSSERVICO": "Baixa"}
    rede = {
        "fonte": "mock",
        "pesquisasIniciais": {"rx": ["rx-competitiva-rj"], "gx": ["gx-manual-rj", "gx-internet-rj"]},
        "clustersCustom": [{"id": "rxc_centro", "nome": "Centro"}],
        "lojas": [
            {
                "id": loja[0],
                "nome": loja[1],
                "codigo": loja[2],
                "cnpj": loja[3],
                "endereco": loja[4],
                "origem": "mock",
                "perfis": {**perfis_base, **loja[5]},
            }
            for loja in LOJAS
        ],
        "redes": [
            {"id": rid, "nome": nome, "tipo": tipo, "habilitada": True}
            for rid, nome, tipo in REDES
        ],
        "lojasEstrategia": [
            {"id": loja[0].lower(), "nome": loja[1], "cnpj": loja[3], "endereco": loja[4]}
            for loja in LOJAS
        ],
        "vinculos": [
            {
                "id": f"{loja[0].lower()}-{rid}",
                "lojaId": loja[0].lower(),
                "redeId": rid,
                "endereco": loja[4],
                "origem": "importado",
                "atualizadoHaDias": 3,
            }
            for loja in LOJAS[:2]
            for rid, _nome, _tipo in REDES
        ],
        "pontos": [
            {
                "id": f"{loja[0].lower()}-{rid}",
                "lojaId": loja[0].lower(),
                "nome": nome,
                "endereco": loja[4],
                "redeId": rid,
                "distanciaKm": round(0.4 + i * 0.3, 1),
            }
            for loja in LOJAS
            for i, (rid, nome, _tipo) in enumerate(REDES)
        ],
        "linhasImportacao": [
            {
                "id": "imp-1",
                "lojaId": "l01",
                "de": "DROGASIL",
                "endereco": LOJAS[0][4],
                "redeSugeridaId": "RAIA",
            }
        ],
        "pesquisas": [
            {
                "id": "rx-competitiva-rj",
                "dominio": "rx",
                "nome": "Pesquisa competitiva RX",
                "concorrentes": [rid for rid, _nome, _tipo in REDES],
            },
            {
                "id": "gx-manual-rj",
                "dominio": "gx",
                "nome": "Pesquisa manual",
                "concorrentes": [rid for rid, _nome, tipo in REDES if tipo == "INDEP"],
            },
            {
                "id": "gx-internet-rj",
                "dominio": "gx",
                "nome": "Pesquisa internet",
                "concorrentes": [rid for rid, _nome, tipo in REDES if tipo == "ABRAF"],
            },
        ],
    }

    receita_rx = round(sum(s["receita1m"] for s in skus_rx), 2)
    lucro_rx = round(sum(s["receita1m"] - s["custo1m"] for s in skus_rx), 2)
    receita_gx = round(sum(s["receita1m"] for s in skus_gx), 2)
    lucro_gx = round(sum(s["receita1m"] - s["custo1m"] for s in skus_gx), 2)
    resultados = {
        "nota": "Totais de entrada da base falsa. A tela de Resultados recalcula receita simulada, lucro, margem, desconto e IC a partir destes SKUs.",
        "rx": {
            "skus": len(skus_rx),
            "receitaAtual1m": receita_rx,
            "lucroBrutoAtual1m": lucro_rx,
            "margemAtual": round(lucro_rx / receita_rx, 4),
            "impactoAnualReceitaReferencia": round(receita_rx * 12, 2),
            "porDepartamento": {
                dept: round(sum(s["receita1m"] for s in skus_rx if s["departamento"] == dept), 2)
                for dept in DEPTS
            },
        },
        "gx": {
            "skus": len(skus_gx),
            "chaves": len(CHAVES),
            "receitaAtual1m": receita_gx,
            "lucroBrutoAtual1m": lucro_gx,
            "margemAtual": round(lucro_gx / receita_gx, 4),
            "impactoAnualReceitaReferencia": round(receita_gx * 12, 2),
            "porDegrau": {
                ordem: round(sum(s["receita1m"] for s in skus_gx if s["ordemPreco"] == ordem), 2)
                for ordem in ("P1", "P2", "P3")
            },
        },
    }

    arquivos = {
        "sensibilidade.json": sens,
        "lista-pesquisa.json": lista,
        "pesquisa-competitiva.json": pesq,
        "rx-simulador.json": rx,
        "gx-selecao-p1.json": gx_sel,
        "gx-simulador.json": gx,
        "rede.json": rede,
        "resultados-esperados.json": resultados,
    }
    for pasta in (SEEDS, PUBLIC):
        pasta.mkdir(parents=True, exist_ok=True)
        for nome, conteudo in arquivos.items():
            (pasta / nome).write_text(json.dumps(conteudo, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"RX skus {len(skus_rx)} coletas {len(coletas)} GX skus {len(skus_gx)}")
    print(f"Gravado em {SEEDS} e {PUBLIC}")


if __name__ == "__main__":
    main()
