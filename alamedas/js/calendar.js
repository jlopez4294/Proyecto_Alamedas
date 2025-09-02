
import { all } from './db.js';

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function pad(n){ return String(n).padStart(2,'0'); }

function buildSelectors(){
  const now = new Date();
  const ySel = document.getElementById('year');
  const mSel = document.getElementById('month');
  // Years: current -2 to current +2
  for (let y = now.getFullYear()-2; y <= now.getFullYear()+2; y++){
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === now.getFullYear()) opt.selected = true;
    ySel.appendChild(opt);
  }
  monthNames.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i+1; opt.textContent = name;
    if (i === now.getMonth()) opt.selected = true;
    mSel.appendChild(opt);
  });
}

function daysInMonth(y, m){
  return new Date(y, m, 0).getDate(); // m is 1-based here
}

function firstWeekday(y, m){
  return new Date(y, m-1, 1).getDay(); // 0=Sun
}

function renderHeader(y, m){
  document.getElementById('title').textContent = `${monthNames[m-1]} ${y}`;
}

function clear(el){ while (el.firstChild) el.removeChild(el.firstChild); }

function showDescription(eventObj){
  const panel = document.getElementById('event-detail');
  panel.innerHTML = `<div class="card"><h3>${eventObj.Titulo}</h3><p><strong>Fecha:</strong> ${eventObj.Fecha}</p><p>${eventObj.Descripcion}</p></div>`;
  panel.scrollIntoView({behavior:'smooth', block:'start'});
}

async function loadCalendar(){
  const y = parseInt(document.getElementById('year').value,10);
  const m = parseInt(document.getElementById('month').value,10);
  renderHeader(y,m);

  const tbody = document.querySelector('table.calendar tbody');
  clear(tbody);
  const days = daysInMonth(y,m);
  const start = firstWeekday(y,m);
  let day = 1;
  for (let r=0; r<6; r++){
    const tr = document.createElement('tr');
    for (let c=0; c<7; c++){
      const td = document.createElement('td');
      if (r===0 && c<start || day>days){
        td.innerHTML = '&nbsp;';
      } else {
        td.innerHTML = `<div style="font-weight:700;margin-bottom:.25rem">${day}</div><div class="events"></div>`;
        td.dataset.day = day;
        day++;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // Load events from DB
  try{
    const ym = `${y}-${pad(m)}`;
    const rows = await all(`SELECT Fecha, Titulo, Descripcion FROM Calendario WHERE substr(Fecha,1,7)=? ORDER BY Fecha`, [ym]);
    rows.forEach(ev => {
      const d = parseInt(ev.Fecha.split('-')[2],10);
      const cell = tbody.querySelector(`td[data-day="${d}"] .events`);
      if (cell){
        const a = document.createElement('a');
        a.href = '#'; a.className = 'event';
        a.textContent = ev.Titulo;
        a.addEventListener('click', (e) => { e.preventDefault(); showDescription(ev); });
        cell.appendChild(a);
      }
    });
  }catch(err){
    const panel = document.getElementById('event-detail');
    panel.innerHTML = `<div class="msg err">Error cargando eventos: ${err.message}</div>`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  buildSelectors();
  document.getElementById('year').addEventListener('change', loadCalendar);
  document.getElementById('month').addEventListener('change', loadCalendar);
  loadCalendar();
});
