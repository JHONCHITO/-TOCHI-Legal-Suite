export type Role = "superadmin" | "admin" | "abogado" | "asistente" | "cliente";

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

