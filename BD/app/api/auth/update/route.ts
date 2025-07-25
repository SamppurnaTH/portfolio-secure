import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { withCors, handleOptions } from '@/lib/cors'

// ✅ Updated schema: Fully optional fields with validation
const updateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email').optional(),
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Minimum 6 characters').optional(),
  photo: z.string().url('Photo must be a valid URL').optional(),
})

// ✅ Simulated admin profile
let adminProfile = {
  name: process.env.ADMIN_NAME || 'Admin User',
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  photo: '/admin-avatar.png',
  passwordHash: bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', 10), // Simulated stored password
}

// ✅ Handle CORS Preflight
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req)
}

// ✅ PUT /api/auth/update
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = updateSchema.parse(body)

    const { name, email, oldPassword, newPassword, photo } = validated

    // 🔒 Handle password change
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, adminProfile.passwordHash)
      if (!isMatch) {
        return withCors(
          NextResponse.json(
            { success: false, message: 'Old password is incorrect' },
            { status: 400 }
          ),
          req
        )
      }
      adminProfile.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    // 📝 Selectively update fields
    adminProfile = {
      ...adminProfile,
      name: name ?? adminProfile.name,
      email: email ?? adminProfile.email,
      photo: photo ?? adminProfile.photo,
    }

    return withCors(
      NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          name: adminProfile.name,
          email: adminProfile.email,
          photo: adminProfile.photo,
        },
      }),
      req
    )
  } catch (err: any) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: err?.message || 'Invalid input or server error',
        },
        { status: 400 }
      ),
      req
    )
  }
}
