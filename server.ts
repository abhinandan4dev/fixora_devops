import express from "express";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  // Install Python dependencies
  const pipDoneFile = "backend/.pip_done";
  const fs = await import("fs");

  if (!fs.existsSync(pipDoneFile)) {
    console.log("Installing Python dependencies (First time setup)...");
    const installProcess = spawn(pythonCmd, ["-m", "pip", "install", "-r", "backend/requirements.txt"], {
      stdio: "inherit",
      shell: true,
    });

    await new Promise((resolve) => {
      installProcess.on("close", (code) => {
        if (code === 0) {
          fs.writeFileSync(pipDoneFile, "");
          resolve(null);
        } else {
          console.error("Failed to install Python dependencies. Ensure Python is in your PATH.");
          resolve(null);
        }
      });
    });
  } else {
    console.log("Python dependencies already installed. Skipping...");
  }

  // Start Python Backend
  console.log(`Starting Python Backend using ${pythonCmd}...`);
  const pythonProcess = spawn(pythonCmd, ["backend/main.py"], {
    stdio: "inherit",
    shell: true,
  });

  pythonProcess.on("error", (err) => {
    console.error("Failed to start Python backend:", err);
  });

  // Proxy /api requests to FastAPI
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
      pathRewrite: {
        // "^/api": "", // Keep /api prefix if FastAPI expects it, or remove if it doesn't.
        // My FastAPI code has @app.post("/api/run-agent"), so I should NOT remove /api
      },
    })
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Robust Cleanup Function
  const cleanup = () => {
    console.log('Cleaning up processes...');

    // On Windows, child.kill() only kills the shell, not the process.
    // We must use taskkill to kill the tree (/T) forcefully (/F).
    if (process.platform === 'win32') {
      if (pythonProcess.pid) {
        spawn("taskkill", ["/pid", pythonProcess.pid.toString(), "/f", "/t"]);
      }
    } else {
      pythonProcess.kill();
    }
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

startServer();
