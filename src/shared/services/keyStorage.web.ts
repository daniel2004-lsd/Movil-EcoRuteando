// Wrapper de storage - plataforma web: expo-secure-store no existe en
// navegador (su implementacion web es un objeto vacio), asi que se usa
// localStorage con respaldo en memoria.
const memory = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.has(key) ? (memory.get(key) as string) : null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    window.localStorage.removeItem(key);
  } catch {
    memory.delete(key);
  }
}
