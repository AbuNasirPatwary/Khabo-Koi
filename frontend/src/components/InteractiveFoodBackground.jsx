import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'


const FOOD_ICONS = [
  {
    name: 'burger',
    paths: [
      <path key="top" d="M5 11c.8-4 3.2-6 7-6s6.2 2 7 6H5Z" />,
      <path key="middle" d="M4 14h16M6 18h12" />,
      <path key="bottom" d="M5 18c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3" />,
    ],
  },
  {
    name: 'pizza',
    paths: [
      <path key="slice" d="m12 3 8 17H4L12 3Z" />,
      <path key="crust" d="M7 14h10" />,
      <circle key="one" cx="11" cy="10" r="1" />,
      <circle key="two" cx="14.5" cy="16.5" r="1" />,
    ],
  },
  {
    name: 'coffee',
    paths: [
      <path key="cup" d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9Z" />,
      <path key="handle" d="M17 11h1a3 3 0 0 1 0 6h-2" />,
      <path key="steam" d="M9 6c-1-1 1-2 0-3m4 3c-1-1 1-2 0-3" />,
    ],
  },
  {
    name: 'noodles',
    paths: [
      <path key="bowl" d="M4 12h16c0 5-3 8-8 8s-8-3-8-8Z" />,
      <path key="rim" d="M3 12h18" />,
      <path key="steam" d="M8 9c-2-2 2-3 0-5m4 5c-2-2 2-3 0-5m4 5c-2-2 2-3 0-5" />,
    ],
  },
  {
    name: 'cake',
    paths: [
      <path key="cake" d="M5 11h14v9H5zM5 15h14" />,
      <path key="icing" d="M5 11c2 2 3-1 5 1s3-1 5 0 2 0 4-1" />,
      <path key="candle" d="M12 8V4m0 0c-2 1-1-2 0-3 1 1 2 4 0 3Z" />,
    ],
  },
  {
    name: 'ice cream',
    paths: [
      <circle key="scoop" cx="12" cy="8" r="5" />,
      <path key="cone" d="M8 12h8l-4 10-4-10Zm1.5 4h5M10.5 19h3" />,
    ],
  },
  {
    name: 'cutlery',
    paths: [
      <path key="fork" d="M7 3v7m-2-7v5c0 2 1 3 2 3s2-1 2-3V3m-2 8v10" />,
      <path key="knife" d="M16 3c-2 3-2 7 0 9h2V3h-2Zm1 9v9" />,
    ],
  },
  {
    name: 'cloche',
    paths: [
      <path key="dish" d="M4 17h16M6 17a6 6 0 0 1 12 0" />,
      <path key="handle" d="M10 9a2 2 0 0 1 4 0" />,
      <path key="base" d="M3 20h18" />,
    ],
  },
]


const DECORATIONS = [
  { icon: 0, x: 4, y: 12, size: 48, duration: 11, delay: -4 },
  { icon: 1, x: 18, y: 72, size: 62, duration: 14, delay: -13 },
  { icon: 2, x: 33, y: 20, size: 42, duration: 12, delay: -9 },
  { icon: 3, x: 48, y: 82, size: 58, duration: 15, delay: -18 },
  { icon: 4, x: 63, y: 28, size: 52, duration: 13, delay: -7 },
  { icon: 5, x: 78, y: 68, size: 46, duration: 12, delay: -15 },
  { icon: 6, x: 91, y: 15, size: 58, duration: 16, delay: -11 },
  { icon: 7, x: 9, y: 45, size: 54, duration: 14, delay: -20 },
  { icon: 1, x: 27, y: 48, size: 44, duration: 13, delay: -3 },
  { icon: 0, x: 56, y: 55, size: 64, duration: 17, delay: -16 },
  { icon: 3, x: 72, y: 8, size: 44, duration: 12, delay: -12 },
  { icon: 2, x: 88, y: 88, size: 52, duration: 14, delay: -5 },
]


function FoodIcon({ definition }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={definition.name}
    >
      {definition.paths}
    </svg>
  )
}


function InteractiveFoodBackground() {
  const location = useLocation()
  const iconRefs = useRef([])
  const animationFrame = useRef(null)

  const isManagementPortal = [
    '/platform-admin',
    '/manager',
    '/branch-manager',
  ].some((prefix) => location.pathname.startsWith(prefix))

  useEffect(() => {
    document.documentElement.classList.toggle(
      'customer-food-background-active',
      !isManagementPortal,
    )

    if (isManagementPortal) {
      return () => {
        document.documentElement.classList.remove(
          'customer-food-background-active',
        )
      }
    }

    function clearHighlight() {
      iconRefs.current.forEach((element) => {
        element?.classList.remove('is-cursor-near')
      })
    }

    function findClosestIcon(pointerX, pointerY) {
      let closestElement = null
      let closestDistance = Number.POSITIVE_INFINITY

      iconRefs.current.forEach((element) => {
        if (!element) return
        const bounds = element.getBoundingClientRect()
        const distance = Math.hypot(
          pointerX - (bounds.left + bounds.width / 2),
          pointerY - (bounds.top + bounds.height / 2),
        )

        if (distance < closestDistance) {
          closestDistance = distance
          closestElement = element
        }
      })

      clearHighlight()

      // A limited radius prevents a distant icon from glowing constantly.
      if (closestElement && closestDistance < 220) {
        closestElement.classList.add('is-cursor-near')
      }
    }

    function handlePointerMove(event) {
      if (animationFrame.current) return
      animationFrame.current = window.requestAnimationFrame(() => {
        findClosestIcon(event.clientX, event.clientY)
        animationFrame.current = null
      })
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', clearHighlight)

    return () => {
      document.documentElement.classList.remove(
        'customer-food-background-active',
      )
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', clearHighlight)
      if (animationFrame.current) {
        window.cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [isManagementPortal])

  if (isManagementPortal) return null

  return (
    <div className="interactive-food-background" aria-hidden="true">
      <div className="food-background-glow food-background-glow-orange" />
      <div className="food-background-glow food-background-glow-green" />

      {DECORATIONS.map((decoration, index) => (
        <div
          key={`${decoration.icon}-${decoration.x}-${decoration.y}`}
          className={`food-float-path ${index % 2 ? 'food-float-reverse' : ''}`}
          style={{
            left: `${decoration.x}%`,
            top: `${decoration.y}%`,
            width: `${decoration.size}px`,
            height: `${decoration.size}px`,
            '--food-duration': `${decoration.duration}s`,
            '--food-delay': `${decoration.delay}s`,
          }}
        >
          <span
            ref={(element) => { iconRefs.current[index] = element }}
            className="food-outline-glyph"
          >
            <FoodIcon definition={FOOD_ICONS[decoration.icon]} />
          </span>
        </div>
      ))}
    </div>
  )
}


export default InteractiveFoodBackground
