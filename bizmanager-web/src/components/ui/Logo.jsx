export default function Logo({ size = 'text-3xl', className = '' }) {
  return (
    <h1 className={`${size} font-black tracking-[-0.06em] leading-none flex items-center gap-1 ${className}`}>
      <span className="text-[#1B4332]">PME</span>
      <span className="text-[#C9974D]">Manager</span>
    </h1>
  )
}
