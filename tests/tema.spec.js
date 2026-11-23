const { test, expect, bild } = require('./hjalp');

test.describe('Tema och PWA', () => {
  test('temaknappen växlar Auto → Ljust → Mörkt och sparar valet', async ({ tickern: page }) => {
    await expect(page.locator('#theme-label')).toHaveText('Auto');
    await page.locator('#btn-theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#theme-label')).toHaveText('Ljust');
    await bild(page, 'Ljust läge');
    await page.locator('#btn-theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('mörkt läge är svart med grön text', async ({ page, api }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');
    const [bg, fg] = await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.body).color]);
    expect(bg).toBe('rgb(10, 15, 10)');
    expect(fg).toBe('rgb(51, 255, 102)');
  });

  test('ljust läge följer telefonens inställning', async ({ page, api }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(241, 244, 236)');
  });

  test('manifestet beskriver appen Tickern med ikoner', async ({ page, request }) => {
    const m = await (await request.get('./manifest.webmanifest')).json();
    expect(m.name).toBe('Tickern');
    expect(m.display).toBe('standalone');
    for (const i of m.icons) expect((await request.get('./' + i.src)).ok()).toBeTruthy();
  });
});
