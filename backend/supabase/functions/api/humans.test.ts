import { assertEquals, assertRejects } from "@std/assert";
import { turnstileCheck } from "./humans.ts";

// A stand-in for Cloudflare that records what it was asked.
function fakeCloudflare(answer: Response) {
  const calls: { url: string; form: Record<string, string> }[] = [];
  const send = ((url: string | URL | Request, init?: RequestInit) => {
    const form = Object.fromEntries(init?.body as URLSearchParams);
    calls.push({ url: String(url), form });
    return Promise.resolve(answer.clone());
  }) as typeof fetch;
  return { calls, send };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

Deno.test("turnstile: off when no secret key is set", () => {
  assertEquals(turnstileCheck(undefined), undefined);
  assertEquals(turnstileCheck(""), undefined);
});

Deno.test(
  "turnstile: asks Cloudflare with the secret, token and IP",
  async () => {
    const cloudflare = fakeCloudflare(json({ success: true }));
    const check = turnstileCheck("the-secret", cloudflare.send)!;
    assertEquals(await check("the-token", "203.0.113.7"), true);
    assertEquals(cloudflare.calls, [
      {
        url: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        form: {
          secret: "the-secret",
          response: "the-token",
          remoteip: "203.0.113.7",
        },
      },
    ]);
  },
);

Deno.test("turnstile: leaves the IP out when it isn't known", async () => {
  const cloudflare = fakeCloudflare(json({ success: true }));
  await turnstileCheck("the-secret", cloudflare.send)!("the-token", undefined);
  assertEquals(Object.keys(cloudflare.calls[0].form), ["secret", "response"]);
});

Deno.test("turnstile: a token Cloudflare refuses is not a person", async () => {
  const cloudflare = fakeCloudflare(
    json({ success: false, "error-codes": ["timeout-or-duplicate"] }),
  );
  const check = turnstileCheck("the-secret", cloudflare.send)!;
  assertEquals(await check("old-token", undefined), false);
});

Deno.test("turnstile: an odd answer is not a person either", async () => {
  const cloudflare = fakeCloudflare(json({ success: "yes" }));
  const check = turnstileCheck("the-secret", cloudflare.send)!;
  assertEquals(await check("the-token", undefined), false);
});

Deno.test(
  "turnstile: Cloudflare being down is an error, not a pass",
  async () => {
    const cloudflare = fakeCloudflare(json({ error: "down" }, 500));
    const check = turnstileCheck("the-secret", cloudflare.send)!;
    await assertRejects(() => check("the-token", undefined));
  },
);
