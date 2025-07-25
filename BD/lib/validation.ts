import { z } from "zod";

// ------------------------------
// ✅ ENUMS
// ------------------------------
export const statusEnum = z.enum(["draft", "published"]);

export const relationshipEnum = z.enum([
  "supervisor",
  "mentor",
  "colleague",
  "client",
  "manager",
  "teamLead",
  "stakeholder",
  "partner",
]);

export const projectTypeEnum = z.enum([
  "freelance",
  "fulltime",
  "contract",
  "other",
  "student",
]);

// ------------------------------
// ✅ GENERIC SCHEMAS
// ------------------------------
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const paginationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const filterSchema = z
  .object({
    status: statusEnum.optional(),
    category: z.string().optional(),
    search: z.string().optional(),
  })
  .merge(paginationSchema);

// ------------------------------
// ✅ AUTH SCHEMAS
// ------------------------------
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ------------------------------
// ✅ PROJECT SCHEMAS
// ------------------------------
export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  technologies: z.array(z.string().min(1, "Technology name is required")),
  category: z.string().min(1, "Category is required"),
  image: z.string().url("Invalid image URL"),
  githubUrl: z.string().url("Invalid GitHub URL").optional(),
  liveUrl: z.string().url("Invalid Live URL").optional(),
  tags: z.array(z.string().min(1, "Tag is required")),
  featured: z.boolean().optional(),
  status: statusEnum.default("draft").optional(),
});
export const projectUpdateSchema = projectSchema.partial();

// ------------------------------
// ✅ POST / BLOG SCHEMAS
// ------------------------------
export const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string().min(1, "Tag is required")),
  image: z.string().url("Image must be a valid URL"),
  featured: z.boolean().optional(),
  status: statusEnum.default("draft").optional(),
  readTime: z.string().min(1, "Read time is required"),
});
export const postUpdateSchema = postSchema.partial();

// ------------------------------
// ✅ TESTIMONIAL SCHEMAS
// ------------------------------
export const testimonialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  image: z.string().url("Invalid image URL"),
  content: z.string().min(1, "Content is required"),
  rating: z.number().min(1, "Minimum rating is 1").max(5, "Maximum rating is 5"),
  relationship: relationshipEnum,
  project: z.string().min(1, "Project name is required"),
  featured: z.boolean().optional(),
  status: statusEnum.default("draft").optional(),
});
export const testimonialUpdateSchema = testimonialSchema.partial();

// ------------------------------
// ✅ CONTACT SCHEMAS
// ------------------------------
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  status: z.enum(["new", "read", "replied", "archived"]).optional(),
  projectType: z.enum(["freelance", "fulltime", "contract", "other", "student"]).optional(),
  budget: z.string().optional(),
  company: z.string().optional(),
  reply: z.object({
    message: z.string(),
    sentAt: z.date(),
    admin: z.string()
  }).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// ------------------------------
// ✅ HIRE ME SCHEMA
// ------------------------------
export const hireMeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be at most 500 characters."),
  projectType: projectTypeEnum,
  budget: z.string().optional(),
  company: z.string().optional(),
});

// ------------------------------
// ✅ USER UPDATE
// ------------------------------
export const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

// ------------------------------
// ✅ CERTIFICATION SCHEMAS
// ------------------------------
export const certificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  organization: z.string().min(1, "Organization is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  description: z.string().optional().or(z.literal("")),
  badge: z.string().min(1, "Badge is required"),
  color: z.string().min(1, "Color is required"),
  credentialId: z.string().optional().or(z.literal("")),
  link: z.string().url("Invalid verification URL").optional().or(z.literal("")),
});
export const certificationUpdateSchema = certificationSchema.partial();

// ------------------------------
// ✅ EXPERIENCE SCHEMAS
// ------------------------------
export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  technologies: z.array(z.string().min(1, "Technology is required")),
  logo: z.string().optional(),
});
export const experienceUpdateSchema = experienceSchema.partial();

// ------------------------------
// ✅ CHATBOT
// ------------------------------
export const chatbotInputSchema = z.object({
  query: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(500, "Message is too long."),
});

// ------------------------------
// ✅ PROFILE SCHEMA (NEW - FULLY OPTIONAL & SECURE)
// ------------------------------
export const profileUpdateSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    photo: z.string().optional(),
    oldPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .optional(),
  })
  .refine(
    (data) => {
      // If user enters oldPassword, they must provide newPassword
      if (data.oldPassword && !data.newPassword) return false
      return true
    },
    {
      message: "New password is required when old password is provided",
      path: ["newPassword"],
    }
  );
