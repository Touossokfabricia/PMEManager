import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Button, ConfirmDialog } from '../../components/ui'

const SUGGESTIONS = [
  "Comment créer ma première facture ?",
  "Comment gérer plusieurs entreprises ?",
  "Comment suivre mon stock efficacement ?",
  "Quelques conseils pour fidéliser mes clients ?",
]

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

export default function Assistant() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [conversation, setConversation] = useState(null)
  const [loadingConv, setLoadingConv] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showListMobile, setShowListMobile] = useState(!id)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const bottomRef = useRef(null)

  const loadConversations = useCallback(() => {
    api.get('/assistant/conversations/').then(({ data }) => setConversations(data.results ?? data))
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    if (!id) { setConversation(null); return }
    setLoadingConv(true)
    api.get(`/assistant/conversations/${id}/`)
      .then(({ data }) => setConversation(data))
      .catch(() => navigate('/assistant'))
      .finally(() => setLoadingConv(false))
  }, [id, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages?.length])

  const envoyer = async (e, texteOverride) => {
    e?.preventDefault()
    const texte = (texteOverride ?? input).trim()
    if (!texte || sending) return

    let convId = id
    let estNouvelle = false
    if (!convId) {
      const { data } = await api.post('/assistant/conversations/', {})
      convId = data.id
      estNouvelle = true
    }

    const messageOptimiste = { id: `tmp-${Date.now()}`, role: 'user', contenu: texte, date_creation: new Date().toISOString() }
    setConversation((prev) => (prev && String(prev.id) === String(convId))
      ? { ...prev, messages: [...prev.messages, messageOptimiste] }
      : { id: convId, titre: 'Nouvelle conversation', messages: [messageOptimiste] })
    setInput('')
    setSending(true)
    if (estNouvelle) navigate(`/assistant/${convId}`, { replace: true })

    try {
      const { data } = await api.post(`/assistant/conversations/${convId}/envoyer/`, { message: texte })
      setConversation((prev) => ({ ...prev, titre: data.conversation.titre, messages: [...prev.messages, data.message] }))
      loadConversations()
    } catch (err) {
      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, {
          id: `err-${Date.now()}`, role: 'assistant',
          contenu: getErrorMessage(err, "Je ne suis pas disponible pour le moment."),
          date_creation: new Date().toISOString(),
        }],
      }))
    } finally {
      setSending(false)
    }
  }

  const nouveauChat = () => {
    navigate('/assistant')
    setShowListMobile(false)
  }

  const confirmerSuppression = async () => {
    setDeleting(true)
    try {
      await api.delete(`/assistant/conversations/${deleteTarget.id}/`)
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      if (String(deleteTarget.id) === String(id)) navigate('/assistant')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const initiales = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[520px] bg-surface rounded-xl border border-border overflow-hidden shadow-card">
      {/* ---------- Liste des conversations ---------- */}
      <aside className={`${showListMobile ? 'flex' : 'hidden'} md:flex w-full md:w-72 shrink-0 flex-col border-r border-border bg-secondary-50`}>
        <div className="p-3 border-b border-border">
          <Button icon="fa-plus" fullWidth onClick={nouveauChat}>Nouveau chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-sm text-text-secondary text-center p-6">Aucune conversation pour le moment.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 px-3 py-3 border-b border-border/60 cursor-pointer transition-colors
                  ${String(c.id) === String(id) ? 'bg-white' : 'hover:bg-white/60'}`}
                onClick={() => { navigate(`/assistant/${c.id}`); setShowListMobile(false) }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{c.titre}</p>
                  <p className="text-xs text-text-muted">{timeAgo(c.date_maj)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(c) }}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error-600 transition-opacity shrink-0"
                  aria-label="Supprimer"
                >
                  <i className="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ---------- Fil de conversation ---------- */}
      <div className={`${showListMobile ? 'hidden' : 'flex'} md:flex flex-1 flex-col min-w-0`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <button onClick={() => setShowListMobile(true)} className="md:hidden text-text-secondary" aria-label="Conversations">
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-sparkles text-white text-xs"></i>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {conversation?.titre || 'Assistant PMEManager'}
            </p>
            <p className="text-xs text-text-muted">Toujours disponible</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
          {!conversation || conversation.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4">
                <i className="fa-solid fa-sparkles text-white text-xl"></i>
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">Comment puis-je t'aider ?</h3>
              <p className="text-sm text-text-secondary mb-5 max-w-sm">
                Pose une question sur l'application ou sur la gestion de ton entreprise.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => envoyer(null, s)}
                    className="text-xs sm:text-sm px-3 py-2 rounded-full border border-border bg-surface hover:bg-secondary-50 text-text-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {conversation.messages.map((m) => (
                <div key={m.id} className={`flex items-end gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'assistant' ? (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-sparkles text-white text-xs"></i>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-secondary-200 text-secondary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {initiales}
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                      ${m.role === 'user'
                        ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-secondary-50 text-text-primary rounded-2xl rounded-bl-md border border-border'}`}
                  >
                    {m.contenu}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-end gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-sparkles text-white text-xs"></i>
                  </div>
                  <div className="bg-secondary-50 border border-border rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <form onSubmit={envoyer} className="flex items-center gap-2 p-3 border-t border-border shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écris ta question..."
            className="flex-1 rounded-full border border-border bg-secondary-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white"
          />
          <button
            type="submit" disabled={sending || !input.trim()}
            className="h-10 w-10 shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-700 transition-colors"
            aria-label="Envoyer"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer cette conversation ?"
        description={`"${deleteTarget?.titre}" et tous ses messages seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={confirmerSuppression}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
