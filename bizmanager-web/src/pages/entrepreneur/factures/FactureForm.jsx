import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../../api/client'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Card, Button, Select, Input, Alert, PageLoader } from '../../../components/ui'

const emptyLigne = { type: 'produit', item: '', quantite: 1, prix_unitaire: 0 }
const DELAI_OPTIONS = [
  { value: 'immediat', label: 'Immédiat' },
  { value: '7j', label: '7 jours' },
  { value: '15j', label: '15 jours' },
  { value: '30j', label: '30 jours' },
]
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')

export default function FactureForm() {
  const navigate = useNavigate()
  const { id } = useParams() // présent en mode édition
  const isEdit = Boolean(id)
  const toast = useToast()
  const { currentId } = useEntreprise()

  const [clients, setClients] = useState([])
  const [produits, setProduits] = useState([])
  const [services, setServices] = useState([])
  const [clientId, setClientId] = useState('')
  const [delai, setDelai] = useState('30j')
  const [lignes, setLignes] = useState([{ ...emptyLigne }])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingFacture, setLoadingFacture] = useState(isEdit)

  useEffect(() => {
    if (!currentId) return
    api.get(`/entreprises/${currentId}/clients/`).then(({ data }) => setClients(data.results ?? data))
    api.get(`/entreprises/${currentId}/produits/`).then(({ data }) => setProduits(data.results ?? data))
    api.get(`/entreprises/${currentId}/services/`).then(({ data }) => setServices(data.results ?? data))
  }, [currentId])

  useEffect(() => {
    if (!isEdit || !currentId) return
    api.get(`/entreprises/${currentId}/factures/${id}/`).then(({ data }) => {
      if (!data.peut_etre_modifiee) {
        toast.error("Cette facture n'est plus modifiable (elle a déjà été validée).")
        navigate(`/factures/${id}`)
        return
      }
      setClientId(data.client)
      setDelai(data.delai)
      setLignes(data.lignes.map((l) => ({
        type: l.produit ? 'produit' : 'service',
        item: l.produit || l.service,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
      })))
      setLoadingFacture(false)
    }).catch(() => {
      toast.error('Facture introuvable.')
      navigate('/factures')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id, currentId])

  const catalogue = (type) => (type === 'produit' ? produits : services)

  const updateLigne = (i, field, value) => {
    const next = [...lignes]
    next[i] = { ...next[i], [field]: value }
    if (field === 'type') {
      next[i].item = ''
      next[i].prix_unitaire = 0
    }
    if (field === 'item') {
      const source = catalogue(next[i].type)
      const found = source.find((x) => String(x.id) === String(value))
      if (found) next[i].prix_unitaire = next[i].type === 'produit' ? found.prix_vente : found.prix
    }
    setLignes(next)
  }
  const addLigne = () => setLignes([...lignes, { ...emptyLigne }])
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i))

  const total = lignes.reduce((sum, l) => sum + Number(l.quantite || 0) * Number(l.prix_unitaire || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!clientId) { setError('Sélectionnez un client.'); return }
    if (lignes.some((l) => !l.item)) { setError('Sélectionnez un article pour chaque ligne.'); return }

    const payload = {
      client: clientId,
      delai,
      lignes: lignes.map((l) => ({
        produit: l.type === 'produit' ? l.item : null,
        service: l.type === 'service' ? l.item : null,
        quantite: Number(l.quantite),
        prix_unitaire: Number(l.prix_unitaire),
      })),
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await api.put(`/entreprises/${currentId}/factures/${id}/`, payload)
        toast.success('Brouillon mis à jour.')
        navigate(`/factures/${id}`)
      } else {
        const { data } = await api.post(`/entreprises/${currentId}/factures/`, payload)
        toast.success('Brouillon créé. Valide-le pour déduire le stock et le verrouiller.')
        navigate(`/factures/${data.id}`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingFacture) return <PageLoader />

  return (
    <div className="max-w-3xl">
      <Card title={isEdit ? 'Modifier le brouillon' : 'Nouvelle facture'} subtitle="Enregistrée en brouillon — validez-la ensuite pour la verrouiller et déduire le stock.">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Client" required placeholder="Sélectionner un client"
              value={clientId} onChange={(e) => setClientId(e.target.value)}
              options={clients.map((c) => ({ value: c.id, label: c.nom }))}
            />
            <Select
              label="Délai de paiement" value={delai} onChange={(e) => setDelai(e.target.value)}
              options={DELAI_OPTIONS}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-text-primary">Articles (produits ou services)</h3>
              <Button type="button" variant="outline" size="sm" icon="fa-plus" onClick={addLigne}>
                Ajouter une ligne
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {lignes.map((l, i) => {
                const sousTotal = Number(l.quantite || 0) * Number(l.prix_unitaire || 0)
                return (
                  <div key={i} className="bg-secondary-50 rounded-md p-3">
                    <div className="grid grid-cols-12 gap-2.5 items-end">
                      <div className="col-span-4 sm:col-span-2">
                        <Select
                          label={i === 0 ? 'Type' : undefined}
                          value={l.type} onChange={(e) => updateLigne(i, 'type', e.target.value)}
                          options={[{ value: 'produit', label: 'Produit' }, { value: 'service', label: 'Service' }]}
                        />
                      </div>
                      <div className="col-span-8 sm:col-span-4">
                        <Select
                          label={i === 0 ? 'Article' : undefined} placeholder="Choisir"
                          value={l.item} onChange={(e) => updateLigne(i, 'item', e.target.value)}
                          options={catalogue(l.type).map((x) => ({
                            value: x.id,
                            label: `${x.nom} — ${fmt(l.type === 'produit' ? x.prix_vente : x.prix)} FCFA`,
                          }))}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Input
                          label={i === 0 ? 'Qté' : undefined} type="number" min="1" value={l.quantite}
                          onChange={(e) => updateLigne(i, 'quantite', e.target.value)}
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-2">
                        <Input
                          label={i === 0 ? 'Prix unitaire' : undefined} type="number" min="0" value={l.prix_unitaire}
                          onChange={(e) => updateLigne(i, 'prix_unitaire', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-right text-sm font-semibold text-text-primary pb-2.5 truncate">
                        {fmt(sousTotal)}
                      </div>
                      <div className="col-span-1 flex justify-end pb-1">
                        <Button
                          type="button" variant="ghost" size="sm" icon="fa-trash" className="text-error-600"
                          onClick={() => removeLigne(i)} disabled={lignes.length === 1} aria-label="Retirer"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <div className="w-full sm:w-64 flex justify-between text-base font-semibold text-text-primary">
              <span>Total</span>
              <span>{fmt(total)} FCFA</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/factures/${id}` : '/factures')}>Annuler</Button>
            <Button type="submit" loading={submitting}>{isEdit ? 'Enregistrer les modifications' : 'Créer le brouillon'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
