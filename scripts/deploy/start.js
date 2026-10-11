/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS entry for pm2 */
// ISPmanager (pm2) uchun kirish fayli: panel PORT ni beradi, nginx 127.0.0.1 ga proksi qiladi.
// Socket rejimi tanlansa, SOCKET o'rniga panelda "Port" rejimini tanlang.
process.env.HOSTNAME = process.env.APP_HOST || '127.0.0.1'
require('./server.js')
