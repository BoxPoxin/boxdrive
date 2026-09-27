import nodemailer from 'nodemailer';

async function test(user, pass) {
  let transporter = nodemailer.createTransport({
    host: 'smtp.titan.email',
    port: 465,
    secure: true,
    auth: { user, pass }
  });
  
  try {
    await transporter.verify();
    console.log(`Success with ${user}`);
  } catch (err) {
    console.error(`Failed with ${user}:`, err.message);
  }
}

async function run() {
  await test('mukul@boxpox.in', 'ironmanMark@42');
  await test('contact@boxpox.in', 'ironmanMark@42');
}

run();
