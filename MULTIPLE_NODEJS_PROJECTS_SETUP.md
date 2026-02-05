# Running Multiple Node.js Projects on Windows Server

## 🎯 Overview

You can run multiple Node.js projects on the same server using different approaches.

---

## 📊 Options Comparison

| Method | Complexity | Best For |
|--------|-----------|----------|
| Different Ports | Easy | 2-3 projects |
| Different Domains | Medium | Multiple apps with own domains |
| Subdomains | Medium | Related apps |
| Path-based Routing | Medium | Single domain, multiple apps |

---

## ⚡ Method 1: Different Ports (Simplest)

Run each project on a different port.

### Setup

**Project 1:**
```powershell
# Port 3000
cd C:\inetpub\wwwroot\project1
pm2 start ecosystem.config.js --name "project1"
```

**Project 2:**
```powershell
# Port 3001
cd C:\inetpub\wwwroot\project2
pm2 start npm --name "project2" -- start
```

### Configure ecosystem.config.js for each project

**Project 1 - ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'project1',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

**Project 2 - ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'project2',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

### Open Firewall Ports

```powershell
New-NetFirewallRule -DisplayName "Project 1 Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Project 2 Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### Access

- Project 1: `http://your-server-ip:3000`
- Project 2: `http://your-server-ip:3001`

**Pros:**
- ✅ Simple setup
- ✅ Easy to manage

**Cons:**
- ❌ Users see port numbers in URL
- ❌ Need SSL for each port
- ❌ Not professional looking

---

## 🌐 Method 2: Different Domains (Recommended)

Use different domains/subdomains for each project.

### Setup

**Get domains:**
- Project 1: `app1.ddns.net` (No-IP)
- Project 2: `app2.ddns.net` (No-IP)

Or use subdomains:
- Project 1: `app1.yourdomain.com`
- Project 2: `app2.yourdomain.com`

### Configure Projects

**Project 1 runs on port 3000:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'project1',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

**Project 2 runs on port 3001:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'project2',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

### Create IIS Sites

**Site 1:**
1. Open IIS Manager
2. Add Website
   - Name: `Project1`
   - Physical path: `C:\inetpub\wwwroot\project1`
   - Binding: `app1.ddns.net` (port 80)

**Site 2:**
1. Add Website
   - Name: `Project2`
   - Physical path: `C:\inetpub\wwwroot\project2`
   - Binding: `app2.ddns.net` (port 80)

### Configure Reverse Proxy for Each Site

**Project 1 - web.config:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxy" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

**Project 2 - web.config:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxy" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

### Install SSL for Each Domain

```powershell
cd C:\win-acme
.\wacs.exe

# Select both sites
# Certificates will be installed for both domains
```

### Access

- Project 1: `https://app1.ddns.net`
- Project 2: `https://app2.ddns.net`

**Pros:**
- ✅ Professional URLs
- ✅ Separate SSL certificates
- ✅ Easy to manage
- ✅ Can scale independently

**Cons:**
- ❌ Need multiple domains/subdomains

---

## 🔀 Method 3: Path-Based Routing (Single Domain)

Use one domain with different paths.

### Example

- Project 1: `https://yourdomain.com/app1`
- Project 2: `https://yourdomain.com/app2`

### Configure IIS URL Rewrite

**Single site web.config:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Project 1 -->
                <rule name="Project1" stopProcessing="true">
                    <match url="^app1/(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
                
                <!-- Project 2 -->
                <rule name="Project2" stopProcessing="true">
                    <match url="^app2/(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/{R:1}" />
                </rule>
                
                <!-- Default to Project 1 -->
                <rule name="Default" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

### Update Next.js Base Path

**Project 1 - next.config.mjs:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/app1',
  assetPrefix: '/app1',
}

export default nextConfig
```

**Project 2 - next.config.mjs:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/app2',
  assetPrefix: '/app2',
}

export default nextConfig
```

**Pros:**
- ✅ Single domain
- ✅ Single SSL certificate

**Cons:**
- ❌ More complex configuration
- ❌ Apps need to be aware of base path
- ❌ Can cause routing issues

---

## 🚀 Method 4: Using PM2 Ecosystem File (All Projects)

Manage all projects from one PM2 configuration.

### Create master ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'project1',
      cwd: 'C:/inetpub/wwwroot/project1',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'project2',
      cwd: 'C:/inetpub/wwwroot/project2',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
}
```

### Start All Projects

```powershell
pm2 start ecosystem.config.js
pm2 save
```

### Manage Projects

```powershell
# View all projects
pm2 status

# Restart specific project
pm2 restart project1
pm2 restart project2

# View logs
pm2 logs project1
pm2 logs project2

# Stop specific project
pm2 stop project1

# Delete project
pm2 delete project1
```

---

## 📱 Mobile App Configuration

### For Different Domains

**Mobile App 1:**
```env
EXPO_PUBLIC_API_URL=https://app1.ddns.net
```

**Mobile App 2:**
```env
EXPO_PUBLIC_API_URL=https://app2.ddns.net
```

### For Different Ports

**Mobile App 1:**
```env
EXPO_PUBLIC_API_URL=https://yourdomain.com:3000
```

**Mobile App 2:**
```env
EXPO_PUBLIC_API_URL=https://yourdomain.com:3001
```

### For Path-Based

**Mobile App 1:**
```env
EXPO_PUBLIC_API_URL=https://yourdomain.com/app1
```

**Mobile App 2:**
```env
EXPO_PUBLIC_API_URL=https://yourdomain.com/app2
```

---

## 🎯 Recommended Setup for Your Case

### Best Approach: Different Domains with IIS Reverse Proxy

**Why:**
- ✅ Clean URLs
- ✅ Separate SSL certificates
- ✅ Easy to manage
- ✅ Professional
- ✅ Can scale independently

**Setup:**

1. **Get two No-IP domains:**
   - `yourapp1.ddns.net`
   - `yourapp2.ddns.net`

2. **Run projects on different ports:**
   ```powershell
   # Project 1 on port 3000
   cd C:\inetpub\wwwroot\project1
   pm2 start ecosystem.config.js --name "project1"
   
   # Project 2 on port 3001
   cd C:\inetpub\wwwroot\project2
   pm2 start ecosystem.config.js --name "project2"
   ```

3. **Create two IIS sites:**
   - Site 1: `yourapp1.ddns.net` → proxy to `localhost:3000`
   - Site 2: `yourapp2.ddns.net` → proxy to `localhost:3001`

4. **Install SSL for both:**
   ```powershell
   cd C:\win-acme
   .\wacs.exe
   # Select both sites
   ```

5. **Update mobile apps:**
   - App 1: `EXPO_PUBLIC_API_URL=https://yourapp1.ddns.net`
   - App 2: `EXPO_PUBLIC_API_URL=https://yourapp2.ddns.net`

---

## 🔧 Complete Example Setup

### Directory Structure

```
C:\inetpub\wwwroot\
├── project1\
│   ├── app\
│   ├── node_modules\
│   ├── package.json
│   ├── ecosystem.config.js
│   └── web.config
└── project2\
    ├── app\
    ├── node_modules\
    ├── package.json
    ├── ecosystem.config.js
    └── web.config
```

### Project 1 Configuration

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'project1',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

**web.config:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="HTTPS Redirect" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{HTTPS}" pattern="^OFF$" />
                    </conditions>
                    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" />
                </rule>
                <rule name="ReverseProxy" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

### Project 2 Configuration

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'project2',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

**web.config:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="HTTPS Redirect" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{HTTPS}" pattern="^OFF$" />
                    </conditions>
                    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" />
                </rule>
                <rule name="ReverseProxy" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

### Start Both Projects

```powershell
# Start project 1
cd C:\inetpub\wwwroot\project1
pm2 start ecosystem.config.js

# Start project 2
cd C:\inetpub\wwwroot\project2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

---

## 🐛 Troubleshooting

### Port Already in Use

```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Project Not Starting

```powershell
# Check PM2 logs
pm2 logs project1
pm2 logs project2

# Restart project
pm2 restart project1
```

### IIS Not Proxying Correctly

1. Check URL Rewrite module is installed
2. Check ARR proxy is enabled
3. Check web.config syntax
4. Check Node.js app is running: `pm2 status`

### SSL Certificate Issues

```powershell
# Re-run win-acme for specific site
cd C:\win-acme
.\wacs.exe

# Select the problematic site
```

---

## 📊 Resource Management

### Monitor Resources

```powershell
# PM2 monitoring
pm2 monit

# Check memory usage
pm2 status

# View detailed info
pm2 show project1
```

### Set Memory Limits

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'project1',
    script: 'npm',
    args: 'start',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

---

## ✅ Quick Checklist

### For Each Project
- [ ] Project code uploaded to server
- [ ] Dependencies installed (`npm install`)
- [ ] Project built (`npm run build`)
- [ ] ecosystem.config.js configured with unique port
- [ ] PM2 started (`pm2 start ecosystem.config.js`)
- [ ] IIS site created
- [ ] web.config configured with correct port
- [ ] Domain/subdomain pointing to server
- [ ] SSL certificate installed
- [ ] Firewall allows traffic
- [ ] Mobile app configured with correct URL
- [ ] Tested and working

---

## 💡 Best Practices

1. **Use different ports** - 3000, 3001, 3002, etc.
2. **Use descriptive PM2 names** - Easy to identify projects
3. **Keep ports internal** - Only expose 80/443, use IIS reverse proxy
4. **Monitor resources** - Use `pm2 monit` regularly
5. **Separate domains** - More professional than ports or paths
6. **Backup configurations** - Save ecosystem.config.js and web.config
7. **Document ports** - Keep a list of which project uses which port
8. **Use PM2 logs** - Debug issues quickly

---

**You can run as many Node.js projects as your server resources allow!**
