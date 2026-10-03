import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { WEB, DEMO, call, adminToken, finishDemoSetup, hostFor, uniqueSub } from './helpers.mjs';

const COMPANY_URL = `http://${DEMO}.localhost:3000`;
let browser;
before(async () => { browser = await chromium.launch({ args: ['--no-sandbox'] }); await finishDemoSetup(); });
after(async () => { await browser?.close(); });

async function open(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  page.errors = []; page.dialogs = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('dialog', (d) => { page.dialogs.push(d.message()); d.dismiss(); });
  return page;
}
async function signIn(page, url = COMPANY_URL, user = 'ss', pass = 'sss') {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#username');
  await page.fill('#username', user); await page.fill('#password', pass); await page.keyboard.press('Enter');
  await page.waitForTimeout(3200);
}
const menu = async (p, icon) => { await p.locator(`button:has(i.${icon})`).first().click(); await p.waitForTimeout(450); };
const tab = async (p, name) => { await p.getByRole('tab', { name: new RegExp('^' + name, 'i') }).first().click(); await p.waitForTimeout(350); };
const rows = (p) => p.locator('[role=button][tabindex="0"]').count();
const apiLeads = async () => (await call('/leads', { host: hostFor(DEMO), token: await adminToken() })).body;
/** Fill the three-step lead wizard (Contact, More details, First follow-up) and create the lead. */
async function newLead(p, o) {
  const d = () => p.locator('[role=dialog]').last();
  await p.getByRole('button', { name: 'New lead' }).click(); await p.waitForTimeout(300);
  await p.fill('#lm-first', o.first); await p.fill('#lm-last', o.last); await p.fill('#lm-phone', o.phone); await p.fill('#lm-email', o.email);
  if (o.project) await p.selectOption('#lm-project', { label: o.project }); else await p.selectOption('#lm-project', { index: 1 });
  if (o.channel) await p.selectOption('#lm-channel', { label: o.channel }); else await p.selectOption('#lm-channel', { index: 1 });
  if (o.source) await p.selectOption('#lm-source', { label: o.source }); else await p.selectOption('#lm-source', { index: 1 });
  await d().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
  await d().getByRole('button', { name: '2BHK', exact: true }).click(); await p.selectOption('#lm-loc', { index: 1 }); await p.selectOption('#lm-budget', { index: 1 });
  if (o.owner) await p.selectOption('#lm-owner', { label: o.owner });
  if (o.remark) await p.fill('#lm-msg', o.remark);
  await d().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
  if (o.followUp) { await d().getByRole('radio', { name: 'Tomorrow' }).click(); await p.fill('#lm-fu-time', '11:00'); }
  await d().getByRole('button', { name: 'Create lead' }).click(); await p.waitForTimeout(1500);
}
const MENU = { visits: 'fa-map-marked-alt', booking: 'fa-file-signature', agreement: 'fa-file-contract', possession: 'fa-key', leads: 'fa-users' };

describe('landing page', () => {
  let p;
  before(async () => { p = await open(); await p.goto(WEB, { waitUntil: 'networkidle' }); });
  after(async () => { assert.deepEqual(p.errors, []); await p.context().close(); });

  test('one navigation bar with scrolling links and a highlighted section', async () => {
    for (const label of ['Product', 'Pricing', 'FAQ']) {
      await p.evaluate(() => document.querySelector('.custom-scrollbar').scrollTo(0, 0)); await p.waitForTimeout(150);
      await p.locator('header nav[aria-label=Main]').getByRole('button', { name: label }).click(); await p.waitForTimeout(1300);
      assert.ok(await p.evaluate(() => document.querySelector('.custom-scrollbar').scrollTop) > 300, `${label} scrolls`);
      assert.equal(await p.evaluate(() => document.querySelector('header nav[aria-label=Main] button[class*="border-[#1a73e8]"]')?.innerText), label);
    }
  });
  test('modules are one tabbed section and show their own features', async () => {
    await p.evaluate(() => document.getElementById('product').scrollIntoView());
    for (const [tabName, marker] of [['ProjectSarv ERP', 'Approval center'], ['FinanceSarv', 'Bank reconciliation'], ['LeadSarv CRM', 'Channel partners']]) {
      await p.getByRole('tab', { name: tabName }).click();
      assert.ok((await p.locator('#product-panel').innerText()).includes(marker));
    }
  });
  test('only claims the product supports; no stock photos', async () => {
    const text = await p.evaluate(() => document.querySelector('.custom-scrollbar').innerText);
    for (const bad of ['AI nurturing', '14-Day', 'Automatically sync', 'Native sync', 'RealitySarv']) assert.equal(text.includes(bad), false, bad);
    assert.equal(await p.evaluate(() => document.images.length), 0);
  });
  test('FAQ opens; contact email is in the footer', async () => {
    await p.evaluate(() => document.getElementById('faq').scrollIntoView());
    await p.locator('#faq summary').first().click();
    assert.equal(await p.locator('#faq details[open]').count(), 1);
    assert.equal(await p.locator('footer a[href^="mailto:"]').getAttribute('href'), 'mailto:info@multisarv.com');
  });
  test('Privacy and Terms pages open', async () => {
    await p.locator('footer').getByRole('button', { name: 'Privacy' }).click();
    assert.equal(await p.locator('h1').innerText(), 'Privacy Policy');
    await p.getByRole('button', { name: /Back to overview/ }).click();
    await p.evaluate(() => document.querySelector('.custom-scrollbar').scrollTo(0, 99999));
    await p.locator('footer').getByRole('button', { name: 'Terms' }).click();
    assert.equal(await p.locator('h1').innerText(), 'Terms of Service');
  });
  test('mobile: Sign in is visible, the menu works, nothing overflows', async () => {
    const m = await open({ width: 390, height: 800 });
    await m.goto(WEB, { waitUntil: 'networkidle' });
    assert.equal(await m.getByRole('button', { name: 'Sign in' }).first().isVisible(), true);
    await m.getByRole('button', { name: 'Open menu' }).click();
    await m.locator('header nav[aria-label=Mobile]').getByRole('button', { name: 'Pricing' }).click(); await m.waitForTimeout(1200);
    assert.ok(await m.evaluate(() => document.querySelector('.custom-scrollbar').scrollTop) > 300);
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await m.context().close();
  });
});

describe('sign in and workspaces', () => {
  test('main-site sign in finds the company, then the company login works', async () => {
    const p = await open(); await p.goto(WEB, { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Sign in' }).first().click(); await p.waitForSelector('#workspace');
    await p.fill('#workspace', 'does-not-exist'); await p.click('button[type=submit]'); await p.waitForSelector('#login-error-alert');
    await p.fill('#workspace', DEMO); await p.click('button[type=submit]');
    await p.waitForURL(`${COMPANY_URL}/**`); await p.waitForSelector('#username');
    assert.equal(await p.innerText('#active-workspace-name'), 'MultiSarv Pvt.Ltd');
    assert.equal((await p.innerText('body')).includes('Create an account'), false, 'signup hidden by default');
    await p.fill('#username', 'ss'); await p.fill('#password', 'wrong'); await p.click('button[type=submit]');
    await p.waitForFunction(() => document.querySelector('#login-error-alert')?.innerText.trim().length > 0);
    assert.match(await p.innerText('#login-error-alert'), /don.t match/);
    await p.fill('#password', 'sss'); await p.keyboard.press('Enter'); await p.waitForTimeout(3000);
    assert.ok(await p.evaluate(() => !!localStorage.getItem('realtySarvToken')));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(2200);
    assert.equal((await p.innerText('body')).includes('Get started for free'), false, 'session survives a reload');
    assert.deepEqual(p.errors, []); await p.context().close();
  });
  test('unknown company address shows "Workspace not found"', async () => {
    const p = await open(); await p.goto('http://nobody-here-xyz.localhost:3000', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    assert.ok((await p.innerText('body')).includes('Workspace not found')); await p.context().close();
  });
  test('hosts without subdomains can use ?workspace=', async () => {
    const p = await open(); await p.goto('http://127.0.0.1:3000/?workspace=multisarv', { waitUntil: 'networkidle' }); await p.waitForSelector('#username');
    assert.equal(await p.innerText('#active-workspace-name'), 'MultiSarv Pvt.Ltd'); await p.context().close();
  });
});

describe('install wizard', () => {
  test('validation, address check, plan preselect, create, and automatic sign-in', async () => {
    const p = await open(); await p.goto(WEB, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('.custom-scrollbar').scrollTo(0, 99999));
    await p.getByRole('button', { name: 'Choose Ultimate Stack' }).click(); await p.waitForSelector('#adminName');
    await p.click('button[type=submit]');
    assert.equal(await p.locator('[id$="-err"]').count(), 5, 'empty step 1 shows inline errors');
    const sub = uniqueSub('w');
    await p.fill('#adminName', 'QA Owner'); await p.fill('#adminEmail', `owner@${sub}.test`); await p.fill('#adminUsername', 'qaowner'); await p.fill('#adminPhone', '+91 98765 43210');
    await p.fill('#adminPassword', 'Secret#123'); await p.fill('#adminConfirmPassword', 'Secret#123'); await p.click('button[type=submit]');
    await p.fill('#companyName', 'QA Realty'); await p.fill('#subdomain', DEMO); await p.waitForTimeout(1000);
    assert.match(await p.innerText('#subdomain-note'), /taken/);
    await p.click('button[type=submit]'); assert.equal(await p.locator('#companyName').count(), 1, 'cannot continue with a taken address');
    await p.fill('#subdomain', 'Admin'); await p.waitForTimeout(900); assert.match(await p.innerText('#subdomain-note'), /reserved/);
    await p.fill('#subdomain', sub); await p.waitForTimeout(1000); assert.match(await p.innerText('#subdomain-note'), /available/);
    await p.click('button[type=submit]'); await p.waitForSelector('[role=radiogroup]');
    assert.ok((await p.locator('[role=radio][aria-checked=true]').innerText()).includes('Ultimate Stack'), 'plan chosen on the landing page');
    await p.click('button[type=submit]'); await p.waitForSelector('dl');
    assert.ok((await p.innerText('dl')).includes('ProjectSarv ERP'));
    await p.click('button:has-text("Create workspace")');
    await p.waitForURL(`http://${sub}.localhost:3000/**`, { timeout: 25000 }); await p.waitForTimeout(3500);
    const body = await p.innerText('body');
    assert.ok(body.includes('QA Owner') && body.includes('WORKSPACE SETUP'), 'signed in automatically as the owner');
    assert.equal(p.url().includes('handoff'), false);
    assert.deepEqual(p.errors, []); await p.context().close();
  });
  test('mobile: the form is visible at once and nothing overflows', async () => {
    const m = await open({ width: 390, height: 800 }); await m.goto(WEB, { waitUntil: 'networkidle' });
    await m.getByRole('button', { name: 'Open menu' }).click(); await m.getByRole('button', { name: 'Get started for free' }).last().click();
    await m.waitForSelector('#adminName');
    assert.ok(await m.evaluate(() => document.getElementById('adminName').getBoundingClientRect().top < 400));
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); await m.context().close();
  });
});

describe('CRM: lists, groups, agenda and privacy (read-only)', () => {
  let p;
  before(async () => { p = await open({ width: 1440, height: 900 }); await signIn(p); });
  after(async () => { assert.deepEqual(p.errors, [], 'no page errors'); assert.deepEqual(p.dialogs, [], 'no native popups'); await p.context().close(); });

  test('Leads tabs have the expected counts and sections', async () => {
    await tab(p, 'Follow-up'); assert.equal(await rows(p), 10);
    assert.equal((await p.locator('div.sticky').allInnerTexts()).map((x) => x.split('\n')[0]).join('|'), 'Overdue|Today · follow-ups|Tomorrow|Later');
    await tab(p, 'Active'); assert.equal(await rows(p), 44);
    await tab(p, 'Inactive'); assert.equal(await rows(p), 10);
  });
  test('Follow-up list: grouped Overdue, Today, Tomorrow, Later and sorted by the follow-up time, which is the time shown', async () => {
    await tab(p, 'Follow-up');
    const groups = await p.evaluate(() => {
      const first = document.querySelector('div.sticky'); const out = []; let cur = null;
      for (const el of [...first.parentElement.children]) {
        if (el.classList.contains('sticky')) { cur = { name: el.innerText.split('\n')[0].trim(), rows: [] }; out.push(cur); }
        else if (cur && el.getAttribute('role') === 'button') cur.rows.push(el.querySelector('span.shrink-0')?.innerText.trim() || '');
      }
      return out;
    });
    const mins = (l) => { const m = l.match(/(\d{1,2}):(\d{2}) (AM|PM)$/); assert.ok(m, `"${l}" shows a follow-up time`); return ((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2]; };
    assert.deepEqual(groups.map((g) => g.name.replace(/ · follow-ups/, '')), ['Overdue', 'Today', 'Tomorrow', 'Later']);
    for (const g of groups) assert.ok(g.rows.every((l) => /(AM|PM)$/.test(l)), `${g.name}: every row shows a follow-up time, not a last-message time (${g.rows})`);
    for (const g of groups.filter((x) => /Today|Tomorrow/.test(x.name))) { const t = g.rows.map(mins); assert.deepEqual(t, [...t].sort((a, b) => a - b), `${g.name} is in time order (${g.rows})`); }
    for (const g of groups.filter((x) => /Overdue|Later/.test(x.name))) assert.ok(g.rows.every((l) => /,/.test(l)), `${g.name} rows say which day (${g.rows})`);
  });
  test('Lead header shows project, channel, source, owner, lead ID and customer ID', async () => {
    await tab(p, 'Active');
    await p.locator('[role=button][tabindex="0"]').first().click(); await p.waitForTimeout(500);
    const facts = await p.getByTestId('lead-facts').innerText();
    assert.match(facts, /(The Grand Towers|Serene Gardens|Orchid Residency) · .+ › .+ · Owner \w+/);
    const head = await p.locator('div.bg-\\[var\\(--medium-bg\\)\\].pl-3').first().innerText();
    assert.match(head, /Lead ID LD-[0-9A-Z]{6}/); assert.match(head, /Customer ID CU-[0-9A-Z]{6}/);
    assert.equal(/\d{5}\s?\d{5}/.test(head), false, 'no mobile number in the header');
  });
  test('Timeline: one dated history plus what is still to do; Details: a real journey, no made-up score', async () => {
    await menu(p, MENU.booking); await tab(p, 'Confirmed'); await p.locator('[role=button][tabindex="0"]').first().click(); await p.waitForTimeout(500);
    await tab(p, 'Timeline');
    const tl = await p.getByTestId('lead-timeline').innerText();
    assert.match(tl, /STILL TO DO/i); assert.match(tl, /WHAT HAS HAPPENED/i);
    assert.match(tl, /Enquiry received/); assert.match(tl, /Token received ₹/); assert.match(tl, /Payment ₹/);
    await tab(p, 'Details');
    const d = await p.locator('body').innerText();
    assert.match(d, /Journey/i); assert.match(d, /Next step/i); assert.match(d, /step \d of 6/);
    assert.doesNotMatch(d, /Recommendation|Close deal|\bHOT\b/i, 'no invented lead score');
  });
  test('Visits / Booking / Agreement / Possession are all populated', async () => {
    await menu(p, MENU.visits);
    for (const [t, n] of [['Scheduled', 10], ['Pending', 10], ['Completed', 10]]) { await tab(p, t); assert.equal(await rows(p), n, `visits ${t}`); }
    await tab(p, 'Scheduled'); assert.ok(await p.locator('div.sticky').count() >= 5, 'visits grouped by day');
    await menu(p, MENU.booking); await tab(p, 'Token'); assert.equal(await rows(p), 10); await tab(p, 'Confirmed'); assert.equal(await rows(p), 52);
    await menu(p, MENU.agreement);
    for (const [t, n] of [['Drafted', 10], ['Signature', 10], ['ATS', 10], ['Registered', 22]]) { await tab(p, t); assert.equal(await rows(p), n, `agreement ${t}`); }
    await menu(p, MENU.possession);
    assert.equal(await p.locator('[role=tablist]').first().getByRole('tab').filter({ hasText: /^All/ }).count(), 0, 'no All sub-tab in Possession');
    for (const [t, n] of [['Pending', 32], ['Scheduled', 10], ['Handed', 10]]) { await tab(p, t); assert.equal(await rows(p), n, `possession ${t}`); }
  });
  test('every tab shows its count, and it matches the list', async () => {
    for (const m of [MENU.leads, MENU.visits, MENU.booking, MENU.agreement, MENU.possession]) {
      await menu(p, m);
      const tabs = await p.locator('[role=tablist]').first().getByRole('tab').all();
      for (const t of tabs) {
        const label = (await t.innerText()).replace(/\s+/g, ' ').trim();
        const shown = Number(label.match(/(\d+)$/)?.[1]);
        await t.click(); await p.waitForTimeout(300);
        assert.equal(await rows(p), shown, `${m} / ${label}`);
      }
    }
    await menu(p, MENU.leads);
  });
  test('Visits rows: Call and Follow-up appear only on mouse-over (always on touch screens)', async () => {
    await menu(p, MENU.visits); await tab(p, 'Scheduled');
    const row = p.locator('[role=button][tabindex="0"]').first();
    const opacity = () => row.locator('button[aria-label=Call]').evaluate((e) => getComputedStyle(e.parentElement).opacity);
    await p.mouse.move(900, 500); await p.waitForTimeout(250);
    assert.equal(await opacity(), '0', 'hidden until you point at the row');
    await row.hover(); await p.waitForTimeout(300);
    assert.equal(await opacity(), '1', 'visible on hover');
    assert.equal(await row.locator('button[aria-label="Schedule follow-up"]').isVisible(), true);
    const touch = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });
    const t = await touch.newPage(); t.setDefaultTimeout(8000); await signIn(t); await menu(t, MENU.visits);
    const trow = t.locator('[role=button][tabindex="0"]').first();
    assert.equal(await trow.locator('button[aria-label=Call]').evaluate((e) => getComputedStyle(e.parentElement).opacity), '1', 'touch: always visible');
    await touch.close(); await menu(p, MENU.leads);
  });
  test('the agenda belongs to the menu you are in', async () => {
    const agendaText = async () => { await p.getByRole('button', { name: /agenda/i }).click(); await p.waitForTimeout(300); const t = await p.locator('div.absolute.top-full').last().innerText(); await p.getByRole('button', { name: /agenda/i }).click(); return t; };
    await menu(p, MENU.leads); assert.match(await agendaText(), /Follow-ups due/);
    await menu(p, MENU.visits); assert.match(await agendaText(), /Site visits/);
    await menu(p, MENU.booking); assert.match(await agendaText(), /Bookings to act on/);
    await menu(p, MENU.agreement); assert.match(await agendaText(), /Agreements today/);
    await menu(p, MENU.possession); assert.match(await agendaText(), /Possession/);
    await menu(p, MENU.leads);
  });
  test('hovering a row shows Call, Follow-up and Visit buttons', async () => {
    await tab(p, 'Follow-up'); const row = p.locator('[role=button][tabindex="0"]').first(); await row.hover(); await p.waitForTimeout(250);
    assert.equal(await row.locator('button[aria-label=Call]').isVisible(), true);
    assert.equal(await row.locator('button[aria-label="Schedule follow-up"]').isVisible(), true);
    assert.equal(await row.locator('button[aria-label="Schedule site visit"]').isVisible(), true);
  });
  test('mobile numbers are never visible (lists, tabs, tooltips, links)', async () => {
    const leaks = []; const scan = async (where) => { const hits = await p.evaluate(() => { const re = /(\+91[\s\d-]{6,}|\b[6-9]\d{4}[ -]?\d{5}\b|\b\d{10}\b)/; const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (re.test(n.textContent) && n.parentElement?.offsetParent) out.push(n.textContent.trim().slice(0, 30)); document.querySelectorAll('input,textarea').forEach((i) => { if (i.offsetParent && re.test(i.value)) out.push('input'); }); document.querySelectorAll('[title],[aria-label],[placeholder]').forEach((e) => { for (const a of ['title', 'aria-label', 'placeholder']) if (re.test(e.getAttribute(a) || '')) out.push(a); }); return out; }); if (hits.length) leaks.push(`${where}: ${hits.join(',')}`); };
    for (const [m, tabs] of [[MENU.leads, ['Follow-up', 'Active', 'Inactive']], [MENU.visits, ['Scheduled', 'Pending', 'Completed']], [MENU.booking, ['Token', 'Confirmed']], [MENU.agreement, ['Drafted', 'ATS']], [MENU.possession, ['Pending', 'Scheduled']]]) { await menu(p, m); for (const t of tabs) { await tab(p, t); await scan(`${m}/${t}`); } }
    await menu(p, MENU.leads); await p.locator('[role=button][tabindex="0"]').nth(2).click(); await p.waitForTimeout(400);
    for (const t of ['Activity', 'Timeline', 'Details', 'Booking', 'Files']) { await tab(p, t); await scan('lead/' + t); }
    assert.equal(await p.evaluate(() => !!document.querySelector('a[href^="tel:"], a[href*="wa.me"]')), false, 'no tel:/wa.me links (they show in the status bar)');
    assert.deepEqual(leaks, []);
  });
  test('lead view: stage chip, five tabs, search finds by name', async () => {
    await menu(p, MENU.leads); await tab(p, 'Active'); await p.locator('[role=button][tabindex="0"]').first().click(); await p.waitForTimeout(300);
    assert.ok((await p.locator('span[title="Where this lead is in the sales journey"]').innerText()).length > 0);
    assert.deepEqual((await p.locator('[role=tab]').allInnerTexts()).slice(3).map((s) => s.trim()), ['Activity', 'Timeline', 'Details', 'Booking', 'Files']);
    await p.getByLabel('Search leads').fill('Aarav Sharma'); await p.waitForTimeout(400); assert.ok((await rows(p)) >= 1); await p.getByLabel('Search leads').fill('');
  });
  test('chat bubbles follow the app theme, not the operating system', async () => {
    const dark = await open(); await dark.emulateMedia({ colorScheme: 'light' }); await signIn(dark);
    await dark.locator('[role=button][tabindex="0"]').nth(1).click(); await dark.waitForTimeout(400);
    const bg = await dark.evaluate(() => getComputedStyle(document.querySelector('[data-testid=message-bubble]')).backgroundColor);
    assert.equal(bg, 'rgb(32, 44, 51)', 'dark app + light OS still gets dark bubbles'); await dark.context().close();
  });
  test('mobile: chat header, tabs and composer fit the screen', async () => {
    const m = await open({ width: 390, height: 800 }); await signIn(m);
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await m.locator('[role=button][tabindex="0"]').nth(1).click(); await m.waitForTimeout(500);
    const inside = await m.evaluate(() => ['button[aria-label="Call"]', 'button[aria-label="Open WhatsApp"]', 'button[aria-label="Edit lead"]', 'button[aria-label="Save note"]'].every((s) => document.querySelector(s).getBoundingClientRect().right <= innerWidth + 1));
    assert.equal(inside, true); await m.context().close();
  });
});

describe('CRM: forms and popups (these change data)', () => {
  let p, leadId;
  before(async () => { p = await open(); await signIn(p); });
  after(async () => { assert.deepEqual(p.errors, [], 'no page errors'); assert.deepEqual(p.dialogs, [], 'no native alert/confirm popups'); await p.context().close(); });
  const dlg = () => p.locator('[role=dialog]').last();
  const find = async (name) => (await apiLeads()).find((l) => l.name === name);

  test('New lead is a 3-step wizard: starts blank, validates each step, Esc closes, backdrop does not', async () => {
    await p.getByRole('button', { name: 'New lead' }).click(); await p.waitForTimeout(300);
    assert.equal(await p.evaluate(() => document.activeElement?.id), 'lm-project', 'Project comes first');
    const steps = await p.locator('ol[aria-label="Lead steps"]').innerText();
    for (const n of ['Contact', 'More details', 'First follow-up']) assert.match(steps, new RegExp(n));
    assert.equal(await p.locator('[role=dialog] details').count(), 0, 'nothing is hidden behind a toggle');
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.ok((await dlg().locator('[role=alert]').count()) >= 3);
    assert.equal(await p.evaluate(() => document.activeElement?.getAttribute('aria-invalid')), 'true', 'focus goes to the first problem');
    const ids = await p.evaluate(() => [...document.querySelectorAll('[role=dialog] input, [role=dialog] select')].map((e) => e.id));
    assert.deepEqual(ids.slice(0, 5), ['lm-project', 'lm-phone', 'lm-email', 'lm-first', 'lm-last'], 'order: Project, Mobile, Email, Name');
    await p.fill('#lm-first', 'Step'); await p.fill('#lm-last', 'Check'); await p.fill('#lm-phone', '+91 90000 33344'); await p.fill('#lm-email', 'step.check@example.com');
    assert.equal(await p.evaluate(() => [...document.querySelectorAll('[role=dialog] select')].every((s) => s.value === '')), true, 'nothing pre-selected');
    assert.ok((await p.locator('#lm-project').count()) && (await p.locator('#lm-channel').count()) && (await p.locator('#lm-source').count()), 'Project, Channel and Source are on the Contact step');
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.ok((await dlg().locator('[role=alert]').count()) >= 3, 'Project, Channel and Source are required on step 1');
    await p.selectOption('#lm-project', { index: 1 }); await p.selectOption('#lm-channel', { index: 1 }); await p.selectOption('#lm-source', { index: 1 });
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.equal(await p.locator('#lm-project').count(), 0, 'now on More details');
    assert.equal(await p.evaluate(() => [...document.querySelectorAll('[role=dialog] select')].filter((s) => s.id !== 'lm-owner').every((s) => s.value === '')), true, 'nothing pre-selected');
    const order = await p.evaluate(() => [...document.querySelectorAll('[role=dialog] select, [role=dialog] textarea')].map((e) => e.id));
    assert.ok(order.indexOf('lm-budget') > -1 && order.indexOf('lm-owner') === order.indexOf('lm-budget') + 1, 'Owner comes right after Budget');
    assert.ok(order.includes('lm-msg'), 'First remark is visible, not hidden');
    assert.equal(await p.locator('#lm-partner').count(), 0, 'no separate Channel partner dropdown');
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.ok((await dlg().locator('[role=alert]').count()) >= 3, 'step 2 validates too');
    await p.getByRole('button', { name: 'Back' }).click(); await p.waitForTimeout(200);
    assert.equal(await p.inputValue('#lm-first'), 'Step', 'Back keeps what you typed');
    await p.mouse.click(5, 5); assert.equal(await p.locator('[role=dialog]').count(), 1, 'backdrop click keeps it open');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); assert.equal(await p.locator('[role=dialog]').count(), 0);
  });
  test('New lead: a partner is picked as the Source, with a first remark and first follow-up', async () => {
    await newLead(p, { first: 'Test', last: 'Lead', phone: '+91 90000 11122', email: 'test.lead@example.com', owner: 'Priya Nair', channel: 'Channel Partner', source: 'Elite Realty Brokers', remark: 'Wants an east facing flat', followUp: true });
    const lead = await find('Test Lead'); leadId = lead.id;
    assert.equal(lead.ownerId, 'user-3'); assert.ok(lead.tasks.some((t) => t.title.startsWith('Follow-up')));
    assert.equal(lead.channelSource, 'Channel Partner'); assert.equal(lead.leadSource, 'Elite Realty Brokers'); assert.equal(lead.channelPartnerId, 'cp-1');
    assert.match(lead.lastMessage, /east facing/);
    assert.equal((await p.innerText('body')).includes('90000 11122'), false, 'number is not shown');
  });
  test('New lead: warns about the same person in the same project, but only informs for another project; no override', async () => {
    const open1 = async () => { await p.getByRole('button', { name: 'New lead' }).click(); await p.waitForTimeout(300); };
    await open1();
    await p.selectOption('#lm-project', { index: 1 }); await p.fill('#lm-phone', '90000 11122'); await p.waitForTimeout(300);
    const warn = p.getByTestId('duplicate-warning');
    assert.match(await warn.innerText(), /Already a lead in .*\s*Test (Lead|Renamed)/s);
    assert.equal((await dlg().innerText()).includes('90000'), false, 'the number itself is not shown');
    await p.fill('#lm-email', 'someone.else@example.com'); await p.fill('#lm-first', 'Dup'); await p.fill('#lm-last', 'Check'); await p.selectOption('#lm-channel', { index: 1 }); await p.selectOption('#lm-source', { index: 1 });
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.ok(await p.locator('#lm-project').isVisible(), 'blocked on the first step');
    await p.selectOption('#lm-project', { index: 2 }); await p.waitForTimeout(300);
    assert.equal(await p.getByTestId('duplicate-warning').count(), 0); assert.match(await p.getByTestId('duplicate-info').innerText(), /another project/i);
    assert.match(await p.getByTestId('duplicate-info').innerText(), /Add a new lead for .*\s*Shift Test/s, 'both choices are offered');
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.ok(await p.locator('#lm-project').isVisible(), 'an answer is needed before going on');
    assert.match(await p.getByTestId('duplicate-info').innerText(), /Choose what to do/);
    await p.getByRole('radio', { name: /Add a new lead for/ }).check();
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.equal(await p.locator('#lm-project').count(), 0, 'adding a linked lead goes on');
    await p.getByRole('button', { name: 'Back' }).click(); await p.waitForTimeout(200);
    // Shift the existing lead instead (Admin has the Transfer permission).
    const before = await find('Test Lead') || await find('Test Renamed');
    await p.getByRole('radio', { name: /Shift Test/ }).check();
    assert.ok(await dlg().getByRole('button', { name: 'Shift lead' }).isVisible(), 'the button says what it will do');
    await dlg().getByRole('button', { name: 'Shift lead' }).click(); await p.waitForTimeout(1200);
    assert.equal(await p.locator('[role=dialog]').count(), 0, 'the form closes');
    let moved; for (let i = 0; i < 20; i++) { moved = (await apiLeads()).find((l) => l.id === before.id); if (moved.leadProject !== before.leadProject) break; await p.waitForTimeout(300); }
    assert.notEqual(moved.leadProject, before.leadProject, 'the lead is now in the other project');
    assert.equal(moved.customData.projectShifts.length, 1, 'the move is recorded');
    await call('/leads/' + before.id, { method: 'PUT', host: hostFor(DEMO), token: await adminToken(), body: before }); await p.reload(); await p.waitForTimeout(2500);
    await open1();
    await p.selectOption('#lm-project', { index: 1 }); await p.fill('#lm-phone', '90000 11122'); await p.waitForTimeout(300);
    assert.equal(await p.getByLabel(/add anyway/i).count(), 0, 'there is no way to override');
    await p.fill('#lm-phone', '90000 55566'); await p.fill('#lm-email', 'a.different.person@example.com'); await p.waitForTimeout(300);
    await p.fill('#lm-first', 'Other'); await p.fill('#lm-last', 'Person'); await p.selectOption('#lm-channel', { index: 1 }); await p.selectOption('#lm-source', { index: 1 });
    assert.equal(await p.getByTestId('duplicate-warning').count(), 0, 'a different number clears it');
    await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.equal(await p.locator('#lm-project').count(), 0, 'then you can continue');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    await open1(); await p.selectOption('#lm-project', { index: 1 }); await p.fill('#lm-email', 'test.lead@example.com'); await p.waitForTimeout(300);
    await p.getByRole('button', { name: 'Open lead' }).first().click(); await p.waitForTimeout(600);
    assert.equal(await p.locator('[role=dialog]').count(), 0, 'the form closes');
    assert.match(await p.locator('body').innerText(), /Test (Lead|Renamed)/);
  });
  test('New lead: a linked lead shares the customer id; Sales cannot shift without the Transfer permission', async () => {
    const d = () => p.locator('[role=dialog]').last();
    const startOther = async (page) => {
      await page.getByRole('button', { name: 'New lead' }).click(); await page.waitForTimeout(300);
      await page.selectOption('#lm-project', { index: 2 }); await page.fill('#lm-phone', '+91 90000 11122'); await page.waitForTimeout(300);
    };
    await startOther(p);
    await p.getByRole('radio', { name: /Add a new lead for/ }).check(); await p.waitForTimeout(200);
    assert.equal(await p.inputValue('#lm-first'), 'Test', 'the name is copied from the existing customer');
    assert.equal(await p.inputValue('#lm-email'), 'test.lead@example.com', 'so is the email');
    assert.equal(await p.inputValue('#lm-phone'), '+91 90000 11122', 'the mobile number stays what was typed');
    assert.equal(await p.getByRole('radio', { name: /Add a new lead for/ }).isChecked(), true, 'filling the email does not reset the choice');
    await p.fill('#lm-email', 'link.check@example.com'); await p.fill('#lm-first', 'Link'); await p.fill('#lm-last', 'Check'); await p.selectOption('#lm-channel', { index: 1 }); await p.selectOption('#lm-source', { index: 1 });
    await p.getByRole('radio', { name: /Add a new lead for/ }).check();
    await d().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    // The requirement (2BHK, location, budget) was copied from the existing customer, so there is nothing to pick again.
    assert.equal(await d().getByRole('button', { name: '2BHK', exact: true }).getAttribute('aria-pressed'), 'true', 'the requirement is copied');
    await d().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    await d().getByRole('button', { name: 'Create lead' }).click(); await p.waitForTimeout(1500);
    const all = await apiLeads(); const linked = all.find((l) => l.name === 'Link Check'); const first = all.find((l) => l.id === leadId);
    assert.ok(linked.customerId, 'the new lead has a customer id'); assert.equal(first.customerId, linked.customerId, 'the earlier lead shares it');
    assert.notEqual(first.leadProject, linked.leadProject);
    await call('/leads/' + linked.id, { method: 'DELETE', host: hostFor(DEMO), token: await adminToken() });
    const s2 = await open(); await signIn(s2, COMPANY_URL, 'aarav', 'sss');
    await startOther(s2);
    const radio = s2.getByRole('radio', { name: /Shift Test/ });
    assert.equal(await radio.isDisabled(), true, 'shifting is not offered');
    assert.match(await s2.getByTestId('duplicate-info').innerText(), /don't have permission to transfer leads/i);
    assert.equal(await s2.getByRole('radio', { name: /Add a new lead for/ }).isEnabled(), true, 'adding a linked lead still is');
    await s2.context().close();
  });
  test('Edit lead: the saved number stays hidden and is kept', async () => {
    await p.getByText('Test Lead').first().click(); await p.waitForTimeout(400);
    await p.getByRole('button', { name: 'Edit lead' }).click(); await p.waitForTimeout(300);
    assert.equal(await p.inputValue('#lm-phone'), '');
    await p.fill('#lm-last', 'Renamed'); await dlg().getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.equal(await p.locator('#lm-owner').inputValue(), 'user-3', 'owner is editable and shows the current one');
    await dlg().getByRole('button', { name: 'Save changes' }).click(); await p.waitForTimeout(1200);
    const lead = await find('Test Renamed'); assert.equal(lead.phone, '+91 90000 11122');
  });
  test('Follow-up: quick dates, owner defaults to you, validates, saves', async () => {
    await p.getByRole('button', { name: 'Schedule follow-up' }).last().click(); await p.waitForTimeout(300);
    assert.match(await dlg().innerText(), /Test Renamed/); assert.equal(await p.inputValue('#followUpAssignedTo'), 'Sandeep Shah');
    await dlg().getByRole('button', { name: 'Set reminder' }).click(); assert.ok((await dlg().locator('[role=alert]').count()) >= 1);
    await dlg().getByRole('radio', { name: 'In 3 days' }).click(); await p.fill('#followUpTime', '15:30');
    await dlg().getByRole('button', { name: 'Set reminder' }).click(); await p.waitForTimeout(1200);
    assert.equal((await find('Test Renamed')).tasks.filter((t) => t.status === 'Pending').length, 2);
  });
  test('Site visit: pre-filled project, validates, saves', async () => {
    await p.getByRole('button', { name: 'Schedule site visit' }).last().click(); await p.waitForTimeout(300);
    assert.ok((await p.inputValue('#visitProperty')).length > 0);
    await dlg().getByRole('button', { name: 'Schedule visit' }).click(); assert.ok((await dlg().locator('[role=alert]').count()) >= 2);
    await p.fill('#visitDate', new Date(Date.now() + 2 * 864e5).toISOString().split('T')[0]); await p.fill('#visitTime', '12:00');
    await dlg().getByRole('button', { name: 'Schedule visit' }).click(); await p.waitForTimeout(1200);
    assert.equal((await find('Test Renamed')).siteVisits.length, 1);
  });
  test('Token: validates and saves', async () => {
    await menu(p, MENU.visits); await tab(p, 'Completed');
    await p.getByRole('button', { name: 'Take token', exact: true }).first().click(); await p.waitForTimeout(300);
    await dlg().getByRole('button', { name: 'Confirm token' }).click(); assert.equal(await dlg().locator('[role=alert]').count(), 1);
    await p.fill('#tokenAmount', '75000'); await dlg().getByRole('button', { name: 'Confirm token' }).click(); await p.waitForTimeout(1200);
    assert.ok((await apiLeads()).some((l) => l.tokenAmount === 75000));
  });
  test('Booking form: step checks, then a full booking marks the unit Booked', async () => {
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    await menu(p, MENU.visits); await tab(p, 'Completed');
    const name = await p.locator('[role=button][tabindex="0"]').first().locator('span').first().innerText();
    await p.getByRole('button', { name: 'Book', exact: true }).first().click(); await p.waitForTimeout(600);
    const step = async () => (await dlg().locator('ol li[aria-current=step]').innerText()).replace(/\s+/g, ' ');
    const next = async () => { await dlg().getByRole('button', { name: 'Next', exact: true }).click(); await p.waitForTimeout(450); };
    assert.equal(await dlg().locator('ol li').count(), 5);
    await next(); assert.match(await step(), /Applicant/, 'empty step 1 is blocked');
    const fill = async (s, v) => { const el = dlg().locator(s).first(); if (await el.count()) await el.fill(v); };
    await fill('input[id^=relationValue-]', 'S/o Ramesh'); await fill('input[id^=dob-]', '1988-04-12'); await fill('input[id^=pan-]', 'ABCDE1234F'); await fill('input[id^=aadhaar-]', '1234 5678 9012');
    await fill('textarea[id^=presentAddress-]', 'Flat 12, Baner, Pune'); await fill('input[id^=occupation-]', 'Service'); await fill('input[id^=mobile-]', '9000011122');
    assert.equal(await dlg().locator('input[id^=mobile-]').first().getAttribute('type'), 'password', 'mobile shown as dots');
    await p.getByLabel(/same as present/i).check().catch(() => {}); await next(); assert.match(await step(), /Property/);
    await next(); assert.match(await step(), /Property/, 'unit and parking are required');
    await p.selectOption('#unitId', { index: 1 }); await p.selectOption('#parkingId', { index: 1 });
    const unitId = await p.inputValue('#unitId'); await next(); assert.match(await step(), /Cost/);
    await dlg().getByLabel(/Amount \(INR\)/).fill('100000'); await dlg().locator('#transactionId').fill('TXN12345'); const bank = dlg().locator('#bankName'); if (await bank.count()) await bank.fill('HDFC Bank');
    await next(); assert.match(await step(), /Payment Plan/); await next(); assert.match(await step(), /Nominee/);
    await dlg().getByRole('button', { name: 'Confirm booking' }).click(); await p.waitForTimeout(1500);
    assert.equal(await p.locator('[role=dialog]').count(), 0);
    assert.equal((await find(name)).bookingStatus, 'Booked');
    const unit = (await call('/projects', { host: hostFor(DEMO), token: await adminToken() })).body.flatMap((x) => x.inventory).find((u) => u.id === unitId);
    assert.equal(unit.status, 'Booked', 'the chosen unit is no longer available');
  });
  test('Agreement popups: ATS lineup and registration validate and save', async () => {
    await menu(p, MENU.agreement); await tab(p, 'ATS');
    await p.getByRole('button', { name: 'ATS Lineup', exact: true }).first().click(); await p.waitForTimeout(300);
    await dlg().getByRole('button', { name: 'Save appointment' }).click(); assert.ok((await dlg().locator('[role=alert]').count()) >= 2);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await p.getByRole('button', { name: 'Mark Registered', exact: true }).first().click(); await p.waitForTimeout(300);
    await dlg().getByRole('button', { name: 'Mark registered' }).click(); assert.ok((await dlg().locator('[role=alert]').count()) >= 1);
    await p.fill('#regNumber', 'HVL4-7777-2026'); await dlg().getByRole('button', { name: 'Mark registered' }).click(); await p.waitForTimeout(1200);
    assert.ok((await apiLeads()).some((l) => l.customData?.registrationDetails?.regNumber === 'HVL4-7777-2026'));
  });
  test('Ledger: the payment popup validates', async () => {
    await menu(p, MENU.possession); await p.locator('[role=button][tabindex="0"]').nth(3).click(); await p.waitForTimeout(400);
    await tab(p, 'Ledger'); await p.getByRole('button', { name: /record payment|add payment|receipt/i }).first().click(); await p.waitForTimeout(300);
    assert.equal(await dlg().getByRole('heading', { name: 'Record payment' }).isVisible(), true);
    await dlg().getByRole('button', { name: 'Add payment' }).click(); assert.ok((await dlg().locator('[role=alert]').count()) >= 1);
  });
  test('a stale page cannot bring old leads back (only changed leads are saved)', async () => {
    const t = await adminToken(); const h = hostFor(DEMO);
    const stale = await open(); await signIn(stale); // holds the full list in memory
    await call('/leads', { method: 'DELETE', host: h, token: t });
    await call('/leads/qa-only', { method: 'PUT', host: h, token: t, body: { id: 'qa-only', name: 'Only Lead', leadStatus: 'New', messages: [], tasks: [], siteVisits: [], initialInterest: [], bookingStatus: 'Pending', read: true } });
    await stale.locator('[role=button][tabindex="0"]').nth(3).click(); await stale.waitForTimeout(1200);
    const now = (await call('/leads', { host: h, token: t })).body.length;
    await stale.context().close();
    assert.ok(now <= 2, `database has ${now} leads (a stale page used to restore all of them)`);
  });
  test('mobile: a form opens as a bottom sheet', async () => {
    const m = await open({ width: 390, height: 800 }); await signIn(m);
    await m.getByRole('button', { name: 'New lead' }).click(); await m.waitForTimeout(400);
    const box = await m.locator('[role=dialog]').boundingBox();
    assert.ok(Math.abs(box.y + box.height - 800) < 3 && box.width >= 388, 'touches the bottom, full width');
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); await m.context().close();
  });
});

describe('Admin: honest screens and in-app dialogs', () => {
  let p, dialogs;
  const section = async (name) => { await p.locator('aside button, nav button, button').filter({ hasText: new RegExp('^\\s*' + name + '\\s*$', 'i') }).first().click(); await p.waitForTimeout(500); };
  before(async () => {
    p = await open(); dialogs = [];
    p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
    await signIn(p);
    await p.getByTitle('Open Admin Settings Control Panel').click(); await p.waitForTimeout(600);
  });
  after(async () => { await p.context().close(); });

  test('header shows the screen name, not a raw slug', async () => {
    await section('Partners');
    assert.match(await p.locator('h3').first().innerText(), /Admin Console \/ Partners/i);
  });
  test('demo owner has a real name and no example.com address', async () => {
    await section('Users');
    const t = await p.locator('main, body').first().innerText();
    assert.match(t, /Sandeep Shah/); assert.doesNotMatch(t, /example\.com|555/);
  });
  test('Users: list, filters, role badge, "You", and no inline role dropdown', async () => {
    await section('Users');
    const t = await p.locator('body').innerText();
    assert.match(t, /Sandeep Shah\s*YOU/i);
    assert.equal(await p.locator('select[aria-label^="Role for"]').count(), 0);
    await p.getByRole('button', { name: /^Sales\s*\d/ }).click(); await p.waitForTimeout(200);
    assert.equal(await p.locator('li', { hasText: '@aarav' }).count(), 1);
    assert.equal(await p.locator('li', { hasText: '@ss ' }).count(), 0);
    await p.getByRole('button', { name: /^All\s*\d/ }).click();
  });
  test('Users: you cannot deactivate yourself or the last Admin', async () => {
    await p.getByLabel('Deactivate Sandeep Shah').click(); await p.waitForTimeout(300);
    assert.match(await p.locator('[role=status]').innerText(), /cannot deactivate your own/i);
    assert.equal(await p.getByRole('dialog').count(), 0);
  });
  test('Users: deactivating asks first; Edit has role + password, and your own role is locked', async () => {
    await p.getByLabel('Deactivate Sneha Patil').click(); await p.waitForTimeout(300);
    assert.ok(await p.getByRole('dialog').getByRole('button', { name: 'Deactivate' }).isVisible());
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    assert.match(await p.locator('li', { hasText: '@sneha' }).innerText(), /Active/);
    await p.getByLabel('Edit Sandeep Shah').click(); await p.waitForTimeout(300);
    assert.equal(await p.locator('#editUserRole').isDisabled(), true);
    await p.fill('#editNewPassword', 'abc'); await p.getByRole('button', { name: 'Save changes' }).click(); await p.waitForTimeout(250);
    assert.ok((await p.getByRole('dialog').locator('[role=alert]').count()) >= 1);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  });
  test('Users: Projects dialog selects and saves', async () => {
    await p.getByLabel('Assign projects to Rohan Kulkarni').click(); await p.waitForTimeout(300);
    await p.getByRole('dialog').getByLabel('Orchid Residency').uncheck();
    await p.getByRole('dialog').getByLabel('The Grand Towers').check();
    await p.getByRole('dialog').getByRole('button', { name: 'Save assignments' }).click(); await p.waitForTimeout(600);
    assert.match(await p.locator('li', { hasText: '@rohan' }).innerText(), /The Grand Towers/);
    assert.doesNotMatch(await p.locator('li', { hasText: '@rohan' }).innerText(), /Orchid Residency/);
  });
  test('Users menu groups People, Roles & access, Designations and Org chart', async () => {
    if (!(await p.getByRole('button', { name: 'People', exact: true }).first().isVisible())) await section('Users');
    for (const n of ['People', 'Roles & access', 'Designations', 'Org chart']) assert.ok(await p.getByRole('button', { name: n, exact: true }).first().isVisible(), n);
    await p.getByRole('button', { name: 'Designations', exact: true }).first().click(); await p.waitForTimeout(300);
    assert.match(await p.locator('h3').first().innerText(), /Users/i);
    await p.getByRole('button', { name: 'Org chart', exact: true }).first().click(); await p.waitForTimeout(300);
    assert.match(await p.locator('body').innerText(), /Sandeep Shah/);
    await p.getByRole('button', { name: 'People', exact: true }).first().click(); await p.waitForTimeout(300);
  });
  test('Roles & access: Sales loses Visits when switched off, and never sees Admin settings', async () => {
    await p.getByRole('button', { name: 'Roles & access', exact: true }).first().click(); await p.waitForTimeout(400);
    assert.equal(await p.getByLabel('Admin can open Leads').isDisabled(), true);
    await p.getByLabel('Sales can open Visits').click(); await p.waitForTimeout(700);
    const s2 = await open(); await signIn(s2, COMPANY_URL, 'aarav', 'sss');
    const tabs = await s2.locator('button:has(i.fa-map-marked-alt)').count();
    const cog = await s2.getByTitle('Admin settings').count();
    await s2.context().close();
    await p.getByLabel('Sales can open Visits').click(); await p.waitForTimeout(700);
    assert.equal(tabs, 0, 'Visits menu hidden for Sales');
    assert.equal(cog, 0, 'Sales has no Admin settings cog');
    await p.getByRole('button', { name: 'People', exact: true }).first().click(); await p.waitForTimeout(300);
  });
  test('Add user: validates inline in the shared dialog (no browser alert)', async () => {
    await p.getByRole('button', { name: /Add New User/i }).click(); await p.waitForTimeout(300);
    await p.getByRole('dialog').getByRole('button', { name: 'Add user' }).click(); await p.waitForTimeout(250);
    assert.ok((await p.getByRole('dialog').locator('[role=alert]').count()) >= 1);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    assert.equal(await p.getByRole('dialog').count(), 0);
  });
  test('Lead Management, Lead Flow and Task Management are not in Admin (the CRM does these)', async () => {
    const t = await p.locator('body').innerText();
    assert.doesNotMatch(t, /LEAD MANAGEMENT|LEAD FLOW|TASK MANAGEMENT/);
  });
  test('integrations never claim to be connected', async () => {
    await p.locator('button', { hasText: /^\s*Integrations\s*$/i }).first().click(); await p.waitForTimeout(300);
    for (const name of ['Portals', 'Accounting', 'Marketing']) {
      await p.getByRole('button', { name }).first().click(); await p.waitForTimeout(350);
      const t = await p.locator('body').innerText();
      assert.doesNotMatch(t, /\bConnected\b(?!\s*Accounts)/, `${name} shows a fake Connected badge`);
    }
    assert.match(await p.locator('body').innerText(), /Coming soon/i);
  });
  test('Reporting: source bars are drawn', async () => {
    await section('Reports');
    const h = await p.evaluate(() => [...document.querySelectorAll('div.rounded-t-md')].map(e => e.getBoundingClientRect().height));
    assert.ok(h.length > 0 && h.every(x => x > 0), `bar heights ${h}`);
  });
  test('Delete buttons are hidden everywhere, and Edit still opens a form', async () => {
    await section('Settings');
    await p.locator('h4', { hasText: 'Lead Sources' }).first().click(); await p.waitForTimeout(500);
    await p.getByRole('button', { name: /^Edit /i }).first().click(); await p.waitForTimeout(300);
    assert.ok(await p.getByRole('dialog').getByRole('button', { name: 'Save changes' }).isVisible());
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    assert.equal(await p.getByRole('button', { name: /^(Delete|Remove) /i }).count(), 0);
    for (const [menu, sub] of [['Users', 'Designations'], ['Projects', 'Project types'], ['Projects', 'Payment plans']]) {
      if (!(await p.getByRole('button', { name: sub, exact: true }).first().isVisible())) await section(menu);
      await p.getByRole('button', { name: sub, exact: true }).first().click(); await p.waitForTimeout(400);
      assert.equal(await p.getByRole('button', { name: /delete/i }).count() + await p.locator('[title^="Delete"]').count(), 0, sub);
    }
  });
  test('Projects: list view with inventory progress, search, and a detail header', async () => {
    const allProjects = p.getByRole('button', { name: 'All projects', exact: true }).first();
    if (!(await allProjects.isVisible())) await section('Projects');
    await allProjects.click(); await p.waitForTimeout(400);
    const rows = p.locator('[role=button][aria-label^="Open "]');
    assert.equal(await rows.count(), 3);
    assert.match(await p.locator('body').innerText(), /sold\/booked/);
    await p.getByLabel('Search projects').fill('serene'); await p.waitForTimeout(200);
    assert.equal(await rows.count(), 1);
    await rows.first().click(); await p.waitForTimeout(500);
    const head = await p.locator('h3').filter({ hasText: 'Serene Gardens' }).first().locator('xpath=..').innerText();
    assert.match(head, /Ready to Move/);
    assert.doesNotMatch(await p.locator('body').innerText(), /- Inventory/);
  });
  test('Projects: Setup validates inline and Save waits for a change', async () => {
    await p.getByRole('button', { name: 'Setup' }).first().click(); await p.waitForTimeout(300);
    assert.equal(await p.getByRole('button', { name: 'Save changes' }).isDisabled(), true);
    await p.fill('#projectName', ''); await p.getByRole('button', { name: 'Save changes' }).click(); await p.waitForTimeout(250);
    assert.ok((await p.locator('[role=alert]').count()) >= 1);
    await p.fill('#projectName', 'Serene Gardens');
  });
  test('Projects menu groups all project setup: types, stages, unit types, inventory states, payment plans', async () => {
    const sub = (n) => p.getByRole('button', { name: n, exact: true }).first();
    for (const [name, heading] of [['Project types', /Project types/], ['Construction stages', /Construction stages/], ['Unit types', /Unit types/], ['Inventory states', /Inventory states/], ['Payment plans', /Payment/i]]) {
      await sub(name).click(); await p.waitForTimeout(400);
      assert.match(await p.locator('h3').filter({ hasText: heading }).first().innerText(), heading, name);
    }
    await sub('All projects').click(); await p.waitForTimeout(400);
    assert.equal(await p.locator('[role=button][aria-label^="Open "]').count(), 3);
  });
  test('Settings no longer has a Projects tab (it lives under Projects)', async () => {
    await section('Settings');
    assert.equal(await p.getByRole('button', { name: 'Projects', exact: true }).count(), 1, 'only the sidebar entry');
    assert.equal(await p.getByText('Payment Plans', { exact: true }).count(), 0);
  });
  test('Partners: performance comes from real leads; pending partners can be approved', async () => {
    await section('Partners');
    assert.equal(await p.locator('li', { hasText: 'RERA' }).count(), 5);
    const t = await p.locator('body').innerText();
    assert.match(t, /Elite Realty Brokers/); assert.match(t, /\d+ leads? · \d+ bookings?/); assert.match(t, /waiting for approval/);
    await p.getByLabel('Approve Baner Realty Hub').click(); await p.waitForTimeout(600);
    assert.match(await p.locator('li', { hasText: 'Baner Realty Hub' }).innerText(), /Active/);
    assert.doesNotMatch(await p.locator('body').innerText(), /waiting for approval/);
  });
  test('Partners: Edit works and refuses a RERA number that is already registered', async () => {
    await p.getByLabel('Edit Elite Realty Brokers').click(); await p.waitForTimeout(300);
    await p.getByRole('dialog').getByLabel(/Broker RERA/).fill('A51800023456');
    await p.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click(); await p.waitForTimeout(250);
    assert.match(await p.getByRole('dialog').innerText(), /already registered/);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  });
  test('no browser alert/confirm appeared during any of this', () => { assert.deepEqual(dialogs, []); });
});

describe('Operations: lead transfer, lead merge and distribution rules', () => {
  let p; const H = hostFor(DEMO);
  const mk = (id, name, ownerId, phone) => ({ id, name, avatarInitials: 'QA', lastMessage: 'Hello', time: '10:00', chatStatus: 'offline', leadStatus: 'New', read: true, messages: [{ id: id + 'm', content: 'Hello', time: '10:00', sender: 'received' }], email: id + '@qa.test', phone, initialInterest: ['2BHK'], siteVisits: [], tasks: [{ id: id + 't', leadId: id, title: 'Follow-up: Call', dueDate: '2026-10-05', priority: 'Medium', status: 'Pending', assignedTo: 'Aarav Deshmukh' }], channelSource: 'Digital Marketing', leadSource: 'Website', preferredLocation: 'Pune', propertyImages: [], ownerId, leadProject: 'The Grand Towers', leadDate: '2026-10-01', bookingStatus: 'Pending', agreementStatus: 'Drafted', possessionStatus: 'Pending' });
  const get = async (id) => (await call('/leads/' + id, { host: H, token: await adminToken() }));
  const sub = (n) => p.getByRole('button', { name: n, exact: true }).first();
  before(async () => {
    const t = await adminToken();
    for (const l of [mk('qa-t1', 'Qa Transfer One', 'user-2', '+91 90000 00011'), mk('qa-t2', 'Qa Transfer Two', 'user-2', '+91 90000 00012'), mk('qa-d1', 'Qa Dup Person', 'user-4', '+91 90909 00001'), mk('qa-d2', 'Qa Dup Person', 'user-5', '+91 90909 00001')])
      await call('/leads/' + l.id, { method: 'PUT', host: H, token: t, body: l });
    p = await open(); await signIn(p);
    await p.getByTitle('Open Admin Settings Control Panel').click(); await p.waitForTimeout(600);
    await p.locator('aside button, nav button').filter({ hasText: /^\s*Operations\s*$/i }).first().click(); await p.waitForTimeout(500);
  });
  after(async () => {
    const t = await adminToken();
    for (const id of ['qa-t1', 'qa-t2', 'qa-d1', 'qa-d2']) await call('/leads/' + id, { method: 'DELETE', host: H, token: t });
    await call('/distributionRules/dr-1', { method: 'PUT', host: H, token: t, body: { id: 'dr-1', name: 'Grand Towers: share between Aarav and Priya', position: 1, enabled: false, mode: 'Round robin', projects: ['The Grand Towers'], sources: [], assignees: ['user-2', 'user-3'] } });
    await p.context().close();
  });

  test('Operations sits before Settings with Lead transfer, Lead merge and Distribution rules', async () => {
    for (const n of ['Lead transfer', 'Lead merge', 'Distribution rules']) assert.ok(await sub(n).isVisible(), n);
    const names = await p.locator('aside button, nav > ul > li > button').allInnerTexts();
    const flat = names.map((x) => x.trim().toUpperCase());
    assert.ok(flat.indexOf('OPERATIONS') > -1 && flat.indexOf('OPERATIONS') < flat.indexOf('SETTINGS'));
  });
  test('Lead transfer: moves the leads, their open follow-ups, and keeps a history', async () => {
    await sub('Lead transfer').click(); await p.waitForTimeout(300);
    await p.fill('#tr-search', 'Qa Transfer'); await p.waitForTimeout(250);
    await p.getByLabel('Select all shown').check();
    await p.selectOption('#tr-to', { label: 'Priya Nair' }); await p.fill('#tr-reason', 'Aarav on leave');
    await p.getByRole('button', { name: /^Transfer 2/ }).click(); await p.waitForTimeout(300);
    await p.getByRole('dialog').getByRole('button', { name: 'Transfer', exact: true }).click(); await p.waitForTimeout(900);
    const a = (await get('qa-t1')).body;
    assert.equal(a.ownerId, 'user-3'); assert.equal(a.tasks[0].assignedTo, 'Priya Nair'); assert.equal(a.customData.transferHistory[0].reason, 'Aarav on leave');
    assert.match(await p.locator('body').innerText(), /Qa Transfer One: Aarav Deshmukh → Priya Nair/);
  });
  test('Lead merge: finds the same person twice and folds them into one lead', async () => {
    await sub('Lead merge').click(); await p.waitForTimeout(400);
    const group = p.locator('li', { hasText: 'Qa Dup Person' }).filter({ has: p.getByRole('button', { name: 'Review and merge' }) }).first();
    assert.match(await group.innerText(), /Same mobile/i);
    await group.getByRole('button', { name: 'Review and merge' }).click(); await p.waitForTimeout(300);
    await p.getByRole('dialog').getByRole('button', { name: /^Merge 2 into one/ }).click(); await p.waitForTimeout(1000);
    const left = [(await get('qa-d1')).status, (await get('qa-d2')).status].sort();
    assert.deepEqual(left, [200, 404], 'exactly one entry is left');
    const kept = (await get('qa-d1')).status === 200 ? (await get('qa-d1')).body : (await get('qa-d2')).body;
    assert.equal(kept.messages.length, 2); assert.equal(kept.tasks.length, 2); assert.equal(kept.customData.mergedFrom.length, 1);
  });
  test('Distribution rules: switch on, "Try it" predicts, and new leads are shared round robin', async () => {
    await sub('Distribution rules').click(); await p.waitForTimeout(400);
    await p.getByRole('switch', { name: /Turn on Grand Towers/ }).click(); await p.waitForTimeout(600);
    await p.selectOption('#try-project', { label: 'The Grand Towers' }); await p.waitForTimeout(200);
    assert.match(await p.getByText(/Next lead goes to/).innerText(), /Next lead goes to Aarav Deshmukh/);
    await p.getByRole('button', { name: 'Main App' }).click(); await p.waitForTimeout(700);
    for (const [first, owner, phone] of [['Qa Rr One', 'user-2', '+91 90000 22201'], ['Qa Rr Two', 'user-3', '+91 90000 22202']]) { // different numbers: the page still remembers the lead deleted behind its back
      await newLead(p, { first, last: 'Lead', phone, email: first.replace(/ /g, '').toLowerCase() + '@qa.test', project: 'The Grand Towers' });
      const made = (await call('/leads', { host: H, token: await adminToken() })).body.find((l) => l.name === first + ' Lead');
      assert.equal(made.ownerId, owner, first);
      await call('/leads/' + made.id, { method: 'DELETE', host: H, token: await adminToken() });
    }
  });
});

describe('Sales in the app: transfer is not offered without the permission', () => {
  let p; const H = hostFor(DEMO);
  before(async () => {
    // Earlier tests leave almost no leads behind, so bring our own.
    await call('/leads/qa-sales-view', { method: 'PUT', host: H, token: await adminToken(), body: { id: 'qa-sales-view', name: 'Qa Sales View', avatarInitials: 'QS', lastMessage: 'Hello', time: '10:00', chatStatus: 'offline', leadStatus: 'New', read: true, messages: [], email: 'qa.sales.view@qa.test', phone: '+91 90000 66600', initialInterest: ['2BHK'], siteVisits: [], tasks: [], channelSource: 'Digital Marketing', leadSource: 'Website', preferredLocation: 'Pune', propertyImages: [], ownerId: 'user-2', leadProject: 'The Grand Towers', leadDate: '2026-10-01', bookingStatus: 'Pending', agreementStatus: 'Drafted', possessionStatus: 'Pending' } });
    p = await open(); await signIn(p, COMPANY_URL, 'aarav', 'sss');
  });
  after(async () => { await call('/leads/qa-sales-view', { method: 'DELETE', host: H, token: await adminToken() }); await p.context().close(); });
  test('the owner cannot be changed from the lead details or the edit form', async () => {
    await p.getByLabel('Search leads').fill('Qa Sales View'); await p.waitForTimeout(400);
    await p.locator('[role=button][tabindex="0"]').first().click(); await p.waitForTimeout(500);
    await tab(p, 'Details');
    assert.equal(await p.locator('select[title^="Only people with the Transfer permission"]').first().isDisabled(), true, 'details owner');
    await p.getByRole('button', { name: 'Edit lead' }).click(); await p.waitForTimeout(300);
    await p.getByRole('dialog').getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(250);
    assert.equal(await p.locator('#lm-owner').isDisabled(), true, 'edit form owner');
    assert.match(await p.getByRole('dialog').innerText(), /Only people with the Transfer permission/);
  });
});
