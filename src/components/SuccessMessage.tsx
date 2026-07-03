export default function SuccessMessage() {
  return (
    <div className="text-center py-[60px] px-5">
      <div
        className="success-pop w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
        style={{ background: '#7FA44A' }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10"
          stroke="white"
          strokeWidth={3}
          fill="none"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2
        className="font-cormorant font-medium mb-5"
        style={{ fontSize: '36px', color: '#7FA44A' }}
      >
        ¡Solicitud enviada!
      </h2>
      <p className="font-kodchasan text-base leading-[1.7] text-[#9CA3AF] max-w-[400px] mx-auto">
        Gracias por su interés. Nuestro Ejecutivo Comercial se pondrá en contacto con usted a la brevedad.
      </p>
    </div>
  )
}
