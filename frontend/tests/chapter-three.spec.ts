import { expect, test, type Page } from '@playwright/test'

const scoreEvaluationCode = `if(score >= 90)
{
    ShowExcellent();
}
else if(score >= 75)
{
    ShowPassed();
}
else
{
    ShowNeedsImprovement();
}`

async function openChapterThree(page: Page) {
  const submissions: { question: number; answer: string }[] = []
  await page.addInitScript(() => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: 'chapter-three-test', exp: expiresAt }))}.test`
    localStorage.setItem(
      'sb-127-auth-token',
      JSON.stringify({
        access_token: token,
        refresh_token: 'chapter-three-test',
        expires_at: expiresAt,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'chapter-three-test',
          aud: 'authenticated',
          role: 'authenticated',
        },
      }),
    )
    sessionStorage.setItem(
      'ciepher.current-view',
      JSON.stringify({ screen: 'mission', chapter: 3, mission: 1 }),
    )
  })
  await page.route('**/functions/v1/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/me')) {
      await route.fulfill({
        json: {
          profile: {
            id: 'chapter-three-test',
            username: 'tester',
            character: 'girl',
          },
        },
      })
      return
    }
    if (path.endsWith('/progress')) {
      await route.fulfill({
        json: {
          chapters: [
            { id: 0, unlocked: true, completed: true, missions: [] },
            { id: 1, unlocked: true, completed: true, missions: [] },
            { id: 2, unlocked: true, completed: true, missions: [] },
            {
              id: 3,
              unlocked: true,
              completed: false,
              missions: [
                { number: 1, unlocked: true, completed: false },
                { number: 2, unlocked: false, completed: false },
              ],
            },
          ],
        },
      })
      return
    }
    if (path.endsWith('/missions/submit')) {
      const body = route.request().postDataJSON() as {
        question: number
        answer: string
      }
      submissions.push(body)
      if (
        (body.question === 1 && body.answer.trim() === 'else if') ||
        (body.question === 2 && body.answer.trim() === scoreEvaluationCode)
      ) {
        await route.fulfill({ json: { correct: true } })
      } else {
        await route.fulfill({
          json: {
            correct: false,
            mistakes: [{ start: 0, end: Math.max(1, body.answer.length) }],
          },
        })
      }
      return
    }
    throw new Error(`Unexpected API call: ${path}`)
  })
  await page.goto('/')
  return submissions
}

async function nextStory(page: Page) {
  const bubble = page.locator('.story-bubble')
  await expect(bubble).toBeVisible()
  await bubble.click()
  await page.waitForTimeout(50)
  if (await bubble.isVisible().catch(() => false)) await bubble.click()
}

async function submit(page: Page, answer: string) {
  await page.getByRole('textbox', { name: 'Type your answer' }).fill(answer)
  await page.getByRole('button', { name: 'EXECUTE', exact: true }).click()
}

async function expectClassroomCharacterPositions(page: Page) {
  const professor = await page.locator('.story-professor').boundingBox()
  const student = await page.locator('.story-person').boundingBox()
  const viewport = page.viewportSize()

  expect(professor).not.toBeNull()
  expect(student).not.toBeNull()
  expect(viewport).not.toBeNull()

  if (!professor || !student || !viewport) return

  const professorCenter =
    viewport.width * (viewport.width > viewport.height ? 0.5 : 0.58)
  expect(
    Math.abs(professor.x + professor.width / 2 - professorCenter),
  ).toBeLessThan(viewport.width * 0.05)
  expect(professor.y).toBeLessThan(viewport.height * 0.5)
  expect(student.x + student.width / 2).toBeLessThan(viewport.width * 0.34)
  expect(student.y + student.height).toBeGreaterThan(viewport.height * 0.8)
}

test('Chapter 3 Part 1 shows its scene, situation, choice error, and else-if flow', async ({
  page,
}) => {
  const submissions = await openChapterThree(page)

  await expect(page.locator('.story-speaker')).toHaveText('Professor Reyes')
  await expect(page.locator('.story-text')).toContainText('Good morning class!')
  await expectClassroomCharacterPositions(page)
  await nextStory(page)

  await expect(
    page.getByRole('heading', { name: 'SITUATION', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.chapter-three-computer')).toBeVisible()
  await expect(page.locator('.chapter-three-avatar')).toBeVisible()
  await page.getByRole('button', { name: 'NEXT', exact: true }).click()

  await expect(page.locator('.mission-challenge')).toBeVisible()
  await expect(page.locator('.mission-choice')).toHaveText([
    'if',
    'else if',
    'if...else',
  ])
  await submit(page, 'if')
  await expect(page.locator('.mission-choice-wrong')).toHaveText('if')
  await expect(page.locator('.mission-feedback.wrong')).toContainText(
    'SYNTAX ERROR',
  )

  await submit(page, 'if...else')
  await expect(page.locator('.mission-choice-wrong')).toHaveText('if...else')

  await submit(page, 'else if')
  await expect(
    page.getByRole('heading', { name: 'UNDERSTAND THE CORE', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.chapter-three-meaning')).toContainText(
    'more than two possible outcomes',
  )
  await expect(
    page.getByRole('heading', { name: 'PROGRAM FLOW', exact: true }),
  ).toBeVisible()
  const programFlow = page.locator('.chapter-three-flow')
  await expect(programFlow).toContainText('INPUT SCORE')
  await expect(programFlow).toContainText('IS SCORE ≥ 90?')
  await expect(programFlow).toContainText('IS SCORE ≥ 75?')
  await expect(programFlow).toContainText('DISPLAY "EXCELLENT"')
  await expect(programFlow).toContainText('DISPLAY "PASSED"')
  await expect(programFlow).toContainText('DISPLAY "NEEDS IMPROVEMENT"')
  await page.getByRole('button', { name: 'CONTINUE', exact: true }).click()

  await expect(
    page.getByAltText('Mouse cursor selecting History'),
  ).toBeVisible()
  await expect(page.locator('.story-text')).toContainText(
    'I want to know what my grade is in the laboratory activity.',
  )
  await nextStory(page)

  await expect(
    page.getByRole('heading', { name: 'SITUATION', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.chapter-three-situation')).toContainText(
    'The History tab shows that laboratory activities are graded',
  )
  await page.getByRole('button', { name: 'NEXT', exact: true }).click()

  await expect(page.locator('.mission-choice')).toHaveCount(3)
  await submit(
    page,
    `if(score >= 90)
{
    ShowExcellent();
}
elseif(score >= 75)
{
    ShowPassed();
}
else
{
    ShowNeedsImprovement();
}`,
  )
  await expect(page.locator('.mission-choice-wrong')).toContainText('elseif')

  await submit(page, scoreEvaluationCode)
  await expect(
    page.getByRole('heading', { name: 'UNDERSTAND THE CORE', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.chapter-three-meaning')).toContainText(
    'evaluate multiple conditions in sequence until one condition is true',
  )
  await expect(page.locator('.chapter-three-flow')).toContainText(
    'DISPLAY "NEEDS IMPROVEMENT"',
  )
  expect(submissions.map((submission) => submission.question)).toEqual([
    1, 1, 1, 2, 2,
  ])
})
