// SWR-compatible generic fetcher. The generic parameter lets useSWR<T>
// infer the correct response type while keeping the fetcher type-safe.
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json() as Promise<T>;
}
