import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { Resend } from 'resend';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Quran Foundation API Proxy / Helper
  // Generic proxy for Quran.com API v4
  app.get("/api/quran/proxy", async (req, res) => {
    try {
      const { endpoint } = req.query;
      console.log(`Proxying request for endpoint: ${endpoint}`);
      
      if (!endpoint || typeof endpoint !== 'string') {
        return res.status(400).json({ error: "Endpoint parameter is required" });
      }

      // Construct the full URL
      const baseUrl = "https://api.quran.com/api/v4";
      const targetUrl = new URL(`${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
      
      // Add any other query params from the original request
      Object.entries(req.query).forEach(([key, value]) => {
        if (key !== 'endpoint') {
          targetUrl.searchParams.append(key, value as string);
        }
      });

      const response = await fetch(targetUrl.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        const errorBody = await response.text().catch(() => "No error body");
        console.error(`Upstream error (${response.status}): ${errorBody}`);
        return res.status(response.status).json({ 
          error: `Proxy error: ${response.statusText}`,
          details: errorBody 
        });
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ 
        error: "Failed to proxy request",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/quran/verse/:key", async (req, res) => {
    try {
      const { key } = req.params;
      // Fetching from Quran.com API v4
      // Example: https://api.quran.com/api/v4/verses/by_key/2:255?language=en&words=true&translations=131&audio=7
      const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?language=en&words=true&translations=131&audio=7`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching verse:", error);
      res.status(500).json({ error: "Failed to fetch verse" });
    }
  });

  // Quran Foundation Token Exchange
  app.post("/api/qf/token", async (req, res) => {
    try {
      const clientId = process.env.QF_CLIENT_ID;
      const clientSecret = process.env.QF_CLIENT_SECRET;
      const tokenEndpoint = process.env.QF_TOKEN_ENDPOINT;

      if (!clientId || !clientSecret || !tokenEndpoint) {
        return res.status(400).json({ 
          error: "Quran Foundation credentials or token endpoint not configured",
          isDemoMode: true 
        });
      }

      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("QF Token Error:", errorData);
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error exchanging QF token:", error);
      res.status(500).json({ error: "Failed to exchange token" });
    }
  });

  // --- Quran Foundation interactive OAuth endpoints ---
  app.get('/api/qf/oauth/config', (req, res) => {
    res.json({
      clientId: process.env.QF_CLIENT_ID || '',
      authUrl: process.env.QF_OAUTH_AUTH_URL || 'https://prelive-oauth2.quran.foundation/oauth2/auth'
    });
  });

  app.post('/api/qf/oauth/exchange', async (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body;
    const clientId = process.env.QF_CLIENT_ID;
    const clientSecret = process.env.QF_CLIENT_SECRET;
    
    // Default to prelive for testing User APIs unless overridden
    const tokenEndpoint = process.env.QF_OAUTH_TOKEN_URL || "https://prelive-oauth2.quran.foundation/oauth2/token";

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing QF_CLIENT_ID or QF_CLIENT_SECRET server configuration" });
    }

    try {
      // Exchange authorization code for tokens securely on backend
      const exchangeBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: code_verifier
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: exchangeBody
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        console.error("QF OAuth Exchange Error:", errObj);
        return res.status(response.status).json(errObj);
      }

      const tokenData = await response.json();
      res.json(tokenData);
    } catch (error) {
      console.error('Error exchanging oauth code:', error);
      res.status(500).json({ error: "Internal server error during token exchange" });
    }
  });

  // User APIs Serverless Proxy Handler
  app.use('/api/qf/user-proxy', express.json(), async (req, res) => {
    const qfUserApiBase = process.env.QF_USER_API_URL || "https://apis-prelive.quran.foundation/auth/v1";
    const clientId = process.env.QF_CLIENT_ID;
    const authHeader = req.headers.authorization; 
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }
    
    const userAccessToken = authHeader.split('Bearer ')[1];
    const targetUrl = `${qfUserApiBase}${req.url}`;
    
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-auth-token': userAccessToken,
          'x-client-id': clientId || '',
        },
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
      });
      
      const responseText = await response.text();
      let data = responseText;
      try { data = JSON.parse(responseText); } catch (e) {}

      res.status(response.status).send(data);
    } catch (error) {
      console.error('Proxy Error for User API:', error);
      res.status(500).json({ error: "Failed to proxy User API request" });
    }
  });

  // Contact Form Endpoint
  app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        console.log("DEMO MODE: Contact form submission received:", { name, email, message });
        return res.json({ success: true, message: "Message received (Demo Mode - No API Key)" });
      }

      const resend = new Resend(resendKey);
      const { data, error } = await resend.emails.send({
        from: 'Quran Circles <onboarding@resend.dev>',
        to: ['yasarshehzad@gmail.com'],
        subject: `New Contact Form Message from ${name}`,
        html: `
          <h3>New Message from Quran Circles Contact Form</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: "Failed to send email" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Internal server error" });
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
