import { PrismaClient } from "@prisma/client";
import albums from "../seeds-data/albums.js";

const prisma = new PrismaClient();

async function main() {
  for (const album of albums) {
    const createdAlbum = await prisma.album.create({
      data: {
        title: album.title,
        releaseDate: new Date(album.release_date),
        artworkUrl: `http://localhost:5000/${album.image_url}`, // Ensure your URL structure matches your app's routing
      },
    });

    console.log({ createdAlbum });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
