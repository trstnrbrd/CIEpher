// The reusable story beats played around the prologue's missions, grouped so
// screens can call on them without mixing data into component files.

import openDoorImg from './assets/prologue/OpenDoor.webp'
import outsideDoorImg from './assets/prologue/OutsideDoor.webp'
import jeepneyTerminalImg from './assets/prologue/JeepneyTerminal.webp'
import schoolImg from './chapter1/Schoool.webp'
import classroomImg from './chapter1/classroom.webp'
import hallwayImg from './chapter1/Hallway.webp'
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
  // Use the yellow kiosk dialog treatment for scene-specific machine prompts.
  bubble?: 'yellow'
  // Hide the player sprite: some scenes already draw the people into the
  // background art, so a separate sprite would double them up.
  noSprite?: boolean
  // A card with this title instead of a speech bubble, like the chapter
  // docs' "Situation" before a question or "Correct" after an answer:
  // `lines` are its paragraphs, shown in full over the same scene, with a
  // Next button.
  card?: string
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

// Chapter 1, mission 1's situation, over the same gate scene, before its
// first question.
export const SCHOOL_GATE_SITUATION_PAGE: StoryPage = {
  bg: schoolImg,
  lines: [
    'The university follows a No ID, No Entry policy.',
    'Before writing the program, determine the correct control structure for this situation.',
  ],
  align: 'left',
  guard: true,
  card: 'SITUATION',
}

// Chapter 1, mission 1: after the if/while choice is answered right, before
// the syntax challenge.
export const SCHOOL_GATE_CHOICE_CORRECT_PAGE: StoryPage = {
  bg: schoolImg,
  lines: [
    'The if statement is used because the action should happen only when a condition is true.',
    'In this case:',
    'If the student has a valid ID, the gate opens.',
  ],
  align: 'left',
  guard: true,
  card: 'Correct',
}

// Chapter 1, mission 1: after the syntax answer is correct, before the guard
// welcomes the player into the university.
export const SCHOOL_GATE_SYNTAX_CORRECT_PAGE: StoryPage = {
  bg: schoolImg,
  lines: [
    'The if statement executes a block of code only when its condition is true.',
    '✓ Used to check a single condition.',
    '✓ Executes only when the condition is true.',
  ],
  align: 'left',
  guard: true,
  card: 'Correct',
}

// Chapter 1 Scene 1.2 — After the gate exercise, the guard lets the player in.
export const WELCOME_GATE_PAGE: StoryPage = {
  bg: schoolImg,
  lines: ['Welcome to the university.'],
  align: 'left',
  guard: true,
  speaker: 'guard',
}

// Chapter 1 Scene 2.1 — The player arrives outside the classroom.
export const CLASSROOM_ARRIVAL_PAGE: StoryPage = {
  bg: hallwayImg,
  lines: ['The player arrives outside the classroom.'],
}

// The attendance kiosk is waiting before it asks the player to scan an ID.
export const CLASSROOM_KIOSK_PAGE: StoryPage = {
  bg: hallwayImg,
  lines: ['A digital attendance kiosk is waiting for students.'],
  speaker: 'kiosk',
}

// The attendance kiosk asks for the ID before the if-statement challenge.
export const CLASSROOM_PAGE: StoryPage = {
  bg: hallwayImg,
  lines: ['Scan your ID to record your attendance.'],
  speaker: 'kiosk',
  bubble: 'yellow',
}

// Chapter 1 Mission 2 — the situation shown after the ID scan prompt and
// before the control-structure question.
export const CLASSROOM_SITUATION_PAGE: StoryPage = {
  bg: hallwayImg,
  lines: ['The attendance system should only record students who are present.'],
  card: 'SITUATION',
}

// Chapter 1 Mission 2 — after the syntax explanation, remind the player why
// the braces are required before continuing to the next mission.
export const CLASSROOM_CORRECT_PAGE: StoryPage = {
  bg: hallwayImg,
  lines: ['Remember to use braces { } to define the block of code.'],
  card: 'Correct',
}

// Chapter 1 Mission 2 — the attendance kiosk confirms the recorded entry.
export const CLASSROOM_ATTENDANCE_RECORDED_PAGE: StoryPage = {
  bg: hallwayImg,
  lines: ['Attendance Recorded'],
  speaker: 'kiosk',
  bubble: 'yellow',
}

// Chapter 1 Mission 3 — the player enters the Programming Laboratory.
export const PROGRAMMING_LAB_ENTRY_PAGE: StoryPage = {
  bg: classroomImg,
  pos: '50% 100%',
  lines: ['The player enters the Programming Laboratory.'],
}

// The assigned computer is turned off before the hasPower challenge. The
// classroom artwork already shows the computer, so no extra character sprite
// is drawn on this second scene.
export const PROGRAMMING_LAB_PAGE: StoryPage = {
  bg: powerImg,
  lines: ['The assigned computer is turned off.'],
  noSprite: true,
}

// Chapter 1 Mission 3 — the situation shown before the power question.
export const PROGRAMMING_LAB_SITUATION_PAGE: StoryPage = {
  bg: powerImg,
  lines: ['The computer should only turn on if power is available.'],
  noSprite: true,
  card: 'Situation',
}

// Chapter 1 Mission 3 — reinforce the semicolon rule after the core
// explanation before continuing to the next mission.
export const PROGRAMMING_LAB_CORRECT_PAGE: StoryPage = {
  bg: powerImg,
  lines: ["Don't forget the semicolon (;) at the end of every statement."],
  noSprite: true,
  card: 'Correct',
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
  lines: ['The Wi-Fi icon turns green.', 'The computer connects successfully.'],
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
