// A clone that answers what JSON.parse(JSON.stringify(v)) answers, without copying the characters of a string: a string is immutable, so the clone shares it.
// The page's text is the one big string in a record (300 KB at 50,000 words); the round trip escaped and parsed all of it, twice per render of the editor (#85).
// Objects and arrays are always fresh (a caller may mutate what it was given); undefined, functions and symbols are dropped from an object and become null in an array,
// a number that is not finite becomes null, -0 becomes 0, an object with a toJSON is read through it, and a BigInt throws - as the round trip does.
function walk(v: unknown, inArray: boolean): unknown {
  if (v === null) return null;
  switch (typeof v) {
    case 'string':
    case 'boolean':
      return v;
    case 'number':
      return Number.isFinite(v) ? (v === 0 ? 0 : v) : null;
    case 'undefined':
    case 'function':
    case 'symbol':
      return inArray ? null : undefined;
    case 'bigint':
      throw new TypeError('Do not know how to serialize a BigInt');
    default:
      break;
  }
  const o = v as { toJSON?: unknown };
  if (typeof o.toJSON === 'function') return walk((o.toJSON as () => unknown).call(o), inArray);
  if (Array.isArray(v)) {
    const out = new Array(v.length);
    for (let i = 0; i < v.length; i += 1) out[i] = walk(v[i], true);
    return out;
  }
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v as object)) {
    const x = walk((v as Record<string, unknown>)[k], false);
    if (x === undefined) continue;
    // a "__proto__" key is data here, as it is after JSON.parse: assignment would set the prototype
    if (k === '__proto__') Object.defineProperty(out, k, { value: x, enumerable: true, writable: true, configurable: true });
    else out[k] = x;
  }
  return out;
}

export function cloneJson<T>(value: T): T {
  return walk(value, false) as T;
}
