import type { Expression } from '../lib/types'
import { MascotAvatar } from './Mascot'

export const AVATAR_EXPRESSIONS: Expression[] = ['curious', 'happy', 'determined', 'excited', 'thinking', 'victorious']

const isExpression = (value: string): value is Expression => (AVATAR_EXPRESSIONS as string[]).includes(value)

/** A profile picture: either an uploaded image (stored as a data URL) or a QUEST expression. */
export function Avatar({ avatar, size = 40 }: { avatar: string; size?: number }) {
  if (avatar.startsWith('data:image/')) {
    return <img src={avatar} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover ring-1 ring-line" style={{ width: size, height: size }} />
  }
  return <MascotAvatar expression={isExpression(avatar) ? avatar : 'curious'} size={size} />
}

const AVATAR_PX = 128

/** Reads an image file and returns a small square JPEG data URL suitable for storing as an avatar. */
export const fileToAvatar = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = AVATAR_PX
      canvas.height = AVATAR_PX
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) return reject(new Error('Could not process that image.'))
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_PX, AVATAR_PX)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
