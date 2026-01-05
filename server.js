// --- PLANTILLA FLASH CARD V2 (PREMIUM GLASS) ---
function generateCardHTML(data) {
  const da = parseInt(data.da) || 0;
  
  // Colores dinámicos más vibrantes
  let daColor = '#ef4444'; 
  let glowColor = 'rgba(239, 68, 68, 0.4)';
  if (da >= 30) { daColor = '#fbbf24'; glowColor = 'rgba(251, 191, 36, 0.4)'; }
  if (da >= 50) { daColor = '#10b981'; glowColor = 'rgba(16, 185, 129, 0.4)'; }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          width: 1200px;
          height: 630px;
          /* Fondo Gradiente Premium */
          background: radial-gradient(circle at 10% 20%, #1e293b 0%, #0f172a 90%);
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: white;
          display: flex;
          box-sizing: border-box;
          position: relative;
        }

        /* Elemento decorativo de fondo */
        .orb {
            position: absolute;
            width: 500px;
            height: 500px;
            background: ${glowColor};
            filter: blur(120px);
            opacity: 0.15;
            top: -100px;
            right: -100px;
            z-index: 0;
        }

        .container {
          display: flex;
          width: 100%;
          height: 100%;
          padding: 70px;
          gap: 60px;
          z-index: 1;
        }

        /* --- IZQUIERDA: MÉTRICAS EN TARJETAS --- */
        .left-col {
          flex: 0 0 350px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: center;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .metric-label {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .da-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 6px solid ${daColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 42px;
            font-weight: 800;
            color: #fff;
            background: rgba(0,0,0,0.2);
            box-shadow: 0 0 30px ${glowColor};
            margin-top: 10px;
        }

        .traffic-val {
            font-size: 38px;
            font-weight: 800;
            color: #f8fafc;
            line-height: 1;
            margin-top: 5px;
        }

        /* --- DERECHA: ANÁLISIS --- */
        .right-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .brand-pill {
            display: inline-block;
            background: rgba(56, 189, 248, 0.15);
            color: #38bdf8;
            padding: 6px 14px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            align-self: flex-start;
            margin-bottom: 20px;
            border: 1px solid rgba(56, 189, 248, 0.3);
        }

        h1 {
            font-size: 48px;
            font-weight: 800;
            margin: 0 0 30px 0;
            line-height: 1.1;
            background: linear-gradient(to right, #ffffff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .analysis-box {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid ${daColor};
            padding: 30px;
            border-radius: 0 16px 16px 0;
        }

        .analysis-item {
            font-size: 19px;
            line-height: 1.6;
        }

        .footer {
            margin-top: auto;
            color: #475569;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
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
                <div class="traffic-val">${data.traffic}</div>
                <div style="font-size:12px; color:#64748b; margin-top:5px">visits / month</div>
            </div>
        </div>

        <div class="right-col">
            <div class="brand-pill">${data.company}</div>
            <h1>Growth Audit<br>Snapshot</h1>
            <div class="analysis-box">
                ${data.evaluation}
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
