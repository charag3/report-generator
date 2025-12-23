// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Carga del Logo de forma segura
const logoPath = path.join(__dirname, 'assets', 'icon.png');
let logoBase64 = '';
try {
  // Si no existe la imagen, no rompe el servidor, solo deja el logo vacío
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch (e) {
  console.warn("Advertencia: No se pudo cargar el logo:", e.message);
}

const app = express();

// MEJORA 1: Aumentamos el límite a 50MB para evitar errores si el reporte es largo
app.use(express.json({ limit: '50mb' }));

// Función para generar HTML (Mantenemos el diseño ORIGINAL de Tablas SOMA)
function generateHTML(data) {
  // Textos según idioma
  const t = data.lang === 'es' ? {
    reportTitle: "Soma Express Audit Report",
    siteEvaluated: "Sitio evaluado",
    date: "Fecha",
    overview: "Resumen general",
    scores: "Calificaciones",
    aspect: "Aspecto",
    score: "Calificación",
    findings: "Hallazgos Prioritarios",
    category: "Categoría",
    issue: "Problema detectado",
    impact: "Impacto",
    recommendation: "Recomendación Técnica",
    opportunities: "Oportunidades de Crecimiento",
    conclusion: "Conclusión"
  } : {
    reportTitle: "Soma Express Audit Report",
    siteEvaluated: "Site evaluated",
    date: "Date",
    overview: "Overview",
    scores: "Scores",
    aspect: "Aspect",
    score: "Score",
    findings: "Priority Findings",
    category: "Category",
    issue: "Issue",
    impact: "Impact",
    recommendation: "Recommendation",
    opportunities: "Strategic Opportunities",
    conclusion: "Conclusion"
  };

  const stars = (n) => "★".repeat(n) + "☆".repeat(10 - n);

  // MEJORA 2: Importamos la fuente real para que se vea bien siempre
  return `
    <!DOCTYPE html>
    <html lang="${data.lang || 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${t.reportTitle}</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --ink: #0f172a;
          --accent: #2563eb; /* Azul Soma más corporativo */
          --bg: #ffffff;
          --g100: #f1f5f9;
          --g200: #e2e8f0;
          --g500: #64748b;
          --text: #334155;
        }

        html, body { margin: 0; padding: 0; }

        body {
          font-family: 'Space Grotesk', sans-serif;
          color: var(--text);
          background: var(--bg);
          max-width: 800px; /* Un poco más ancho para que quepan las tablas */
          margin: 0 auto;
          padding: 40px;
          line-height: 1.6;
          font-size: 12px; /* Letra un poco más legible */
        }

        /* HEADER */
        .header { margin-bottom: 40px; text-align: center; border-bottom: 2px solid var(--g100); padding-bottom: 20px; }
        .logo { display: block; width: 40px; height: 40px; margin: 0 auto 10px; object-fit: contain; }
        h1 { font-size: 22px; font-weight: 700; color: var(--ink); margin: 0 0 5px 0; letter-spacing: -0.5px; }
        .subtitle { font-size: 12px; color: var(--g500); margin: 0; }
        .subtitle strong { color: var(--accent); }

        /* SECCIONES */
        .section { margin-bottom: 35px; page-break-inside: avoid; }
        h2.section-title {
          font-size: 14px; font-weight: 700; color: var(--ink);
          margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em;
          border-left: 4px solid var(--accent); padding-left: 10px;
        }

        p { margin: 0 0 10px 0; text-align: justify; }

        /* TABLAS (Diseño Soma Original Mejorado) */
        table {
          width: 100%; border-collapse: collapse;
          background: #fff; border: 1px solid var(--g200);
          font-size: 11px; margin-bottom: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }
        th {
          background: var(--g100); color: var(--ink);
          font-weight: 700; text-align: left; padding: 10px 12px;
          border-bottom: 2px solid var(--g200);
        }
        td {
          padding: 10px 12px; border-bottom: 1px solid var(--g200);
          vertical-align: top; color: var(--text);
        }
        tr:last-child td { border-bottom: none; }
        
        /* Scores Styles */
        .score-val { font-weight: 700; color: var(--ink); font-size: 1.1em; }
        .stars { color: #f59e0b; margin-left: 5px; letter-spacing: 1px; }

        /* Findings Styles */
        .impact-badge {
          display: inline-block; padding: 2px 6px; border-radius: 4px;
          font-size: 10px; font-weight: 700; text-transform: uppercase;
        }
        .impact-High, .impact-Alto { background: #fee2e2; color: #991b1b; }
        .impact-Med, .impact-Medio { background: #fef3c7; color: #92400e; }
        .impact-Low, .impact-Bajo { background: #dcfce7; color: #166534; }

        /* Oportunidades */
        .opportunities-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .opportunity-card {
          background: #f8fafc; border: 1px solid var(--g200);
          border-radius: 6px; padding: 12px; font-size: 11px;
          display: flex; align-items: flex-start;
        }
        .bulb { margin-right: 8px; font-size: 14px; }

        /* FOOTER */
        .footer {
          text-align: center; font-size: 10px; color: var(--g500);
          border-top: 1px solid var(--g200); padding-top: 15px; margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img class="logo" src="data:image/png;base64,${logoBase64}" alt="Logo" />` : ''}
        <h1>${t.reportTitle}</h1>
        <p class="subtitle">
          ${t.siteEvaluated}: <strong>${data.site || 'N/A'}</strong> &nbsp;|&nbsp; ${t.date}: ${data.date || new Date().toLocaleDateString()}
        </p>
      </div>

      <div class="section">
        <h2 class="section-title">1. ${t.overview}</h2>
        <p>${data.overview || "Análisis pendiente."}</p>
      </div>

      <div class="section">
        <h2 class="section-title">2. ${t.scores}</h2>
        <table>
          <thead>
            <tr>
              <th width="40%">${t.aspect}</th>
              <th>${t.score}</th>
            </tr>
          </thead>
          <tbody>
            ${data.scores ? Object.entries(data.scores).map(([aspect, value]) => `
              <tr>
                <td style="text-transform: capitalize"><strong>${aspect}</strong></td>
                <td>
                  <span class="score-val">${value}/10</span>
                  <span class="stars">${stars(value)}</span>
                </td>
              </tr>
            `).join('') : '<tr><td>No scores available</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">3. ${t.findings}</h2>
        <table>
          <thead>
            <tr>
              <th width="20%">${t.category}</th>
              <th width="30%">${t.issue}</th>
              <th width="15%">${t.impact}</th>
              <th width="35%">${t.recommendation}</th>
            </tr>
          </thead>
          <tbody>
            ${data.findings && data.findings.length > 0 ? data.findings.map(f => `
              <tr>
                <td><strong>${f.category}</strong></td>
                <td>${f.issue}</td>
                <td><span class="impact-badge impact-${f.impact}">${f.impact}</span></td>
                <td>${f.recommendation}</td>
              </tr>
            `).join('') : '<tr><td colspan="4">No critical findings detected.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">4. ${t.opportunities}</h2>
        <div class="opportunities-grid">
          ${data.opportunities ? data.opportunities.map(o => `
            <div class="opportunity-card">
              <span class="bulb">💡</span>
              <span>${o}</span>
            </div>
          `).join('') : 'No opportunities listed.'}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">5. ${t.conclusion}</h2>
        <p>${data.conclusion || ""}</p>
      </div>

      <div class="footer">
        Generated by SomaSpace © ${new Date().getFullYear()}
      </div>
    </body>
    </html>
  `;
}

// Endpoint Generar PDF
app.post('/generate-pdf', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    console.log(`Generando reporte Soma Express para: ${data.site}`);

    const html = generateHTML(data);
    
    // MEJORA 3: Configuración Puppeteer más robusta para Railway/Docker
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Clave para evitar crash de memoria en contenedores
        '--font-render-hinting=none' // Mejora renderizado de fuentes
      ]
    });
    
    const page = await browser.newPage();
    
    // Esperamos a que la red esté tranquila (carga de fuentes Google)
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
      displayHeaderFooter: false
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-report.pdf"');
    res.send(pdf);
    
  } catch (error) {
    console.error('Error FATAL generando PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// Endpoint de prueba (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Soma Express PDF Generator' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Soma PDF Service running on port ${PORT}`);
});
