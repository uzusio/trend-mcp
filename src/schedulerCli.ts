import { spawn } from "child_process";
import { readFile, unlink, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PID_FILE = join(__dirname, "../config/scheduler.pid");
const SCHEDULER_SCRIPT = join(__dirname, "../dist/scheduler.js");

// PIDファイルを読み取る
async function readPid(): Promise<number | null> {
  try {
    const pid = await readFile(PID_FILE, "utf-8");
    return parseInt(pid.trim(), 10);
  } catch {
    return null;
  }
}

// プロセスが存在するか確認
function isProcessRunning(pid: number): boolean {
  try {
    // シグナル0を送信してプロセスの存在を確認
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// スケジューラを開始
async function start(): Promise<void> {
  const existingPid = await readPid();

  if (existingPid && isProcessRunning(existingPid)) {
    console.log(`Scheduler is already running (PID: ${existingPid})`);
    return;
  }

  // 古いPIDファイルがあれば削除
  if (existingPid) {
    try {
      await unlink(PID_FILE);
    } catch {
      // 無視
    }
  }

  console.log("Starting scheduler...");

  // バックグラウンドでスケジューラを起動
  const child = spawn("node", [SCHEDULER_SCRIPT], {
    detached: true,
    stdio: "ignore",
    cwd: join(__dirname, ".."),
  });

  child.unref();

  console.log(`Scheduler started (PID: ${child.pid})`);
}

// スケジューラを停止
async function stop(): Promise<void> {
  const pid = await readPid();

  if (!pid) {
    console.log("Scheduler is not running (no PID file)");
    return;
  }

  if (!isProcessRunning(pid)) {
    console.log("Scheduler is not running (process not found)");
    try {
      await unlink(PID_FILE);
    } catch {
      // 無視
    }
    return;
  }

  console.log(`Stopping scheduler (PID: ${pid})...`);

  try {
    process.kill(pid, "SIGTERM");
    console.log("Scheduler stopped");
  } catch (error) {
    console.error(`Failed to stop scheduler: ${error}`);
  }
}

// ステータスを表示
async function status(): Promise<void> {
  const pid = await readPid();

  if (!pid) {
    console.log("Status: STOPPED (no PID file)");
    return;
  }

  if (isProcessRunning(pid)) {
    console.log(`Status: RUNNING (PID: ${pid})`);
  } else {
    console.log("Status: STOPPED (process not found)");
    // 古いPIDファイルを削除
    try {
      await unlink(PID_FILE);
    } catch {
      // 無視
    }
  }
}

// 使用方法を表示
function showUsage(): void {
  console.log(`
Usage: node schedulerCli.js <command>

Commands:
  start   Start the scheduler in background
  stop    Stop the running scheduler
  status  Show scheduler status

Example:
  node schedulerCli.js start
  node schedulerCli.js stop
  node schedulerCli.js status
`);
}

// メイン処理
async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case "start":
      await start();
      break;
    case "stop":
      await stop();
      break;
    case "status":
      await status();
      break;
    default:
      showUsage();
      process.exit(command ? 1 : 0);
  }
}

main().catch((error) => {
  console.error("CLI error:", error);
  process.exit(1);
});
