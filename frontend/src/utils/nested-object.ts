/**
 * Get a value from a nested object using dot notation path
 * @example getNestedValue({pet: {name: 'Buddy'}}, 'pet.name') // returns 'Buddy'
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}

/**
 * Set a value in a nested object using dot notation path
 * @example setNestedValue({pet: {name: 'Buddy'}}, 'pet.name', 'Max') // returns {pet: {name: 'Max'}}
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split('.')
  const result = JSON.parse(JSON.stringify(obj))
  let current: Record<string, unknown> = result

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
  return result
}
