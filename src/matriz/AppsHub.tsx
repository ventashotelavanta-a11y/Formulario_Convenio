interface AppLink {
  nombre: string
  descripcion: string
  url: string
}

// Agrega aquí cada nueva herramienta de Avanta conforme se vaya sumando al hub.
const APPS: AppLink[] = [
  {
    nombre: 'Formulario de Convenios',
    descripcion: 'Genera convenios corporativos en PDF para empresas.',
    url: 'https://formulario-convenio.vercel.app/',
  },
  {
    nombre: 'Cotizador de Habitaciones',
    descripcion: 'Cotizaciones de hospedaje para clientes.',
    url: 'https://cotizacion-avanta-ricardo-pena-covarrubias-projects.vercel.app/',
  },
  {
    nombre: 'Cotizador Sala NOVA',
    descripcion: 'Renta de sala de juntas y coffee break.',
    url: 'https://cotizacion-sala-nova.vercel.app/',
  },
  {
    nombre: 'Reporte Semanal',
    descripcion: 'Llena el reporte de actividades semanal.',
    url: 'https://reporte-semanal-rho.vercel.app/',
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
          className="bg-white rounded-xl shadow p-5 hover:shadow-md transition-shadow border border-transparent hover:border-green"
        >
          <h3 className="font-semibold text-gray-800 mb-1">{app.nombre}</h3>
          <p className="text-sm text-gray-500">{app.descripcion}</p>
          <span className="inline-block mt-3 text-sm font-medium text-green-dark">Abrir →</span>
        </a>
      ))}
    </div>
  )
}
