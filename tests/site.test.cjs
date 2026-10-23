const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('../scripts/preview.cjs');
let server, browser, url;
const screenshots = process.env.SCREENSHOT_DIR || path.resolve(__dirname, '../../fix-preview');
before(async () => {
  server = createServer(); await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  url = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ headless:true, ...(process.env.BROWSER_CHANNEL ? { channel:process.env.BROWSER_CHANNEL } : {}) });
  fs.mkdirSync(screenshots,{recursive:true});
});
after(async () => { await browser?.close(); await new Promise(resolve=>server?.close(resolve)); });
async function pageFor(width=390,height=844, extra={}) {
  const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce',...extra});
  const page = await context.newPage();
  await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  return {context,page};
}

test('both plan choices retain the correct amount through reload and receipt handoff',async()=>{
  const {context,page}=await pageFor();
  try{
    await page.locator('[data-select-plan=standard]').click();
    assert.match(await page.locator('#selected-plan-text').textContent(),/Standard — 900 EGP/);
    assert.match(decodeURIComponent(await page.locator('[data-receipt-link]').getAttribute('href')),/الباقة: Standard\nالمبلغ: 900/);
    await page.locator('[data-select-plan=vip]').click();
    assert.match(await page.locator('#selected-plan-text').textContent(),/VIP — 2,000 EGP/);
    await page.reload({waitUntil:'networkidle'});
    assert.match(await page.locator('#selected-plan-text').textContent(),/VIP — 2,000 EGP/);
    assert.match(decodeURIComponent(await page.locator('[data-receipt-link]').getAttribute('href')),/الباقة: VIP\nالمبلغ: 2000/);
  }finally{await context.close();}
});

test('payment cannot proceed without selecting a plan; campaign and deep links are preserved',async()=>{
  const {context,page}=await pageFor();
  try{
    await page.locator('#visa-btn').click();
    assert.equal(await page.locator('#payment-error').isVisible(),true);
    await page.goto(url+'?utm_source=test&plan=vip#price',{waitUntil:'networkidle'});
    assert.match(page.url(),/utm_source=test&plan=vip#price$/);
    assert.match(await page.locator('#selected-plan-text').textContent(),/VIP/);
    assert.equal(await page.locator('[data-payment-method=vodafone]').getAttribute('href'),'https://vf.eg/vfcash?id=mt&qrId=AlTpBf');
    assert.ok(await page.evaluate(()=>scrollY>0));
  }finally{await context.close();}
});

test('all FAQs are keyboard operable, and answer content fits after expansion',async()=>{
  const {context,page}=await pageFor();
  try{
    assert.equal(await page.locator('#faq details').count(),10);
    for(const item of await page.locator('#faq details').all()) {
      const summary=item.locator('summary');await summary.focus();await page.keyboard.press('Enter');
      assert.notEqual(await item.getAttribute('open'),null);
      const dimensions=await item.locator('.faq-body').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight}));
      assert.ok(dimensions.client>=dimensions.scroll-1);
      await page.keyboard.press('Space');assert.equal(await item.getAttribute('open'),null);
    }
  }finally{await context.close();}
});

test('clipboard success and unavailable/rejected/failed fallback states are truthful',async()=>{
  const {context,page}=await pageFor();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.copied=t;}}}));
    await page.locator('[data-copy=vf-number]').click();
    assert.equal(await page.evaluate(()=>window.copied),'01017201075');
    await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.includes('تم نسخ'));
    await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});document.execCommand=()=>false;});
    await page.locator('[data-copy=vf-number]').click();
    assert.match(await page.locator('#copy-status').textContent(),/يدويًا/);
    assert.doesNotMatch(await page.locator('[data-copy=vf-number]').textContent(),/تم النسخ/);
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked');}}}));
    await page.locator('[data-copy=ip-number]').click();
    assert.match(await page.locator('#copy-status').textContent(),/يدويًا/);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('review form prepares honest private or publishable feedback without sending its contents to analytics',async()=>{
  const {context,page}=await pageFor();const events=[];
  try{
    await page.route('**/api/events',async route=>{events.push(route.request().postDataJSON());await route.fulfill({status:204});});
    await page.locator('.review-cta').click();
    assert.equal(await page.locator('#review-dialog').evaluate(el=>el.open),true);
    await page.locator('[name=name]').fill('أحمد');await page.locator('[name=sport]').fill('كرة قدم');
    await page.locator('[name=duration]').selectOption({label:'من 5 لـ8 أسابيع'});
    await page.locator('[name=rating]').selectOption('2 من 5');
    await page.locator('[name=experience]').fill('الخطة واضحة، لكن محتاج شرح أكتر لبعض التمارين.');
    await page.locator('#review-form button[type=submit]').click();
    let message=decodeURIComponent(await page.locator('#review-send').getAttribute('href'));
    assert.match(message,/2 من 5/);assert.match(message,/غير موافق؛ الرأي خاص/);
    await page.locator('[name=consent]').check();await page.locator('#review-form button[type=submit]').click();
    message=decodeURIComponent(await page.locator('#review-send').getAttribute('href'));
    assert.match(message,/إذن النشر بالاسم الأول والرياضة: موافق/);
    assert.ok(events.every(e=>!('experience'in e)&&!('name'in e&&e.name==='أحمد')&&!('rating'in e)));
    await page.keyboard.press('Escape');assert.equal(await page.locator('#review-dialog').evaluate(el=>el.open),false);
    assert.equal(await page.locator('.review-cta').evaluate(el=>el===document.activeElement),true);
  }finally{await context.close();}
});

test('app screenshots enlarge accessibly and return focus on Escape',async()=>{
  const {context,page}=await pageFor();
  try{const button=page.locator('[data-image-open]').first();await button.click();assert.equal(await page.locator('#image-dialog').evaluate(el=>el.open),true);assert.ok(await page.locator('#expanded-image').getAttribute('alt'));await page.keyboard.press('Escape');assert.equal(await button.evaluate(el=>el===document.activeElement),true);}finally{await context.close();}
});

test('metadata and public proof contain real URLs and the supplied enrollment count, without invented reviews',async()=>{
  const {context,page}=await pageFor();
  try{
    assert.equal(await page.locator('main').count(),1);assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('[rel=canonical]').getAttribute('href'),'https://landing-page-five-pied-29.vercel.app/');
    assert.equal(await page.locator('.review-count b').textContent(),'6');
    assert.match(await page.locator('.plan-note').textContent(),/لحد العودة للرياضة/);
    const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    assert.equal(schema.aggregateRating,undefined);assert.equal(schema.review,undefined);
    assert.equal(await page.locator('a[href^="http:"]').count(),0);
    const source=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
    assert.doesNotMatch(source,/SITE_ORIGIN_PLACEHOLDER|onclick=|مستحيل|مش ممكن ينكسر|استرداد|استرجاع|مؤهل|خلال ساعات/);
    for(const file of ['robots.txt','sitemap.xml','favicon.ico','apple-touch-icon.png'])assert.equal((await page.request.get(url+file)).status(),200);
  }finally{await context.close();}
});

test('primary actions and meaningful muted text meet normal-text contrast at their rendered sizes',async()=>{
  const {context,page}=await pageFor();
  try{
    const results=await page.evaluate(()=>{
      const lum=color=>{const parts=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return parts[0]*.2126+parts[1]*.7152+parts[2]*.0722;};
      return ['.hero .cta-btn-clean','.plan-cta-vip','.wa-btn','.cta-note'].map(selector=>{const el=document.querySelector(selector),style=getComputedStyle(el);const fg=lum(style.color),bg=lum(selector==='.cta-note'?'rgb(12,14,16)':style.backgroundColor);return {selector,ratio:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};});
    });
    for(const r of results)assert.ok(r.ratio>=4.5,`${r.selector}: ${r.ratio}`);
  }finally{await context.close();}
});

test('without JavaScript, the offer, FAQs, payment links and feedback contact remain usable',async()=>{
  const {context,page}=await pageFor(390,844,{javaScriptEnabled:false});
  try{
    await page.locator('#faq summary').first().click();
    assert.notEqual(await page.locator('#faq details').first().getAttribute('open'),null);
    assert.match(await page.locator('.review-cta').getAttribute('href'),/^https:\/\/wa.me\//);
    await page.locator('[data-select-plan=vip]').click();
    assert.match(page.url(),/#pay-methods$/);
    assert.ok((await page.locator('#visa-btn').getAttribute('href')).startsWith('https://accept.paymob.com/'));
  }finally{await context.close();}
});

test('phone, tablet, desktop and 200% zoom layouts do not clip content; hero CTA is visible on desktop',async()=>{
  for(const [width,height] of [[320,812],[390,844],[768,1024],[1440,900]]){
    const {context,page}=await pageFor(width,height);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].filter(i=>i.getAttribute('src')).map(i=>i.decode()));});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px page overflow`);
      const issues=await page.evaluate(()=>[...document.querySelectorAll('.wrap h2,.wrap h3,.wrap p,.plan-card,.test-chip,.hero-copy,.site-header')].filter(el=>{const r=el.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5||el.scrollWidth>el.clientWidth+2;}).map(el=>el.className));
      if(issues.length){await page.locator('#payment').screenshot({path:path.join(screenshots,`clipping-${width}.png`)});console.log(await page.locator('.plan-card-vip').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,children:[...el.querySelectorAll('*')].map(n=>({tag:n.tagName,cls:n.className,rect:n.getBoundingClientRect().toJSON(),client:n.clientWidth,scroll:n.scrollWidth})).filter(n=>n.scroll>n.client+2)})));}
      assert.deepEqual(issues,[],`${width}px clipping`);
      if(width===1440){assert.ok(await page.locator('.hero .cta-btn-clean').evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));}
      if(width===390){assert.ok(await page.locator('#price').evaluate(el=>el.getBoundingClientRect().top+scrollY<8500),'Pricing should be substantially earlier than the audited 12,921px position');}
      await page.screenshot({path:path.join(screenshots,`hero-${width}.png`)});
      for(const selector of ['#inside','#reviews','#payment'])await page.locator(selector).screenshot({path:path.join(screenshots,`${selector.slice(1)}-${width}.png`)});
      if(width===390){await page.locator('#system').scrollIntoViewIfNeeded();await page.waitForTimeout(150);assert.equal(await page.locator('.mobile-enroll').isVisible(),true);await page.locator('#payment').scrollIntoViewIfNeeded();await page.waitForTimeout(150);assert.equal(await page.locator('.mobile-enroll').isVisible(),false);assert.ok(await page.locator('.wa-fab').evaluate(el=>getComputedStyle(el).visibility==='hidden'));}
      if(width===1440){await page.evaluate(()=>document.documentElement.style.zoom='2');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
      assert.deepEqual(errors,[]);
      console.log(JSON.stringify({width,height,pageHeight:await page.evaluate(()=>document.documentElement.scrollHeight)}));
    }finally{await context.close();}
  }
});
