# 🚀 LibroFlow — Complete Deployment Guide

This guide covers the **two best ways** to deploy LibroFlow:
1. **Free Cloud Deployment (Vercel + Render + Free MySQL)** — Recommended for online portfolio / sharing.
2. **One-Command Docker Deployment (Local or VPS)** — Recommended for servers / production.

---

## 🌟 Method 1: 100% Free Cloud Deployment

### Architecture:
- **Database:** Free Managed MySQL on [Aiven.io](https://aiven.io) or [TiDB Cloud](https://tidbcloud.com) or [Railway](https://railway.app)
- **Backend (API):** [Render.com](https://render.com) (Free Web Service)
- **Frontend (UI):** [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (Free Static Hosting + Global CDN)

---

### Step 1: Create Free Cloud MySQL Database
1. Go to **[Aiven.io](https://aiven.io)** (or TiDB Cloud) and sign up.
2. Click **Create Service** → Select **MySQL** → Select the **Free Tier**.
3. Once running, copy the **Connection URI** or note down:
   - Host (e.g. `mysql-xxxx.aivencloud.com`)
   - Port (e.g. `12345`)
   - User (e.g. `avnadmin`)
   - Password (e.g. `password`)
   - Database name: `defaultdb` (or create `library_db`)

---

### Step 2: Deploy Backend on Render.com
1. Push your project to **GitHub**.
2. Go to **[Render.com](https://render.com)** and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following build settings:
   - **Root Directory:** `backend`
   - **Environment:** `Docker` (Render will automatically detect `backend/Dockerfile`)
   - Or if using Native Java:
     - **Build Command:** `mvn clean package -DskipTests`
     - **Start Command:** `java -jar target/library-management-system-1.0.0.jar`
5. In **Environment Variables**, add:
   - `SPRING_DATASOURCE_URL` = `jdbc:mysql://<AIVEN_HOST>:<PORT>/defaultdb?useSSL=true&requireSSL=true`
   - `SPRING_DATASOURCE_USERNAME` = `<AIVEN_USER>`
   - `SPRING_DATASOURCE_PASSWORD` = `<AIVEN_PASSWORD>`
   - `JWT_SECRET` = `LibroFlowProductionSecretKeyVeryLongAndSecureString2026LibroFlow`
6. Click **Deploy Web Service**.
7. Once deployed, Render will give you a public URL (e.g., `https://libroflow-api.onrender.com`).

---

### Step 3: Deploy Frontend on Vercel or Netlify
1. Go to **[Vercel.com](https://vercel.com)**.
2. Click **Add New Project** → Import your GitHub repository.
3. In **Root Directory**, click Edit and select **`frontend`**.
4. Click **Deploy**.
5. Once deployed, open your Vercel site. To connect it to your live Render backend:
   - In browser console: `localStorage.setItem('libroflow_api_url', 'https://libroflow-api.onrender.com/api')`
   - Or edit `frontend/js/config.js` and `frontend/user/js/portal.js` with your Render backend URL.

---

## 🐳 Method 2: One-Command Docker Deployment (VPS or Local)

If you have a Linux VPS (DigitalOcean, AWS, Linode) or Docker installed:

```bash
# Start MySQL, Backend, and Frontend in the background
docker-compose up -d --build
```

- **Frontend:** `http://your-server-ip:3000`
- **Backend API:** `http://your-server-ip:8080`
- **MySQL Database:** `your-server-ip:3306`

To view logs:
```bash
docker-compose logs -f
```

To stop:
```bash
docker-compose down
```

---

## 💻 Method 3: Traditional JAR Deployment

### 1. Build the Backend JAR:
```bash
cd backend
mvn clean package -DskipTests
```
The compiled file is at `backend/target/library-management-system-1.0.0.jar`.

### 2. Run the JAR:
```bash
java -jar target/library-management-system-1.0.0.jar
```

### 3. Serve Frontend:
Use any web server (Nginx, Apache, or Node.js):
```bash
node frontend/server.js
```
