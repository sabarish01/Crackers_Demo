import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import HeroSection from '@/components/home/hero-section'
import FeaturedProducts from '@/components/home/featured-products'
import CategoriesSection from '@/components/home/categories-section'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  )
}
