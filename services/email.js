
const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: 2525,
//   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
// });

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "e2a42251472ca1",
    pass: process.env.EMAIL_PASS,
  },
});

module.exports.sendEmail = async (to, subject, text) => {
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  require('winston').info(`Email sent to ${to}`);
};
