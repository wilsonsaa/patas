// Pruebas de extremo a extremo contra una API en ejecución.
//   API_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm test
import test from 'node:test';
import assert from 'node:assert/strict';

const URL_API = process.env.API_URL ?? 'http://localhost:3000';
const ADMIN = { correo: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const unico = Date.now();

function cliente() {
  let cookie = '';
  return async (metodo, ruta, cuerpo, cabeceras = { 'X-Patas': '1' }) => {
    const r = await fetch(URL_API + ruta, {
      method: metodo,
      headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(metodo === 'GET' ? {} : cabeceras), cookie },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const sc = r.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return { status: r.status, datos: await r.json().catch(() => null), setCookie: sc };
  };
}
const registro = (n) => ({ nombre: `Persona ${n}`, correo: `p${n}-${unico}@prueba.test`, telefono: '3101234567', barrio: 'Centro', password: 'ClaveSegura2026', aceptaDatos: true });
const solicitud = (mascotaId) => ({
  mascotaId, nombre: 'Ana Pérez', cedula: '1020304050', telefono: '3101234567', correo: 'ana@prueba.test', barrio: 'El Trébol',
  tipoVivienda: 'Apartamento', tieneOtrasMascotas: false, todosEnCasaDeAcuerdo: true, horasSoloAlDia: 4, motivoAdopcion: 'Queremos darle un hogar.',
  hayNinos: true, edadesNinos: '4 y 9', hayAlergias: false, hayEmbarazo: false, conoceResponsabilidadesLey: true,
});

const ana = cliente(), hogar = cliente(), admin = cliente(), anon = cliente();
let mascotas, hogarId, codigoHogar, mascotaHogar;

const MASCOTA_BASE = { especie: 'perro', raza: 'Criollo', edadCategoria: 'Joven', edadTexto: '2 años', genero: 'Macho', tamano: 'Mediano',
  fotos: ['https://ejemplo.test/foto.jpg'], descripcion: 'Rescatado y listo para adopción.', temperamento: ['Noble'],
  salud: { vacunado: true, esterilizado: true, desparasitado: true, microchip: false } };

// La plataforma arranca vacía: el administrador crea el refugio y publica los primeros animales.
test('preparación: el administrador inicial existe, crea un refugio y publica', async () => {
  assert.ok(ADMIN.correo, 'define ADMIN_EMAIL y ADMIN_PASSWORD');
  const login = await admin('POST', '/api/auth/login', ADMIN);
  assert.equal(login.status, 200);
  assert.equal(login.datos.rol, 'admin');
  assert.equal((await anon('POST', '/api/admin/refugios', { nombre: 'X', direccion: 'Calle 1', capacidad: 5 })).status, 401);
  const ref = await admin('POST', '/api/admin/refugios', { nombre: `Refugio prueba ${unico}`, direccion: 'Calle 2 # 3-4, Mosquera', capacidad: 20, lat: 4.7084, lng: -74.2302, telefono: '6010000000' });
  assert.equal(ref.status, 201);
  assert.match(ref.datos.codigo, /^REF-\d{4}$/);
  for (const nombre of ['Lucas', 'Mila']) {
    const r = await admin('POST', '/api/mascotas', { ...MASCOTA_BASE, nombre, hogarOrefugioId: ref.datos.id });
    assert.equal(r.status, 201);
  }
  const pub = (await anon('GET', '/api/lugares')).datos.find((l) => l.id === ref.datos.id);
  assert.equal(pub.direccion, 'Calle 2 # 3-4, Mosquera', 'la dirección de un refugio sí es pública');
});

test('lo público no expone datos de los hogares de paso', async () => {
  const { datos } = await anon('GET', '/api/lugares');
  const hogares = datos.filter((l) => l.tipo === 'hogar_paso');
  for (const h of hogares) {
    assert.match(h.nombre, /^Hogar de Paso HP-\d{4}$/);
    for (const campo of ['direccion', 'lat', 'lng', 'telefono', 'responsable', 'correo', 'sector'])
      assert.equal(h[campo], undefined, `un hogar no debe publicar ${campo}`);
  }
  mascotas = (await anon('GET', '/api/mascotas')).datos;
  for (const m of mascotas.filter((m) => m.esHogarPaso)) assert.equal(m.contactoWhatsapp, undefined);
});

test('las escrituras exigen la cabecera anti-CSRF y sesión', async () => {
  assert.equal((await anon('POST', '/api/donaciones', { nombre: 'x' }, {})).status, 403);
  assert.equal((await anon('POST', '/api/solicitudes', solicitud(mascotas[0].id))).status, 401);
  assert.equal((await anon('GET', '/api/admin/hogares')).status, 401);
});

test('registro, cookie httpOnly y contraseña débil', async () => {
  assert.equal((await ana('POST', '/api/auth/registro', { ...registro('ana'), password: 'corta' })).status, 400);
  const r = await ana('POST', '/api/auth/registro', registro('ana'));
  assert.equal(r.status, 201);
  assert.match(r.setCookie, /HttpOnly/i);
  assert.match(r.setCookie, /SameSite=Lax/i);
  assert.equal(r.datos.rol, 'adoptante');
  assert.equal((await cliente()('POST', '/api/auth/registro', registro('ana'))).status, 409);
  assert.equal((await cliente()('POST', '/api/auth/login', { correo: registro('ana').correo, password: 'incorrecta123' })).status, 401);
});

test('adopción: preguntas nuevas obligatorias', async () => {
  const m = mascotas.find((m) => m.estado === 'Disponible');
  const sinLey = { ...solicitud(m.id), conoceResponsabilidadesLey: false };
  assert.equal((await ana('POST', '/api/solicitudes', sinLey)).status, 400);
  const { hayEmbarazo, ...sinEmbarazo } = solicitud(m.id);
  assert.equal((await ana('POST', '/api/solicitudes', sinEmbarazo)).status, 400);
  const r = await ana('POST', '/api/solicitudes', solicitud(m.id));
  assert.equal(r.status, 201);
  assert.match(r.datos.radicado, /^ADP-\d{4}-\d{5}$/);
  assert.equal(r.datos.hayNinos, true);
  assert.equal(r.datos.edadesNinos, '4 y 9');
  assert.equal((await ana('POST', '/api/solicitudes', solicitud(m.id))).status, 409, 'no se duplica');
  // un ciudadano no puede aprobar su propia solicitud ni ver el panel
  assert.equal((await ana('PATCH', `/api/solicitudes/${r.datos.id}`, { estado: 'Aprobada' })).status, 403);
  assert.equal((await ana('GET', '/api/admin/hogares')).status, 403);
  assert.equal((await ana('GET', '/api/donaciones')).status, 403);
});

test('hogar de paso: queda pendiente con código y no puede publicar hasta ser verificado', async () => {
  await hogar('POST', '/api/auth/registro', registro('hogar'));
  const r = await hogar('POST', '/api/hogares', { nombre: 'Hogar Gómez', responsable: 'Luis Gómez', telefono: '3209998877', sector: 'Centro', direccion: 'Calle 1 # 2-3', capacidad: 1, aceptaVisita: true });
  assert.equal(r.status, 201);
  assert.match(r.datos.codigo, /^HP-\d{4}$/);
  assert.equal(r.datos.estado, 'pendiente');
  hogarId = r.datos.id; codigoHogar = r.datos.codigo;
  assert.ok(!(await anon('GET', '/api/lugares')).datos.some((l) => l.id === hogarId), 'pendiente no es público');
  assert.equal((await hogar('POST', '/api/mascotas', {})).status, 403);
});

test('admin verifica el hogar; el hogar publica y respeta su capacidad', async (t) => {
  if (!ADMIN.correo) return t.skip('sin credenciales de admin');
  const lista = (await admin('GET', '/api/admin/hogares')).datos;
  assert.equal(lista.find((h) => h.id === hogarId).direccion, 'Calle 1 # 2-3', 'el admin sí ve la dirección');
  assert.equal((await admin('PATCH', `/api/admin/hogares/${hogarId}`, { estado: 'verificado' })).status, 200);
  assert.equal((await hogar('GET', '/api/auth/yo')).datos.rol, 'hogar_paso');

  const mascota = { nombre: 'Nube', especie: 'gato', raza: 'Criolla', edadCategoria: 'Joven', edadTexto: '1 año', genero: 'Hembra', tamano: 'Pequeño',
    fotos: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba'], descripcion: 'Gatita rescatada muy dulce.', temperamento: ['Dulce'],
    salud: { vacunado: true, esterilizado: true, desparasitado: true, microchip: false } };
  assert.equal((await hogar('POST', '/api/mascotas', { ...mascota, fotos: ['javascript:alert(1)'] })).status, 400);
  assert.equal((await hogar('POST', '/api/mascotas', { ...mascota, fotos: ['data:image/png;base64,AAAA'] })).status, 400);
  const r = await hogar('POST', '/api/mascotas', mascota);
  assert.equal(r.status, 201);
  mascotaHogar = r.datos;
  assert.equal(r.datos.hogarOrefugioNombre, `Hogar de Paso ${codigoHogar}`);
  assert.equal(r.datos.contactoWhatsapp, undefined);
  assert.equal((await hogar('POST', '/api/mascotas', mascota)).status, 409, 'capacidad 1');
  // no puede tocar mascotas de otro lugar
  const ajena = mascotas.find((m) => m.hogarOrefugioId !== hogarId);
  assert.equal((await hogar('DELETE', `/api/mascotas/${ajena.id}`)).status, 403);
  const publico = (await anon('GET', '/api/lugares')).datos.find((l) => l.id === hogarId);
  assert.deepEqual(Object.keys(publico).sort(), ['capacidad', 'codigo', 'descripcion', 'id', 'mascotasActuales', 'municipio', 'nombre', 'tipo', 'verificado']);
});

test('flujo de aprobación: el hogar no ve la cédula y la mascota queda adoptada', async (t) => {
  if (!mascotaHogar) return t.skip('depende del admin');
  const s = await ana('POST', '/api/solicitudes', solicitud(mascotaHogar.id));
  assert.equal(s.status, 201);
  const vista = (await hogar('GET', '/api/solicitudes')).datos.find((x) => x.id === s.datos.id);
  assert.equal(vista.solicitanteCedula, '');
  assert.equal(vista.hayNinos, true);
  assert.equal((await hogar('PATCH', `/api/solicitudes/${s.datos.id}`, { estado: 'Aprobada', notas: 'Apta' })).status, 200);
  assert.equal((await anon('GET', '/api/mascotas')).datos.find((m) => m.id === mascotaHogar.id).estado, 'Adoptado');
  const adopcion = (await anon('GET', '/api/adopciones')).datos.find((a) => a.mascotaNombre === 'Nube');
  assert.equal(adopcion.adoptanteNombre, 'Ana', 'solo el primer nombre es público');
  assert.equal((await ana('GET', '/api/solicitudes')).datos.find((x) => x.id === s.datos.id).notasGestor, '', 'notas internas ocultas');
});

test('registro de mascota propia y de manejo especial', async () => {
  const prop = { propNombre: 'Ana Pérez', propTipoDoc: 'CC', propNumDoc: '1020304050', propTelefono: '3101234567', propDireccion: 'Carrera 3 # 4-5', propBarrio: 'Centro' };
  const m = await ana('POST', '/api/mascotas-propias', { ...prop, propZona: 'Urbana', nombre: 'Tango', especie: 'perro', raza: 'Criollo', sexo: 'Macho', edadAnios: 3, edadMeses: 2,
    esterilizado: true, antirrabica: true, antirrabicaFecha: '2026-03-10', antirrabicaLote: 'L123', aceptaDatos: true });
  assert.equal(m.status, 201);
  assert.match(m.datos.radicado, /^MAS-/);
  const mias = (await ana('GET', '/api/mascotas-propias')).datos;
  assert.equal(mias.length, 1);
  assert.equal(mias[0].antirrabica_fecha, '2026-03-10');
  assert.equal((await hogar('GET', '/api/mascotas-propias?todas=1')).datos.length, 0, 'otro usuario no ve las mías');

  const base = { ...prop, nombre: 'Thor', categoria: 'raza', raza: 'Rottweiler', sexo: 'Macho', residencia: 'Carrera 3 # 4-5', destino: 'convivencia',
    polizaTiene: true, polizaAseguradora: 'Seguros X', polizaNumero: 'P-1', polizaVigencia: '2027-01-01', vacunasVigentes: true, declaraVeracidad: true };
  assert.equal((await ana('POST', '/api/manejo-especial', { ...base, propMayorEdad: false })).status, 400);
  const e = await ana('POST', '/api/manejo-especial', { ...base, propMayorEdad: true });
  assert.equal(e.status, 201);
  assert.match(e.datos.radicado, /^RME-/);
  assert.equal((await ana('PATCH', `/api/manejo-especial/${e.datos.id}`, { estado: 'Aprobado' })).status, 403);
});

test('quiero donar: público, validado', async () => {
  assert.equal((await anon('POST', '/api/donaciones', { nombre: 'Carlos Ruiz', telefono: '3001112233', tipo: 'Bitcoin', descripcion: 'algo', aceptaDatos: true })).status, 400);
  const r = await anon('POST', '/api/donaciones', { nombre: 'Carlos Ruiz', telefono: '3001112233', tipo: 'Alimento', descripcion: '2 bultos de concentrado', aceptaDatos: true });
  assert.equal(r.status, 201);
  assert.match(r.datos.radicado, /^DON-/);
});

test('subida de archivos: solo imágenes reales', async () => {
  const subir = async (bytes, nombre) => {
    const f = new FormData();
    f.append('archivo', new Blob([bytes]), nombre);
    return fetch(URL_API + '/api/archivos', { method: 'POST', body: f, headers: { 'X-Patas': '1', cookie: await cookieDeAna() } });
  };
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0]);
  const ok = await subir(png, 'foto.png');
  assert.equal(ok.status, 201);
  const { url } = await ok.json();
  assert.match(url, /^\/uploads\/[a-f0-9]{32}\.png$/);
  const servido = await fetch(URL_API + url);
  assert.equal(servido.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await subir(new TextEncoder().encode('<script>alert(1)</script>'), 'foto.png')).status, 415);
});

// multipart no pasa por el cliente JSON: se obtiene una cookie iniciando sesión de nuevo
async function cookieDeAna() {
  const r = await fetch(URL_API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Patas': '1' },
    body: JSON.stringify({ correo: registro('ana').correo, password: 'ClaveSegura2026' }) });
  return r.headers.get('set-cookie').split(';')[0];
}

// ---------- Versión 1.3 ----------
test('donaciones: ya no se acepta dinero', async () => {
  const base = { nombre: 'Carlos Ruiz', telefono: '3001112233', descripcion: 'Aporte', aceptaDatos: true };
  assert.equal((await anon('POST', '/api/donaciones', { ...base, tipo: 'Dinero' })).status, 400);
  assert.equal((await anon('POST', '/api/donaciones', { ...base, tipo: 'Elementos de aseo' })).status, 201);
});

test('hallazgo: se guarda la coordenada, lo público solo ve la referencia', async (t) => {
  if (!mascotaHogar) return t.skip('depende del admin');
  // un ciudadano no puede georreferenciar
  assert.equal((await ana('PUT', `/api/mascotas/${mascotaHogar.id}/hallazgo`, { lat: 4.70, lng: -74.23 })).status, 403);
  // fuera de la zona de Mosquera
  assert.equal((await hogar('PUT', `/api/mascotas/${mascotaHogar.id}/hallazgo`, { lat: 6.25, lng: -75.56 })).status, 400);
  assert.equal((await hogar('PUT', `/api/mascotas/${mascotaHogar.id}/hallazgo`, { lat: 4.7051, lng: -74.2299, fecha: '2026-10-01', referencia: 'Parque principal' })).status, 200);
  const publica = (await anon('GET', '/api/mascotas')).datos.find((m) => m.id === mascotaHogar.id);
  assert.equal(publica.hallazgoReferencia, 'Parque principal');
  assert.equal(JSON.stringify(publica).includes('74.2299'), false, 'la coordenada no se publica');
  const mapa = (await admin('GET', '/api/gestion/hallazgos')).datos;
  assert.ok(mapa.some((p) => p.id === mascotaHogar.id && p.lat === 4.7051));
  assert.equal((await ana('GET', '/api/gestion/hallazgos')).status, 403);
});

test('seguimiento de adopciones', async (t) => {
  if (!mascotaHogar) return t.skip('depende del admin');
  const lista = (await admin('GET', '/api/gestion/adopciones')).datos;
  const a = lista.find((x) => x.mascota_nombre === 'Nube');
  assert.ok(a, 'la adopción aprobada aparece en el panel');
  assert.ok(a.proxima_visita, 'queda programada una primera visita');
  assert.ok((await hogar('GET', '/api/gestion/adopciones')).datos.some((x) => x.id === a.id), 'el hogar ve sus adopciones');
  assert.equal((await ana('GET', '/api/gestion/adopciones')).status, 403);
  const r = await hogar('POST', `/api/gestion/adopciones/${a.id}/seguimientos`, { fecha: new Date().toISOString().slice(0, 10), tipo: 'Visita', estado: 'Excelente', notas: 'Se adaptó muy bien', proximaVisita: '2099-01-01' });
  assert.equal(r.status, 201);
  const hist = (await admin('GET', `/api/gestion/adopciones/${a.id}/seguimientos`)).datos;
  assert.equal(hist[0].notas, 'Se adaptó muy bien');
  assert.equal((await admin('GET', '/api/gestion/adopciones')).datos.find((x) => x.id === a.id).seguimiento, 'Excelente');
});

test('recuperación de contraseña por enlace del administrador', async (t) => {
  if (!ADMIN.correo) return t.skip('sin admin');
  const pedro = cliente();
  const reg = await pedro('POST', '/api/auth/registro', registro('pedro'));
  // respuesta genérica, exista o no la cuenta
  const r1 = await anon('POST', '/api/auth/olvide', { correo: 'no-existe@prueba.test' });
  assert.ok([200, 503].includes(r1.status));
  assert.equal((await ana('POST', `/api/admin/usuarios/${reg.datos.id}/enlace`)).status, 403);
  const { token } = (await admin('POST', `/api/admin/usuarios/${reg.datos.id}/enlace`)).datos;
  assert.equal((await anon('POST', '/api/auth/restablecer', { token, password: 'corta' })).status, 400);
  assert.equal((await anon('POST', '/api/auth/restablecer', { token, password: 'NuevaClave2026' })).status, 200);
  assert.equal((await anon('POST', '/api/auth/restablecer', { token, password: 'OtraClave2026x' })).status, 400, 'el enlace es de un solo uso');
  assert.equal((await pedro('GET', '/api/auth/yo')).datos, null, 'la sesión anterior se cerró');
  assert.equal((await cliente()('POST', '/api/auth/login', { correo: registro('pedro').correo, password: 'NuevaClave2026' })).status, 200);
});

test('permisos: roles y reglas de integridad', async () => {
  // registrarse nunca otorga un rol distinto a ciudadano, aunque se intente
  const c = cliente();
  const r = await c('POST', '/api/auth/registro', { ...registro('rol'), rol: 'admin' });
  assert.equal(r.datos.rol, 'adoptante');
  for (const [m, ruta] of [['GET', '/api/admin/usuarios'], ['GET', '/api/admin/refugios'], ['GET', '/api/gestion/adopciones'], ['GET', '/api/donaciones'], ['POST', '/api/mascotas']])
    assert.equal((await c(m, ruta, m === 'POST' ? {} : undefined)).status, 403, `${m} ${ruta} debe estar prohibido para un ciudadano`);
  // el administrador no puede quitarse a sí mismo el rol ni desactivarse
  const yo = (await admin('GET', '/api/auth/yo')).datos;
  assert.equal((await admin('PATCH', `/api/admin/usuarios/${yo.id}`, { rol: 'adoptante' })).status, 400);
  // un gestor de refugio no administra usuarios ni refugios
  await admin('PATCH', `/api/admin/usuarios/${r.datos.id}`, { rol: 'refugio_admin' });
  assert.equal((await c('GET', '/api/auth/yo')).datos.rol, 'refugio_admin', 'el nuevo rol aplica de inmediato');
  assert.equal((await c('GET', '/api/admin/usuarios')).status, 403);
  assert.equal((await c('POST', '/api/admin/refugios', { nombre: 'X', direccion: 'Calle 1 2', capacidad: 2 })).status, 403);
  assert.equal((await c('GET', '/api/gestion/adopciones')).status, 200);
  // desactivar una cuenta cierra su sesión
  await admin('PATCH', `/api/admin/usuarios/${r.datos.id}`, { activo: false });
  assert.equal((await c('GET', '/api/auth/yo')).datos, null);
  assert.equal((await cliente()('POST', '/api/auth/login', { correo: registro('rol').correo, password: 'ClaveSegura2026' })).status, 401);
  // una mascota con adopción aprobada no se puede borrar ni volver a "Disponible" desde un hogar
  if (mascotaHogar) {
    assert.equal((await hogar('DELETE', `/api/mascotas/${mascotaHogar.id}`)).status, 409);
    assert.equal((await hogar('PATCH', `/api/mascotas/${mascotaHogar.id}/estado`, { estado: 'Disponible' })).status, 409);
  }
});
