// The reusable story beats played around the prologue's missions, grouped so
// screens can call on them without mixing data into component files.

import openDoorImg from './assets/prologue/OpenDoor.png'
import outsideDoorImg from './assets/prologue/OutsideDoor.png'
import jeepneyTerminalImg from './assets/prologue/JeepneyTerminal.png'
import schoolImg from './chapter1/Schoool.png'
import classroomImg from './chapter1/classroom.png'
import powerImg from './chapter1/power.png'
import profClassroomImg from './chapter1/prof_classroom.jpg'
import guardImg from './chapter1/guard.png'

export type StoryPage = {
  bg: string
  lines: string[]
  // Where the background art is anchored (object-position). Defaults to the
  // bedroom look: centered, hugging the bottom. Per-page override so scenes
  // with a different focal point don't need to touch the shared styles.
  pos?: string
  // Where the player sprite stands: center (default), left, or right.
  align?: 'center' | 'left' | 'right'
  // Show the school guard sprite on the right of the scene.
  guard?: boolean
  // Which character says the lines. Defaults to the player.
  speaker?: 'player' | 'guard' | 'kiosk'
  // Hide the player sprite: some scenes already draw the people into the
  // background art, so a separate sprite would double them up.
  noSprite?: boolean
}

// The story beat right after mission 1's explanation closes: the door swings
// open (player steps to the left) and the player ends up outside (stepping
// to the right) before the CORRECT! message appears.
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

// The opening of mission 3: the player is now at/in the jeep and boards it
// before the RideJeep(); exercise.
export const JEEP_START_PAGE: StoryPage = {
  bg: jeepneyTerminalImg,
  lines: ['The jeepney is ready. Time to head to school.'],
}

// Chapter 1 — The player arrives at the university gate.
export const SCHOOL_GATE_PAGE: StoryPage = {
  bg: schoolImg,
  lines: ['Good morning! Please present your school ID.'],
  align: 'left',
  guard: true,
  speaker: 'guard',
}

// Chapter 1 Scene 1.2 — After the gate exercise, the guard lets the player in.
export const WELCOME_GATE_PAGE: StoryPage = {
  bg: schoolImg,
  lines: ['Welcome to the university.'],
  align: 'left',
  guard: true,
  speaker: 'guard',
}

// Chapter 1 Scene 2.1 — The player arrives outside the classroom. The
// attendance kiosk asks for the ID before the if-statement challenge.
export const CLASSROOM_PAGE: StoryPage = {
  bg: classroomImg,
  lines: ['Scan your ID to record your attendance.'],
  speaker: 'kiosk',
}

// Chapter 1 Scene 3.1 — The player enters the Programming Laboratory and
// finds the assigned computer turned off before the hasPower challenge.
export const PROGRAMMING_LAB_PAGE: StoryPage = {
  bg: powerImg,
  lines: [
    'You enter the Programming Laboratory.',
    'The assigned computer is turned off.',
  ],
}

// Chapter 1 Scene 3.2 — mission 4 opens in the professor's classroom as a
// short programming exercise and notification appear. The professor and
// students are part of the artwork, so no player sprite is drawn.
export const HOMEWORK_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  lines: [
    'The professor gives the class a short programming exercise.',
    'Complete the activity before submitting it.',
  ],
}

// Chapter 1 Scene 4.1 — after mission 4's explanation, the screen confirms
// the activity was submitted. The characters stay inside the artwork.
export const SUBMISSION_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  lines: ['Activity submitted successfully.'],
}

export {
  schoolImg,
  classroomImg,
  powerImg,
  profClassroomImg,
  guardImg,
}