import type { NextApiRequest, NextApiResponse } from 'next'
import type { ShortUrl } from '@prisma/client'

import prisma from 'prisma/client'
import { nanoid } from 'nanoid/async'

export default async (req: NextApiRequest, res: NextApiResponse<ShortUrl>) => {
  const method = req.method

  const query = req.query
  const body = req.body

  await prisma.$connect()

  switch (method) {
    case 'GET':
      const { path } = query
      if (!path) return res.status(400).end('Path query param required')

      // fetch short url
      const get_result = await prisma.shortUrl.findUnique({
        where: {
          tiny_url: path as string,
        },
      })

      if (!get_result) return res.status(404).end('Could not find shortUrl')
      return res.status(200).json(get_result)
    case 'POST':
      const { destination } = body
      if (!destination)
        return res.status(400).end('Destination body param required')

      // check if destination already exists
      const check_result = await prisma.shortUrl.findFirst({
        where: {
          destination: destination as string,
        },
      })

      if (check_result) return res.status(200).json(check_result)

      // generate short url & push to mongodb
      const tiny_url = await nanoid(7)
      const post_result = await prisma.shortUrl.create({
        data: {
          destination,
          tiny_url,
        },
      })

      return res.status(200).json(post_result)

    default:
      return res.status(405).end('Method not allowed, use GET or POST instead')
  }
}
