
import { get, all } from './db.js';

function showMsg(type, text){
  const box = document.getElementById('resultado');
  box.className = 'msg ' + (type || '');
  box.textContent = text;
}

function clean(s){ return String(s || '').trim(); }

function validDPI(dpi){
  return /^\d{13}$/.test(dpi);
}

function validName(n){
  return /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s'-]{2,}$/.test(n);
}

function validDate(d){
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

async function consultarEstado(e){
  e.preventDefault();
  const dpi = clean(document.getElementById('dpi').value);
  const casa = parseInt(document.getElementById('casa').value,10);
  const nombre = clean(document.getElementById('nombre').value);
  const apellido = clean(document.getElementById('apellido').value);
  const fechaNac = clean(document.getElementById('fecha').value);

  // Validaciones
  if (!validDPI(dpi)) return showMsg('err', 'El DPI debe tener 13 dígitos numéricos.');
  if (!(casa>0)) return showMsg('err', 'El número de casa debe ser un entero positivo.');
  if (!validName(nombre)) return showMsg('err', 'Ingrese un primer nombre válido.');
  if (!validName(apellido)) return showMsg('err', 'Ingrese un primer apellido válido.');
  if (!validDate(fechaNac)) return showMsg('err', 'La fecha de nacimiento debe tener formato AAAA-MM-DD.');

  try{
    const inq = await get(
      `SELECT * FROM Inquilino 
       WHERE DPI=? AND NumeroCasa=? 
         AND lower(PrimerNombre)=lower(?) 
         AND lower(PrimerApellido)=lower(?) 
         AND FechaNacimiento=?`,
      [dpi, casa, nombre, apellido, fechaNac]
    );
    if (!inq){
      return showMsg('err', 'Los datos no coinciden con ningún inquilino registrado.');
    }

    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth()+1;

    const pago = await get(
      `SELECT 1 as ok FROM PagoDeCuotas WHERE NumeroCasa=? AND Anio=? AND Mes=?`,
      [casa, anio, mes]
    );

    if (pago){
      showMsg('ok', 'Cuota de mantenimiento al día.');
    } else {
      showMsg('warn', 'Cuota de mantenimiento pendiente.');
    }
  }catch(err){
    showMsg('err', 'Error de consulta: ' + err.message);
  }
}

async function consultarHistorial(e){
  e.preventDefault();
  const casa = parseInt(document.getElementById('casa').value,10);
  const y1 = parseInt(document.getElementById('y1').value,10);
  const m1 = parseInt(document.getElementById('m1').value,10);
  const y2 = parseInt(document.getElementById('y2').value,10);
  const m2 = parseInt(document.getElementById('m2').value,10);

  if (!(casa>0)) return showMsg('err', 'Primero ingrese un número de casa válido.');

  const startKey = y1*100 + m1;
  const endKey = y2*100 + m2;
  if (isNaN(startKey) || isNaN(endKey) || startKey > endKey){
    return showMsg('err', 'Rango de fechas inválido.');
  }

  try{
    const rows = await all(
      `SELECT Anio, Mes, FechaPago
         FROM PagoDeCuotas
        WHERE NumeroCasa=?
          AND (Anio*100 + Mes) BETWEEN ? AND ?
        ORDER BY Anio, Mes`,
      [casa, startKey, endKey]
    );

    const tbody = document.querySelector('#hist tbody');
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.Anio}</td><td>${String(r.Mes).padStart(2,'0')}</td><td>${r.FechaPago}</td>`;
      tbody.appendChild(tr);
    });
    if (rows.length === 0){
      showMsg('warn', 'No hay pagos en el rango seleccionado.');
    } else {
      showMsg('', ''); // clear
    }
  }catch(err){
    showMsg('err', 'Error al consultar historial: ' + err.message);
  }
}

function fillRangeSelectors(){
  const now = new Date();
  const ySel = [document.getElementById('y1'), document.getElementById('y2')];
  for (let y = now.getFullYear()-3; y <= now.getFullYear()+1; y++){
    ySel.forEach(sel => {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === now.getFullYear()) opt.selected = true;
      sel.appendChild(opt);
    });
  }
  const months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
  const mSel = [document.getElementById('m1'), document.getElementById('m2')];
  months.forEach((m,i) => {
    mSel.forEach(sel => {
      const opt = document.createElement('option');
      opt.value = (i+1); opt.textContent = String(i+1).padStart(2,'0');
      sel.appendChild(opt);
    });
  });
  document.getElementById('m1').value = 1;
  document.getElementById('m2').value = (now.getMonth()+1);
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('form-consulta').addEventListener('submit', consultarEstado);
  document.getElementById('btn-hist').addEventListener('click', consultarHistorial);
  fillRangeSelectors();
});
