import axios from "axios";

export const triggerWebhook = async (url: string, payload: object) => {
    try {
        await axios.post(url, payload, { timeout: 5000 }); // Set a 5-second timeout
        console.log(`Webhook triggered successfully: ${url}`);
    } catch (err) {
        console.error(`Failed to trigger webhook for ${url}`, err.message);
    }
};
