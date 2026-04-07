export function Alert({ className = '', tone = 'info', title, children }) {
  const tones = {
    info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
  }

  return (
    <div className={`rounded-md border p-3 text-sm ${tones[tone] || tones.info} ${className}`}>
      {title ? <div className="mb-1 font-medium">{title}</div> : null}
      <div>{children}</div>
    </div>
  )
}
