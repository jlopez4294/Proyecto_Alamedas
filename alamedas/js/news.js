
import { all } from './db.js';

function fmtDate(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-GT', { year:'numeric', month:'long', day:'2-digit'});
}

async function loadNews(){
  try{
    const rows = await all(`SELECT Fecha, Noticia FROM Noticias ORDER BY Fecha DESC LIMIT 3`);
    const wrap = document.getElementById('news');
    wrap.innerHTML = '';
    if (rows.length === 0){
      wrap.innerHTML = '<div class="msg warn">No hay noticias</div>';
      return;
    }
    rows.forEach(r => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `<div class="news-date">${fmtDate(r.Fecha)}</div><div>${r.Noticia}</div>`;
      wrap.appendChild(div);
    });
  }catch(err){
    console.error(err);
    document.getElementById('news').innerHTML = `<div class="msg err">Error cargando noticias: ${err.message}</div>`;
  }
}

window.addEventListener('DOMContentLoaded', loadNews);
