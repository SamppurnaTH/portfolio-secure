'use client'

import { useState, useEffect } from 'react' // Import useEffect for initialImage update
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button' // Import Button component
import { XCircle } from 'lucide-react' // Import an icon for removal

interface Props {
  initialImage?: string
  onUpload: (file: File) => void
  onRemove: () => void // <--- This prop is now correctly defined here
}

export default function ImageUploader({ initialImage, onUpload, onRemove }: Props) {
  const [preview, setPreview] = useState<string | undefined>(initialImage)
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // State to reset file input

  // Effect to update preview when initialImage prop changes
  useEffect(() => {
    setPreview(initialImage);
    // When initialImage changes (e.g., after successful upload or removal from parent),
    // we might also want to clear the file input for a fresh start.
    // By changing the key, React re-mounts the input element, clearing its value.
    setFileInputKey(Date.now());
  }, [initialImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveClick = () => {
    setPreview(undefined) // Clear the local preview
    onRemove() // Call the onRemove prop passed from the parent
    setFileInputKey(Date.now()); // Reset the file input field
  }

  return (
    <div className="space-y-2 flex flex-col items-start"> {/* Use flex-col for better layout */}
      {preview && (
        <div className="relative group">
          <Image
            src={preview}
            alt="Profile Preview"
            width={100}
            height={100}
            className="rounded-full border border-slate-600 object-cover" // Added object-cover
          />
          {/* Remove button overlay */}
          <Button
            type="button"
            onClick={handleRemoveClick}
            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2
                       bg-red-500 hover:bg-red-600 rounded-full p-1 h-auto w-auto
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            size="icon" // Use icon size for small button
            title="Remove image"
          >
            <XCircle className="w-4 h-4 text-white" />
          </Button>
        </div>
      )}
      <Input
        key={fileInputKey} // Use key to force remount and clear input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="file:text-white file:bg-indigo-600 file:hover:bg-indigo-700
                   file:border-none file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:cursor-pointer
                   text-slate-100 bg-slate-700 border-slate-600" // Styled the input for consistency
      />
      {/* Optionally, if you want a visible "remove" button even without hover */}
      {preview && (
        <Button
          type="button"
          onClick={handleRemoveClick}
          variant="ghost"
          className="text-red-400 hover:text-red-500 text-sm p-0 h-auto"
        >
          Remove Image
        </Button>
      )}
    </div>
  )
}