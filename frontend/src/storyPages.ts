// The reusable story beats played around the prologue's missions, grouped so
// screens can call on them without mixing data into component files.

import openDoorImg from './assets/prologue/OpenDoor.webp'
import outsideDoorImg from './assets/prologue/OutsideDoor.webp'
import jeepneyTerminalImg from './assets/prologue/JeepneyTerminal.webp'
import schoolImg from './chapter1/Schoool.webp'
import classroomImg from './chapter1/classroom.webp'
import powerImg from './chapter1/power.webp'
import profClassroomImg from './chapter1/prof_classroom.webp'
import guardImg from './chapter1/guard.webp'
import bookstoreImg from './chapter 2/bookstore.webp'
import connectedImg from './chapter 2/connected.webp'
import loginPcImg from './chapter 2/LOGIN_PC.webp'
import noWifiImg from './chapter 2/no wifi.webp'
import pcImg from './chapter 2/pc.webp'

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
  // Show Professor Reyes on the right of the scene instead of the player.
  professor?: boolean
  // Which character says the lines. Defaults to the player.
  speaker?: 'player' | 'guard' | 'kiosk' | 'professor'
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

// Chapter 1 Scene 4.2 — mission 5 opens as the professor announces a short
// readiness quiz before starting the lesson.
export const QUIZ_ANNOUNCEMENT_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  lines: [
    'The professor announces a short readiness quiz before the lesson begins.',
    'Only students with recorded attendance may take it.',
  ],
}

// Chapter 1 Scene 5.1 — after the quiz, the professor closes the chapter.
export const REYES_CLOSING_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  lines: [
    "Excellent work. Today you've learned how the if statement helps a program make decisions based on a single condition.",
  ],
}

// Chapter 2, Scene 1 — mission 1 opens in the programming laboratory as
// Professor Reyes begins the first laboratory activity on if...else before
// the challenge. He stands on the right.
export const CH2_SCENE1_PAGE: StoryPage = {
  bg: pcImg,
  professor: true,
  speaker: 'professor',
  noSprite: true,
  lines: [
    'In our previous lesson, you learned how to perform an action when a condition is true.',
    "Today, you'll learn how a program responds when the condition is either true or false.",
    "Let's begin.",
  ],
}

// Chapter 2, Scene 1.1 — the purchase dialogue between mission 1's questions:
// the player asks for the worksheet with the avatar centered, then the
// cashier answers.
export const CH2_PURCHASE_PAGES: StoryPage[] = [
  {
    bg: bookstoreImg,
    lines: ["Hello, Ma'am, I would like to buy the programming worksheet."],
  },
  {
    bg: bookstoreImg,
    lines: ['That will be 50 coins.'],
  },
]

// Chapter 2, Scene 1.2 — after the syntax challenge, the purchase finishes:
// the cashier hands over the worksheet. Professor Reyes watches from the
// right as a text-bubble animation plays out.
export const CH2_PURCHASE_DONE_PAGE: StoryPage = {
  bg: bookstoreImg,
  lines: [
    'The player purchases the worksheet.',
    'The cashier hands over the worksheet.',
  ],
}

// Chapter 2, Scene 2 — mission 2 opens in the programming laboratory as the
// player finds the computer has no connection before the challenge.
export const CH2_WIFI_SETUP_PAGE: StoryPage = {
  bg: noWifiImg,
  noSprite: true,
  lines: [
    'The laboratory computers require an internet connection before students can access the online learning platform.',
  ],
}

// Chapter 2, Scene 2.1 — after the Wi-Fi mission, the computer connects.
export const CH2_WIFI_ON_PAGE: StoryPage = {
  bg: connectedImg,
  noSprite: true,
  lines: [
    'The Wi-Fi icon turns green.',
    'The computer connects successfully.',
  ],
}

// Chapter 2, Scene 2.2 — the player heads to the learning portal.
export const CH2_PORTAL_LINE_PAGE: StoryPage = {
  bg: loginPcImg,
  noSprite: true,
  align: 'left',
  lines: ["I need to access the school's learning portal."],
}

// Chapter 2, Scene 3.1 — after the portal mission, it opens successfully.
export const CH2_PORTAL_OPENED_PAGE: StoryPage = {
  bg: pcImg,
  noSprite: true,
  lines: ['The learning portal opens successfully.'],
}

// Chapter 2, Scene 3.2 — the player needs to upload today's activity.
export const CH2_UPLOAD_LINE_PAGE: StoryPage = {
  bg: pcImg,
  align: 'left',
  lines: ['I need to upload my learning activity in our portal.'],
}

// Chapter 2, Scene 4.1 — after the upload mission, the submission is accepted.
export const CH2_SUBMITTED_PAGE: StoryPage = {
  bg: pcImg,
  noSprite: true,
  lines: ['The submission is accepted.'],
}

// Chapter 2, Scene 4.2 — the professor challenges the player, then the player
// agrees before mission 5.
export const CH2_REVIEW_PAGES: StoryPage[] = [
  {
    bg: pcImg,
    noSprite: true,
    lines: ["Let's see if you can apply what you've learned."],
  },
  {
    bg: pcImg,
    align: 'left',
    lines: ['Okay Sir.'],
  },
]

// Chapter 2, Scene 5.1 — after the chapter unlocks, Professor Reyes closes it.
export const CH2_CLOSING_PAGE: StoryPage = {
  bg: pcImg,
  noSprite: true,
  lines: [
    "Excellent work. You've learned that programs don't just make decisions—they also know what to do when a condition is false.",
  ],
}

export {
  schoolImg,
  classroomImg,
  powerImg,
  profClassroomImg,
  guardImg,
  bookstoreImg,
  noWifiImg,
  connectedImg,
  pcImg,
}