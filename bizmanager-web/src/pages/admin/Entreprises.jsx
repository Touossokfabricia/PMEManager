import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Card, ErrorState } from '../../components/ui'
import DataTable from '../../components/DataTable'

export default function Entreprises() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')

  const load = () => {
    setStatus('loading')
    api.get('/admin/entreprises/')
      .then(({ data }) => { setItems(data.results ?? data); setStatus('success') })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [])

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card title="Entreprises" subtitle={`${items.length} entreprise${items.length > 1 ? 's' : ''} inscrite${items.length > 1 ? 's' : ''}`}>
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'nom', label: 'Nom' },
          { key: 'secteur_activite', label: 'Secteur' },
          { key: 'localisation', label: 'Localisation' },
          { key: 'nb_employes', label: 'Employés', render: (e) => e.nb_employes ?? 0 },
          { key: 'date_creation', label: 'Inscrite le', render: (e) => new Date(e.date_creation).toLocaleDateString('fr-FR') },
        ]}
        empty={<div className="text-center py-14 text-text-secondary text-sm">Aucune entreprise inscrite pour le moment.</div>}
      />
    </Card>
  )
}
