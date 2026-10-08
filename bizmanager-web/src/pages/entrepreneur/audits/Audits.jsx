import { useEffect, useState } from 'react'
import api from '../../../api/client'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Card, ErrorState } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`

export default function Audits() {
  const { currentId } = useEntreprise()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')

  const load = () => {
    if (!currentId) return
    setStatus('loading')
    api.get(`/entreprises/${currentId}/audits/`)
      .then(({ data }) => { setItems(data.results ?? data); setStatus('success') })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [currentId])

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card title="Journal des ventes" subtitle="Historique automatique des actions sur vos factures">
      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'action', label: 'Action' },
          { key: 'facture_numero', label: 'Facture' },
          { key: 'date_action', label: 'Date', render: (a) => new Date(a.date_action).toLocaleString('fr-FR') },
          { key: 'montant_concerne', label: 'Montant', render: (a) => fmt(a.montant_concerne) },
        ]}
        empty={
          <div className="text-center py-14 text-text-secondary text-sm">
            Aucune activité enregistrée pour le moment. Elle apparaîtra automatiquement dès votre première facture.
          </div>
        }
      />
    </Card>
  )
}
