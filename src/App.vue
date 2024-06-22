<script setup lang="ts">
import { hideAllPoppers } from 'floating-vue'
import { ref, watch } from 'vue'
import type { TokensData } from '../types'
import RenderToken from './components/RenderToken.vue'

const tokens = ref<TokensData | null>(null)
const exampleCode = ref('import { a } from "A"')
const grammarPath = ref<string | null>(null)
const examplePath = ref<string | null>(null)
const editing = ref(false)
const editingBuffer = ref('')
const editingEl = ref<HTMLTextAreaElement | null>(null)

declare const acquireVsCodeApi: () => any
const vscode = acquireVsCodeApi()
vscode.postMessage({ type: 'ui-ready' })

function startEdit() {
  editingBuffer.value = exampleCode.value
  editing.value = true
  editingEl.value?.focus()
  editingEl.value?.scrollTo(0, 0)
}

function finishEdit() {
  editing.value = false
  exampleCode.value = editingBuffer.value
  vscode.postMessage({ type: 'ui-update-example', code: exampleCode.value })
}

function updateEdit() {
  vscode.postMessage({ type: 'ui-update-example', code: editingBuffer.value })
}

function openGrammarFile() {
  vscode.postMessage({ type: 'ui-open-grammar-file' })
}

function openExampleFile() {
  vscode.postMessage({ type: 'ui-open-example-file' })
}

window.addEventListener('message', (event) => {
  if (event.data.type === 'update-tokens') {
    hideAllPoppers()
    tokens.value = event.data.tokens
    if (!editing.value)
      exampleCode.value = event.data.code
    grammarPath.value = event.data.grammarPath
    examplePath.value = event.data.examplePath
  }
})

watch(editing, hideAllPoppers)
</script>

<template>
  <div fixed inset-0 border="~ base rounded" flex flex-col @dblclick="startEdit">
    <div h-0 flex-grow relative class="group">
      <div absolute inset-0 overflow-auto font-mono>
        <div v-if="Array.isArray(tokens)" relative min-w-max min-h-max>
          <!-- eslint-disable-next-line vue/require-component-is -->
          <component is="pre" class="shiki px-4 py-2">
            <template v-for="line, i in tokens" :key="i">
              <br v-if="i !== 0">
              <RenderToken v-for="token, j in line" :key="j" :token />
            </template>
          </component>
          <textarea
            v-if="editing" ref="editingEl" v-model="editingBuffer"
            class="absolute inset-0 pl-4 pt-2 text-transparent bg-transparent !outline-none caret-white overflow-y-hidden"
            @blur="finishEdit" @input="updateEdit" @keydown.enter.ctrl="finishEdit"
          />
        </div>
        <div v-else-if="!tokens" class="p-4 text-center text-faded">
          loading...
        </div>
        <div v-else class="p-4 text-center text-red">
          {{ tokens }}
        </div>
      </div>
      <button v-if="editing" absolute right-4 top-2 p-2 text-xl class="hover:bg-gray/15" rounded-lg @click="finishEdit">
        <div text-transparent group-hover:text-white op80 i-carbon-checkmark />
      </button>
      <button v-else absolute right-4 top-2 p-2 text-xl class="hover:bg-gray/15" rounded-lg @click="startEdit">
        <div text-transparent group-hover:text-white op80 i-carbon-edit />
      </button>
      <div v-if="editing" absolute inset-0 pointer-events-none style="box-shadow: inset 0 0 4px #FFFFFFBB" />
    </div>
    <div px-3 py-1.5 b-t b-gray b-op-30 text-xs select-none flex items-center>
      <div v-if="grammarPath" pr-2>
        <span font-bold>
          Grammar:
        </span>
        <button op70 color-white hover:color-white hover:op90 hover:underline @click="openGrammarFile">
          {{ grammarPath }}
        </button>
      </div>
      <div v-if="examplePath">
        <span font-bold>
          Example:
        </span>
        <button op70 color-white hover:color-white hover:op90 hover:underline @click="openExampleFile">
          {{ examplePath }}
        </button>
      </div>
      <div flex-grow />
      <a
        i-carbon-logo-github text-lg op80 hover:op90 mr-1 hover:color-white href="https://github.com/KermanX/tmLanguage-Playground"
        target="_blank"
      />
    </div>
  </div>
</template>
