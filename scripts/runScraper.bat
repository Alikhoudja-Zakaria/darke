@echo off
cd /d "c:\Users\surface laptop 4\Desktop\webappo"
echo [%date% %time%] Starting automated scraper... >> "c:\Users\surface laptop 4\Desktop\webappo\scraper.log"
node scripts/scrapeListings.js >> "c:\Users\surface laptop 4\Desktop\webappo\scraper.log" 2>&1
echo [%date% %time%] Starting automated listing integrity check... >> "c:\Users\surface laptop 4\Desktop\webappo\scraper.log"
node scripts/cleanDeletedListings.js >> "c:\Users\surface laptop 4\Desktop\webappo\scraper.log" 2>&1
echo [%date% %time%] Scraping and cleaning session finished. >> "c:\Users\surface laptop 4\Desktop\webappo\scraper.log"
echo ---------------------------------------------------- >> "c:\Users\surface laptop 4\Desktop\webappo\scraper.log"
