import { z } from "zod"

const registrationSchema = z.object({
    username: z.
        string({ required_error: "username is required" })
        .trim()
        .min(3, { message: "Username must be greater than 3 characters" })
        .max(255, { message: "Username must not be greater than 255 characters" }),
    email: z.
        string({ required_error: "Email is required" })
        .trim()
        .email({ message: "Invalid Email" })
        .min(3, { message: "Email must be greater than 3 characters" })
        .max(255, { message: "Email must not be greater than 255 characters" }),
    fullName: z.
        string({ required_error: "fullname is required" })
        .trim()
        .min(3, { message: "fullname must be greater than 3 characters" })
        .max(255, "fullname must not be greater than 255 characters"),
    password: z.
        string({ required_error: "Password is required" })
        .trim()
        .min(8, { message: "password must be atleast 8 characters" })
        .max(255, { message: "Password must not be greater than 255 characters" }),
})

export {registrationSchema}