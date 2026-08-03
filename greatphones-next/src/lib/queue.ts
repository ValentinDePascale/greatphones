import { Queue, Worker, type ConnectionOptions } from 'bullmq'

const connection: ConnectionOptions = {
  url: process.env.REDIS_URL,
}

let emailQueue: Queue | null = null
let workerStarted = false

export function getEmailQueue(): Queue | null {
  if (!process.env.REDIS_URL) return null
  if (!emailQueue) {
    try {
      emailQueue = new Queue('chat-emails', { connection })
      if (!workerStarted) {
        workerStarted = true
        startEmailWorker()
      }
    } catch {
      console.warn('[Queue] Redis not available — emails will send directly')
      return null
    }
  }
  return emailQueue
}

export interface EmailJob {
  type: 'admin-new-message' | 'admin-reply' | 'admin-auto-reply'
  to: string
  userName: string
  messageText: string
  conversationId: string
  conversationType?: string
  adminName?: string
}

export async function enqueueEmail(job: EmailJob): Promise<boolean> {
  const queue = getEmailQueue()
  if (!queue) return false
  try {
    await queue.add('send-email', job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    })
    return true
  } catch {
    return false
  }
}

export function startEmailWorker(): Worker | null {
  if (!process.env.REDIS_URL) return null

  try {
    const worker = new Worker(
      'chat-emails',
      async (job) => {
        const data = job.data as EmailJob
        const { sendNewMessageToAdminEmail, sendAdminReplyEmail } = await import('@/lib/email')
        const { prisma } = await import('@/lib/prisma')

        if (data.type === 'admin-new-message' || data.type === 'admin-auto-reply') {
          await sendNewMessageToAdminEmail({
            adminEmail: data.to,
            userName: data.userName,
            messageText: data.messageText,
            conversationId: data.conversationId,
            conversationType: (data.conversationType as any) || 'GENERIC',
          })
        } else if (data.type === 'admin-reply') {
          await sendAdminReplyEmail({
            userEmail: data.to,
            userName: data.userName,
            adminName: data.adminName || 'Great Phones',
            messageText: data.messageText,
            conversationId: data.conversationId,
          })
        }

        await prisma.$disconnect()
      },
      {
        connection,
        concurrency: 3,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      }
    )

    worker.on('error', () => {
      // Connection errors are expected when Redis is unreachable
    })

    return worker
  } catch {
    return null
  }
}
