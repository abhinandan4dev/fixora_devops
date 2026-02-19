import express from "express";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Install Python dependencies
  console.log("Installing Python dependencies...");
  const installProcess = spawn("python3", ["-m", "pip", "install", "-r", "backend/requirements.txt"], {
    stdio: "inherit",
    shell: true,
  });

  await new Promise((resolve, reject) => {
    installProcess.on("close", (code) => {
      if (code === 0) {
        resolve(null);
      } else {
        console.error("Failed to install Python dependencies");
        // We continue anyway, maybe they are already installed or pip is not in path
        resolve(null);
      }
    });
  });

  // Start Python Backend
  console.log("Starting Python Backend...");
  const pythonProcess = spawn("python3", ["backend/main.py"], {
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
  
  // Cleanup
  process.on('SIGINT', () => {
      pythonProcess.kill();
      process.exit();
  });
}

startServer();
