let _unreadCount = 0
const listeners = new Set()

export function getUnreadCount() { return _unreadCount }

export function setUnreadCount(count) {
  _unreadCount = Math.max(0, count)
  listeners.forEach(fn => fn(_unreadCount))
}

export function decrementUnread() {
  if (_unreadCount > 0) setUnreadCount(_unreadCount - 1)
}

export function clearUnread() { setUnreadCount(0) }

export function subscribeUnread(fn) {
  listeners.add(fn)
  fn(_unreadCount)
  return () => listeners.delete(fn)
}
