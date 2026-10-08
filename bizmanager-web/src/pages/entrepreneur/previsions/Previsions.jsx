import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../../api/client'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Card, Button, Select, ErrorState, EmptyState } from '../../../components/ui'
import DataTable from '../../../components/DataTable'

export default function Previsions() {
  const { currentId } = useEntreprise()
  const [items, setItems] = useState([])
  const [produits, setProduits] = useState([])
  const [status, setStatus] = useState('loading')
  const [selectedProduit, setSelectedProduit] = useState('')
  const [generating, setGenerating] = useState(false)
  const toast = useToast()

  const load = () => {
    if (!currentId) return
    setStatus('loading')
    api.get(`/entreprises/${currentId}/previsions/`)
      .then(({ data }) => { setItems(data.results ?? data); setStatus('success') })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    if (!currentId) return
    load()
    api.get(`/entreprises/${currentId}/produits/`).then(({ data }) => setProduits(data.results ?? data))
  }, [currentId])

  const handleGenerate = async () => {
    if (!selectedProduit) { toast.error('Sélectionnez un produit.'); return }
    setGenerating(true)
    try {
      await api.post(`/entreprises/${currentId}/previsions/generer/${selectedProduit}/`)
      toast.success('Prévision générée.')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card title="Prévisions de stock" subtitle="Estimation de la demande future, produit par produit">
      <div className="flex flex-col sm:flex-row gap-3 mb-5 bg-secondary-50 rounded-md p-3">
        <div className="flex-1">
          <Select
            placeholder="Choisir un produit"
            value={selectedProduit}
            onChange={(e) => setSelectedProduit(e.target.value)}
            options={produits.map((p) => ({ value: p.id, label: p.nom }))}
          />
        </div>
        <Button icon="fa-wand-magic-sparkles" onClick={handleGenerate} loading={generating}>
          Générer une prévision
        </Button>
      </div>

      <DataTable
        loading={status === 'loading'}
        data={items}
        columns={[
          { key: 'produit_nom', label: 'Produit' },
          { key: 'quantite_prevue', label: 'Quantité prévue', render: (p) => Number(p.quantite_prevue).toFixed(0) },
          { key: 'niveau_confiance', label: 'Confiance', render: (p) => `${Math.round(p.niveau_confiance * 100)}%` },
          { key: 'justification', label: 'Analyse de l\'IA', render: (p) => p.justification || '—' },
          { key: 'date_generation', label: 'Générée le', render: (p) => new Date(p.date_generation).toLocaleDateString('fr-FR') },
        ]}
        empty={
          <EmptyState
            icon="fa-chart-line"
            title="Aucune prévision"
            description="Sélectionnez un produit ci-dessus et générez sa première prévision de stock."
          />
        }
      />
    </Card>
  )
}
