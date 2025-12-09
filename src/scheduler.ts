import cron from "node-cron";
import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { appendFileSync as appendFileSyncFs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PID_FILE = join(__dirname, "../config/scheduler.pid");
const LOG_FILE = join(__dirname, "../config/scheduler.log");
const PROJECT_DIR = join(__dirname, "..");

// ログ出力（ファイルにも書き込む）
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(logLine.trim());
  try {
    appendFileSyncFs(LOG_FILE, logLine);
  } catch {
    // ログ書き込み失敗は無視
  }
}

// Claude Codeヘッドレスコマンドを実行（PowerShell経由）
async function runPostTrend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const mcpConfigPath = join(PROJECT_DIR, ".mcp.json");
    // PowerShell経由で実行（node直接だとハングする問題の回避）
    const command = `powershell -NoProfile -Command "& { claude -p '/post-trend' --mcp-config '${mcpConfigPath}' --permission-mode bypassPermissions }"`;

    log(`Executing via PowerShell: claude -p '/post-trend'`);

    const child = exec(
      command,
      {
        cwd: PROJECT_DIR,
        windowsHide: true,
        timeout: 10 * 60 * 1000, // 10分タイムアウト
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        if (error) {
          log(`Error: ${error.message}`);
          if (error.killed) {
            log("Process was killed (timeout or signal)");
          }
          reject(error);
          return;
        }
        if (stderr) {
          log(`Stderr: ${stderr}`);
        }
        if (stdout) {
          // 出力の最初と最後を表示
          const output = stdout.trim();
          if (output.length > 500) {
            log(`Output: ${output.substring(0, 200)}...${output.substring(output.length - 200)}`);
          } else {
            log(`Output: ${output}`);
          }
        }
        log("Post trend completed successfully");
        resolve();
      }
    );

    child.on("spawn", () => {
      log(`Child process spawned (PID: ${child.pid})`);
    });

    child.on("error", (err) => {
      log(`Child process error: ${err.message}`);
    });
  });
}

// メイン処理
async function main() {
  log("Scheduler starting...");

  // PIDファイルを作成
  await writeFile(PID_FILE, process.pid.toString());
  log(`PID file created: ${PID_FILE} (PID: ${process.pid})`);

  // 15分ごとに実行
  const task = cron.schedule("*/15 * * * *", async () => {
    log("Cron job triggered");
    try {
      await runPostTrend();
    } catch (error) {
      log(`Failed to run post trend: ${error}`);
    }
  });

  log("Scheduler started. Running every 15 minutes.");
  log("Press Ctrl+C to stop.");

  // 起動直後にも1回実行（オプション）
  // await runPostTrend();

  // シグナルハンドリング
  const cleanup = async () => {
    log("Shutting down scheduler...");
    task.stop();
    try {
      await unlink(PID_FILE);
      log("PID file removed");
    } catch {
      // ファイルが存在しない場合は無視
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((error) => {
  console.error("Scheduler error:", error);
  process.exit(1);
});
