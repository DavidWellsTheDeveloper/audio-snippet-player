<template>
  <v-app>
    <v-main class="trivia-presenter-main">
      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.trivia-presenter-main {
  min-height: 100vh;
}
</style>
