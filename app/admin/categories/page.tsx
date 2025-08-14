"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
// Removed direct MySQL connection; all data access via API endpoints
import AdminLayout from '@/components/admin/admin-layout'
import { Plus, Edit, Trash2, Tag, Search, Upload } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string
  image_url: string
  created_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null
  })
  const [imageDeleted, setImageDeleted] = useState(false);
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to load categories')
      if (!res.ok) {
        throw new Error('Failed to load categories')
      }
      const categories = await res.json()
      setCategories(categories)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    // For demo purposes, we'll create a placeholder URL
    // In a real app, you would upload to Supabase Storage or another service
    const placeholderUrl = `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(formData.name || 'Category')}`
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return placeholderUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      let imageUrl = ''
      if (formData.image) {
        // Upload image to API
        const data = new FormData()
        data.append('file', formData.image)
        const uploadRes = await fetch('/api/upload-category-image', {
          method: 'POST',
          body: data
        })
        if (!uploadRes.ok) throw new Error('Image upload failed')
        const uploadJson = await uploadRes.json()
        imageUrl = uploadJson.path.startsWith('/upload/') ? uploadJson.path : `/upload/${uploadJson.path.replace(/^\/+/, '')}`
      } else if (isEditing && selectedCategory) {
        if (imageDeleted) {
          imageUrl = `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(formData.name)}`;
        } else {
          imageUrl = selectedCategory.image_url;
        }
      } else {
        imageUrl = `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(formData.name)}`
      }
      // If imageUrl is empty, use placeholder
      if (!imageUrl) {
        imageUrl = `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(formData.name)}`;
      }
      const categoryData = {
        name: formData.name,
        description: formData.description,
        image_url: imageUrl
      }
      let res
      if (isEditing && selectedCategory) {
        res = await fetch(`/api/categories?id=${selectedCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData)
        })
        if (!res.ok) throw new Error('Failed to update category')
        toast({ title: "Success", description: "Category updated successfully" })
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData)
        })
        if (!res.ok) throw new Error('Failed to create category')
        toast({ title: "Success", description: "Category created successfully" })
      }
      fetchCategories()
      resetForm()
      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      image: null
    })
    setImageDeleted(false);
    setIsEditing(true)
    setDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will affect all products in this category.')) return
    try {
      const res = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete category')
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      toast({ title: "Success", description: "Category deleted successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: null
    })
    setImageDeleted(false);
    setSelectedCategory(null)
    setIsEditing(false)
  }

  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Category Management">
        <div className="text-center">Loading categories...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Category Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAddNew} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories List Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b text-center">Image</th>
                <th className="px-4 py-2 border-b text-center">Name</th>
                <th className="px-4 py-2 border-b text-center">Description</th>
                <th className="px-4 py-2 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-center">
                    <Image
                      src={category.image_url || "/placeholder.svg"}
                      alt={category.name}
                      width={60}
                      height={60}
                      className="object-cover rounded mx-auto"
                    />
                  </td>
                  <td className="px-4 py-2 font-semibold text-center">{category.name}</td>
                  <td className="px-4 py-2 text-gray-600 text-center">{category.description}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="min-w-0 px-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Tag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No categories found</h2>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No categories match your search.' : 'Create your first category to get started.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
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
              <div>
                <Label htmlFor="image">Category Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setFormData(prev => ({ ...prev, image: file }));
                  }}
                />
                {/* Image preview and image action buttons below file input */}
                {(formData.image || (isEditing && selectedCategory?.image_url)) && (
                  <div className="flex items-center gap-4 mt-2">
                    {!imageDeleted && (formData.image || selectedCategory?.image_url) && (
                      <>
                        <Image
                          src={formData.image ? URL.createObjectURL(formData.image) : selectedCategory?.image_url || "/placeholder.svg"}
                          alt={formData.name || selectedCategory?.name || "Category Image"}
                          width={120}
                          height={120}
                          className="object-cover rounded border"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        {((formData.image) || (selectedCategory?.image_url && !selectedCategory.image_url.startsWith('/placeholder.svg')) ) && (
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, image: null }));
                                setImageDeleted(true);
                              }}
                            >
                              Delete Image
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                    {imageDeleted && (
                      <span className="text-red-600">Image will be removed</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : isEditing ? 'Update Category' : 'Create Category'}
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
  );
}
