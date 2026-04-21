import { ref } from 'vue'
import { useSnippetsDb } from '~/composables/useSnippetsDb'
import { SNIPPET_MESSAGES, SNIPPET_SAVE_MESSAGE_CLEAR_MS } from '~/constants/snippet'

export function useSnippetSave() {
  const saveMessage = ref('')
  const saveName = ref('')
  const { saveSnippet } = useSnippetsDb()

  async function trySave(getPlayerUrl: () => string, guard: () => boolean) {
    if (typeof window === 'undefined' || !guard()) {
      return
    }

    const name = saveName.value.trim()
    if (!name) {
      return
    }

    try {
      await saveSnippet({ name, playerUrl: getPlayerUrl() })
      saveName.value = ''
      saveMessage.value = SNIPPET_MESSAGES.saved
      setTimeout(() => {
        saveMessage.value = ''
      }, SNIPPET_SAVE_MESSAGE_CLEAR_MS)
    } catch {
      saveMessage.value = SNIPPET_MESSAGES.saveFailed
    }
  }

  return { saveMessage, saveName, trySave }
}
