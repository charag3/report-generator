// server.js - Soma Engine (English Only / Modern Dark Mode)
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
// Increased limit for large reports
app.use(express.json({ limit: '50mb' }));

// --- HTML GENERATOR ---
function generateHTML(data) {
  
  // Helper for Score Colors
  const getScoreColor = (score) => {
    if (score >= 90) return '#ccff00'; // Soma Lime (Good)
    if (score >= 50) return '#f59e0b'; // Orange (Average)
    return '#ef4444'; // Red (Poor)
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Digital Audit Report</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg: #050505;       /* Deep Black */
          --card: #121212;     /* Dark Grey */
          --border: #262626;   /* Subtle Border */
          --text-main: #ffffff;
          --text-muted: #a3a3a3;
          --accent: #ccff00;   /* Soma Lime */
        }
        
        body { 
          font-family: 'Space Grotesk', sans-serif; 
          background-color: var(--bg); 
          color: var(--text-main); 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px; 
          -webkit-print-color-adjust: exact; 
        }

        /* HEADER */
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end;
          border-bottom: 1px solid var(--border); 
          padding-bottom: 20px; 
          margin-bottom: 40px; 
        }
        .header-left h1 { 
          font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -1px; text-transform: uppercase;
        }
        .header-left p { color: var(--accent); margin: 5px 0 0 0; font-size: 14px; font-weight: 500; }
        
        .meta-tag {
          background: var(--card); border: 1px solid var(--border);
          padding: 8px 16px; border-radius: 4px; font-size: 12px; color: var(--text-muted);
          text-align: right;
        }
        .meta-tag strong { color: var(--text-main); display: block; font-size: 14px; margin-bottom: 2px; }

        /* SECTIONS */
        .section { margin-bottom: 50px; page-break-inside: avoid; }
        .section-header { 
          display: flex; align-items: center; margin-bottom: 20px; 
        }
        .section-title { 
          font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; 
        }
        .line { flex-grow: 1; height: 1px; background: var(--border); margin-left: 15px; }

        /* OVERVIEW BOX */
        .overview-box {
          background: var(--card); border: 1px solid var(--border);
          padding: 20px; border-left: 3px solid var(--accent);
          font-size: 14px; line-height: 1.6; color: #d4d4d4;
        }

        /* SCORES GRID */
        .scores-grid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
        }
        .score-card {
          background: var(--card); border: 1px solid var(--border);
          padding: 15px 10px; text-align: center; border-radius: 4px;
        }
        .score-title { font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px; }
        .score-val { font-size: 24px; font-weight: 700; }
        
        /* FINDINGS LIST */
        .finding-card {
          background: var(--card); border: 1px solid var(--border);
          margin-bottom: 15px; padding: 20px; position: relative;
          border-radius: 4px;
        }
        .finding-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .finding-cat { color: var(--accent); font-size: 11px; font-weight: 700; text-transform: uppercase; }
        
        .finding-badge { 
          font-size: 10px; padding: 2px 8px; border-radius: 2px; font-weight: 700; text-transform: uppercase; color: #000;
        }
        /* Status Colors mapping */
        .badge-High, .badge-Alto, .badge-Critical { background: #ef4444; color: white; }
        .badge-Med, .badge-Medio, .badge-Medium { background: #f59e0b; }
        .badge-Low, .badge-Bajo { background: var(--accent); }

        .finding-issue { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
        .finding-rec { font-size: 13px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 8px; margin-top: 8px; }
        .finding-rec strong { color: white; }

        /* OPPORTUNITIES */
        .opp-item {
          display: flex; align-items: flex-start; margin-bottom: 15px;
          background: rgba(204, 255, 0, 0.05); /* Tinted background */
          border: 1px solid rgba(204, 255, 0, 0.2);
          padding: 15px; border-radius: 4px;
        }
        .opp-icon { color: var(--accent); margin-right: 15px; font-size: 18px; }
        .opp-text { font-size: 13px; color: #e5e5e5; }

        /* FOOTER */
        .footer {
          margin-top: 60px; border-top: 1px solid var(--border); padding-top: 20px;
          display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted);
        }
      </style>
    </head>
    <body>
      
      <div class="header">
        <div class="header-left">
          ${logoBase64 ? `<img style="height:30px; margin-bottom:10px;" src="data:image/png;base64,${logoBase64}" />` : ''}
          <h1>Digital Audit Report</h1>
          <p>Technical & Strategy Analysis</p>
        </div>
        <div class="meta-tag">
          <strong>${data.site || 'Website'}</strong>
          ${data.date || new Date().toLocaleDateString('en-US')}
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">01 / Overview</h2><div class="line"></div>
        </div>
        <div class="overview-box">
          ${data.overview || "Analysis pending..."}
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">02 / Core Vitals</h2><div class="line"></div>
        </div>
        <div class="scores-grid">
           ${data.scores ? Object.entries(data.scores).map(([aspect, value]) => `
              <div class="score-card">
                <div class="score-title">${aspect}</div>
                <div class="score-val" style="color: ${getScoreColor(value)}">${value}</div>
              </div>
           `).join('') : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">03 / Critical Findings</h2><div class="line"></div>
        </div>
        ${data.findings && data.findings.length > 0 ? data.findings.map(f => `
          <div class="finding-card">
            <div class="finding-header">
              <span class="finding-cat">${f.category}</span>
              <span class="finding-badge badge-${f.impact}">${f.impact}</span>
            </div>
            <div class="finding-issue">${f.issue}</div>
            <div class="finding-rec">
              <strong>Fix:</strong> ${f.recommendation}
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted)">No critical issues found.</p>'}
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">04 / Growth Strategy</h2><div class="line"></div>
        </div>
         ${data.opportunities ? data.opportunities.map(o => `
            <div class="opp-item">
              <div class="opp-icon">⚡</div>
              <div class="opp-text">${o}</div>
            </div>
         `).join('') : ''}
      </div>

      <div class="footer">
        <span>GENERATED BY SOMA ENGINE</span>
        <span>SOMASPACE.SITE</span>
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
    
    if (!data) return res.status(400).json({ error: 'No data provided' });

    // 1. Dynamic Filename Logic
    let filename = 'audit-report.pdf';
    if (data.site) {
        // Sanitize URL to create a valid filename
        const cleanName = data.site.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
        filename = `Audit_${cleanName}.pdf`;
    }
    // Override if provided explicitly
    if (data.filename) filename = data.filename;

    const html = generateHTML(data);
    
    // 2. Optimized Puppeteer Launch (Railway Safe)
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Critical for Docker/Railway memory
        '--font-render-hinting=none',
        '--force-color-profile=srgb',
        '--single-process', 
        '--no-zygote'
      ]
    });
    
    page = await browser.newPage();
    
    // Force dark mode preference for rendering
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

    await page.setContent(html, { 
      waitUntil: 'networkidle0', 
      timeout: 60000 
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '30px', right: '30px', bottom: '30px', left: '30px' }
    });
    
    // 3. Explicit Cleanup
    await page.close();
    await browser.close();
    browser = null;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Emergency cleanup
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Soma Engine Operational 🟢' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Soma PDF Service running on port ${PORT}`);
});
