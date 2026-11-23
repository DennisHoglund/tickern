const { test, expect, bild, rad } = require('./hjalp');

test.describe('Offline', () => {
  test('visar sparade kurser när kursservern inte svarar', async ({ tickern: page, api }) => {
    api.nere = true;
    await page.reload();
    await expect(page.locator('#status')).toHaveText('> OFFLINE · visar sparade kurser från 15:00:00');
    await expect(page.locator('#status')).toHaveClass(/offline/);
    await expect(rad(page, 'VOLV-B').locator('.pris')).toHaveText('287,10');
    await expect(page.locator('#logg li.fel').first()).toContainText('OFFLINE');
    await bild(page, 'Offline med sparade kurser');
  });

  test('blir online igen vid nästa lyckade hämtning', async ({ tickern: page, api }) => {
    api.nere = true;
    await page.reload();
    await expect(page.locator('#status')).toHaveClass(/offline/);
    api.nere = false;
    await page.locator('#cmd').fill('UPD');
    await page.locator('#cmd').press('Enter');
    await expect(page.locator('#status')).not.toHaveClass(/offline/);
    await expect(page.locator('#logg')).toContainText('ONLINE');
  });
});
