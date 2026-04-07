export function Select({
  label,
  error,
  className = '',
  id,
  children,
  ...props
}) {
  const selectId = id || props.name

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
