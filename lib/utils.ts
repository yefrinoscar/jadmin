import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to parse service tags from a string
export function parseServiceTags(serviceTagsRaw: string): string[] {
  return serviceTagsRaw ? serviceTagsRaw.split(',').map(tag => tag.trim()).filter(Boolean) : []
}

// Utility function to clean user names (remove titles like Mr., Mrs., etc.)
export function cleanUserName(name: string): string {
  return name.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)?\s*/, '').trim()
}
