import { PrismaClient, Role, UserStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting RateIQ database seed...');

  // ---------------------------------------------------------
  // 1. PASSWORDS FOR DEVELOPMENT ACCOUNTS
  // ---------------------------------------------------------

  const adminPassword = await bcrypt.hash('Admin@12345', 10);
  const ownerPassword = await bcrypt.hash('Owner@12345', 10);
  const userPassword = await bcrypt.hash('User@12345', 10);

  // ---------------------------------------------------------
  // 2. ADMIN
  // ---------------------------------------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@rateiq.com',
    },
    update: {
      name: 'RateIQ Administrator',
      address: 'RateIQ HQ, Maharashtra, India',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminPassword,
    },
    create: {
      name: 'RateIQ Administrator',
      email: 'admin@rateiq.com',
      address: 'RateIQ HQ, Maharashtra, India',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminPassword,
    },
  });

  // ---------------------------------------------------------
  // 3. STORE OWNERS
  // ---------------------------------------------------------

  const owner1 = await prisma.user.upsert({
    where: {
      email: 'owner1@rateiq.com',
    },
    update: {
      name: 'Aarav Retail Group',
      address: 'Pune, Maharashtra, India',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      passwordHash: ownerPassword,
    },
    create: {
      name: 'Aarav Retail Group',
      email: 'owner1@rateiq.com',
      address: 'Pune, Maharashtra, India',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      passwordHash: ownerPassword,
    },
  });

  const owner2 = await prisma.user.upsert({
    where: {
      email: 'owner2@rateiq.com',
    },
    update: {
      name: 'Metro Retail Ventures',
      address: 'Mumbai, Maharashtra, India',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      passwordHash: ownerPassword,
    },
    create: {
      name: 'Metro Retail Ventures',
      email: 'owner2@rateiq.com',
      address: 'Mumbai, Maharashtra, India',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      passwordHash: ownerPassword,
    },
  });

  // ---------------------------------------------------------
  // 4. DEMO USERS
  // ---------------------------------------------------------

  const user1 = await prisma.user.upsert({
    where: {
      email: 'user1@rateiq.com',
    },
    update: {
      name: 'Priya Sharma',
      address: 'Pune, Maharashtra, India',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      passwordHash: userPassword,
    },
    create: {
      name: 'Priya Sharma',
      email: 'user1@rateiq.com',
      address: 'Pune, Maharashtra, India',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      passwordHash: userPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: {
      email: 'user2@rateiq.com',
    },
    update: {
      name: 'Rahul Patil',
      address: 'Solapur, Maharashtra, India',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      passwordHash: userPassword,
    },
    create: {
      name: 'Rahul Patil',
      email: 'user2@rateiq.com',
      address: 'Solapur, Maharashtra, India',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      passwordHash: userPassword,
    },
  });

  // ---------------------------------------------------------
  // 5. STORES
  // ---------------------------------------------------------

  const stores = [
    {
      name: 'Urban Basket',
      email: 'urbanbasket@rateiq.com',
      address: 'FC Road, Pune, Maharashtra',
      ownerId: owner1.id,
    },
    {
      name: 'FreshMart Central',
      email: 'freshmart@rateiq.com',
      address: 'Baner Road, Pune, Maharashtra',
      ownerId: owner1.id,
    },
    {
      name: 'Nova Electronics',
      email: 'novaelectronics@rateiq.com',
      address: 'MG Road, Pune, Maharashtra',
      ownerId: owner1.id,
    },
    {
      name: 'CityStyle Fashion',
      email: 'citystyle@rateiq.com',
      address: 'Linking Road, Mumbai, Maharashtra',
      ownerId: owner2.id,
    },
    {
      name: 'DailyNeeds Superstore',
      email: 'dailyneeds@rateiq.com',
      address: 'Andheri West, Mumbai, Maharashtra',
      ownerId: owner2.id,
    },
    {
      name: 'GreenLeaf Organics',
      email: 'greenleaf@rateiq.com',
      address: 'Viman Nagar, Pune, Maharashtra',
      ownerId: owner1.id,
    },
    {
      name: 'TechPoint Store',
      email: 'techpoint@rateiq.com',
      address: 'Aundh Road, Pune, Maharashtra',
      ownerId: owner1.id,
    },
    {
      name: 'Heritage Home',
      email: 'heritagehome@rateiq.com',
      address: 'Camp, Pune, Maharashtra',
      ownerId: owner2.id,
    },
  ];

  const createdStores = [];

  for (const storeData of stores) {
    const store = await prisma.store.upsert({
      where: {
        email: storeData.email,
      },
      update: {
        name: storeData.name,
        address: storeData.address,
        ownerId: storeData.ownerId,
      },
      create: storeData,
    });

    createdStores.push(store);
  }

  // ---------------------------------------------------------
  // 6. RATINGS
  // ---------------------------------------------------------

  const ratingPlan = [
    // Urban Basket
    { store: 'urbanbasket@rateiq.com', user: user1.id, value: 5 },
    { store: 'urbanbasket@rateiq.com', user: user2.id, value: 4 },

    // FreshMart
    { store: 'freshmart@rateiq.com', user: user1.id, value: 4 },
    { store: 'freshmart@rateiq.com', user: user2.id, value: 5 },

    // Nova Electronics
    { store: 'novaelectronics@rateiq.com', user: user1.id, value: 3 },
    { store: 'novaelectronics@rateiq.com', user: user2.id, value: 4 },

    // CityStyle
    { store: 'citystyle@rateiq.com', user: user1.id, value: 5 },
    { store: 'citystyle@rateiq.com', user: user2.id, value: 5 },

    // DailyNeeds
    { store: 'dailyneeds@rateiq.com', user: user1.id, value: 3 },
    { store: 'dailyneeds@rateiq.com', user: user2.id, value: 4 },

    // GreenLeaf
    { store: 'greenleaf@rateiq.com', user: user1.id, value: 5 },
    { store: 'greenleaf@rateiq.com', user: user2.id, value: 4 },

    // TechPoint
    { store: 'techpoint@rateiq.com', user: user1.id, value: 4 },
    { store: 'techpoint@rateiq.com', user: user2.id, value: 3 },

    // Heritage Home
    { store: 'heritagehome@rateiq.com', user: user1.id, value: 5 },
    { store: 'heritagehome@rateiq.com', user: user2.id, value: 4 },
  ];

  for (const item of ratingPlan) {
    const store = await prisma.store.findUnique({
      where: {
        email: item.store,
      },
    });

    if (!store) continue;

    await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId: item.user,
          storeId: store.id,
        },
      },
      update: {
        value: item.value,
      },
      create: {
        userId: item.user,
        storeId: store.id,
        value: item.value,
      },
    });
  }

  // ---------------------------------------------------------
  // 7. NOTIFICATIONS
  // ---------------------------------------------------------

  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId: owner1.id,
      title: 'Welcome to RateIQ',
    },
  });

  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: owner1.id,
        type: NotificationType.SYSTEM,
        title: 'Welcome to RateIQ',
        message:
          'Your store analytics workspace is ready. Monitor ratings, trends and customer signals from your dashboard.',
      },
    });
  }

  const existingRatingNotification = await prisma.notification.findFirst({
    where: {
      userId: owner1.id,
      title: 'New customer ratings',
    },
  });

  if (!existingRatingNotification) {
    await prisma.notification.create({
      data: {
        userId: owner1.id,
        type: NotificationType.RATING,
        title: 'New customer ratings',
        message:
          'Your stores have received new customer ratings. Review the latest feedback from your owner dashboard.',
      },
    });
  }

  // ---------------------------------------------------------
  // 8. AUDIT LOGS
  // ---------------------------------------------------------

  const existingAuditLog = await prisma.auditLog.findFirst({
    where: {
      actorId: admin.id,
      action: 'SEED_DATABASE',
    },
  });

  if (!existingAuditLog) {
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'SEED_DATABASE',
        entityType: 'SYSTEM',
        metadata: {
          source: 'prisma-seed',
          storesCreated: createdStores.length,
          environment: 'development',
        },
      },
    });
  }

  // ---------------------------------------------------------
  // 9. SUMMARY
  // ---------------------------------------------------------

  const userCount = await prisma.user.count();
  const storeCount = await prisma.store.count();
  const ratingCount = await prisma.rating.count();
  const notificationCount = await prisma.notification.count();
  const auditCount = await prisma.auditLog.count();

  console.log('');
  console.log('RateIQ seed completed successfully!');
  console.log('');
  console.log(`Users:          ${userCount}`);
  console.log(`Stores:         ${storeCount}`);
  console.log(`Ratings:        ${ratingCount}`);
  console.log(`Notifications:  ${notificationCount}`);
  console.log(`Audit Logs:     ${auditCount}`);
  console.log('');
  console.log('Development accounts:');
  console.log('');
  console.log('ADMIN');
  console.log('Email:    admin@rateiq.com');
  console.log('Password: Admin@12345');
  console.log('');
  console.log('OWNER');
  console.log('Email:    owner1@rateiq.com');
  console.log('Password: Owner@12345');
  console.log('');
  console.log('USER');
  console.log('Email:    user1@rateiq.com');
  console.log('Password: User@12345');
  console.log('');
}

main()
  .catch((error) => {
    console.error('Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });