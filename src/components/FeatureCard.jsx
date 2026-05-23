function FeatureCard({ title, description, tag, accent = 'primary' }) {
  const accentClass =
    accent === 'secondary'
      ? 'bg-slate-accent text-white'
      : accent === 'muted'
        ? 'bg-surface-muted text-ink border-ink'
        : 'bg-brand-600 text-white'

  return (
    <article className="neo-card p-5 flex flex-col gap-4">
      <span className={`self-start text-xs font-black px-3 py-1 border-2 border-ink rounded-lg ${accentClass}`}>
        {tag}
      </span>
      <h3 className="sys-text font-black text-xl text-ink">{title}</h3>
      <p className="font-bold text-sm text-ink-muted leading-relaxed">{description}</p>
    </article>
  )
}

export default FeatureCard
