import { useState, useRef, useEffect } from 'react'

export default function Tooltip({ content, children }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!open) {
      clearTimeout(timerRef.current)
      return
    }
    timerRef.current = setTimeout(() => setOpen(false), 4000)
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleOutside)
    return () => {
      document.removeEventListener('click', handleOutside)
      clearTimeout(timerRef.current)
    }
  }, [open])

  return (
    <span ref={containerRef} className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className="cursor-pointer flex items-center"
      >
        {children}
      </span>
      {open && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          style={{ width: 'max-content', maxWidth: '220px' }}
        >
          <span
            className="block rounded-lg text-sm text-white p-3 leading-relaxed whitespace-pre-line shadow-xl"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
          >
            {content}
          </span>
        </span>
      )}
    </span>
  )
}
