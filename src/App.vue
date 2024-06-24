<script setup lang="ts">
import { hideAllPoppers } from 'floating-vue'
import { computed, ref, watch } from 'vue'
import type { TokensData } from '../types'
import RenderToken from './components/RenderToken.vue'
import Settings from './components/Settings.vue'
import { examplePath, grammarFiles, openExampleFile, openGrammarFile, vscode } from './states'

const tokens = ref<TokensData | null>(null)
const exampleCode = ref('import { a } from "A"')
const editing = ref(false)
const editingBuffer = ref('')
const editingEl = ref<HTMLTextAreaElement | null>(null)
const settingsShown = ref(false)
const enabledGrammars = computed(() => Object.entries(grammarFiles.value ?? {}).filter(([_, file]) => file.enabled))

function startEdit() {
  editingBuffer.value = exampleCode.value
  editing.value = true
  editingEl.value?.focus()
  editingEl.value?.scrollTo(0, 0)
}

function finishEdit() {
  if (editing.value) {
    editing.value = false
    exampleCode.value = editingBuffer.value
    vscode.postMessage({ type: 'ui:update-example', code: exampleCode.value })
  }
}

function updateEdit() {
  editingEl.value?.scrollTo(0, 0)
  vscode.postMessage({ type: 'ui:update-example', code: editingBuffer.value })
}

function openSettings() {
  finishEdit()
  settingsShown.value = true
}

window.addEventListener('message', (event) => {
  if (event.data.type === 'ext:update-tokens') {
    hideAllPoppers()
    tokens.value = event.data.tokens
    if (!editing.value)
      exampleCode.value = event.data.code
    grammarFiles.value = event.data.grammarFiles
    examplePath.value = event.data.examplePath
  }
})
vscode.postMessage({ type: 'ui:ready' })

watch(editing, hideAllPoppers)
</script>

<template>
  <div fixed inset-0 flex flex-col :class="settingsShown ? 'filter-blur-5' : ''" @dblclick="startEdit">
    <div h-0 flex-grow relative class="group">
      <div absolute inset-0 overflow-auto font-mono>
        <div v-if="Array.isArray(tokens)" relative min-w-max min-h-max h-full>
          <!-- eslint-disable-next-line vue/require-component-is -->
          <component is="pre" class="shiki relative px-4 py-2">
            <template v-for="line, i in tokens" :key="i">
              <br v-if="i !== 0">
              <RenderToken v-for="token, j in line" :key="j" :token />
            </template>
            &nbsp;
            <textarea
              v-if="editing" ref="editingEl" v-model="editingBuffer"
              class="absolute inset-0 resize-none pl-4 pt-2 text-transparent bg-transparent !outline-none caret-white overflow-y-hidden"
              @blur="finishEdit" @input="updateEdit" @keydown.enter.ctrl="finishEdit"
            />
          </component>
        </div>
        <div v-else-if="!tokens" class="p-4 text-center text-faded">
          loading...
        </div>
        <div v-else class="p-4 text-center text-red">
          {{ tokens }}
        </div>
      </div>
      <template v-if="Array.isArray(tokens)">
        <button
          v-if="editing" absolute right-4 top-2 p-2 text-xl class="hover:bg-gray/15" rounded-lg
          @click="finishEdit"
        >
          <div text-transparent group-hover:text-white op80 i-carbon-checkmark />
        </button>
        <button v-else absolute right-4 top-2 p-2 text-xl class="hover:bg-gray/15" rounded-lg @click="startEdit">
          <div text-transparent group-hover:text-white op80 i-carbon-edit />
        </button>
        <div v-if="editing" absolute inset-0 pointer-events-none style="box-shadow: inset 0 0 4px #FFFFFFBB" />
      </template>
    </div>
    <div px-3 py-1.5 b-t b-gray b-op-30 text-xs select-none flex flex-wrap items-center>
      <div pr-2>
        <span font-bold>
          Grammar{{ enabledGrammars.length > 1 ? 's' : '' }}:
        </span>
        <template v-if="enabledGrammars.length">
          <button op70 color-white hover:color-white hover:op90 hover:underline @click="openGrammarFile">
            {{ enabledGrammars[0][1].path }}
          </button>
          <span v-if="enabledGrammars.length > 1" op50 color-white hover:color-white hover:op70 @click="openSettings">
            +{{ enabledGrammars.length - 1 }}
          </span>
        </template>
        <span v-else op50>
          No grammar enabled
        </span>
      </div>
      <div v-if="examplePath">
        <span font-bold>
          Example:
        </span>
        <button op70 color-white hover:color-white hover:op90 hover:underline @click="openExampleFile">
          {{ examplePath }}
        </button>
      </div>
      <div flex-grow flex>
        <div flex-grow />
        <button i-carbon-settings self-end justify-end text-lg op80 hover:op90 hover:color-white @click="openSettings" />
      </div>
    </div>
  </div>
  <Settings v-model="settingsShown" />
</template>
