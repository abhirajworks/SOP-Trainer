const fs = require('fs');
const PDFDocument = require('pdfkit');

async function run() {
  await new Promise((resolve) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream('dummy2.pdf');
    doc.pipe(stream);
    doc.fontSize(25).text('This is a test PDF for SOP Trainer with more than 20 characters of text to extract.', 100, 100);
    doc.end();
    stream.on('finish', resolve);
  });

  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream('dummy2.pdf'));

  console.log("Sending to API...");
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('http://localhost:3000/api/extract-pdf', {
      method: 'POST',
      body: form
    });
    
    if (res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      console.log("Status:", res.status);
      console.log("Response JSON:", data);
    } else {
      const text = await res.text();
      console.log("Status:", res.status);
      console.log("Response Text (truncated):", text.substring(0, 500));
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
