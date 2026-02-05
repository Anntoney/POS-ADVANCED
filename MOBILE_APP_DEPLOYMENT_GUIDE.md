# Mobile App Deployment Guide - Windows Server

## 🎯 Understanding Mobile App Deployment

Mobile apps have **two parts**:
1. **The Mobile App** (APK/IPA) - Runs on user's phone
2. **The Backend API** (Next.js) - Runs on your Windows Server

---

## 📱 Part 1: Building the Mobile App (APK)

### Quick Method: EAS Build (Recommended)

```cmd
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to mobile app folder
cd mobileapp

# Build APK for Android
eas build --platform android --profile preview
```

**What happens:**
- Your code is uploaded to Expo's cloud servers
- APK is built remotely (10-20 minutes)
- You get a download link
- Users install the APK directly on their phones

**See `BUILD_APK_GUIDE.md` for detailed instructions.**

---

## 🖥️ Part 2: Deploying Backend API to Windows Server

Your mobile app needs to connect to your Next.js backend API running on Windows Server.

### Prerequisites

1. Windows Server with IIS or Node.js installed
2. Domain name or IP address
3. SSL certificate (for HTTPS)
4. PM2 for process management (already configured in your project)

### Step 1: Prepare Your Server

**Install Node.js on Windows Server:**
```powershell
# Download and install Node.js LTS from nodejs.org
# Verify installation
node --version
npm --version
```

**Install PM2 globally:**
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### Step 2: Upload Your Code to Server

**Option A: Using Git (Recommended)**
```powershell
# On Windows Server
cd C:\inetpub\wwwroot
git clone https://your-repo-url.git your-app-name
cd your-app-name
```

**Option B: Manual Upload**
- Use FTP/SFTP to upload your project files
- Or use Remote Desktop to copy files

### Step 3: Configure Environment Variables

Create `.env.local` on the server:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Step 4: Install Dependencies and Build

```powershell
# Install dependencies
npm install

# Build the Next.js app
npm run build
```

### Step 5: Start with PM2

Your project already has `ecosystem.config.js`. Start the app:

```powershell
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# View logs
pm2 logs
```

### Step 6: Configure Firewall

```powershell
# Allow port 3000 (or your configured port)
New-NetFirewallRule -DisplayName "Node.js App" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Step 7: Setup Reverse Proxy (IIS)

**Install IIS URL Rewrite and ARR:**
1. Open IIS Manager
2. Install URL Rewrite Module
3. Install Application Request Routing (ARR)

**Configure reverse proxy:**
1. Create new website in IIS
2. Add URL Rewrite rule:

```xml
<rule name="ReverseProxyInboundRule" stopProcessing="true">
  <match url="(.*)" />
  <action type="Rewrite" url="http://localhost:3000/{R:1}" />
</rule>
```

### Step 8: Setup SSL Certificate

**Using Let's Encrypt (Free):**
1. Install win-acme: https://www.win-acme.com/
2. Run win-acme and follow prompts
3. Certificate will be automatically installed in IIS

**Or use a commercial SSL certificate from your provider.**

---

## 📲 Part 3: Connect Mobile App to Server

### Update Mobile App Configuration

Edit `mobileapp/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=https://your-domain.com
```

**Using IP Address Instead of Domain:**

If you don't have a domain, you can use your VPS IP address:

```env
# For HTTP (testing only - not secure)
EXPO_PUBLIC_API_URL=http://123.45.67.89:3000

# For HTTPS (requires SSL certificate for IP)
EXPO_PUBLIC_API_URL=https://123.45.67.89:3000
```

**Important Notes for IP-based URLs:**

1. **HTTP on Android requires cleartext traffic permission**
2. **HTTPS with IP requires valid SSL certificate (difficult to obtain)**
3. **Recommended: Use a free domain service instead**

### Rebuild Mobile App

After updating the API URL:

```cmd
cd mobileapp
eas build --platform android --profile preview
```

---

## 🔄 Updating Your Deployment

### Update Backend API

```powershell
# On Windows Server
cd C:\inetpub\wwwroot\your-app-name

# Pull latest changes
git pull

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart all
```

### Update Mobile App

```cmd
# On your development machine
cd mobileapp

# Update version in app.json
# "version": "1.0.1"

# Rebuild
eas build --platform android --profile preview

# Distribute new APK to users
```

---

## 🚀 Alternative: Using IIS with iisnode

If you prefer IIS over PM2:

### Install iisnode

1. Download from: https://github.com/Azure/iisnode
2. Install on Windows Server

### Configure web.config

Create `web.config` in your project root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

---

## 📊 Monitoring and Maintenance

### PM2 Commands

```powershell
# Check status
pm2 status

# View logs
pm2 logs

# Restart app
pm2 restart all

# Stop app
pm2 stop all

# Monitor resources
pm2 monit
```

### Health Checks

Create a simple health check endpoint in your Next.js app:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

Test: `https://your-domain.com/api/health`

---

## 🔐 Security Checklist

- [ ] SSL certificate installed and working
- [ ] Firewall configured (only necessary ports open)
- [ ] Environment variables secured (not in git)
- [ ] Database credentials secured
- [ ] Regular Windows updates enabled
- [ ] PM2 logs rotated
- [ ] Backup strategy in place

---

## 🐛 Troubleshooting

### Mobile App Can't Connect to Server

**Check:**
1. Server is running: `pm2 status`
2. Firewall allows connections
3. SSL certificate is valid
4. API URL in mobile app is correct
5. CORS is configured in Next.js

### PM2 App Crashes

```powershell
# View error logs
pm2 logs --err

# Restart with fresh logs
pm2 restart all
pm2 flush
```

### Port Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 📦 Distribution Options

### Option 1: Direct APK Distribution
- Host APK on your server
- Users download and install manually
- Good for internal/testing

### Option 2: Google Play Store
- Build AAB: `eas build --platform android --profile production`
- Submit to Google Play Console
- Users install from Play Store
- Best for public apps

### Option 3: Internal Distribution
- Use Firebase App Distribution
- Or TestFlight for iOS
- Good for beta testing

---

## 💡 Best Practices

1. **Use HTTPS** - Always use SSL for production
2. **Environment Variables** - Never commit secrets to git
3. **Monitoring** - Set up PM2 monitoring or external monitoring
4. **Backups** - Regular database and code backups
5. **Updates** - Keep Node.js, npm, and dependencies updated
6. **Logging** - Configure proper logging with PM2
7. **Testing** - Test mobile app with production API before release

---

## 📚 Additional Resources

- **PM2 Documentation**: https://pm2.keymetrics.io/
- **IIS Configuration**: https://www.iis.net/
- **Expo EAS Build**: https://docs.expo.dev/build/introduction/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Let's Encrypt**: https://letsencrypt.org/

---

## 🎯 Quick Deployment Checklist

### Backend (Windows Server)
- [ ] Node.js installed
- [ ] PM2 installed
- [ ] Code uploaded to server
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] App built (`npm run build`)
- [ ] PM2 started (`pm2 start ecosystem.config.js`)
- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Domain pointing to server

### Mobile App
- [ ] API URL updated in `.env`
- [ ] APK built with EAS
- [ ] APK tested on real device
- [ ] APK distributed to users

---

**Need help?** Check the logs with `pm2 logs` and ensure your mobile app's API URL matches your server's domain.
