// Gemensamma fixturer och hjälpfunktioner för testerna.
const base = require('@playwright/test');
const { mocka } = require('./mock');

const test = base.test.extend({
  // Mockar allt externt innan varje test. api ger tillgång till kurserna.
  // Klockan står still på måndag 23 nov 2026 kl 14:00 (börsen öppen) så att testerna inte beror på när de körs
  api: async ({ page }, use) => {
    await page.clock.setFixedTime(new Date('2026-11-23T13:00:00Z'));
    await use(await mocka(page));
  },

  // Startad app med standardlistan laddad
  tickern: async ({ page, api }, use) => {
    await page.goto('./');
    await base.expect(page.locator('#lista .rad')).toHaveCount(7);
    await base.expect(page.locator('#lista .rad .pris').first()).not.toHaveText('…');
    await use(page);
  }
});

const rad = (page, ticker) => page.locator('#lista .rad', { has: page.locator('.tkr', { hasText: new RegExp('^' + ticker.replace(/[.^$-]/g, '\\$&') + '$') }) });

async function kommando(page, text) {
  await page.locator('#cmd').fill(text);
  await page.locator('#cmd').press('Enter');
}

// Bifogar en skärmdump till rapporten
async function bild(page, namn) {
  await page.waitForTimeout(250);
  await test.info().attach(namn, { body: await page.screenshot(), contentType: 'image/png' });
}

module.exports = { test, expect: base.expect, bild, rad, kommando };
