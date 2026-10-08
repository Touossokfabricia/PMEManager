import Modal from './Modal'
import Button from './Button'

/**
 * ConfirmDialog — boîte de confirmation pour les actions destructrices
 * (suppression d'un client, d'une facture...). Construite sur Modal.
 *
 * Usage :
 *   <ConfirmDialog open={open} title="Supprimer ce client ?"
 *     description="Cette action est irréversible."
 *     confirmLabel="Supprimer" variant="danger"
 *     onConfirm={handleDelete} onCancel={() => setOpen(false)} />
 */
export default function ConfirmDialog({
  open,
  title = 'Confirmer l\'action',
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      {description && <p className="text-sm text-text-secondary">{description}</p>}
    </Modal>
  )
}
