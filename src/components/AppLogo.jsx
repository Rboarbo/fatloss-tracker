export default function AppLogo({ size = 36, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="#0f172a" />
      <defs>
        <linearGradient id="logoOuter" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#fcd34d" />
          <stop offset="45%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="logoInner" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
      </defs>
      <path
        d="M16,26.5
           C11,24 7.5,19.5 9.5,14
           C10.5,11 12.5,9 12.5,9
           C12.5,12.5 14.5,13.5 15.5,12
           C14.5,8.5 17.5,5 19.5,3
           C20,7.5 17.5,11.5 20.5,14.5
           C23,17 23.5,22 20,25
           C18.5,26 17,27 16,26.5Z"
        fill="url(#logoOuter)"
      />
      <path
        d="M16,24
           C14,22 13,19.5 14.5,17
           C15,15.5 15.5,15 15.5,15
           C15.5,17 17,17.5 17.5,16.5
           C17,14.5 18.5,13 19,12
           C19.5,14.5 18,16.5 19,18.5
           C20,20.5 19.5,22.5 18,24
           C17.5,24.5 16.5,24.5 16,24Z"
        fill="url(#logoInner)"
        opacity="0.88"
      />
    </svg>
  )
}
