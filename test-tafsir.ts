import fetch from 'node-fetch';

async function test() {
  const verseKey = '1:1';
  const tafsirId = 169;
  const baseUrl = 'https://api.quran.com/api/v4';
  
  const res = await fetch(baseUrl + `/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data).substring(0, 500));
}

test();
