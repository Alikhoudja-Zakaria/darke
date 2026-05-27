import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function main() {
  const url = 'https://www.ouedkniss.com/%D8%B4%D9%82%D8%A9-%D9%83%D8%B1%D8%A7%D8%A1-%D8%AF%D9%88%D8%A8%D9%84%D9%83%D8%B3-4-%D8%BA%D8%B1%D9%81-%D8%A7%D9%84%D8%B7%D8%A7%D8%B1%D9%81-%D8%A7%D9%84%D9%82%D8%A7%D9%84%D8%A9-%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B1-d48866963';
  console.log(`Navigating to ${url}...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Let's check elements like H1, h2, classes
    const parsedData = await page.evaluate(() => {
      // Find Title
      const h1 = document.querySelector('h1');
      const title = h1 ? h1.innerText.trim() : '';

      // Find Price
      // Typically Ouedkniss has a price display. Let's find elements with price patterns or classes
      const priceElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const text = el.innerText || '';
          return (text.includes('دج') || text.includes('DA') || text.includes('مليار') || text.includes('مليون')) && text.length < 50;
        })
        .map(el => ({
          tagName: el.tagName,
          className: el.className,
          text: el.innerText.trim()
        }));

      // Find Specs list
      // Specs are usually inside a list or table or grid. Let's find text patterns
      const specs = [];
      const specElements = Array.from(document.querySelectorAll('*')).filter(el => {
        // Find elements that have key-value structure
        // e.g. "الغرف" or "الطابق"
        return el.childNodes.length === 2 && 
               el.firstElementChild && 
               (el.innerText.includes('الغرف') || el.innerText.includes('المساحة') || el.innerText.includes('Pièces') || el.innerText.includes('Superficie'));
      }).map(el => el.innerText.trim());

      // Let's just grab all text and HTML of key divs to see how specs are wrapped
      const divWithSpecs = Array.from(document.querySelectorAll('div')).find(div => {
        return div.innerText.includes('رقم الإعلان') && div.innerText.includes('الغرف') && div.innerText.length < 1500;
      });

      return {
        title,
        priceElements: priceElements.slice(0, 10),
        specs,
        divWithSpecsText: divWithSpecs ? divWithSpecs.innerText : 'Not found',
        divWithSpecsHTML: divWithSpecs ? divWithSpecs.outerHTML.substring(0, 500) : 'Not found'
      };
    });

    console.log('Parsed details:', parsedData);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}
main();
