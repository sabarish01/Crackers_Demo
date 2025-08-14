"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import AdminLayout from '@/components/admin/admin-layout'
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number
  is_available: boolean
  category_id: string
  categories: {
    id: string
    name: string
  } | null
}

interface Category {
  id: string
  name: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    is_available: true,
    image: null as File | null
  })
  const [uploading, setUploading] = useState(false)
  // For image preview and delete
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to load products')
      const products = await res.json()
      setProducts(products)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to load categories')
      const categories = await res.json()
      setCategories(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Upload image to backend and return the image URL
  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file); // must match backend field name
    const res = await fetch('/api/upload-product-image', {
      method: 'POST',
      body: fd
    });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.path || data.imageUrl;
  }

  // Delete image from backend
  const deleteImage = async (imageUrl: string) => {
    const res = await fetch(`/api/upload-product-image?image_url=${encodeURIComponent(imageUrl)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete image');
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      let imageUrl = ''
      if (formData.image) {
        // If editing and there was a previous image, delete it first
        if (isEditing && selectedProduct?.image_url && selectedProduct.image_url.indexOf('/upload/products/') !== -1) {
          try { await deleteImage(selectedProduct.image_url) } catch {}
        }
        imageUrl = await uploadImage(formData.image)
      } else if (isEditing && selectedProduct) {
        imageUrl = selectedProduct.image_url
      } else {
        imageUrl = `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(formData.name)}`
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: imageUrl,
        category_id: formData.category_id,
        stock_quantity: parseInt(formData.stock_quantity),
        is_available: formData.is_available
      }

      if (isEditing && selectedProduct) {
        const res = await fetch(`/api/products?id=${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        })
        if (!res.ok) throw new Error('Failed to update product')
        toast({ title: "Success", description: "Product updated successfully" })
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        })
        if (!res.ok) throw new Error('Failed to create product')
        toast({ title: "Success", description: "Product created successfully" })
      }

      fetchProducts()
      resetForm()
      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category_id: product.category_id,
      stock_quantity: product.stock_quantity.toString(),
      is_available: product.is_available,
      image: null
    })
    setImagePreview(product.image_url || null)
    setImageToDelete(null)
    setIsEditing(true)
    setDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete product')
      setImagePreview(null)
      setImageToDelete(null)
      setProducts(prev => prev.filter(p => p.id !== productId))
      toast({ title: "Success", description: "Product deleted successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      stock_quantity: '',
      is_available: true,
      image: null
    })
    setSelectedProduct(null)
    setIsEditing(false)
    setImagePreview(null)
    setImageToDelete(null)
  }

  const handleAddNew = () => {
    resetForm()
    setDialogOpen(true)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <AdminLayout title="Product Management">
        <div className="text-center">Loading products...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Product Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAddNew} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={50}
                            height={50}
                            className="rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.categories?.name || 'No Category'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_available ? "default" : "secondary"}>
                          {product.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="image">Product Image</Label>
                <div className="mt-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData(prev => ({ ...prev, image: file }));
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                        setImageToDelete(null);
                      } else {
                        setImagePreview(null);
                      }
                    }}
                    className="mb-2"
                  />
                  {/* Preview uploaded or selected image */}
                  {imagePreview && (
                    <div className="mt-2 flex items-center w-full">
                      <div className="flex items-center">
                        
                        <Image
                          src={imagePreview}
                          alt="Product image preview"
                          width={100}
                          height={100}
                          className="rounded object-cover mr-4"
                        />
                      </div>
                      {imagePreview && !imagePreview.startsWith('/placeholder.svg') && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          
                          onClick={async () => {
                            setImagePreview("/placeholder.svg");
                            setFormData(prev => ({ ...prev, image: null }));
                            // Update product in database to set image_url to placeholder
                            if (isEditing && selectedProduct) {
                              try {
                                await fetch(`/api/products?id=${selectedProduct.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ ...selectedProduct, image_url: "/placeholder.svg" })
                                });
                                toast({ title: "Image deleted" });
                                fetchProducts();
                              } catch {}
                            } else {
                              toast({ title: "Image deleted" });
                            }
                          }}
                        >
                          Delete Image
                        </Button>
                      )}
                    </div>
                  )}
                  {/* If no image preview, show placeholder */}
                  {!imagePreview && (
                    <div className="mt-2 flex items-center w-full">
                      <Image
                        src={"/placeholder.svg"}
                        alt="No image"
                        width={100}
                        height={100}
                        className="rounded object-cover mr-4"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                />
                <Label htmlFor="available">Product Available</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : isEditing ? 'Update Product' : 'Create Product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
