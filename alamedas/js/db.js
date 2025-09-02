
// db.js - Carga SQLite en el navegador usando sql.js
let __dbPromise = null;

async function ensureSqlJs() {
  if (!window.initSqlJs) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://sql.js.org/dist/sql-wasm.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar sql-wasm.js'));
      document.head.appendChild(s);
    });
  }
  const SQL = await window.initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  return SQL;
}

export async function getDb(){
  if (!__dbPromise){
    __dbPromise = (async () => {
      const SQL = await ensureSqlJs();
      const res = await fetch('data/residencial', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo descargar la base de datos.');
      const buf = await res.arrayBuffer();
      return new SQL.Database(new Uint8Array(buf));
    })();
  }
  return __dbPromise;
}

export async function all(sql, params = []){
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out = [];
  while (stmt.step()){
    out.push(stmt.getAsObject());
  }
  stmt.free();
  return out;
}

export async function get(sql, params = []){
  const rows = await all(sql, params);
  return rows[0] || null;
}
