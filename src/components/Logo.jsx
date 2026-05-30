import { Link } from 'react-router-dom'

function Logo({ size = 'md', className = '' }) {
  const boxSize = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'

  return (
    <Link to="/home" className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      <span className={`logo-mark ${boxSize}`} aria-hidden="true">
        OCL
      </span>
      <span className="sys-text font-black text-xl tracking-tight" style={{ color: 'var(--accent)' }}>Lounge</span>
    </Link>
  )
}

export default Logo
