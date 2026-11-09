import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q, radicado, tx } from '../db.js';
import { ErrorHttp, auditar, exigir } from '../auth.js';
import { correo, documento, fechaOpc, fotoOpc, telefono, texto, tipoDoc, uuid, validar } from '../validar.js';
import { nombrePublico } from './mascotas.js';
import { captcha } from '../recaptcha.js';
import { avisarEntidad, escapar as e, notificar } from '../correo.js';
import { config } from '../config.js';

export const RAZAS_MANEJO_ESPECIAL = [
  'American Staffordshire Terrier', 'Bullmastiff', 'Dóberman', 'Dogo Argentino', 'Dogo de Burdeos',
  'Fila Brasileiro', 'Mastín Napolitano', 'Bull Terrier', 'Pit Bull Terrier', 'American Pit Bull Terrier',
  'De Presa Canario', 'Rottweiler', 'Staffordshire Terrier', 'Tosa Japonés',
] as const;

const si = (m: string) => z.literal(true, { errorMap: () => ({ message: m }) });

const propietario = {
  propNombre: texto(120, 3), propTipoDoc: tipoDoc, propNumDoc: documento, propTelefono: telefono,
  propCorreo: z.union([z.literal(''), correo]).default(''), propDireccion: texto(200, 5), propBarrio: texto(120, 2),
};

function aSolicitud(s: any, verCedula: boolean) {
  return {
    id: s.id, radicado: s.radicado, mascotaId: s.mascota_id, mascotaNombre: s.m_nombre,
    mascotaFoto: s.m_fotos?.[0] ?? '', mascotaEspecie: s.m_especie,
    solicitanteNombre: s.nombre, solicitanteCedula: verCedula ? s.cedula : '',
    solicitanteTelefono: s.telefono, solicitanteCorreo: s.correo, solicitanteMunicipio: s.barrio,
    tipoVivienda: s.tipo_vivienda, tieneOtrasMascotas: s.tiene_otras_mascotas,
    detalleOtrasMascotas: s.detalle_otras_mascotas, todosEnCasaDeAcuerdo: s.todos_de_acuerdo,
    horasSoloAlDia: s.horas_solo, experienciaPrevia: s.experiencia, motivoAdopcion: s.motivo,
    hayNinos: s.hay_ninos, edadesNinos: s.edades_ninos, hayAlergias: s.hay_alergias,
    detalleAlergias: s.detalle_alergias, hayEmbarazo: s.hay_embarazo,
    conoceResponsabilidadesLey: s.conoce_responsabilidades_ley,
    fechaSolicitud: new Date(s.creado_en).toISOString().slice(0, 10), estado: s.estado,
    notasGestor: s.notas_gestor, fechaEntrevista: s.fecha_entrevista, hogarOrefugioId: s.m_lugar_id,
  };
}
const SQL_SOL = `SELECT s.*, m.nombre AS m_nombre, m.fotos AS m_fotos, m.especie AS m_especie, m.lugar_id AS m_lugar_id
  FROM solicitudes s JOIN mascotas m ON m.id = s.mascota_id`;

export default async function rutasTramites(app: FastifyInstance) {
  const limiteFormulario = { config: { rateLimit: { max: 8, timeWindow: '10 minutes' } } };

  // ---------- Solicitudes de adopción ----------
  app.get('/api/solicitudes', async (req) => {
    const u = await exigir(req);
    if (u.rol === 'admin' || u.rol === 'refugio_admin')
      return (await q(`${SQL_SOL} ORDER BY s.creado_en DESC LIMIT 1000`)).map((s) => aSolicitud(s, true));
    if (u.rol === 'hogar_paso') {
      // el hogar ve las postulaciones a sus animales (sin documento) y las propias
      const filas = await q(`${SQL_SOL} WHERE m.lugar_id = $1 OR s.usuario_id = $2 ORDER BY s.creado_en DESC`, [u.lugar_id, u.id]);
      return filas.map((s) => aSolicitud(s, s.usuario_id === u.id));
    }
    return (await q(`${SQL_SOL} WHERE s.usuario_id = $1 ORDER BY s.creado_en DESC`, [u.id]))
      .map((s) => ({ ...aSolicitud(s, true), notasGestor: '' })); // las notas internas no se muestran al solicitante
  });

  app.post('/api/solicitudes', { ...limiteFormulario, preHandler: captcha('adopcion') }, async (req, reply) => {
    const u = await exigir(req);
    const d = validar(z.object({
      mascotaId: uuid, nombre: texto(120, 3), cedula: documento, telefono, correo, barrio: texto(120, 2),
      tipoVivienda: z.enum(['Casa con patio', 'Apartamento', 'Finca', 'Casa sin patio']),
      tieneOtrasMascotas: z.boolean(), detalleOtrasMascotas: texto(300).default(''),
      todosEnCasaDeAcuerdo: z.boolean(), horasSoloAlDia: z.number().int().min(0).max(24),
      experienciaPrevia: texto(500).default(''), motivoAdopcion: texto(1500, 10),
      hayNinos: z.boolean(), edadesNinos: texto(120).default(''),
      hayAlergias: z.boolean(), detalleAlergias: texto(300).default(''),
      hayEmbarazo: z.boolean(),
      conoceResponsabilidadesLey: si('Debes declarar que conoces las responsabilidades de ley al adoptar'),
    }), req.body);
    const id = await tx(async (c) => {
      const m = await c.query("SELECT id, estado FROM mascotas WHERE id=$1 FOR UPDATE", [d.mascotaId]);
      if (!m.rowCount) throw new ErrorHttp(404, 'Mascota no encontrada.');
      if (m.rows[0].estado === 'Adoptado') throw new ErrorHttp(409, 'Esta mascota ya fue adoptada.');
      const dup = await c.query("SELECT 1 FROM solicitudes WHERE mascota_id=$1 AND usuario_id=$2 AND estado <> 'Rechazada'", [d.mascotaId, u.id]);
      if (dup.rowCount) throw new ErrorHttp(409, 'Ya tienes una solicitud activa para esta mascota.');
      const r = await c.query(
        `INSERT INTO solicitudes (radicado, mascota_id, usuario_id, nombre, cedula, telefono, correo, barrio, tipo_vivienda,
           tiene_otras_mascotas, detalle_otras_mascotas, todos_de_acuerdo, horas_solo, experiencia, motivo,
           hay_ninos, edades_ninos, hay_alergias, detalle_alergias, hay_embarazo, conoce_responsabilidades_ley)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,true) RETURNING id`,
        [await radicado('ADP', c), d.mascotaId, u.id, d.nombre, d.cedula, d.telefono, d.correo, d.barrio, d.tipoVivienda,
          d.tieneOtrasMascotas, d.tieneOtrasMascotas ? d.detalleOtrasMascotas : '', d.todosEnCasaDeAcuerdo, d.horasSoloAlDia,
          d.experienciaPrevia, d.motivoAdopcion, d.hayNinos, d.hayNinos ? d.edadesNinos : '',
          d.hayAlergias, d.hayAlergias ? d.detalleAlergias : '', d.hayEmbarazo]);
      await c.query("UPDATE mascotas SET estado='En proceso' WHERE id=$1 AND estado='Disponible'", [d.mascotaId]);
      return r.rows[0].id as string;
    });
    await auditar(req, u.id, 'solicitud_creada', 'solicitudes', id);
    const [s] = await q(`${SQL_SOL} WHERE s.id=$1`, [id]);
    notificar(req.log, s.correo, `Recibimos tu solicitud ${s.radicado}`, 'Solicitud de adopción radicada',
      [`Hola ${e(s.nombre.split(' ')[0])}, recibimos tu postulación para adoptar a <strong>${e(s.m_nombre)}</strong>.`,
        `Tu número de radicado es <strong>${s.radicado}</strong>. Te contactaremos para la entrevista y la visita.`],
      { texto: 'Ver mis solicitudes', url: `${config.appUrl}/#/solicitudes` });
    avisarEntidad(req.log, `Nueva solicitud de adopción ${s.radicado}`, [`${e(s.nombre)} se postuló para adoptar a <strong>${e(s.m_nombre)}</strong>.`], 'solicitudes');
    return reply.code(201).send(aSolicitud(s, true));
  });

  app.patch('/api/solicitudes/:id', async (req) => {
    const u = await exigir(req, 'hogar_paso', 'refugio_admin', 'admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const d = validar(z.object({
      estado: z.enum(['Pendiente', 'En evaluación', 'Entrevista agendada', 'Aprobada', 'Rechazada']),
      notas: texto(1000).optional(), fechaEntrevista: texto(160).optional(),
    }), req.body);
    await tx(async (c) => {
      const r = await c.query(`${SQL_SOL} WHERE s.id=$1 FOR UPDATE OF s`, [id]);
      const s = r.rows[0];
      if (!s) throw new ErrorHttp(404, 'Solicitud no encontrada.');
      if (u.rol === 'hogar_paso' && s.m_lugar_id !== u.lugar_id) throw new ErrorHttp(403, 'Esta solicitud corresponde a otro hogar.');
      if (s.usuario_id === u.id) throw new ErrorHttp(403, 'No puedes gestionar tu propia solicitud.');
      if (s.estado === 'Aprobada' && d.estado !== 'Aprobada') throw new ErrorHttp(409, 'Una adopción aprobada no puede revertirse desde aquí.');
      await c.query('UPDATE solicitudes SET estado=$1, notas_gestor=COALESCE($2, notas_gestor), fecha_entrevista=COALESCE($3, fecha_entrevista) WHERE id=$4',
        [d.estado, d.notas ?? null, d.fechaEntrevista ?? null, id]);
      if (d.estado === 'Aprobada' && s.estado !== 'Aprobada') {
        await c.query("UPDATE mascotas SET estado='Adoptado' WHERE id=$1", [s.mascota_id]);
        await c.query("UPDATE solicitudes SET estado='Rechazada', notas_gestor = notas_gestor || ' [Cierre automático: la mascota fue adoptada por otra familia]' WHERE mascota_id=$1 AND id<>$2 AND estado NOT IN ('Aprobada','Rechazada')", [s.mascota_id, id]);
        const l = await c.query('SELECT tipo, codigo, nombre FROM lugares WHERE id=$1', [s.m_lugar_id]);
        await c.query(
          `INSERT INTO adopciones (solicitud_id, mascota_nombre, mascota_foto, adoptante_nombre, lugar_nombre, testimonio, lugar_id, proxima_visita)
           VALUES ($1,$2,$3,$4,$5,$6,$7, current_date + 15) ON CONFLICT (solicitud_id) DO NOTHING`,
          [id, s.m_nombre, s.m_fotos?.[0] ?? '', s.nombre, nombrePublico(l.rows[0]), '¡Adopción aprobada! Un nuevo comienzo lleno de amor y lealtad.', s.m_lugar_id]);
      } else if (d.estado === 'Rechazada') {
        // si no quedan postulaciones activas, la mascota vuelve a estar disponible
        await c.query(`UPDATE mascotas SET estado='Disponible' WHERE id=$1 AND estado='En proceso'
          AND NOT EXISTS (SELECT 1 FROM solicitudes WHERE mascota_id=$1 AND estado NOT IN ('Rechazada'))`, [s.mascota_id]);
      }
    });
    await auditar(req, u.id, `solicitud_estado:${d.estado}`, 'solicitudes', id);
    const [s] = await q(`${SQL_SOL} WHERE s.id=$1`, [id]);
    const detalle: Record<string, string> = {
      'En evaluación': 'Estamos revisando la información de tu hogar.',
      'Entrevista agendada': `Tu entrevista quedó agendada${s.fecha_entrevista ? ` para: <strong>${e(s.fecha_entrevista)}</strong>` : ''}.`,
      Aprobada: '¡Felicitaciones! Tu adopción fue aprobada. Te contactaremos para coordinar la entrega y las visitas de seguimiento.',
      Rechazada: 'En esta ocasión la solicitud no fue aprobada. Puedes postularte para otros animales que esperan un hogar.',
    };
    if (detalle[d.estado])
      notificar(req.log, s.correo, `Tu solicitud ${s.radicado}: ${d.estado}`, `Solicitud ${d.estado.toLowerCase()}`,
        [`Hola ${e(s.nombre.split(' ')[0])}, tu solicitud para adoptar a <strong>${e(s.m_nombre)}</strong> cambió de estado.`, detalle[d.estado]],
        { texto: 'Ver mi solicitud', url: `${config.appUrl}/#/solicitudes` });
    return { ok: true };
  });

  // ---------- Registro de mascota propia ----------
  const cuerpoPropia = z.object({
    ...propietario, propZona: z.enum(['Urbana', 'Rural']),
    nombre: texto(60, 1), especie: z.enum(['perro', 'gato', 'otro']), raza: texto(80, 2), sexo: z.enum(['Macho', 'Hembra']),
    edadAnios: z.number().int().min(0).max(40), edadMeses: z.number().int().min(0).max(11),
    color: texto(60).default(''), tamano: z.enum(['', 'Pequeño', 'Mediano', 'Grande']).default(''),
    pesoKg: z.number().min(0).max(150).nullable().default(null), senas: texto(300).default(''),
    esterilizado: z.boolean(), microchipNumero: texto(30).default(''), foto: fotoOpc,
    antirrabica: z.boolean(), antirrabicaFecha: fechaOpc, antirrabicaLote: texto(40).default(''),
    antirrabicaLaboratorio: texto(80).default(''), otrasVacunas: texto(300).default(''),
    desparasitacionFecha: fechaOpc, veterinaria: texto(120).default(''), observaciones: texto(500).default(''),
    aceptaDatos: si('Debes autorizar el tratamiento de datos personales'),
  });

  app.post('/api/mascotas-propias', { ...limiteFormulario, preHandler: captcha('mascota_propia') }, async (req, reply) => {
    const u = await exigir(req);
    const d = validar(cuerpoPropia, req.body);
    const [r] = await q(
      `INSERT INTO mascotas_propias (radicado, usuario_id, prop_nombre, prop_tipo_doc, prop_num_doc, prop_telefono, prop_correo,
         prop_direccion, prop_barrio, prop_zona, nombre, especie, raza, sexo, edad_anios, edad_meses, color, tamano, peso_kg, senas,
         esterilizado, microchip_numero, foto, antirrabica, antirrabica_fecha, antirrabica_lote, antirrabica_laboratorio,
         otras_vacunas, desparasitacion_fecha, veterinaria, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
       RETURNING id, radicado`,
      [await radicado('MAS'), u.id, d.propNombre, d.propTipoDoc, d.propNumDoc, d.propTelefono, d.propCorreo, d.propDireccion,
        d.propBarrio, d.propZona, d.nombre, d.especie, d.raza, d.sexo, d.edadAnios, d.edadMeses, d.color, d.tamano, d.pesoKg,
        d.senas, d.esterilizado, d.microchipNumero, d.foto, d.antirrabica, d.antirrabica ? d.antirrabicaFecha : null,
        d.antirrabicaLote, d.antirrabicaLaboratorio, d.otrasVacunas, d.desparasitacionFecha, d.veterinaria, d.observaciones]);
    await auditar(req, u.id, 'mascota_propia_registrada', 'mascotas_propias', r.id);
    notificar(req.log, d.propCorreo || u.correo, `${d.nombre} quedó registrado · ${r.radicado}`, 'Mascota registrada',
      [`Registramos a <strong>${e(d.nombre)}</strong> en el censo municipal de animales de compañía.`, `Radicado: <strong>${r.radicado}</strong>. Preséntalo en las jornadas de vacunación y esterilización.`]);
    return reply.code(201).send(r);
  });

  app.get('/api/mascotas-propias', async (req) => {
    const u = await exigir(req);
    const todas = (u.rol === 'admin' || u.rol === 'refugio_admin') && (req.query as any)?.todas === '1';
    return q(`SELECT * FROM mascotas_propias ${todas ? '' : 'WHERE usuario_id = $1'} ORDER BY creado_en DESC LIMIT 2000`, todas ? [] : [u.id]);
  });

  // ---------- Razas de manejo especial ----------
  app.get('/api/manejo-especial/razas', async () => RAZAS_MANEJO_ESPECIAL);

  app.post('/api/manejo-especial', { ...limiteFormulario, preHandler: captcha('manejo_especial') }, async (req, reply) => {
    const u = await exigir(req);
    const d = validar(z.object({
      ...propietario, propMayorEdad: si('El registro debe hacerlo una persona mayor de edad'),
      nombre: texto(60, 1), categoria: z.enum(['raza', 'cruce', 'antecedente_agresion', 'adiestrado_ataque']),
      raza: texto(80, 2), sexo: z.enum(['Macho', 'Hembra']), edadTexto: texto(40).default(''),
      color: texto(60).default(''), senas: texto(300).default(''), microchipNumero: texto(30).default(''), foto: fotoOpc,
      residencia: texto(200, 5), destino: z.enum(['convivencia', 'guarda']),
      polizaTiene: z.boolean(), polizaAseguradora: texto(120).default(''), polizaNumero: texto(60).default(''), polizaVigencia: fechaOpc,
      vacunasVigentes: z.boolean(), antirrabicaFecha: fechaOpc,
      declaraVeracidad: si('Debes declarar que la información es veraz'),
    }), req.body);
    const [r] = await q(
      `INSERT INTO manejo_especial (radicado, usuario_id, prop_nombre, prop_tipo_doc, prop_num_doc, prop_telefono, prop_correo,
         prop_direccion, prop_barrio, prop_mayor_edad, nombre, categoria, raza, sexo, edad_texto, color, senas, microchip_numero, foto,
         residencia, destino, poliza_tiene, poliza_aseguradora, poliza_numero, poliza_vigencia, vacunas_vigentes, antirrabica_fecha)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       RETURNING id, radicado, estado`,
      [await radicado('RME'), u.id, d.propNombre, d.propTipoDoc, d.propNumDoc, d.propTelefono, d.propCorreo, d.propDireccion,
        d.propBarrio, d.nombre, d.categoria, d.raza, d.sexo, d.edadTexto, d.color, d.senas, d.microchipNumero, d.foto,
        d.residencia, d.destino, d.polizaTiene, d.polizaTiene ? d.polizaAseguradora : '', d.polizaTiene ? d.polizaNumero : '',
        d.polizaTiene ? d.polizaVigencia : null, d.vacunasVigentes, d.antirrabicaFecha]);
    await auditar(req, u.id, 'manejo_especial_radicado', 'manejo_especial', r.id);
    notificar(req.log, d.propCorreo || u.correo, `Registro de manejo especial ${r.radicado}`, 'Registro radicado',
      [`Recibimos el registro de <strong>${e(d.nombre)}</strong> (${e(d.raza)}).`, `Radicado: <strong>${r.radicado}</strong>. Te contactaremos para validar la póliza y el carné de vacunación.`]);
    avisarEntidad(req.log, `Registro de manejo especial ${r.radicado}`, [`${e(d.propNombre)} registró a <strong>${e(d.nombre)}</strong> (${e(d.raza)}).`]);
    return reply.code(201).send(r);
  });

  app.get('/api/manejo-especial', async (req) => {
    const u = await exigir(req);
    const todas = u.rol === 'admin' && (req.query as any)?.todas === '1';
    return q(`SELECT * FROM manejo_especial ${todas ? '' : 'WHERE usuario_id = $1'} ORDER BY creado_en DESC LIMIT 2000`, todas ? [] : [u.id]);
  });

  app.patch('/api/manejo-especial/:id', async (req) => {
    const u = await exigir(req, 'admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const d = validar(z.object({ estado: z.enum(['Radicado', 'En revisión', 'Requiere ajustes', 'Aprobado']), notas: texto(1000).default('') }), req.body);
    const r = await q(`UPDATE manejo_especial m SET estado=$1, notas=$2 FROM usuarios us WHERE m.id=$3 AND us.id = m.usuario_id
      RETURNING m.radicado, m.nombre, COALESCE(NULLIF(m.prop_correo, ''), us.correo) AS correo`, [d.estado, d.notas, id]);
    if (!r.length) throw new ErrorHttp(404, 'Registro no encontrado.');
    await auditar(req, u.id, `manejo_especial:${d.estado}`, 'manejo_especial', id);
    notificar(req.log, r[0].correo, `Registro ${r[0].radicado}: ${d.estado}`, `Registro ${d.estado.toLowerCase()}`,
      [`El registro de manejo especial de <strong>${e(r[0].nombre)}</strong> ahora está: <strong>${d.estado}</strong>.`, ...(d.notas ? [e(d.notas)] : [])]);
    return { ok: true };
  });

  // ---------- Quiero donar (formulario público, sin manejo de dinero) ----------
  app.post('/api/donaciones', { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } }, preHandler: captcha('donacion') }, async (req, reply) => {
    const d = validar(z.object({
      nombre: texto(120, 3), telefono, correo: z.union([z.literal(''), correo]).default(''),
      tipo: z.enum(['Alimento', 'Medicamentos e insumos', 'Cobijas y accesorios', 'Elementos de aseo', 'Tiempo o voluntariado', 'Otro']),
      descripcion: texto(1000, 5), aceptaDatos: si('Debes autorizar el tratamiento de datos personales'),
    }), req.body);
    const [r] = await q('INSERT INTO donaciones (radicado, nombre, telefono, correo, tipo, descripcion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING radicado',
      [await radicado('DON'), d.nombre, d.telefono, d.correo, d.tipo, d.descripcion]);
    await auditar(req, null, 'donacion_registrada', 'donaciones', r.radicado);
    avisarEntidad(req.log, `Nueva donación ${r.radicado}`, [`<strong>${e(d.nombre)}</strong> (${e(d.telefono)}) quiere donar: ${e(d.tipo)}.`, e(d.descripcion)]);
    if (d.correo) notificar(req.log, d.correo, '¡Gracias por tu donación!', 'Registramos tu intención de donar',
      [`Radicado <strong>${r.radicado}</strong>. La Dirección de Protección Animal te contactará para coordinar la entrega.`, 'PATAS no recibe dinero: solo donaciones en especie y voluntariado.']);
    return reply.code(201).send(r);
  });

  app.get('/api/donaciones', async (req) => {
    await exigir(req, 'admin', 'refugio_admin');
    return q('SELECT * FROM donaciones ORDER BY creado_en DESC LIMIT 2000');
  });

  app.patch('/api/donaciones/:id', async (req) => {
    const u = await exigir(req, 'admin', 'refugio_admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const d = validar(z.object({ estado: z.enum(['Nueva', 'Contactada', 'Recibida', 'Descartada']), notas: texto(1000).default('') }), req.body);
    const r = await q('UPDATE donaciones SET estado=$1, notas=$2 WHERE id=$3 RETURNING id', [d.estado, d.notas, id]);
    if (!r.length) throw new ErrorHttp(404, 'Donación no encontrada.');
    await auditar(req, u.id, `donacion:${d.estado}`, 'donaciones', id);
    return { ok: true };
  });

  // ---------- Administración de hogares de paso (datos reservados) ----------
  app.get('/api/admin/hogares', async (req) => {
    const u = await exigir(req, 'admin');
    await auditar(req, u.id, 'consulta_hogares_reservados');
    return q(`SELECT l.id, l.codigo, l.nombre, l.responsable, l.telefono, l.correo, l.sector, l.direccion, l.descripcion,
        l.capacidad, l.horario, l.estado, l.creado_en,
        (SELECT count(*)::int FROM mascotas m WHERE m.lugar_id = l.id AND m.estado <> 'Adoptado') AS ocupacion
      FROM lugares l WHERE l.tipo = 'hogar_paso' ORDER BY l.creado_en DESC`);
  });

  app.patch('/api/admin/hogares/:id', async (req) => {
    const u = await exigir(req, 'admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const d = validar(z.object({ estado: z.enum(['pendiente', 'verificado', 'rechazado', 'suspendido']) }), req.body);
    await tx(async (c) => {
      const r = await c.query("UPDATE lugares SET estado=$1 WHERE id=$2 AND tipo='hogar_paso' RETURNING usuario_id, codigo", [d.estado, id]);
      if (!r.rowCount) throw new ErrorHttp(404, 'Hogar no encontrado.');
      const dueno = r.rows[0].usuario_id;
      if (!dueno) return;
      const du = await c.query('SELECT correo, nombre FROM usuarios WHERE id=$1', [dueno]);
      const texto: Record<string, string> = {
        verificado: 'Tu hogar de paso fue <strong>verificado</strong>. Ya puedes ingresar y publicar a los animales que tengas a cargo.',
        rechazado: 'Después de la revisión, tu inscripción como hogar de paso no fue aprobada.',
        suspendido: 'Tu hogar de paso fue <strong>suspendido</strong> temporalmente. Comunícate con la Dirección de Protección Animal.',
      };
      if (texto[d.estado] && du.rows[0])
        notificar(req.log, du.rows[0].correo, `Hogar de paso ${r.rows[0].codigo}: ${d.estado}`, `Hogar de paso ${r.rows[0].codigo}`, [texto[d.estado]], { texto: 'Ir a PATAS', url: `${config.appUrl}/` });
      if (d.estado === 'verificado')
        await c.query("UPDATE usuarios SET rol='hogar_paso', lugar_id=$1 WHERE id=$2 AND rol IN ('adoptante','hogar_paso')", [id, dueno]);
      else
        await c.query("UPDATE usuarios SET rol='adoptante', lugar_id=NULL WHERE id=$1 AND rol='hogar_paso' AND lugar_id=$2", [dueno, id]);
    });
    await auditar(req, u.id, `hogar:${d.estado}`, 'lugares', id);
    return { ok: true };
  });

  app.get('/api/admin/resumen', async (req) => {
    await exigir(req, 'admin', 'refugio_admin');
    const [r] = await q(`SELECT
      (SELECT count(*)::int FROM lugares WHERE tipo='hogar_paso' AND estado='pendiente') AS hogares_pendientes,
      (SELECT count(*)::int FROM solicitudes WHERE estado='Pendiente') AS solicitudes_pendientes,
      (SELECT count(*)::int FROM mascotas_propias) AS mascotas_registradas,
      (SELECT count(*)::int FROM manejo_especial WHERE estado IN ('Radicado','En revisión')) AS manejo_especial_pendientes,
      (SELECT count(*)::int FROM donaciones WHERE estado='Nueva') AS donaciones_nuevas,
      (SELECT count(*)::int FROM adopciones WHERE seguimiento <> 'Cerrado' AND proxima_visita <= current_date) AS seguimientos_vencidos`);
    return r;
  });
}
