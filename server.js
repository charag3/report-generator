// server.js - Versión Final "Flash Card Ready" (PDF + PNG)
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// --- CONFIGURACIÓN INICIAL ---
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
app.use(express.json({ limit: '50mb' }));

// --- HELPERS VISUALES (LÓGICA DE COLORES 0-100 ESTRICTA) ---

// 1. Lógica para los Círculos de Puntaje (Cluster Scores)
function getScoreColor(score) {
  const val = parseInt(score) || 0;
  if (val > 80) return '#16a34a'; // Verde (Solo excelencia)
  if (val >= 50) return '#d97706'; // Amarillo (Promedio)
  return '#dc2626'; // Rojo (Alerta)
}

// 2. Lógica para el Domain Authority
function getAuthorityColor(score) {
  const val = parseInt(score) || 0;
  if (val > 80) return { bg: '#dcfce7', text: '#166534', border: '#86efac' }; 
  if (val >= 50) return { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }; 
  return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }; 
}

// Renderiza la lista limpiando emojis
function renderDetails(detailsArray) {
  if (!detailsArray || !Array.isArray(detailsArray) || detailsArray.length === 0) return '';
  
  return `
    <ul class="detail-list">
      ${detailsArray.map(item => {
        let className = '';
        if (item.includes('❌') || item.includes('Critical') || item.includes('Poor') || item.includes('NOT FOUND')) className = 'negative';
        else if (item.includes('✅') || item.includes('Good') || item.includes('DETECTED')) className = 'positive';
        else if (item.includes('Vol:') || item.includes('Rank:')) className = 'data-point';

        let cleanText = item.replace(/✅|❌/g, '').trim();
        cleanText = cleanText.replace(/^([^:]+):/, '<strong>$1:</strong>');

        return `<li class="${className}">${cleanText}</li>`;
      }).join('')}
    </ul>
  `;
}

// --- GENERADOR DE HTML ---
function generateHTML(data) {
  const score = data.readiness_score || 0;
  const clusters = data.clusters || {};
  const daScore = (data.domain_authority !== undefined && data.domain_authority !== null) ? data.domain_authority : 0;
  
  const clusterConfig = {
    "A_technical":  { title: "A. Technical Foundations", badge: "TECH" },
    "B_visibility": { title: "B. Visibility & SEO",      badge: "SEO" },
    "C_conversion": { title: "C. Conversion & UX",       badge: "UX" },
    "D_trust":      { title: "D. Trust & Authority",     badge: "AUTH" },
    "E_content":    { title: "E. Content Strategy",      badge: "MSG" }
  };

  const orderedKeys = ["A_technical", "B_visibility", "C_conversion", "D_trust", "E_content"];

  return `
    <!DOCTYPE html>
    <html lang="${data.lang || 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>Ekho Audit Report</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg: #ffffff;
          --text: #1e293b;
          --text-light: #64748b;
          --dark: #0f172a;
          --border: #e2e8f0;
          --red-text: #dc2626;
          --green-text: #16a34a;
        }
        
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); max-width: 800px; margin: 0 auto; padding: 40px; }
        
        .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid var(--border); padding-bottom: 30px; }
        .logo { height: 40px; margin-bottom: 20px; object-fit: contain; }
        .report-title { font-size: 24px; font-weight: 700; color: var(--dark); margin: 0; letter-spacing: -0.02em; }
        .report-subtitle { color: var(--text-light); font-size: 13px; margin-top: 8px; font-weight: 500; }
        
        /* SCORE CIRCLE */
        .score-container { margin: 25px auto 0; width: 100px; height: 100px; }
        .score-circle { 
          width: 100%; height: 100%; border-radius: 50%; background: #fff; color: var(--dark); 
          display: flex; align-items: center; justify-content: center; 
          font-size: 2.5em; font-weight: 800; 
          border: 6px solid ${getScoreColor(score)}; 
        }

        .summary-box { background: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 40px; font-size: 14px; line-height: 1.7; color: #334155; text-align: justify; }
        .summary-label { font-weight: 700; color: var(--dark); text-transform: uppercase; font-size: 0.75rem; display: block; margin-bottom: 10px; letter-spacing: 0.05em; }

        .card { background: #fff; border-radius: 8px; margin-bottom: 30px; display: flex; align-items: flex-start; page-break-inside: avoid; }
        
        .card-left { margin-right: 25px; min-width: 60px; text-align: center; padding-top: 4px; }
        .big-score { font-size: 1.6em; font-weight: 700; display: block; line-height: 1; margin-bottom: 6px; }
        .status-badge { font-size: 0.6em; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #94a3b8; text-transform: uppercase; }
        
        .card-content { flex: 1; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9; }
        .card:last-child .card-content { border-bottom: none; }
        .card-title { font-weight: 700; font-size: 1.05em; color: var(--dark); margin-bottom: 8px; }

        .da-badge {
            display: inline-block;
            font-size: 0.75em;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 10px;
            border: 1px solid;
        }

        .finding { font-weight: 600; color: #334155; margin-bottom: 12px; font-size: 0.95em; }
        
        .detail-list { list-style: none; padding: 0; margin: 0; font-size: 0.9em; }
        .detail-list li { margin-bottom: 8px; padding-left: 18px; position: relative; line-height: 1.5; color: var(--text-light); }
        .detail-list li::before { content: "•"; color: #cbd5e1; position: absolute; left: 0; top: 0px; font-weight: bold; font-size: 1.2em; }
        .detail-list li.negative { color: var(--text); }
        .detail-list li.negative::before { content: "!"; color: var(--red-text); font-weight: 800; font-size: 1em; top: 0; }
        .detail-list li.positive { color: var(--text); }
        .detail-list li.positive::before { content: "✓"; color: var(--green-text); font-weight: 800; font-size: 1em; top: 0; }
        .detail-list li.data-point { font-family: 'Inter', sans-serif; font-size: 0.85em; background: #f8fafc; padding: 4px 10px; border-radius: 4px; display: inline-block; color: #475569; border: 1px solid #e2e8f0; }
        .detail-list li.data-point::before { content: none; }

        .footer { text-align: center; font-size: 10px; color: #cbd5e1; margin-top: 60px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img class="logo" src="data:image/png;base64,${logoBase64}" />` : ''}
        <h1 class="report-title">Ekho Foundations Audit</h1>
        <p class="report-subtitle">
          ${data.site || 'Client Website'} • ${data.date || new Date().toLocaleDateString()}
        </p>
        <div class="score-container">
            <div class="score-circle">${score}</div>
        </div>
      </div>

      <div class="summary-box">
        <span class="summary-label">Executive Summary</span>
        ${data.executive_summary || "Processing data..."}
      </div>

      ${orderedKeys.map(key => {
        const clusterData = clusters[key] || { score: 0, finding: "No data available", details: [] };
        const conf = clusterConfig[key] || { title: key, badge: "N/A" };
        const cScore = clusterData.score || 0;
        
        // --- BADGE DE AUTORIDAD ---
        let extraHeader = '';
        if (key === 'D_trust') {
            const colors = getAuthorityColor(daScore);
            extraHeader = `
              <div class="da-badge" style="background: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border}">
                Domain Authority: ${daScore}/100
              </div>
            `;
        }
        // --------------------------

        return `
        <div class="card">
          <div class="card-left">
            <span class="big-score" style="color: ${getScoreColor(cScore)}">${cScore}</span>
            <span class="status-badge">${conf.badge}</span>
          </div>
          <div class="card-content">
            <div class="card-title">${conf.title}</div>
            ${extraHeader}
            <div class="finding">${clusterData.finding}</div>
            ${renderDetails(clusterData.details)}
          </div>
        </div>
        `;
      }).join('')}

      <div class="footer">
        Generated by Ekho Engine
      </div>
    </body>
    </html>
  `;
}

// --- ENDPOINT ORIGINAL (PDF) ---
app.post('/generate-pdf', async (req, res) => {
  let browser = null;
  let page = null;
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    const html = generateHTML(data);
    
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote']
    });
    
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight + 60);
    const pdf = await page.pdf({
      printBackground: true,
      width: '794px', 
      height: bodyHeight + 'px', 
      pageRanges: '1',
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await page.close();
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ekho-audit.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('Error generando PDF:', error);
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// --- NUEVO ENDPOINT (IMAGEN / FLASH CARD) ---
app.post('/generate-image', async (req, res) => {
  let browser = null;
  let page = null;
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    const html = generateHTML(data); 

    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote']
    });

    page = await browser.newPage();
    // Tamaño ideal para una tarjeta de LinkedIn (Landscape o cuadrada)
    // Usamos ancho fijo (850) que encaja con el CSS del body (800 + padding)
    await page.setViewport({ width: 850, height: 800, deviceScaleFactor: 2 }); 
    
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    // Tomamos foto del body entero
    const element = await page.$('body');
    const image = await element.screenshot({ type: 'png' });

    await page.close();
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.send(image);

  } catch (error) {
    console.error('Error generando Imagen:', error);
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: 'Failed to generate Image', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Ekho Report Service v5 (PDF+Image) Ready 🟢' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ekho PDF Service running on port ${PORT}`);
});
