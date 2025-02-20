import { NextResponse } from 'next/server'
import { z } from 'zod'

const AuthHeaderSchema = z.string().min(1)

function validateAuthToken(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Invalid authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.split('Bearer ')[1]
  const result = AuthHeaderSchema.safeParse(token)
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid token format' },
      { status: 401 }
    )
  }

  return token
} 