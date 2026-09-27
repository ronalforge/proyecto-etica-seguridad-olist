import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const informeDir = path.resolve(__dirname, '../informe');

const combinedHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0b0f19;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #f8fafc;
    width: 1200px;
  }
  .card-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .card {
    background: #111522;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  .card-header {
    background: #181d2e;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .badge-admin {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.3);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge-reader {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
    border: 1px solid rgba(248, 113, 113, 0.3);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
  }
  .card-content {
    padding: 16px 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th {
    text-align: left;
    padding: 10px 12px;
    color: #94a3b8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-weight: 600;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #cbd5e1;
  }
  .action-tag {
    background: #1e293b;
    border: 1px solid #334155;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 12px;
    color: #38bdf8;
  }
  .forbidden-box {
    background: rgba(239, 68, 68, 0.05);
    border: 1px dashed rgba(239, 68, 68, 0.25);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .forbidden-code {
    font-size: 32px;
    font-weight: 800;
    color: #ef4444;
    padding-right: 16px;
    border-right: 1px solid rgba(239, 68, 68, 0.2);
  }
  .forbidden-desc h4 {
    color: #f87171;
    font-size: 15px;
    margin-bottom: 4px;
  }
  .forbidden-desc p {
    color: #94a3b8;
    font-size: 13px;
  }
</style>
</head>
<body>
<div class="card-container">
  <!-- Tarjeta 1: Admin Audit View -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">Panel (a): Acceso autorizado a /audit — Rol Administrador (usuario: marco)</div>
      <span class="badge-admin">ROLE: ADMIN · HTTP 200 OK</span>
    </div>
    <div class="card-content">
      <table>
        <thead>
          <tr>
            <th>Fecha UTC</th>
            <th>Usuario</th>
            <th>Acción Auditada</th>
            <th>Descripción de Evento</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2026-09-26 23:45:42</td>
            <td>marco</td>
            <td><span class="action-tag">dashboard_api:MA</span></td>
            <td>Consulta de indicadores filtrados por estado MA</td>
          </tr>
          <tr>
            <td>2026-09-26 23:45:41</td>
            <td>marco</td>
            <td><span class="action-tag">dashboard_api</span></td>
            <td>Consulta de indicadores agregados generales</td>
          </tr>
          <tr>
            <td>2026-09-26 23:45:40</td>
            <td>marco</td>
            <td><span class="action-tag">login</span></td>
            <td>Autenticación exitosa de usuario administrador</td>
          </tr>
          <tr>
            <td>2026-09-26 23:01:32</td>
            <td>marco</td>
            <td><span class="action-tag">audit_view</span></td>
            <td>Acceso a la vista del registro de auditoría</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tarjeta 2: Reader 403 Forbidden -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">Panel (b): Control de Acceso RBAC — Intento de acceso a /audit con Rol Lector (usuario: lector)</div>
      <span class="badge-reader">ROLE: READER · HTTP 403 FORBIDDEN</span>
    </div>
    <div class="card-content">
      <div class="forbidden-box">
        <div class="forbidden-code">403</div>
        <div class="forbidden-desc">
          <h4>Acceso Denegado (Forbidden)</h4>
          <p>El backend Flask verifica <code style="color:#f1f5f9; background:#1e293b; padding:2px 6px; border-radius:4px;">session.get('role') != 'admin'</code> e interrumpe la solicitud con <code style="color:#f1f5f9; background:#1e293b; padding:2px 6px; border-radius:4px;">abort(403)</code>. Los usuarios con rol <em>analyst</em> o <em>reader</em> tienen estrictamente prohibida la lectura del registro de auditoría.</p>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 600, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.setContent(combinedHtml, { waitUntil: 'networkidle0' });

  const containerHandle = await page.$('.card-container');
  await containerHandle.screenshot({
    path: path.join(informeDir, 'fig3_auditoria_rbac.png'),
    omitBackground: false
  });

  console.log('Guardado fig3_auditoria_rbac.png');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
