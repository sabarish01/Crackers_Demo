import DatabaseSetup from '@/components/database-setup'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-800 mb-4">
            CrackersHub Database Setup
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Before using the application, you need to set up the database tables. 
            This will create all necessary tables and populate them with sample data.
          </p>
        </div>
        <DatabaseSetup />
      </div>
      <Footer />
    </div>
  )
}
