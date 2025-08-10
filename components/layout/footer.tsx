import Link from 'next/link'
import { Sparkles, Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-orange-900 via-red-900 to-yellow-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-300" />
              <span className="text-2xl font-bold">CrackersHub</span>
            </div>
            <p className="text-orange-200 mb-4">
              Your trusted partner for premium quality crackers and fireworks. 
              Bringing joy and celebration to your festivals with safe and spectacular fireworks.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-yellow-300" />
                <span className="text-orange-200">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-yellow-300" />
                <span className="text-orange-200">info@crackershub.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-yellow-300" />
                <span className="text-orange-200">Sivakasi, Tamil Nadu, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-300">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-orange-200 hover:text-yellow-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-orange-200 hover:text-yellow-300 transition-colors">
                  Products
                </Link>
              </li>
              <li>
              </li>
              <li>
                <Link href="/contact" className="text-orange-200 hover:text-yellow-300 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-yellow-300">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products?category=B8CC7D3D-DFDA-4A17-8918-2429801FAF1C" className="text-orange-200 hover:text-yellow-300 transition-colors">
                  Bombs
                </Link>
              </li>
              <li>
                <Link href="/products?category=4C929F2E-6747-45D2-8DFA-EAE007DCB64B" className="text-orange-200 hover:text-yellow-300 transition-colors">
                  Sparklers
                </Link>
              </li>
              <li>
                <Link href="/products?category=97EE3AF7-37D7-4E76-AED8-3B9FBE9E20E1" className="text-orange-200 hover:text-yellow-300 transition-colors">
                  Gift Boxes
                </Link>
              </li>
              <li>
                <Link href="/products?category=D763636D-76FA-46FA-89A8-5B3AC23F4F01" className="text-orange-200 hover:text-yellow-300 transition-colors">
                  Flower Pots
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-orange-800 mt-8 pt-8 text-center">
          <p className="text-orange-200">
            © 2024 CrackersHub. All rights reserved. 
          </p>
        </div>
      </div>
    </footer>
  )
}
