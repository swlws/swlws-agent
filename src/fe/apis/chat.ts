import { httpRequest } from "@/fe/lib/http";

export function abortChat(): void {
  httpRequest("/api/chat/abort", { method: "POST" }).catch(() => {});
}
