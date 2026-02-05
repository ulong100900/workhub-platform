import { NextRequest } from 'next/server'
import busboy from 'busboy'

export interface UploadedFile {
  filename: string
  data: Buffer
  encoding: string
  mimetype: string
  fieldname: string
}

export async function parseFormData(request: NextRequest): Promise<{
  files: UploadedFile[]
  fields: Record<string, string>
}> {
  return new Promise((resolve, reject) => {
    const files: UploadedFile[] = []
    const fields: Record<string, string> = {}
    
    const contentType = request.headers.get('content-type') || ''
    
    // Используем busboy для парсинга multipart/form-data
    const bb = busboy({
      headers: {
        'content-type': contentType,
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    })

    bb.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info
      const chunks: Buffer[] = []
      
      file.on('data', (chunk) => {
        chunks.push(chunk)
      })

      file.on('end', () => {
        files.push({
          filename: filename || `file-${Date.now()}`,
          data: Buffer.concat(chunks),
          encoding,
          mimetype: mimeType,
          fieldname,
        })
      })
    })

    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val
    })

    bb.on('error', (err) => {
      reject(err)
    })

    bb.on('close', () => {
      resolve({ files, fields })
    })

    // Получаем тело запроса как поток
    if (request.body) {
      const reader = request.body.getReader()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            bb.end()
            break
          }
          bb.write(value)
        }
      }
      pump().catch(reject)
    } else {
      reject(new Error('No request body'))
    }
  })
}