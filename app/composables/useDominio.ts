import { computed } from "vue";
import { useRoute } from "vue-router";
import { DOMINIOS, type Dominio } from "~/utils/jornada";

export function useDominio() {
  const route = useRoute();
  const ultimo = useState<Dominio>("poc-dominio", () => "rx");

  const dominio = computed<Dominio>(() => {
    if (route.path === "/rx" || route.path.startsWith("/rx/")) return "rx";
    if (route.path === "/gx" || route.path.startsWith("/gx/")) return "gx";
    const q = route.query.d;
    if (q === "rx" || q === "gx") return q;
    return ultimo.value;
  });

  const definicao = computed(() => DOMINIOS[dominio.value]);

  return { dominio, definicao, ultimo };
}
