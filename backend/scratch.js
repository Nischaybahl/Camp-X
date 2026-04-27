const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '/Users/nischaybahl/college-website/backend/.env' });

async function testPasswordResetFlow() {
    console.log("=== STARTING END-TO-END TEST ===");
    const testEmail = "test_reset_" + Date.now() + "@example.com";
    const newPassword = "NewSecurePassword123!";

    // 0. Signup a test user
    console.log(`[0] Signing up test user: ${testEmail}`);
    await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'OldPassword123' })
    });

    // 1. Hit the forgot-password API
    console.log(`[1] Hitting /api/auth/forgot-password with email: ${testEmail}`);
    let res = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
    });
    
    const textData = await res.text();
    let data;
    try {
        data = JSON.parse(textData);
        console.log("Response:", data);
    } catch(err) {
        console.error("Non-JSON Response body:", textData);
        process.exit(1);
    }

    if (!res.ok) {
         console.error("Failed to call forgot-password");
         return;
    }

    // 2. Connect to Mongo to grab the generated token
    console.log("[2] Connecting to MongoDB to fetch token...");
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection;
    const user = await db.collection('users').findOne({ email: testEmail });
    
    if (!user || !user.resetPasswordToken) {
        console.error("Token not found in Database. Email sending or token generation failed.");
        process.exit(1);
    }

    const token = user.resetPasswordToken;
    console.log("Extracted Token:", token);

    // 3. Hit the reset-password API with the token
    console.log(`[3] Hitting /api/auth/reset-password/${token} with new password...`);
    res = await fetch(`http://localhost:5001/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
    });

    data = await res.json();
    console.log("Response:", data);

    if (!res.ok) {
         console.error("Failed to reset password", data);
         process.exit(1);
    }

    // 4. Verify token was cleared
    console.log("[4] Verifying token was cleared from DB...");
    const updatedUser = await db.collection('users').findOne({ email: testEmail });
    if (!updatedUser.resetPasswordToken) {
         console.log("Token successfully cleared!");
    } else {
         console.error("Token was not cleared!");
    }

    // Restore old password (Optional, but let's test login with new password)
    // 5. Test login with new password
    console.log("[5] Testing login with new password...");
    res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: newPassword })
    });
    
    let loginData = await res.json();
    console.log("Login Response: ", loginData);
    
    console.log("=== END OF TEST ===");
    process.exit(0);
}

testPasswordResetFlow();
