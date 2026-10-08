import { useState } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../api/client'
import { Button, Input, Select, Badge, Modal, ConfirmDialog, Card, Alert } from '../../components/ui'
import DataTable from '../../components/DataTable'

const emptyForm = { nom: '', prenom: '', email: '', numrcc: '', role: 'entrepreneur', is_active: true, password: '' }
const ROLE_OPTIONS = [
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'admin', label: 'Administrateur' },
]

export default function Users() {
  const { items, status, load, create, update, remove } = useCrud('/admin/users')
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true) }
  const openEdit = (u) => {
    setEditing(u)
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, numrcc: u.numrcc || '', role: u.role, is_active: u.is_active, password: '' })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    const payload = { ...form }
    if (!payload.password) delete payload.password
    try {
      if (editing) { await update(editing.id, payload); toast.success('Utilisateur mis à jour.') }
      else { await create(payload); toast.success('Utilisateur créé.') }
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
      toast.success('Utilisateur supprimé.')
      setDeleteTarget(null)
    } catch {
      toast.error('Impossible de supprimer cet utilisateur.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card
      title="Utilisateurs"
      subtitle={`${items.length} compte${items.length > 1 ? 's' : ''}`}
      actions={<Button icon="fa-plus" onClick={openAdd}>Nouvel utilisateur</Button>}
    >
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'nom', label: 'Nom', render: (u) => `${u.prenom} ${u.nom}` },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Rôle', render: (u) => <Badge variant={u.role === 'admin' ? 'primary' : 'neutral'}>{u.role}</Badge> },
          { key: 'is_active', label: 'Statut', render: (u) => <Badge variant={u.is_active ? 'success' : 'error'}>{u.is_active ? 'Actif' : 'Suspendu'}</Badge> },
        ]}
        actions={(u) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" icon="fa-pen" onClick={() => openEdit(u)} aria-label="Modifier" />
            <Button variant="ghost" size="sm" icon="fa-trash" className="text-error-600" onClick={() => setDeleteTarget(u)} aria-label="Supprimer" />
          </div>
        )}
        empty={<div className="text-center py-14 text-text-secondary text-sm">Aucun utilisateur pour le moment.</div>}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" form="user-form" loading={submitting}>Enregistrer</Button>
          </>
        }
      >
        {formError && <Alert type="error" className="mb-4">{formError}</Alert>}
        <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <Input label="Prénom" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </div>
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Rôle" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={ROLE_OPTIONS} />
          <Select
            label="Statut" value={form.is_active ? 'true' : 'false'}
            onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
            options={[{ value: 'true', label: 'Actif' }, { value: 'false', label: 'Suspendu' }]}
          />
          <Input
            label="Mot de passe" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint={editing ? 'Laisser vide pour ne pas le changer' : '8 caractères minimum'}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer cet utilisateur ?"
        description={`"${deleteTarget?.prenom} ${deleteTarget?.nom}" et toutes ses données seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  )
}
