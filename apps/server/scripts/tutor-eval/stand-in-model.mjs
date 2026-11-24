// TUTOR-B · a stand-in language model on localhost (an Anthropic-format endpoint), so a check reads what the route SENDS and controls what comes BACK.
// It never leaves the machine and needs no key. `say(...texts)` queues replies in order (the last one repeats); `requests` holds every body it received.
import http from 'node:http';

export async function startStandInModel() {
  const state = { queue: [], last: 'Which sentence in this stretch carries the claim?', requests: [], usage: { input_tokens: 10, output_tokens: 10 } };
  const server = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      try { state.requests.push(JSON.parse(b)); } catch { state.requests.push(null); }
      const text = state.queue.length ? state.queue.shift() : state.last;
      if (!state.queue.length) state.last = text;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: 'stand-in', content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: state.usage }));
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
