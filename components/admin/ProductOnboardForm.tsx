"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onboardProduct } from "@/app/actions/product-actions";
import { useUser } from "@clerk/nextjs";
import { uploadProductImage } from "@/app/actions/image-actions";
import Button from "@/components/ui/Button";
import { Check, Loader2, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ProductOnboardFormProps {
  existingProducts?: any[];
}

export default function ProductOnboardForm({ existingProducts = [] }: ProductOnboardFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedImages.length + files.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0 && user) {
        setUploadingImages(true);
        console.log(`Starting upload of ${selectedImages.length} images...`);

        try {
          for (let i = 0; i < selectedImages.length; i++) {
            const file = selectedImages[i];
            console.log(`Uploading image ${i + 1}/${selectedImages.length}: ${file.name}`);

            // Validate file type
            if (!file.type.startsWith("image/")) {
              throw new Error(`File ${file.name} is not an image`);
            }

            // Validate file size (max 5MB per image)
            if (file.size > 5 * 1024 * 1024) {
              throw new Error(`File ${file.name} is too large (max 5MB)`);
            }

            // Generate unique filename
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Convert File to base64 for server action
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  resolve(reader.result);
                } else {
                  reject(new Error("Failed to convert file to base64"));
                }
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Upload using server action (uses service role key)
            // Pass base64 string instead of File object
            const { url } = await uploadProductImage(base64, fileName, file.type);
            console.log(`Image ${i + 1} uploaded successfully:`, url);
            imageUrls.push(url);
          }

          console.log(`All ${imageUrls.length} images uploaded successfully:`, imageUrls);
        } catch (uploadError: any) {
          console.error("Error uploading images:", uploadError);
          setUploadingImages(false);
          throw new Error(`Failed to upload images: ${uploadError.message}`);
        }

        setUploadingImages(false);
      } else {
        console.log("No images selected for upload");
      }

      // Get form element - use ref if available, otherwise use currentTarget
      const formElement = formRef.current || e.currentTarget;
      if (!formElement || !(formElement instanceof HTMLFormElement)) {
        throw new Error("Form element not found");
      }

      const formData = new FormData(formElement);
      
      // Remove the file input from FormData (we've already uploaded the files)
      // The file input has name="images" which conflicts with our JSON array
      formData.delete("images");
      
      // Add image URLs to form data using a different key to avoid conflict
      // Use "image_urls" instead of "images" since the file input uses "images"
      if (imageUrls.length > 0) {
        const imagesJson = JSON.stringify(imageUrls);
        formData.append("image_urls", imagesJson);
        console.log("FormData - Adding image URLs to form:", imagesJson);
        console.log("FormData - Image URLs count:", imageUrls.length);
      } else {
        console.warn("FormData - No image URLs to add to form!");
      }

      // Verify image URLs are in FormData before submitting
      const imageUrlsInFormData = formData.get("image_urls");
      console.log("FormData - Image URLs in form before submit:", imageUrlsInFormData);

      const result = await onboardProduct(formData);

      if (result.success) {
        setSuccess(true);
        // Reset form
        formElement.reset();
        setSelectedImages([]);
        setImagePreviews([]);
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        // Redirect to product page after a short delay
        // Use the product ID for routing
        if (result.id) {
          setTimeout(() => {
            router.push(`/products/${result.id}`);
            // Force a refresh to ensure the page loads
            router.refresh();
          }, 2000);
        } else {
          // Fallback: redirect to products list if no ID
          setTimeout(() => {
            router.push("/products");
            router.refresh();
          }, 2000);
        }
      } else {
        throw new Error("Product creation failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save product");
      setUploadingImages(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {/* Product Images */}
      <div className="rounded-xl border border-translucent-emerald bg-muted-moss p-6">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-bone-white">Product Images</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="images"
              className="mb-2 block text-sm font-medium text-bone-white font-mono"
            >
              Upload Images (up to 10) *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="images"
              name="images"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedImages.length >= 10 || uploadingImages}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-translucent-emerald bg-forest-obsidian px-4 py-8 text-bone-white transition-colors hover:border-heart-green hover:bg-muted-moss disabled:opacity-50 font-mono"
            >
              <ImageIcon size={24} />
              <span>
                {selectedImages.length >= 10
                  ? "Maximum 10 images reached"
                  : `Select Images (${selectedImages.length}/10)`}
              </span>
            </button>
            <p className="mt-2 text-xs text-bone-white/50 font-mono">
              Maximum 10 images, 5MB per image. JPG, PNG, or WebP formats.
            </p>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-xl border border-translucent-emerald bg-muted-moss p-6">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-bone-white">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-bone-white font-mono">
              Product Name *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full rounded-lg border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder:text-bone-white/50 focus:border-heart-green focus:outline-none focus:ring-2 focus:ring-heart-green/20 font-mono"
              placeholder="e.g., High-Quality Omega-3 Supplement"
            />
          </div>

          <div>
            <label
              htmlFor="problem_solved"
              className="mb-2 block text-sm font-medium text-bone-white font-mono"
            >
              Problem Solved *
            </label>
            <textarea
              id="problem_solved"
              name="problem_solved"
              required
              rows={3}
              className="w-full rounded-lg border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder:text-bone-white/50 focus:border-heart-green focus:outline-none focus:ring-2 focus:ring-heart-green/20 font-mono"
              placeholder="Brief description of what problem this product solves"
            />
          </div>
        </div>
      </div>

      {/* AI Summary / Expert Notebook */}
      <div className="rounded-xl border border-translucent-emerald bg-muted-moss p-6">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-bone-white">AI Summary / Expert Notebook</h2>
        <div>
          <label
            htmlFor="ai_summary"
            className="mb-2 block text-sm font-medium text-bone-white font-mono"
          >
            Notebook Expert Write-up *
          </label>
          <textarea
            id="ai_summary"
            name="ai_summary"
            required
            rows={16}
            className="w-full rounded-lg border border-translucent-emerald bg-forest-obsidian px-4 py-2 font-mono text-sm text-bone-white placeholder:text-bone-white/50 focus:border-heart-green focus:outline-none focus:ring-2 focus:ring-heart-green/20"
            placeholder="Enter the detailed AI-generated summary or Expert Notebook writeup here. This will be displayed prominently on the product detail page."
          />
        </div>
      </div>

      {/* Direct Link */}
      <div className="rounded-xl border border-translucent-emerald bg-muted-moss p-6">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-bone-white">Direct Link</h2>
        <div>
          <label htmlFor="buy_url" className="mb-2 block text-sm font-medium text-bone-white font-mono">
            Buy URL *
          </label>
          <input
            type="url"
            id="buy_url"
            name="buy_url"
            required
            className="w-full rounded-lg border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder:text-bone-white/50 focus:border-heart-green focus:outline-none focus:ring-2 focus:ring-heart-green/20 font-mono"
            placeholder="https://example.com/product"
          />
          <p className="mt-2 text-xs text-bone-white/50 font-mono">
            ?ref=SME will be automatically appended to the URL
          </p>
        </div>
      </div>

      {/* SME Certification Checklist - 5 Pillars */}
      <div className="rounded-xl border border-translucent-emerald bg-muted-moss p-6">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-bone-white">SME Certification Checklist</h2>
        <p className="mb-4 text-sm text-bone-white/70 font-mono">
          All 5 Verification Pillars must be checked for SME Certification
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="source_transparency"
              className="h-5 w-5 rounded border-translucent-emerald bg-forest-obsidian text-heart-green focus:ring-heart-green/20"
            />
            <span className="text-bone-white font-mono">1. Source Transparency</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="purity_tested"
              className="h-5 w-5 rounded border-translucent-emerald bg-forest-obsidian text-heart-green focus:ring-heart-green/20"
            />
            <span className="text-bone-white font-mono">2. Purity Screening</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="potency_verified"
              className="h-5 w-5 rounded border-translucent-emerald bg-forest-obsidian text-heart-green focus:ring-heart-green/20"
            />
            <span className="text-bone-white font-mono">3. Potency Audit</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="excipient_audit"
              className="h-5 w-5 rounded border-translucent-emerald bg-forest-obsidian text-heart-green focus:ring-heart-green/20"
            />
            <span className="text-bone-white font-mono">4. Excipient Cleanliness</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="operational_legitimacy"
              className="h-5 w-5 rounded border-translucent-emerald bg-forest-obsidian text-heart-green focus:ring-heart-green/20"
            />
            <span className="text-bone-white font-mono">5. Operational Legitimacy</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer mt-4 pt-4 border-t border-translucent-emerald">
            <input
              type="checkbox"
              name="third_party_lab_verified"
              className="h-5 w-5 rounded border-translucent-emerald bg-forest-obsidian text-heart-green focus:ring-heart-green/20"
            />
            <span className="text-bone-white text-sm font-mono">3rd Party Lab Verified (Additional verification)</span>
          </label>
        </div>
      </div>

      {/* Reference Links */}
      <div className="rounded-xl border border-translucent-emerald bg-muted-moss p-6">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-bone-white">Reference Links</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="coa_url"
              className="mb-2 block text-sm font-medium text-bone-white font-mono"
            >
              COA (Certificate of Analysis) URL
            </label>
            <input
              type="url"
              id="coa_url"
              name="coa_url"
              className="w-full rounded-lg border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder:text-bone-white/50 focus:border-heart-green focus:outline-none focus:ring-2 focus:ring-heart-green/20 font-mono"
              placeholder="https://example.com/coa.pdf"
            />
          </div>

          <div>
            <label
              htmlFor="reference_url"
              className="mb-2 block text-sm font-medium text-bone-white font-mono"
            >
              Additional Reference URL
            </label>
            <input
              type="url"
              id="reference_url"
              name="reference_url"
              className="w-full rounded-lg border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder:text-bone-white/50 focus:border-heart-green focus:outline-none focus:ring-2 focus:ring-heart-green/20 font-mono"
              placeholder="https://example.com/research"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400 font-mono">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-heart-green/50 bg-heart-green/10 p-4 text-heart-green font-mono">
          <Check size={20} />
          <span>Product saved successfully! Redirecting...</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading || uploadingImages ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadingImages ? "Uploading images..." : "Saving..."}
            </>
          ) : (
            "Save Product"
          )}
        </Button>
      </div>
    </form>
  );
}

