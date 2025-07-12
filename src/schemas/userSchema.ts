import { z } from "zod";
import { UserRole } from "@prisma/client"; // Ensure this import is correct based on your setup

export const userSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(), // Optional field
  email: z.string().email().nullable(), // Nullable and must be a valid email
  emailVerified: z.date().nullable(), // Nullable date field
  image: z.string().url().nullable(), // Nullable URL for profile image
  role: z.nativeEnum(UserRole).default(UserRole.USER), // Prisma Enum
});

// TypeScript Type for User
export type User = z.infer<typeof userSchema>;
