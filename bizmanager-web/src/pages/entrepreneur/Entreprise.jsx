import { useState, useEffect } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useEntreprise } from '../../context/EntrepriseContext'
import { Card, Input, Button, Alert, PageLoader, ConfirmDialog } from '../../components/ui'

export default function Entreprise() {
  const { current, currentId, reload } = useEntreprise()
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (current) setForm({ nom: current.nom, secteur_activite: current.secteur_activite || '', localisation: current.localisation || '' })
  }, [current])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.put(`/entreprises/${currentId}/`, form)
      await reload()
      toast.success('Informations mises à jour.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/entreprises/${currentId}/`)
      toast.success('Entreprise supprimée.')
      window.location.href = '/dashboard'
    } catch {
      toast.error("Impossible de supprimer cette entreprise.")
      setDeleting(false)
    }
  }

  if (!form || !current) return <PageLoader />

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Card title="Mon entreprise" subtitle="Informations de l'entreprise actuellement sélectionnée">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom de l'entreprise" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input label="Secteur d'activité" value={form.secteur_activite} onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })} />
          <Input label="Localisation" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} />
          <Input label="Date de création" value={new Date(current.date_creation).toLocaleDateString('fr-FR')} disabled />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={submitting}>Enregistrer</Button>
          </div>
        </form>
      </Card>

      <Card title="Zone de danger" className="border-error-200">
        <p className="text-sm text-text-secondary mb-4">
          La suppression d'une entreprise efface définitivement tous ses clients, produits, factures et employés.
        </p>
        <Button variant="danger" icon="fa-trash" onClick={() => setDeleteOpen(true)}>Supprimer cette entreprise</Button>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="Supprimer cette entreprise ?"
        description={`"${current.nom}" et toutes ses données seront définitivement supprimées. Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
