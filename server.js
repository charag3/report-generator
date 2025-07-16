// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const fs = require('fs');
const logoPath = path.join(__dirname, 'assets', 'icon.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

const app = express();
app.use(express.json());

// Función para generar HTML desde los datos
function generateHTML(data) {
  const t = data.lang === 'es' ? {
    reportTitle: "Soma Express Audit Report",
    siteEvaluated: "Sitio evaluado",
    date: "Fecha",
    overview: "Resumen general",
    scores: "Calificaciones",
    aspect: "Aspecto",
    score: "Calificación",
    findings: "Hallazgos",
    category: "Categoría",
    issue: "Problema",
    impact: "Impacto",
    recommendation: "Recomendación",
    opportunities: "Oportunidades estratégicas",
    conclusion: "Conclusión"
  } : {
    reportTitle: "Soma Express Audit Report",
    siteEvaluated: "Site evaluated",
    date: "Date",
    overview: "Overview",
    scores: "Scores",
    aspect: "Aspect",
    score: "Score",
    findings: "Findings",
    category: "Category",
    issue: "Issue",
    impact: "Impact",
    recommendation: "Recommendation",
    opportunities: "Strategic Opportunities",
    conclusion: "Conclusion"
  };

  const stars = (n) => "★".repeat(n) + "☆".repeat(10 - n);

  return `
    <!DOCTYPE html>
    <html lang="${data.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.reportTitle}</title>
      <style>
        :root {
          --ink: #0f172a;
          --flow: hsl(148 50% 45%);
          --bg: #fafafa;
          --g100: #f8fafc;
          --g200: #e2e8f0;
          --g500: #64748b;
          --g600: #475569;
        }

        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Space Grotesk', sans-serif;
          color: var(--ink);
          background: #fff;
          max-width: 750px;
          margin: 0 auto;
          padding: 30px 20px 80px 20px;
          line-height: 1.5;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          min-height: 100%;
          position: relative;
          box-sizing: border-box;
        }

        .header {
          margin-bottom: 40px;
          text-align: center;
        }

        .logo {
          display: block;
          width: 28px;
          height: 28px;
          margin: 0 auto 8px;
        }

        h1 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        h2 {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .section {
          margin-bottom: 40px;
        }

        .section:last-of-type {
          margin-bottom: 60px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          border: 1px solid var(--g200);
          font-size: 10px;
          margin-bottom: 20px;
        }

        th {
          background: var(--g100);
          color: var(--ink);
          font-weight: 600;
          text-align: left;
          padding: 6px 8px;
        }

        td {
          padding: 6px 8px;
          border-top: 1px solid var(--g200);
          vertical-align: top;
          color: var(--ink);
        }

        td:first-child {
          font-weight: 600;
          color: var(--ink);
        }

        .opportunities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        .opportunity-card {
          background: #fff;
          border: 1px solid var(--g200);
          border-radius: 4px;
          padding: 8px;
          font-size: 10px;
        }

        .opportunity-card::before {
          content: "💡";
          margin-right: 5px;
        }

        ul {
          padding-left: 16px;
        }

        li {
          margin-bottom: 5px;
        }

        .footer {
          text-align: center;
          font-size: 9px;
          color: var(--g500);
          border-top: 1px solid var(--g200);
          padding: 8px;
          margin-top: auto;
          position: relative;
          background: #fff;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="data:image/png;base64,${logoBase64}" alt="Soma logo" />
        <h1>${t.reportTitle}</h1>
        <p class="subtitle">
          ${t.siteEvaluated}: <strong>${data.site}</strong> • ${t.date}: ${data.date}
        </p>
      </div>

      <div class="section">
        <h2 class="section-title">1. ${t.overview}</h2>
        <p>${data.overview}</p>
      </div>

      <div class="section">
        <h2 class="section-title">2. ${t.scores}</h2>
        <table>
          <thead>
            <tr>
              <th>${t.aspect}</th>
              <th>${t.score}</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.scores).map(([aspect, value]) => `
              <tr>
                <td>${aspect.replace(/_/g, ' ')}</td>
                <td>${value}/10 &nbsp; ${stars(value)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">3. ${t.findings}</h2>
        <table>
          <thead>
            <tr>
              <th>${t.category}</th>
              <th>${t.issue}</th>
              <th>${t.impact}</th>
              <th>${t.recommendation}</th>
            </tr>
          </thead>
          <tbody>
            ${data.findings.map(f => `
              <tr>
                <td>${f.category}</td>
                <td>${f.issue}</td>
                <td>${f.impact}</td>
                <td>${f.recommendation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">4. ${t.opportunities}</h2>
        <div class="opportunities-grid">
          ${data.opportunities.map(o => `
            <div class="opportunity-card">${o}</div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">5. ${t.conclusion}</h2>
        <p>${data.conclusion}</p>
      </div>

      <div class="footer">
        Generated by SomaSpace © 2025
      </div>
    </body>
    </html>
  `;
}

// Endpoint para generar PDF
app.post('/generate-pdf', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Validar que tenga las propiedades necesarias
    const requiredFields = ['site', 'date', 'lang', 'overview', 'scores', 'findings', 'opportunities', 'conclusion'];
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Generar HTML
    const html = generateHTML(data);
    
    // Lanzar Puppeteer
    const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
    
    const page = await browser.newPage();
     await page.setContent(html, {
     waitUntil: 'domcontentloaded',
     timeout: 120000 // 2 minutos
});

    
    // Generar PDF
const contentHeight = await page.evaluate(() => {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );
});

// Ajustar viewport
await page.setViewport({
  width: 794,
  height: contentHeight,
  deviceScaleFactor: 1,
});

// Ajustar tamaño del HTML para evitar saltos de página
await page.evaluate((height) => {
  document.body.style.width = '794px';
  document.body.style.height = `${height}px`;
  document.body.style.overflow = 'hidden';
}, contentHeight);

// Generar PDF
const pdf = await page.pdf({
  printBackground: true,
  width: '794px',
  height: `${contentHeight}px`,
  pageRanges: '1',
  displayHeaderFooter: false,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});
    
    await browser.close();
    
    // Retornar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-report.pdf"');
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint para probar la generación de PDF con datos de ejemplo
app.get('/generate-test-pdf', async (req, res) => {
  try {
    const testData = {
      site: "ejemplo.com",
      date: "2025-01-15",
      lang: "es",
      overview: "Este es un reporte de auditoría completo para evaluar el rendimiento y la optimización del sitio web. Hemos analizado diversos aspectos técnicos y de usabilidad para proporcionar recomendaciones específicas.",
      scores: {
        performance: 6,
        seo: 7,
        accessibility: 5,
        usability: 8,
        security: 9
      },
      findings: [
        {
          category: "Performance",
          issue: "Tiempo de carga lento (4.2s)",
          impact: "Alto",
          recommendation: "Optimizar imágenes y implementar lazy loading"
        },
        {
          category: "SEO",
          issue: "Falta de meta descriptions",
          impact: "Medio",
          recommendation: "Agregar meta descriptions únicas para cada página"
        },
        {
          category: "Accessibility",
          issue: "Contraste bajo en algunos botones",
          impact: "Medio",
          recommendation: "Mejorar el contraste de color según estándares WCAG"
        },
        {
          category: "Usability",
          issue: "Navegación confusa en móviles",
          impact: "Alto",
          recommendation: "Rediseñar la navegación móvil con menú hamburguesa"
        }
      ],
      opportunities: [
        "Implementar Progressive Web App (PWA) para mejor experiencia móvil",
        "Configurar Google Analytics 4 para mejor seguimiento",
        "Optimizar para Core Web Vitals",
        "Implementar schema markup para rich snippets",
        "Configurar SSL y HTTPS en todo el sitio"
      ],
      conclusion: "El sitio web presenta oportunidades significativas de mejora en rendimiento y accesibilidad. Con las implementaciones propuestas, se puede lograr un aumento del 40% en el rendimiento y una mejor experiencia de usuario, lo que resultará en mayor conversión y mejor posicionamiento SEO."
    };

    // Generar HTML
    const html = generateHTML(testData);
    
    // Lanzar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html);
    
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Retornar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test-audit-report.pdf"');
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating test PDF:', error);
    res.status(500).json({ error: 'Failed to generate test PDF' });
  }
});

// Endpoint de ejemplo con datos de prueba
app.get('/test-data', (req, res) => {
  const testData = {
    site: "ejemplo.com",
    date: "2025-01-15",
    lang: "es",
    overview: "Este es un reporte de auditoría completo para evaluar el rendimiento y la optimización del sitio web. Hemos analizado diversos aspectos técnicos y de usabilidad para proporcionar recomendaciones específicas.",
    scores: {
      performance: 6,
      seo: 7,
      accessibility: 5,
      usability: 8,
      security: 9
    },
    findings: [
      {
        category: "Performance",
        issue: "Tiempo de carga lento (4.2s)",
        impact: "Alto",
        recommendation: "Optimizar imágenes y implementar lazy loading"
      },
      {
        category: "SEO",
        issue: "Falta de meta descriptions",
        impact: "Medio",
        recommendation: "Agregar meta descriptions únicas para cada página"
      },
      {
        category: "Accessibility",
        issue: "Contraste bajo en algunos botones",
        impact: "Medio",
        recommendation: "Mejorar el contraste de color según estándares WCAG"
      },
      {
        category: "Usability",
        issue: "Navegación confusa en móviles",
        impact: "Alto",
        recommendation: "Rediseñar la navegación móvil con menú hamburguesa"
      }
    ],
    opportunities: [
      "Implementar Progressive Web App (PWA) para mejor experiencia móvil",
      "Configurar Google Analytics 4 para mejor seguimiento",
      "Optimizar para Core Web Vitals",
      "Implementar schema markup para rich snippets",
      "Configurar SSL y HTTPS en todo el sitio"
    ],
    conclusion: "El sitio web presenta oportunidades significativas de mejora en rendimiento y accesibilidad. Con las implementaciones propuestas, se puede lograr un aumento del 40% en el rendimiento y una mejor experiencia de usuario, lo que resultará en mayor conversión y mejor posicionamiento SEO."
  };
  
  res.json(testData);
});

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'PDF Generator Service is running',
    endpoints: {
      testData: '/test-data',
      generatePdf: '/generate-pdf'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Solo UN app.listen()
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`PDF service running on port ${PORT}`);
  console.log(`Health check: https://your-app.railway.app/health`);
  console.log(`Test data: https://your-app.railway.app/test-data`);
});

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});