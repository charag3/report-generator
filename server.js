const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
// Aumentamos el límite del body por si envías datos pesados
app.use(express.json({ limit: '50mb' }));

// --- 1. PLANTILLA FLASH CARD (DARK MODE / LINKEDIN) ---
function generateCardHTML(data) {
  const da = parseInt(data.da) || 0;
  
  // Lógica de colores semáforo
  let daColor = '#ef4444'; // Rojo (0-29)
  if (da >= 30) daColor = '#eab308'; // Amarillo (30-49)
  if (da >= 50) daColor = '#22c55e'; // Verde (50+)

  // Aseguramos que los textos no vengan nulos
  const company = data.company || "Client";
  const traffic = data.traffic || "0";
  const quality = data.content_quality || "-";
  // Si evaluation viene vacía, ponemos un placeholder
  const evaluation = data.evaluation || '<div class="analysis-item">No analysis data provided.</div>';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          width: 1200px;
          height: 630px;
          background: #0f172a; /* Dark Slate Background */
          font-family: 'Inter', sans-serif;
          color: white;
          display: flex;
          box-sizing: border-box;
          overflow: hidden; /* Evita scrolls accidentales */
        }

        .container {
          display: flex;
          width: 100%;
          height: 100%;
          padding: 60px;
          gap: 50px;
        }

        /* --- COLUMNA IZQUIERDA (MÉTRICAS) --- */
        .left-col {
          flex: 0 0 380px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 25px;
          border-right: 1px solid #334155;
          padding-right: 50px;
        }

        .metric-box {
          background: #1e293b;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #334155;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .metric-label {
          color: #94a3b8;
          text-transform: uppercase;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.2px;
          margin-bottom: 8px;
          display: block;
        }

        .metric-value {
          font-size: 42px;
          font-weight: 800;
          display: block;
          color: #f8fafc;
        }

        /* Círculo del DA */
        .da-circle {
            width: 110px;
            height: 110px;
            border-radius: 50%;
            border: 8px solid ${daColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 46px;
            font-weight: 800;
            margin: 0 auto;
            color: white;
            background: #0f172a;
            box-shadow: 0 0 25px ${daColor}40; /* Glow */
        }

        /* --- COLUMNA DERECHA (CONTENIDO) --- */
        .right-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .company-name {
          font-size: 20px;
          color: #38bdf8; /* Sky Blue */
          font-weight: 700;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .title {
          font-size: 38px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 30px 0;
          background: -webkit-linear-gradient(0deg, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .analysis-box {
          background: #1e293b;
          border-radius: 16px;
          padding: 25px;
          border-left: 6px solid ${daColor}; /* Borde a juego con el DA */
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        /* Estilos para el HTML inyectado desde n8n */
        .analysis-item {
          font-size: 17px;
          line-height: 1.5;
          color: #cbd5e1;
        }
        .analysis-item strong { color: #fff; font-weight: 700; }

        .footer {
            margin-top: auto;
            font-size: 13px;
            color: #475569;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        .dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }

      </style>
    </head>
    <body>
      <div class="container">
        
        <div class="left-col">
            <div class="metric-box" style="border-color: ${daColor}40;">
                <span class="metric-label">Domain Authority</span>
                <div class="da-circle">${da}</div>
            </div>

            <div class="metric-box">
                <span class="metric-label">Organic Traffic</span>
                <span class="metric-value">${traffic}</span>
                <span style="font-size: 12px; color: #64748b;">visits / month (est)</span>
            </div>

            <div class="metric-box">
                <span class="metric-label">Content Check</span>
                <span class="metric-value" style="font-size: 28px; color: #38bdf8;">${quality}</span>
            </div>
        </div>

        <div class="right-col">
            <div class="company-name">${company}</div>
            <h1 class="title">Growth & SEO Audit Snapshot</h1>
            
            <div class="analysis-box">
                ${evaluation} 
            </div>

            <div class="footer">
                <span class="dot"></span> Generated by Ekho Engine AI
            </div>
        </div>

      </div>
    </body>
    </html>
  `;
}

// --- 2. ENDPOINT BLINDADO (GENERATE IMAGE) ---
app.post('/generate-image', async (req, res) => {
  let browser = null;
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    console.log(`[START] Generando imagen para: ${data.company || 'Unknown'}`);

    // 1. Generamos HTML
    const html = generateCardHTML(data);

    // 2. Lanzamos Puppeteer con configuración de BAJO CONSUMO (Low Memory)
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // CRÍTICO: Usa /tmp en lugar de /dev/shm
        '--disable-gpu',           // CRÍTICO: No hay GPU en servidores cloud
        '--no-zygote',             // Ahorra procesos extra
        '--single-process',        // CRÍTICO: Fuerza todo en un proceso
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();

    // 3. Viewport exacto.
    // IMPORTANTE: NO usamos deviceScaleFactor: 2 para ahorrar RAM. 
    // La imagen se verá bien en 1200x630 a 1x.
    await page.setViewport({ width: 1200, height: 630 });

    // 4. Cargar HTML
    // 'domcontentloaded' es más rápido y menos propenso a colgarse que 'networkidle0'
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 5. Screenshot optimizado
    const image = await page.screenshot({ 
        type: 'png',
        optimizeForSpeed: true 
    });

    console.log(`[SUCCESS] Imagen generada.`);
    res.setHeader('Content-Type', 'image/png');
    res.send(image);

  } catch (error) {
    console.error('[ERROR] Fallo al generar imagen:', error);
    res.status(500).json({ error: 'Crash generating image', details: error.message });
  } finally {
    // 6. Limpieza agresiva
    if (browser) {
        try { await browser.close(); } catch (e) { console.error("Error cerrando browser:", e); }
    }
  }
});

// --- 3. HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.json({ status: 'Ekho Image Server (Optimized) Ready 🟢' });
});

// --- 4. START SERVER ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ekho Server running on port ${PORT}`);
});
