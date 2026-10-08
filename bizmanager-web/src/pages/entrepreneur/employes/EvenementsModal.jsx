import { useState } from 'react'
import api, { getErrorMessage } from '../../../api/client'
import { useToast } from '../../../context/ToastContext'
import { useEntreprise } from '../../../context/EntrepriseContext'
import { Modal, Button, Select, Input, Badge, Alert, EmptyState } from '../../../components/ui'

const TYPE_OPTIONS = [
  { value: 'promotion', label: 'Promotion' },
  { value: 'sanction', label: 'Sanction' },
]
const SOUS_TYPE_SANCTION_OPTIONS = [
  { value: 'avertissement', label: 'Avertissement' },
  { value: 'mise_a_pied', label: 'Mise à pied' },
]
const IMPACT_SALAIRE_OPTIONS = [
  { value: 'aucun', label: 'Aucun changement de salaire' },
  { value: 'augmentation', label: 'Augmentation de salaire' },
  { value: 'reduction', label: 'Réduction de salaire' },
]
const IMPACT_LABEL = { augmentation: 'Salaire augmenté', reduction: 'Salaire réduit' }
const SOUS_TYPE_LABEL = { avertissement: 'Avertissement', mise_a_pied: 'Mise à pied' }
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')

const emptyForm = {
  type_evenement: 'promotion', sous_type_sanction: '', nouveau_poste: '',
  impact_salaire: 'aucun', montant_impact: '', description: '', date_debut: '', date_fin: '',
}

/**
 * EvenementsModal — historique précis des promotions/sanctions d'un employé :
 * impact sur le salaire (augmentation/réduction, appliqué automatiquement) et/ou
 * changement de poste (promotion), sous-type pour les sanctions (avertissement / mise à pied).
 */
export default function EvenementsModal({ employe, onClose, onChanged }) {
  const { currentId } = useEntreprise()
  const toast = useToast()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!employe) return null

  const isSanction = form.type_evenement === 'sanction'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.date_debut) { setError('La date de début est requise.'); return }
    if (isSanction && !form.sous_type_sanction) { setError('Précise le type de sanction.'); return }
    if (form.impact_salaire !== 'aucun' && !form.montant_impact) {
      setError("Indique le montant de l'ajustement de salaire.")
      return
    }

    const payload = {
      type_evenement: form.type_evenement,
      sous_type_sanction: isSanction ? form.sous_type_sanction : null,
      nouveau_poste: form.nouveau_poste,
      impact_salaire: form.impact_salaire,
      montant_impact: form.impact_salaire !== 'aucun' ? Number(form.montant_impact) : 0,
      description: form.description,
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
    }

    setSubmitting(true)
    try {
      await api.post(`/entreprises/${currentId}/evenements-employe/`, { ...payload, employe: employe.id })
      toast.success(form.type_evenement === 'promotion' ? 'Promotion attribuée.' : 'Sanction enregistrée.')
      setForm(emptyForm)
      onChanged()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={Boolean(employe)} onClose={onClose} title={`${employe.prenom} ${employe.nom} — Promotions & sanctions`} size="lg">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold text-text-primary mb-2">Historique</p>
          {(!employe.evenements || employe.evenements.length === 0) ? (
            <EmptyState icon="fa-star" title="Aucun événement" description="Aucune promotion ni sanction enregistrée pour le moment." />
          ) : (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {employe.evenements.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 bg-secondary-50 rounded-md p-3">
                  <Badge variant={ev.type_evenement === 'promotion' ? 'success' : 'error'}>
                    {ev.type_evenement === 'sanction' && ev.sous_type_sanction
                      ? SOUS_TYPE_LABEL[ev.sous_type_sanction]
                      : (ev.type_evenement === 'promotion' ? 'Promotion' : 'Sanction')}
                  </Badge>
                  <div className="flex-1 text-sm">
                    <p className="text-text-primary">{ev.description || '—'}</p>
                    {ev.nouveau_poste && (
                      <p className="text-xs text-primary-700 mt-1">
                        <i className="fa-solid fa-arrow-right-long mr-1"></i>Nouveau poste : {ev.nouveau_poste}
                      </p>
                    )}
                    {ev.impact_salaire !== 'aucun' && ev.salaire_avant != null && (
                      <p className="text-xs text-text-secondary mt-1">
                        <i className="fa-solid fa-sack-dollar mr-1"></i>
                        {IMPACT_LABEL[ev.impact_salaire]} : {fmt(ev.salaire_avant)} → <strong>{fmt(ev.salaire_apres)}</strong> FCFA
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      Du {new Date(ev.date_debut).toLocaleDateString('fr-FR')}
                      {ev.date_fin ? ` au ${new Date(ev.date_fin).toLocaleDateString('fr-FR')}` : ' (durée indéterminée)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Ajouter un événement</p>
          {error && <Alert type="error" className="mb-3">{error}</Alert>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Select
              label="Type" value={form.type_evenement}
              onChange={(e) => setForm({ ...form, type_evenement: e.target.value, sous_type_sanction: '' })}
              options={TYPE_OPTIONS}
            />

            {isSanction && (
              <Select
                label="Nature de la sanction" required value={form.sous_type_sanction}
                onChange={(e) => setForm({ ...form, sous_type_sanction: e.target.value })}
                placeholder="Choisir"
                options={SOUS_TYPE_SANCTION_OPTIONS}
              />
            )}

            {!isSanction && (
              <Input
                label="Nouveau poste (si changement)" value={form.nouveau_poste}
                onChange={(e) => setForm({ ...form, nouveau_poste: e.target.value })}
                placeholder={`Poste actuel : ${employe.poste || '—'}`}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Impact sur le salaire" value={form.impact_salaire}
                onChange={(e) => setForm({ ...form, impact_salaire: e.target.value })}
                options={IMPACT_SALAIRE_OPTIONS}
              />
              {form.impact_salaire !== 'aucun' && (
                <Input
                  label="Montant (FCFA)" type="number" min="0" required
                  value={form.montant_impact}
                  onChange={(e) => setForm({ ...form, montant_impact: e.target.value })}
                />
              )}
            </div>
            {form.impact_salaire !== 'aucun' && (
              <p className="text-xs text-text-secondary -mt-1.5">
                Salaire actuel : {fmt(employe.salaire)} FCFA → nouveau salaire estimé :{' '}
                <strong>
                  {fmt(form.impact_salaire === 'augmentation'
                    ? Number(employe.salaire) + Number(form.montant_impact || 0)
                    : Math.max(0, Number(employe.salaire) - Number(form.montant_impact || 0)))}
                </strong> FCFA (appliqué automatiquement à l'enregistrement)
              </p>
            )}

            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Motif, détails..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date de début" type="date" required value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} />
              <Input label="Date de fin (optionnelle)" type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={submitting}>Ajouter</Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}
