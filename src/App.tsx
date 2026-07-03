import ConvenioAside from './components/ConvenioAside'
import ConvenioForm from './components/ConvenioForm'

export default function App() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-5 md:p-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row min-h-[700px]">
        <ConvenioAside />
        <ConvenioForm />
      </div>
    </div>
  )
}
