export default function ConvenioAside() {
  return (
    <div
      className="relative md:w-[45%] flex flex-col justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #8BB152 0%, #6B9040 100%)', padding: '80px 60px' }}
    >
      {/* watermark logo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/logo_avanta_principal.png')",
          backgroundSize: '400px 400px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.1,
        }}
      />
      <div className="relative z-10 text-white">
        <h2
          className="font-cormorant font-normal italic leading-[1.2] mb-8"
          style={{ fontSize: '56px', letterSpacing: '-0.01em' }}
        >
          Precios especiales<br />para empresas<br />visionarias
        </h2>
        <div className="w-[60px] h-[2px] bg-white/50 mb-8" />
        <p className="font-kodchasan text-base leading-[1.7] opacity-[0.92]">
          Eleva la experiencia de viaje de tu equipo con tarifas corporativas
          preferenciales y atención personalizada en Avanta Hotel &amp; Villas.
        </p>
      </div>
    </div>
  )
}
