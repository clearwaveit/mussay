import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SAMPLE_CODES = [
  'MOUS0001', 'MOUS0002', 'MOUS0003', 'MOUS0004', 'MOUS0005',
  'MOUS0006', 'MOUS0007', 'MOUS0008', 'MOUS0009', 'MOUS0010',
  'GOLD0001', 'GOLD0002', 'GOLD0003', 'GOLD0004', 'GOLD0005',
  'WIN00001', 'WIN00002', 'WIN00003', 'WIN00004', 'WIN00005',
]

async function main() {
  // Ensure campaign record exists
  await prisma.campaign.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isActive: true },
  })

  // Seed sample codes
  for (const code of SAMPLE_CODES) {
    await prisma.code.upsert({
      where: { code },
      update: {},
      create: { code },
    })
  }

  console.log(`✅ Seeded ${SAMPLE_CODES.length} cap codes`)
  console.log('✅ Campaign record created')
  console.log(`\n🔐 Admin password is set via ADMIN_PASSWORD env variable`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
