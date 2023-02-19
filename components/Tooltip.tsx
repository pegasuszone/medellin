import { useRef } from 'react'

export default function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode
  text: string
}) {
  const tipRef = useRef<HTMLDivElement>(null)

  function handleMouseEnter() {
    tipRef.current!.classList.remove('hidden')
    tipRef.current!.classList.add('flex')
  }

  function handleMouseLeave() {
    tipRef.current!.classList.remove('flex')
    tipRef.current!.classList.add('hidden')
  }

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hidden md:block">
        <div
          className="absolute top-0 items-center justify-center hidden px-3 py-1.5 ml-5 mt-1.5 text-white whitespace-no-wrap transition-all duration-150 border rounded left-full bg-bg-light border-white/10"
          ref={tipRef}
        >
          <p className="text-xs font-medium text-center">{text}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
