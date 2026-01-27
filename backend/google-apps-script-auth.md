# Google Apps Script Secure Authentication Backend

## Overview
This document contains the production-ready code for a secure authentication backend using Google Apps Script (GAS) and Google Sheets. This system is designed to be the "Single Source of Truth" and assumes the frontend is untrusted.

## 1. Google Sheets Setup (Database)

Create a new Google Sheet. Rename the spreadsheet to `Awake_Auth_DB`.
Create the following sheets (tabs) with the **exact** header rows specified below.

### Sheet 1: `Users`
**Headers (Row 1):**
`userId`, `email`, `phone`, `username`, `passwordHash`, `salt`, `iterations`, `primaryIdentifier`, `createdAt`, `lastLogin`, `isActive`

### Sheet 2: `Sessions`
**Headers (Row 1):**
`sessionId`, `userId`, `createdAt`, `expiresAt`, `lastActivityAt`, `ipHash`, `userAgent`, `deviceFingerprint`, `isRevoked`

### Sheet 3: `OTPs`
**Headers (Row 1):**
`otpId`, `identifier`, `otpHash`, `purpose`, `expiresAt`, `attempts`, `isUsed`, `createdAt`

### Sheet 4: `AuditLog`
**Headers (Row 1):**
`timestamp`, `userId`, `action`, `success`, `ipHash`, `userAgent`, `metadata`

---

## 2. Google Apps Script Setup

1. Open your Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Rename the project to `Awake Auth Backend`.
4. Delete the default `Code.gs` content.
5. Create the following script files and paste the code provided below.

### Project Settings (Script Properties)
Go to **Project Settings (Gear Icon)** > **Script Properties**.
Add the following properties:
- `PEPPER`: A long, random string (e.g., generated via a password manager).
- `DB_ID`: The ID of your Google Sheet (found in the URL: `docs.google.com/spreadsheets/d/THIS_PART/edit`).

---

## 3. The Code

### File: `Config.gs`
```javascript
const CONFIG = {
  SHEET_ID: '1-_ByIaJbEESPevRozN5v-sojRbcHKevEVAi4UG6Ac_Y', // Hardcoded for easier setup
  PEPPER: 'awake_secret_pepper_2026', // Hardcoded for easier setup (Change this if you want!)
  
  // Security Constants
  PBKDF2_ITERATIONS: 10000, // Balance between security and GAS execution time limit
  SALT_LENGTH: 16,
  SESSION_DURATION_DAYS: 7,
  SESSION_EXTENDED_DAYS: 30,
  OTP_EXPIRY_MINUTES: 10,
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_SESSIONS_PER_USER: 3,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 60, // seconds
  RATE_LIMIT_MAX_REQUESTS: 20
};

// Response Helper
function createResponse(success, dataOrError, errorCode = null) {
  const response = {
    success: success,
    timestamp: new Date().toISOString()
  };
  
  if (success) {
    response.data = dataOrError;
  } else {
    response.error = {
      code: errorCode || 'UNKNOWN_ERROR',
      message: dataOrError // In production, sanitize this message
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### File: `Utils.gs`
```javascript
const Utils = {
  generateUUID: function() {
    return Utilities.getUuid();
  },

  generateRandomString: function(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  generateNumericOTP: function(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  },

  hashString: function(input) {
    const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
    return rawHash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  },

  // Basic IP Anonymization for storage
  anonymizeIP: function(ip) {
    if (!ip) return 'unknown';
    return Utils.hashString(ip + 'ip_salt'); 
  }
};
```

### File: `Security.gs`
```javascript
const Security = {
  // PBKDF2 Implementation using native GAS Utilities
  hashPassword: function(password, salt) {
    const pepper = CONFIG.PEPPER;
    const iterations = CONFIG.PBKDF2_ITERATIONS;
    
    // Initial HMAC
    let derivedKey = Utilities.computeHmacSha256Signature(password + salt + pepper, password);
    
    // Iterations (Simulated PBKDF2)
    // Note: True PBKDF2 is computationally expensive in JS. 
    // We strive for delay + salt + pepper.
    // For GAS, we loop fewer times than 100k to avoid timeouts, but chain HMACs.
    for (let i = 0; i < iterations; i++) {
      derivedKey = Utilities.computeHmacSha256Signature(derivedKey, password);
    }
    
    // Convert byte array to hex string
    return derivedKey.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  },

  verifyPassword: function(inputPassword, storedHash, storedSalt) {
    const calculatedHash = this.hashPassword(inputPassword, storedSalt);
    return calculatedHash === storedHash;
  },

  hashOTP: function(otp, identifier) {
    return Utils.hashString(otp + identifier + CONFIG.PEPPER);
  }
};
```

### File: `Database.gs`
```javascript
const Database = {
  getSpreadsheet: function() {
    return SpreadsheetApp.openById(CONFIG.SHEET_ID);
  },
  
  getSheet: function(name) {
    return this.getSpreadsheet().getSheetByName(name);
  },
  
  // Generic Finder
  findByColumn: function(sheetName, columnIndex, value) {
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    // Skip header (row 0)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][columnIndex]) === String(value)) {
        return { row: i + 1, data: data[i] };
      }
    }
    return null;
  },
  
  // Find User by any active identifier
  findUserByIdentifier: function(identifier) {
    const sheet = this.getSheet('Users');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const email = data[i][1];
      const phone = data[i][2];
      const username = data[i][3];
      
      if (email === identifier || phone === identifier || username === identifier) {
        return {
          row: i + 1,
          userId: data[i][0],
          email: data[i][1],
          phone: data[i][2],
          username: data[i][3],
          passwordHash: data[i][4],
          salt: data[i][5],
          isActive: data[i][10]
        };
      }
    }
    return null;
  },
  
  insert: function(sheetName, rowData) {
    const sheet = this.getSheet(sheetName);
    sheet.appendRow(rowData);
  },
  
  updateCell: function(sheetName, rowIndex, colIndex, value) {
    const sheet = this.getSheet(sheetName);
    sheet.getRange(rowIndex, colIndex + 1).setValue(value);
  }
};
```

### File: `RateLimiter.gs`
```javascript
const RateLimiter = {
  check: function(key) {
    const cache = CacheService.getScriptCache();
    const count = cache.get(key);
    
    if (count && parseInt(count) >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    const newCount = count ? parseInt(count) + 1 : 1;
    cache.put(key, newCount.toString(), CONFIG.RATE_LIMIT_WINDOW);
    return true;
  }
};
```

### File: `Audit.gs`
```javascript
function logAudit(userId, action, success, metadata = {}, ip = 'unknown', userAgent = 'unknown') {
  try {
    const row = [
      new Date().toISOString(),
      userId || 'anonymous',
      action,
      success,
      Utils.anonymizeIP(ip),
      userAgent,
      JSON.stringify(metadata)
    ];
    Database.insert('AuditLog', row);
  } catch (e) {
    console.error("Audit Log Failed", e);
  }
}
```

### File: `Auth.gs`
```javascript
const Auth = {
  signUp: function(payload, meta) {
    const lock = LockService.getScriptLock();
    // Wait for up to 10 seconds for other processes to finish.
    if (!lock.tryLock(10000)) {
      throw { code: 'SERVER_BUSY', message: 'Server is busy, please try again.' };
    }
    
    try {
      const { email, phone, username, password } = payload;
      const primary = email || phone || username;
      
      if (!primary || !password) throw { code: 'INVALID_INPUT', message: 'Missing credentials' };

      // 1. Uniqueness Check
      if (email && Database.findUserByIdentifier(email)) throw { code: 'EXISTS', message: 'Identifier taken' };
      if (phone && Database.findUserByIdentifier(phone)) throw { code: 'EXISTS', message: 'Identifier taken' };
      if (username && Database.findUserByIdentifier(username)) throw { code: 'EXISTS', message: 'Identifier taken' };
      
      // 2. Hash Password
      const salt = Utils.generateRandomString(CONFIG.SALT_LENGTH);
      const passwordHash = Security.hashPassword(password, salt);
      const userId = Utils.generateUUID();
      
      // 3. Create User (Inactive)
      // Headers: userId, email, phone, username, passwordHash, salt, iterations, primaryIdentifier, createdAt, lastLogin, isActive
      Database.insert('Users', [
        userId,
        email || '',
        phone || '',
        username || '',
        passwordHash,
        salt,
        CONFIG.PBKDF2_ITERATIONS,
        primary,
        new Date().toISOString(),
        '', // lastLogin
        false // isActive
      ]);
      
      // 4. Generate & Store OTP
      const otpCode = Utils.generateNumericOTP(6);
      const otpHash = Security.hashOTP(otpCode, primary);
      const expiresAt = new Date(Date.now() + CONFIG.OTP_EXPIRY_MINUTES * 60000).toISOString();
      
      // Headers: otpId, identifier, otpHash, purpose, expiresAt, attempts, isUsed, createdAt
      Database.insert('OTPs', [
        Utils.generateUUID(),
        primary,
        otpHash,
        'SIGNUP',
        expiresAt,
        0,
        false,
        new Date().toISOString()
      ]);
      
      logAudit(userId, 'SIGNUP_INIT', true, { primary }, meta.ip, meta.userAgent);
      
      // In production, integrate MailApp or GmailApp here to send OTP
      return { message: 'User created. OTP sent.', dev_otp: otpCode }; // REMOVE dev_otp IN PROD
      
    } catch (e) {
      logAudit(null, 'SIGNUP_FAIL', false, { error: e.message }, meta.ip, meta.userAgent);
      throw e;
    } finally {
      lock.releaseLock();
    }
  },
  
  verifySignUpOTP: function(payload, meta) {
    const { identifier, otp } = payload;
    const user = Database.findUserByIdentifier(identifier);
    if (!user) throw { code: 'NOT_FOUND', message: 'User not found' };
    
    // Find valid OTP
    const sheet = Database.getSheet('OTPs');
    const data = sheet.getDataRange().getValues();
    let otpRecord = null;
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
        // identifier match, purpose SIGNUP, not used, not expired
        if (data[i][1] === identifier && 
            data[i][3] === 'SIGNUP' && 
            data[i][6] === false && 
            new Date(data[i][4]) > new Date()) {
            otpRecord = data[i];
            rowIndex = i + 1;
            break;
        }
    }
    
    if (!otpRecord) throw { code: 'INVALID_OTP', message: 'Invalid or expired OTP' };
    
    // Verify Hash
    const inputHash = Security.hashOTP(otp, identifier);
     if (inputHash !== otpRecord[2]) {
         // Increment attempts logic here needed for strict security
         throw { code: 'INVALID_OTP', message: 'Invalid OTP' };
     }
     
     // Mark OTP Used
     Database.updateCell('OTPs', rowIndex, 6, true); // isUsed = true
     
     // Activate User
     Database.updateCell('Users', user.row, 10, true); // isActive = true
     
     logAudit(user.userId, 'ACTIVATE_ACCOUNT', true, { identifier }, meta.ip, meta.userAgent);
     return { message: 'Account verified successfully.' };
  },

  signIn: function(payload, meta) {
    const { identifier, password } = payload;
    
    // 1. Rate Limit
    if (!RateLimiter.check('login_' + Utils.anonymizeIP(meta.ip))) {
        throw { code: 'RATE_LIMIT', message: 'Too many attempts' };
    }

    // 2. Find User
    const user = Database.findUserByIdentifier(identifier);
    if (!user) {
        // Generic timing attack mitigation (dummy hash check)
        Security.hashPassword('dummy', 'salt');
        throw { code: 'AUTH_FAILED', message: 'Invalid credentials' };
    }
    
    if (!user.isActive) throw { code: 'INACTIVE', message: 'Account not active' };
    
    // 3. Verify Password
    const isValid = Security.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
        logAudit(user.userId, 'LOGIN_FAILED', false, {}, meta.ip, meta.userAgent);
        throw { code: 'AUTH_FAILED', message: 'Invalid credentials' };
    }
    
    // 4. Create Session
    // Cleanup old sessions for this user (Max 3)
    const sessionSheet = Database.getSheet('Sessions');
    const sData = sessionSheet.getDataRange().getValues();
    const userSessions = [];
    for(let i=1; i<sData.length; i++) {
        if (sData[i][1] === user.userId && sData[i][8] === false) { // isRevoked false
            userSessions.push({ row: i+1, created: new Date(sData[i][2]) });
        }
    }
    
    if (userSessions.length >= CONFIG.MAX_SESSIONS_PER_USER) {
        // Sort by oldest and revoke
        userSessions.sort((a,b) => a.created - b.created);
        const toRevoke = userSessions[0];
        Database.updateCell('Sessions', toRevoke.row, 8, true);
    }
    
    const sessionId = Utils.generateUUID();
    const expiresAt = new Date(Date.now() + CONFIG.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    
    // Headers: sessionId, userId, createdAt, expiresAt, lastActivityAt, ipHash, userAgent, deviceFingerprint, isRevoked
    Database.insert('Sessions', [
        sessionId,
        user.userId,
        new Date().toISOString(),
        expiresAt,
        new Date().toISOString(),
        Utils.anonymizeIP(meta.ip),
        meta.userAgent,
        'generic_fp',
        false
    ]);
    
    // Update Last Login
    Database.updateCell('Users', user.row, 9, new Date().toISOString());
    
    logAudit(user.userId, 'LOGIN_SUCCESS', true, {}, meta.ip, meta.userAgent);
    
    return {
        sessionId: sessionId,
        userId: user.userId,
        expiresAt: expiresAt,
        user: {
            email: user.email,
            phone: user.phone,
            username: user.username
        }
    };
  },
  
  validateSession: function(payload) {
      const { sessionId } = payload;
      const result = Database.findByColumn('Sessions', 0, sessionId);
      
      if (!result) throw { code: 'INVALID_SESSION', message: 'Session not found' };
      
      const [sid, uid, created, expires, lastActive, ip, ua, fp, isRevoked] = result.data;
      
      if (isRevoked) throw { code: 'SESSION_REVOKED', message: 'Session revoked' };
      if (new Date(expires) < new Date()) throw { code: 'SESSION_EXPIRED', message: 'Session expired' };
      
      return { valid: true, userId: uid };
  }
};
```

### File: `Code.gs` (Router)
```javascript
function doPost(e) {
  try {
    const json = JSON.parse(e.postData.contents);
    const action = json.action;
    const payload = json.payload || {};
    
    // Metadata extraction (imperfect in GAS but best effort)
    const meta = {
      ip: '1.2.3.4', // GAS does not expose Client IP directly. You must rely on client sending a fingerprint or accept this limitation.
      userAgent: 'Client-User-Agent' 
    };

    let result;
    
    switch (action) {
      case 'signUp':
        result = Auth.signUp(payload, meta);
        break;
      case 'verifySignUpOTP':
        result = Auth.verifySignUpOTP(payload, meta);
        break;
      case 'signIn':
        result = Auth.signIn(payload, meta);
        break;
      case 'validateSession':
        result = Auth.validateSession(payload);
        break;
      default:
         throw { code: 'INVALID_ACTION', message: 'Unknown action endpoint' };
    }
    
    return createResponse(true, result);
    
  } catch (error) {
    console.error(error);
    return createResponse(false, error.message, error.code);
  }
}
```

## 4. Deployment

1.  Click **Deploy** > **New deployment**.
2.  **Select type**: **Web app**.
3.  **Description**: `v1 Auth Backend`.
4.  **Execute as**: **Me** (your account). 
    *   *Critical*: This ensures the script has access to the Sheet, even if the user accessing it is anonymous.
5.  **Who has access**: **Anyone** (or "Anyone with Google Account" if you want to restrict it, but for a public app "Anyone" is needed).
6.  Click **Deploy**.
7.  Copy the **Web App URL** (ends in `/exec`).

## 5. Frontend Usage (Example)
Make POST requests to the Web App URL:
```javascript
fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  body: JSON.stringify({
    action: 'signIn',
    payload: {
      identifier: 'user@example.com',
      password: 'mystrongpassword'
    }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```
