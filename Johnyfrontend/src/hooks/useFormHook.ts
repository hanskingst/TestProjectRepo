import { useForm } from "react-hook-form";
import {z} from 'zod'
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

type Apifunction<T,R = unknown> = (data:T) => Promise<R>;

export const useFormHook = <T extends z.ZodObject<z.ZodRawShape>>(Schema:T, apiFunction:Apifunction<z.infer<T>>) =>{
     
    type FormData = z.infer<T>;
      const {register,handleSubmit,formState:{errors},} = useForm<FormData>({
        resolver:zodResolver(Schema)
      })   

      const mutation = useMutation({
        mutationFn:apiFunction,
      })

      
     

      return {
        register,
        handleSubmit:handleSubmit(data=>{
          
          mutation.mutate(data)
        }),
        errors,
        isPending:mutation.isPending,
        isApiError:mutation.isError,
        mutationError:mutation.error,
        isSuccess:mutation.isSuccess,
        mutationData:mutation.data
    }
    }