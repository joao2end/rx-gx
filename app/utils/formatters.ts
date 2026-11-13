export function fmtBRL(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function fmtCompactBRL(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}R$ ${(abs / 1_000_000).toFixed(2).replace(".", ",")} mi`;
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")} mil`;
  }
  return fmtBRL(val);
}

export function fmtPct(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  return `${(val * 100).toFixed(decimals).replace(".", ",")}%`;
}

export function fmtSignedPct(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  const pct = val * 100;
  const prefix = pct > 0.0001 ? "+" : "";
  return `${prefix}${pct.toFixed(decimals).replace(".", ",")}%`;
}

export function fmtInt(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(val);
}

export function sensibilidadePillStatus(
  sens: string,
): "attention" | "warning" | "default" | "success" {
  if (sens === "Super Sensível") return "attention";
  if (sens === "Sensível") return "warning";
  if (sens === "Pouco Sensível") return "success";
  return "default";
}
