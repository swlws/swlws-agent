import { httpRequest } from "@/fe/lib/http";

export interface PersonaTrait {
  dimension: string;
  value: string;
}

export interface Persona {
  summary: string;
  traits: PersonaTrait[];
  updatedAt: string;
}

export function getPersona(): Promise<Persona | null> {
  return httpRequest("/api/persona");
}
