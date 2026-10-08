import { useState } from 'react'
import { useCrud } from '../../../hooks/useCrud'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { getErrorMessage } from '../../../api/client'
import { Button, Input, Modal, ConfirmDialog, EmptyState, ErrorState, Card, Alert } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

const emptyForm = { nom: '', description: '', prix: '' }
const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`

export default function Services() {
  const { currentId } = useEntreprise()
  const { items, status, load, create, update, remove } = useCrud(`/entreprises/${currentId}/services`)
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true) }
  const openEdit = (s) => {
    setEditing(s)
    setForm({ nom: s.nom, description: s.description || '', prix: s.prix })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    const payload = { ...form, prix: Number(form.prix) }
    try {
      if (editing) { await update(editing.id, payload); toast.success('Service mis à jour.') }
      else { await create(payload); toast.success('Service ajouté.') }
      setModalOpen(false)
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Service supprimé.')
      setDeleteTarget(null)
    } catch {
      toast.error('Impossible de supprimer ce service.')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card
      title="Services"
      subtitle={`${items.length} service${items.length > 1 ? 's' : ''}`}
      actions={<Button icon="fa-plus" onClick={openAdd}>Nouveau service</Button>}
    >
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'nom', label: 'Nom' },
          { key: 'description', label: 'Description' },
          { key: 'prix', label: 'Prix', render: (s) => fmt(s.prix) },
        ]}
        actions={(s) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" icon="fa-pen" onClick={() => openEdit(s)} aria-label="Modifier" />
            <Button variant="ghost" size="sm" icon="fa-trash" className="text-error-600" onClick={() => setDeleteTarget(s)} aria-label="Supprimer" />
          </div>
        )}
        empty={
          <EmptyState
            icon="fa-concierge-bell"
            title="Aucun service"
            description="Ajoutez les prestations proposées par votre entreprise."
            actionLabel="Nouveau service"
            onAction={openAdd}
          />
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le service' : 'Nouveau service'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" form="service-form" loading={submitting}>Enregistrer</Button>
          </>
        }
      >
        {formError && <Alert type="error" className="mb-4">{formError}</Alert>}
        <form id="service-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Prix" type="number" min="0" required value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer ce service ?"
        description={`"${deleteTarget?.nom}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  )
}
