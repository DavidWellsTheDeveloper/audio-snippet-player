<script setup lang="ts">
import { useTheme, useDisplay } from 'vuetify'
import { ref, watch, onMounted } from 'vue'

const theme = useTheme()
const { mobile } = useDisplay()
const drawer = ref(false)

const STORAGE_KEY = 'audio-snippet-player-theme'

function toggleTheme() {
  const next = theme.global.name.value === 'dark' ? 'light' : 'dark'
  theme.global.name.value = next
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') theme.global.name.value = stored
})

watch(
  () => theme.global.name.value,
  (name) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, name)
  }
)

const navLinks = [
  { to: '/', label: 'Create snippet' },
  { to: '/play', label: 'Player' },
  { to: '/saved', label: 'Saved snippets' },
]
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon
        v-if="mobile"
        aria-label="Open menu"
        @click="drawer = true"
      />
      <NuxtLink to="/" class="text-body1 font-weight-medium text-white text-decoration-none mr-4">
        Audio Snippet Player
      </NuxtLink>
      <template v-if="!mobile">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-body2 text-white text-decoration-none mr-3"
          active-class="font-weight-bold"
        >
          {{ link.label }}
        </NuxtLink>
      </template>
      <v-spacer />
      <v-btn
        icon
        variant="text"
        color="white"
        :aria-label="theme.global.name.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <v-icon>{{ theme.global.name.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      temporary
      location="start"
    >
      <v-list nav>
        <v-list-item
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :title="link.label"
          @click="drawer = false"
        />
        <v-list-item
          :title="theme.global.name.value === 'dark' ? 'Light mode' : 'Dark mode'"
          @click="toggleTheme(); drawer = false"
        >
          <template #prepend>
            <v-icon>{{ theme.global.name.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container class="py-6">
        <NuxtPage />
      </v-container>
    </v-main>

    <v-footer class="mt-auto">
      <v-container>
        <div class="d-flex flex-wrap align-center justify-center gap-3 text-body2">
          <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" class="text-medium-emphasis text-decoration-none">
            {{ link.label }}
          </NuxtLink>
          <span class="text-medium-emphasis">© {{ new Date().getFullYear() }} Audio Snippet Player</span>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>
