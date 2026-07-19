interface AppLink {
  nombre: string
  descripcion: string
  url: string
  preview: 'gradiente' | 'claro'
  gradient?: string
  tagline: string
}

// Agrega aquí cada nueva herramienta de Avanta conforme se vaya sumando al hub.
// El "preview" reproduce el gradiente/tagline real del hero de cada app (no hay
// un archivo de imagen aparte que descargar — son renders CSS en vivo).
const APPS: AppLink[] = [
  {
    nombre: 'Cotizador de Habitaciones',
    descripcion: 'Cotizaciones de hospedaje para clientes.',
    url: 'https://cotizacion-avanta-ricardo-pena-covarrubias-projects.vercel.app/',
    preview: 'gradiente',
    gradient: 'linear-gradient(135deg, #8BB152 0%, #6B9040 100%)',
    tagline: 'Solicite su cotización personalizada',
  },
  {
    nombre: 'Cotizador Sala NOVA',
    descripcion: 'Renta de sala de juntas y coffee break.',
    url: 'https://cotizacion-sala-nova.vercel.app/',
    preview: 'gradiente',
    gradient: 'linear-gradient(160deg, #4e6b27 0%, #6b8c3e 55%, #84a44d 100%)',
    tagline: 'Reserve la Sala de Juntas NOVA',
  },
  {
    nombre: 'Formulario de Convenios',
    descripcion: 'Genera convenios corporativos en PDF para empresas.',
    url: 'https://formulario-convenio.vercel.app/',
    preview: 'gradiente',
    gradient: 'linear-gradient(135deg, #8BB152 0%, #6B9040 100%)',
    tagline: 'Precios especiales para empresas visionarias',
  },
  {
    nombre: 'Reporte Semanal',
    descripcion: 'Llena el reporte de actividades semanal.',
    url: 'https://reporte-semanal-rho.vercel.app/',
    preview: 'claro',
    tagline: 'Reporte Semanal',
  },
]

function Preview({ app }: { app: AppLink }) {
  if (app.preview === 'claro') {
    return (
      <div className="rounded-t-xl bg-[#FAFAF7] px-5 py-4 text-center border-b border-gray-100">
        <img src="/logo_avanta_principal.png" alt="" className="h-8 mx-auto mb-1 opacity-90" />
        <p className="font-cormorant text-lg text-gray-700">{app.tagline}</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-t-xl px-5 py-6 flex items-center justify-center text-center"
      style={{ background: app.gradient }}
    >
      <p className="font-cormorant italic text-lg text-white leading-snug">{app.tagline}</p>
    </div>
  )
}

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
          <Preview app={app} />
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
