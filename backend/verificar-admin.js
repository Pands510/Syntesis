import "dotenv/config";
import prisma from "./database/prisma.js";

const user = await prisma.user.findUnique({
  where: { email: "admin@syntesis.com" },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true
  }
});

console.log(user);

await prisma.$disconnect();
