# Installing SSL Certificate for No-IP Domain on Windows Server

## 🎯 Quick Overview

You have a No-IP domain (like `yourapp.ddns.net`). Now you need SSL to use HTTPS.

**Best method for Windows Server: win-acme (Let's Encrypt)**

---

## ⚡ Method 1: win-acme (Recommended - Easiest)

win-acme is a Windows client for Let's Encrypt that automatically installs SSL certificates in IIS.

### Step 1: Download win-acme

1. Go to: https://www.win-acme.com/
2. Download latest version (win-acme.v2.x.x.xxx.x64.pluggable.zip)
3. Extract to `C:\win-acme`

### Step 2: Install IIS (if not already installed)

```powershell
# Run PowerShell as Administrator
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

### Step 3: Configure IIS Site

1. Open IIS Manager
2. Right-click "Sites" → "Add Website"
3. Configure:
   - **Site name**: Your App Name
   - **Physical path**: `C:\inetpub\wwwroot\your-app`
   - **Binding**: 
     - Type: http
     - Port: 80
     - Host name: `yourapp.ddns.net`

4. Click OK

### Step 4: Ensure Port 80 is Open

```powershell
# Allow HTTP (port 80) - required for Let's Encrypt verification
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow HTTPS (port 443)
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### Step 5: Run win-acme

```powershell
# Navigate to win-acme folder
cd C:\win-acme

# Run win-acme
.\wacs.exe
```

### Step 6: Follow win-acme Wizard

**Menu appears:**

```
N: Create certificate (default settings)
M: Create certificate (full options)
R: Run renewals (0 currently due)
A: Manage renewals (0 total)
O: More options...
Q: Quit
```

**Choose: N** (Create certificate with default settings)

**Then:**

1. **Choose target**: Select `1` (IIS)
2. **Select site**: Choose your site (`yourapp.ddns.net`)
3. **Friendly name**: Press Enter (use default)
4. **Accept terms**: Type `yes`
5. **Email**: Enter your email (for renewal notifications)

**win-acme will:**
- Contact Let's Encrypt
- Verify domain ownership (via HTTP challenge)
- Download certificate
- Install in IIS
- Configure HTTPS binding
- Set up automatic renewal

### Step 7: Verify Installation

```powershell
# Check if certificate is installed
Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object {$_.Subject -like "*yourapp.ddns.net*"}
```

Visit: `https://yourapp.ddns.net` - Should show secure connection!

---

## 🔧 Method 2: Certbot (Alternative)

If you prefer Certbot (another Let's Encrypt client):

### Step 1: Download Certbot

1. Go to: https://certbot.eff.org/
2. Select: "IIS" and "Windows"
3. Download installer

### Step 2: Install Certbot

```powershell
# Run installer
# Follow installation wizard
```

### Step 3: Get Certificate

```powershell
# Run as Administrator
certbot certonly --standalone -d yourapp.ddns.net
```

**Follow prompts:**
- Enter email
- Agree to terms
- Certificate saved to: `C:\Certbot\live\yourapp.ddns.net\`

### Step 4: Import to IIS

1. Open IIS Manager
2. Select server name
3. Double-click "Server Certificates"
4. Click "Import" (right panel)
5. Browse to: `C:\Certbot\live\yourapp.ddns.net\fullchain.pem`
6. Enter password (if any)
7. Click OK

### Step 5: Bind to Site

1. Select your site
2. Click "Bindings" (right panel)
3. Click "Add"
4. Configure:
   - Type: https
   - Port: 443
   - Host name: yourapp.ddns.net
   - SSL certificate: Select your certificate
5. Click OK

---

## 🔄 Configure Reverse Proxy to Node.js

After SSL is installed, configure IIS to proxy requests to your Node.js app.

### Step 1: Install URL Rewrite and ARR

**Download and install:**
1. **URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite
2. **Application Request Routing (ARR)**: https://www.iis.net/downloads/microsoft/application-request-routing

### Step 2: Enable ARR Proxy

1. Open IIS Manager
2. Click server name (root level)
3. Double-click "Application Request Routing Cache"
4. Click "Server Proxy Settings" (right panel)
5. Check "Enable proxy"
6. Click "Apply"

### Step 3: Configure URL Rewrite

1. Select your website
2. Double-click "URL Rewrite"
3. Click "Add Rule(s)" (right panel)
4. Select "Reverse Proxy"
5. Enter: `localhost:3000`
6. Click OK

**Or manually add to web.config:**

Create `C:\inetpub\wwwroot\your-app\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

### Step 4: Start Your Node.js App

```powershell
cd C:\inetpub\wwwroot\your-app
pm2 start ecosystem.config.js
pm2 save
```

### Step 5: Test

Visit: `https://yourapp.ddns.net`

Should proxy to your Node.js app running on port 3000!

---

## 🔒 Force HTTPS (Redirect HTTP to HTTPS)

### Option 1: IIS URL Rewrite

Add to `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Redirect HTTP to HTTPS -->
                <rule name="Redirect to HTTPS" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{HTTPS}" pattern="^OFF$" />
                    </conditions>
                    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
                </rule>
                
                <!-- Reverse Proxy to Node.js -->
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

### Option 2: IIS HTTPS Redirect

1. Select your site in IIS
2. Double-click "SSL Settings"
3. Check "Require SSL"
4. Click "Apply"

---

## 🔄 Automatic Certificate Renewal

### win-acme (Automatic)

win-acme automatically sets up a scheduled task for renewal.

**Check scheduled task:**
```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "*win-acme*"}
```

**Manually trigger renewal:**
```powershell
cd C:\win-acme
.\wacs.exe --renew --baseuri "https://acme-v02.api.letsencrypt.org/"
```

### Certbot (Manual Setup)

Create scheduled task:

```powershell
# Create renewal task
$action = New-ScheduledTaskAction -Execute "certbot" -Argument "renew --quiet"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "Certbot Renewal" -Action $action -Trigger $trigger -Principal $principal
```

---

## 📱 Update Mobile App Configuration

Now that you have SSL, update your mobile app:

### Step 1: Update .env

```env
# mobileapp/.env
EXPO_PUBLIC_API_URL=https://yourapp.ddns.net
```

### Step 2: Remove Cleartext Traffic

Edit `mobileapp/app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.adminapp"
      // Remove or set to false:
      // "usesCleartextTraffic": false
    }
  }
}
```

### Step 3: Rebuild APK

```cmd
cd mobileapp
eas build --platform android --profile preview
```

---

## 🐛 Troubleshooting

### Certificate Installation Failed

**Error: "Cannot verify domain"**

**Causes:**
1. Port 80 not accessible from internet
2. No-IP domain not pointing to correct IP
3. Firewall blocking port 80

**Fix:**
```powershell
# Check if port 80 is open
Test-NetConnection -ComputerName yourapp.ddns.net -Port 80

# Ensure firewall allows port 80
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Verify No-IP domain points to your server
nslookup yourapp.ddns.net
```

### Certificate Installed but HTTPS Not Working

**Check IIS binding:**
1. Open IIS Manager
2. Select your site
3. Click "Bindings"
4. Ensure HTTPS binding exists with correct certificate

**Check firewall:**
```powershell
# Allow HTTPS
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### "This site can't provide a secure connection"

**Cause:** Reverse proxy not configured or Node.js app not running

**Fix:**
```powershell
# Check if Node.js app is running
pm2 status

# Restart if needed
pm2 restart all

# Check if reverse proxy is working
curl http://localhost:3000
```

### Mixed Content Errors

**Cause:** Your app is loading HTTP resources on HTTPS page

**Fix:** Ensure all API calls use HTTPS or relative URLs

### No-IP Domain Not Resolving

**Check:**
1. No-IP DUC (Dynamic Update Client) is running
2. Domain points to correct IP
3. DNS propagation (can take up to 24 hours)

```powershell
# Check current IP
Invoke-RestMethod -Uri "https://api.ipify.org"

# Check what IP domain points to
nslookup yourapp.ddns.net
```

---

## 🔐 Security Best Practices

### 1. Disable TLS 1.0 and 1.1

```powershell
# Disable TLS 1.0
New-Item 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.0\Server' -Force
New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.0\Server' -Name 'Enabled' -Value 0 -PropertyType 'DWord'

# Disable TLS 1.1
New-Item 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.1\Server' -Force
New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.1\Server' -Name 'Enabled' -Value 0 -PropertyType 'DWord'
```

### 2. Enable HSTS

Add to `web.config`:

```xml
<system.webServer>
    <httpProtocol>
        <customHeaders>
            <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
        </customHeaders>
    </httpProtocol>
</system.webServer>
```

### 3. Test SSL Configuration

Visit: https://www.ssllabs.com/ssltest/

Enter your domain to check SSL configuration and get security rating.

---

## 📊 Complete Setup Checklist

### Prerequisites
- [ ] Windows Server with IIS installed
- [ ] No-IP domain registered and pointing to server IP
- [ ] No-IP DUC installed and running
- [ ] Ports 80 and 443 open in firewall
- [ ] Node.js and PM2 installed

### SSL Installation
- [ ] win-acme downloaded and extracted
- [ ] IIS site created for your domain
- [ ] win-acme executed successfully
- [ ] Certificate installed in IIS
- [ ] HTTPS binding configured
- [ ] Certificate verified (visit https://yourdomain)

### Reverse Proxy
- [ ] URL Rewrite Module installed
- [ ] ARR installed and proxy enabled
- [ ] web.config created with reverse proxy rules
- [ ] HTTP to HTTPS redirect configured
- [ ] Node.js app running (pm2 status)
- [ ] Reverse proxy tested (visit https://yourdomain)

### Mobile App
- [ ] EXPO_PUBLIC_API_URL updated to https://yourdomain
- [ ] usesCleartextTraffic removed from app.json
- [ ] APK rebuilt with new configuration
- [ ] APK tested on real device
- [ ] All API calls working over HTTPS

---

## 🎯 Quick Command Reference

```powershell
# Install IIS
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# Open firewall ports
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# Run win-acme
cd C:\win-acme
.\wacs.exe

# Check certificate
Get-ChildItem -Path Cert:\LocalMachine\My

# Start Node.js app
pm2 start ecosystem.config.js
pm2 save

# Check PM2 status
pm2 status
pm2 logs

# Test locally
curl https://localhost
curl https://yourapp.ddns.net

# Check DNS
nslookup yourapp.ddns.net

# Get public IP
Invoke-RestMethod -Uri "https://api.ipify.org"
```

---

## 📚 Additional Resources

- **win-acme Documentation**: https://www.win-acme.com/manual/getting-started
- **Let's Encrypt**: https://letsencrypt.org/
- **IIS URL Rewrite**: https://www.iis.net/downloads/microsoft/url-rewrite
- **No-IP Support**: https://www.noip.com/support
- **SSL Labs Test**: https://www.ssllabs.com/ssltest/

---

## 💡 Tips

1. **Keep No-IP DUC running** - Ensures domain always points to your current IP
2. **Test renewal** - Certificates expire every 90 days, test renewal process
3. **Monitor expiry** - Set calendar reminder to check certificate status
4. **Backup certificate** - Export certificate from IIS for backup
5. **Use HTTPS everywhere** - Update all API calls to use HTTPS

---

**Your setup is complete when:**
- ✅ https://yourapp.ddns.net loads without security warnings
- ✅ Mobile app connects successfully over HTTPS
- ✅ All API calls work
- ✅ Certificate auto-renewal is configured

**Congratulations! Your app is now secure with SSL! 🎉**
