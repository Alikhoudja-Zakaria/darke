import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function main() {
  const url = 'https://www.ouedkniss.com/immobilier/1';
  console.log(`Navigating to ${url}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1600 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Page loaded. Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll down
    for (let i = 0; i < 3; i++) {
      console.log(`Scroll ${i+1}...`);
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const dir = 'C:\\Users\\surface laptop 4\\.gemini\\antigravity\\brain\\2505d6ea-1a51-4fdf-bebb-c5f94ed29e29\\scratch';
    await page.screenshot({ path: path.join(dir, 'ouedkniss_list.png'), fullPage: true });
    console.log('Screenshot saved to scratch/ouedkniss_list.png');

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.href,
        text: a.innerText.substring(0, 30)
      })).filter(a => a.href.includes('-d'));
    });
    console.log(`Found ${links.length} matching links:`, links);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}
main();
