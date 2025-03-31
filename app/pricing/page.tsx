"use client"

import { Badge } from "@/components/ui/badge"
import { PricingCard } from "@/components/pricing-card"
import { Button } from "@/components/ui/button"
// Import the WhatsApp helper
import { createWhatsAppLink, openWhatsApp } from "@/lib/whatsapp-helper"

export default function PricingPage() {
  // Update the createWhatsAppLink function to use our helper
  const createPackageWhatsAppLink = (package_name: string) => {
    const message = `Hi Amein, I'm interested in your ${package_name} package. Can you provide more information?`
    return createWhatsAppLink(message)
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">Services</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing Plans</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Choose the right package for your video editing needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <PricingCard
          title="Starter"
          price="$15"
          description="Quick Edit Lift"
          features={[
            { text: "Basic editing services for up to 60 seconds", included: true },
            { text: "Delivery Time: 1 day", included: true },
            { text: "Unlimited Revisions", included: true },
            { text: "Footage Provided: Up to 5 minutes", included: true },
            { text: "Running Time: 1 minute", included: true },
            { text: "Color Grading", included: true },
            { text: "Sound Design & Mixing", included: true },
            { text: "Subtitles", included: true },
          ]}
          whatsappLink={createPackageWhatsAppLink("Starter")}
        />

        <PricingCard
          title="Standard"
          price="$30"
          description="Engagement Enhancer"
          features={[
            { text: "Advanced editing for up to 120 seconds", included: true },
            { text: "Delivery Time: 1 day", included: true },
            { text: "Unlimited Revisions", included: true },
            { text: "Footage Provided: Up to 10 minutes", included: true },
            { text: "Running Time: 2 minutes", included: true },
            { text: "Color Grading", included: true },
            { text: "Sound Design & Mixing", included: true },
            { text: "Motion Graphics", included: true },
            { text: "Subtitles", included: true },
          ]}
          popular={true}
          whatsappLink={createPackageWhatsAppLink("Standard")}
        />

        <PricingCard
          title="Advanced"
          price="$40"
          description="Viral Maker"
          features={[
            { text: "Full-service editing for videos up to 3 minutes", included: true },
            { text: "Delivery Time: 1 day", included: true },
            { text: "Unlimited Revisions", included: true },
            { text: "Footage Provided: Up to 15 minutes", included: true },
            { text: "Running Time: 6 minutes", included: true },
            { text: "Color Grading", included: true },
            { text: "Sound Design & Mixing", included: true },
            { text: "Motion Graphics", included: true },
            { text: "Subtitles", included: true },
          ]}
          whatsappLink={createPackageWhatsAppLink("Advanced")}
        />

        <PricingCard
          title="Custom"
          price="Custom"
          description="Tailored to your specific needs"
          features={[
            { text: "Custom editing services for any length", included: true },
            { text: "Flexible delivery timeline", included: true },
            { text: "Unlimited Revisions", included: true },
            { text: "Any amount of footage", included: true },
            { text: "Custom running time", included: true },
            { text: "Advanced Color Grading", included: true },
            { text: "Professional Sound Design & Mixing", included: true },
            { text: "Custom Motion Graphics", included: true },
            { text: "Multi-language Subtitles", included: true },
          ]}
          whatsappLink={createPackageWhatsAppLink("Custom")}
        />
      </div>

      <div className="mt-16 text-center max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold mb-4">Need Something Special?</h3>
        <p className="text-muted-foreground mb-6">
          Every project is unique. If you don't see a package that fits your needs, contact me for a personalized quote
          tailored to your specific requirements.
        </p>
        <div className="flex justify-center">
          <Button
            onClick={() => openWhatsApp("Hi Amein, I'm interested in a custom quote for my project.")}
            className="inline-flex items-center justify-center"
          >
            Contact for Custom Quote
          </Button>
        </div>
      </div>
    </div>
  )
}

