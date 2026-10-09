SHAMRUTH ECO ASSETS WEBSITE

Run locally:
1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run: npm install
4. Run: npm start
5. Open http://localhost:3000

Website includes:
- Uploaded property photographs in assets/
- Generic cottage labels; no individual villa names
- Three clickable phone numbers
- WhatsApp links for all three numbers:
  +91 7867002728
  +91 9786454541
  +91 9786938613
- Booking enquiries are validated and saved to SQLite in data/enquiries.sqlite
- Each saved enquiry receives a reference number
- WhatsApp booking opens a prefilled message and cycles through the three numbers in order

Deployment notes:
- Use a Node.js host with a persistent writable disk.
- Set DATA_DIR to persistent storage on your host so SQLite data survives redeployments.
- The enquiry database is not exposed publicly.
- No login or admin dashboard is included, as requested.
- The enquiry form saves a database record and then opens WhatsApp; it does not confirm a reservation.
- Verify the email and full property address before public launch.
