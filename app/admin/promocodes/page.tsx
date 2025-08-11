"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import connection from '@/lib/mysql'
import { formatDate } from '@/lib/utils'
import AdminLayout from '@/components/admin/admin-layout'
import { Plus, Edit, Trash2, Tag, Search, ToggleLeft, ToggleRight } from 'lucide-react'

interface Promocode {
  id: string;
  code: string;
  discount_percentage: number;
  min_order_value: number;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPromocodesPage() {
  // State hooks
  const [promocodes, setPromocodes] = useState<Promocode[]>([])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPromocode, setSelectedPromocode] = useState<Promocode | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    min_order_value: '',
    expiry_date: '',
    is_active: true
  })
  const { toast } = useToast()

  // Reset form utility
  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: '',
      min_order_value: '',
      expiry_date: '',
      is_active: true
    })
    setSelectedPromocode(null)
    setIsEditing(false)
    setDialogOpen(false)
  }

  // Place resetForm after state hooks so all setters are available
  // Place resetForm at the very top so it is available to all usages


  // Edit promocode handler
  const handleEdit = (promocode: Promocode) => {
    setSelectedPromocode(promocode)
    setIsEditing(true)
    setFormData({
      code: promocode.code,
      discount_percentage: promocode.discount_percentage.toString(),
      min_order_value: promocode.min_order_value?.toString() ?? '',
      expiry_date: promocode.expiry_date,
      is_active: promocode.is_active
    })
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchPromocodes()
  }, [])

  const fetchPromocodes = async () => {
    try {
      const res = await fetch('/api/promocodes-admin')
      if (!res.ok) throw new Error('Failed to load promocodes')
      if (!res.ok) {
        throw new Error('Failed to load promocodes')
      }
      const promocodes = await res.json()
      setPromocodes(promocodes)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load promocodes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit function triggered'); // Log to confirm execution

    // Client-side validation
    if (!formData.code.trim()) {
      toast({ title: 'Error', description: 'Promocode is required', variant: 'destructive' });
      return;
    }
    if (!formData.discount_percentage || isNaN(Number(formData.discount_percentage)) || Number(formData.discount_percentage) < 1 || Number(formData.discount_percentage) > 100) {
      toast({ title: 'Error', description: 'Discount percentage must be a number between 1 and 100', variant: 'destructive' });
      return;
    }
    if (!formData.min_order_value || isNaN(Number(formData.min_order_value)) || Number(formData.min_order_value) < 0) {
      toast({ title: 'Error', description: 'Minimum order value must be a non-negative number', variant: 'destructive' });
      return;
    }
    if (!formData.expiry_date) {
      toast({ title: 'Error', description: 'Expiry date is required', variant: 'destructive' });
      return;
    }
    try {
      const promocodeData = {
        code: formData.code.toUpperCase(),
        discount_percentage: parseInt(formData.discount_percentage, 10),
        min_order_value: formData.min_order_value === '' ? 0 : parseInt(formData.min_order_value, 10),
        expiry_date: formData.expiry_date.split('T')[0], // Ensure only YYYY-MM-DD is sent
        is_active: formData.is_active
      };
      console.log('Adding promocode with values:', promocodeData); // Log values to browser console
      let res;
      if (isEditing && selectedPromocode) {
        res = await fetch(`/api/promocodes-admin?id=${selectedPromocode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promocodeData)
        });
      } else {
        res = await fetch('/api/promocodes-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promocodeData)
        });
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: errorData?.error + (errorData?.details ? `: ${errorData.details}` : '') || 'Failed to save promocode',
          variant: 'destructive',
        });
        return;
      }
      fetchPromocodes();
      // Only reset the form fields, do not close the dialog here
      setFormData({
        code: '',
        discount_percentage: '',
        min_order_value: '',
        expiry_date: '',
        is_active: true
      });
      setIsEditing(false);
      setSelectedPromocode(null);
      // Show toast and close dialog only after successful creation
      if (res.ok) {
        toast({
          title: 'Success',
          description: isEditing ? 'Promocode Updated Successfully' : 'Promocode Added Successfully',
          variant: 'default',
          duration: 500,
        });
        setDialogOpen(false);
      } else {
        const errorData = await res.json();
        toast({
          title: 'Error',
          description: errorData.error || 'An unexpected error occurred.',
          duration: 5000,
        });
      }
      router.push('/admin/promocodes');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save promocode',
        variant: 'destructive',
      });
    }
  } 

  const handleDelete = async (promocodeId: string) => {
    if (!confirm('Are you sure you want to delete this promocode?')) return
    try {
      const res = await fetch(`/api/promocodes-admin?id=${promocodeId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete promocode')
      setPromocodes(prev => prev.filter(p => p.id !== promocodeId))
      toast({ title: "Success", description: "Promocode deleted successfully" })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete promocode',
        variant: 'destructive',
      })
    }
  }

  const toggleActive = async (promocodeId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/promocodes-admin?id=${promocodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (!res.ok) throw new Error('Failed to update promocode status')
      setPromocodes(prev => 
        prev.map(p => 
          p.id === promocodeId ? { ...p, is_active: !currentStatus } : p
        )
      )
      toast({ 
        title: "Success", 
        description: `Promocode ${!currentStatus ? 'activated' : 'deactivated'}` 
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promocode status",
        variant: "destructive",
      })
    }
  }


  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const filteredPromocodes = promocodes.filter(promocode =>
    promocode.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Utility to format date for input fields
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  if (loading) {
    return (
      <AdminLayout title="Promocode Management">
        <div className="text-center">Loading promocodes...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Promocode Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search promocodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Promocode
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="promocode-dialog-desc">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? 'Edit Promocode' : 'Add New Promocode'}
                </DialogTitle>
              </DialogHeader>
              <div id="promocode-dialog-desc" className="sr-only">
                Fill out the form to add or edit a promocode.
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Promocode</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., DIWALI2024"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount">Discount Percentage</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="e.g., 15"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="min-order-value">Minimum Order Value</Label>
                  <Input
                    id="min-order-value"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_order_value: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="e.g., 500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={formatDateForInput(formData.expiry_date)}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    {isEditing ? 'Update Promocode' : 'Create Promocode'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Promocodes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" /> {/* Replace with a relevant icon for promocodes */}
              Promocodes ({filteredPromocodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Order Value</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromocodes.map((promocode) => (
                    <TableRow key={promocode.id}>
                      <TableCell className="font-mono font-medium">
                        {promocode.code}
                      </TableCell>
                      <TableCell className="font-medium">
                          {parseInt(promocode.discount_percentage.toString(), 10)}%
                      </TableCell>
                      <TableCell className="font-medium">
                          ₹{parseInt(promocode.min_order_value.toString(), 10)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{formatDate(promocode.expiry_date)}</p>
                          {isExpired(promocode.expiry_date) && (
                            <Badge variant="destructive" className="text-xs">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={promocode.is_active ? "default" : "secondary"}
                            className={promocode.is_active ? "bg-green-500" : ""}
                          >
                            {promocode.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(promocode.id, promocode.is_active)}
                          >
                            {promocode.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(promocode.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(promocode)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(promocode.id)}
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

        {filteredPromocodes.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Tag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No promocodes found</h2>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No promocodes match your search.' : 'Create your first promocode to get started.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
