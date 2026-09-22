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
import mouseImg from './chapter 2/mouse.webp'
import scene4Img from './chapter 2/scene4.webp'
import chapterThreeRoomImg from './chapter 3/room.webp'
import chapterThreeRoom2Img from './chapter 3/room2.webp'
import medalImg from './chapter 3/medal.webp'
import ch4KioskBeginImg from './assets/chapter 4/kioskTaptobegin.webp'
import ch4KioskMenuImg from './assets/chapter 4/kioskMenu.webp'
import ch4SelectActivityPCImg from './assets/chapter 4/selectActivityPC.webp'
import ch4ProgrammingActivityPCImg from './assets/chapter 4/programmingActivityPC.webp'
import ch4PCActivityImg from './assets/chapter 4/programmingActivityPC.webp'
import ch4SelectDestinationImg from './assets/chapter 4/SelectADestination.webp'
import ch4DestinationImg from './assets/chapter 4/SelectADestination.webp'
import ch4NightLibraryImg from './assets/chapter 4/nightLibraryRoom.webp'

export type StoryPage = {
  bg: string
  lines: string[]
  // A story-specific placement variant for the characters over a background.
  scene?: 'chapter3-room' | 'chapter4-kiosk'
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
  // Show scholarship staff on the left of room2.
  staff?: boolean
  // Show retro computer with score 90 on the left.
  scoreMonitor?: boolean
  // Type of content to display inside the retro monitor:
  monitorType?: 'score' | 'wifi' | 'submitted' | 'medal' | 'pc2Assigned' | 'controlStructures' | 'labMenu'
  // Show kiosk machine in foreground
  kiosk?: boolean
  kioskImage?: string
  // Show animated mouse cursor clicking TAP TO BEGIN on kiosk
  kioskCursor?: boolean
  // Show campus destination card
  destinationCard?: boolean
  // Show purple notebook on student desk
  book?: boolean
  // Which character says the lines. Defaults to the player.
  speaker?: 'player' | 'guard' | 'kiosk' | 'professor' | 'cashier' | 'staff' | 'narrator'
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

// Chapter 3, Scene 1.2 — after Mission 1 workflow, monitor displays score "90".
export const CH3_SCORE_PAGE: StoryPage = {
  bg: chapterThreeRoomImg,
  align: 'right',
  scoreMonitor: true,
  bubble: 'white',
  lines: ['Okay that was my score for the activity'],
}

// Chapter 3, Scene 1.3 — Player arrives at the scholarship office (room2.png)
export const CH3_SCHOLARSHIP_GREETING_PAGE: StoryPage = {
  bg: chapterThreeRoom2Img,
  staff: true,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: [
    'Good morning maam! I',
    'just wanted to check it',
    'i am qualify for',
    'scholarship.',
  ],
}

// Chapter 3, Scene 1.4 — Scholarship staff responds
export const CH3_SCHOLARSHIP_STAFF_PAGE: StoryPage = {
  bg: chapterThreeRoom2Img,
  staff: true,
  align: 'right',
  bubble: 'left',
  speaker: 'staff',
  lines: [
    "Welcome! Let's check",
    'your GPA and see if you',
    'are qualify for',
    'scholarship.',
  ],
}

// Chapter 3, Mission 2 — Situation Card modal
export const CH3_SITUATION_PAGE: StoryPage = {
  bg: chapterThreeRoom2Img,
  staff: true,
  align: 'right',
  card: 'Situation',
  lines: [
    "The scholarship office determines a student's eligibility.",
    '. GPA 1.25 or better ➡ Full Scholarship',
    '. GPA 1.75 or better ➡ Partial Scholarship',
    '. Otherwise ➡ Not Qualified',
  ],
}

// Chapter 3, Mission 2 — Correct Card modal (image.png)
export const CH3_M2_CORRECT_CARD: StoryPage = {
  bg: chapterThreeRoom2Img,
  staff: true,
  align: 'right',
  card: 'Correct',
  lines: [
    'Remember that else if is written as two separate words.',
  ],
}

// Chapter 3, Scene 2.1 — Staff says qualified (image copy.png)
export const CH3_M2_QUALIFIED_PAGE: StoryPage = {
  bg: chapterThreeRoom2Img,
  staff: true,
  align: 'right',
  bubble: 'left',
  speaker: 'staff',
  lines: ['You are qualify for a scholarship!'],
}

// Chapter 3, Scene 2.2 — Player thanks staff (image copy 2.png)
export const CH3_M2_THANKS_PAGE: StoryPage = {
  bg: chapterThreeRoom2Img,
  staff: true,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: ["Thank You Ma'am!"],
}

// Chapter 3, Mission 3, Scene 1 — Wi-Fi check on retro monitor
export const CH3_M3_WIFI_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  monitorType: 'wifi',
  bubble: 'white',
  speaker: 'player',
  lines: ['The Internet Connection is Fast!'],
}

// Chapter 3, Mission 3, Scene 2 — Professor Reyes announces activity
export const CH3_M3_PROF_PAGE: StoryPage = {
  bg: chapterThreeRoomImg,
  scene: 'chapter3-room',
  professor: true,
  book: true,
  align: 'left',
  bubble: 'white',
  speaker: 'professor',
  lines: [
    'Good Morning Class! So today we will have a activity. Your score determines the award and you will receive.',
  ],
}

// Chapter 3, Mission 3, Scene 3 — Activity submission confirmation
export const CH3_M3_SUBMITTED_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  monitorType: 'submitted',
  bubble: 'white',
  speaker: 'player',
  lines: ['Finally!'],
}

// Chapter 3, Mission 3, Scene 4 — Situation Card modal
export const CH3_M3_SITUATION_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  card: 'Situation',
  lines: [
    "The competition system determines the player's award.",
    '• Score >= 95 ➡ Gold',
    '• Score >= 85 ➡ Silver',
    '• Otherwise ➡ Bronze',
  ],
}

// Chapter 3, Mission 3 Post-Flow Cutscene 1 — Correct Card modal (image copy 3.png)
export const CH3_M3_CORRECT_CARD: StoryPage = {
  bg: pcImg,
  align: 'right',
  card: 'Correct',
  lines: ['Every block should be enclosed with braces {}.'],
}

// Chapter 3, Mission 3 Post-Flow Cutscene 2 — Gold Medal Screen (image copy 4.png)
export const CH3_M3_MEDAL_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  monitorType: 'medal',
  bubble: 'white',
  speaker: 'player',
  lines: ['Deserve!'],
}

// Chapter 3, Part 4 Scene 1 — Professor Reyes in classroom (media_1790089228774.png)
export const CH3_M4_PROF_PAGE: StoryPage = {
  bg: chapterThreeRoomImg,
  scene: 'chapter3-room',
  professor: true,
  book: true,
  align: 'left',
  bubble: 'white',
  speaker: 'professor',
  lines: [
    'I also going to evaulate you score. Please check your portal.',
  ],
}

// Chapter 3, Part 4 Scene 2 — PC monitor foreground, player background (media_1790089236381.png)
export const CH3_M4_PC_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: ['Let me see....'],
}

// Chapter 3, Part 4 Scene 3 — Situation Card modal (media_1790089975668.png)
export const CH3_M4_SITUATION_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  card: 'Situation',
  lines: [
    "The university evaluates the student's final laboratory performance.",
    '• 90-100 ➡ Excellent',
    '• 80-89 ➡ Very Good',
    '• 75-79 ➡ Good',
    '• Below 75 ➡ Needs Improvement',
  ],
}

// Chapter 3 Complete screen (media_1790090007943.png)
export const CH3_COMPLETE_PAGE: StoryPage = {
  bg: pcImg,
  noSprite: true,
  card: 'CHAPTER COMPLETE',
  cardStyle: 'complete',
  lines: [
    'The CIEpher Code Journal is automatically updated:',
    'Lesson 3 – The else if Statement',
  ],
  cardList: [
    'Multiple Conditions',
    'Syntax Structure',
    'Common Errors',
    'Real-life Applications',
  ],
}

// ========================================================
// Chapter 4 Story Pages
// ========================================================

// Chapter 4 Scene 1 — Professor Reyes at Campus Self-Service Kiosk, Mouse Click, and Menu
export const CH4_INTRO_PAGES: StoryPage[] = [
  {
    bg: hallwayImg,
    scene: 'chapter4-kiosk',
    kiosk: true,
    kioskImage: ch4KioskBeginImg,
    align: 'left',
    professor: true,
    bubble: 'white',
    speaker: 'professor',
    lines: [
      'Sometimes a program needs to choose from several fixed options.',
      'Instead of checking many conditions one by one, C# provides the switch statement.',
      "Today, you'll learn how to use it.",
    ],
  },
  {
    bg: hallwayImg,
    scene: 'chapter4-kiosk',
    kiosk: true,
    kioskImage: ch4KioskBeginImg,
    kioskCursor: true,
    align: 'left',
    bubble: 'white',
    speaker: 'player',
    lines: [
      'I want to check my class schedule.',
      "Let's tap the kiosk screen to begin!",
    ],
  },
  {
    bg: hallwayImg,
    scene: 'chapter4-kiosk',
    kiosk: true,
    kioskImage: ch4KioskMenuImg,
    align: 'left',
    bubble: 'white',
    speaker: 'player',
    lines: [
      'The kiosk menu is ready!',
      'Now I can choose what service to access.',
    ],
  },
  {
    bg: hallwayImg,
    scene: 'chapter4-kiosk',
    kiosk: true,
    kioskImage: ch4KioskMenuImg,
    card: 'Situation',
    lines: [
      'The university kiosk offers different services:',
      '• Option 1 ➡ View Schedule',
      '• Option 2 ➡ View Grades',
      '• Option 3 ➡ Print Registration Form',
      '• Default ➡ Invalid Option',
      '',
      'Select the correct control structure for the kiosk.',
    ],
  },
]

// Chapter 4 Scene 1.1 — Player at the kiosk wanting to check schedule
export const CH4_SCENE_1_1_PAGE: StoryPage = {
  bg: hallwayImg,
  kiosk: true,
  kioskImage: ch4KioskBeginImg,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: ['I want to check my class schedule.'],
}

// Chapter 4 Scene 1.2 — Kiosk displays schedule timetable
export const CH4_SCENE_1_2_PAGE: StoryPage = {
  bg: hallwayImg,
  kiosk: true,
  kioskImage: ch4KioskMenuImg,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: ['Great! I can see my schedule.'],
}

// Chapter 4 Scene 1.3 / Lab Entrance — Player enters Programming Lab
export const CH4_SCENE_ENTER_LAB_PAGE: StoryPage = {
  bg: profClassroomImg,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: [
    'The screen shows the available workstations.',
    'I need to find my assigned computer.',
  ],
}

// Chapter 4 Mission 2 Situation Card
export const CH4_M2_SITUATION_PAGE: StoryPage = {
  bg: profClassroomImg,
  card: 'Situation',
  lines: [
    'Students are assigned to different computers.',
    '• Computer 1',
    '• Computer 2',
    '• Computer 3',
    'Display the correct workstation based on the selected computer number.',
  ],
}

// Chapter 4 Scene 2.1 — Workstation displays "COMPUTER 2 ASSIGNED"
export const CH4_SCENE_2_1_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  scoreMonitor: true,
  monitorType: 'pc2Assigned',
  bubble: 'white',
  speaker: 'player',
  lines: ['This is my assigned computer.'],
}

// Chapter 4 Scene 2.2 — Computer displays lab activities list
export const CH4_SCENE_2_2_PAGE: StoryPage = {
  bg: ch4SelectActivityPCImg,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: [
    "The computer opens today's Programming Laboratory activities.",
    'A list of programming exercises appears.',
  ],
}

// Chapter 4 Mission 3 Situation Card
export const CH4_M3_SITUATION_PAGE: StoryPage = {
  bg: ch4PCActivityImg,
  card: 'Situation',
  lines: [
    "Today's laboratory lets students choose an exercise.",
    '• 1 ➡ Variables',
    '• 2 ➡ Operators',
    '• 3 ➡ Control Structures',
    'Display the selected activity.',
  ],
}

// Chapter 4 Scene 3.1 — Workstation displays "CONTROL STRUCTURES EXERCISE"
export const CH4_SCENE_3_1_PAGE: StoryPage = {
  bg: pcImg,
  align: 'right',
  scoreMonitor: true,
  monitorType: 'controlStructures',
  bubble: 'white',
  speaker: 'player',
  lines: ["I'll work on the Control Structures exercise."],
}

// Chapter 4 Scene 3.2 — Campus navigation system appears
export const CH4_SCENE_3_2_PAGE: StoryPage = {
  bg: ch4DestinationImg,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: [
    'After completing the exercise, I need to visit another area of the university.',
  ],
}

// Chapter 4 Mission 4 Situation Card
export const CH4_M4_SITUATION_PAGE: StoryPage = {
  bg: ch4DestinationImg,
  card: 'Situation',
  lines: [
    'The campus navigation system helps students find different locations.',
    '• 1 ➡ Library',
    '• 2 ➡ Cafeteria',
    '• 3 ➡ Programming Laboratory',
    'Display the correct destination.',
  ],
}

// Chapter 4 Scene 4.1 — Player arrives at the library
export const CH4_SCENE_4_1_PAGE: StoryPage = {
  bg: ch4NightLibraryImg,
  align: 'right',
  bubble: 'white',
  speaker: 'player',
  lines: ['I need to go to the library.'],
}

// Chapter 4 Scene 4.2 — Return to lab, Professor Reyes gives final challenge
export const CH4_SCENE_4_2_PAGE: StoryPage = {
  bg: profClassroomImg,
  professor: true,
  bubble: 'white',
  speaker: 'professor',
  lines: [
    "Great work! Let's see if you can apply what you've learned.",
  ],
}

// Chapter 4 Mission 5 Situation Card
export const CH4_M5_SITUATION_PAGE: StoryPage = {
  bg: profClassroomImg,
  card: 'Situation',
  lines: [
    'The Programming Laboratory menu lets students choose an action.',
    '• 1 ➡ Start Coding',
    '• 2 ➡ View Instructions',
    '• 3 ➡ Exit Laboratory',
    'Write the correct switch statement.',
  ],
}

// Chapter 4 Complete card
export const CH4_COMPLETE_PAGE: StoryPage = {
  bg: pcImg,
  noSprite: true,
  card: 'CHAPTER COMPLETE',
  cardStyle: 'complete',
  lines: [
    'The CIEpher Code Journal is automatically updated:',
    'Lesson 4 – The switch Statement',
  ],
  cardList: [
    'Definition of switch',
    'Basic syntax',
    'Common syntax errors',
    'Real-world applications',
  ],
}

// Chapter 4 Closing dialogue
export const CH4_CLOSING_PAGE: StoryPage = {
  bg: profClassroomImg,
  professor: true,
  bubble: 'white',
  speaker: 'professor',
  lines: [
    "Excellent work. You've learned how the switch statement allows a program to select one action from several fixed options.",
  ],
}

export {
  schoolImg,
  classroomImg,
  hallwayImg,
  powerImg,
  profClassroomImg,
  guardImg,
  bookstoreImg,
  noWifiImg,
  connectedImg,
  pcImg,
  chapterThreeRoomImg,
  chapterThreeRoom2Img,
  medalImg,
  ch4KioskBeginImg,
  ch4KioskMenuImg,
  ch4SelectActivityPCImg,
  ch4ProgrammingActivityPCImg,
  ch4SelectDestinationImg,
  ch4NightLibraryImg,
}

