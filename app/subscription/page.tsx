"use client"

import {useState} from "react"
import {
    BookOpen,
    LayoutDashboard,
    CalendarDays,
    CreditCard,
    Check,
    X,
    AlertCircle,
    PersonStandingIcon
} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"

import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {toast} from "sonner";

export default function SubscriptionPage() {

    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const plans = [
        {
            id: "basic",
            name: "Basic",
            price: "$9.99",
            period: "per month",
            description: "Perfect for small teams or individuals",
            features: [
                {name: "Up to 50 bookings per month", included: true},
                {name: "Basic calendar view", included: true},
                {name: "Email notifications", included: true},
                {name: "Conflict detection", included: true},
                {name: "Export to CSV", included: false},
                {name: "Priority support", included: false},
                {name: "Custom branding", included: false},
            ],
            color: "from-blue-500 to-indigo-500",
            recommended: false,
        },
        {
            id: "pro",
            name: "Professional",
            price: "$24.99",
            period: "per month",
            description: "Ideal for growing organizations",
            features: [
                {name: "Unlimited bookings", included: true},
                {name: "Advanced calendar views", included: true},
                {name: "Email notifications", included: true},
                {name: "Conflict detection", included: true},
                {name: "Export to CSV", included: true},
                {name: "Priority support", included: true},
                {name: "Custom branding", included: false},
            ],
            color: "from-sky-500 to-indigo-500",
            recommended: true,
        },
        {
            id: "enterprise",
            name: "Enterprise",
            price: "$49.99",
            period: "per month",
            description: "For large organizations with advanced needs",
            features: [
                {name: "Unlimited bookings", included: true},
                {name: "Advanced calendar views", included: true},
                {name: "Email notifications", included: true},
                {name: "Conflict detection", included: true},
                {name: "Export to CSV", included: true},
                {name: "Priority support", included: true},
                {name: "Custom branding", included: true},
            ],
            color: "from-purple-500 to-indigo-500",
            recommended: false,
        },
    ]

    const handleSubscribe = (planId: string) => {
        setSelectedPlan(planId)
        setShowPaymentDialog(true)
    }

    const handlePayment = () => {
        setIsProcessing(true)

        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false)
            setShowPaymentDialog(false)

            toast.success("Subscription successful!", {
                description: `You have successfully subscribed to the ${selectedPlan?.charAt(0).toUpperCase()}${selectedPlan?.slice(1)} plan.`,
            })
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
            <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 text-sky-600 mr-2"/>
                            <h1 className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                Room Booking System
                            </h1>
                        </div>
                        <nav className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center text-sky-600 hover:text-sky-800">
                                <LayoutDashboard className="h-4 w-4 mr-1"/>
                                <span>Dashboard</span>
                            </Link>
                            <Link href="/founder" className="flex items-center text-sky-600 hover:text-sky-800">
                                <PersonStandingIcon className="h-4 w-4 mr-1"/>
                                <span>Founder</span>
                            </Link>
                            <Link href="/subscription"
                                  className="flex items-center text-sky-600 hover:text-sky-800 font-semibold">
                                <CreditCard className="h-4 w-4 mr-1"/>
                                <span>Subscription</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-sky-800 mb-4">Choose Your Plan</h1>
                    <p className="text-lg text-sky-600 max-w-2xl mx-auto">
                        Select the perfect subscription plan for your organization's room booking needs
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card key={plan.id}
                              className={`border-none shadow-lg p-0 ${plan.recommended ? "ring-2 ring-sky-500" : ""}`}>
                            {plan.recommended &&
                                <Badge className="absolute top-0 right-0 m-4 bg-sky-500">Recommended</Badge>}
                            <CardHeader className={`pb-8 bg-gradient-to-r ${plan.color} text-white rounded-t-lg p-4`}>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription className="text-white/80">{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    <span className="text-white/80"> {plan.period}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center">
                                            {feature.included ? (
                                                <Check className="h-5 w-5 text-green-500 mr-2"/>
                                            ) : (
                                                <X className="h-5 w-5 text-red-500 mr-2"/>
                                            )}
                                            <span
                                                className={feature.included ? "" : "text-gray-400"}>{feature.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className={"p-4"}>
                                <Button
                                    onClick={() => handleSubscribe(plan.id)}
                                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}
                                >
                                    Subscribe Now
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 bg-sky-50 p-6 rounded-lg border border-sky-100">
                    <div className="flex items-start">
                        <AlertCircle className="h-6 w-6 text-sky-600 mr-3 mt-0.5"/>
                        <div>
                            <h3 className="text-lg font-semibold text-sky-800 mb-2">Need a custom plan?</h3>
                            <p className="text-sky-700">
                                Contact our sales team for a tailored solution that meets your specific requirements. We
                                offer custom
                                plans for educational institutions, government agencies, and large enterprises.
                            </p>
                            <Button className="mt-4 bg-white text-sky-600 border border-sky-200 hover:bg-sky-50">
                                Contact Sales
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Complete Your Subscription</DialogTitle>
                        <DialogDescription>
                            Enter your payment details to subscribe to the {selectedPlan?.charAt(0).toUpperCase()}
                            {selectedPlan?.slice(1)} plan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="card-name">Name on Card</Label>
                            <Input id="card-name" placeholder="John Smith"/>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="card-number">Card Number</Label>
                            <Input id="card-number" placeholder="4242 4242 4242 4242"/>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Input id="expiry" placeholder="MM/YY"/>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <Input id="cvc" placeholder="123"/>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
                        >
                            {isProcessing ? (
                                <>
                                    <div
                                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                "Complete Subscription"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
