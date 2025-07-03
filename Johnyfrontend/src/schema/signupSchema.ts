import { z } from "zod";

export const signupSChema = z.object({
    user_name:z.string().min(5,'user name must be atleast 5 characters'),
    user_email:z.string().email('Invalid email'),
    user_password:z.string().min(8,"Password must be atleast 8 characters"),
})