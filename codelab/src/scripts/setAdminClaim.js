import 'dotenv/config';
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(), 
});

const uid = process.env.ADMIN_UID; 
if (!uid) throw new Error('Missing ADMIN_UID');

(async () => {
  await admin.auth().setCustomUserClaims(uid, { admin: true, role: 'admin' });
  console.log(`✅ Set admin=true for ${uid}`);
  process.exit(0);
})();
