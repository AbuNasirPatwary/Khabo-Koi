// =============================================================================
// Input — Styled form fields with validation support
// =============================================================================

export function Input({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    required,
    disabled,
    className = '',
    ...rest
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={name} className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                    outline-none transition-all duration-200
                    ${error
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
                        : 'border-gray-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                    }
                    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
                {...rest}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}


export function Select({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    required,
    disabled,
    className = '',
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={name} className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-800
                    outline-none transition-all duration-200 cursor-pointer
                    ${error
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
                        : 'border-gray-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                    }
                    disabled:bg-gray-50 disabled:cursor-not-allowed`}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}


export function Textarea({
    label,
    name,
    value,
    onChange,
    placeholder,
    rows = 4,
    error,
    required,
    className = '',
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={name} className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                required={required}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
                    outline-none transition-all duration-200 resize-none
                    ${error
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
                        : 'border-gray-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                    }`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}
