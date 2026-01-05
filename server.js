// server.js - Soma Engine (Growth Audit Edition)
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Safe Logo Loading
const logoPath = path.join(__dirname, 'assets', 'icon.png');
let logoBase64 = '';
try {
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch (e) {
  console.warn("Warning: Logo not found:", e.message);
}

const app = express();
app.use(express.json({ limit: '50mb' }));

// --- HTML GENERATOR ---
function generateHTML(data) {
  
  // 1. Lógica de Colores para Scores (0-100)
  const getScoreColor = (score) => {
    if (score >= 80) return '#ccff00'; // Soma Lime (Excelente)
    if (score >= 50) return '#f59e0b'; // Naranja (Medio)
    return '#ef4444'; // Rojo (Crítico)
  };

  // 2. Adaptador de Datos (Compatibilidad Soma antiguo vs Nuevo)
  const summary = data.executive_summary || data.overview || "Analysis pending...";
  const issues = data.top_issues || data.findings || [];
  const plan = data.growth_plan || data.opportunities || [];
  
  // Mapeo de severidad a colores CSS
  const getSeverityBadge = (sev) => {
    const s = (sev || 'Low').toLowerCase();
    if (s.includes('high') || s.includes('crit')) return 'badge-High';
    if (s.includes('med')) return 'badge-Med';
    return 'badge-Low';
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Digital Presence Audit</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet">
      <style>
        :root {
          /* CAMBIO: Gris oscuro suave en lugar de negro profundo */
          --bg: #18181b; 
          /* CAMBIO: Tarjetas un poco más claras para contraste sutil */
          --card: #27272a; 
          --border: #3f3f46;
          --text-main: #f4f4f5;
          --text-muted: #a1a1aa;
          --accent: #ccff00;
        }
        
        body { 
          font-family: 'Space Grotesk', sans-serif; 
          background-color: var(--bg); 
          color: var(--text-main); 
          width: 800px; 
          margin: 0 auto; 
          padding: 40px;
          box-sizing: border-box;
        }

        /* HEADER */
        .header { 
          display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 40px; 
        }
        .header-left h1 { font-size: 32px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: -1px; }
        .header-left p { color: var(--accent); margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;}
        
        .meta-tag {
          background: var(--card); border: 1px solid var(--border);
          padding: 8px 16px; border-radius: 4px; font-size: 12px; color: var(--text-muted); text-align: right;
        }
        .meta-tag strong { color: var(--text-main); display: block; font-size: 14px; }

        /* SECTION STYLES */
        .section { margin-bottom: 40px; }
        .section-header { display: flex; align-items: center; margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
        .line { flex-grow: 1; height: 1px; background: var(--border); margin-left: 15px; }

        /* 1. EXECUTIVE SUMMARY (Highlight Box) */
        .summary-box {
          background: rgba(204, 255, 0, 0.03); 
          border: 1px solid var(--border);
          border-left: 4px solid var(--accent);
          padding: 25px; 
          font-size: 15px; 
          line-height: 1.6; 
          color: #e4e4e7;
          border-radius: 0 4px 4px 0;
        }

        /* 2. SCORES (3 Pillars) */
        .scores-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .score-card {
          background: var(--card); border: 1px solid var(--border);
          padding: 20px; text-align: center; border-radius: 4px;
        }
        .score-title { font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; letter-spacing: 1px; }
        .score-val { font-size: 36px; font-weight: 700; line-height: 1; }

        /* 3. ISSUES (Findings) */
        .finding-card {
          background: var(--card); border: 1px solid var(--border);
          margin-bottom: 15px; padding: 20px; border-radius: 4px;
          display: flex; flex-direction: column;
        }
        .finding-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .finding-title { font-size: 15px; font-weight: 700; color: var(--text-main); }
        
        .finding-badge { font-size: 9px; padding: 3px 8px; border-radius: 2px; font-weight: 700; text-transform: uppercase; color: black; }
        .badge-High { background: #ef4444; color: white; }
        .badge-Med { background: #f59e0b; }
        .badge-Low { background: var(--text-muted); color: black; }

        .finding-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; }

        /* 4. GROWTH PLAN (Checklist style) */
        .plan-step {
          display: flex; align-items: flex-start; margin-bottom: 12px;
          background: var(--card); border: 1px solid var(--border);
          padding: 15px; border-radius: 4px;
        }
        .step-num { 
          color: var(--accent); font-weight: 700; font-size: 14px; margin-right: 15px; 
          min-width: 20px;
        }
        .step-text { font-size: 13px; color: #e4e4e7; line-height: 1.4; }

        .footer {
          margin-top: 60px; border-top: 1px solid var(--border); padding-top: 20px;
          display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          ${logoBase64 ? `<img style="height:30px; margin-bottom:10px;" src="data:image/png;base64,${logoBase64}" />` : ''}
          <h1>Digital Presence Audit</h1>
          <p>Strategy vs. Reality Report</p>
        </div>
        <div class="meta-tag">
          <strong>${data.site || 'Website Analysis'}</strong>
          ${data.date || new Date().toLocaleDateString('en-US')}
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h2 class="section-title">01 / Strategic Gap Analysis</h2><div class="line"></div></div>
        <div class="summary-box">
          ${summary}
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h2 class="section-title">02 / Performance Matrix</h2><div class="line"></div></div>
        <div class="scores-grid">
           ${data.scores ? Object.entries(data.scores).map(([key, val]) => `
              <div class="score-card">
                <div class="score-title">${key.replace('_', ' ')}</div>
                <div class="score-val" style="color: ${getScoreColor(val)}">${val}</div>
              </div>
           `).join('') : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h2 class="section-title">03 / Critical Blockers</h2><div class="line"></div></div>
        ${issues.length > 0 ? issues.map(item => `
          <div class="finding-card">
            <div class="finding-top">
              <span class="finding-title">${item.title || item.issue || 'Issue Detected'}</span>
              <span class="finding-badge ${getSeverityBadge(item.severity || item.impact)}">${item.severity || item.impact || 'MED'}</span>
            </div>
            <div class="finding-desc">${item.description || item.recommendation || ''}</div>
          </div>
        `).join('') : '<p style="color:var(--text-muted)">No critical issues flagged.</p>'}
      </div>

      <div class="section">
        <div class="section-header"><h2 class="section-title">04 / Growth Roadmap</h2><div class="line"></div></div>
         ${plan.length > 0 ? plan.map((step, index) => `
            <div class="plan-step">
              <div class="step-num">0${index + 1}</div>
              <div class="step-text">${step}</div>
            </div>
         `).join('') : ''}
      </div>

      <div class="footer">
        <span>Generated by SomaSpace Engine</span>
        <span>Confidential</span>
      </div>
    </body>
    </html>
  `;
}

// --- ENDPOINTS ---
app.post('/generate-pdf', async (req, res) => {
  let browser = null;
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    // Filename Logic
    let filename = 'audit-report.pdf';
    if (data.site) {
        const cleanName = data.site.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
        filename = `Audit_${cleanName}.pdf`;
    }

    const html = generateHTML(data);
    
    // Launch Options (Optimized for Railway/Linux)
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
        '--font-render-hinting=none', '--force-color-profile=srgb',
        '--single-process', '--no-zygote'
      ]
    });
    
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await page.setViewport({ width: 880, height: 600 }); 

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    // Calculamos la altura dinámica para que sea una "Single Long Page"
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight + 40);

    const pdf = await page.pdf({
      width: '880px',    
      height: bodyHeight + 'px', 
      printBackground: true,
      pageRanges: '1',   
      margin: { top: 0, right: 0, bottom: 0, left: 0 } 
    });
    
    await browser.close();
    browser = null;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'Soma Growth Engine OK' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Soma PDF Service running on port ${PORT}`));
