// Quick localStorage debugging
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/');
  
  // Login
  await page.getByText('Sign In').click();
  await page.fill('input[type="email"]', 'jamie.watters.mail@icloud.com');
  await page.fill('input[type="password"]', 'Qwerty123!');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  
  // Wait for tier sync
  await page.waitForTimeout(5000);
  
  // Check localStorage
  const storageData = await page.evaluate(() => {
    const key = 'usage_jamie.watters.mail@icloud.com';
    const data = localStorage.getItem(key);
    return {
      key: key,
      rawData: data,
      parsedData: data ? JSON.parse(data) : null,
      allStorage: Object.keys(localStorage).reduce((acc, k) => {
        acc[k] = localStorage.getItem(k);
        return acc;
      }, {})
    };
  });
  
  console.log('📊 CURRENT LOCALSTORAGE STATE:');
  console.log(JSON.stringify(storageData, null, 2));
  
  await browser.close();
})();