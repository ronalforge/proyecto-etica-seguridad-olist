import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const informeDir = path.resolve(__dirname, '../informe');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  console.log('1. Iniciar sesión como marco (admin)...');
  await page.goto('http://127.0.0.1:5001/login', { waitUntil: 'networkidle2' });
  await page.type('input[name="username"]', 'marco');
  await page.type('input[name="password"]', 'MarcoSoto2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('2. Capturando fig1_kpi_general.png...');
  await page.waitForSelector('main#contenido');
  // Esperar a que los datos de la API se carguen
  await page.waitForFunction(() => document.body.innerText.includes('96.470') || document.body.innerText.includes('96,470'));
  await page.screenshot({
    path: path.join(informeDir, 'fig1_kpi_general.png'),
    clip: { x: 0, y: 0, width: 1280, height: 780 }
  });
  console.log('Guardado fig1_kpi_general.png');

  console.log('3. Capturando fig2_filtro_estado.png (Estado MA)...');
  await page.goto('http://127.0.0.1:5001/?state=MA', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('17,4 %') || document.body.innerText.includes('17.4 %'));
  await page.screenshot({
    path: path.join(informeDir, 'fig2_filtro_estado.png'),
    clip: { x: 0, y: 0, width: 1280, height: 780 }
  });
  console.log('Guardado fig2_filtro_estado.png');

  console.log('4. Capturando fig3_auditoria_admin.png...');
  await page.goto('http://127.0.0.1:5001/audit', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.table-scroll');
  await page.screenshot({
    path: path.join(informeDir, 'fig3_auditoria_admin.png'),
    clip: { x: 0, y: 0, width: 1280, height: 600 }
  });
  console.log('Guardado fig3_auditoria_admin.png');

  console.log('5. Cerrando sesión y logueando como lector (reader)...');
  await page.goto('http://127.0.0.1:5001/login', { waitUntil: 'networkidle2' });
  await page.type('input[name="username"]', 'lector');
  await page.type('input[name="password"]', 'Password1234!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('6. Intentando acceder a /audit como lector (Esperando 403 Forbidden)...');
  const response = await page.goto('http://127.0.0.1:5001/audit');
  console.log('Status code /audit para lector:', response.status());
  await page.screenshot({
    path: path.join(informeDir, 'fig3_auditoria_403.png'),
    clip: { x: 0, y: 0, width: 1280, height: 420 }
  });
  console.log('Guardado fig3_auditoria_403.png');

  await browser.close();
  console.log('Capturas web completadas.');
}

main().catch(err => {
  console.error('Error generando capturas:', err);
  process.exit(1);
});
