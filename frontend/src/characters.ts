import type { CSSProperties } from 'react'
import type { Character } from './api/client'
import boyImg from './assets/boy.webp'
import girlImg from './assets/girl.webp'

// Where the character sits inside its picture, as fractions of the file
// (measured from the non-transparent pixels), so every screen can size the
// two sprites the same way whatever the empty space around them.
export interface CharacterFit {
  top: number
  bottom: number
  middle: number
}

export const CHARACTER_ART: Record<
  Character,
  { img: string; alt: string; fit: CharacterFit }
> = {
  boy: {
    img: boyImg,
    alt: 'Boy',
    fit: { top: 0.0615, bottom: 0.9007, middle: 0.4973 },
  },
  girl: {
    img: girlImg,
    alt: 'Girl',
    fit: { top: 0.117, bottom: 0.8652, middle: 0.475 },
  },
}

// The --fit-* CSS variables the screens' stylesheets place the sprite with.
export function fitVariables(fit: CharacterFit): CSSProperties {
  return {
    '--fit-top': fit.top,
    '--fit-span': fit.bottom - fit.top,
    '--fit-middle': fit.middle,
  } as CSSProperties
}
