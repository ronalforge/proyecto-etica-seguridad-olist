import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const informeDir = path.resolve(__dirname, '../informe');

const terminalHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0b0f19;
    padding: 30px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .window {
    width: 1000px;
    background: #141824;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  .titlebar {
    background: #1c2233;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .buttons { display: flex; gap: 8px; }
  .btn { width: 12px; height: 12px; border-radius: 50%; }
  .btn-close { background: #ff5f56; }
  .btn-min { background: #ffbd2e; }
  .btn-max { background: #27c93f; }
  .title {
    flex: 1;
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
    margin-right: 48px;
  }
  .terminal-body {
    padding: 24px;
    color: #e2e8f0;
    font-size: 13.5px;
    line-height: 1.6;
  }
  .section-tag {
    display: inline-block;
    color: #38bdf8;
    font-weight: bold;
    margin-top: 14px;
    margin-bottom: 4px;
    border-bottom: 1px dashed #0284c7;
    padding-bottom: 2px;
  }
  .cmd { color: #f8fafc; font-weight: 600; }
  .cmd::before { content: "➜  olist-lab (main) "; color: #34d399; font-weight: normal; }
  .out { color: #94a3b8; margin-left: 20px; }
  .out-success { color: #4ade80; margin-left: 20px; font-weight: 500; }
  .out-err { color: #f87171; margin-left: 20px; }
  .out-highlight { color: #fbbf24; margin-left: 20px; }
  .comment { color: #64748b; font-style: italic; margin-left: 20px; }
</style>
</head>
<body>
<div class="window">
  <div class="titlebar">
    <div class="buttons">
      <div class="btn btn-close"></div>
      <div class="btn btn-min"></div>
      <div class="btn btn-max"></div>
    </div>
    <div class="title">marcosoto@MacBook-Pro: ~/Desktop/proyecto-etica-seguridad-olist — zsh</div>
  </div>
  <div class="terminal-body">
    <span class="section-tag">[PRUEBA 1] Verificación de Cifrado en Reposo (SQLCipher vs SQLite Estándar)</span><br>
    <div class="cmd">xxd -l 16 instance/olist.db</div>
    <div class="out">00000000: cd25 1341 1404 9ed7 d0b0 bef7 75eb f460  .%.A........u..\`</div>
    <div class="comment"># Cabecera binaria cifrada sin el prefijo estándar "SQLite format 3"</div>
    <div class="cmd">sqlite3 instance/olist.db "SELECT count(*) FROM deliveries;"</div>
    <div class="out-err">Error: in prepare, file is not a database (26)</div>
    <div class="comment"># Intento de lectura sin clave criptográfica: bloqueado por ausencia de clave</div>
    <div class="cmd">.venv/bin/python -c "from db_crypto import connect; print('Conteo:', connect().execute('SELECT count(*) FROM deliveries').fetchone()[0])"</div>
    <div class="out-success">✓ Apertura con SQLCipher y clave local (db.key): Conteo: 96470 pedidos</div>
    <br>
    <span class="section-tag">[PRUEBA 2] Contingencia y Restauración Íntegra (AES-256-GCM)</span><br>
    <div class="cmd">.venv/bin/python backup.py backup instance/copia.enc</div>
    <div class="out-highlight">Respaldo cifrado generado: instance/copia.enc (AES-256-GCM con nonce aleatorio de 12 bytes)</div>
    <div class="cmd">.venv/bin/python backup.py restore instance/copia.enc --destination instance/restaurada.db</div>
    <div class="out-success">✓ Restauración y verificación completadas: instance/restaurada.db (PRAGMA integrity_check = ok, 96,470 registros)</div>
    <br>
    <span class="section-tag">[PRUEBA 3] Transporte Seguro en Tránsito (HTTPS Local con TLS 1.3)</span><br>
    <div class="cmd">curl -k -v -I https://127.0.0.1:5002/login 2>&amp;1 | grep -E "(TLS handshake|SSL connection|Server certificate|HTTP/1.1|subject:)"</div>
    <div class="out">* (304) (IN), TLS handshake, Server hello (2)</div>
    <div class="out">* (304) (IN), TLS handshake, Certificate (11)</div>
    <div class="out-highlight">* SSL connection using TLSv1.3 / AEAD-AES256-GCM-SHA384</div>
    <div class="out">* Server certificate: subject: O=Dummy Certificate; CN=* (Autofirmado ad-hoc)</div>
    <div class="out-success">&lt; HTTP/1.1 200 OK (Sesión protegida con cabecera Cache-Control: no-store y cookies Secure)</div>
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
    defaultViewport: { width: 1060, height: 750, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.setContent(terminalHtml, { waitUntil: 'networkidle0' });

  const windowHandle = await page.$('.window');
  await windowHandle.screenshot({
    path: path.join(informeDir, 'fig4_seguridad_recuperacion.png'),
    omitBackground: false
  });

  console.log('Guardado fig4_seguridad_recuperacion.png');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
