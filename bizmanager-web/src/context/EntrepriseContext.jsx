import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const EntrepriseContext = createContext(null)

const STORAGE_KEY = 'current_entreprise_id'

export function EntrepriseProvider({ children }) {
  const [entreprises, setEntreprises] = useState([])
  const [currentId, setCurrentId] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    return api.get('/entreprises/')
      .then(({ data }) => {
        const list = data.results ?? data
        setEntreprises(list)
        // Si aucune entreprise n'est sélectionnée (ou si elle n'existe plus), on prend la première.
        setCurrentId((prev) => {
          const stillValid = list.some((e) => String(e.id) === String(prev))
          const nextId = stillValid ? prev : (list[0] ? String(list[0].id) : null)
          if (nextId) localStorage.setItem(STORAGE_KEY, nextId)
          return nextId
        })
        return list
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const switchEntreprise = (id) => {
    setCurrentId(String(id))
    localStorage.setItem(STORAGE_KEY, String(id))
  }

  const createEntreprise = async (payload) => {
    const { data } = await api.post('/entreprises/', payload)
    await load()
    switchEntreprise(data.id)
    return data
  }

  const current = entreprises.find((e) => String(e.id) === String(currentId)) || null

  return (
    <EntrepriseContext.Provider value={{
      entreprises, current, currentId, loading,
      switchEntreprise, createEntreprise, reload: load,
    }}>
      {children}
    </EntrepriseContext.Provider>
  )
}

export const useEntreprise = () => useContext(EntrepriseContext)
