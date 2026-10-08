import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../../api/client'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Card, Badge, PageLoader, ErrorState, EmptyState } from '../../../components/ui'

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`
const STATUT_LABEL = { brouillon: 'Brouillon', en_attente: 'En attente', paye: 'Payée', en_retard: 'En retard', annulee: 'Annulée' }
const STATUT_VARIANT = { brouillon: 'neutral', en_attente: 'info', paye: 'success', en_retard: 'error', annulee: 'error' }

export default function ClientDetail() {
  const { id } = useParams()
  const { currentId } = useEntreprise()
  const [client, setClient] = useState(null)
  const [factures, setFactures] = useState([])
  const [status, setStatus] = useState('loading')

  const load = () => {
    if (!currentId) return
    setStatus('loading')
    Promise.all([
      api.get(`/entreprises/${currentId}/clients/${id}/`),
      api.get(`/entreprises/${currentId}/factures/?client=${id}`),
    ])
      .then(([clientRes, facturesRes]) => {
        setClient(clientRes.data)
        setFactures(facturesRes.data.results ?? facturesRes.data)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [id, currentId])

  if (status === 'loading') return <PageLoader />
  if (status === 'error') return <ErrorState onRetry={load} />

  const totalFacture = factures.reduce((s, f) => s + Number(f.montant_total), 0)

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <Link to="/clients" className="text-sm text-text-secondary hover:text-text-primary">
        <i className="fa-solid fa-arrow-left mr-1.5"></i>Retour aux clients
      </Link>

      <Card>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{client.nom}</h2>
            <p className="text-sm text-text-secondary mt-1">{client.contact || 'Aucun contact renseigné'}</p>
            <p className="text-sm text-text-secondary">{client.adresse || 'Aucune adresse renseignée'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary">Total facturé</p>
            <p className="text-xl font-semibold text-text-primary">{fmt(totalFacture)}</p>
          </div>
        </div>
      </Card>

      <Card title="Historique des transactions" subtitle={`${factures.length} facture${factures.length > 1 ? 's' : ''}`}>
        {factures.length === 0 ? (
          <EmptyState icon="fa-file-invoice" title="Aucune facture" description="Ce client n'a encore aucune facture." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary border-b border-border">
                  <th className="font-medium px-5 py-2">N°</th>
                  <th className="font-medium px-5 py-2">Date</th>
                  <th className="font-medium px-5 py-2">Statut</th>
                  <th className="font-medium px-5 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-secondary-50">
                    <td className="px-5 py-3">
                      <Link to={`/factures/${f.id}`} className="text-primary-600 font-medium hover:underline">{f.numero}</Link>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUT_VARIANT[f.statut_affiche]}>{STATUT_LABEL[f.statut_affiche]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text-primary">{fmt(f.montant_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
