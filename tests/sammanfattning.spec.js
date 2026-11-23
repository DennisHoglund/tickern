const { test, expect, bild, kommando } = require('./hjalp');

const RADER = [
  'DAGEN 23/11 · OMXS30 ▲+0,62 %',
  'BÄST   SAAB-B ▲+2,10 %',
  'SÄMST  EVO ▼-2,45 %',
  '4 av 7 i din lista steg idag.',
  'Börsen steg och minst hälften av dina aktier följde med.'
];

test.describe('Dagens sammanfattning', () => {
  test('skrivs automatiskt i loggen efter stängning 17:30', async ({ page, api }) => {
    await page.clock.setFixedTime(new Date('2026-11-23T17:00:00Z')); // 18:00 svensk tid
    await page.goto('./');
    const rader = page.locator('#logg li');
    await expect(rader.nth(0)).toContainText(RADER[0]);
    await expect(rader.nth(0)).toHaveClass(/dag/);
    for (let i = 1; i < RADER.length; i++) await expect(rader.nth(i)).toContainText(RADER[i]);
    await bild(page, 'Dagens sammanfattning');
  });

  test('skrivs bara en gång per dag', async ({ page, api }) => {
    await page.clock.setFixedTime(new Date('2026-11-23T17:00:00Z'));
    await page.goto('./');
    await expect(page.locator('#logg li.dag')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('#lista .rad .pris').first()).not.toHaveText('…');
    await expect(page.locator('#logg li.dag')).toHaveCount(1);
  });

  test('skrivs inte medan börsen är öppen', async ({ tickern: page }) => {
    await expect(page.locator('#logg li.dag')).toHaveCount(0);
  });

  test('DAG-kommandot visar sammanfattningen när som helst', async ({ tickern: page }) => {
    await kommando(page, 'DAG');
    await expect(page.locator('#logg li').nth(0)).toContainText(RADER[0]);
    await expect(page.locator('#logg li').nth(1)).toContainText(RADER[1]);
  });
});
