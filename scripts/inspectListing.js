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
    console.log('Listing loaded. Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Let's dump all text contents of the page to find where the phone number or details might be
    const pageText = await page.evaluate(() => document.body.innerText);
    
    // Find all buttons
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        className: b.className
      }));
    });
    
    console.log('Buttons on page:', buttons);

    // Save page text and HTML
    const dir = 'C:\\Users\\surface laptop 4\\.gemini\\antigravity\\brain\\2505d6ea-1a51-4fdf-bebb-c5f94ed29e29\\scratch';
    fs.writeFileSync(path.join(dir, 'listing_text.txt'), pageText);
    
    const html = await page.content();
    fs.writeFileSync(path.join(dir, 'listing_detail.html'), html);
    console.log('Saved listing details to scratch.');

    // Extract all image URLs
    const imgUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => img.src).filter(src => src && (src.includes('ouedkniss.com') || src.includes('cdn') || src.includes('storage')));
    });
    console.log('Image URLs found:', imgUrls);

    // Find the button with text 'إتصال' or 'Call' or class bg-blue-darken-2
    console.log('Clicking the contact button...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contactBtn = buttons.find(b => b.innerText.includes('إتصال') || b.innerText.includes('Contact') || b.innerText.includes('Appeler') || b.className.includes('bg-blue-darken-2'));
      if (contactBtn) {
        contactBtn.click();
        return true;
      }
      return false;
    });

    console.log(`Clicked contact button: ${clicked}`);
    if (clicked) {
      console.log('Waiting 3 seconds for modal or inline text to load...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const pageTextAfterClick = await page.evaluate(() => document.body.innerText);
      fs.writeFileSync(path.join(dir, 'listing_text_after_click.txt'), pageTextAfterClick);
      console.log('Saved page text after click.');

      const cleanText = pageTextAfterClick.replace(/\s+/g, '');
      const phoneRegex = /(05|06|07)\d{8}/g;
      const foundPhones = cleanText.match(phoneRegex);
      console.log('Found phone numbers after click (cleaned):', foundPhones);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}
main();


