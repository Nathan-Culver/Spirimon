# OpenAI generation

OpenAI is an additional, opt-in provider for creature design, three form images, and independent visual inspection. Ollama, Stable Diffusion, browser WebGPU, Gemini text generation, offline designs, and the built-in roster remain available. Automatic selection keeps its existing free/local-first order; it does not add OpenAI unless explicitly selected as primary or fallback.

## On the computer running the companion

Use Node.js 20 or later. In the Spirimon source folder, set your **OpenAI API key** on the server and run the companion. Do not put the key in GitHub, a game save, or the Gemini key field.

PowerShell:

```powershell
$env:OPENAI_API_KEY = 'your-openai-api-key'
node companion.mjs
```

macOS/Linux:

```sh
export OPENAI_API_KEY='your-openai-api-key'
node companion.mjs
```

Open the game on that computer. Under Options, select **OpenAI**, click **Test provider**, then enable **Generate future discoveries with AI**. **Queue a new lineage** requests a design; unfinished owned artwork takes priority. Existing individuals keep their identity, stats, equipment, learned Techniques and progress when their artwork is repaired.

Alternatively, set `SPIRIMON_TOKEN` to a random pairing token of at least 24 characters when starting the service. Enter that pairing token in Options, paste your API key into **OpenAI API key**, and click **Connect OpenAI key**. This verifies model access and keeps the key in the running companion's memory, without writing it to disk. The field clears on either success or failure. After a companion restart, reconnect the key or use the environment-variable setup above. Replacing a key with an invalid one leaves the working connection intact.

The companion needs no local Ollama or Stable Diffusion models for OpenAI generation. Defaults are `gpt-4.1-mini` for design and vision, and `gpt-image-1.5` for images. Server environment variables `SPIRIMON_OPENAI_TEXT_MODEL`, `SPIRIMON_OPENAI_VISION_MODEL`, and `SPIRIMON_OPENAI_IMAGE_MODEL` override these. Text/vision replacements must support Responses, image input where applicable, and strict JSON-schema outputs. Image replacements must support transparent PNG generation and reference-image edits.

## Phone access

GitHub Pages serves the game but cannot run the companion or hold a server-side key. A phone needs a reachable companion service. Host the Node companion behind an HTTPS reverse proxy or a private HTTPS tunnel to the running computer. Set:

```sh
export OPENAI_API_KEY='your-openai-api-key'
export SPIRIMON_PUBLIC_URL='https://your-companion.example'
export SPIRIMON_TOKEN='your-random-pairing-token-at-least-24-characters'
node companion.mjs
```

Generate a token with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Configure the proxy/tunnel to forward to `http://127.0.0.1:4317`, preserve the public Host header or use the loopback Host, and allow requests to run for up to 15 minutes. A tunnel to the local computer works with the default loopback bind. If a container host needs a public listening interface, also set `SPIRIMON_BIND=0.0.0.0`; this is refused without the HTTPS public URL and pairing token. Set `SPIRIMON_PORT` if the host requires another port. Use a single Node process, which permits one generation operation at a time.

On the phone, open the normal game and enter the public HTTPS address in **Companion service address**, enter **Companion pairing token**, select **OpenAI**, and test it. The address is saved; the token stays only in that browser session and is scoped to that service address. Re-enter the token after reloading. The API key remains on your service. The remote service can also expose its existing local-model capabilities when hosted on your computer.

If you did not set `OPENAI_API_KEY` on the remote service, you can instead use **Connect OpenAI key** from the phone after pairing. The key is sent once over HTTPS to your own service; it is never included in game saves, provider-status responses, or public game assets. Only connect to a service you control.

The default allowed game origin is `https://nathan-culver.github.io`. Add other trusted browser origins with comma-separated `SPIRIMON_ORIGINS`. There is no wildcard CORS access. All remote API endpoints, including status, require the pairing token. Private server modules and environment files are not served to browsers.

## Generation and failures

Testing the provider lists model access; it does not generate an image. Image access can still require API organization verification. Actual generation uses paid API credits, separate from ordinary gameplay. A design produces three images: the first is generated, and the later forms use the first as an image-editing reference. Images are reduced to phone-friendly PNGs and must pass the existing framing, clipping, distinctness, palette and lineage checks. A vision model separately inspects every form for anatomy, ordered Types, modifier evidence, nonhuman identity and reference confidence. Confidence below the existing thresholds is rejected.

Semantic/pixel validation gets at most one corrective retry: a lineage can use up to six image requests plus design and inspection calls. Authentication, quota, permissions, network and API errors do not trigger that corrective retry. Failed OpenAI jobs pause rather than automatically spending again in the background. The reason appears in the artwork status. Fix the reported issue, then use **Retry paused artwork** in Options. Failed or cancelled jobs do not admit unfinished artwork into encounters or replace existing owned identities. Changing worlds cancels the browser request and the server stops sending further OpenAI requests; an API request already accepted by OpenAI may still be billed.

No hosted companion is automatically provisioned by publishing the static game. You must run or host the companion and supply its key. Live image generation requires a working API account with access to the configured models.

API contracts: [Responses structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [image generation](https://developers.openai.com/api/reference/resources/images/methods/generate), and [reference-image edits](https://developers.openai.com/api/reference/resources/images/methods/edit).
