# Run Spirimon generation on your own computer

The computer runs the existing Node companion and keeps your OpenAI API key. Your desktop browser, installed desktop game, phone browser and installed Android game can all connect to it. OpenAI performs the AI work; local AI models and a GPU are optional alternatives. The computer must stay awake, online, and running both the companion and its HTTPS tunnel. Normal gameplay does not require this server.

## One-time computer setup

1. Download and extract the source ZIP from GitHub. Install a supported Node.js release (the project requires Node 20 or later; use a currently supported release). Open a terminal in the extracted Spirimon folder.
2. Configure an HTTPS tunnel or reverse proxy to `http://127.0.0.1:4317`. A stable hostname avoids re-pairing after address changes. A temporary Cloudflare Quick Tunnel can be tried after installing `cloudflared`:

   ```sh
   cloudflared tunnel --url http://127.0.0.1:4317
   ```

   Keep this terminal open. Copy its HTTPS address. Quick Tunnel addresses are temporary; this example is for personal testing, not a guaranteed always-on hosting service. Other HTTPS tunnels work too. Preserve the original public Host header, or use the loopback Host. No router port forwarding is needed when using an outbound tunnel.
3. In another terminal, from the Spirimon source folder:

   ```sh
   npm run server:setup
   ```

   Enter the HTTPS origin and, optionally, your API key. Key entry is hidden. Leaving a field blank keeps its existing value. A pairing token is generated automatically. The configuration is stored under your user folder in `.spirimon/home-server.json`, outside the source repository and game saves. The companion also accepts the existing `OPENAI_API_KEY` environment variable instead of saving a key in this file; that variable takes precedence. Unix permissions are owner-only. On Windows, keep your user profile folder private.
4. Start the server:

   ```sh
   npm run server:home
   ```

   The launcher reads those settings after every restart and builds missing browser assets when needed. It binds to loopback by default, suitable for a tunnel. Existing environment-variable configuration and the original `node companion.mjs` entry remain supported. Configure a changed tunnel address by running setup again. To rotate access, replace the pairing token in your private settings file with a newly generated token of at least 24 characters, then rerun setup to rewrite the private pairing file and restart the server.

## Pair desktop and mobile

Open **Options → Set up / connect home AI server**. Import `.spirimon/phone-connection.json` from the server computer, or enter its address and pairing token manually. Transfer this file privately: it contains server access, but never the API key. Importing a file does not contact its address until you press **Connect and test**.

The connection check authenticates the service, checks whether its key is configured, and checks OpenAI model access. It does not request a paid image, so actual generation is still needed to verify image permissions. A missing or rejected API key is distinguished from a missing server or wrong pairing token. Use **Enable OpenAI discoveries** only when you want to authorize paid generation, or use the existing explicit queue action in Options.

**Remember pairing on this private device** is optional. It stores the pairing in device IndexedDB, separate from game saves, recovery snapshots and exported game backups. It is scoped to the exact companion origin and cannot follow an imported save to another server. A device that cannot persist browser storage can still pair for the session. **Forget this pairing** removes remembered credentials and disconnects this device. Other devices and the host's API key are unaffected. Existing advanced provider fields remain available; changing those credentials clears the remembered pairing to avoid reviving an old token.

The private pairing file can also be exported from the guide for transfer to another device. Keep the source configuration file and the pairing file private. The server configuration module, private user files and API key are not served as game assets.

## Tunnels, cancellation and compatibility

New companions advertise short-request job support. OpenAI generation and inspection submit one identified job, then poll its status with short HTTP requests. Lost submission responses can reuse the same ID without creating a second paid job. Short temporary polling failures retry only the status request. A restarted server or expired result produces an actionable error, not a new automatic generation. Results are process-local, expire after 20 minutes and are bounded to eight cached jobs. Only one generation operation runs at a time, including legacy requests. User cancellation aborts further provider work where supported; an API request already accepted by OpenAI may still be billed. Closing a browser abruptly can leave accepted work running until it completes or times out.

The older synchronous endpoints remain supported for existing clients and companions. New clients use polling only when their companion advertises it. This avoids holding a tunnel request open throughout the full artwork pipeline. Cloudflare documents a proxy read timeout; using short requests avoids depending on a fifteen-minute proxy response allowance.

GitHub Pages and explicitly configured origins remain supported. Installed desktop/file origins (`null`) and the installed Android localhost origin are accepted only on a companion with a sufficiently long pairing token, and still require the correct bearer token. Arbitrary browser origins are rejected. All remote API endpoints, including health and job results, require pairing. This is a personal companion, not a shared public multi-account credential service.

Sources: [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), [Cloudflare connection limits](https://developers.cloudflare.com/fundamentals/reference/connection-limits/), [OpenAI authentication](https://developers.openai.com/api/reference/overview).
