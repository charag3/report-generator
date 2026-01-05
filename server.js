const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
// Aumentamos el límite para recibir JSONs grandes
app.use(express.json({ limit: '50mb' }));

// --- CONFIGURACIÓN DE LOGO ---
const logoPath = path.join(__dirname, 'assets', 'icon.png');
let logoBase64 = '';
try {
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch (e) {
  console.warn("Advertencia: No se pudo cargar el logo:", e.message);
}

// ==========================================
//  HELPERS & LÓGICA DE COLORES (GLOBAL)
// ==========================================

function getScoreColor(score) {
  const val = parseInt(score) || 0;
  if (val > 80) return '#10b981'; // Verde Esmeralda (Excelencia)
  if (val >= 50) return '#f59e0b'; // Amarillo/Naranja (Promedio)
  return '#ef4444'; // Rojo (Alerta)
}

function getAuthorityColor(score) {
  const val = parseInt(score) || 0;
  if (val > 80) return { bg: '#dcfce7', text: '#166534', border: '#86efac' }; 
  if (val >= 50) return { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }; 
  return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }; 
}

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

// ==========================================
//  PLANTILLA 1: PDF REPORT (A4 DETALLADO)
// ==========================================
function generatePDFHTML(data) {
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
        :root { --bg: #ffffff; --text: #1e293b; --text-light: #64748b; --dark: #0f172a; --border: #e2e8f0; --red-text: #dc2626; --green-text: #16a34a; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid var(--border); padding-bottom: 30px; }
        .logo { height: 40px; margin-bottom: 20px; object-fit: contain; }
        .report-title { font-size: 24px; font-weight: 700; color: var(--dark); margin: 0; letter-spacing: -0.02em; }
        .report-subtitle { color: var(--text-light); font-size: 13px; margin-top: 8px; font-weight: 500; }
        .score-container { margin: 25px auto 0; width: 100px; height: 100px; }
        .score-circle { width: 100%; height: 100%; border-radius: 50%; background: #fff; color: var(--dark); display: flex; align-items: center; justify-content: center; font-size: 2.5em; font-weight: 800; border: 6px solid ${getScoreColor(score)}; }
        .summary-box { background: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 40px; font-size: 14px; line-height: 1.7; color: #334155; text-align: justify; }
        .summary-label { font-weight: 700; color: var(--dark); text-transform: uppercase; font-size: 0.75rem; display: block; margin-bottom: 10px; letter-spacing: 0.05em; }
        .card { background: #fff; border-radius: 8px; margin-bottom: 30px; display: flex; align-items: flex-start; page-break-inside: avoid; }
        .card-left { margin-right: 25px; min-width: 60px; text-align: center; padding-top: 4px; }
        .big-score { font-size: 1.6em; font-weight: 700; display: block; line-height: 1; margin-bottom: 6px; }
        .status-badge { font-size: 0.6em; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #94a3b8; text-transform: uppercase; }
        .card-content { flex: 1; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9; }
        .card:last-child .card-content { border-bottom: none; }
        .card-title { font-weight: 700; font-size: 1.05em; color: var(--dark); margin-bottom: 8px; }
        .da-badge { display: inline-block; font-size: 0.75em; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-bottom: 10px; border: 1px solid; }
        .finding { font-weight: 600; color: #334155; margin-bottom: 12px; font-size: 0.95em; }
        .detail-list { list-style: none; padding: 0; margin: 0; font-size: 0.9em; }
        .detail-list li { margin-bottom: 8px; padding-left: 18px; position: relative; line-height: 1.5; color: var(--text-light); }
        .detail-list li::before { content: "•"; color: #cbd5e1; position: absolute; left: 0; top: 0px; font-weight: bold; font-size: 1.2em; }
        .detail-list li.negative { color: var(--text); } .detail-list li.negative::before { content: "!"; color: var(--red-text); font-weight: 800; font-size: 1em; top: 0; }
        .detail-list li.positive { color: var(--text); } .detail-list li.positive::before { content: "✓"; color: var(--green-text); font-weight: 800; font-size: 1em; top: 0; }
        .detail-list li.data-point { font-family: 'Inter', sans-serif; font-size: 0.85em; background: #f8fafc; padding: 4px 10px; border-radius: 4px; display: inline-block; color: #475569; border: 1px solid #e2e8f0; } .detail-list li.data-point::before { content: none; }
        .footer { text-align: center; font-size: 10px; color: #cbd5e1; margin-top: 60px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img class="logo" src="data:image/png;base64,${logoBase64}" />` : ''}
        <h1 class="report-title">Ekho Foundations Audit</h1>
        <p class="report-subtitle">${data.site || 'Client Website'} • ${data.date || new Date().toLocaleDateString()}</p>
        <div class="score-container"><div class="score-circle">${score}</div></div>
      </div>
      <div class="summary-box">
        <span class="summary-label">Executive Summary</span>
        ${data.executive_summary || "Processing data..."}
      </div>
      ${orderedKeys.map(key => {
        const clusterData = clusters[key] || { score: 0, finding: "No data available", details: [] };
        const conf = clusterConfig[key] || { title: key, badge: "N/A" };
        const cScore = clusterData.score || 0;
        let extraHeader = '';
        if (key === 'D_trust') {
            const colors = getAuthorityColor(daScore);
            extraHeader = `<div class="da-badge" style="background: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border}">Domain Authority: ${daScore}/100</div>`;
        }
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
        </div>`;
      }).join('')}
      <div class="footer">Generated by Ekho Engine</div>
    </body>
    </html>
  `;
}

// ==========================================
//  PLANTILLA 2: FLASH CARD V2 (GLASSMORPHISM)
// ==========================================
function generateCardHTML(data) {
  const da = parseInt(data.da) || 0;
  
  // Colores dinámicos
  let daColor = '#ef4444'; 
  let glowColor = 'rgba(239, 68, 68, 0.4)';
  if (da >= 30) { daColor = '#fbbf24'; glowColor = 'rgba(251, 191, 36, 0.4)'; }
  if (da >= 50) { daColor = '#10b981'; glowColor = 'rgba(16, 185, 129, 0.4)'; }

  // Fallbacks
  const company = data.company || "CLIENT";
  const traffic = data.traffic || "0";
  const evaluation = data.evaluation || '<div class="analysis-item">Analysis pending...</div>';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        body { margin: 0; padding: 0; width: 1200px; height: 630px; background: radial-gradient(circle at 10% 20%, #1e293b 0%, #0f172a 90%); font-family: 'Plus Jakarta Sans', sans-serif; color: white; display: flex; box-sizing: border-box; position: relative; overflow: hidden; }
        .orb { position: absolute; width: 500px; height: 500px; background: ${glowColor}; filter: blur(120px); opacity: 0.15; top: -100px; right: -100px; z-index: 0; }
        .container { display: flex; width: 100%; height: 100%; padding: 70px; gap: 60px; z-index: 1; }
        
        /* IZQUIERDA */
        .left-col { flex: 0 0 350px; display: flex; flex-direction: column; gap: 20px; justify-content: center; }
        .metric-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 24px; border-radius: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .metric-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 5px; }
        .da-circle { width: 100px; height: 100px; border-radius: 50%; border: 6px solid ${daColor}; display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 800; color: #fff; background: rgba(0,0,0,0.2); box-shadow: 0 0 30px ${glowColor}; margin-top: 10px; }
        .traffic-val { font-size: 38px; font-weight: 800; color: #f8fafc; line-height: 1; margin-top: 5px; }
        
        /* DERECHA */
        .right-col { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .brand-pill { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 6px 14px; border-radius: 50px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; align-self: flex-start; margin-bottom: 20px; border: 1px solid rgba(56, 189, 248, 0.3); }
        h1 { font-size: 48px; font-weight: 800; margin: 0 0 30px 0; line-height: 1.1; background: linear-gradient(to right, #ffffff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .analysis-box {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid ${daColor};
            padding: 30px;
            border-radius: 0 16px 16px 0;
            display: flex; /* Para poder usar gap */
            flex-direction: column;
            gap: 12px; /* Espacio entre los 3 puntos */
        }

        .analysis-item {
            font-size: 18px; /* Un poco más pequeño para que quepa la negrita */
            line-height: 1.5;
            color: #ffffff !important; /* Forzamos blanco siempre */
        }

        /* Estilo para los títulos (Gancho:, Problema:, etc.) */
        .analysis-item strong {
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-right: 6px; /* Espacio entre el título y el texto */
        }
        .footer { margin-top: auto; color: #475569; font-size: 12px; display: flex; align-items: center; gap: 8px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .dot { width: 6px; height: 6px; background: ${daColor}; border-radius: 50%; box-shadow: 0 0 10px ${daColor}; }
      </style>
    </head>
    <body>
      <div class="orb"></div>
      <div class="container">
        <div class="left-col">
            <div class="metric-card">
                <span class="metric-label">Domain Authority</span>
                <div class="da-circle">${da}</div>
            </div>
            <div class="metric-card">
                <span class="metric-label">Est. Organic Traffic</span>
                <div class="traffic-val">${traffic}</div>
                <div style="font-size:12px; color:#64748b; margin-top:5px">visits / month</div>
            </div>
        </div>
        <div class="right-col">
            <div class="brand-pill">${company}</div>
            <h1>Growth Audit<br>Snapshot</h1>
            <div class="analysis-box">${evaluation}</div>
            <div class="footer"><span class="dot"></span> Generated by Ekho Engine AI</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==========================================
//  ENDPOINT 1: GENERATE PDF
// ==========================================
app.post('/generate-pdf', async (req, res) => {
  let browser = null;
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    const html = generatePDFHTML(data);
    
    // Configuración robusta de Puppeteer para Serverless
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight + 60);
    const pdf = await page.pdf({
      printBackground: true,
      width: '794px', 
      height: bodyHeight + 'px', 
      pageRanges: '1',
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Error generando PDF:', error);
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// ==========================================
//  ENDPOINT 2: GENERATE IMAGE (OPTIMIZADO)
// ==========================================
app.post('/generate-image', async (req, res) => {
  let browser = null;
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    console.log(`[IMG] Generating Flash Card for: ${data.company}`);
    const html = generateCardHTML(data); 

    // Lanzamiento optimizado para AHORRO DE RAM
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage', // CRÍTICO: Usa disco tmp en vez de RAM compartida
        '--disable-gpu',
        '--no-zygote',
        '--single-process', // CRÍTICO: Fuerza 1 solo proceso de Chrome
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    
    // Viewport exacto. NO usamos deviceScaleFactor: 2 para ahorrar RAM.
    await page.setViewport({ width: 1200, height: 630 }); 
    
    // 'domcontentloaded' es más rápido y estable que 'networkidle0'
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const image = await page.screenshot({ 
        type: 'png',
        optimizeForSpeed: true 
    });

    await browser.close();
    console.log("[IMG] Success");
    res.setHeader('Content-Type', 'image/png');
    res.send(image);

  } catch (error) {
    console.error('[IMG] Error:', error);
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: 'Failed', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Ekho Engine V2 (PDF + Glass Image) Ready 🟢' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ekho Server running on port ${PORT}`);
});
