// SWR-compatible fetcher. The return type is intentionally `any` so that
// useSWR<T>(key, fetcher) can infer the response type from its generic
// parameter without a type mismatch on the fetcher signature.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher = async (url: string): Promise<any> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};
