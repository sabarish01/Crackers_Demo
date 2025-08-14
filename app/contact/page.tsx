"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Message Sent Successfully",
        description: "We'll get back to you within 24 hours",
      })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      <Navbar />
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-orange-800 mb-2 sm:mb-4">Contact Us</h1>
          <p className="text-xs sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about our crackers or need help with your order? 
            We're here to help! Get in touch with us.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          {/* Contact Information */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Phone className="h-5 w-5" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base sm:text-lg font-semibold">+91 98765 43210</p>
                <p className="text-xs sm:text-sm text-gray-600">Mon-Sat, 9 AM - 7 PM</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Mail className="h-5 w-5" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base sm:text-lg font-semibold">info@crackersstore.com</p>
                <p className="text-xs sm:text-sm text-gray-600">We'll respond within 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Crackers Store</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  123 Festival Street<br />
                  Celebration City, CC 12345<br />
                  India
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="h-5 w-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shop Map Section */}
          <div className="sm:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <MapPin className="h-5 w-5" />
                  Shop Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-60 sm:h-96 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps?q=Sivakasi,+Tamil+Nadu,+India&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="mt-4 sm:mt-8">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-4">
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-1 sm:mb-2 text-xs sm:text-base">
                      What are your delivery areas?
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      We deliver across India. Delivery charges may vary based on location and order value.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-1 sm:mb-2 text-xs sm:text-base">
                      How long does delivery take?
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Standard delivery takes 3-5 business days. Express delivery is available for select locations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-1 sm:mb-2 text-xs sm:text-base">
                      Are your crackers safe and certified?
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Yes, all our products are safety certified and comply with government regulations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-1 sm:mb-2 text-xs sm:text-base">
                      Can I cancel or modify my order?
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Orders can be cancelled or modified within 2 hours of placement. Contact us immediately for assistance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
