const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {createServer}=require('../scripts/preview.cjs');
let server,browser,url;
before(async()=>{server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function open(width=390,extra={}){const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',...extra});const page=await context.newPage();await page.goto(process.env.RELEASE_URL||url,{waitUntil:'networkidle'});return {context,page};}
test('original page wording and section order are restored exactly',async()=>{
 const {context,page}=await open(390,{javaScriptEnabled:false});try{
  const text=await page.evaluate(()=>{const body=document.body.cloneNode(true);body.querySelectorAll('script,style').forEach(el=>el.remove());return body.textContent.replace(/\s+/g,' ').trim();});
  const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'original-copy.json'),'utf8'));
  assert.equal(crypto.createHash('sha256').update(text).digest('hex'),expected.sha256);
  assert.equal(await page.locator('#review-dialog,.review-cta,.mobile-enroll,.site-header').count(),0);
 }finally{await context.close();}
});
test('plan selection persists and the receipt carries the correct plan and amount',async()=>{
 const {context,page}=await open();try{
  for(const [id,name,price]of [['standard','Standard',900],['vip','VIP',2000]]){
   await page.locator(`[data-select-plan=${id}]`).click();
   assert.match(decodeURIComponent(await page.locator('[data-receipt-link]').getAttribute('href')),new RegExp(`الباقة: ${name}\\nالمبلغ: ${price}`));
  }
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-select-plan=vip]').getAttribute('aria-current'),'true');
 }finally{await context.close();}
});
test('payment asks for a plan, while campaign parameters and deep links survive load',async()=>{
 const {context,page}=await open();try{
  await page.locator('#visa-btn').click();assert.match(await page.locator('#action-status').textContent(),/اختار Standard/);
  await page.goto((process.env.RELEASE_URL||url)+'?utm_source=check&plan=vip#price',{waitUntil:'networkidle'});
  assert.match(page.url(),/utm_source=check&plan=vip#price$/);assert.ok(await page.evaluate(()=>scrollY>0));
  assert.equal(await page.locator('[data-select-plan=vip]').getAttribute('aria-current'),'true');
  assert.equal(await page.locator('[data-payment-method=vodafone]').getAttribute('href'),'https://vf.eg/vfcash?id=mt&qrId=AlTpBf');
 }finally{await context.close();}
});
test('all ten FAQs work with Enter and Space and fully reveal their answers',async()=>{
 const {context,page}=await open();try{
  assert.equal(await page.locator('.faq-item').count(),10);
  for(const item of await page.locator('.faq-item').all()){
   await item.locator('summary').focus();await page.keyboard.press('Enter');assert.notEqual(await item.getAttribute('open'),null);
   const d=await item.locator('.faq-body').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight}));assert.ok(d.client>=d.scroll-1);
   await page.keyboard.press('Space');assert.equal(await item.getAttribute('open'),null);
  }
 }finally{await context.close();}
});
test('clipboard handles success, absent APIs, synchronous errors and denied legacy copy truthfully',async()=>{
 const {context,page}=await open();const errors=[];page.on('pageerror',e=>errors.push(e.message));try{
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.copied=t;}}}));
  await page.locator('[data-copy=vf-number]').click();assert.equal(await page.evaluate(()=>window.copied),'01017201075');
  await page.waitForTimeout(2100);
  for(const mode of ['absent','sync','async']){
   await page.evaluate(mode=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='absent'?undefined:{writeText:mode==='sync'?()=>{throw Error('denied');}:async()=>{throw Error('denied');}}});document.execCommand=()=>false;},mode);
   await page.locator('[data-copy=ip-number]').click();assert.match(await page.locator('#action-status').textContent(),/يدويًا/);assert.doesNotMatch(await page.locator('[data-copy=ip-number]').textContent(),/COPIED/);
  }
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
test('screenshot enlargement is keyboard accessible and restores focus',async()=>{
 const {context,page}=await open();try{const img=page.locator('[data-image-open]').first();await img.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#image-dialog').evaluate(el=>el.open),true);await page.keyboard.press('Escape');assert.equal(await img.evaluate(el=>el===document.activeElement),true);}finally{await context.close();}
});
test('sharing uses the corrected ankle artwork and real public metadata',async()=>{
 const {context,page}=await open();try{
  const origin='https://landing-page-five-pied-29.vercel.app/';
  assert.equal(await page.locator('[rel=canonical]').getAttribute('href'),origin);
  assert.equal(await page.locator('[property="og:image"]').getAttribute('content'),origin+'hero-ankle-aligned.jpg');
  assert.equal(await page.locator('[name="twitter:image"]').getAttribute('content'),origin+'hero-ankle-aligned.jpg');
  assert.equal(await page.locator('[property="og:image:width"]').getAttribute('content'),'1200');
  assert.equal(await page.locator('[property="og:image:height"]').getAttribute('content'),'800');
  const hero=page.locator('img[src="hero-ankle-aligned.webp"]');await hero.evaluate(el=>el.decode());
  assert.deepEqual(await hero.evaluate(el=>[el.naturalWidth,el.naturalHeight]),[1200,800]);
  assert.equal((await page.request.get((process.env.RELEASE_URL||url)+'hero-ankle-aligned.jpg')).status(),200);
  assert.equal(await page.locator('a[href^="http:"]').count(),0);
 }finally{await context.close();}
});
test('FAQs and contact/payment links work without JavaScript',async()=>{
 const {context,page}=await open(390,{javaScriptEnabled:false});try{
  await page.locator('summary').first().click();assert.notEqual(await page.locator('details').first().getAttribute('open'),null);
  for(const link of await page.locator('[data-wa-text]').all())assert.match(await link.getAttribute('href'),/^https:\/\/wa.me\//);
  await page.locator('[data-select-plan=vip]').click();assert.match(page.url(),/#pay-methods$/);
 }finally{await context.close();}
});
test('restored phone/tablet/desktop layout loads all images without page overflow or script errors',async()=>{
 const out=process.env.SCREENSHOT_DIR||path.resolve(__dirname,'../../restored-preview');fs.mkdirSync(out,{recursive:true});
 for(const width of [320,390,768,1440]){
  const {context,page}=await open(width);const errors=[];page.on('pageerror',e=>errors.push(e.message));try{
   await page.evaluate(async()=>{for(const img of document.images)if(img.getAttribute('src')){img.loading='eager';await img.decode();}});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(out,`hero-${width}.png`)});
   await page.locator('#payment').screenshot({path:path.join(out,`payment-${width}.png`)});
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
});
