import { PrismaClient } from "@prisma/client";
import albums from "../seeds-data/albumsWithSongs.js";

const prisma = new PrismaClient();

async function main() {
  // Wipe current database
  await prisma.review.deleteMany({});
  await prisma.song.deleteMany({});
  await prisma.album.deleteMany({});

  // Seed albums and songs
  for (const album of albums) {
    const createdAlbum = await prisma.album.create({
      data: {
        title: album.title,
        releaseDate: new Date(album.release_date),
        artworkUrl: `http://localhost:5000/${album.image_url}`,
      },
    });

    console.log({ createdAlbum });

    // Seed corresponding songs
    for (const song of album.songs) {
      const createdSong = await prisma.song.create({
        data: {
          title: song.title,
          trackNumber: song.trackNumber,
          albumId: createdAlbum.id, // Use the ID of the created album
          duration: song.duration,
        },
      });
      console.log({ createdSong });
    }
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
