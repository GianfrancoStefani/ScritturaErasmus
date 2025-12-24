
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserPhoto() {
  const email = 'stefani.gianfranco@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, photo: true }
  });
  console.log('User Photo Data:', user);
}

checkUserPhoto()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
