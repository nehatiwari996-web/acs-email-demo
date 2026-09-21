const { app } = require('@azure/functions');
const { EmailClient } = require('@azure/communication-email');

app.http('sendEmail', {
    methods: ['POST'],
    authLevel: 'function', // requires the function key on calls — good enough for a demo
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { to, subject, message } = body;

            if (!to) {
                return { status: 400, jsonBody: { status: "error", message: "Missing 'to' address" } };
            }

            const connectionString = process.env.ACS_CONNECTION_STRING;
            const senderAddress = process.env.ACS_SENDER_ADDRESS; // e.g. DoNotReply@xxxxxxx.azurecomm.net

            const client = new EmailClient(connectionString);

            const emailMessage = {
                senderAddress: senderAddress,
                content: {
                    subject: subject || "Demo Email from ACS",
                    plainText: message || "This is a test email sent via Azure Communication Services.",
                },
                recipients: {
                    to: [{ address: to }],
                },
            };

            context.log(`Sending email to ${to}`);
            const poller = await client.beginSend(emailMessage);
            const result = await poller.pollUntilDone();

            return {
                status: 200,
                jsonBody: { status: "success", messageId: result.id, operationStatus: result.status }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { status: "error", message: err.message } };
        }
    }
});
