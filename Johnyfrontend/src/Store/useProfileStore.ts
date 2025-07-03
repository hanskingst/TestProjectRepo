import { create } from "zustand";

type ProfileProp ={
    user_id:number | null,
    user_name:string | null,
    user_email:string|null,
    
    setProfile:(userId:number, username:string,userEmail:string) => void
}

export const useProfileStore = create<ProfileProp>(set =>({
    user_id:null,
    user_name:null,
    user_email:null,
    user_location:null,
    setProfile:(user_id,user_name,user_email) => set({
        user_id,user_name,user_email
    })
}))