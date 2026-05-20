import fetch from 'node-fetch';
async function test() {
  const url = "https://prelive-oauth2.quran.foundation/oauth2/auth?client_id=quran-circles-demo&redirect_uri=https://qurancircles.site&response_type=code&scope=openid&state=123";
  const res = await fetch(url, { redirect: 'manual' });
  console.log(res.status, res.headers.get('location') || 'no location');
  const text = await res.text();
  console.log(text.substring(0, 500));
}
test();
