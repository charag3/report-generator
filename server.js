// server.js - Versión Ekho Engine (Optimized)
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// --- CONFIGURACIÓN INICIAL ---

// Carga del Logo de forma segura
const logoPath = path.join(__dirname, 'assets', 'icon.png');
let logoBase64 = '';
try {
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch (e) {
  console.warn("Advertencia: No se pudo cargar el logo:", e.message);
}

const app = express();
// Aumentamos el límite a 50MB para soportar JSONs grandes con mucho texto
app.use(express.json({ limit: '50mb' }));

// --- HELPERS VISUALES ---

// Determina el color del borde según el puntaje
function getColor(score) {
  if (score >= 90) return '#10b981'; // Verde (Good)
  if (score >= 50) return '#f59e0b'; // Ambar (Fair)
  return '#ef4444'; // Rojo (Poor)
}

// Renderiza la lista de detalles (bullets)
function renderDetails(detailsArray) {
  if (!detailsArray || !Array.isArray(detailsArray) || detailsArray.length === 0) return '';
  return `
    <ul class="detail-list">
      ${detailsArray.map(item => `<li>${item}</li>`).join('')}
    </ul>
  `;
}

// --- GENERADOR DE HTML ---
function generateHTML(data) {
  // Datos principales
  const score = data.readiness_score || 0;
  const clusters = data.clusters || {};
  
  // Configuración de textos y badges para los 5 Clusters
  const clusterConfig = {
    "A_technical":  { title: "A. Technical Foundations", badge: "TECH" },
    "B_visibility": { title: "B. Visibility Foundations", badge: "SEO" },
    "C_conversion": { title: "C. Conversion Foundations", badge: "UX" },
    "D_trust":      { title: "D. Trust Foundations",      badge: "AUTH" },
    "E_content":    { title: "E. Content Foundations",    badge: "CONTENT" }
  };

  // Orden explícito de las tarjetas
  const orderedKeys = ["A_technical", "B_visibility", "C_conversion", "D_trust", "E_content"];

  return `
    <!DOCTYPE html>
    <html lang="${data.lang || 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>Ekho Foundations Audit</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg: #f8fafc;
          --card-bg: #ffffff;
          --text: #334155;
          --dark: #0f172a;
          --border: #e2e8f0;
        }
        
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #fff; 
          color: var(--text); 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px; 
        }
        
        /* HEADER */
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid var(--border); padding-bottom: 30px; }
        .logo { height: 40px; margin-bottom: 15px; object-fit: contain; }
        .report-title { font-size: 26px; font-weight: 800; color: var(--dark); margin: 0; letter-spacing: -0.5px; }
        .report-subtitle { color: #64748b; font-size: 14px; margin-top: 8px; font-weight: 500; }
        
        /* SCORE CIRCLE */
        .score-circle { 
          width: 110px; height: 110px; 
          border-radius: 50%; 
          background: var(--dark); 
          color: white; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 2.8em; font-weight: 800; 
          margin: 25px auto 0; 
          border: 6px solid ${getColor(score)}; 
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }

        /* EXECUTIVE SUMMARY */
        .summary-box { 
          background: #f1f5f9; 
          padding: 25px; 
          border-radius: 12px; 
          margin-bottom: 40px; 
          border-left: 5px solid #3b82f6; 
          font-size: 14px; 
          line-height: 1.6;
          page-break-inside: avoid;
        }
        .summary-label { 
          font-weight: 800; color: var(--dark); text-transform: uppercase; font-size: 0.75rem; display: block; margin-bottom: 8px; letter-spacing: 0.05em;
        }

        /* CARDS (CLUSTERS) */
        .card { 
          background: var(--card-bg); 
          border-radius: 12px; 
          padding: 24px; 
          margin-bottom: 24px; 
          border: 1px solid var(--border); 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
          display: flex; 
          align-items: flex-start; 
          page-break-inside: avoid;
        }
        
        .card-left { text-align: center; margin-right: 25px; min-width: 70px; padding-top: 5px; }
        .big-score { font-size: 2em; font-weight: 800; display: block; line-height: 1; margin-bottom: 6px; }
        .status-badge { 
          font-size: 0.65em; font-weight: 700; 
          padding: 4px 8px; border-radius: 20px; 
          background: #f1f5f9; color: #64748b; 
          letter-spacing: 0.05em; display: inline-block;
        }
        
        .card-content { flex: 1; }
        .card-title { font-weight: 800; font-size: 1.1em; margin-bottom: 8px; color: var(--dark); }
        .finding { font-weight: 500; color: var(--text); margin-bottom: 12px; font-size: 1em; line-height: 1.5; }
        
        /* BULLET POINTS */
        .detail-list { margin: 0; padding-left: 18px; color: #64748b; font-size: 0.9em; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        .detail-list li { margin-bottom: 4px; }

        /* FOOTER */
        .footer {
          text-align: center; font-size: 10px; color: #94a3b8; 
          margin-top: 50px; border-top: 1px solid var(--border); padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img class="logo" src="data:image/png;base64,${logoBase64}" />` : ''}
        <h1 class="report-title">Ekho Foundations Audit</h1>
        <p class="report-subtitle">
          Assessment for: <strong>${data.site || 'Website'}</strong> • ${data.date || new Date().toLocaleDateString()}
        </p>
        <div class="score-circle">${score}</div>
      </div>

      <div class="summary-box">
        <span class="summary-label">Executive Summary</span>
        ${data.executive_summary || "Processing data..."}
      </div>

      ${orderedKeys.map(key => {
        const clusterData = clusters[key] || { score: 0, finding: "No data available", details: [] };
        const conf = clusterConfig[key] || { title: key, badge: "N/A" };
        const cScore = clusterData.score || 0;
        
        return `
        <div class="card">
          <div class="card-left">
            <span class="big-score" style="color: ${getColor(cScore)}">${cScore}</span>
            <span class="status-badge">${conf.badge}</span>
          </div>
          <div class="card-content">
            <div class="card-title">${conf.title}</div>
            <div class="finding">${clusterData.finding}</div>
            ${renderDetails(clusterData.details)}
          </div>
        </div>
        `;
      }).join('')}

      <div class="footer">
        Generated by Ekho Engine © ${new Date().getFullYear()}
      </div>
    </body>
    </html>
  `;
}

// --- ENDPOINTS ---

app.post('/generate-pdf', async (req, res) => {
  let browser = null;
  let page = null;

  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const html = generateHTML(data);
    
    // --- OPTIMIZACIÓN DE MEMORIA PARA RAILWAY ---
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Clave: Evita que Chrome crashee en Docker por falta de memoria compartida
        '--disable-gpu', // Ahorra recursos
        '--single-process', 
        '--no-zygote' // Evita procesos zombies
      ]
    });
    
    page = await browser.newPage();
    
    // Timeout de seguridad: 60s máximo para renderizar
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });

    // Calcular altura dinámica
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight + 100);

    const pdf = await page.pdf({
      printBackground: true,
      width: '794px', // Ancho A4
      height: bodyHeight + 'px', // Altura continua
      pageRanges: '1',
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    // --- CIERRE EXPLÍCITO ---
    await page.close();
    await browser.close();
    browser = null; // Marcamos como cerrado
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ekho-audit.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    // Limpieza de emergencia en caso de error
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// Endpoint de prueba visual
app.get('/test-ekho', (req, res) => {
    const dummyData = {
        site: "demo.ekhoengine.com",
        date: "2025-12-24",
        readiness_score: 65,
        executive_summary: "The site has strong conversion elements but lacks authority and speed.",
        clusters: {
            "A_technical": { score: 45, finding: "Site is slow (LCP 4.2s).", details: ["High server response time", "Images unoptimized"] },
            "B_visibility": { score: 60, finding: "Ranking for 20 keywords.", details: ["Meta tags present", "Low volume keywords"] },
            "C_conversion": { score: 90, finding: "Excellent CTAs found.", details: ["'Get Started' button visible", "Phone number in header"] },
            "D_trust": { score: 30, finding: "Domain Authority is weak.", details: ["DA 0/100", "No backlinks"] },
            "E_content": { score: 85, finding: "Good content depth.", details: ["3000+ characters"] }
        }
    };
    res.send(generateHTML(dummyData));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Ekho Service Operational 🟢' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ekho PDF Service running on port ${PORT}`);
});