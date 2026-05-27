import { execSync } from 'child_process';

function main() {
  const taskName = 'DarkoumScraper';
  const batPath = 'c:\\Users\\surface laptop 4\\Desktop\\webappo\\scripts\\runScraper.bat';
  
  // Clean old task if exists
  try {
    execSync(`schtasks /delete /tn "${taskName}" /f`, { stdio: 'ignore' });
  } catch (e) {}

  console.log(`Registering scheduled task "${taskName}"...`);
  try {
    // schtasks /create /tn "DarkoumScraper" /tr "\"c:\Users\surface laptop 4\Desktop\webappo\scripts\runScraper.bat\"" /sc daily /st 02:00 /f
    // We execute it by wrapping in proper quotes
    const cmd = `schtasks /create /tn "${taskName}" /tr "cmd.exe /c \\"${batPath}\\"" /sc daily /st 02:00 /f`;
    console.log(`Running: ${cmd}`);
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log('Success:', output.trim());
  } catch (error) {
    console.error('Failed to register scheduled task:', error.message);
  }
}

main();
