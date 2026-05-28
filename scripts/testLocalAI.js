import fs from 'fs';
import path from 'path';
import { localParseListing } from './localAIParser.js';

const dir = 'C:\\Users\\surface laptop 4\\.gemini\\antigravity\\brain\\2505d6ea-1a51-4fdf-bebb-c5f94ed29e29\\scratch';
const textPath = path.join(dir, 'listing_text_after_click.txt');

if (fs.existsSync(textPath)) {
  const text = fs.readFileSync(textPath, 'utf8');
  console.log("Parsing raw text from scratch directory...");
  const parsed = localParseListing(text, "كراء شقة دوبلكس 4 غرف الطارف القالة");
  console.log("Parsed Result:", parsed);
} else {
  console.error("listing_text_after_click.txt not found in scratch directory.");
}
