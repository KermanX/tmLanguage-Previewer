<script setup lang="ts">
import { chooseExampleFile, examplePath, grammarFiles, openExampleFile, vscode } from '../states'
import Button from './Button.vue'

const shown = defineModel({ type: Boolean, required: true })

function addGrammarFile() {
  vscode.postMessage({ type: 'ui:add-grammar' })
}

function removeGrammar(uri: string) {
  vscode.postMessage({ type: 'ui:remove-grammar', uri })
}

function toggleGrammar(uri: string, enabled: boolean) {
  vscode.postMessage({ type: 'ui:toggle-grammar', uri, enabled })
}
</script>

<template>
  <div v-if="shown" fixed inset-0 backdrop-blur-2xl flex items-center justify-center @click="shown = false">
    <div min-w-60vw max-w-90vw min-h-60vh max-h-90vh px-4 py-3 border="1 gray rounded" bg-dark bg-op80 flex flex-col @click.stop>
      <h2 font-bold text-lg mb-2>
        Settings
      </h2>
      <div mb-2>
        <h3 text-sm mb-2 flex>
          <span flex-grow>Grammar</span>
          <Button mr-1 @click="addGrammarFile">
            Add
          </Button>
        </h3>
        <div grid items-center class="grid-cols-[min-content_1fr]" gap-x-2 px-1>
          <template v-for="file, uri, index in grammarFiles" :key="uri">
            <span color-white font-mono :class="file.enabled ? 'op90' : 'op60'">
              <code>{{ file.scope }}</code>
            </span>
            <div color-white font-mono flex flex-row-reverse items-center gap-1 :class="file.enabled ? '' : 'op70'">
              <div i-carbon-trash-can hover:color-white op70 hover:op90 hover:underline :class="index === 0 ? '!op10' : ''" @click="index !== 0 && removeGrammar(uri)" />
              <div v-if="file.enabled" i-carbon-view hover:color-white op70 hover:op90 hover:underline @click="toggleGrammar(uri, false)" />
              <div v-else i-carbon-view-off hover:color-white op70 hover:op90 hover:underline @click="toggleGrammar(uri, true)" />
              <span>{{ file.path }}</span>
            </div>
          </template>
        </div>
      </div>
      <div mt-2>
        <h3 text-sm flex>
          <span flex-grow>Example</span>
          <Button mr-1 @click="chooseExampleFile">
            Choose
          </Button>
        </h3>
        <div flex gap-2 items-center px-1>
          <span flex-grow op70 color-white font-mono>
            {{ examplePath }}
          </span>
          <div i-carbon-launch hover:color-white op70 hover:op90 hover:underline @click="openExampleFile" />
        </div>
      </div>
      <div flex-grow />
      <div text-right>
        <!-- <a i-carbon-logo-github text-lg op80 hover:op90 mr-1 hover:color-white href="https://github.com/KermanX/tmLanguage-Playground" target="_blank" /> -->
        <Button @click="shown = false">
          Close
        </Button>
      </div>
    </div>
  </div>
</template>
