import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Checkbox, Alert, Logo } from '../../components/ui'
import loginBackground from '../../assets/images/login-background.jpeg'

const FEATURES = [
  { icon: 'fa-arrow-trend-up', label: 'Ventes' },
  { icon: 'fa-box', label: 'Stock' },
  { icon: 'fa-file-invoice', label: 'Facturation' },
  { icon: 'fa-calculator', label: 'Comptabilité' },
  { icon: 'fa-chart-column', label: 'Rapports' },
  { icon: 'fa-building', label: 'Multi-entreprises' },
]



const emptyLogin = { email: '', password: '' }
const emptyRegister = {
  nom_entreprise: '', secteur_activite: '', localisation: '',
  nom: '', prenom: '', email: '', numrcc: '', password: '', confirm_password: '',
}

/**
 * AuthPage — connexion + inscription réunies sur un seul écran, avec
 * transition fondu/glissement entre les deux (aucune navigation, aucun reload).
 * Reproduit le design de référence : photo plein écran + carte flottante.
 */
export default function AuthPage({ initialMode = 'login' }) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState(initialMode)     // 'login' | 'register'
  const [visible, setVisible] = useState(true)       // pilote la transition
  const [showPassword, setShowPassword] = useState(false)

  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [registerForm, setRegisterForm] = useState(emptyRegister)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next) => {
    setError(''); setSuccess('')
    setVisible(false)
    setTimeout(() => {
      setMode(next)
      setVisible(true)
    }, 180)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(loginForm.email, loginForm.password)
      navigate(user.role === 'admin' || user.is_superuser ? '/sysadmin' : '/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'Email ou mot de passe incorrect.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (registerForm.password !== registerForm.confirm_password) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (registerForm.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/register/', registerForm)
      setSuccess('Inscription réussie ! Connectez-vous avec vos identifiants.')
      setRegisterForm(emptyRegister)
      setTimeout(() => switchMode('login'), 1200)
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de l'inscription."))
    } finally {
      setSubmitting(false)
    }
  }

  const setField = (setter) => (field) => (e) => setter((f) => ({ ...f, [field]: e.target.value }))
  const setLoginField = setField(setLoginForm)
  const setRegisterField = setField(setRegisterForm)

  const transitionClass = `transition-all duration-200 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center flex flex-col lg:flex-row lg:items-start overflow-x-hidden"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      {/* Voile sombre léger uniquement sur mobile pour garantir la lisibilité */}
      <div className="absolute inset-0 bg-black/40 lg:hidden" />

      {/* ---------- Colonne gauche : identité de marque (desktop) ---------- */}
      <div className="relative z-10 hidden lg:flex flex-col justify-start h-screen w-full lg:w-[55%] pl-12 xl:pl-20 pt-16 xl:pt-20">
        <div>
          <Logo size="text-[4rem] xl:text-[4.5rem]" />
          <p className="mt-2 text-[1.4rem] xl:text-[1.5rem] font-semibold leading-snug tracking-tight text-primary-700">
            La gestion intelligente<br />
            de votre PME, tout simplement
          </p>

          <svg width="60" height="15" viewBox="0 0 60 15" className="mt-2" aria-hidden="true">
            <path d="M0 10 Q 15 2 30 8 T 60 4" stroke="#c9974d" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>

          <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-6 max-w-[400px]">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 xl:h-14 xl:w-14 rounded-full flex items-center justify-center bg-white shadow-md border border-gray-100">
                  <i className={`fa-solid ${f.icon} text-xl xl:text-2xl text-primary-700`}></i>
                </div>
                <span className="text-sm xl:text-[15px] font-bold text-center text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- En-tête compact (mobile / tablette uniquement) ---------- */}
      <div className="relative z-10 lg:hidden flex flex-col items-center text-center px-6 pt-10 pb-6">
        <Logo size="text-4xl" />
        <p className="mt-2 text-base text-white font-medium" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          La gestion intelligente de votre PME, tout simplement
        </p>
      </div>

      {/* ---------- Carte flottante : connexion / inscription ---------- */}
      <div className="relative z-10 flex-1 flex flex-col items-center lg:items-end justify-start px-4 sm:px-6 pt-6 lg:pt-16 lg:pr-12 xl:pr-24">

        <div className="w-full max-w-[460px] bg-white rounded-[24px] shadow-2xl px-8 sm:px-10 py-10 my-4 lg:my-0 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center mb-2 lg:hidden">
            <Logo size="text-3xl" />
          </div>
          <div className="hidden lg:flex justify-center mb-1">
            <Logo size="text-[2.5rem]" />
          </div>

          <p className="text-center text-gray-600 font-medium text-[1.1rem] mb-8">
            {mode === 'login' ? 'Connexion à votre espace' : 'Créez votre espace entreprise'}
          </p>

          <div className={transitionClass}>
            {error && <Alert type="error" className="mb-4">{error}</Alert>}
            {success && <Alert type="success" className="mb-4">{success}</Alert>}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  icon="fa-user"
                  placeholder="Adresse e-mail ou nom d'utilisateur"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={setLoginField('email')}
                  className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                />
                <Input
                  icon="fa-lock"
                  placeholder="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginForm.password}
                  onChange={setLoginField('password')}
                  className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                  rightElement={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  }
                />

                <div className="flex items-center justify-between text-sm mt-1 mb-3">
                  <Checkbox label="Se souvenir de moi" />
                  <a href="#" className="font-medium hover:underline text-primary-700">
                    Mot de passe oublié ?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition-colors disabled:opacity-60 text-[15px] bg-primary-700 hover:bg-primary-800 focus:ring-2 focus:ring-offset-2 focus:ring-primary-700"
                >
                  {submitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (
                    <>Se connecter <i className="fa-solid fa-arrow-right text-sm ml-1"></i></>
                  )}
                </button>

                <div className="flex items-center gap-4 my-5">
                  <div className="flex-1 h-[1px] bg-gray-200" />
                  <span className="text-sm text-gray-400 font-medium">Ou</span>
                  <div className="flex-1 h-[1px] bg-gray-200" />
                </div>

                <p className="text-center text-sm text-gray-500">
                  Vous n'avez pas de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold hover:underline ml-1 text-primary-700"
                  >
                    Créer un compte
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <Input
                  icon="fa-building"
                  placeholder="Nom de l'entreprise"
                  required
                  value={registerForm.nom_entreprise}
                  onChange={setRegisterField('nom_entreprise')}
                  className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Secteur d'activité"
                    value={registerForm.secteur_activite}
                    onChange={setRegisterField('secteur_activite')}
                    className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                  />
                  <Input
                    placeholder="Localisation"
                    value={registerForm.localisation}
                    onChange={setRegisterField('localisation')}
                    className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    icon="fa-user"
                    placeholder="Prénom"
                    required
                    value={registerForm.prenom}
                    onChange={setRegisterField('prenom')}
                    className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                  />
                  <Input
                    placeholder="Nom"
                    required
                    value={registerForm.nom}
                    onChange={setRegisterField('nom')}
                    className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                  />
                </div>
                <Input
                  icon="fa-envelope"
                  type="email"
                  placeholder="Adresse e-mail"
                  required
                  value={registerForm.email}
                  onChange={setRegisterField('email')}
                  className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    icon="fa-lock"
                    type="password"
                    placeholder="Mot de passe"
                    required
                    value={registerForm.password}
                    onChange={setRegisterField('password')}
                    className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                  />
                  <Input
                    icon="fa-lock"
                    type="password"
                    placeholder="Confirmer"
                    required
                    value={registerForm.confirm_password}
                    onChange={setRegisterField('confirm_password')}
                    className="bg-white border-secondary-200 focus:border-primary-700 focus:ring-primary-700 rounded-lg py-2.5 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition-colors disabled:opacity-60 mt-2 text-[15px] bg-primary-700 hover:bg-primary-800 focus:ring-2 focus:ring-offset-2 focus:ring-primary-700"
                >
                  {submitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (
                    <>Créer mon compte <i className="fa-solid fa-arrow-right text-sm ml-1"></i></>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-2">
                  Déjà inscrit ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold hover:underline ml-1 text-primary-700"
                  >
                    Se connecter
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Decorative text bottom right (under card) 
        <div className="hidden lg:block absolute bottom-8 right-12 text-right">
          <p className="italic text-white text-lg font-medium tracking-wide" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            Ensemble pour<br />la réussite de votre PME
          </p>
          <svg width="80" height="15" viewBox="0 0 80 15" className="ml-auto mt-1" aria-hidden="true">
            <path d="M0 10 Q 20 2 40 8 T 80 5" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>*/}
      </div>
    </div>
  )
}
