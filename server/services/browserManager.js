const puppeteer = require('puppeteer');

class BrowserManager {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (this.browser) {
      return this.browser;
    }

    const options = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ],
      ignoreHTTPSErrors: true
    };

    this.browser = await puppeteer.launch(options);
    return this.browser;
  }

  async getPage() {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    // Add console logging
    page.on('console', msg => console.log('Browser:', msg.text()));
    
    return page;
  }

  async navigateToUrl(page, url) {
    console.log(`🌐 Navigating to: ${url}`);
    
    const response = await page.goto(url, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000 
    });

    if (!response?.ok()) {
      throw new Error(`Navigation failed: ${response?.status()}`);
    }

    await this.waitForContent(page);
    return response;
  }

  async waitForContent(page) {
    await page.waitForFunction(() => {
      const app = document.querySelector('#app');
      return app && app.children.length > 0;
    }, { timeout: 5000 });
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new BrowserManager();
