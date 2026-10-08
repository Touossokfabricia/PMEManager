import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../../api/client'
import { useCrud } from '../../../hooks/useCrud'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Button, Badge, ConfirmDialog, EmptyState, ErrorState, Card } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`
const STATUT_LABEL = { brouillon: 'Brouillon', en_attente: 'En attente', paye: 'Payée', en_retard: 'En retard', annulee: 'Annulée' }
const STATUT_VARIANT = { brouillon: 'neutral', en_attente: 'info', paye: 'success', en_retard: 'error', annulee: 'error' }

export default function Factures() {
  const { currentId } = useEntreprise()
  const { items, status, load, remove } = useCrud(`/entreprises/${currentId}/factures`)
  const toast = useToast()
  const navigate = useNavigate()

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [validatingId, setValidatingId] = useState(null)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Brouillon supprimé.')
      setDeleteTarget(null)
    } catch {
      toast.error('Impossible de supprimer cette facture.')
    } finally {
      setDeleting(false)
    }
  }

  const validerRapide = async (facture) => {
    setValidatingId(facture.id)
    try {
      await api.post(`/entreprises/${currentId}/factures/${facture.id}/valider/`)
      toast.success('Facture validée, stock déduit.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Impossible de valider cette facture.')
    } finally {
      setValidatingId(null)
    }
  }

  const telechargerPdf = async (facture) => {
    setDownloadingId(facture.id)
    try {
      const res = await api.get(`/entreprises/${currentId}/factures/${facture.id}/pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${facture.numero}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      if (err.response?.status === 501) {
        toast.error("Génération PDF indisponible : installe xhtml2pdf côté serveur.")
      } else {
        toast.error('Impossible de télécharger le PDF.')
      }
    } finally {
      setDownloadingId(null)
    }
  }

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card
      title="Factures"
      subtitle={`${items.length} facture${items.length > 1 ? 's' : ''}`}
      actions={<Button icon="fa-plus" onClick={() => navigate('/factures/add')}>Nouvelle facture</Button>}
    >
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'numero', label: 'N°', render: (f) => <Link to={`/factures/${f.id}`} className="text-primary-600 font-medium hover:underline">{f.numero}</Link> },
          { key: 'client_nom', label: 'Client' },
          { key: 'statut_affiche', label: 'Statut', render: (f) => <Badge variant={STATUT_VARIANT[f.statut_affiche]}>{STATUT_LABEL[f.statut_affiche]}</Badge> },
          { key: 'montant_total', label: 'Montant', render: (f) => fmt(f.montant_total) },
        ]}
        actions={(f) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" icon="fa-eye" onClick={() => navigate(`/factures/${f.id}`)} aria-label="Voir" />
            {f.peut_etre_modifiee && (
              <Button
                variant="ghost" size="sm" icon="fa-check" aria-label="Valider"
                loading={validatingId === f.id} onClick={() => validerRapide(f)}
              />
            )}
            <Button
              variant="ghost" size="sm" icon="fa-download" aria-label="Télécharger PDF"
              loading={downloadingId === f.id} onClick={() => telechargerPdf(f)}
            />
            {f.peut_etre_supprimee && (
              <Button variant="ghost" size="sm" icon="fa-trash" className="text-error-600" onClick={() => setDeleteTarget(f)} aria-label="Supprimer" />
            )}
          </div>
        )}
        empty={
          <EmptyState
            icon="fa-file-invoice"
            title="Aucune facture"
            description="Créez votre première facture pour vos clients."
            actionLabel="Nouvelle facture"
            onAction={() => navigate('/factures/add')}
          />
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer ce brouillon ?"
        description={`"${deleteTarget?.numero}" sera définitivement supprimé. (Les factures validées ne peuvent pas être supprimées, seulement annulées.)`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  )
}
