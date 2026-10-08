import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Card, ErrorState, StatCardSkeleton } from '../../components/ui'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = () => {
    setStatus('loading')
    api.get('/admin/dashboard/')
      .then(({ data }) => { setData(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [])

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <div className="flex flex-col gap-6">
      {status === 'loading' ? (
        <StatCardSkeleton count={2} />
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card noBorder className="border border-border">
            <p className="text-xs text-text-secondary mb-1">Entreprises inscrites</p>
            <p className="text-2xl font-semibold text-text-primary">{data.total_entreprises}</p>
          </Card>
          <Card noBorder className="border border-border">
            <p className="text-xs text-text-secondary mb-1">Utilisateurs</p>
            <p className="text-2xl font-semibold text-text-primary">{data.total_utilisateurs}</p>
          </Card>
        </div>
      )}

      <Card title="Dernières entreprises inscrites">
        {status === 'loading' ? null : data.entreprises.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">Aucune entreprise inscrite pour le moment.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.entreprises.map((e) => (
              <li key={e.id} className="py-3 flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">{e.nom}</span>
                <span className="text-text-secondary">{e.secteur_activite || '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
