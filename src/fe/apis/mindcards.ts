import { httpRequest } from "@/fe/lib/http";

export interface MindCard {
  title: string;
  desc: string;
  prompt: string;
}

export function getMindCards(): Promise<MindCard[]> {
  return httpRequest("/api/mindcards");
}
