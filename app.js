'use strict';
function scrollToPayment(event) {
  if (event) event.preventDefault();
  const target = document.getElementById('price') || document.getElementById('payment');
  if (target) target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
let statusTimer;
function announce(message) {
  const status=document.getElementById('action-status');clearTimeout(statusTimer);
  status.textContent=message;status.hidden=false;
  statusTimer=setTimeout(()=>{status.hidden=true;status.textContent='';},6000);
}
async function copyText(id,button) {
  const text=document.getElementById(id).textContent.trim();let copied=false;
  try {if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;}}catch{}
  if(!copied){
    const previous=document.activeElement,field=document.createElement('textarea');
    field.value=text;field.style.cssText='position:fixed;opacity:0;pointer-events:none';
    document.body.append(field);field.select();
    try{copied=document.execCommand('copy')===true;}catch{copied=false;}
    field.remove();previous?.focus({preventScroll:true});
  }
  if(!copied){announce('تعذر النسخ تلقائيًا. انسخ يدويًا: '+text);return;}
  announce('تم نسخ: '+text);
  if(button.classList.contains('copied'))return;
  const original=button.innerHTML;
  button.innerHTML='<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> COPIED';
  button.classList.add('copied');
  setTimeout(()=>{button.innerHTML=original;button.classList.remove('copied');},2000);
}
(()=>{
  const plans={standard:{name:'Standard',price:900},vip:{name:'VIP',price:2000}};
  const waUrl=text=>'https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(text);
  const store={get(){try{return sessionStorage.getItem('bp-selected-plan-v1');}catch{return null;}},set(value){try{sessionStorage.setItem('bp-selected-plan-v1',value);}catch{}}};
  let selectedPlan=null;
  function track(name,metadata={}){
    if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return;
    try{fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,...metadata}),keepalive:true,credentials:'omit'}).catch(()=>{});}catch{}
  }
  function selectPlan(id){
    if(!Object.hasOwn(plans,id))return;
    selectedPlan=id;store.set(id);const plan=plans[id];
    for(const link of document.querySelectorAll('[data-select-plan]')){
      if(link.dataset.selectPlan===id)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
    }
    document.querySelector('[data-receipt-link]').href=waUrl(`السلام عليكم، عايز أفعّل اشتراكي في Bulletproof Ankle.\nالباقة: ${plan.name}\nالمبلغ: ${plan.price} جنيه\nهرفق إيصال الدفع للمراجعة.`);
  }
  selectPlan(new URLSearchParams(location.search).get('plan')||store.get());
  for(const link of document.querySelectorAll('[data-select-plan]'))link.addEventListener('click',()=>{
    selectPlan(link.dataset.selectPlan);announce(`${plans[selectedPlan].name} — ${plans[selectedPlan].price} EGP`);track('plan_select',{plan:selectedPlan});
  });
  for(const link of document.querySelectorAll('[data-payment-method],[data-receipt-link]'))link.addEventListener('click',event=>{
    if(!selectedPlan){event.preventDefault();announce('اختار Standard أو VIP الأول عشان تتأكد من المبلغ الصحيح.');document.querySelector('[data-select-plan]').focus();return;}
    track(link.hasAttribute('data-receipt-link')?'receipt_click':'payment_click',{plan:selectedPlan,...(link.dataset.paymentMethod?{method:link.dataset.paymentMethod}:{})});
  });
  const fab=document.querySelector('.wa-fab'),payment=document.getElementById('payment');
  if(fab&&payment&&'IntersectionObserver'in window)new IntersectionObserver(entries=>fab.classList.toggle('is-hidden',entries[0].isIntersecting),{threshold:0}).observe(payment);
  if('HTMLDialogElement'in window){
    const dialog=document.createElement('dialog');dialog.id='image-dialog';dialog.setAttribute('aria-label','عرض صورة التطبيق');
    dialog.style.cssText='margin:auto;padding:16px;border:1px solid #E8663D;border-radius:12px;background:#111315;color:#E8E6E1;max-width:94vw;max-height:94vh';
    const close=document.createElement('button');close.type='button';close.textContent='إغلاق';close.style.cssText='display:block;margin:0 0 12px auto;padding:8px 16px;cursor:pointer';
    const expanded=document.createElement('img');expanded.id='expanded-image';expanded.style.cssText='display:block;max-width:85vw;max-height:80vh;object-fit:contain';
    dialog.append(close,expanded);document.body.append(dialog);close.addEventListener('click',()=>dialog.close());
    let opener;dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
    for(const img of document.querySelectorAll('.shot-card img')){
      img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-haspopup','dialog');img.style.cursor='zoom-in';img.dataset.imageOpen='';
      const open=()=>{opener=img;expanded.src=img.currentSrc||img.src;expanded.alt=img.alt;dialog.showModal();};
      img.addEventListener('click',open);img.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
    }
  }
})();
