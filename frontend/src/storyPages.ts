// The reusable story beats played around the prologue's missions, grouped so
// screens can call on them without mixing data into component files.

import openDoorImg from './assets/prologue/OpenDoor.png'
import outsideDoorImg from './assets/prologue/OutsideDoor.png'
import jeepneyTerminalStartImg from './assets/prologue/jeepneyterminal_start.jpg'

export type StoryPage = {
  bg: string
  lines: string[]
  // Where the background art is anchored (object-position). Defaults to the
  // bedroom look: centered, hugging the bottom. Per-page override so scenes
  // with a different focal point don't need to touch the shared styles.
  pos?: string
  // Where the player sprite stands: center (default), left, or right.
  align?: 'center' | 'left' | 'right'
}

// The story beat right after mission 1's answer is accepted: the door swings
// open (player steps to the left) and the player ends up outside (stepping
// to the right) before the lesson recap plays.
export const OPEN_DOOR_PAGE: StoryPage = {
  bg: openDoorImg,
  lines: ['The door is open!'],
  align: 'left',
}

export const OUTSIDE_PAGES: StoryPage[] = [
  {
    bg: outsideDoorImg,
    lines: ["You're finally outside now!"],
    align: 'right',
  },
  {
    bg: outsideDoorImg,
    lines: ['Now, make your way to the jeep terminal.'],
    align: 'right',
  },
]

// The opening of mission 2: the player reaches the jeepney terminal and must
// run GoToTerminal(); to switch the program over to it.
export const TERMINAL_START_PAGE: StoryPage = {
  bg: jeepneyTerminalStartImg,
  lines: ["You've made it to the terminal."],
  align: 'left',
}