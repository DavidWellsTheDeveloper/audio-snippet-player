<script setup lang="ts">
const name = defineModel<string>({ required: true })

defineProps<{
  disabled?: boolean
  message: string
  messageClass?: string
}>()

const emit = defineEmits<{
  save: []
}>()
</script>

<template>
  <div>
    <v-divider class="my-4" />
    <p class="text-body2 font-weight-medium mb-2">Save snippet</p>
    <div class="d-flex align-center gap-2 flex-wrap save-snippet-form__row">
      <v-text-field
        v-model="name"
        label="Name"
        placeholder="My snippet"
        variant="outlined"
        density="compact"
        hide-details
        class="flex-grow-1 save-snippet-form__name"
        @keydown.enter.prevent="emit('save')"
      />
      <v-btn
        size="small"
        color="primary"
        :disabled="disabled"
        @click="emit('save')"
      >
        Save
      </v-btn>
    </div>
    <p
      v-if="message"
      class="text-caption text-medium-emphasis"
      :class="messageClass"
    >
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.save-snippet-form__name {
  max-width: 200px;
}

.save-snippet-form__row {
  margin-bottom: 0.5rem;
}
</style>
