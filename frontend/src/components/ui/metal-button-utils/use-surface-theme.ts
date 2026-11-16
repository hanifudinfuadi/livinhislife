"use client";

import * as React from "react";

export type SurfaceTheme = "light" | "dark";

const readRoot = (): SurfaceTheme | null => {
  if (typeof document === "undefined") return null;
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return null;
};

/**
 * Resolves the surface theme for metal-fx.
 *
 * "auto" (default) follows a `.dark` / `.light` class on <html> — the same
 * convention shadcn uses — and only falls back to the OS preference when
 * neither class is present. A pinned "light" / "dark" value is returned as is.
 */
export function useSurfaceTheme(theme: "auto" | SurfaceTheme = "auto"): SurfaceTheme {
  const [resolved, setResolved] = React.useState<SurfaceTheme>(() => {
    if (theme !== "auto") return theme;
    return readRoot() ?? "light";
  });

  React.useEffect(() => {
    if (theme !== "auto") {
      setResolved(theme);
      return undefined;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setResolved(readRoot() ?? (media.matches ? "dark" : "light"));

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    media.addEventListener("change", update);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, [theme]);

  return resolved;
}