// ✅ Cleaned & Updated Profile Page - Simplified

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  LogOut,
  Mail,
  User,
  Image,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ImageUploader from '@/components/custom/image-uploader'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE) {
  throw new Error('API base URL is not configured.');
}

// Define the photo schema part conditionally to avoid SSR issues with 'File'
const photoSchemaPart = typeof window !== 'undefined'
  ? z.union([z.string().url(), z.instanceof(File)]) // Client-side: can be string URL or File object
  : z.string().url(); // Server-side (during initial parse): only expects string URL

const profileSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    photo: photoSchemaPart.optional(),
  });

// Explicitly define ProfileFormData to include File type
type ProfileFormData = {
  name: string;
  email: string;
  photo?: string | File; // Can be a string URL (initial) or a File object (new upload)
}

// Updated ProfileData type to remove lastLoginIP and lastLoginTime
type ProfileData = {
  name: string
  email: string
  photo: string
}

export default function AdminProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', photo: undefined },
  })

  const photo = watch('photo') // Watching 'photo' will reflect current form value (string URL or File object)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
        })
        const data = await res.json()
        if (data?.success) {
          const profileData: ProfileData = {
            name: data.user.name,
            email: data.user.email,
            // Removed lastLoginIP and lastLoginTime assignments
            photo: data.user.photo || '/images/Avatar.png',
          }
          setProfile(profileData)
          reset({ name: profileData.name, email: profileData.email, photo: profileData.photo || undefined })
        } else {
          toast.error('Failed to load profile')
          if (res.status === 401 || res.status === 403) router.push('/admin/login')
        }
      } catch {
        toast.error('Error fetching profile')
      }
    }
    fetchProfile()
    // Cleanup for URL.createObjectURL if 'photo' object URL is created
    return () => {
      if (photo instanceof File && photo.name) { // Add photo.name check for more robustness
        // Only revoke if photo is a File and has a valid name (indicating it's an object URL)
        URL.revokeObjectURL(URL.createObjectURL(photo));
      }
    };
  }, [reset, router, photo])

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('email', data.email)

      if (data.photo instanceof File) {
        formData.append('photo', data.photo)
      }
      else if (data.photo === undefined && profile?.photo && profile.photo !== '/images/Avatar.png') {
        formData.append('photo', 'REMOVE_PHOTO_INDICATOR');
      }

      const res = await fetch(`${API_BASE}/api/auth/update`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })
      const result = await res.json()

      if (result.success) {
        toast.success(<div className="flex items-center gap-2"><CheckCircle2 className="text-green-500 w-5 h-5" /><span>{result.message || 'Profile updated!'}</span></div>)
        const updatedPhoto = result.user?.photo === null ? undefined : result.user?.photo;
        setProfile((prev) => prev ? { ...prev, name: data.name, email: data.email, photo: updatedPhoto || prev.photo } : null)
        reset({ name: data.name, email: data.email, photo: updatedPhoto || profile?.photo })
      } else {
        toast.error(<div className="flex items-center gap-2"><XCircle className="text-red-500 w-5 h-5" /><span>{result.message || 'Failed to update profile'}</span></div>)
      }
    } catch {
      toast.error(<div className="flex items-center gap-2"><XCircle className="text-red-500 w-5 h-5" /><span>An unexpected error occurred</span></div>)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' })
      toast.success('Logged out successfully')
      router.push('/admin/login')
    } catch {
      toast.error('Logout failed')
    } finally {
      setLoading(false)
    }
  }

  const FormField = ({ label, icon: Icon, error, children }: { label: string; icon: React.ElementType; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
        <Icon className="w-4 h-4 text-slate-400" />
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        <Loader2 className="animate-spin w-5 h-5 mr-2" /> Loading profile...
      </div>
    )
  }

  // Determine the photo URL to display
  let currentPhotoUrl: string | undefined;
  if (photo instanceof File) {
    currentPhotoUrl = URL.createObjectURL(photo);
  } else if (typeof photo === 'string') {
    currentPhotoUrl = photo;
  } else {
    currentPhotoUrl = profile.photo || '/images/Avatar.png';
  }


  return (
    <motion.div className="p-6 space-y-6 max-w-xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex items-center gap-2">
          <User className="text-slate-100 w-5 h-5" />
          <CardTitle className="text-slate-100">Admin Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Name" icon={User} error={errors.name?.message}>
              <Input {...register('name')} className="bg-slate-700 border-slate-600 text-slate-100" disabled={loading} />
            </FormField>
            <FormField label="Email" icon={Mail} error={errors.email?.message}>
              <Input type="email" {...register('email')} className="bg-slate-700 border-slate-600 text-slate-100" disabled={loading} />
            </FormField>
            <FormField label="Profile Photo" icon={Image} error={errors.photo?.message}>
              <ImageUploader
                initialImage={currentPhotoUrl}
                onUpload={(file) => setValue('photo', file, { shouldValidate: true })}
                onRemove={() => setValue('photo', undefined, { shouldValidate: true })}
              />
            </FormField>
            <Button type="submit" disabled={loading} className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading && <Loader2 className="animate-spin w-4 h-4" />} {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Button variant="destructive" onClick={handleLogout} disabled={loading} className="w-full flex gap-2 items-center bg-red-600 hover:bg-red-700 text-white">
        <LogOut className="w-4 h-4" /> {loading ? 'Logging out...' : 'Logout'}
      </Button>
    </motion.div>
  )
}