import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/client'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Card, Badge, ErrorState, EmptyState } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`

export default function RuptureStock() {
  const { currentId } = useEntreprise()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = () => {
    if (!currentId) return
    setStatus('loading')
    api.get(`/entreprises/${currentId}/rupture-stock/`)
      .then(({ data }) => { setData(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [currentId])

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card
      title="Rupture de stock"
      subtitle={status === 'loading' ? undefined : `${data.count} produit${data.count > 1 ? 's' : ''} sous le seuil de ${data.seuil} unités`}
    >
      <DataTable
        loading={status === 'loading'}
        data={data?.produits || []}
        columns={[
          { key: 'nom', label: 'Produit' },
          { key: 'reference', label: 'Référence' },
          {
            key: 'quantite_stock', label: 'Stock restant',
            render: (p) => <Badge variant={p.quantite_stock === 0 ? 'error' : 'warning'}>{p.quantite_stock} unité{p.quantite_stock > 1 ? 's' : ''}</Badge>,
          },
          { key: 'prix_vente', label: 'Prix de vente', render: (p) => fmt(p.prix_vente) },
        ]}
        actions={() => <Link to="/produits" className="text-primary-600 text-sm font-medium hover:underline">Réapprovisionner</Link>}
        empty={
          <EmptyState
            icon="fa-box-open"
            title="Aucun produit en rupture"
            description="Tous vos produits ont un niveau de stock suffisant."
          />
        }
      />
    </Card>
  )
}
