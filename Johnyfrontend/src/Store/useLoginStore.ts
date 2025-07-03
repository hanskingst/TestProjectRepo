
import { create } from "zustand";

type LoggiProp = {
    access_token:string|null,
    token_type:string|null,
    setTokens :(access_token:string,token_type:string) =>void
    clearTokens:() =>void
}

export const useLogginStore = create<LoggiProp>(set =>({
    access_token:null,
    token_type:null,
    setTokens:(access_token, token_type) => set({
        access_token,token_type
    }),
    clearTokens:() => set({
        access_token:null, token_type:null
    })
}))