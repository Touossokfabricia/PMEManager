import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

/**
 * useCrud — factorise le chargement + create/update/delete pour une ressource
 * REST simple (clients, produits, employés...). Évite de répéter cette
 * logique dans chaque page.
 */
export function useCrud(endpoint) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // loading | success | error

  const load = useCallback(() => {
    setStatus('loading')
    api.get(`${endpoint}/`)
      .then(({ data }) => { setItems(data.results ?? data); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [endpoint])

  useEffect(() => { load() }, [load])

  const create = async (payload) => {
    const { data } = await api.post(`${endpoint}/`, payload)
    setItems((prev) => [data, ...prev])
    return data
  }

  const update = async (id, payload) => {
    const { data } = await api.put(`${endpoint}/${id}/`, payload)
    setItems((prev) => prev.map((it) => (it.id === id ? data : it)))
    return data
  }

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}/`)
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  return { items, status, load, create, update, remove }
}
