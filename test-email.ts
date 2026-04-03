import { sendEmail, getEmailTemplate } from './lib/mail';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('Sending test email to: ibudiana@student.ciputra.ac.id...');
  const result = await sendEmail({
    to: 'ibudiana@student.ciputra.ac.id',
    subject: 'Tes Koneksi SMTP SIMARU',
    html: getEmailTemplate(
      'Koneksi Berhasil!',
      'Ini adalah email percobaan untuk memastikan integrasi SMTP Google di sistem SIMARU sudah berjalan dengan benar.',
      '/',
      'Buka SIMARU'
    )
  });

  if (result.success) {
    console.log('✅ Email berhasil dikirim!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Email gagal dikirim.');
    console.error(result.error);
  }
}

test();
