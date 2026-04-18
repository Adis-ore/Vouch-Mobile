const abandonedIds = new Set()

export function markAbandoned(id) { abandonedIds.add(String(id)) }
export function wasAbandoned(id) { return abandonedIds.has(String(id)) }
export function clearAbandoned(id) { abandonedIds.delete(String(id)) }
