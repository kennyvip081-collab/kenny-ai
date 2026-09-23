import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Groq from 'groq-sdk'
import { InferenceClient } from '@huggingface/inference'

dotenv.config({ path: '.env.local' })

console.log(
  'GROQ_API_KEY exists:',
  !!process.env.GROQ_API_KEY
)

console.log(
  'HF_TOKEN exists:',
  !!process.env.HF_TOKEN
)

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true,
  })
)

app.use(
  express.json({
    limit: '20mb',
  })
)

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const huggingface = new InferenceClient(
  process.env.HF_TOKEN
)

/* =========================
   CHAT / IMAGE ANALYSIS
========================= */

app.post(
  '/api/chat',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        message,
        image,
        history,
      } = req.body

      if (!message?.trim() && !image) {
        return res.status(400).json({
          error:
            'Message or image is required.',
        })
      }

      const messages: any[] = []

      if (Array.isArray(history)) {
        history.forEach((item) => {
          if (
            item?.role &&
            item?.content
          ) {
            messages.push({
              role: item.role,
              content: item.content,
            })
          }
        })
      }

      const userContent: any[] = []

      if (message?.trim()) {
        userContent.push({
          type: 'text',
          text: message.trim(),
        })
      }

      if (image) {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: image,
          },
        })
      }

      messages.push({
        role: 'user',
        content:
          userContent.length === 1 &&
          userContent[0].type === 'text'
            ? userContent[0].text
            : userContent,
      })

      console.log(
        'Sending request to Groq...'
      )

      const completion =
        await groq.chat.completions.create({
          model:
            'qwen/qwen3.8-27b',
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        })

      res.setHeader(
        'Content-Type',
        'text/plain; charset=utf-8'
      )

      res.setHeader(
        'Transfer-Encoding',
        'chunked'
      )

      res.setHeader(
        'Cache-Control',
        'no-cache'
      )

      res.setHeader(
        'Connection',
        'keep-alive'
      )

      for await (
        const chunk of completion
      ) {
        const content =
          chunk.choices?.[0]?.delta
            ?.content

        if (content) {
          res.write(content)
        }
      }

      res.end()
    } catch (error) {
      console.error(
        'Chat error:',
        error
      )

      if (!res.headersSent) {
        return res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Something went wrong with Kenny AI.',
        })
      }

      res.end()
    }
  }
)

/* =========================
   AI IMAGE GENERATION
========================= */
app.post(
  '/api/generate-image',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { prompt } = req.body

      if (!prompt?.trim()) {
        return res.status(400).json({
          error:
            'Image prompt is required.',
        })
      }

      console.log(
        'Image generation request:',
        prompt
      )

      if (!process.env.HF_TOKEN) {
        return res.status(500).json({
          error:
            'Hugging Face token is not configured.',
        })
      }

      console.log(
        'Sending prompt to Hugging Face...'
      )

      const imageBlob =
        await huggingface.textToImage(
          {
            model:
              'black-forest-labs/FLUX.1-schnell',
            inputs: prompt.trim(),
            provider: 'auto',
          },
          {
            outputType: 'blob',
          }
        )

      console.log(
        'Hugging Face returned:',
        imageBlob.constructor.name
      )

      const arrayBuffer =
        await imageBlob.arrayBuffer()

      const buffer =
        Buffer.from(arrayBuffer)

      const base64Image =
        buffer.toString('base64')

      const contentType =
        imageBlob.type ||
        'image/png'

      const imageData =
        `data:${contentType};base64,${base64Image}`

      console.log(
        'Image converted successfully.'
      )

      return res.status(200).json({
        image: imageData,
        prompt: prompt.trim(),
      })
    } catch (error) {
      console.error(
        'Image generation error:',
        error
      )

      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Image generation failed.',
      })
    }
  }
)

/* =========================
   SERVER
========================= */

const PORT = 3001

app.listen(PORT, () => {
  console.log(
    `Kenny AI server running on http://localhost:${PORT}`
  )
})