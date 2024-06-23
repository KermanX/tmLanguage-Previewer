<script setup lang="ts">
import { chooseExampleFile, examplePath, grammarFiles } from '../states'

const shown = defineModel({ type: Boolean, required: true })
</script>

<template>
  <div v-if="shown" fixed inset-0 backdrop-blur-2xl flex items-center justify-center @click="shown = false">
    <div min-w-60vw max-w-90vw min-h-60vh max-h-90vh px-4 py-3 border="1 gray rounded" bg-dark bg-op80 flex flex-col @click.stop>
      <h2 font-bold text-lg mb-2>
        Settings
      </h2>
      <div mb-2>
        <h3 text-sm mb-2>
          Grammar
        </h3>
        <div grid items-center class="grid-cols-[min-content_1fr]" gap-x-2 px-1>
          <template v-for="path, scope in grammarFiles" :key="scope">
            <span op70 color-white font-mono>
              <code>{{ scope }}</code>
            </span>
            <div op70 color-white font-mono flex flex-row-reverse items-center gap-1>
              <div i-carbon-edit hover:color-white hover:op90 hover:underline />
              <span>{{ path }}</span>
            </div>
          </template>
        </div>
      </div>
      <div>
        <h3 text-sm>
          Example
        </h3>
        <div flex gap-2 items-center px-1>
          <span flex-grow op70 color-white font-mono>
            {{ examplePath }}
          </span>
          <button hover:color-white hover:bg-op10 hover:bg-gray px-1.5 py-.5 border="1 base rounded" @click="chooseExampleFile">
            Choose
          </button>
        </div>
      </div>
      <div flex-grow />
      <div text-right>
        <!-- <a i-carbon-logo-github text-lg op80 hover:op90 mr-1 hover:color-white href="https://github.com/KermanX/tmLanguage-Playground" target="_blank" /> -->
        <button hover:color-white hover:bg-op10 hover:bg-gray px-1.5 py-.5 border="1 base rounded" @click="shown = false">
          Close
        </button>
      </div>
    </div>
  </div>
</template>
