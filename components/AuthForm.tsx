"use client"
 
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {Form}from "@/components/ui/form"

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import FormField from "./FormField"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/client"
import { signIn, signUp } from "@/lib/actions/auth.action"
 

const authFormSchema = (type: FormType) =>{
  return z.object({
    name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  })
}

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const formSchema = authFormSchema(type);

    // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",

    },
  })
 
  /* 2. Define a submit handler.
   eslint-disable-next-line @typescript-eslint/no-unused-vars*/
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try{
      if(type === 'sign-up'){
        const { name, email, password} = values

        const userCredentials = await createUserWithEmailAndPassword(auth, email, password)

        const result = await signUp({
          uid: userCredentials.user.uid,
          name: name!,
          email,
          password,  
        })

        if(!result?.success){
          toast.error(result?.message)
          return 
        }

        toast.success('Account created successfully. please sign in.')
        router.push('/sign-in')
      }else{
        const { email, password} = values

        const usercredential = await signInWithEmailAndPassword(auth, email, password)

        const idToken = await usercredential.user.getIdToken()

        if(!idToken){
          toast.error('Sign in failed')
          return
        }
        
        await signIn({
          email, idToken
        })

        toast.success('Sign in successfully')
        router.push('/')
      }
    }catch (error){
      console.log(error);
      toast.error(`There was an error: ${error}`)
    }
  }

  const isSignIn = type === 'sign-in';

  return (
    <div className="card-border lg:min-w-[520px] shadow-[0_20px_50px_rgba(137,2,62,0.12)] transition-all hover:shadow-[0_25px_60px_rgba(137,2,62,0.18)]">
      <div className="flex flex-col gap-6 card py-12 px-8 sm:px-12 backdrop-blur-xl bg-white/90 border border-white/80 rounded-3xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#89023E]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-2 justify-center items-center text-center">
          <div className="relative w-16 h-16 mb-2 animate-float">
            <Image src="/robot.png" alt="logo" fill className="object-contain drop-shadow-md" priority />
          </div>
          <h2 className="logo-text text-4xl">PrepYou</h2>
          <p className="text-stone-500 text-xs font-medium">Practice real voice interviews powered by AI</p>
        </div>

        <h3 className="text-xl font-bold text-center text-stone-800">
          {isSignIn ? "Welcome Back to PrepYou" : "Create Your PrepYou Account"}
        </h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5 mt-2 form">
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="Enter your name"
              />
            )}
            <FormField
              control={form.control}
              name="email"
              label="Email Address"
              placeholder="name@example.com"
              type="email"
            />
            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="••••••••"
              type="password"
            />

            <Button className="btn shadow-lg shadow-[#89023E]/20" type="submit">
              {isSignIn ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-stone-600 mt-2">
          {isSignIn ? "Don't have an account yet?" : "Already have an account?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-[#89023E] hover:underline ml-1.5"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};
export default AuthForm;