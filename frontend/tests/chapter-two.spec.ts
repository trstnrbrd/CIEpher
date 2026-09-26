import { expect, test, type Page } from '@playwright/test'

// Contract fixtures only: browser tests never create accounts or alter real
// progress. Answer correctness is supplied by the mocked server response.
async function openChapter(page: Page, mission = 1, question = 1) {
  const submissions: {
    chapter: number
    mission: number
    question: number
    answer: string
  }[] = []
  const completed = new Set<number>(
    Array.from({ length: mission - 1 }, (_, i) => i + 1),
  )
  const state = { mistakes: null as null | { start: number; end: number }[] }
  await page.addInitScript(
    ({ mission, question }) => {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: 'browser-test', exp: expiresAt }))}.test`
      localStorage.setItem(
        'sb-127-auth-token',
        JSON.stringify({
          access_token: token,
          refresh_token: 'browser-test',
          expires_at: expiresAt,
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'browser-test',
            aud: 'authenticated',
            role: 'authenticated',
          },
        }),
      )
      if (!sessionStorage.getItem('ciepher.current-view')) {
        sessionStorage.setItem(
          'ciepher.current-view',
          JSON.stringify({ screen: 'mission', chapter: 2, mission }),
        )
        sessionStorage.setItem(
          'ciepher.question-hint',
          JSON.stringify({ [`2:${mission}`]: question }),
        )
      }
    },
    { mission, question },
  )
  await page.route('**/functions/v1/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/me')) {
      await route.fulfill({
        json: {
          profile: {
            id: 'browser-test',
            username: 'tester',
            character: 'girl',
          },
        },
      })
    } else if (path.endsWith('/progress')) {
      await route.fulfill({
        json: {
          chapters: [
            { id: 0, unlocked: true, completed: true, missions: [] },
            { id: 1, unlocked: true, completed: true, missions: [] },
            {
              id: 2,
              unlocked: true,
              completed: completed.size === 5,
              missions: Array.from({ length: 5 }, (_, i) => ({
                number: i + 1,
                unlocked: i === 0 || completed.has(i),
                completed: completed.has(i + 1),
              })),
            },
            {
              id: 3,
              unlocked: completed.size === 5,
              completed: false,
              missions: [
                { number: 1, unlocked: completed.size === 5, completed: false },
              ],
            },
          ],
        },
      })
    } else if (path.endsWith('/missions/submit')) {
      const body = route.request().postDataJSON()
      submissions.push(body)
      if (state.mistakes) {
        await route.fulfill({
          json: { correct: false, mistakes: state.mistakes },
        })
      } else {
        if (body.mission !== 1 || body.question === 2)
          completed.add(body.mission)
        await route.fulfill({ json: { correct: true } })
      }
    } else {
      throw new Error(`Unexpected API call: ${path}`)
    }
  })
  await page.goto('/')
  return { submissions, completed, state }
}

async function nextStory(page: Page) {
  const bubble = page.locator('.story-bubble')
  await expect(bubble).toBeVisible()
  const visibleBubble = await bubble.elementHandle()
  if (!visibleBubble) throw new Error('Story dialogue is missing.')

  await visibleBubble.click()
  await page.waitForTimeout(50)

  // The first click either advances a fully typed page or finishes the
  // typewriter. Advance only when the original dialogue still exists.
  const stillOpen = await visibleBubble
    .evaluate((element) => element.isConnected)
    .catch(() => false)
  if (stillOpen) await visibleBubble.click()
}

async function submit(page: Page, answer: string) {
  await page.getByRole('textbox', { name: 'Type your answer' }).fill(answer)
  await page.getByRole('button', { name: 'EXECUTE', exact: true }).click()
}

async function expectCentered(page: Page, selector: string) {
  const viewport = page.viewportSize()
  const box = await page.locator(selector).boundingBox()
  if (!viewport || !box) throw new Error(`${selector} is not visible.`)
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(3)
}

async function nextSituation(page: Page, text: string) {
  await expect(
    page.getByRole('heading', { name: 'SITUATION', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.chapter-two-situation')).toContainText(text)
  await expectCentered(page, '.chapter-two-situation')
  await page.getByRole('button', { name: 'NEXT', exact: true }).click()
  await expect(page.locator('.mission-challenge')).toBeVisible()
  await expectCentered(page, '.mission-challenge')
}

async function finishCore(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'UNDERSTAND THE CORE', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.core-valid')).toBeVisible()
  await expect(
    page.locator('.core-screen').getByRole('heading', {
      name: 'PROGRAM FLOW',
      exact: true,
    }),
  ).toBeVisible()
  await page
    .locator('.core-screen')
    .getByRole('button', { name: 'OK', exact: true })
    .click()
}

test('all six questions lead through the story to the journal and Chapter 3', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const { submissions, completed } = await openChapter(page)
  await expect(page.locator('.story-speaker')).toHaveText('Professor Reyes')
  await nextStory(page)
  await nextSituation(page, '₱50')
  await expect(page.locator('.mission-choice')).toHaveText(['if', 'if...else'])
  await expect(page.getByRole('textbox')).toHaveValue('')
  const firstAnswer = '  if...else\n'
  await submit(page, firstAnswer)
  await expect(
    page.getByRole('heading', { name: 'UNDERSTAND THE CORE', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.core-code-right')).toContainText(
    'BuyWorksheet();',
  )
  expect(completed.has(1)).toBe(false)
  await page.getByRole('button', { name: 'OK', exact: true }).click()
  await nextStory(page)
  await expect(page.locator('.story-speaker')).toHaveText('Cashier')
  await nextStory(page)
  // Tests deliberately use arbitrary server-accepted text: the UI must use
  // the response, not a local answer key or the selected option.
  await submit(page, '  server accepted worksheet submission\n')
  await finishCore(page)
  await expect(page.locator('.story-worksheet')).toBeVisible()
  await nextStory(page)
  await nextStory(page)
  await nextSituation(page, 'Otherwise, access is denied.')
  await submit(page, 'server accepted Wi-Fi submission')
  await finishCore(page)
  await expect(page.locator('.story-wifi')).toBeVisible()
  await nextStory(page)
  await nextStory(page)
  await nextSituation(page, 'username and password')
  await expect(page.locator('.mission-choice').first()).toContainText('Else')
  await expect(page.locator('.mission-choice').nth(1)).toContainText('else')
  await submit(page, 'server accepted portal submission')
  await finishCore(page)
  await nextStory(page)
  await expect(
    page.getByRole('img', { name: 'Learning portal progress screen' }),
  ).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Mouse cursor selecting Submit Work' }),
  ).toBeVisible()
  await expect(page.locator('.story-text')).toContainText(
    'I need to upload my learning activity in our laboratory',
  )
  await nextStory(page)
  await nextSituation(page, 'upload error')
  await submit(page, 'server accepted upload submission')
  await finishCore(page)
  await nextStory(page)
  await expect(page.locator('.story-speaker')).toHaveText('Professor Reyes')
  await nextStory(page)
  await nextStory(page)
  await nextSituation(page, 'safety orientation')
  await submit(page, 'server accepted door submission')
  await finishCore(page)
  await expect(
    page.getByRole('heading', { name: 'CHAPTER COMPLETE' }),
  ).toBeVisible()
  await expect(page.locator('.story-card')).toContainText(
    'Lesson 2: The if...else Statement',
  )
  await page.getByRole('button', { name: 'Click to Learn!' }).click()
  await expect(page.locator('.journal-shelf')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.story-speaker')).toHaveText('Professor Reyes')
  await expect(page.locator('.story-text')).toContainText('Good morning class!')
  await nextStory(page)
  await expect(page.locator('.story-text')).toContainText(
    'Thank you, Sir Reyes.',
  )
  await nextStory(page)
  await expect(
    page.getByRole('button', { name: 'Chapter 3', exact: true }),
  ).toBeVisible()
  expect(
    submissions.map(({ mission, question }) => [mission, question]),
  ).toEqual([
    [1, 1],
    [1, 2],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
  ])
  expect(submissions[0].answer).toBe(firstAnswer)
  expect(errors).toEqual([])
})

test('server mistake ranges and missing markers use UTF-16 positions without shifting text', async ({
  page,
}) => {
  const { state, submissions } = await openChapter(page, 4)
  state.mistakes = [
    { start: 3, end: 4 },
    { start: 5, end: 5 },
    { start: 8, end: 8 },
  ]
  await expect(
    page.getByRole('img', { name: 'Learning portal progress screen' }),
  ).toBeVisible()
  await nextStory(page)
  await nextSituation(page, 'upload error')
  const answer = '😀 x\nyz!'
  await submit(page, answer)
  await expect(page.locator('.mission-feedback.wrong')).toBeVisible()
  await expect(page.locator('.hl-red')).toHaveText('x')
  await expect(page.locator('.hl-missing')).toHaveCount(2)
  expect(
    await page
      .locator('.hl-missing')
      .first()
      .evaluate((el) => el.nextElementSibling?.textContent),
  ).toBe('y')
  const width = await page
    .locator('.hl-missing')
    .first()
    .evaluate((el) => el.getBoundingClientRect().width)
  expect(width).toBe(0)
  expect(submissions[0].answer).toBe(answer)
  await expect(page.getByRole('heading', { name: 'PROGRAM FLOW' })).toHaveCount(
    0,
  )
  await page.getByRole('textbox').fill('try again')
  await expect(page.locator('.mission-code-overlay')).toHaveCount(0)
})

test('refresh resumes the second question and server progress keeps Chapter 3 locked', async ({
  page,
}) => {
  await openChapter(page, 1, 2)
  await nextStory(page)
  await expect(page.locator('.mission-choice').first()).toContainText(
    'coins >= 50',
  )
  await page.reload()
  await nextStory(page)
  await expect(page.locator('.mission-choice').first()).toContainText(
    'coins >= 50',
  )
  await page.evaluate(() =>
    sessionStorage.setItem(
      'ciepher.current-view',
      JSON.stringify({ screen: 'chapters' }),
    ),
  )
  await page.reload()
  await expect(
    page.getByLabel('Chapter 3, locked', { exact: true }),
  ).toBeVisible()
})
