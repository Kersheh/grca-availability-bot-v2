const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, './config/config.json'), 'utf-8'));

const EMAIL_FROM = `Nodemailer GRCA Notification <${CONFIG.NOTIFICATION.TRANSPORT.EMAIL}>`;

const smtpTransport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: CONFIG.NOTIFICATION.TRANSPORT.EMAIL,
    pass: CONFIG.NOTIFICATION.TRANSPORT.PASSWORD
  }
});

function _buildEmail(results) {
  let html = '<b>Newly Available GRCA Sites:</b><br>';
  results.forEach(result => {
    const item = `✓ ${result}<br>`;
    html = html.concat(item);
  });

  return html;
}

function _send(results, email) {
  const emailBody = _buildEmail(results);
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'GRCA Site Availability Update (!)',
    html: emailBody
  };

  return smtpTransport.sendMail(mailOptions)
    .then(() => console.log(`Mail sent to ${mailOptions.to}`))
    .catch(err => {
      // swallow error, if initial tested email worked then this failure might be a fluke
      // and we should retry during the next cronjob
      console.error(err);
      console.log(`Failed to send mail to ${mailOptions.to}`);
    });
}

function _sendTest(email) {
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'GRCA Site Availability Test Email',
    html: 'This is a test email to ensure the GRCA Availability Bot can correctly email outbound mail.'
  };

  return smtpTransport.sendMail(mailOptions)
    .then(() => console.log(`Mail sent to ${mailOptions.to}`));
}

function sendAll(results) {
  const emailArray = CONFIG.NOTIFICATION.OUTGOING.EMAIL;

  emailArray.forEach(email => {
    _send(results, email);
  });
}

// this test is required to ensure gmail hasn't blocked nodemailer from wherever this is deployed
function sendTest() {
  const emailArray = CONFIG.NOTIFICATION.OUTGOING.EMAIL;
  return _sendTest(emailArray[0]); // fire single test email, not all recipients need to be tested
}

module.exports = {
  sendAll,
  sendTest
};
