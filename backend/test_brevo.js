const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
dotenv.config();

const testBrevo = async () => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    console.log('Testing Brevo with:');
    console.log('API Key:', apiKey ? 'FOUND' : 'MISSING');
    console.log('Sender Email:', senderEmail);

    if (!apiKey || !senderEmail) {
        console.error('Missing configuration');
        return;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { email: senderEmail, name: 'Bablu Medical Test' },
                to: [{ email: senderEmail, name: 'Test' }],
                subject: 'Diagnostic Test',
                textContent: 'Testing Brevo API'
            })
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
};

testBrevo();
