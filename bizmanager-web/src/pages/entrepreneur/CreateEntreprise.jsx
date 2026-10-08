import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntreprise } from '../../context/EntrepriseContext'
import { getErrorMessage } from '../../api/client'
import { Card, Input, Button, Alert } from '../../components/ui'

const empty = { nom: '', secteur_activite: '', localisation: '' }

/**
 * CreateEntreprise — formulaire de création d'une entreprise.
 * Deux usages :
 * - onboarding=true : plein écran, quand l'entrepreneur n'a encore aucune entreprise.
 * - onboarding=false : utilisé dans la modale du sélecteur d'entreprise (voir EntrepriseSwitcher).
 */
export default function CreateEntreprise({ onboarding = false, onCreated }) {
  const { createEntreprise } = useEntreprise()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createEntreprise(form)
      if (onCreated) onCreated()
      else navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const formEl = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert type="error">{error}</Alert>}
      <Input label="Nom de l'entreprise" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
      <Input label="Secteur d'activité" value={form.secteur_activite} onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })} />
      <Input label="Localisation" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} />
      <Button type="submit" loading={submitting} fullWidth={onboarding}>Créer l'entreprise</Button>
    </form>
  )

  if (!onboarding) return formEl

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Card title="Créez votre première entreprise" subtitle="Vous pourrez en ajouter d'autres à tout moment." className="max-w-md w-full">
        {formEl}
      </Card>
    </div>
  )
}
