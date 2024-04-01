import { z } from "zod";

export const videoSchema = z.object({
    title: z.
        string({ required_error: "Title is required to upload the video" })
        .trim()
        .min(10, { message: "Title must be greater than 10 characters" })
        .max(255, { message: "Title should not be greater than 255 characters" }),
    description: z.
        string({ required_error: "Description is required to upload the video" })
        .trim()
        .min(10, { message: "description should be greater than 10 characters" })
        .max(255, { message: "description should not be greater than 255 characters" })
})