const { sendSupportMessageEmail } = require('../services/emailService');

const isEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

const submitSupportMessage = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();

  if (name.length < 2) {
    return res.status(400).json({ message: 'Please enter your full name.' });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (subject.length < 3) {
    return res.status(400).json({ message: 'Please enter a clear support subject.' });
  }

  if (message.length < 10) {
    return res.status(400).json({ message: 'Please provide a more detailed message.' });
  }

  try {
    const supportInbox =
      process.env.SUPPORT_NOTIFICATION_EMAIL ||
      process.env.ORDER_NOTIFICATION_EMAIL ||
      process.env.BREVO_SENDER_EMAIL;

    let emailResult = { skipped: false };
    try {
      emailResult = await sendSupportMessageEmail({
        to: supportInbox,
        name,
        email,
        subject,
        message,
      });
    } catch (emailError) {
      console.warn('⚠️ sendSupportMessageEmail failed:', emailError.message);
      if (process.env.NODE_ENV === 'production') {
        throw emailError;
      }
    }

    return res.status(201).json({
      message: 'Support request submitted successfully.',
      notified: !emailResult?.skipped,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit support request. Please try again.',
    });
  }
};

module.exports = {
  submitSupportMessage,
};
