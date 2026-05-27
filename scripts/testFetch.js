import fs from 'fs';
import path from 'path';

async function test() {
  const url = 'https://www.ouedkniss.com/immobilier/1';
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Length:', text.length);
    const dir = 'C:\\Users\\surface laptop 4\\.gemini\\antigravity\\brain\\2505d6ea-1a51-4fdf-bebb-c5f94ed29e29\\scratch';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'ouedkniss.html'), text);
    console.log('Saved to scratch/ouedkniss.html');
  } catch (err) {
    console.error('Error:', err);
  }
}
test();


