const sendMail = require("@sendgrid/mail");
require("dotenv").config();

const { SENDGRID_API_KEY } = process.env;

sendMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async (data) => {
  const email = { ...data, from: "berty.jon32@gmail.com" };
  await sendMail.send(email);
  console.log(email);
  return true;
};

module.exports = sendEmail;