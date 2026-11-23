const { test, expect, bild, rad, kommando } = require('./hjalp');

test.describe('Kommandorad', () => {
  test('en ticker läggs till överst och sparas', async ({ tickern: page, api }) => {
    await kommando(page, 'sinch');
    await expect(page.locator('#lista .rad').first().locator('.tkr')).toHaveText('SINCH');
    await expect(rad(page, 'SINCH').locator('.pris')).toHaveText('24,18');
    await expect(page.locator('#logg li').first()).toContainText('ADD  SINCH');
    expect(api.anrop.at(-1)).toContain('SINCH.ST');
    await bild(page, 'Ny ticker tillagd');
    await page.reload();
    await expect(page.locator('#lista .rad')).toHaveCount(8);
  });

  test('ADD fungerar också', async ({ tickern: page }) => {
    await kommando(page, 'ADD SINCH');
    await expect(rad(page, 'SINCH')).toBeVisible();
  });

  test('DEL tar bort en ticker', async ({ tickern: page }) => {
    await kommando(page, 'DEL HM-B');
    await expect(rad(page, 'HM-B')).toHaveCount(0);
    await expect(page.locator('#lista .rad')).toHaveCount(6);
    await expect(page.locator('#logg li').first()).toContainText('DEL  HM-B');
  });

  test('okänd ticker tas bort och loggas som fel', async ({ tickern: page }) => {
    await kommando(page, 'FINNSEJ');
    await expect(page.locator('#logg li.fel').first()).toContainText('FINNSEJ finns inte – borttagen');
    await expect(rad(page, 'FINNSEJ')).toHaveCount(0);
  });

  test('HELP visar kommandona', async ({ tickern: page }) => {
    await kommando(page, 'help');
    await expect(page.locator('#logg li.info').first()).toContainText('lägg till');
    await expect(page.locator('#logg')).toContainText('DEL VOLV-B');
    await bild(page, 'Hjälp i loggen');
  });

  test('dubbletter läggs inte till', async ({ tickern: page }) => {
    await kommando(page, 'VOLV-B');
    await expect(page.locator('#lista .rad')).toHaveCount(7);
    await expect(page.locator('#logg li').first()).toContainText('finns redan');
  });

  test('CLEAR tömmer loggen och RESET återställer listan', async ({ tickern: page }) => {
    await kommando(page, 'DEL EVO');
    await kommando(page, 'CLEAR');
    await expect(page.locator('#logg li')).toHaveCount(0);
    await kommando(page, 'RESET');
    await expect(page.locator('#lista .rad')).toHaveCount(7);
  });
});
