import { PrismaClient } from "@prisma/client";
import nanoid from "nanoid";

const prisma = new PrismaClient();
const expiryDays = 30;

export async function getDestination(path:string) {
    const shortUrl = await prisma.shortUrl.findUnique({
        where: {
            tiny_url: path
        }
    });

    return shortUrl?.destination
}

export async function CreateShortUrl(destination: string) {
    const short_url = await prisma.shortUrl.create({
        data: {
            destination: destination,
            tiny_url: nanoid(7),
        }
    })

    return short_url.tiny_url
}

export async function cleanUrls() {
    const today: Date = new Date();
    
    
    const res = await prisma.shortUrl.deleteMany({where : {
        created: {
            lt: new Date(today.getDate() + expiryDays)
        }
    }});

    console.log(`deleted ${res.count} old `)
}
