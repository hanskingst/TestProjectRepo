import { create } from "zustand";

type UpdateProfileStore = {
    user_id:number | null,
    user_name:string | null,
    user_email:string|null,
    user_location:string|null,
    setUProfile:(userId:number, username:string,userEmail:string,user_location:string) => void
}

export const useUpdateProfileStore = create<UpdateProfileStore>(set =>({
    user_id:null,
    user_name:null,
    user_email:null,
    user_location:null,
    setUProfile:(user_id,user_name,user_email,user_location) => set({
         user_id,user_name,user_email,user_location
    })
}))