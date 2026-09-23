import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Ensure data and uploads directories exist
  const DATA_DIR = path.join(process.cwd(), "data");
  const DB_JSON_FILE = path.join(DATA_DIR, "database_tkad.json");
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("Could not initialize storage directories:", err);
  }

  // Serve uploads directory statically so they render flawlessly in HTML/Previews
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API: Unauthenticated Media Upload (Base64-based, max 10MB limit)
  app.post("/api/upload", async (req, res) => {
    try {
      const { filename, filetype, base64 } = req.body;
      
      if (!filename || !filetype || !base64) {
        return res.status(400).json({ success: false, message: "Parameter tidak lengkap (filename, filetype, atau base64 tidak ditemukan)." });
      }

      // Convert base64 to Buffer to determine correct file size
      const base64Clean = base64.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(base64Clean, "base64");
      const fileSizeInBytes = buffer.length;
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB limit

      if (fileSizeInBytes > maxSizeInBytes) {
        return res.status(400).json({ success: false, message: `Ukuran berkas (${(fileSizeInBytes / 1024 / 1024).toFixed(2)}MB) melebihi batas maksimum 10MB.` });
      }

      // Create a clean safe filename with a unique timestamp prefix to prevent conflicts
      const timestamp = Date.now();
      const safeFilename = `${timestamp}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const filePath = path.join(UPLOADS_DIR, safeFilename);

      await fs.writeFile(filePath, buffer);

      return res.json({
        success: true,
        message: "Berkas berhasil diunggah ke server tanpa autentikasi.",
        url: `/uploads/${safeFilename}`,
        size: `${(fileSizeInBytes / 1024).toFixed(1)} KB`,
        name: filename,
      });
    } catch (err: any) {
      console.error("Error in unauthenticated /api/upload:", err);
      return res.status(500).json({ success: false, message: `Gagal mengunggah berkas: ${err.message || err}` });
    }
  });

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API: Get JSON Database
  app.get("/api/db/json", async (req, res) => {
    try {
      const data = await fs.readFile(DB_JSON_FILE, "utf-8");
      return res.json(JSON.parse(data));
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return res.json({
          system: "TKAD-Adiwerna Bank Soal Database",
          version: "2.5.0-JSON-SQL",
          metadata: { totalQuestions: 0, initialized: true },
          data: { questions: [], users: [], categories: [], auditLogs: [] },
        });
      }
      return res.status(500).json({ success: false, message: "Gagal membaca database JSON." });
    }
  });

  // API: Save/Persist JSON Database
  app.post("/api/db/json", async (req, res) => {
    try {
      const payload = req.body;
      await fs.writeFile(DB_JSON_FILE, JSON.stringify(payload, null, 2), "utf-8");
      return res.json({
        success: true,
        message: "Basis data JSON berhasil disimpan secara permanen di server.",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Error saving JSON DB:", err);
      return res.status(500).json({ success: false, message: "Gagal menyimpan file database JSON." });
    }
  });

  // API: Proxy Google Apps Script Push (Two-Way Sync to Spreadsheet)
  app.post("/api/gas-sync", async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          message: "Google Apps Script Web App URL tidak diberikan.",
        });
      }

      // Server-side fetch avoids all browser CORS preflight restrictions
      // and follows 302 redirects automatically
      const gasResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload || {}),
        redirect: "follow",
      });

      const responseText = await gasResponse.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Not a JSON response, will fallback to text
      }

      if (!gasResponse.ok && (!responseJson || responseJson.status !== "success")) {
        return res.status(gasResponse.status || 500).json({
          success: false,
          message:
            responseJson?.message ||
            `Google Apps Script merespons dengan status ${gasResponse.status}: ${responseText.slice(0, 150)}`,
        });
      }

      return res.json({
        success: true,
        message:
          responseJson?.message ||
          "Data bank soal berhasil dikirim & disinkronkan langsung ke Google Spreadsheet via GAS.",
        data: responseJson,
      });
    } catch (err: any) {
      console.error("Error in /api/gas-sync:", err);
      return res.status(500).json({
        success: false,
        message: `Gagal meneruskan data ke Google Apps Script: ${err.message || err}`,
      });
    }
  });

  // API: Proxy Google Apps Script Pull (Fetch data from Spreadsheet)
  app.get("/api/gas-pull", async (req, res) => {
    try {
      const webhookUrl = req.query.webhookUrl as string;
      const spreadsheetId = req.query.spreadsheetId as string;

      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          message: "Google Apps Script Web App URL tidak diberikan.",
        });
      }

      const targetUrl = new URL(webhookUrl);
      targetUrl.searchParams.set("action", "GET_DATA");
      if (spreadsheetId) {
        targetUrl.searchParams.set("spreadsheetId", spreadsheetId);
      }

      const gasResponse = await fetch(targetUrl.toString(), {
        method: "GET",
        redirect: "follow",
      });

      const responseText = await gasResponse.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // not JSON
      }

      if (!gasResponse.ok || !responseJson) {
        return res.status(gasResponse.status || 500).json({
          success: false,
          message: `Gagal membaca dari Apps Script: ${responseText.slice(0, 150)}`,
        });
      }

      return res.json(responseJson);
    } catch (err: any) {
      console.error("Error in /api/gas-pull:", err);
      return res.status(500).json({
        success: false,
        message: `Gagal menghubungi Google Apps Script: ${err.message || err}`,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
