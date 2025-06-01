// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: true, // true for port 465, false for other ports
//   auth: {
//     user: "ashisrivastava31003@gmail.com",
//     pass: "ygoabcywxkoxakjs",
//   },
// });

// // async..await is not allowed in global scope, must use a wrapper
// async function sendMail(to,subject,text) {
//   // send mail with defined transport object
//   const info = await transporter.sendMail({
//     from: 'ashisrivastava31003@gmail.com"', // sender address
//     to, 
//     subject, 
//     text, 
//     html,
//   });
//   // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
// }

// module.exports = sendMail;





const nodemailer = require("nodemailer");

const sendMail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"PrepNinja" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports=sendMail;