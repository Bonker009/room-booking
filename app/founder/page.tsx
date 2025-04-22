import Image from "next/image";
import { BookOpen, CreditCard, LayoutDashboard, PersonStandingIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FounderPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
            <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 text-sky-600 mr-2" />
                            <h1 className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                Room Booking System
                            </h1>
                        </div>
                        <nav className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center text-sky-600 hover:text-sky-800">
                                <LayoutDashboard className="h-4 w-4 mr-1" />
                                <span>Dashboard</span>
                            </Link>
                            <Link href="/founder" className="flex items-center text-sky-600 hover:text-sky-800">
                                <PersonStandingIcon className="h-4 w-4 mr-1" />
                                <span>Founder</span>
                            </Link>
                            <Link href="/subscription" className="flex items-center text-sky-600 hover:text-sky-800 font-semibold">
                                <CreditCard className="h-4 w-4 mr-1" />
                                <span>Subscription</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex justify-center items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card className="max-w-2xl w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="text-center">
                        <div className="relative mx-auto mb-6">
                            <Image
                                src="/img.png"
                                alt="Founder Seab Lundy"
                                width={140}
                                height={140}
                                className="rounded-full ring-4 ring-indigo-100 object-cover"
                                priority
                            />
                        </div>
                        <CardTitle className="text-3xl font-bold text-gray-900">
                            Seab Lundy
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-500">
                            Founder & DevOps Engineer
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                            Passionate about AI, education, and building innovative tech tools to empower learners worldwide.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button
                                asChild
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
                            >
                                <Link href="https://www.linkedin.com/in/seab-lundy-30a676269/?originalSubdomain=kh" target="_blank" rel="noopener noreferrer">
                                    Connect on LinkedIn
                                </Link>
                            </Button>

                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}