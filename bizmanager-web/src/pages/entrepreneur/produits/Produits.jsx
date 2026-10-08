import { useState } from 'react'
import { useCrud } from '../../../hooks/useCrud'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { getErrorMessage } from '../../../api/client'
import { Button, Input, Modal, ConfirmDialog, EmptyState, ErrorState, Card, Alert, Badge } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

const emptyForm = { nom: '', reference: '', prix_vente: '', prix_achat: '', quantite_stock: '', seuil_alerte: '5' }
const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`

export default function Produits() {
  const { currentId } = useEntreprise()
  const { items, status, load, create, update, remove } = useCrud(`/entreprises/${currentId}/produits`)
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ nom: p.nom, reference: p.reference || '', prix_vente: p.prix_vente, prix_achat: p.prix_achat, quantite_stock: p.quantite_stock, seuil_alerte: p.seuil_alerte })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    const payload = {
      ...form,
      prix_vente: Number(form.prix_vente),
      prix_achat: Number(form.prix_achat || 0),
      quantite_stock: Number(form.quantite_stock || 0),
      seuil_alerte: Number(form.seuil_alerte || 5),
    }
    try {
      if (editing) { await update(editing.id, payload); toast.success('Produit mis à jour.') }
      else { await create(payload); toast.success('Produit ajouté.') }
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
      toast.success('Produit supprimé.')
      setDeleteTarget(null)
    } catch {
      toast.error('Impossible de supprimer ce produit.')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card
      title="Produits"
      subtitle={`${items.length} produit${items.length > 1 ? 's' : ''}`}
      actions={<Button icon="fa-plus" onClick={openAdd}>Nouveau produit</Button>}
    >
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'nom', label: 'Nom' },
          { key: 'reference', label: 'Référence' },
          { key: 'prix_vente', label: 'Prix de vente', render: (p) => fmt(p.prix_vente) },
          {
            key: 'quantite_stock', label: 'Stock',
            render: (p) => <Badge variant={p.quantite_stock > p.seuil_alerte ? 'success' : p.quantite_stock > 0 ? 'warning' : 'error'}>{p.quantite_stock}</Badge>,
          },
        ]}
        actions={(p) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" icon="fa-pen" onClick={() => openEdit(p)} aria-label="Modifier" />
            <Button variant="ghost" size="sm" icon="fa-trash" className="text-error-600" onClick={() => setDeleteTarget(p)} aria-label="Supprimer" />
          </div>
        )}
        empty={
          <EmptyState
            icon="fa-box"
            title="Aucun produit"
            description="Ajoutez vos produits pour pouvoir les inclure dans vos factures."
            actionLabel="Nouveau produit"
            onAction={openAdd}
          />
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le produit' : 'Nouveau produit'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" form="produit-form" loading={submitting}>Enregistrer</Button>
          </>
        }
      >
        {formError && <Alert type="error" className="mb-4">{formError}</Alert>}
        <form id="produit-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input label="Référence" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix de vente" type="number" min="0" required value={form.prix_vente} onChange={(e) => setForm({ ...form, prix_vente: e.target.value })} />
            <Input label="Prix d'achat" type="number" min="0" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })} />
          </div>
          <Input label="Quantité en stock" type="number" min="0" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: e.target.value })} />
          <Input label="Seuil d'alerte" type="number" min="0" hint="Vous serez notifié quand le stock descend à ce niveau ou en dessous" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer ce produit ?"
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
