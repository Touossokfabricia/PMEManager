import { useEffect, useState } from 'react'
import api from '../../../api/client'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Card, Badge, ErrorState, EmptyState } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`

export default function AuditVentes() {
  const { currentId } = useEntreprise()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = () => {
    if (!currentId) return
    setStatus('loading')
    api.get(`/entreprises/${currentId}/audit-ventes/`)
      .then(({ data }) => { setData(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [currentId])

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <div className="flex flex-col gap-4">
      {status !== 'loading' && (
        <div className="grid grid-cols-3 gap-4">
          <Card noBorder className="border border-border">
            <p className="text-xs text-text-secondary mb-1">Factures validées</p>
            <p className="text-xl font-semibold text-text-primary">{data.totaux.nombre_factures_validees}</p>
          </Card>
          <Card noBorder className="border border-border">
            <p className="text-xs text-text-secondary mb-1">Articles vendus</p>
            <p className="text-xl font-semibold text-text-primary">{data.totaux.quantite_totale}</p>
          </Card>
          <Card noBorder className="border border-border">
            <p className="text-xs text-text-secondary mb-1">Chiffre d'affaires</p>
            <p className="text-xl font-semibold text-text-primary">{fmt(data.totaux.montant_total)}</p>
          </Card>
        </div>
      )}

      <Card
        title="Audit des ventes par produit / service"
        subtitle="Uniquement les factures validées — les brouillons et annulations n'entrent pas dans ces statistiques"
      >
        <DataTable
          loading={status === 'loading'}
          data={data?.items || []}
          keyField="id"
          columns={[
            { key: 'nom', label: 'Article' },
            { key: 'type', label: 'Type', render: (i) => <Badge variant={i.type === 'produit' ? 'primary' : 'info'}>{i.type === 'produit' ? 'Produit' : 'Service'}</Badge> },
            { key: 'quantite_vendue', label: 'Quantité vendue' },
            { key: 'nombre_ventes', label: 'Nb de ventes' },
            { key: 'montant_total', label: 'Montant total', render: (i) => fmt(i.montant_total) },
          ]}
          empty={
            <EmptyState
              icon="fa-chart-column"
              title="Aucune vente validée"
              description="Valide au moins une facture pour voir apparaître son audit ici."
            />
          }
        />
      </Card>
    </div>
  )
}
