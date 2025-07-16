#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Monitor page errors
    const pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    
    // Navigate to analytics page
    console.log('Navigating to analytics page...');
    await page.goto('http://localhost:3000/analytics', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for analytics heading
    const analyticsHeading = await page.$('h1');
    if (analyticsHeading) {
      const headingText = await page.evaluate(el => el.textContent, analyticsHeading);
      console.log('Found heading:', headingText);
    }
    
    // Check for errors
    if (pageErrors.length > 0) {
      console.log('\n🚨 JavaScript Errors Found:');
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Check console messages
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    if (errors.length > 0) {
      console.log('\n🚨 Console Errors Found:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
      });
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Log all console messages for debugging
    console.log('\n📋 All Console Messages:');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'analytics-page.png' });
    console.log('📸 Screenshot saved as analytics-page.png');
    
  } catch (error) {
    console.error('Error testing analytics page:', error.message);
    
    // Try alternative approach with simple HTTP request
    console.log('\nTrying direct HTTP request...');
    const http = require('http');
    
    const req = http.request('http://localhost:3000/analytics', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Analytics page HTTP request successful');
      } else {
        console.log('❌ Analytics page HTTP request failed:', res.statusCode);
      }
    });
    
    req.on('error', (err) => {
      console.error('HTTP request error:', err.message);
    });
    
    req.end();
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();