import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrud } from '../../../hooks/useCrud'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { getErrorMessage } from '../../../api/client'
import { Button, Input, Modal, ConfirmDialog, EmptyState, ErrorState, Card, Alert } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

const emptyForm = { nom: '', contact: '', adresse: '' }

export default function Clients() {
  const { currentId } = useEntreprise()
  const { items, status, load, create, update, remove } = useCrud(`/entreprises/${currentId}/clients`)
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true) }
  const openEdit = (client) => {
    setEditing(client)
    setForm({ nom: client.nom, contact: client.contact || '', adresse: client.adresse || '' })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      if (editing) {
        await update(editing.id, form)
        toast.success('Client mis à jour.')
      } else {
        await create(form)
        toast.success('Client ajouté.')
      }
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
      toast.success('Client supprimé.')
      setDeleteTarget(null)
    } catch {
      toast.error('Impossible de supprimer ce client.')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card
      title="Clients"
      subtitle={`${items.length} client${items.length > 1 ? 's' : ''}`}
      actions={<Button icon="fa-plus" onClick={openAdd}>Nouveau client</Button>}
    >
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'nom', label: 'Nom', render: (c) => <Link to={`/clients/${c.id}`} className="text-primary-600 font-medium hover:underline">{c.nom}</Link> },
          { key: 'contact', label: 'Contact' },
          { key: 'adresse', label: 'Adresse' },
        ]}
        actions={(c) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" icon="fa-pen" onClick={() => openEdit(c)} aria-label="Modifier" />
            <Button variant="ghost" size="sm" icon="fa-trash" className="text-error-600" onClick={() => setDeleteTarget(c)} aria-label="Supprimer" />
          </div>
        )}
        empty={
          <EmptyState
            icon="fa-address-book"
            title="Aucun client"
            description="Ajoutez votre premier client pour commencer à créer des factures."
            actionLabel="Nouveau client"
            onAction={openAdd}
          />
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le client' : 'Nouveau client'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" form="client-form" loading={submitting}>Enregistrer</Button>
          </>
        }
      >
        {formError && <Alert type="error" className="mb-4">{formError}</Alert>}
        <form id="client-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input label="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Téléphone ou email" />
          <Input label="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer ce client ?"
        description={`"${deleteTarget?.nom}" sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  )
}
