// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stadiumArcadium = await prisma.album.create({
    data: {
      title: "Stadium Arcadium",
      releaseDate: new Date("2006-05-09"),
      artworkUrl: "http://localhost:5000/src/images/stadium_arcadium.jpg",
    },
  });

  console.log({ stadiumArcadium });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
