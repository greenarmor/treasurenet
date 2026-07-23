const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  // Subscription tiers
  await prisma.subscriptionTier.upsert({
    where: { type: 'FREE' },
    update: {},
    create: {
      name: 'Free',
      type: 'FREE',
      priceMonthly: 0,
      priceYearly: 0,
      maxHunts: 3,
      maxPlayers: 10,
      maxAdmins: 1,
      features: ['3 active hunts', '10 players', '1 Game Master', 'Public hunts', 'Basic leaderboard'],
    },
  });

  await prisma.subscriptionTier.upsert({
    where: { type: 'PRO' },
    update: {},
    create: {
      name: 'Pro',
      type: 'PRO',
      priceMonthly: 2900,
      priceYearly: 29000,
      maxHunts: 50,
      maxPlayers: 500,
      maxAdmins: 5,
      features: ['50 active hunts', '500 players', '5 Game Masters', 'Custom branding', 'Advanced analytics', 'Priority support'],
    },
  });

  await prisma.subscriptionTier.upsert({
    where: { type: 'ENTERPRISE' },
    update: {},
    create: {
      name: 'Enterprise',
      type: 'ENTERPRISE',
      priceMonthly: 9900,
      priceYearly: 99000,
      maxHunts: -1,
      maxPlayers: -1,
      maxAdmins: 20,
      features: ['Unlimited hunts', 'Unlimited players', '20 Game Masters', 'White-label', 'Dedicated support', 'SLA', 'Custom contracts'],
    },
  });

  console.log('Seed complete: subscription tiers created');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
