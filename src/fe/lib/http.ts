import { getUid } from "@/fe/lib/uid";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  params?: Record<string, string>;
  body?: unknown;
}

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", params, body } = options;

  if (method === "GET") {
    const query = new URLSearchParams({ uid: getUid(), ...params });
    const res = await fetch(`${path}?${query.toString()}`);
    return res.json() as Promise<T>;
  }

  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: getUid(), ...body as object }),
  });
  return res.json() as Promise<T>;
}
