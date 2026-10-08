import { useState } from 'react'
import { useCrud } from '../../../hooks/useCrud'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { getErrorMessage } from '../../../api/client'
import { Button, Input, Modal, ConfirmDialog, EmptyState, ErrorState, Card, Alert } from '../../../components/ui'
import DataTable from '../../../components/DataTable'
import EvenementsModal from './EvenementsModal'

const emptyForm = { nom: '', prenom: '', telephone: '', poste: '', salaire: '', date_embauche: '' }
const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`

export default function Employes() {
  const { currentId } = useEntreprise()
  const { items, status, load, create, update, remove } = useCrud(`/entreprises/${currentId}/employes`)
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [evenementsTarget, setEvenementsTarget] = useState(null)

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true) }
  const openEdit = (emp) => {
    setEditing(emp)
    setForm({
      nom: emp.nom, prenom: emp.prenom, telephone: emp.telephone || '',
      poste: emp.poste || '', salaire: emp.salaire, date_embauche: emp.date_embauche || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    const payload = { ...form, salaire: Number(form.salaire || 0) }
    try {
      if (editing) { await update(editing.id, payload); toast.success('Employé mis à jour.') }
      else { await create(payload); toast.success('Employé ajouté.') }
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
      toast.success('Employé supprimé.')
      setDeleteTarget(null)
    } catch {
      toast.error('Impossible de supprimer cet employé.')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card
      title="Employés"
      subtitle={`${items.length} employé${items.length > 1 ? 's' : ''}`}
      actions={<Button icon="fa-plus" onClick={openAdd}>Nouvel employé</Button>}
    >
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'nom', label: 'Nom', render: (e) => `${e.prenom} ${e.nom}` },
          { key: 'poste', label: 'Poste' },
          { key: 'telephone', label: 'Téléphone' },
          { key: 'salaire', label: 'Salaire', render: (e) => fmt(e.salaire) },
        ]}
        actions={(e) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" icon="fa-star" onClick={() => setEvenementsTarget(e)} aria-label="Promotions / sanctions" />
            <Button variant="ghost" size="sm" icon="fa-pen" onClick={() => openEdit(e)} aria-label="Modifier" />
            <Button variant="ghost" size="sm" icon="fa-trash" className="text-error-600" onClick={() => setDeleteTarget(e)} aria-label="Supprimer" />
          </div>
        )}
        empty={
          <EmptyState
            icon="fa-id-badge"
            title="Aucun employé"
            description="Ajoutez les membres de votre équipe."
            actionLabel="Nouvel employé"
            onAction={openAdd}
          />
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier l'employé" : 'Nouvel employé'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" form="employe-form" loading={submitting}>Enregistrer</Button>
          </>
        }
      >
        {formError && <Alert type="error" className="mb-4">{formError}</Alert>}
        <form id="employe-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <Input label="Prénom" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </div>
          <Input label="Poste" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
          <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Salaire" type="number" min="0" value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value })} />
            <Input label="Date d'embauche" type="date" value={form.date_embauche} onChange={(e) => setForm({ ...form, date_embauche: e.target.value })} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer cet employé ?"
        description={`"${deleteTarget?.prenom} ${deleteTarget?.nom}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <EvenementsModal
        employe={evenementsTarget}
        onClose={() => setEvenementsTarget(null)}
        onChanged={() => { load(); setEvenementsTarget(null) }}
      />
    </Card>
  )
}
