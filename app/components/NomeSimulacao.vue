<template>
  <div v-if="emJornada" class="flex items-center gap-2">
    <div class="w-[260px] shrink-0">
      <AdsInput
        v-model="rascunho"
        placeholder="Nome da simulação"
        :disabled="!editando"
        :error="erro"
      />
    </div>
    <AdsButton
      :type="editando ? 'filled' : 'secondary'"
      leading
      :icon="editando ? 'i-lucide-check' : 'i-lucide-pencil'"
      :label="editando ? 'OK' : 'Editar'"
      @click="alternar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDominio } from "~/composables/useDominio";
import { useNomeSimulacao } from "~/composables/useNomeSimulacao";

const route = useRoute();
const { dominio } = useDominio();
const { nomeDe, definirNome } = useNomeSimulacao();

const emJornada = computed(
  () => route.path === "/rx" || route.path.startsWith("/rx/") || route.path === "/gx" || route.path.startsWith("/gx/"),
);

const editando = ref(false);
const erro = ref("");
const rascunho = ref(nomeDe(dominio.value));

watch(dominio, (d) => {
  editando.value = false;
  erro.value = "";
  rascunho.value = nomeDe(d);
});

watch(
  () => nomeDe(dominio.value),
  (nome) => {
    if (!editando.value) rascunho.value = nome;
  },
);

function alternar() {
  if (!editando.value) {
    rascunho.value = nomeDe(dominio.value);
    erro.value = "";
    editando.value = true;
    return;
  }

  const titulo = rascunho.value.trim();
  if (!titulo) {
    erro.value = "Insira um nome para a simulação";
    return;
  }

  definirNome(dominio.value, titulo);
  rascunho.value = titulo;
  erro.value = "";
  editando.value = false;
}
</script>
