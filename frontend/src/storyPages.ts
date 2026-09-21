// The reusable story beats played around the prologue's missions, grouped so
// screens can call on them without mixing data into component files.

import openDoorImg from './assets/prologue/OpenDoor.webp'
import outsideDoorImg from './assets/prologue/OutsideDoor.webp'
import jeepneyTerminalImg from './assets/prologue/JeepneyTerminal.webp'
import schoolImg from './chapter1/Schoool.webp'
import classroomImg from './chapter1/classroom.webp'
import hallwayImg from './chapter1/Hallway.webp'
import powerImg from './chapter1/power.webp'
import pcChapter1Img from './chapter1/PC.webp'
import profClassroomImg from './chapter1/prof_classroom.webp'
import guardImg from './chapter1/guard.webp'
import bookstoreImg from './chapter 2/bookstore.webp'
import connectedImg from './chapter 2/connected.webp'
import loginPcImg from './chapter 2/LOGIN_PC.webp'
import noWifiImg from './chapter 2/no wifi.webp'
import pcImg from './chapter 2/pc.webp'
import mouseImg from './chapter 2/mouse.png'
import scene4Img from './chapter 2/scene4.png'
import chapterThreeRoomImg from './chapter 3/room.png'

export type StoryPage = {
  bg: string
  lines: string[]
  // A story-specific placement variant for the characters over a background.
  scene?: 'chapter3-room'
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
  speaker?: 'player' | 'guard' | 'kiosk' | 'professor' | 'cashier' | 'narrator'
  animation?: 'worksheet' | 'wifi'
  // A panel dialog in the top corner with a tail: the yellow machine prompt,
  // or the white one Professor Reyes speaks from.
  bubble?: 'yellow' | 'white' | 'left'
  // Hide the player sprite: some scenes already draw the people into the
  // background art, so a separate sprite would double them up.
  noSprite?: boolean
  // Show the player as a cropped half-body portrait on the right side.
  halfBody?: boolean
  // Lines shown on the PC monitor in the chapter 1 computer scenes.
  screenText?: string[]
  // An image shown inside the PC monitor for a story scene.
  screenImage?: string
  screenImageAlt?: string
  // A cursor shown over the monitor image, such as a click on an action.
  screenCursor?: string
  screenCursorAlt?: string
  // Which portal control the cursor clicks. Submit Work is the default.
  screenCursorTarget?: 'submit' | 'history'
  // Add a small computer-screen icon for PC scenes.
  screenIcon?: 'file'
  // A card with this title instead of a speech bubble, like the chapter
  // docs' "Situation" before a question or "Correct" after an answer:
  // `lines` are its paragraphs, shown in full over the same scene, with a
  // Next button.
  card?: string
  // Tight lines under the card's paragraphs (the chapter's journal list).
  cardList?: string[]
  // The chapter-complete look: coloured title and the journal row.
  cardStyle?: 'complete'
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
  noSprite: true,
  card: 'SITUATION',
}

// Chapter 1 Mission 2 — after the syntax explanation, remind the player why
// the braces are required before continuing to the next mission.
export const CLASSROOM_CORRECT_PAGE: StoryPage = {
  bg: hallwayImg,
  lines: ['Remember to use braces { } to define the block of code.'],
  noSprite: true,
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
  card: 'SITUATION',
}

// Chapter 1 Mission 3 — reinforce the semicolon rule after the core
// explanation before continuing to the next mission.
export const PROGRAMMING_LAB_CORRECT_PAGE: StoryPage = {
  bg: powerImg,
  lines: ["Don't forget the semicolon (;) at the end of every statement."],
  noSprite: true,
  card: 'Correct',
}

// Chapter 1 Scene 3.2 — a notification appears on the laboratory computer.
export const PROGRAMMING_LAB_NOTIFICATION_PAGE: StoryPage = {
  bg: pcChapter1Img,
  lines: ['A notification appears.'],
  align: 'right',
  halfBody: true,
}

// Chapter 1 Mission 4, scene 2 — the activity appears on the computer after
// the notification scene.
export const HOMEWORK_PAGE: StoryPage = {
  bg: pcChapter1Img,
  lines: ['Complete the activity before submitting it.'],
  align: 'right',
  halfBody: true,
  screenIcon: 'file',
}

// Chapter 1 Mission 4, scene 3 — the situation shown before the exercise.
export const HOMEWORK_SITUATION_PAGE: StoryPage = {
  bg: pcChapter1Img,
  lines: ['The system should only accept activities that are completed.'],
  noSprite: true,
  card: 'SITUATION',
}

// Chapter 1 Mission 4 — reinforce the lowercase `if` rule after the core
// explanation before the submission scene.
export const HOMEWORK_CORRECT_PAGE: StoryPage = {
  bg: pcChapter1Img,
  lines: ['C# keywords are case-sensitive. Always use lowercase if.'],
  noSprite: true,
  card: 'Correct',
}

// Chapter 1, mission 4's last scene: the computer confirms the activity was
// submitted. No speech bubble, so a tap anywhere moves on.
export const SUBMISSION_PAGE: StoryPage = {
  bg: pcChapter1Img,
  lines: [],
  align: 'right',
  halfBody: true,
  screenText: ['ACTIVITY', 'SUBMITTED', 'SUCCESSFULLY', '!!!'],
}

// Chapter 1 Scene 4.2 — mission 5 opens as the professor announces a short
// readiness quiz before starting the lesson.
export const QUIZ_ANNOUNCEMENT_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  bubble: 'white',
  lines: [
    "We will have a practical quiz and if you can't finish it, you're not allowed to be dismiss.",
  ],
}

// Chapter 1, mission 5's situation, before its question.
export const QUIZ_SITUATION_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  card: 'SITUATION',
  lines: [
    'You need to finish the practical quiz that was given by your professor for you to go to your next class.',
  ],
}

// Chapter 1's end: the journal entry the player just earned.
export const CHAPTER_COMPLETE_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  card: 'CHAPTER COMPLETE',
  cardStyle: 'complete',
  lines: [
    'The CIEpher Code Journal is automatically updated:',
    'Lesson 1: The if Statement',
  ],
  cardList: [
    'Definition of if',
    'Basic syntax',
    'Common syntax errors',
    'Real-world applications',
  ],
}

// Chapter 1 Scene 5.1 — after the quiz, the professor closes the chapter.
export const REYES_CLOSING_PAGE: StoryPage = {
  bg: profClassroomImg,
  noSprite: true,
  bubble: 'white',
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
    speaker: 'cashier',
    lines: ['That will be 50 coins.'],
  },
]

// Chapter 2, Scene 1.2 — after the syntax challenge, the purchase finishes:
// the cashier hands over the worksheet. Professor Reyes watches from the
// right as a text-bubble animation plays out.
export const CH2_PURCHASE_DONE_PAGE: StoryPage = {
  bg: bookstoreImg,
  align: 'left',
  speaker: 'narrator',
  animation: 'worksheet',
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
  speaker: 'narrator',
  animation: 'wifi',
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

// Chapter 2, Scene 4 — the player sees the learning portal's upload screen
// before Mission 4 presents its situation and coding question.
export const CH2_UPLOAD_LINE_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  screenImage: scene4Img,
  screenImageAlt: 'Learning portal progress screen',
  screenCursor: mouseImg,
  screenCursorAlt: 'Mouse cursor selecting Submit Work',
  lines: ['I need to upload my learning activity in our laboratory'],
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
    professor: true,
    speaker: 'professor',
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
  professor: true,
  speaker: 'professor',
  lines: [
    "Excellent work. You've learned that programs don't just make decisions—they also know what to do when a condition is false.",
  ],
}

// Chapter 3, Scenes 1 and 2 — Professor Reyes introduces the next lesson
// after Chapter 2, then the player replies before returning to Chapter Select.
export const CH3_INTRO_PAGES: StoryPage[] = [
  {
    bg: chapterThreeRoomImg,
    scene: 'chapter3-room',
    professor: true,
    speaker: 'professor',
    align: 'left',
    bubble: 'white',
    lines: [
      'Good morning class! Today I will be checking each of your activity. Your score will be posted in your portal.',
    ],
  },
  {
    bg: chapterThreeRoomImg,
    scene: 'chapter3-room',
    professor: true,
    align: 'left',
    bubble: 'left',
    lines: ['Thank you, Sir Reyes.'],
  },
]

// Chapter 3, Part 1, Scene 3 — this plays when the unlocked chapter is
// opened, before the performance-evaluation situation and its question.
export const CH3_PART_ONE_SCENE_PAGE: StoryPage = {
  bg: chapterThreeRoomImg,
  scene: 'chapter3-room',
  professor: true,
  speaker: 'professor',
  align: 'left',
  bubble: 'white',
  lines: [
    'Good morning class! Today I will be checking each of your activity. Your score will be posted in your portal.',
  ],
}

// Chapter 3, Part 1, Scene 4 — after identifying else if, the player opens
// the portal History tab to review their laboratory activity score.
export const CH3_HISTORY_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  bubble: 'white',
  screenImage: scene4Img,
  screenImageAlt: 'Learning portal with a History tab',
  screenCursor: mouseImg,
  screenCursorAlt: 'Mouse cursor selecting History',
  screenCursorTarget: 'history',
  lines: ['I want to know what my grade is in the laboratory activity.'],
}

export const CH2_COMPLETE_PAGE: StoryPage = {
  bg: pcImg,
  noSprite: true,
  card: 'CHAPTER COMPLETE',
  cardStyle: 'complete',
  lines: [
    'The CIEpher Code Journal is automatically updated:',
    'Lesson 2: The if...else Statement',
  ],
  cardList: [
    'Definition of if...else',
    'Basic syntax',
    'Common syntax errors',
    'Real-world applications',
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
