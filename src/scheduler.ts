import cron from "node-cron";
import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PID_FILE = join(__dirname, "../config/scheduler.pid");
const PROJECT_DIR = join(__dirname, "..");

// ログ出力
function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Claude Codeヘッドレスコマンドを実行
async function runPostTrend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `claude -p "/post-trend" --mcp-config "${join(PROJECT_DIR, ".mcp.json")}" --permission-mode bypassPermissions`;

    log(`Executing: ${command}`);

    exec(command, { cwd: PROJECT_DIR }, (error, stdout, stderr) => {
      if (error) {
        log(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        log(`Stderr: ${stderr}`);
      }
      if (stdout) {
        log(`Output: ${stdout}`);
      }
      log("Post trend completed successfully");
      resolve();
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
