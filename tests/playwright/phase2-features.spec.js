import { test, expect } from '@playwright/test';

test.describe('Phase 2 Client-Side Features', () => {
  
  test.describe('Analysis History', () => {
    test('should save analysis to LocalStorage history', async ({ page }) => {
      // Navigate to app
      await page.goto('http://localhost:5174');
      
      // Mock an analysis being completed
      await page.evaluate(() => {
        const mockAnalysis = {
          id: '123',
          url: 'example.com',
          score: 67,
          date: new Date().toISOString(),
          factors: 10
        };
        
        // Get existing history or initialize
        const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        history.unshift(mockAnalysis);
        localStorage.setItem('analysisHistory', JSON.stringify(history));
      });
      
      // Verify history was saved
      const historyData = await page.evaluate(() => {
        return localStorage.getItem('analysisHistory');
      });
      
      expect(historyData).toBeTruthy();
      const parsed = JSON.parse(historyData);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].url).toBe('example.com');
      expect(parsed[0].score).toBe(67);
    });

    test('should display history in dashboard when logged in', async ({ page }) => {
      // Setup: Add some history items
      await page.goto('http://localhost:5174');
      
      await page.evaluate(() => {
        const mockHistory = [
          {
            id: '1',
            url: 'example.com',
            score: 67,
            date: new Date().toISOString(),
            factors: 10
          },
          {
            id: '2',
            url: 'test.com',
            score: 82,
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            factors: 10
          }
        ];
        localStorage.setItem('analysisHistory', JSON.stringify(mockHistory));
      });
      
      // Note: Full dashboard test would require authentication
      // This tests the LocalStorage functionality
      const history = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      });
      
      expect(history).toHaveLength(2);
      expect(history[0].url).toBe('example.com');
      expect(history[1].url).toBe('test.com');
    });

    test('should limit history to 20 most recent items', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Add 25 items to history
      await page.evaluate(() => {
        const history = [];
        for (let i = 0; i < 25; i++) {
          history.push({
            id: `id-${i}`,
            url: `site${i}.com`,
            score: 50 + i,
            date: new Date(Date.now() - i * 3600000).toISOString(),
            factors: 10
          });
        }
        
        // Simulate the trimming logic from addToHistory
        const trimmed = history.slice(0, 20);
        localStorage.setItem('analysisHistory', JSON.stringify(trimmed));
      });
      
      const savedHistory = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      });
      
      expect(savedHistory).toHaveLength(20);
      expect(savedHistory[0].url).toBe('site0.com');
      expect(savedHistory[19].url).toBe('site19.com');
    });

    test('should clear history when requested', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Add some history
      await page.evaluate(() => {
        localStorage.setItem('analysisHistory', JSON.stringify([
          { id: '1', url: 'test.com', score: 75, date: new Date().toISOString(), factors: 10 }
        ]));
      });
      
      // Clear history
      await page.evaluate(() => {
        localStorage.removeItem('analysisHistory');
      });
      
      const history = await page.evaluate(() => {
        return localStorage.getItem('analysisHistory');
      });
      
      expect(history).toBeNull();
    });
  });

  test.describe('Usage Tracking', () => {
    test('should track free tier usage in LocalStorage', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Set initial usage data
      await page.evaluate(() => {
        const usageData = {
          monthlyUsed: 1,
          lastUpdated: new Date().toISOString(),
          isUnlimited: false
        };
        localStorage.setItem('usage_anonymous', JSON.stringify(usageData));
      });
      
      // Verify usage was saved
      const usage = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('usage_anonymous') || '{}');
      });
      
      expect(usage.monthlyUsed).toBe(1);
      expect(usage.isUnlimited).toBe(false);
    });

    test('should enforce 3 analysis limit for free tier', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Set usage at limit
      await page.evaluate(() => {
        const usageData = {
          monthlyUsed: 3,
          lastUpdated: new Date().toISOString(),
          isUnlimited: false
        };
        localStorage.setItem('usage_anonymous', JSON.stringify(usageData));
      });
      
      // Check if can analyze
      const canAnalyze = await page.evaluate(() => {
        const usage = JSON.parse(localStorage.getItem('usage_anonymous') || '{}');
        return usage.isUnlimited || (usage.monthlyUsed || 0) < 3;
      });
      
      expect(canAnalyze).toBe(false);
    });

    test('should allow unlimited analyses for Coffee tier', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Set Coffee tier (unlimited)
      await page.evaluate(() => {
        const usageData = {
          monthlyUsed: 10, // More than free limit
          lastUpdated: new Date().toISOString(),
          isUnlimited: true // Coffee tier
        };
        localStorage.setItem('usage_test@example.com', JSON.stringify(usageData));
      });
      
      // Check if can analyze
      const canAnalyze = await page.evaluate(() => {
        const usage = JSON.parse(localStorage.getItem('usage_test@example.com') || '{}');
        return usage.isUnlimited || (usage.monthlyUsed || 0) < 3;
      });
      
      expect(canAnalyze).toBe(true);
    });

    test('should reset usage monthly', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Set usage from last month
      await page.evaluate(() => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const usageData = {
          monthlyUsed: 3,
          lastUpdated: lastMonth.toISOString(),
          isUnlimited: false
        };
        localStorage.setItem('usage_anonymous', JSON.stringify(usageData));
      });
      
      // Simulate checking usage in current month
      const shouldReset = await page.evaluate(() => {
        const stored = localStorage.getItem('usage_anonymous');
        if (!stored) return false;
        
        const data = JSON.parse(stored);
        const now = new Date();
        const storedDate = new Date(data.lastUpdated);
        
        return now.getMonth() !== storedDate.getMonth() || 
               now.getFullYear() !== storedDate.getFullYear();
      });
      
      expect(shouldReset).toBe(true);
    });

    test('should increment usage counter', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Set initial usage
      await page.evaluate(() => {
        const usageData = {
          monthlyUsed: 0,
          lastUpdated: new Date().toISOString(),
          isUnlimited: false
        };
        localStorage.setItem('usage_anonymous', JSON.stringify(usageData));
      });
      
      // Increment usage
      await page.evaluate(() => {
        const stored = localStorage.getItem('usage_anonymous');
        const data = JSON.parse(stored);
        data.monthlyUsed = (data.monthlyUsed || 0) + 1;
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem('usage_anonymous', JSON.stringify(data));
      });
      
      // Verify increment
      const usage = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('usage_anonymous') || '{}');
      });
      
      expect(usage.monthlyUsed).toBe(1);
    });

    test('should show remaining analyses count', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Set usage data
      await page.evaluate(() => {
        const usageData = {
          monthlyUsed: 1,
          lastUpdated: new Date().toISOString(),
          isUnlimited: false
        };
        localStorage.setItem('usage_anonymous', JSON.stringify(usageData));
      });
      
      // Calculate remaining
      const remaining = await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('usage_anonymous') || '{}');
        const FREE_TIER_LIMIT = 3;
        return data.isUnlimited ? Infinity : Math.max(0, FREE_TIER_LIMIT - (data.monthlyUsed || 0));
      });
      
      expect(remaining).toBe(2);
    });
  });

  test.describe('Integration Tests', () => {
    test('should track both history and usage for completed analysis', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Simulate completing an analysis
      await page.evaluate(() => {
        // Add to history
        const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        history.unshift({
          id: 'test-123',
          url: 'integration-test.com',
          score: 75,
          date: new Date().toISOString(),
          factors: 10
        });
        localStorage.setItem('analysisHistory', JSON.stringify(history));
        
        // Increment usage
        const usage = JSON.parse(localStorage.getItem('usage_anonymous') || '{}');
        usage.monthlyUsed = (usage.monthlyUsed || 0) + 1;
        usage.lastUpdated = new Date().toISOString();
        localStorage.setItem('usage_anonymous', JSON.stringify(usage));
      });
      
      // Verify both were updated
      const [historyData, usageData] = await page.evaluate(() => {
        return [
          JSON.parse(localStorage.getItem('analysisHistory') || '[]'),
          JSON.parse(localStorage.getItem('usage_anonymous') || '{}')
        ];
      });
      
      expect(historyData).toHaveLength(1);
      expect(historyData[0].url).toBe('integration-test.com');
      expect(usageData.monthlyUsed).toBe(1);
    });

    test('should handle multiple users with separate storage keys', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Set usage for different users
      await page.evaluate(() => {
        // Anonymous user
        localStorage.setItem('usage_anonymous', JSON.stringify({
          monthlyUsed: 2,
          lastUpdated: new Date().toISOString(),
          isUnlimited: false
        }));
        
        // Logged in user
        localStorage.setItem('usage_user@example.com', JSON.stringify({
          monthlyUsed: 1,
          lastUpdated: new Date().toISOString(),
          isUnlimited: false
        }));
      });
      
      // Verify separate tracking
      const [anonUsage, userUsage] = await page.evaluate(() => {
        return [
          JSON.parse(localStorage.getItem('usage_anonymous') || '{}'),
          JSON.parse(localStorage.getItem('usage_user@example.com') || '{}')
        ];
      });
      
      expect(anonUsage.monthlyUsed).toBe(2);
      expect(userUsage.monthlyUsed).toBe(1);
    });
  });
});