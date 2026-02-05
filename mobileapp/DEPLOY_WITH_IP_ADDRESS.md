# Deploying Mobile App with IP Address (No Domain)

## 🎯 Quick Guide: Using VPS IP Address

If your VPS doesn't have a domain name, you can use the IP address directly.

---

## ⚡ Quick Setup

### Step 1: Configure Mobile App

Edit `mobileapp/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=http://YOUR_VPS_IP:3000
```

**Example:**
```env
EXPO_PUBLIC_API_URL=http://203.0.113.45:3000
```

### Step 2: Allow Cleartext Traffic (Android)

Android blocks HTTP by default. You need to allow it.

Edit `mobileapp/app.json`:

```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true,
      "package": "com.yourcompany.adminapp"
    }
  }
}
```

### Step 3: Build APK

```cmd
cd mobileapp
eas build --platform android --profile preview
```

### Step 4: Configure Server Firewall

On your Windows VPS:

```powershell
# Allow port 3000
New-NetFirewallRule -DisplayName "Node.js API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Step 5: Start Your Backend

```powershell
# On Windows Server
cd your-project-folder
pm2 start ecosystem.config.js
```

---

## 🔒 Security Considerations

### ⚠️ HTTP with IP Address

**Pros:**
- ✅ Simple setup
- ✅ No domain needed
- ✅ No SSL certificate needed
- ✅ Works immediately

**Cons:**
- ❌ **Not encrypted** - data sent in plain text
- ❌ **Not secure** - passwords, tokens visible to network sniffers
- ❌ **Not recommended for production**
- ❌ Android shows security warnings

**Use only for:**
- Internal testing
- Development
- Private networks
- Non-sensitive data

---

## 🌐 Better Alternative: Free Domain + SSL

### Option 1: DuckDNS (Easiest)

**Free subdomain with automatic SSL support**

1. **Sign up at https://www.duckdns.org**
   - Login with Google/GitHub
   - Create subdomain: `yourapp.duckdns.org`

2. **Point to your VPS IP**
   - Enter your VPS IP address
   - Click "Update IP"

3. **Install DuckDNS updater on VPS** (keeps IP updated)
   ```powershell
   # Create update script
   $domain = "yourapp"
   $token = "your-duckdns-token"
   Invoke-WebRequest "https://www.duckdns.org/update?domains=$domain&token=$token&ip="
   ```

4. **Get SSL certificate with win-acme**
   ```powershell
   # Download win-acme
   # Run and select DuckDNS domain
   # Certificate auto-installed in IIS
   ```

5. **Update mobile app**
   ```env
   EXPO_PUBLIC_API_URL=https://yourapp.duckdns.org
   ```

### Option 2: No-IP

**Free dynamic DNS**

1. Sign up at https://www.noip.com
2. Create hostname: `yourapp.ddns.net`
3. Point to your VPS IP
4. Install No-IP DUC (Dynamic Update Client) on VPS
5. Get SSL certificate with Let's Encrypt

### Option 3: Freenom

**Free domain (.tk, .ml, .ga, .cf, .gq)**

1. Sign up at https://www.freenom.com
2. Register free domain
3. Point A record to your VPS IP
4. Get SSL certificate with Let's Encrypt

---

## 🔧 Detailed Configuration

### Configure CORS for IP Address

In your Next.js API, ensure CORS allows your IP:

```typescript
// middleware.ts or API route
const allowedOrigins = [
  'http://203.0.113.45:3000',
  'http://localhost:3000',
  // Add your VPS IP
];
```

### Configure Supabase

If using Supabase, add your IP to allowed origins:

1. Go to Supabase Dashboard
2. Settings → API
3. Add to "Site URL": `http://YOUR_VPS_IP:3000`

### Test Connection

```cmd
# From your development machine
curl http://YOUR_VPS_IP:3000/api/health

# Should return: {"status":"ok"}
```

---

## 📱 Android Network Security Config (Advanced)

If you need more control over network security:

### Step 1: Create network security config

After running `npx expo prebuild`, create:

`android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic to your VPS IP -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">203.0.113.45</domain>
    </domain-config>
    
    <!-- Default: require HTTPS for everything else -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

### Step 2: Reference in AndroidManifest.xml

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

**Note:** This requires local build or custom development client. Not available with standard EAS build.

---

## 🚀 Production Deployment Workflow

### For Testing (IP Address)

```cmd
# 1. Configure with IP
# mobileapp/.env
EXPO_PUBLIC_API_URL=http://YOUR_VPS_IP:3000

# 2. Enable cleartext in app.json
"android": {
  "usesCleartextTraffic": true
}

# 3. Build
eas build --platform android --profile preview

# 4. Test on device
```

### For Production (Domain + SSL)

```cmd
# 1. Get free domain (DuckDNS)
# yourapp.duckdns.org → YOUR_VPS_IP

# 2. Install SSL certificate on VPS
# Use win-acme or certbot

# 3. Configure with domain
# mobileapp/.env
EXPO_PUBLIC_API_URL=https://yourapp.duckdns.org

# 4. Remove cleartext from app.json
"android": {
  "usesCleartextTraffic": false
}

# 5. Build
eas build --platform android --profile production

# 6. Deploy to Play Store or distribute
```

---

## 🐛 Troubleshooting

### Mobile App Can't Connect to IP

**Check 1: Firewall**
```powershell
# On Windows Server
Test-NetConnection -ComputerName localhost -Port 3000
```

**Check 2: Server is running**
```powershell
pm2 status
pm2 logs
```

**Check 3: IP is correct**
```powershell
# Get your public IP
Invoke-RestMethod -Uri "https://api.ipify.org"
```

**Check 4: Port is accessible from outside**
```cmd
# From your development machine
telnet YOUR_VPS_IP 3000
# or
curl http://YOUR_VPS_IP:3000
```

### "Cleartext HTTP traffic not permitted"

**Fix:** Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true
    }
  }
}
```

Then rebuild the APK.

### "Network request failed"

**Possible causes:**
1. VPS firewall blocking port
2. Windows Firewall blocking port
3. ISP blocking port
4. Wrong IP address
5. Server not running

**Debug:**
```powershell
# On VPS - check if server is listening
netstat -ano | findstr :3000

# Check firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3000*"}
```

### Connection works on WiFi but not on mobile data

**Cause:** Some mobile carriers block certain ports.

**Solutions:**
1. Use standard ports (80 for HTTP, 443 for HTTPS)
2. Configure IIS reverse proxy
3. Use a domain with SSL

---

## 📊 Comparison: IP vs Domain

| Feature | IP Address | Domain + SSL |
|---------|-----------|--------------|
| Setup Time | 5 minutes | 30 minutes |
| Cost | Free | Free (with free domain) |
| Security | ❌ Not encrypted | ✅ Encrypted |
| Professional | ❌ No | ✅ Yes |
| Play Store | ❌ May reject | ✅ Accepted |
| User Trust | ❌ Low | ✅ High |
| Maintenance | Easy | Easy |
| Best For | Testing | Production |

---

## 💡 Recommendations

### For Development/Testing
✅ Use IP address with HTTP
- Quick setup
- Easy testing
- No domain needed

### For Production
✅ Use free domain with HTTPS
- Professional
- Secure
- User trust
- Play Store compliant

### Quick Production Setup (15 minutes)
1. Get DuckDNS subdomain (2 min)
2. Point to VPS IP (1 min)
3. Install win-acme SSL (5 min)
4. Update mobile app config (2 min)
5. Rebuild APK (5 min)

---

## 🎯 Example: Complete Setup with IP

### On Windows VPS

```powershell
# 1. Allow port 3000
New-NetFirewallRule -DisplayName "API Port" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# 2. Start your app
cd C:\inetpub\wwwroot\your-app
pm2 start ecosystem.config.js

# 3. Get your public IP
Invoke-RestMethod -Uri "https://api.ipify.org"
# Output: 203.0.113.45
```

### On Development Machine

```cmd
# 1. Update mobile app config
cd mobileapp
echo EXPO_PUBLIC_API_URL=http://203.0.113.45:3000 > .env

# 2. Update app.json
# Add: "usesCleartextTraffic": true

# 3. Build APK
eas build --platform android --profile preview

# 4. Wait for build, download APK

# 5. Install on phone and test
```

---

## 📚 Additional Resources

- **DuckDNS**: https://www.duckdns.org
- **No-IP**: https://www.noip.com
- **Let's Encrypt**: https://letsencrypt.org
- **win-acme**: https://www.win-acme.com
- **Android Network Security**: https://developer.android.com/training/articles/security-config

---

## ✅ Quick Checklist

### Using IP Address (HTTP)
- [ ] VPS firewall allows port 3000
- [ ] Windows Firewall allows port 3000
- [ ] Backend running on VPS (`pm2 status`)
- [ ] IP address is correct (public IP, not private)
- [ ] `usesCleartextTraffic: true` in app.json
- [ ] `EXPO_PUBLIC_API_URL` set to `http://YOUR_IP:3000`
- [ ] APK rebuilt after config changes
- [ ] Tested on real device

### Upgrading to Domain (HTTPS)
- [ ] Free domain registered (DuckDNS/No-IP)
- [ ] Domain points to VPS IP
- [ ] SSL certificate installed
- [ ] IIS reverse proxy configured
- [ ] `EXPO_PUBLIC_API_URL` updated to `https://domain`
- [ ] `usesCleartextTraffic` removed from app.json
- [ ] APK rebuilt
- [ ] Tested on real device

---

**Remember:** IP + HTTP is fine for testing, but use Domain + HTTPS for production!
