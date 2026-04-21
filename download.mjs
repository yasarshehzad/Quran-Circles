import fs from 'fs';

async function download() {
  try {
    const res = await fetch('https://drive.google.com/uc?export=download&id=1OIeD0zt4UvqiwExJW_vX5QomSEdgwxYX');
    if (!res.ok) {
      console.error('Failed to download:', res.status, res.statusText);
      return;
    }
    const contentType = res.headers.get('content-type');
    let ext = contentType.includes('svg') ? 'svg' : contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'bin';
    const buffer = await res.arrayBuffer();
    
    // Explicitly write the file
    fs.writeFileSync('./public/favicon.svg', Buffer.from(buffer));
    console.log('Successfully wrote to public/favicon.svg!');
  } catch (e) {
    console.error(e);
  }
}

download();
