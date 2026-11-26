// TUTOR-B · a stand-in language model on localhost (an Anthropic-format endpoint), so a check reads what the route SENDS and controls what comes BACK.
// It never leaves the machine and needs no key. `say(...texts)` queues replies in order (the last one repeats); `requests` holds every body it received.
// A queued item is the reply's text, or { text, stop, thought } for a reply that stopped some other way: `stop` is its stop_reason, `thought` puts a thinking block first, and text null sends no text block at all.
import http from 'node:http';

export async function startStandInModel() {
  const state = { queue: [], last: 'Which sentence in this stretch carries the claim?', requests: [], usage: { input_tokens: 10, output_tokens: 10 } };
  const server = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      try { state.requests.push(JSON.parse(b)); } catch { state.requests.push(null); }
      const item = state.queue.length ? state.queue.shift() : state.last;
      if (!state.queue.length) state.last = item;
      const { text = null, stop = 'end_turn', thought = false } = typeof item === 'string' ? { text: item } : item;
      const content = [...(thought ? [{ type: 'thinking', thinking: 'Weighing the question.', signature: 'x' }] : []), ...(text === null ? [] : [{ type: 'text', text }])];
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: 'stand-in', content, stop_reason: stop, stop_sequence: null, usage: state.usage }));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return {
    port: server.address().port,
    requests: state.requests,
    say: (...texts) => { state.queue.length = 0; state.queue.push(...texts); state.last = texts[texts.length - 1] ?? state.last; },
    reset: () => { state.requests.length = 0; state.queue.length = 0; },
    setUsage: (u) => { state.usage = u; },
    close: () => new Promise((r) => server.close(r)),
  };
}
