import { useEffect, useState } from 'react';
import { api } from './api.js';

// Fetch once on mount; `data` is the fallback until the response arrives.
export function useApi(path, fallback) {
  const [data, setData] = useState(fallback);
  const [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    api(path).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [path]);
  return [data, error];
}

export const usePlans = () => useApi('/plans', [])[0];
