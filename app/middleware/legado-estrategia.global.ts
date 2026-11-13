const DESTINOS: Record<string, string> = {
  "/estrategia/pesquisa": "/pesquisa",
  "/clusterizacao": "/estrategia/clusterizacao",
  "/lista-pesquisa": "/pesquisa",
  "/pesquisa-competitiva": "/pesquisa",
};

export default defineNuxtRouteMiddleware((to) => {
  const destino = DESTINOS[to.path];
  if (!destino) return;

  const query = { ...to.query };
  const legadoLista = to.path === "/lista-pesquisa" || to.path === "/pesquisa-competitiva";
  if (legadoLista && query.d !== "rx" && query.d !== "gx") query.d = "rx";

  return navigateTo({ path: destino, query }, { redirectCode: 302 });
});
