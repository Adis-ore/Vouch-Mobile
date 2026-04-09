import * as SecureStore from 'expo-secure-store'

// SecureStore only supports string values up to ~2048 bytes per key.
// We use JSON.stringify/parse to stay compatible with the AsyncStorage shape.

export async function getItem(key) {
  try {
    return await SecureStore.getItemAsync(key)
  } catch (_) {
    return null
  }
}

export async function setItem(key, value) {
  try {
    await SecureStore.setItemAsync(key, value)
  } catch (_) {}
}

export async function removeItem(key) {
  try {
    await SecureStore.deleteItemAsync(key)
  } catch (_) {}
}
