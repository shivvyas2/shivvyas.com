import ContactSection from '@/components/ContactPage';
import BookCallSection from '@/components/HomePage/BookCallSection';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const Contact3DCanvas = dynamic(
    () => import('@/components/canvas/Contact3D'),
    { ssr: false }
);

export default function ContactPage() {
    return (
        <div className="relative min-h-screen">
            <Head>
                <title>Shiv | Contact</title>
            </Head>
            <ContactSection />
            <BookCallSection />
            
            {/* 3D Canvas */}
            <div className="w-full h-[600px] bg-black">
                <Contact3DCanvas />
            </div>
        </div>
    )
}
