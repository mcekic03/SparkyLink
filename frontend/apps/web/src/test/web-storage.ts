/**
 * A `localStorage` for the node test environment.
 *
 * Most of this suite only needs storage, not a DOM, and starting jsdom costs
 * far more than those tests cost to run. Installed only when the environment has
 * no Storage of its own, so jsdom files are untouched.
 *
 * Proxied rather than a plain instance so `Object.keys(localStorage)` and index
 * access behave like the real thing.
 */
class MemoryStorage {
  private items = new Map<string, string>()

  get length(): number {
    return this.items.size
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value)
  }

  removeItem(key: string): void {
    this.items.delete(key)
  }

  clear(): void {
    this.items.clear()
  }

  storedKeys(): string[] {
    return [...this.items.keys()]
  }
}

const API = new Set([
  'length',
  'key',
  'getItem',
  'setItem',
  'removeItem',
  'clear',
  'storedKeys',
])

function createStorage(): unknown {
  const target = new MemoryStorage()

  return new Proxy(target, {
    get(_t, prop) {
      // Stored values are exposed as plain properties, as the real API does.
      if (typeof prop === 'string' && !API.has(prop)) {
        const stored = target.getItem(prop)
        if (stored !== null) return stored
      }

      // Read against the raw target and bind to it. Using the proxy as receiver
      // would send a method's own field access (`this.items`) back through the
      // trap above and look it up as a stored key.
      const value = Reflect.get(target, prop, target) as unknown
      return typeof value === 'function' ? value.bind(target) : value
    },
    set(_t, prop, value) {
      if (typeof prop === 'string' && !API.has(prop)) {
        target.setItem(prop, String(value))
        return true
      }
      return Reflect.set(target, prop, value, target)
    },
    deleteProperty(_t, prop) {
      if (typeof prop === 'string' && !API.has(prop)) {
        target.removeItem(prop)
        return true
      }
      return Reflect.deleteProperty(target, prop)
    },
    has(_t, prop) {
      return (
        (typeof prop === 'string' && target.getItem(prop) !== null) ||
        Reflect.has(target, prop)
      )
    },
    ownKeys() {
      return target.storedKeys()
    },
    getOwnPropertyDescriptor(_t, prop) {
      if (typeof prop === 'string' && target.getItem(prop) !== null) {
        return { configurable: true, enumerable: true, writable: true }
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  })
}

export function installWebStorage(): void {
  if ('localStorage' in globalThis) return

  // `Storage` has to exist too: tests spy on Storage.prototype to simulate
  // storage being blocked.
  Object.defineProperty(globalThis, 'Storage', {
    value: MemoryStorage,
    configurable: true,
    writable: true,
  })

  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorage(),
    configurable: true,
    writable: true,
  })
}
