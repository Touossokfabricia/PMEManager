import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../../api/client'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Card, Badge, PageLoader, ErrorState, Button, ConfirmDialog, Alert } from '../../../components/ui'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')
const STATUT_LABEL = { brouillon: 'Brouillon', en_attente: 'En attente', paye: 'Payée', en_retard: 'En retard', annulee: 'Annulée' }
const STATUT_VARIANT = { brouillon: 'neutral', en_attente: 'info', paye: 'success', en_retard: 'error', annulee: 'error' }

export default function FactureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentId } = useEntreprise()
  const toast = useToast()
  const [facture, setFacture] = useState(null)
  const [status, setStatus] = useState('loading')
  const [downloading, setDownloading] = useState(false)
  const [validerOpen, setValiderOpen] = useState(false)
  const [annulerOpen, setAnnulerOpen] = useState(false)
  const [supprimerOpen, setSupprimerOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const load = () => {
    if (!currentId) return
    setStatus('loading')
    api.get(`/entreprises/${currentId}/factures/${id}/`)
      .then(({ data }) => { setFacture(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [id, currentId])

  const appelerAction = async (action, { onSuccess, successMessage }) => {
    setActionError('')
    setActionLoading(true)
    try {
      const { data } = await api.post(`/entreprises/${currentId}/factures/${id}/${action}/`)
      setFacture(data)
      toast.success(successMessage)
      onSuccess?.()
    } catch (err) {
      setActionError(err.response?.data?.detail || "Une erreur est survenue.")
    } finally {
      setActionLoading(false)
    }
  }

  const marquerPayee = () => appelerAction('marquer-payee', { successMessage: 'Facture marquée comme payée.' })
  const valider = () => appelerAction('valider', { successMessage: 'Facture validée : stock déduit.', onSuccess: () => setValiderOpen(false) })
  const annuler = () => appelerAction('annuler', { successMessage: 'Facture annulée, stock restauré.', onSuccess: () => setAnnulerOpen(false) })

  const supprimer = async () => {
    setActionLoading(true)
    try {
      await api.delete(`/entreprises/${currentId}/factures/${id}/`)
      toast.success('Brouillon supprimé.')
      navigate('/factures')
    } catch {
      toast.error('Impossible de supprimer cette facture.')
      setActionLoading(false)
    }
  }

  const telechargerPdf = async () => {
    setDownloading(true)
    try {
      const res = await api.get(`/entreprises/${currentId}/factures/${id}/pdf/`, { responseType: 'blob' })
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
      setDownloading(false)
    }
  }

  if (status === 'loading') return <PageLoader />
  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link to="/factures" className="text-sm text-text-secondary hover:text-text-primary">
          <i className="fa-solid fa-arrow-left mr-1.5"></i>Retour aux factures
        </Link>
        <div className="flex flex-wrap gap-2 justify-end">
          {facture.peut_etre_modifiee && (
            <>
              <Button variant="outline" size="sm" icon="fa-pen" onClick={() => navigate(`/factures/${id}/edit`)}>Modifier</Button>
              <Button variant="secondary" size="sm" icon="fa-check" onClick={() => setValiderOpen(true)}>Valider</Button>
              <Button variant="danger" size="sm" icon="fa-trash" onClick={() => setSupprimerOpen(true)}>Supprimer</Button>
            </>
          )}
          {facture.statut === 'validee' && facture.statut_paiement !== 'paye' && (
            <>
              <Button variant="secondary" size="sm" icon="fa-circle-check" onClick={marquerPayee} loading={actionLoading}>
                Marquer comme payée
              </Button>
              <Button variant="danger" size="sm" icon="fa-ban" onClick={() => setAnnulerOpen(true)}>Annuler</Button>
            </>
          )}
          <Button variant="outline" size="sm" icon="fa-download" onClick={telechargerPdf} loading={downloading}>PDF</Button>
        </div>
      </div>

      {facture.statut === 'brouillon' && (
        <Alert type="info">
          Cette facture est un <strong>brouillon</strong> : modifiable et supprimable librement. Valide-la pour la verrouiller et déduire le stock.
        </Alert>
      )}
      {facture.statut === 'annulee' && (
        <Alert type="error">Cette facture a été annulée. Le stock déduit a été restauré.</Alert>
      )}

      <Card>
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{facture.numero}</h2>
            <p className="text-sm text-text-secondary mt-1">Client : {facture.client_nom}</p>
            <p className="text-sm text-text-secondary">
              Émise le {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Badge variant={STATUT_VARIANT[facture.statut_affiche]}>{STATUT_LABEL[facture.statut_affiche]}</Badge>
        </div>

        <div className="overflow-x-auto -mx-5 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-secondary border-b border-border">
                <th className="font-medium px-5 py-2">Description</th>
                <th className="font-medium px-5 py-2 text-right">Qté</th>
                <th className="font-medium px-5 py-2 text-right">PU</th>
                <th className="font-medium px-5 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {facture.lignes.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    {l.designation}
                    {!l.produit && <span className="ml-2 text-xs text-info-600">(service)</span>}
                  </td>
                  <td className="px-5 py-3 text-right">{l.quantite}</td>
                  <td className="px-5 py-3 text-right">{fmt(l.prix_unitaire)}</td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(l.montant_ligne)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-64 flex justify-between text-base font-semibold text-text-primary border-t border-border pt-3">
            <span>Total</span>
            <span>{fmt(facture.montant_total)} FCFA</span>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={validerOpen}
        title="Valider cette facture ?"
        description="Le stock des produits sera déduit et la facture ne pourra plus être modifiée ni supprimée (seulement annulée si elle n'est pas encore payée)."
        confirmLabel="Valider"
        loading={actionLoading}
        onConfirm={valider}
        onCancel={() => { setValiderOpen(false); setActionError('') }}
      />
      {validerOpen && actionError && <Alert type="error">{actionError}</Alert>}

      <ConfirmDialog
        open={annulerOpen}
        title="Annuler cette facture ?"
        description="Le statut passera à 'Annulée' et le stock déduit sera automatiquement restauré."
        confirmLabel="Annuler la facture"
        variant="danger"
        loading={actionLoading}
        onConfirm={annuler}
        onCancel={() => { setAnnulerOpen(false); setActionError('') }}
      />

      <ConfirmDialog
        open={supprimerOpen}
        title="Supprimer ce brouillon ?"
        description="Cette action est irréversible. Le brouillon n'a jamais affecté le stock."
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
        onConfirm={supprimer}
        onCancel={() => setSupprimerOpen(false)}
      />
    </div>
  )
}
