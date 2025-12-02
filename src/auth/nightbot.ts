import "dotenv/config";
import { createServer } from "http";
import { URL } from "url";
import { writeFile, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_FILE = join(__dirname, "../../config/credentials.json");

const NIGHTBOT_AUTH_URL = "https://api.nightbot.tv/oauth2/authorize";
const NIGHTBOT_TOKEN_URL = "https://api.nightbot.tv/oauth2/token";
const REDIRECT_URI = "http://localhost:3000/callback";
const SCOPE = "channel_send";

interface Credentials {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function getClientCredentials() {
  const clientId = process.env.NIGHTBOT_CLIENT_ID;
  const clientSecret = process.env.NIGHTBOT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "NIGHTBOT_CLIENT_ID and NIGHTBOT_CLIENT_SECRET must be set in .env file"
    );
  }

  return { clientId, clientSecret };
}

async function exchangeCodeForToken(code: string): Promise<Credentials> {
  const { clientId, clientSecret } = getClientCredentials();

  const response = await fetch(NIGHTBOT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

async function saveCredentials(credentials: Credentials): Promise<void> {
  await writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
  console.log(`Credentials saved to ${CREDENTIALS_FILE}`);
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const data = await readFile(CREDENTIALS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<Credentials> {
  const credentials = await loadCredentials();
  if (!credentials) {
    throw new Error("No credentials found. Run 'npm run auth' first.");
  }

  const { clientId, clientSecret } = getClientCredentials();

  const response = await fetch(NIGHTBOT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: credentials.refresh_token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  const newCredentials: Credentials = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || credentials.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  await saveCredentials(newCredentials);
  return newCredentials;
}

export async function getValidAccessToken(): Promise<string> {
  let credentials = await loadCredentials();

  if (!credentials) {
    throw new Error("No credentials found. Run 'npm run auth' first.");
  }

  // トークンが期限切れ（または5分以内に期限切れ）の場合はリフレッシュ
  if (credentials.expires_at < Date.now() + 5 * 60 * 1000) {
    console.error("Access token expired or expiring soon, refreshing...");
    credentials = await refreshAccessToken();
  }

  return credentials.access_token;
}

export async function startAuthServer(): Promise<void> {
  const { clientId } = getClientCredentials();

  const authUrl = `${NIGHTBOT_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPE}`;

  console.log("\n=== Nightbot OAuth Authentication ===\n");
  console.log("Opening browser for authentication...");
  console.log(`If browser doesn't open, visit: ${authUrl}\n`);

  // ブラウザを開く
  const { exec } = await import("child_process");
  const openCommand = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
  exec(`${openCommand} "${authUrl}"`);

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>認証エラー</h1><p>${error}</p>`);
          server.close();
          reject(new Error(error));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>認証エラー</h1><p>認可コードがありません</p>");
          server.close();
          reject(new Error("No authorization code"));
          return;
        }

        try {
          const credentials = await exchangeCodeForToken(code);
          await saveCredentials(credentials);

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <html>
              <head><title>認証成功</title></head>
              <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>✓ 認証成功！</h1>
                <p>このウィンドウを閉じてください。</p>
              </body>
            </html>
          `);

          console.log("\n✓ Authentication successful!");
          console.log("You can now use the Nightbot API.\n");

          server.close();
          resolve();
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>エラー</h1><p>${err}</p>`);
          server.close();
          reject(err);
        }
      }
    });

    server.listen(3000, () => {
      console.log("Waiting for authentication callback on http://localhost:3000 ...\n");
    });

    // 5分でタイムアウト
    setTimeout(() => {
      server.close();
      reject(new Error("Authentication timeout"));
    }, 5 * 60 * 1000);
  });
}

// CLIとして実行された場合
const isMain = import.meta.url.endsWith("nightbot.ts") || import.meta.url.endsWith("nightbot.js");
if (isMain) {
  startAuthServer()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Authentication failed:", err);
      process.exit(1);
    });
}
