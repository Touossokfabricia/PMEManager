/**
 * Tabs — navigation par onglets.
 * Usage : <Tabs tabs={[{key:'a', label:'Infos'}]} active={active} onChange={setActive} />
 */
export default function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
            ${active === tab.key
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          {tab.icon && <i className={`fa-solid ${tab.icon} mr-2`}></i>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
