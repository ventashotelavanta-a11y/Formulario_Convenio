import { useState } from 'react'
import SuccessMessage from './SuccessMessage'

const N8N_WEBHOOK_URL = 'https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/convenio-avanta'
const VERCEL_API_URL = 'https://convenios-avanta-2026.vercel.app/api/generar-convenio-pdf'

type Status = 'idle' | 'pdf' | 'sending' | 'success' | 'error'

interface Fields {
  nombre: string
  apellidos: string
  empresa: string
  email: string
  telefono: string
  terms: boolean
}

const INITIAL: Fields = { nombre: '', apellidos: '', empresa: '', email: '', telefono: '', terms: false }

const inputCls =
  'w-full px-4 py-[14px] text-[15px] rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2933] font-kodchasan placeholder:text-[#C1C7CD] focus:outline-none focus:border-[#7FA44A] focus:bg-white transition-all focus:shadow-[0_0_0_3px_rgba(127,164,74,0.08)]'
const labelCls = 'block text-[11px] tracking-[.08em] uppercase mb-2 text-[#9CA3AF] font-medium font-kodchasan'

const statusLabel: Record<Status, string> = {
  idle: 'Enviar Convenio',
  pdf: 'Generando PDF…',
  sending: 'Enviando correo…',
  success: 'Enviado',
  error: 'Reintentar',
}

export default function ConvenioForm() {
  const [fields, setFields] = useState<Fields>(INITIAL)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('pdf')
    setErrorMsg('')

    const numeroConvenio = `AVA-${Date.now()}`
    const fechaActual = new Date().toISOString().split('T')[0]
    const clienteData = {
      nombre: fields.nombre.trim(),
      apellidos: fields.apellidos.trim(),
      nombreCompleto: `${fields.nombre.trim()} ${fields.apellidos.trim()}`,
      email: fields.email.trim().toLowerCase(),
      telefono: fields.telefono.trim(),
      empresa: fields.empresa.trim(),
    }

    try {
      const pdfRes = await fetch(VERCEL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroConvenio, cliente: clienteData, fecha: fechaActual }),
      })
      if (!pdfRes.ok) throw new Error(`Error al generar PDF: ${pdfRes.status}`)
      const pdfData = await pdfRes.json()

      setStatus('sending')
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          numeroConvenio,
          cliente: clienteData,
          pdf: { fileName: pdfData.fileName, base64: pdfData.pdfBase64 },
          origen: 'formulario_web',
          estado: 'pendiente',
        }),
      })
      if (!n8nRes.ok) {
        const txt = await n8nRes.text()
        throw new Error(`Error al enviar a n8n: ${n8nRes.status} - ${txt}`)
      }
      setStatus('success')
    } catch (err) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  const busy = status === 'pdf' || status === 'sending'

  return (
    <div
      className="relative md:w-[55%] flex flex-col justify-center overflow-hidden"
      style={{ padding: '60px 70px' }}
    >
      {/* subtle watermark */}
      <div
        className="absolute bottom-[-80px] right-[-80px] pointer-events-none z-0"
        style={{
          width: 380,
          height: 380,
          backgroundImage: "url('/logo_avanta_principal.png')",
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.03,
        }}
      />

      <div className="relative z-10">
        {status === 'success' ? (
          <SuccessMessage />
        ) : (
          <>
            <div className="text-center mb-9">
              <img
                src="/logo_avanta_principal.png"
                alt="Avanta Hotel & Villas"
                className="max-w-[100px] opacity-85 mx-auto mb-9"
              />
              <h1
                className="font-cormorant font-medium text-center text-[#1F2933] mb-2"
                style={{ fontSize: '28px', letterSpacing: '-0.01em' }}
              >
                Convenio Avanta Hotel &amp; Villas
              </h1>
              <p className="font-kodchasan text-[14px] leading-[1.6] text-[#9CA3AF] text-center">
                Complete el siguiente formulario para iniciar su solicitud de convenio empresarial.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex gap-4">
                <div className="flex-1 mb-5">
                  <label className={labelCls}>Nombre</label>
                  <input className={inputCls} type="text" placeholder="Ej. Tu Nombre" value={fields.nombre} onChange={set('nombre')} required />
                </div>
                <div className="flex-1 mb-5">
                  <label className={labelCls}>Apellidos</label>
                  <input className={inputCls} type="text" placeholder="Ej. Tus Apellidos" value={fields.apellidos} onChange={set('apellidos')} required />
                </div>
              </div>

              <div className="mb-5">
                <label className={labelCls}>Empresa</label>
                <input className={inputCls} type="text" placeholder="Nombre de su compañía" value={fields.empresa} onChange={set('empresa')} required />
              </div>

              <div className="mb-5">
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" placeholder="correo@empresa.com" value={fields.email} onChange={set('email')} required />
              </div>

              <div className="mb-5">
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} type="tel" placeholder="+52 (55) 0000 0000" value={fields.telefono} onChange={set('telefono')} required />
              </div>

              <div className="flex gap-[10px] items-start mt-[22px]">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-[2px] cursor-pointer accent-[#7FA44A]"
                  checked={fields.terms}
                  onChange={set('terms')}
                  required
                />
                <label htmlFor="terms" className="font-kodchasan text-[13px] text-[#9CA3AF] cursor-pointer normal-case tracking-normal font-normal">
                  He leído y acepto los términos y condiciones de servicio
                </label>
              </div>

              {status === 'error' && (
                <p className="mt-3 text-red-500 text-sm font-kodchasan">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-[25px] w-full py-4 text-[15px] font-semibold text-white rounded-lg transition-all font-kodchasan disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(127,164,74,0.25)] active:translate-y-0"
                style={{ background: busy ? '#7FA44A' : '#7FA44A' }}
              >
                {statusLabel[status]}
                {busy && (
                  <span className="spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full ml-2 align-middle" />
                )}
              </button>
            </form>

            <div className="mt-[50px] text-center font-kodchasan text-[13px] text-[#9CA3AF]">
              <p className="mb-[6px] leading-[1.6]">
                <strong className="text-[#1F2933] font-semibold">Avanta Hotel &amp; Villas</strong>
                <br />Ricardo Peña – Ejecutivo Comercial
              </p>
              <p>
                <a
                  href="https://www.google.com/maps/search/Avanta+Hotel+%26+Villas"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-[5px] text-[#7FA44A] no-underline transition-colors hover:text-[#5F7F34] text-[13px]"
                >
                  <i className="fas fa-map-marker-alt" /> Ver ubicación en Google Maps
                </a>
              </p>
              <div className="flex justify-center gap-3 mt-4">
                {[
                  { icon: 'fa-globe', title: 'Website' },
                  { icon: 'fa-whatsapp', fab: true, title: 'WhatsApp' },
                  { icon: 'fa-facebook-f', fab: true, title: 'Facebook' },
                  { icon: 'fa-instagram', fab: true, title: 'Instagram' },
                ].map((s) => (
                  <a
                    key={s.title}
                    href="#"
                    target="_blank"
                    rel="noreferrer"
                    title={s.title}
                    className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#9CA3AF] text-base transition-all hover:bg-[#7FA44A] hover:text-white hover:-translate-y-0.5"
                  >
                    <i className={`${s.fab ? 'fab' : 'fas'} ${s.icon}`} />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
