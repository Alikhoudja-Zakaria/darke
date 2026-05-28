import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const firebaseConfig = {
  apiKey: "AIzaSyA2BIvH0HTFJ4clvx5aQ1tinfcg34YIChI",
  authDomain: "studio-1088250814-d2038.firebaseapp.com",
  projectId: "studio-1088250814-d2038",
  storageBucket: "studio-1088250814-d2038.firebasestorage.app",
  messagingSenderId: "545622549899",
  appId: "1:545622549899:web:cdcf26ecd9f3212e90bb8e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BOT_USER_ID = "XsU0w8gUmzW6UkCP31Cii5P1Q5U2";

import { localParseListing } from './localAIParser.js';

console.log("Local Heuristic AI-like offline parser active.");

// Check if listing already exists in Firestore
async function checkIfListingExists(ouedknissId) {
  try {
    const q = query(collection(db, 'listings'), where('ouedknissId', '==', ouedknissId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking duplicate for ID ${ouedknissId}:`, error);
    return false;
  }
}

// Save listing to Firestore
async function saveToFirestore(listingData) {
  try {
    const docRef = await addDoc(collection(db, 'listings'), {
      ...listingData,
      createdAt: serverTimestamp(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving listing to Firestore:", error);
    throw error;
  }
}

// Parse page text using Local Heuristic AI-like Parser
function parseListingTextWithLocalAI(text, titleCandidate, images) {
  return localParseListing(text, titleCandidate, images);
}

async function scrape() {
  const isDryRun = process.argv.includes('--dry-run');
  
  // Parse starting page (default to 1)
  let startPage = 1;
  const startPageIdx = process.argv.indexOf('--start-page');
  if (startPageIdx !== -1 && process.argv[startPageIdx + 1]) {
    startPage = parseInt(process.argv[startPageIdx + 1]) || 1;
  }
  
  // Parse target count
  let targetCount = isDryRun ? 3 : 90;
  const targetIdx = process.argv.indexOf('--target');
  if (targetIdx !== -1 && process.argv[targetIdx + 1]) {
    targetCount = parseInt(process.argv[targetIdx + 1]) || targetCount;
  }
  
  console.log(`Starting scraper in ${isDryRun ? 'DRY-RUN' : 'PRODUCTION'} mode. startPage: ${startPage}, target: ${targetCount}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  const listingUrls = new Set();
  let pageNum = startPage;
  let consecutiveDuplicates = 0;
  const EARLY_EXIT_THRESHOLD = 8; // Stop if we hit 8 consecutive duplicates

  // Step 1: Collect listing URLs
  console.log('--- Collecting Listing URLs ---');
  while (listingUrls.size < targetCount && pageNum <= 100) {
    const listUrl = `https://www.ouedkniss.com/immobilier/${pageNum}`;
    console.log(`Loading list page ${pageNum}: ${listUrl}`);
    try {
      await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Scroll to trigger infinite scroll loads
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const hrefs = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => a.href).filter(href => href && href.includes('-d') && href.match(/-d\d+$/));
      });

      let pageNewListingsCount = 0;
      for (const href of hrefs) {
        if (listingUrls.size >= targetCount) {
          break;
        }

        const match = href.match(/-d(\d+)$/);
        if (!match) continue;
        const ouedknissId = match[1];

        // Skip in-memory duplicates
        if (listingUrls.has(href)) continue;

        // Check if duplicate in Firestore
        let exists = false;
        if (!isDryRun) {
          exists = await checkIfListingExists(ouedknissId);
        }

        if (exists) {
          consecutiveDuplicates++;
          console.log(`URL ${href} (ID: ${ouedknissId}) already exists in Firestore. Streak count: ${consecutiveDuplicates}`);
          if (consecutiveDuplicates >= EARLY_EXIT_THRESHOLD) {
            console.log(`Hit early exit threshold of ${EARLY_EXIT_THRESHOLD} consecutive duplicates. Stopping URL collection.`);
            break;
          }
        } else {
          consecutiveDuplicates = 0; // Reset streak
          listingUrls.add(href);
          pageNewListingsCount++;
        }
      }

      console.log(`Page ${pageNum} yielded ${pageNewListingsCount} new listings. Total collected: ${listingUrls.size}/${targetCount}`);

      if (consecutiveDuplicates >= EARLY_EXIT_THRESHOLD) {
        break; // Break the outer while loop
      }

      pageNum++;
    } catch (err) {
      console.error(`Error loading page ${pageNum}:`, err.message);
      break;
    }
  }


  const urlsArray = Array.from(listingUrls);
  console.log(`Total candidate URLs collected: ${urlsArray.length}`);

  let successCount = 0;

  // Step 2: Process details for each URL
  console.log('--- Processing Details ---');
  for (let i = 0; i < urlsArray.length; i++) {
    if (successCount >= targetCount) {
      console.log(`Reached target count of ${targetCount} successfully imported listings.`);
      break;
    }

    const detailUrl = urlsArray[i];
    const match = detailUrl.match(/-d(\d+)$/);
    if (!match) continue;
    const ouedknissId = match[1];

    console.log(`[${i + 1}/${urlsArray.length}] Processing Ouedkniss ID ${ouedknissId}...`);

    // Check duplicate (double check)
    if (!isDryRun) {
      const exists = await checkIfListingExists(ouedknissId);
      if (exists) {
        console.log(`Listing ${ouedknissId} already exists in Firestore. Skipping.`);
        continue;
      }
    }

    let detailPage = null;
    try {
      detailPage = await browser.newPage();
      await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
      
      await detailPage.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract listing title candidate
      const titleCandidate = await detailPage.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? h1.innerText.trim() : '';
      });

      // Extract images (filter out icons and trackers, max 7 images)
      let images = await detailPage.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .map(img => img.src)
          .filter(src => src && src.includes('medias/announcements/images/'));
      });
      if (images && images.length > 7) {
        images = images.slice(0, 7);
      }

      // Click contact button
      const clicked = await detailPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const contactBtn = buttons.find(b => b.innerText.includes('إتصال') || b.innerText.includes('Contact') || b.innerText.includes('Appeler') || b.className.includes('bg-blue-darken-2'));
        if (contactBtn) {
          contactBtn.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        // Wait for phone number modal
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      const bodyText = await detailPage.evaluate(() => document.body.innerText);

      const parsed = parseListingTextWithLocalAI(bodyText, titleCandidate, images);
      parsed.ouedknissId = ouedknissId;
      parsed.userId = BOT_USER_ID;

      // Quality and completeness validation
      console.log(`Listing ${ouedknissId} Heuristic Quality Score: ${parsed.quality.score}/100`);
      if (!parsed.quality.isHighQuality) {
        console.log(`Skipping listing ${ouedknissId} due to low quality score:`, parsed.quality.reasons.join(', '));
        continue;
      }

      // Final basic validations for database integrity
      if (!parsed.phone) {
        console.log('Skipping: Phone number is empty.');
        continue;
      }
      if (parsed.price <= 0) {
        console.log('Skipping: Price is invalid/empty.');
        continue;
      }

      console.log('Parsed Listing Data:', {
        ...parsed,
        description: parsed.description.substring(0, 50) + '...',
        imagesCount: parsed.images.length
      });

      if (isDryRun) {
        successCount++;
        console.log('Dry-run success. Not writing to Firestore.');
      } else {
        const docId = await saveToFirestore(parsed);
        successCount++;
        console.log(`Successfully saved listing to Firestore. Document ID: ${docId}`);
      }

      // Small delay between requests to be gentle
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`Error processing listing ${detailUrl}:`, err.message);
    } finally {
      if (detailPage) {
        try {
          await detailPage.close();
        } catch (e) {}
      }
    }
  }

  console.log(`Scraping complete. Successfully processed: ${successCount} listings.`);
  try {
    await browser.close();
  } catch (err) {
    console.log('Browser closed with minor cleanup warning:', err.message);
  }
  process.exit(0);
}

scrape();
