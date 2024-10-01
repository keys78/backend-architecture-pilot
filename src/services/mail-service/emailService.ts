import nodemailer, { SendMailOptions, SentMessageInfo } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: false,
    port: 25,
    auth: {
      user: process.env.EMAIL_FORM,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions: SendMailOptions = {
    from: process.env.EMAIL_FORM,
    to: options.to,
    subject: options.subject,
    html: options.text,
  };

  transporter.sendMail(
    mailOptions,
    (err: Error | null, info: SentMessageInfo) => {
      if (err) {
        console.log('Error occurred:', err.message);
      } else {
        console.log('Email sent:', info.response);
      }
    }
  );
};

export default sendEmail;
