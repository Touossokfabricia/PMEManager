import { useState, useEffect } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Card, Input, Button, Alert } from '../../components/ui'

export default function Profil() {
  const { user, refresh } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ nom: '', prenom: '', numrcc: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [pwd, setPwd] = useState({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' })
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdSubmitting, setPwdSubmitting] = useState(false)

  useEffect(() => {
    if (user) setForm({ nom: user.nom, prenom: user.prenom, numrcc: user.numrcc || '' })
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.put('/auth/me/', form)
      await refresh()
      toast.success('Profil mis à jour.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePwdSubmit = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess(false)
    if (pwd.nouveau_mot_de_passe !== pwd.confirmation) {
      setPwdError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    setPwdSubmitting(true)
    try {
      await api.post('/auth/change-password/', {
        ancien_mot_de_passe: pwd.ancien_mot_de_passe,
        nouveau_mot_de_passe: pwd.nouveau_mot_de_passe,
      })
      setPwd({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' })
      setPwdSuccess(true)
      toast.success('Mot de passe modifié.')
    } catch (err) {
      setPwdError(getErrorMessage(err))
    } finally {
      setPwdSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Card title="Mon profil" subtitle="Vos informations personnelles">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" value={user.email} disabled hint="L'email ne peut pas être modifié." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <Input label="Prénom" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </div>
          {user.role === 'entrepreneur' && (
            <Input label="Numéro RCCM" value={form.numrcc} onChange={(e) => setForm({ ...form, numrcc: e.target.value })} />
          )}
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={submitting}>Enregistrer</Button>
          </div>
        </form>
      </Card>

      <Card title="Mot de passe" subtitle="Modifier votre mot de passe de connexion">
        {pwdError && <Alert type="error" className="mb-4">{pwdError}</Alert>}
        {pwdSuccess && <Alert type="success" className="mb-4">Mot de passe modifié avec succès.</Alert>}
        <form onSubmit={handlePwdSubmit} className="flex flex-col gap-4">
          <Input
            label="Mot de passe actuel" type="password" required
            value={pwd.ancien_mot_de_passe} onChange={(e) => setPwd({ ...pwd, ancien_mot_de_passe: e.target.value })}
          />
          <Input
            label="Nouveau mot de passe" type="password" required hint="8 caractères minimum"
            value={pwd.nouveau_mot_de_passe} onChange={(e) => setPwd({ ...pwd, nouveau_mot_de_passe: e.target.value })}
          />
          <Input
            label="Confirmer le nouveau mot de passe" type="password" required
            value={pwd.confirmation} onChange={(e) => setPwd({ ...pwd, confirmation: e.target.value })}
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={pwdSubmitting}>Modifier le mot de passe</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
