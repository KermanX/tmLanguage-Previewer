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
  <div v-if="shown" text-black dark:text-white fixed inset-0 backdrop-blur-2xl flex items-center justify-center @click="shown = false">
    <div min-w-60vw max-w-90vw min-h-60vh max-h-90vh px-4 py-3 border="1 gray rounded" dark:bg-dark bg-op80 flex flex-col @click.stop>
      <h2 font-bold text-lg mb-2>
        Settings
      </h2>
      <div mb-2>
        <h3 text-sm mb-1 flex>
          <span flex-grow>Grammar</span>
          <Button mr-1 @click="addGrammarFile">
            Add
          </Button>
        </h3>
        <div grid items-center class="grid-cols-[min-content_1fr]" gap-x-2 px-1>
          <template v-for="file, uri, index in grammarFiles" :key="uri">
            <span font-mono :class="file.enabled ? 'op90' : 'op60'">
              <code>{{ file.scope }}</code>
            </span>
            <div font-mono grid class="grid-cols-[1fr_min-content_min-content]" items-center gap-1 :class="file.enabled ? '' : 'op70'">
              <div op70 text-wrap break-anywhere>
                {{ file.path }}
              </div>
              <div v-if="file.enabled" i-carbon-view op70 hover:op90 @click="toggleGrammar(uri, false)" />
              <div v-else i-carbon-view-off op70 hover:op90 @click="toggleGrammar(uri, true)" />
              <div i-carbon-trash-can op70 hover:op90 :class="index === 0 ? '!op10' : ''" @click="index !== 0 && removeGrammar(uri)" />
            </div>
          </template>
        </div>
      </div>
      <div mt-2>
        <h3 text-sm flex mb-1>
          <span flex-grow>Example</span>
          <Button mr-1 @click="chooseExampleFile">
            Choose
          </Button>
        </h3>
        <div flex gap-2 items-center px-1>
          <span flex-grow op70 font-mono text-wrap break-anywhere>
            {{ examplePath }}
          </span>
          <div i-carbon-launch op70 hover:op100 hover:underline @click="openExampleFile" />
        </div>
      </div>
      <div flex-grow />
      <div text-right>
        <!-- <a i-carbon-logo-github text-lg op80 hover:op90 mr-1 href="https://github.com/KermanX/tmLanguage-Playground" target="_blank" /> -->
        <Button @click="shown = false">
          Close
        </Button>
      </div>
    </div>
  </div>
</template>
