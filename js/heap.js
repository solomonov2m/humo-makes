export class Heap {
  constructor() {
    this.ids = [];
    this.fs = [];
    this.gs = [];
  }

  get size() { return this.ids.length; }

  push(id, f, g) {
    const ids = this.ids;
    const fs = this.fs;
    const gs = this.gs;
    ids.push(id);
    fs.push(f);
    gs.push(g);
    let i = ids.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (fs[p] <= fs[i]) break;
      swap(ids, fs, gs, p, i);
      i = p;
    }
  }

  pop() {
    const ids = this.ids;
    const fs = this.fs;
    const gs = this.gs;
    const top = { id: ids[0], g: gs[0] };
    const id = ids.pop();
    const f = fs.pop();
    const g = gs.pop();
    if (ids.length) {
      ids[0] = id;
      fs[0] = f;
      gs[0] = g;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < ids.length && fs[l] < fs[m]) m = l;
        if (r < ids.length && fs[r] < fs[m]) m = r;
        if (m === i) break;
        swap(ids, fs, gs, m, i);
        i = m;
      }
    }
    return top;
  }
}

function swap(ids, fs, gs, a, b) {
  const tid = ids[a]; ids[a] = ids[b]; ids[b] = tid;
  const tf = fs[a]; fs[a] = fs[b]; fs[b] = tf;
  const tg = gs[a]; gs[a] = gs[b]; gs[b] = tg;
}
