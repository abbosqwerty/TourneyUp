// Point the shared Prisma client at the test database before anything imports it.
if (process.env.DATABASE_URL_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
