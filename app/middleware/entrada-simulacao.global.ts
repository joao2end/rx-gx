import type { Dominio } from "~/utils/jornada";

function dominioDaSimulacao(path: string): Dominio | null {
  if (path === "/rx/simulacao") return "rx";
  if (path === "/gx/simulacao") return "gx";
  return null;
}

export default defineNuxtRouteMiddleware((to, from) => {
  const dominio = dominioDaSimulacao(to.path);
  if (!dominio) return;

  const liberar = useState<boolean>("poc-liberar-entrada-simulacao", () => false);
  const pendente = useState<Dominio | null>("poc-escolha-simulacao-pendente", () => null);
  const destino = useState<"jornada" | "simulacao">("poc-destino-apos-pesquisa", () => "simulacao");

  if (liberar.value) {
    liberar.value = false;
    return;
  }

  if (from.path === `/${dominio}/parametrizacao`) {
    pendente.value = null;
    return;
  }

  destino.value = "simulacao";
  pendente.value = dominio;
  if (from.path === to.path) return navigateTo(`/${dominio}/parametrizacao`);
  return abortNavigation();
});
