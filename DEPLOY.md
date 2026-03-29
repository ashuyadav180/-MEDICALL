# Deploy

## Backend on Render

1. Push this project to GitHub.
2. In Render, create a new Blueprint or Web Service from the repo.
3. Use the `render.yaml` at the repo root.
4. Set these env vars in Render:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `BACKEND_PUBLIC_URL`
   - `CLIENT_URLS`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
   - `ORDER_NOTIFICATION_EMAIL`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_NOTIFY_TO`
   - `WHATSAPP_GRAPH_VERSION`

## Frontend on Vercel

1. Import `medical-shop` as the Vercel project root.
2. Framework preset: `Vite`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add these env vars in Vercel:
   - `VITE_API_URL`
   - `VITE_SOCKET_URL`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## Required values

- `VITE_API_URL` and `VITE_SOCKET_URL` should point to your Render backend URL.
- `CLIENT_URLS` should include your Vercel frontend URL, comma-separated if more than one.
- `BACKEND_PUBLIC_URL` should be your Render backend URL.
- `BREVO_SENDER_EMAIL` must be a verified Brevo sender email.
- `ORDER_NOTIFICATION_EMAIL` is where new-order email alerts should be sent.
- WhatsApp vars are optional until you activate Meta Cloud API credentials.
