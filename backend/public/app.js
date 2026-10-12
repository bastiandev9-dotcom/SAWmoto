const METHOD = {
  get:    ['GET',    'bg-sky-500/15 text-sky-400 border-sky-500/30'],
  post:   ['POST',   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'],
  put:    ['PUT',    'bg-amber-500/15 text-amber-400 border-amber-500/30'],
  delete: ['DELETE', 'bg-rose-500/15 text-rose-400 border-rose-500/30'],
};
const STATUS = s => s.startsWith('2') ? 'text-emerald-400' : s.startsWith('4') ? 'text-amber-400' : 'text-rose-400';
const esc = s => (s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const refName = ref => ref.split('/').pop();

function exampleFrom(schema) {
  if (!schema) return {};
  if (schema.$ref) return { $ref: schema.$ref };
  if (schema.type === 'array') return [exampleFrom(schema.items)];
  const out = {};
  for (const [k, v] of Object.entries(schema.properties || {})) {
    if (v.example !== undefined) out[k] = v.example;
    else if (v.type === 'array') out[k] = [];
    else if (v.type === 'number') out[k] = 0;
    else out[k] = null;
  }
  return out;
}

function schemaLines(schema, spec, depth = 0) {
  if (!schema) return '';
  if (schema.$ref) return schemaLines(spec.components.schemas[refName(schema.$ref)], spec, depth);
  if (schema.allOf) return schema.allOf.map(s => schemaLines(s, spec, depth)).join('');
  return Object.entries(schema.properties || {}).map(([k, v]) => {
    const type = v.$ref ? refName(v.$ref) : Array.isArray(v.type) ? v.type.join(' | ') : (v.type || 'object');
    const req = (schema.required || []).includes(k);
    const ex = v.example !== undefined ? ` = <span class="text-brand">${esc(JSON.stringify(v.example))}</span>` : '';
    const desc = v.description ? ` <span class="text-slate-600">// ${esc(v.description)}</span>` : '';
    return `<div class="pl-${depth * 4}"><span class="text-violet-300">${esc(k)}</span>${req ? '' : '<span class="text-slate-600">?</span>'}<span class="text-slate-600">: </span><span class="text-emerald-300">${esc(type)}</span>${ex}${desc}</div>`;
  }).join('');
}

function endpointCard(method, path, op, spec) {
  const [label, cls] = METHOD[method];
  const id = method + path.replace(/[\/{}]/g, '-');
  const bodySchema = op.requestBody?.content?.['application/json']?.schema;
  const bodyExample = bodySchema ? JSON.stringify(exampleFrom(spec.components.schemas[refName(bodySchema.$ref)]), null, 2) : null;

  const responses = Object.entries(op.responses || {}).map(([code, r]) => {
    const ref = r.$ref ? spec.components.responses[refName(r.$ref)] : r;
    const sc = ref.content?.['application/json']?.schema;
    let ex = ref.content?.['application/json']?.example;
    if (ex === undefined && sc) {
      const resolved = sc.$ref ? spec.components.schemas[refName(sc.$ref)] : sc;
      if (resolved?.type === 'array' && resolved.items?.$ref) ex = [exampleFrom(spec.components.schemas[refName(resolved.items.$ref)])];
      else if (resolved) ex = exampleFrom(resolved);
    }
    const exHtml = ex !== undefined
      ? `<pre class="mt-2 overflow-x-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs leading-relaxed text-slate-300">${esc(JSON.stringify(ex, null, 2))}</pre>`
      : '';
    return `<div class="rounded-lg border border-line bg-panel/60 p-3">
      <div class="flex items-center gap-2"><span class="font-mono text-sm font-bold ${STATUS(code)}">${code}</span><span class="text-xs text-slate-400">${esc(ref.description || '')}</span></div>${exHtml}</div>`;
  }).join('');

  const bodyBlock = bodyExample ? `
    <div>
      <p class="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Request Body</p>
      <pre class="overflow-x-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs leading-relaxed text-slate-300">${esc(bodyExample)}</pre>
    </div>` : '';

  return `<article id="${esc(id)}" class="scroll-mt-24 rounded-2xl border border-line bg-panel p-5 transition hover:border-slate-600">
    <div class="flex flex-wrap items-center gap-3">
      <span class="rounded-md border px-2.5 py-1 font-mono text-xs font-bold ${cls}">${label}</span>
      <code class="font-mono text-sm text-white">/api${esc(path)}</code>
    </div>
    <h3 class="mt-3 font-semibold text-slate-200">${esc(op.summary || '')}</h3>
    ${op.description ? `<p class="mt-1 text-sm leading-relaxed text-slate-400">${esc(op.description)}</p>` : ''}
    <div class="mt-4 grid gap-4 ${bodyExample ? 'md:grid-cols-2' : ''}">
      ${bodyBlock}
      <div>
        <p class="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Responses</p>
        <div class="space-y-2">${responses}</div>
      </div>
    </div>
  </article>`;
}

async function render() {
  const spec = await fetch('./openapi.json').then(r => r.json());
  const byTag = {};
  for (const [path, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      if (!METHOD[method]) continue;
      const tag = (op.tags || ['Umum'])[0];
      (byTag[tag] ||= []).push(endpointCard(method, path, op, spec));
    }
  }

  document.getElementById('groups').innerHTML = Object.entries(byTag).map(([tag, cards]) => `
    <section>
      <h2 class="mb-4 flex items-center gap-3 text-xl font-extrabold text-white"><span class="h-5 w-1.5 rounded-full bg-brand"></span>${esc(tag)}</h2>
      <div class="space-y-4">${cards.join('')}</div>
    </section>`).join('');

  document.getElementById('schemas').innerHTML = Object.entries(spec.components.schemas)
    .filter(([n]) => n !== 'ErrorMessage')
    .map(([name, schema]) => `
      <div class="rounded-2xl border border-line bg-panel p-5">
        <h3 class="mb-3 font-mono text-sm font-bold text-brand">${esc(name)}</h3>
        <div class="space-y-1 overflow-x-auto font-mono text-xs leading-relaxed">
          <span class="text-slate-600">{</span>
          <div class="px-4">${schemaLines(schema, spec)}</div>
          <span class="text-slate-600">}</span>
        </div>
      </div>`).join('');

  document.getElementById('sidenav').innerHTML = Object.entries(byTag).map(([tag, cards]) => `
    <div class="pt-2 text-xs font-bold uppercase tracking-widest text-slate-600">${esc(tag)}</div>
    ${cards.map(c => {
      const m = c.match(/id="([^"]+)"/)[1];
      const label = c.match(/text-xs font-bold[^>]*>(\w+)<\/span>/)[1];
      const p = c.match(/>(\/api[^<]+)</)[1];
      const color = METHOD[label.toLowerCase()][1].split(' ')[1];
      return `<a href="#${m}" class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-400 hover:bg-panel hover:text-white"><span class="font-mono text-[10px] font-bold ${color}">${label}</span><span class="truncate font-mono text-xs">${esc(p.replace('/api', ''))}</span></a>`;
    }).join('')}`).join('');
}

render().catch(e => {
  document.getElementById('groups').innerHTML = `<p class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">Gagal memuat spec: ${esc(e.message)}</p>`;
});
