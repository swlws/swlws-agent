const registry = new Map<string, AbortController>();

function key(uid: string, conversationId: string): string {
  return `${uid}:${conversationId}`;
}

export function registerAbort(uid: string, conversationId: string): AbortSignal {
  const k = key(uid, conversationId);
  registry.get(k)?.abort();
  const controller = new AbortController();
  registry.set(k, controller);
  return controller.signal;
}

export function abortByConversation(uid: string, conversationId: string): void {
  const k = key(uid, conversationId);
  registry.get(k)?.abort();
  registry.delete(k);
}

export function releaseAbort(uid: string, conversationId: string): void {
  registry.delete(key(uid, conversationId));
}
