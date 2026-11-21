"use client";
import { useEffect, useState } from "react";

type State<T> = { data?: T; error?: string; loading: boolean };

/** Minimal fetch hook: aborts stale requests, keeps previous data while reloading. */
export function useApi<T>(url: string | null): State<T> {
  const [state, setState] = useState<State<T>>({ loading: !!url });

  useEffect(() => {
    if (!url) {
      setState({ loading: false });
      return;
    }
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fetch(url, { signal: ac.signal })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Request failed");
        setState({ data: json as T, loading: false });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ error: e.message, loading: false });
      });
    return () => ac.abort();
  }, [url]);

  return state;
}
