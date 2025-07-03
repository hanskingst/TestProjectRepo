import {z} from 'zod'

export const logginSchema = z.object({
    username:z.string().min(5,'user name must be atleast 5 characters'),
    password:z.string().min(8, 'Password must be atleast 8 characters')
})