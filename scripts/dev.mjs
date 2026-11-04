// Starts the API (http://localhost:8000) and the web app (http://localhost:3001) together.
// First run sets up backend/.venv, installs frontend packages and migrates the database.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const backend = join(root, "backend");
const frontend = join(root, "frontend");
const isWin = process.platform === "win32";
const venvBin = join(backend, ".venv", isWin ? "Scripts" : "bin");
const bin = (name) => join(venvBin, isWin ? `${name}.exe` : name);

function run(cmd, args, cwd) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const { status } = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
  if (status !== 0) process.exit(status ?? 1);
}

if (!existsSync(bin("uvicorn"))) {
  if (!existsSync(bin("python"))) run(isWin ? "python" : "python3", ["-m", "venv", ".venv"], backend);
  run(bin("python"), ["-m", "pip", "install", "-r", "requirements-dev.txt"], backend);
}
if (!existsSync(join(frontend, "node_modules"))) run("npm", ["install"], frontend);
run(bin("alembic"), ["upgrade", "head"], backend);

const children = [];
function start(label, color, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, shell: isWin });
  const prefix = `\x1b[${color}m[${label}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) out.write(prefix + line + "\n");
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code) => {
    console.log(`${prefix}exited with code ${code}`);
    shutdown(code ?? 0);
  });
  children.push(child);
}

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("api", "36", bin("uvicorn"), ["app.main:app", "--reload", "--port", "8000"], backend);
start("web", "35", "npm", ["run", "dev"], frontend);
