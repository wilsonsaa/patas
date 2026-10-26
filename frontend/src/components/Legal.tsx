import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, FileText } from 'lucide-react';
import { LEGAL } from '../legal';

const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-black text-gray-900 font-heading mt-9 mb-2">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="text-[15px] text-gray-700 leading-relaxed mb-3">{children}</p>;
const L = ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-gray-700 leading-relaxed mb-3">{children}</ul>;

function Privacidad() {
  return (
    <>
      <P>
        Esta política explica qué datos personales recoge PATAS (Plataforma de Acogida Temporal y Adopción Segura), para qué se usan y cómo
        puedes ejercer tus derechos, de acuerdo con la Ley 1581 de 2012 y el Decreto 1074 de 2015.
      </P>

      <H>1. Responsable del tratamiento</H>
      <P>
        <strong>{LEGAL.responsable}</strong><br />
        {LEGAL.direccion}<br />
        Correo: {LEGAL.correo} · Teléfono: {LEGAL.telefono}<br />
        Encargado del tratamiento: {LEGAL.encargado}.
      </P>

      <H>2. Datos que recogemos</H>
      <L>
        <li><strong>Cuenta:</strong> nombre, correo electrónico, teléfono, barrio y contraseña (guardada cifrada de forma irreversible).</li>
        <li><strong>Solicitud de adopción:</strong> número de documento, datos de contacto, tipo de vivienda y las respuestas sobre tu hogar: si hay niños, si alguien tiene alergias, si hay mujeres en embarazo y si conviven otros animales.</li>
        <li><strong>Hogar de paso:</strong> nombre del responsable, teléfono, sector y dirección para la visita de verificación.</li>
        <li><strong>Registro de mascota y de caninos de manejo especial:</strong> identificación y dirección del propietario, datos del animal, vacunación y, cuando aplica, datos de la póliza.</li>
        <li><strong>Donaciones:</strong> nombre, teléfono y, si lo indicas, correo.</li>
        <li><strong>Datos técnicos:</strong> dirección IP y fecha de las acciones que realizas, para seguridad y auditoría.</li>
      </L>
      <P>
        Las respuestas sobre alergias y embarazo son <strong>datos sensibles</strong> relativos a la salud. No estás obligado a entregarlos; se
        solicitan únicamente para evaluar si la adopción es segura para tu familia y para el animal, y solo los ve el equipo que gestiona tu solicitud.
      </P>

      <H>3. Para qué los usamos</H>
      <L>
        <li>Tramitar y hacer seguimiento a las solicitudes de adopción, incluidas las visitas posteriores a la entrega.</li>
        <li>Verificar y administrar la red de hogares de paso.</li>
        <li>Mantener el censo municipal de animales de compañía y el registro de caninos de manejo especial que exige la Ley 1801 de 2016.</li>
        <li>Contactarte para coordinar entrevistas, visitas, jornadas o la entrega de una donación.</li>
        <li>Proteger la plataforma contra abusos y elaborar estadísticas que no identifican a las personas.</li>
      </L>
      <P>No vendemos tus datos ni los usamos para publicidad.</P>

      <H>4. Qué se publica y qué no</H>
      <L>
        <li>Los <strong>hogares de paso</strong> aparecen solo con un código (por ejemplo, HP-0012). Su dirección, sector, responsable y teléfono no se publican.</li>
        <li>De quienes adoptan solo se muestra el <strong>primer nombre</strong> junto al testimonio.</li>
        <li>Documentos, direcciones y teléfonos de los ciudadanos nunca son visibles para otros usuarios.</li>
      </L>

      <H>5. Con quién se comparten</H>
      <P>
        Con el personal autorizado de la Dirección de Protección Animal y, para las solicitudes sobre un animal a su cargo, con el refugio u hogar de paso
        responsable (que no ve tu número de documento). También con las autoridades cuando la ley lo exija. La plataforma usa servicios de terceros que
        reciben datos técnicos de tu navegador: <strong>Google reCAPTCHA</strong> (protección contra robots), Google Fonts (tipografías) y los proveedores
        de las imágenes del mapa (Esri y OpenStreetMap).
      </P>

      <H>6. Tus derechos</H>
      <P>Como titular puedes, en cualquier momento y sin costo:</P>
      <L>
        <li>Conocer, actualizar y rectificar tus datos.</li>
        <li>Pedir prueba de la autorización que diste.</li>
        <li>Saber qué uso se les ha dado.</li>
        <li>Revocar la autorización o pedir que se supriman, salvo que exista un deber legal de conservarlos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio, después de haber reclamado ante el responsable.</li>
      </L>
      <P>
        Para ejercerlos escribe a {LEGAL.correo} indicando tu nombre, documento y la solicitud. Las <strong>consultas</strong> se responden en máximo
        10 días hábiles y los <strong>reclamos</strong> en máximo 15 días hábiles, según los artículos 14 y 15 de la Ley 1581 de 2012. Tu nombre, teléfono y
        barrio también puedes corregirlos tú mismo en «Mi cuenta».
      </P>

      <H>7. Menores de edad</H>
      <P>La plataforma está dirigida a personas mayores de edad. Los trámites deben hacerlos adultos; no se recogen de forma intencional datos de menores.</P>

      <H>8. Seguridad y conservación</H>
      <P>
        Los datos viajan cifrados cuando el sitio se sirve por HTTPS, las contraseñas se almacenan con un algoritmo de derivación irreversible, el acceso a la
        información reservada está limitado por roles y cada consulta de datos reservados queda registrada. Conservamos los datos mientras el trámite esté
        activo y por el tiempo que exijan las normas de archivo público aplicables.
      </P>

      <H>9. Cookies</H>
      <P>
        PATAS usa <strong>una sola cookie propia</strong>, estrictamente necesaria: la que mantiene tu sesión iniciada. No usamos cookies de publicidad ni de
        analítica. Google reCAPTCHA puede guardar sus propias cookies para distinguir personas de robots; su uso se rige por la{' '}
        <a className="text-emerald-700 font-semibold underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> y las{' '}
        <a className="text-emerald-700 font-semibold underline" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Condiciones del Servicio</a> de Google.
      </P>

      <H>10. Cambios</H>
      <P>Si esta política cambia de forma importante lo avisaremos en la plataforma antes de que el cambio aplique.</P>
    </>
  );
}

function Terminos() {
  return (
    <>
      <P>Al usar PATAS aceptas estos términos. Si no estás de acuerdo, por favor no uses la plataforma.</P>

      <H>1. Qué es PATAS</H>
      <P>
        Es un servicio gratuito del municipio de Mosquera para facilitar la adopción responsable, coordinar hogares de paso y realizar trámites de
        tenencia responsable de animales de compañía. Ningún trámite en la plataforma tiene costo.
      </P>

      <H>2. Tu cuenta</H>
      <L>
        <li>Debes ser mayor de edad y entregar información verdadera y actualizada.</li>
        <li>Eres responsable de mantener tu contraseña en secreto y de lo que se haga con tu cuenta.</li>
        <li>Podemos suspender cuentas que entreguen información falsa o hagan uso indebido del servicio.</li>
      </L>

      <H>3. Adopciones</H>
      <L>
        <li>Enviar una solicitud no garantiza la adopción. La decisión depende de la evaluación, la entrevista y la visita.</li>
        <li>Quien adopta asume las obligaciones de la Ley 84 de 1989, la Ley 1774 de 2016 y la Ley 1801 de 2016, y acepta las visitas de seguimiento.</li>
        <li>Está prohibido vender, regalar o abandonar a un animal adoptado. Si no puedes seguir cuidándolo, debes informar a la Dirección de Protección Animal.</li>
      </L>

      <H>4. Hogares de paso</H>
      <P>
        Inscribirse implica aceptar una visita de verificación. El hogar se compromete a cuidar a los animales a su cargo, a no cobrar por ellos y a
        gestionar las adopciones únicamente a través de la plataforma.
      </P>

      <H>5. Donaciones</H>
      <P>
        Se reciben únicamente donaciones en especie (alimento, medicamentos, insumos, cobijas, elementos de aseo) y voluntariado. <strong>PATAS no recibe
        dinero</strong> y nadie está autorizado a pedirte pagos o transferencias en su nombre.
      </P>

      <H>6. Uso indebido</H>
      <P>No está permitido suplantar a otra persona, publicar contenido falso u ofensivo, intentar acceder a datos de terceros ni usar medios automatizados para enviar formularios.</P>

      <H>7. Contenido</H>
      <P>
        Las fotos y textos que publiques deben ser tuyos o contar con permiso. Nos autorizas a mostrarlos en la plataforma para promover la adopción. Los
        logotipos institucionales pertenecen a sus respectivas entidades.
      </P>

      <H>8. Disponibilidad</H>
      <P>
        Procuramos que el servicio esté siempre disponible, pero puede interrumpirse por mantenimiento o fallas técnicas. La información sobre cada animal la
        suministra el refugio u hogar que lo tiene a cargo.
      </P>

      <H>9. Ley aplicable</H>
      <P>Estos términos se rigen por las leyes de la República de Colombia.</P>
    </>
  );
}

export default function Legal() {
  const { vistaActiva, setVistaActiva } = useTheme();
  const esPrivacidad = vistaActiva === 'privacidad';
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full">
      <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-bold mb-6" role="tablist">
        <button role="tab" aria-selected={esPrivacidad} onClick={() => setVistaActiva('privacidad')} className={`px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${esPrivacidad ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'}`}>
          <ShieldCheck className="w-4 h-4" /> Privacidad y datos
        </button>
        <button role="tab" aria-selected={!esPrivacidad} onClick={() => setVistaActiva('terminos')} className={`px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${!esPrivacidad ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'}`}>
          <FileText className="w-4 h-4" /> Términos de uso
        </button>
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-heading tracking-tight">
        {esPrivacidad ? 'Política de privacidad y tratamiento de datos personales' : 'Términos y condiciones de uso'}
      </h1>
      <p className="text-xs text-gray-500 mt-2 mb-6">Versión {LEGAL.version} · Vigente desde el {LEGAL.vigencia}</p>
      {esPrivacidad ? <Privacidad /> : <Terminos />}
    </article>
  );
}
