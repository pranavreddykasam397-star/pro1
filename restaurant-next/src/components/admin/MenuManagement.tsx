'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Search,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

interface MenuFormState {
  id?: number;
  name: string;
  price: string;
  category: string;
  type: 'veg' | 'non-veg';
  imageUrl: string;
  isSpecial: boolean;
}

export function MenuManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuFormState | null>(null);

  const [formData, setFormData] = useState<MenuFormState>({
    name: '',
    price: '',
    category: 'CURRIES',
    type: 'veg',
    imageUrl: '',
    isSpecial: false,
  });

  // tRPC Menu queries & mutations
  const menuQuery = trpc.menu.getMenu.useQuery();
  const createItemMutation = trpc.menu.createItem.useMutation({
    onSuccess: () => {
      menuQuery.refetch();
      setIsFormOpen(false);
      resetForm();
      toast.success('Dish added to menu!');
    },
  });

  const updateItemMutation = trpc.menu.updateItem.useMutation({
    onSuccess: () => {
      menuQuery.refetch();
      setIsFormOpen(false);
      resetForm();
      toast.success('Dish updated successfully!');
    },
  });

  const deleteItemMutation = trpc.menu.deleteItem.useMutation({
    onSuccess: () => {
      menuQuery.refetch();
      toast.success('Dish deleted from menu.');
    },
  });

  const toggleSpecialMutation = trpc.menu.toggleSpecial.useMutation({
    onSuccess: () => {
      menuQuery.refetch();
      toast.success('Chef Daily Special updated!');
    },
  });

  const imageSearchQueryHook = trpc.menu.searchImages.useQuery(
    { query: imageSearchQuery },
    { enabled: Boolean(imageSearchQuery.trim()) }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'CURRIES',
      type: 'veg',
      imageUrl: '',
      isSpecial: false,
    });
    setEditingItem(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      price: String(item.price),
      category: item.category,
      type: item.type as 'veg' | 'non-veg',
      imageUrl: item.imageUrl || '',
      isSpecial: Boolean(item.isSpecial),
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(formData.price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      return toast.error('Please enter a valid price.');
    }

    try {
      if (editingItem && editingItem.id) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          name: formData.name.trim(),
          price: priceNum,
          category: formData.category.trim(),
          type: formData.type,
          imageUrl: formData.imageUrl.trim() || null,
          isSpecial: formData.isSpecial,
        });
      } else {
        await createItemMutation.mutateAsync({
          name: formData.name.trim(),
          price: priceNum,
          category: formData.category.trim(),
          type: formData.type,
          imageUrl: formData.imageUrl.trim() || null,
          isSpecial: formData.isSpecial,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteItemMutation.mutateAsync({ id });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete dish');
    }
  };

  const handleToggleSpecial = async (id: number, currentSpecial: boolean = false) => {
    try {
      await toggleSpecialMutation.mutateAsync({
        id,
        isSpecial: !currentSpecial,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle special');
    }
  };

  const handleSearchImageOpen = () => {
    if (!formData.name.trim()) {
      return toast.error('Please enter a dish name first to search for photos.');
    }
    setImageSearchQuery(formData.name.trim());
    setIsImageSearchOpen(true);
  };

  const allDishes = (menuQuery.data?.menu || []) as Array<{
    id: number;
    name: string;
    price: number;
    category: string;
    type: string;
    imageUrl?: string | null;
    isSpecial?: boolean;
  }>;

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">Menu Catalog</h3>
          <p className="text-xs text-ink-soft">
            Manage your restaurant dishes, prices, categories, and daily chef specials.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-gold hover:bg-gold-light text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Dish
        </Button>
      </div>

      {/* Menu Items Table */}
      <Card className="border-parchment bg-white shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {allDishes.length === 0 ? (
            <div className="text-center py-12 text-ink-soft">No dishes in the menu.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-deep/60 border-b border-parchment text-ink uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Dish Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Daily Special</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment/60">
                {allDishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="w-12 h-12 rounded-lg bg-parchment/40 overflow-hidden border border-parchment">
                        <img
                          src={dish.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200'}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-ink text-sm">{dish.name}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="text-[10px] border-parchment font-mono">
                        {dish.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          dish.type === 'veg' ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dish.type === 'veg' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        />
                        {dish.type === 'veg' ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-serif font-bold text-sm text-ink">₹{dish.price}</td>
                    <td className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleSpecial(dish.id, Boolean(dish.isSpecial))}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                          dish.isSpecial
                            ? 'bg-gold text-white shadow-sm'
                            : 'bg-cream-deep hover:bg-parchment text-ink-soft'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {dish.isSpecial ? "Chef's Special" : 'Make Special'}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(dish)}
                          className="p-1.5 rounded hover:bg-parchment text-ink-soft hover:text-ink"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(dish.id, dish.name)}
                          className="p-1.5 rounded hover:bg-red-50 text-destructive/70 hover:text-destructive"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dish Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md bg-white border-parchment p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-ink">
              {editingItem ? 'Edit Dish' : 'Add New Dish'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="dishName" className="text-xs font-semibold">
                Dish Name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="dishName"
                  placeholder="e.g. Butter Chicken"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="text-sm bg-cream-deep/40"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchImageOpen}
                  className="border-gold/50 text-gold hover:bg-gold/10 text-xs flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" /> Find Photo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dishPrice" className="text-xs font-semibold">
                  Price (₹)
                </Label>
                <Input
                  id="dishPrice"
                  type="number"
                  placeholder="e.g. 280"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="text-sm bg-cream-deep/40"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dishCategory" className="text-xs font-semibold">
                  Category
                </Label>
                <Input
                  id="dishCategory"
                  placeholder="CURRIES, BREADS, etc."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                  required
                  className="text-sm bg-cream-deep/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Dietary Type</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'veg' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      formData.type === 'veg'
                        ? 'bg-green-700 text-white border-green-700'
                        : 'bg-white text-ink-soft border-parchment'
                    }`}
                  >
                    Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'non-veg' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      formData.type === 'non-veg'
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-white text-ink-soft border-parchment'
                    }`}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-parchment bg-cream-deep/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpecial}
                    onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                    className="w-4 h-4 text-gold rounded"
                  />
                  <span className="text-xs font-semibold text-ink">Daily Special</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dishImage" className="text-xs font-semibold">
                Photo URL (Optional)
              </Label>
              <Input
                id="dishImage"
                type="url"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="text-xs bg-cream-deep/40"
              />
            </div>

            <Button
              type="submit"
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
              className="w-full bg-gold hover:bg-gold-light text-white font-semibold text-sm py-5 mt-2 shadow-md"
            >
              {editingItem ? 'Save Dish Changes' : 'Add Dish to Menu'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Search Modal */}
      <Dialog open={isImageSearchOpen} onOpenChange={setIsImageSearchOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-parchment p-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-ink flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gold" /> Select Dish Photo
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 pt-2">
            <Input
              value={imageSearchQuery}
              onChange={(e) => setImageSearchQuery(e.target.value)}
              placeholder="Search food photos..."
              className="text-sm bg-cream-deep/40"
            />
            <Button
              type="button"
              onClick={() => imageSearchQueryHook.refetch()}
              className="bg-gold text-white text-xs px-4"
            >
              Search
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 max-h-[50vh] overflow-y-auto">
            {imageSearchQueryHook.isLoading ? (
              [...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-parchment/40 animate-pulse" />)
            ) : (
              imageSearchQueryHook.data?.map((url: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, imageUrl: url });
                    setIsImageSearchOpen(false);
                    toast.success('Dish photo attached!');
                  }}
                  className="relative group rounded-lg overflow-hidden border border-parchment hover:border-gold hover:shadow-md transition-all h-24"
                >
                  <img src={url} alt="Food Search Result" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gold/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs">
                    <Check className="w-5 h-5" />
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
