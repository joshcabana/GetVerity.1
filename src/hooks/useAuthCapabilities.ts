import { useQuery } from "@tanstack/react-query";
import { fetchAuthCapabilities } from "@/lib/authCapabilities";

export const useAuthCapabilities = () => {
  return useQuery({
    queryKey: ["auth-capabilities"],
    queryFn: fetchAuthCapabilities,
    staleTime: 2 * 60_000,
    retry: 1,
  });
};
