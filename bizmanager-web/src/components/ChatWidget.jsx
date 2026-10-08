import { useState, useRef, useEffect } from 'react'
import api, { getErrorMessage } from '../api/client'

const MESSAGE_ACCUEIL = {
  role: 'assistant',
  content: "Bonjour ! Je suis l'assistant PMEManager. Pose-moi une question sur l'application ou sur la gestion de ton entreprise.",
}

/**
 * ChatWidget — bulle flottante d'assistance IA (ChatterAvecIA), disponible
 * sur toutes les pages connectées (entrepreneur et admin).
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([MESSAGE_ACCUEIL])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const envoyer = async (e) => {
    e.preventDefault()
    const texte = input.trim()
    if (!texte || loading) return

    const historique = [...messages, { role: 'user', content: texte }]
    setMessages(historique)
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/assistant/chat/', { message: texte, historique })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reponse }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: getErrorMessage(err, "Je ne suis pas disponible pour le moment.") }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-primary-600 text-white shadow-floating flex items-center justify-center hover:bg-primary-700 transition-colors"
        aria-label="Assistant"
      >
        <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-robot'} text-xl`}></i>
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-96 h-[28rem] max-h-[70vh] bg-surface rounded-xl shadow-floating border border-border flex flex-col overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 bg-primary-600 text-white flex items-center gap-2 shrink-0">
            <i className="fa-solid fa-robot"></i>
            <span className="font-semibold text-sm">Assistant PMEManager</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-snug whitespace-pre-wrap ${
                  m.role === 'user' ? 'self-end bg-primary-600 text-white' : 'self-start bg-secondary-100 text-text-primary'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-secondary-100 rounded-lg px-3 py-2 text-sm text-text-secondary">
                <i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i>écrit...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={envoyer} className="flex items-center gap-2 p-2.5 border-t border-border shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ta question..."
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="submit" disabled={loading}
              className="h-9 w-9 shrink-0 rounded-md bg-primary-600 text-white flex items-center justify-center disabled:opacity-50"
              aria-label="Envoyer"
            >
              <i className="fa-solid fa-paper-plane text-sm"></i>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
