const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function test() {
  const paths = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/snap/bin/chromium", "/usr/bin/chromium-browser"];
  const executablePath = paths.find(p => fs.existsSync(p));
  console.log("Found path:", executablePath);

  if (!executablePath) {
    console.log("No browser found. Testing default launch...");
  }

  try {
    const browser = await puppeteer.launch({
      executablePath,
      args: ["--no-sandbox"]
    });
    console.log("Browser launched successfully!");
    await browser.close();
  } catch (e) {
    console.error("Launch failed:", e.message);
  }
}

test();
