interface AppLink {
  nombre: string
  descripcion: string
  url: string
  preview: string
}

// Agrega aquí cada nueva herramienta de Avanta conforme se vaya sumando al hub.
// `preview` es una captura real del hero de cada app, guardada en public/apps/.
const APPS: AppLink[] = [
  {
    nombre: 'Cotizador de Habitaciones',
    descripcion: 'Cotizaciones de hospedaje para clientes.',
    url: 'https://cotizacion-avanta-ricardo-pena-covarrubias-projects.vercel.app/',
    preview: '/apps/cotizador-habitaciones.jpg',
  },
  {
    nombre: 'Cotizador Sala NOVA',
    descripcion: 'Renta de sala de juntas y coffee break.',
    url: 'https://cotizacion-sala-nova.vercel.app/',
    preview: '/apps/cotizador-sala-nova.jpg',
  },
  {
    nombre: 'Formulario de Convenios',
    descripcion: 'Genera convenios corporativos en PDF para empresas.',
    url: 'https://formulario-convenio.vercel.app/',
    preview: '/apps/convenio.jpg',
  },
  {
    nombre: 'Reporte Semanal',
    descripcion: 'Llena el reporte de actividades semanal.',
    url: 'https://reporte-semanal-rho.vercel.app/',
    preview: '/apps/reporte-semanal.jpg',
  },
]

export default function AppsHub() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {APPS.map((app) => (
        <a
          key={app.nombre}
          href={app.url}
          target="_blank"
          rel="noreferrer"
          className="block bg-white rounded-xl shadow overflow-hidden hover:shadow-md transition-shadow border border-transparent hover:border-green"
        >
          <img src={app.preview} alt={app.nombre} className="w-full h-32 object-cover border-b border-gray-100" />
          <div className="p-5">
            <h3 className="font-semibold text-gray-800 mb-1">{app.nombre}</h3>
            <p className="text-sm text-gray-500">{app.descripcion}</p>
            <span className="inline-block mt-3 text-sm font-medium text-green-dark">Abrir →</span>
          </div>
        </a>
      ))}
    </div>
  )
}
