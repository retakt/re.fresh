import { useAuthContext } from "@/components/providers/auth.tsx";

export function useAuth() {
  return useAuthContext()
}
