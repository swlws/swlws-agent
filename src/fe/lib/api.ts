import { getUid } from "@/fe/lib/uid";

export function fetchWithUid(
  path: string,
  params?: Record<string, string>,
): Promise<Response> {
  const query = new URLSearchParams({
    uid: getUid(),
    ...params,
  });
  return fetch(`${path}?${query.toString()}`);
}
