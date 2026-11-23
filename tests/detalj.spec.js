const { test, expect, bild, rad, kommando } = require('./hjalp');

test.describe('Detaljvy', () => {
  test('tryck på en aktie visar bolaget och förklaring i klarspråk', async ({ tickern: page }) => {
    await rad(page, 'VOLV-B').click();
    const d = page.locator('#detalj');
    await expect(d).toBeVisible();
    await expect(page.locator('#detalj-titel')).toHaveText('Volvo B');
    await expect(page.locator('#d-bolag')).toContainText('lastbilar');
    await expect(page.locator('#d-pris')).toHaveText('287,10');
    await expect(page.locator('#d-forandring')).toHaveText('▲ +3,52 (+1,24 %)');
    await expect(page.locator('#d-forklaring li').nth(0)).toHaveText('Aktien steg 1,24 % idag.');
    await expect(page.locator('#d-forklaring')).toContainText('Bättre än börsen i stort (OMXS30 +0,62 %).');
    await expect(page.locator('#d-forklaring')).toContainText('Senaste månaden: +11,85 %. Den ligger nära månadens högsta.');
    await expect(page.locator('#d-graf')).toHaveText(/^[▁▂▃▄▅▆▇█]{11}$/);
    await expect(page.locator('#d-tal')).toContainText('Antal aktier som köpts och sålts idag.');
    await bild(page, 'Detaljvy Volvo');
  });

  test('aktie som går mot börsen förklaras som bolagsspecifik', async ({ tickern: page }) => {
    await rad(page, 'EVO').click();
    await expect(page.locator('#d-kurs')).toHaveClass(/ned/);
    await expect(page.locator('#d-forklaring li').nth(0)).toHaveText('Aktien sjönk 2,45 % idag.');
    await expect(page.locator('#d-forklaring')).toContainText('Den gick ner fast börsen gick upp');
    await bild(page, 'Detaljvy Evolution');
  });

  test('ESC stänger detaljvyn', async ({ tickern: page }) => {
    await rad(page, 'SAAB-B').click();
    await page.locator('#btn-tillbaka').click();
    await expect(page.locator('#detalj')).toBeHidden();
    await expect(page.locator('#lista')).toBeVisible();
  });

  test('INFO-kommandot öppnar detaljvyn', async ({ tickern: page }) => {
    await kommando(page, 'info saab-b');
    await expect(page.locator('#detalj-titel')).toHaveText('Saab B');
    await expect(page.locator('#d-bolag')).toContainText('Gripen');
  });
});
