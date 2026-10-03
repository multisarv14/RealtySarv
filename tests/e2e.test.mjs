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
    await tab(p, 'Active'); assert.equal(await rows(p), 36);
    await tab(p, 'Inactive'); assert.equal(await rows(p), 6);
  });
  test('Visits / Booking / Agreement / Possession are all populated', async () => {
    await menu(p, MENU.visits);
    for (const [t, n] of [['Scheduled', 8], ['Pending', 4], ['Completed', 6]]) { await tab(p, t); assert.equal(await rows(p), n, `visits ${t}`); }
    await tab(p, 'Scheduled'); assert.ok(await p.locator('div.sticky').count() >= 5, 'visits grouped by day');
    await menu(p, MENU.booking); await tab(p, 'Token'); assert.equal(await rows(p), 7); await tab(p, 'Confirmed'); assert.equal(await rows(p), 18);
    await menu(p, MENU.agreement);
    for (const [t, n] of [['Drafted', 3], ['Signature', 3], ['ATS', 3], ['Registered', 9]]) { await tab(p, t); assert.equal(await rows(p), n, `agreement ${t}`); }
    await menu(p, MENU.possession);
    for (const [t, n] of [['All', 18], ['Pending', 12], ['Scheduled', 3], ['Handed', 3]]) { await tab(p, t); assert.equal(await rows(p), n, `possession ${t}`); }
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
    for (const [m, tabs] of [[MENU.leads, ['Follow-up', 'Active', 'Inactive']], [MENU.visits, ['Scheduled', 'Pending', 'Completed']], [MENU.booking, ['Token', 'Confirmed']], [MENU.agreement, ['Drafted', 'ATS']], [MENU.possession, ['All']]]) { await menu(p, m); for (const t of tabs) { await tab(p, t); await scan(`${m}/${t}`); } }
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
    const bg = await dark.evaluate(() => getComputedStyle(document.querySelector('div.max-w-\\[75\\%\\]')).backgroundColor);
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

  test('New lead: starts blank, validates inline, Esc closes, backdrop does not', async () => {
    await p.getByRole('button', { name: 'New lead' }).click(); await p.waitForTimeout(300);
    assert.equal(await p.evaluate(() => document.activeElement?.id), 'lm-first');
    assert.equal(await p.evaluate(() => [...document.querySelectorAll('[role=dialog] select')].filter((s) => s.id !== 'lm-owner').every((s) => s.value === '')), true, 'nothing pre-selected');
    await dlg().getByRole('button', { name: 'Create lead' }).click(); await p.waitForTimeout(250);
    assert.ok((await dlg().locator('[role=alert]').count()) >= 3);
    assert.equal(await p.evaluate(() => document.activeElement?.getAttribute('aria-invalid')), 'true', 'focus goes to the first problem');
    await p.mouse.click(5, 5); assert.equal(await p.locator('[role=dialog]').count(), 1, 'backdrop click keeps it open');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); assert.equal(await p.locator('[role=dialog]').count(), 0);
  });
  test('New lead: creates the lead with its owner and first follow-up', async () => {
    await p.getByRole('button', { name: 'New lead' }).click(); await p.waitForTimeout(300);
    await p.fill('#lm-first', 'Test'); await p.fill('#lm-last', 'Lead'); await p.fill('#lm-phone', '+91 90000 11122'); await p.fill('#lm-email', 'test.lead@example.com');
    await p.selectOption('#lm-project', { index: 1 }); await dlg().getByRole('button', { name: '2BHK', exact: true }).click(); await p.selectOption('#lm-loc', { index: 1 }); await p.selectOption('#lm-budget', { index: 1 });
    await p.selectOption('#lm-channel', { index: 1 }); await p.selectOption('#lm-source', { index: 1 }); await p.selectOption('#lm-owner', { label: 'Priya Nair' });
    await p.getByLabel('Schedule the first follow-up').check(); await dlg().getByRole('radio', { name: 'Tomorrow' }).click(); await p.fill('#lm-fu-time', '11:00');
    await dlg().getByRole('button', { name: 'Create lead' }).click(); await p.waitForTimeout(1500);
    const lead = await find('Test Lead'); leadId = lead.id;
    assert.equal(lead.ownerId, 'user-3'); assert.ok(lead.tasks.some((t) => t.title.startsWith('Follow-up')));
    assert.equal((await p.innerText('body')).includes('90000 11122'), false, 'number is not shown');
  });
  test('Edit lead: the saved number stays hidden and is kept', async () => {
    await p.getByText('Test Lead').first().click(); await p.waitForTimeout(400);
    await p.getByRole('button', { name: 'Edit lead' }).click(); await p.waitForTimeout(300);
    assert.equal(await p.inputValue('#lm-phone'), '');
    await p.fill('#lm-last', 'Renamed'); await dlg().getByRole('button', { name: 'Save changes' }).click(); await p.waitForTimeout(1200);
    const lead = await find('Test Renamed'); assert.equal(lead.phone, '+91 90000 11122');
  });
  test('Follow-up: quick dates, owner defaults to you, validates, saves', async () => {
    await p.getByRole('button', { name: 'Schedule follow-up' }).last().click(); await p.waitForTimeout(300);
    assert.match(await dlg().innerText(), /Test Renamed/); assert.equal(await p.inputValue('#followUpAssignedTo'), 'John Doe');
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
