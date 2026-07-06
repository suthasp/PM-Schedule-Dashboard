"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { FilterProvider } from "@/components/providers/FilterProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export function Providers({ children }: { children: ReactNode }): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <FilterProvider>{children}</FilterProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
