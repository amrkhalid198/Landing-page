const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/events.js');
function request(body, extra = {}) {
  const req = { method: 'POST', headers: { host: 'landing.example', origin: 'https://landing.example', 'content-type': 'application/json' }, body, ...extra };
  const response = { code: null, headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, end() { return this; } };
  const logs = [];
  const info = console.info;
  console.info = value => logs.push(JSON.parse(value));
  try { handler(req, response); } finally { console.info = info; }
  return { response, logs };
}
test('accepts valid aggregate events without identifying information', () => {
  const {response,logs}=request({name:'plan_select',plan:'vip',utm_source:'instagram'});
  assert.equal(response.code,204);assert.deepEqual(logs,[{type:'landing_event',event:{name:'plan_select',plan:'vip',utm_source:'instagram'}}]);
});
test('rejects review contents, arbitrary fields and invalid values', () => {
  for(const body of [{name:'review_prepare',experience:'private text'},{name:'payment_click',method:'unknown'},{name:'purchase_complete'},{name:'cta_click',utm_campaign:'someone@example.com'},['cta_click'],null]) {
    const {response,logs}=request(body);assert.equal(response.code,400);assert.equal(logs.length,0);
  }
});
test('respects privacy signals and restricts request method, origin and size', () => {
  assert.equal(request({name:'cta_click'},{method:'GET'}).response.code,405);
  assert.equal(request({name:'cta_click'},{headers:{host:'landing.example',origin:'https://unrelated.example','content-type':'application/json'}}).response.code,403);
  assert.equal(request({name:'cta_click'},{headers:{host:'landing.example',origin:'https://landing.example','content-type':'text/plain'}}).response.code,415);
  const privateRequest=request({name:'cta_click'},{headers:{dnt:'1'}});assert.equal(privateRequest.response.code,204);assert.equal(privateRequest.logs.length,0);
  assert.equal(request({name:'cta_click'},{headers:{host:'landing.example',origin:'https://landing.example','content-type':'application/json','content-length':'2000'}}).response.code,413);
});
