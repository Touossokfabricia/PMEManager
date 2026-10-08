import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import api from '../../api/client'
import { useEntreprise } from '../../context/EntrepriseContext'
import { Card, Badge, EmptyState, ErrorState, StatCardSkeleton, TableSkeleton, Skeleton } from '../../components/ui'

function StatCard({ icon, label, value, tint, to, highlight }) {
  const content = (
    <Card noBorder className={`border h-full transition-all duration-200 ease-in-out ${highlight ? 'border-primary-600 bg-primary-600 shadow-sm hover:shadow-md hover:-translate-y-0.5' : 'border-border bg-surface hover:border-accent-500 hover:shadow-md hover:-translate-y-0.5'}`}>
      <div className="flex items-center justify-between gap-3 p-1">
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-bold uppercase tracking-widest ${highlight ? 'text-primary-100' : 'text-text-secondary'}`}>{label}</p>
          <p className={`mt-1 text-2xl font-extrabold tracking-tight truncate ${highlight ? 'text-white' : 'text-text-primary'}`}>{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${highlight ? 'bg-white/10 text-white' : tint}`}>
          <i className={`fa-solid ${icon} text-lg opacity-90`}></i>
        </div>
      </div>
    </Card>
  )
  return to ? <Link to={to} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-xl">{content}</Link> : content
}

const formatFCFA = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`
const STATUT_LABEL = { brouillon: 'Brouillon', en_attente: 'En attente', paye: 'Payée', en_retard: 'En retard', annulee: 'Annulée' }
const STATUT_VARIANT = { brouillon: 'neutral', en_attente: 'info', paye: 'success', en_retard: 'error', annulee: 'error' }

export default function Dashboard() {
  const { currentId } = useEntreprise()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = useCallback(() => {
    if (!currentId) return
    setStatus('loading')
    api.get(`/entreprises/${currentId}/dashboard/`)
      .then(({ data }) => { setData(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [currentId])

  useEffect(() => { load() }, [load])

  if (status === 'error') return <ErrorState description="Vérifiez votre connexion et réessayez." onRetry={load} />

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Centre de Pilotage</h2>
            <p className="mt-1 text-sm text-text-secondary max-w-xl">Suivez les performances de votre entreprise et gérez vos alertes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/factures/add" className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-semibold !text-white shadow-sm hover:bg-primary-700 transition-all duration-200 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-1">
              <i className="fa-solid fa-plus mr-1.5"></i> Nouvelle facture
            </Link>
            <Link to="/clients" className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-semibold !text-text-primary hover:bg-secondary-50 hover:border-border-strong transition-all duration-200">
              Voir clients
            </Link>
          </div>
        </div>
      </section>

      {status === 'loading' ? (
        <StatCardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="md:col-span-2 xl:col-span-2">
            <StatCard icon="fa-sack-dollar" label="Chiffre d'affaires" value={formatFCFA(data.chiffre_affaires)} highlight to="/audit-ventes" />
          </div>
          <StatCard icon="fa-triangle-exclamation" label="Produits en rupture" value={data.produits_en_rupture} tint="bg-warning-50 text-warning-700" to="/rupture-stock" />
          <StatCard icon="fa-file-invoice" label="Factures impayées" value={data.factures_impayees} tint="bg-error-50 text-error-700" to="/factures" />
          
          <StatCard icon="fa-address-book" label="Clients" value={data.total_clients} tint="bg-info-50 text-info-700" to="/clients" />
          <StatCard icon="fa-box" label="Produits" value={data.total_produits} tint="bg-primary-50 text-primary-700" to="/produits" />
        </div>
      )}

      <Card title="Évolution du chiffre d'affaires" subtitle="Factures validées des 6 derniers mois">
        {status === 'loading' ? (
          <Skeleton className="h-64 w-full" />
        ) : data.evolution_ca.length === 0 ? (
          <EmptyState icon="fa-chart-line" title="Pas encore de données" description="Valide au moins une facture pour voir apparaître la courbe du chiffre d'affaires." />
        ) : (
          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.evolution_ca}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatFCFA(v)} contentStyle={{ borderRadius: 8, borderColor: 'var(--color-border)', fontSize: 13 }} />
                <Line type="monotone" dataKey="total" stroke="var(--color-primary-600)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary-600)', strokeWidth: 0 }} activeDot={{ r: 6, fill: 'var(--color-accent-500)', stroke: 'var(--color-surface)', strokeWidth: 2 }} name="Chiffre d'affaires" animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Factures récentes" subtitle="Les 5 dernières factures créées">
        {status === 'loading' ? (
          <TableSkeleton rows={4} cols={4} />
        ) : data.factures_recentes.length === 0 ? (
          <EmptyState
            icon="fa-file-invoice"
            title="Aucune facture pour le moment"
            description="Créez votre première facture pour la voir apparaître ici."
            actionLabel="Créer une facture"
            onAction={() => (window.location.href = '/factures/add')}
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-text-muted uppercase tracking-widest bg-secondary-50 border-b border-border">
                  <th className="px-5 py-2.5">N° Facture</th>
                  <th className="px-5 py-2.5">Client</th>
                  <th className="px-5 py-2.5 hidden sm:table-cell">Statut</th>
                  <th className="px-5 py-2.5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data.factures_recentes.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-primary-50 hover:shadow-sm transition-all duration-200 cursor-pointer" onClick={() => window.location.href = `/factures/${f.id}`}>
                    <td className="px-5 py-2.5">
                      <span className="text-primary-600 font-semibold">{f.numero}</span>
                    </td>
                    <td className="px-5 py-2.5 text-text-primary text-sm font-medium">{f.client_nom}</td>
                    <td className="px-5 py-2.5 hidden sm:table-cell">
                      <Badge variant={STATUT_VARIANT[f.statut_affiche]}>{STATUT_LABEL[f.statut_affiche]}</Badge>
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-text-primary">{formatFCFA(f.montant_total)}</td>
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
