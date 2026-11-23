const { test, expect, bild, rad } = require('./hjalp');

test.describe('Watchlist', () => {
  test('visar standardlistan med kurser, förändring och 7-dagarsgraf', async ({ tickern: page }) => {
    await expect(rad(page, 'VOLV-B').locator('.pris')).toHaveText('287,10');
    await expect(rad(page, 'VOLV-B').locator('.pct')).toHaveText('▲+1,24');
    await expect(rad(page, 'VOLV-B').locator('.spark')).toHaveText(/^[▁▂▃▄▅▆▇█]{7}$/);
    await expect(rad(page, 'EVO').locator('.pct')).toHaveText('▼-2,45');
    await bild(page, 'Watchlist');
  });

  test('nedgångar markeras med egen färg', async ({ tickern: page }) => {
    await expect(rad(page, 'HM-B')).toHaveClass(/ned/);
    await expect(rad(page, 'SAAB-B')).toHaveClass(/upp/);
    const upp = await rad(page, 'SAAB-B').evaluate((el) => getComputedStyle(el).color);
    const ned = await rad(page, 'HM-B').evaluate((el) => getComputedStyle(el).color);
    expect(upp).not.toBe(ned);
  });

  test('tickertapen visar OMXS30 och listans aktier', async ({ tickern: page }) => {
    await expect(page.locator('#tape')).toContainText('OMXS30 2 512,40 ▲+0,62%');
    await expect(page.locator('#tape')).toContainText('SAAB-B 214,80');
  });

  test('status visar tid för hämtningen och att kurserna är fördröjda', async ({ tickern: page }) => {
    await expect(page.locator('#status')).toHaveText(/^> WATCH \[15:00:00 · MARKNAD (ÖPPEN|STÄNGD)\]$/);
    await expect(page.locator('.topp .fordrojt')).toHaveText('FÖRDRÖJT 15 MIN');
  });

  test('hämtar alla symboler i ett anrop, med OMXS30', async ({ tickern: page, api }) => {
    expect(api.anrop[0]).toEqual(['^OMX', 'VOLV-B.ST', 'ERIC-B.ST', 'INVE-B.ST', 'ATCO-A.ST', 'SAAB-B.ST', 'HM-B.ST', 'EVO.ST']);
  });
});
