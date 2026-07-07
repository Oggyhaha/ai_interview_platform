import { ReactNode } from 'react'
import Link from "next/link";
import Image from "next/image"
import { isAuthenticated } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';


const RootLayout = async ({ children }: { children: ReactNode}) => {
    const isUserAuthenticated = await isAuthenticated()

    if(!isUserAuthenticated) redirect('/sign-in')
    
    return (
        <div className="root-layout">
        <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
                <Image src="/logo.svg" alt="PrepYou logo" width={36} height={36} className="transition-transform duration-200 group-hover:scale-110"/>
                <h2 className="logo-text">PrepYou</h2>
            </Link>
        </nav>
        {children}
    </div>
    )
}

export default RootLayout