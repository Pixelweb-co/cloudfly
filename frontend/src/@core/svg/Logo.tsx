// React Imports
import type { SVGAttributes } from 'react'

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="3.3749em"
  height="4.5em"
  viewBox="0 0 35 27"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className="lucide lucide-bot h-8 w-8 text-primary"
  data-lov-name="Bot"
  {...props}
>
  <path d="M12 8V4H8"></path>
  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
  <path d="M2 14h2"></path>
  <path d="M20 14h2"></path>
  <path d="M15 13v2"></path>
  <path d="M9 13v2"></path>
</svg>


  )
}

export default Logo
