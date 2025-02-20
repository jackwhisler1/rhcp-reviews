import { PrismaClient } from "@prisma/client";
import albums from "../seeds-data/albumsWithSongs.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

  // Create users
  const users = await Promise.all(
    [
      {
        username: "aidan",
        email: "aidan@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
      {
        username: "alex",
        email: "alex@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
      {
        username: "andrew",
        email: "andrew@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
      {
        username: "jack",
        email: "jack@example.com",
        password: await bcrypt.hash("Password123!", 10),
      },
    ].map((user) =>
      prisma.user.create({
        data: user,
      })
    )
  );

  // Create a group
  const group = await prisma.group.create({
    data: {
      name: "RHCP Superfans",
      description: "Die-hard Red Hot Chili Peppers fans group",
      isPrivate: true,
      inviteCode: crypto.randomBytes(6).toString("hex"),
    },
  });

  // Add all users to the group
  await Promise.all(
    users.map((user, index) =>
      prisma.userGroup.create({
        data: {
          userId: user.id,
          groupId: group.id,
          role: index === 0 ? "admin" : "member", // First user is admin
        },
      })
    )
  );

  const albumsToSeed = ["Blood Sugar Sex Magik", "Return of the Dream Canteen"];
  const songs = await prisma.song.findMany({
    where: {
      album: {
        title: {
          in: albumsToSeed,
        },
      },
    },
    include: {
      album: true,
    },
  });
  // Create reviews for each user (34 songs per user × 4 users = 136 reviews)
  const reviewData = Array.from({ length: songs.length * users.length }).map(
    (_, index) => {
      const userIndex = Math.floor(index / songs.length);
      const songIndex = index % songs.length;

      // Generate unique ratings based on user
      const baseRatings = {
        aidan: 1.5 + Math.random() * 7.5, // 8.5-10
        alex: 3.5 + Math.random() * 4.5, // 7.5-9.5
        andrew: 1.0 + Math.random() * 8.0, // 9.0-10
        jack: 0.5 + Math.random() * 9.5, // 6.5-9.0
      };

      const user = users[userIndex];
      const rating = baseRatings[user.username];
      const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal

      return {
        content: `${user.username}'s review of ${songs[songIndex].title} from ${songs[songIndex].album.title}`,
        rating: roundedRating,
        songId: songs[songIndex].id,
        userId: user.id,
        groupId: group.id,
      };
    }
  );

  // Create reviews in batches of 50
  const batchSize = 50;
  for (let i = 0; i < reviewData.length; i += batchSize) {
    const batch = reviewData.slice(i, i + batchSize);
    await prisma.review.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(
      `Created batch ${i / batchSize + 1} of ${Math.ceil(reviewData.length / batchSize)}`
    );
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
