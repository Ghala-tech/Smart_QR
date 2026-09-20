const path = require('path');
const express = require('express');
const cors = require('cors');
const { ApiError } = require('./errors');

const settingsRouter = require('./routes/settings');
const buildingsRouter = require('./routes/buildings');
const locationsRouter = require('./routes/locations');
const devicesRouter = require('./routes/devices');
const techniciansRouter = require('./routes/technicians');
const employeesRouter = require('./routes/employees');
const authRouter = require('./routes/auth');
const reportsRouter = require('./routes/reports');
const notificationsRouter = require('./routes/notifications');
const adminRouter = require('./routes/admin');
const pushRouter = require('./routes/push');

const app = express();

app.use(cors());
app.use(express.json({ limit: '6mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/settings', settingsRouter);
app.use('/api/buildings', buildingsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/technicians', techniciansRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/auth', authRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/push', pushRouter);

// 404 handler for unknown /api routes.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'المسار غير موجود.' });
});

// Serve the existing frontend (unchanged design) from the sibling
// `frontend/` folder, so the whole project runs as a single server on one
// origin (no CORS setup needed to actually use the app; cors() above is
// kept only so the API can still be called from a different origin during
// development if needed).
const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Central error-handling middleware. Any thrown ApiError (or generic Error)
// from a route handler lands here and is turned into a consistent JSON
// error payload instead of an HTML stack trace / unhandled crash.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'صيغة البيانات المرسلة غير صالحة.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'حجم البيانات المرسلة كبير جدًا.' });
  }
  console.error(err); // eslint-disable-line no-console
  res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم.' });
});

module.exports = app;
