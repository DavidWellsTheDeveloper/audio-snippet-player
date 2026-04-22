const DB_NAME = 'audio-snippet-player-db'
const STORE_NAME = 'snippets'
const DB_VERSION = 1

export interface SavedSnippet {
  id: string
  name: string
  dateSaved: string
  playerUrl: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export function useSnippetsDb() {
  async function saveSnippet(payload: { name: string; playerUrl: string }): Promise<SavedSnippet> {
    const db = await openDb()
    const record: SavedSnippet = {
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      dateSaved: new Date().toISOString(),
      playerUrl: payload.playerUrl,
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.add(record)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(record)
      tx.oncomplete = () => db.close()
    })
  }

  async function getAllSnippets(): Promise<SavedSnippet[]> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const rows = (req.result as SavedSnippet[]) || []
        rows.sort((a, b) => (b.dateSaved < a.dateSaved ? -1 : 1))
        resolve(rows)
      }
      tx.oncomplete = () => db.close()
    })
  }

  async function deleteSnippet(id: string): Promise<void> {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(id)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve()
      tx.oncomplete = () => db.close()
    })
  }

  return { deleteSnippet, getAllSnippets, saveSnippet }
}
