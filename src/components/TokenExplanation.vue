<script setup lang="ts">
import type { ThemedToken } from 'shiki'
import { computed } from 'vue'

const props = defineProps<{
  token: ThemedToken
}>()

const displayedContent = computed(() => {
  return props.token.content.replaceAll(' ', '·')
})

const scopes = computed(() => {
  return props.token.explanation?.[0].scopes
})
</script>

<template>
  <div font-mono p-2 min-w-100 w-fit>
    <div flex items-end gap-4 mb-2>
      <div text-left text-2xl>
        {{ displayedContent }}
      </div>
      <div text-right flex-grow>
        {{ displayedContent.length }} char{{ displayedContent.length > 1 ? 's' : '' }}
      </div>
    </div>
    <div>
      <div v-for="s, i in scopes" :key="i">
        {{ s.scopeName }}
      </div>
    </div>
  </div>
</template>
