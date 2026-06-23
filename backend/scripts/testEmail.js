require('dotenv').config();
const nodemailer = require('nodemailer');

const test = async () => {
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('\n✓ SMTP connection verified successfully!');

    await transporter.sendMail({
      from: `"AssetCare Pro" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'AssetCare Pro SMTP Test',
      text: 'Your SMTP setup is configured correctly.',
      html: '<h2>Email is working!</h2><p>Your SMTP setup is configured correctly.</p>'
    });
    console.log('✓ Test email sent to', process.env.SMTP_USER);
  } catch (err) {
    console.error('\n✗ SMTP Error:', err.message);
    if (err.message.includes('Invalid login')) {
      console.log('\n→ Fix: Make sure you are using a Gmail App Password (not your regular password).');
      console.log('   Go to myaccount.google.com → Security → App Passwords');
    }
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      console.log('\n→ Fix: SMTP port or host is blocked. Try port 465 with secure:true');
    }
  }
  process.exit(0);
};

test();
