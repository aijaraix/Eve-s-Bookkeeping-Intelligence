export async function boundedOllamaGenerate(url: string, body: Record<string, any>, timeoutMs: number, fetcher: typeof fetch = fetch): Promise<any> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('OLLAMA_RESPONSE_TIMEOUT')); }, timeoutMs);
    });
    const response = (async () => {
      const res = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
      if (!res.ok) throw new Error(`OLLAMA_HTTP_${res.status}`);
      const data = await res.json(); // Body reading is covered by the same deadline.
      if (data.done !== true || data.done_reason === 'length' || data.done_reason === 'max_tokens') throw new Error('OLLAMA_INCOMPLETE_RESPONSE');
      if (typeof data.response !== 'string' || !data.response.trim()) throw new Error('OLLAMA_EMPTY_RESPONSE');
      if (body.format && data.response.length > 16000) throw new Error('OLLAMA_OUTPUT_LIMIT');
      if (body.format) {
        const parsed = JSON.parse(data.response);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('OLLAMA_INVALID_JSON_OBJECT');
      }
      return data;
    })();
    return await Promise.race([response, timeout]);
  } finally { if (timer) clearTimeout(timer); }
}
