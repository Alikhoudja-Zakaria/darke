import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  const url = 'https://www.ouedkniss.com/immobilier/1';
  console.log(`Navigating to ${url}...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Page loaded. Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get all links
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.map(a => ({
        href: a.href,
        text: a.innerText.trim(),
        className: a.className,
        parentClassName: a.parentElement ? a.parentElement.className : ''
      }));
    });

    console.log(`Found ${links.length} links.`);
    
    // Save to scratch
    const dir = 'C:\\Users\\surface laptop 4\\.gemini\\antigravity\\brain\\2505d6ea-1a51-4fdf-bebb-c5f94ed29e29\\scratch';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'links.json'), JSON.stringify(links, null, 2));
    console.log('Saved links to scratch/links.json');

    // Print a few sample links containing numbers or 'store' or 'detail'
    const interestingLinks = links.filter(l => l.href.includes('/detail/') || l.href.includes('/annonce/') || l.href.match(/\/\d+$/));
    console.log('Sample interesting links:', interestingLinks.slice(0, 15));

    // Save full page HTML
    const html = await page.content();
    fs.writeFileSync(path.join(dir, 'rendered.html'), html);
    console.log('Saved full rendered HTML to scratch/rendered.html');

  } catch (err) {
    console.error('Error during scraping:', err);
  } finally {
    await browser.close();
  }
}

main();
