const completedIds = new Set()

export function markCompleted(id) { completedIds.add(String(id)) }
export function wasCompleted(id) { return completedIds.has(String(id)) }
export function clearCompleted(id) { completedIds.delete(String(id)) }
