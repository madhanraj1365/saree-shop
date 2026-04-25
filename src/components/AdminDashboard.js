"use client";

import { useState } from "react";
import ImageCropperModal from "./ImageCropperModal";

const emptyCollectionForm = {
  name: "",
  description: "",
  image: "",
};

const emptyProductForm = {
  name: "",
  price: "",
  description: "",
  collection: "",
  tags: "",
  details: "",
  images: "",
  stock: "1",
};

function toFileArray(fileList) {
  return fileList ? Array.from(fileList) : [];
}

export default function AdminDashboard({ collections, products }) {
  const [collectionForm, setCollectionForm] = useState(emptyCollectionForm);
  const [editingCollectionSlug, setEditingCollectionSlug] = useState("");
  const [productForm, setProductForm] = useState({
    ...emptyProductForm,
    collection: collections[0]?.slug || "",
  });
  const [collectionMessage, setCollectionMessage] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [productError, setProductError] = useState("");
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingCollectionImage, setIsUploadingCollectionImage] = useState(false);
  const [isUploadingProductImages, setIsUploadingProductImages] = useState(false);
  const [editingProductSlug, setEditingProductSlug] = useState(null);
  const [collectionCropImage, setCollectionCropImage] = useState(null);
  const [collectionReCropImage, setCollectionReCropImage] = useState(null);
  const [cropQueue, setCropQueue] = useState([]);
  const [croppedFiles, setCroppedFiles] = useState([]);
  const [reCropImage, setReCropImage] = useState(null);

  async function uploadImages(files) {
    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image upload failed.");
      }

      uploadedUrls.push(data.url);
    }

    return uploadedUrls;
  }

  async function handleCollectionImageUpload(event) {
    const [file] = toFileArray(event.target.files);

    if (!file) {
      return;
    }

    setCollectionCropImage(file);
    event.target.value = "";
  }

  async function handleCollectionCropComplete(croppedFile) {
    setCollectionCropImage(null);
    setCollectionReCropImage(null);
    setIsUploadingCollectionImage(true);
    setCollectionError("");

    try {
      const [url] = await uploadImages([croppedFile]);
      setCollectionForm((current) => ({ ...current, image: url }));
    } catch (uploadError) {
      setCollectionError(uploadError.message);
    } finally {
      setIsUploadingCollectionImage(false);
    }
  }

  function handleCollectionCropCancel() {
    setCollectionCropImage(null);
    setCollectionReCropImage(null);
  }

  function removeCollectionImage() {
    setCollectionForm((current) => ({ ...current, image: "" }));
  }

  function startCollectionEdit(slug) {
    const selectedCollection = collections.find((collection) => collection.slug === slug);

    if (!selectedCollection) {
      setEditingCollectionSlug("");
      setCollectionForm(emptyCollectionForm);
      setCollectionMessage("");
      setCollectionError("");
      return;
    }

    setEditingCollectionSlug(selectedCollection.slug);
    setCollectionForm({
      name: selectedCollection.name || "",
      description: selectedCollection.description || "",
      image: selectedCollection.image || "",
    });
    setCollectionMessage(`Editing "${selectedCollection.name}". Update the collection and save.`);
    setCollectionError("");
  }

  function resetCollectionForm() {
    setEditingCollectionSlug("");
    setCollectionForm(emptyCollectionForm);
    setCollectionMessage("");
    setCollectionError("");
  }

  async function handleProductImageUpload(event) {
    const files = toFileArray(event.target.files);

    if (!files.length) {
      return;
    }

    setCropQueue(files);
    setCroppedFiles([]);
    event.target.value = "";
  }

  async function handleCropComplete(croppedFile) {
    const newCroppedFiles = [...croppedFiles, croppedFile];
    setCroppedFiles(newCroppedFiles);

    const remainingQueue = cropQueue.slice(1);
    setCropQueue(remainingQueue);

    if (remainingQueue.length === 0) {
      setIsUploadingProductImages(true);
      setProductError("");

      try {
        const urls = await uploadImages(newCroppedFiles);
        setProductForm((current) => {
          const existing = current.images
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);

          return {
            ...current,
            images: [...existing, ...urls].join("\n"),
          };
        });
      } catch (uploadError) {
        setProductError(uploadError.message);
      } finally {
        setIsUploadingProductImages(false);
      }
    }
  }

  function handleCropCancel() {
    setCropQueue([]);
    setCroppedFiles([]);
  }

  function handleReCrop(url, index) {
    setReCropImage({ url, index });
  }

  async function handleReCropComplete(croppedFile) {
    setReCropImage(null);
    setIsUploadingProductImages(true);
    setProductError("");

    try {
      const urls = await uploadImages([croppedFile]);
      setProductForm((current) => {
        const existing = current.images
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);

        existing[reCropImage.index] = urls[0];

        return {
          ...current,
          images: existing.join("\n"),
        };
      });
    } catch (uploadError) {
      setProductError(uploadError.message);
    } finally {
      setIsUploadingProductImages(false);
    }
  }

  function handleReCropCancel() {
    setReCropImage(null);
  }

  function removeImage(index) {
    setProductForm((current) => {
      const existing = current.images
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      existing.splice(index, 1);

      return {
        ...current,
        images: existing.join("\n"),
      };
    });
  }

  async function handleCollectionSubmit(event) {
    event.preventDefault();
    setIsSavingCollection(true);
    setCollectionMessage("");
    setCollectionError("");

    try {
      const method = editingCollectionSlug ? "PUT" : "POST";
      const response = await fetch("/api/admin/collections", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...collectionForm,
          slug: editingCollectionSlug,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Collection could not be saved.");
      }

      setCollectionMessage(
        editingCollectionSlug
          ? `Collection "${data.collection.name}" updated successfully.`
          : `Collection "${data.collection.name}" added successfully.`
      );
      resetCollectionForm();
      window.location.reload();
    } catch (submitError) {
      setCollectionError(submitError.message);
    } finally {
      setIsSavingCollection(false);
    }
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setIsSavingProduct(true);
    setProductMessage("");
    setProductError("");

    try {
      const url = editingProductSlug ? `/api/admin/products/${editingProductSlug}` : "/api/admin/products";
      const method = editingProductSlug ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Saree could not be saved.");
      }

      setProductMessage(
        editingProductSlug
          ? "Saree updated successfully."
          : `Saree "${data.product.name}" added successfully.`
      );
      setProductForm({
        ...emptyProductForm,
        collection: collections[0]?.slug || "",
      });
      setEditingProductSlug(null);
      window.location.reload();
    } catch (submitError) {
      setProductError(submitError.message);
    } finally {
      setIsSavingProduct(false);
    }
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-[16px] border border-[#efe7dc] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">
              Collection manager
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#43242d]">
              {editingCollectionSlug ? "Edit collection" : "Add a new collection"}
            </h2>
          </div>
          <p className="text-sm text-[#6d6064]">{collections.length} total collections</p>
        </div>

        <form onSubmit={handleCollectionSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[#43242d] md:col-span-2">
            Select collection to edit
            <select
              value={editingCollectionSlug}
              onChange={(event) => startCollectionEdit(event.target.value)}
              className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
            >
              <option value="">Create a new collection</option>
              {collections.map((collection) => (
                <option key={collection.slug} value={collection.slug}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
            Collection name
            <input
              value={collectionForm.name}
              onChange={(event) =>
                setCollectionForm((current) => ({ ...current, name: event.target.value }))
              }
              className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder="Festive Tissue Collection"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d] md:col-span-2">
            Description
            <textarea
              value={collectionForm.description}
              onChange={(event) =>
                setCollectionForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-28 rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder="Short description for the collection card"
              required
            />
          </label>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-[#43242d]">
              Upload Collection Photo (Crop and upload to Cloudinary)
            </label>
            <div className="rounded-[8px] border-2 border-dashed border-[#d4af37] bg-[#fbf9f6] p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleCollectionImageUpload}
                className="mx-auto block w-full max-w-xs text-sm text-[#6d6064] file:mr-4 file:rounded-full file:border-0 file:bg-[#8e1f3f] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#6f1730]"
              />
              <p className="mt-2 text-xs text-[#94773c]">
                Select one image, crop it, and it will be added to the collection card.
              </p>
            </div>

            {collectionForm.image ? (
              <div
                className="group relative mt-2 h-36 w-36 cursor-pointer overflow-hidden rounded-[8px] border border-[#eaddcf] bg-[#fbf9f6] shadow-sm transition hover:shadow-md"
                onClick={() => setCollectionReCropImage(collectionForm.image)}
                title="Click to re-crop"
              >
                <img
                  src={collectionForm.image}
                  alt="Collection preview"
                  loading="lazy"
                  className="h-full w-full object-cover opacity-100"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeCollectionImage();
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-[#8e1f3f] shadow-sm transition hover:bg-white"
                  title="Remove image"
                >
                  x
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-center transition">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">Re-Crop</span>
                </div>
              </div>
            ) : null}

            {isUploadingCollectionImage ? (
              <p className="text-xs text-[#6d6064]">Uploading collection image to Cloudinary...</p>
            ) : null}
          </div>

          {collectionError ? (
            <p className="text-sm font-medium text-[#8e1f3f] md:col-span-2">{collectionError}</p>
          ) : null}
          {collectionMessage ? (
            <p className="text-sm font-medium text-[#2f6b4f] md:col-span-2">{collectionMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSavingCollection || isUploadingCollectionImage}
            className="w-fit rounded-[8px] bg-[#8e1f3f] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#6f1730] disabled:opacity-70"
          >
            {isSavingCollection ? "Saving..." : editingCollectionSlug ? "Update collection" : "Add collection"}
          </button>
          {editingCollectionSlug ? (
            <button
              type="button"
              onClick={resetCollectionForm}
              className="w-fit rounded-[8px] bg-[#f3ead8] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4a3b32] transition hover:bg-[#e7d8bf]"
            >
              Cancel edit
            </button>
          ) : null}
        </form>
      </section>

      <section className="rounded-[16px] border border-[#efe7dc] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">
              Saree manager
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#43242d]">
              {editingProductSlug ? "Edit saree" : "Add a new saree"}
            </h2>
          </div>
          <p className="text-sm text-[#6d6064]">{products.length} total sarees</p>
        </div>

        <form onSubmit={handleProductSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
            Saree name
            <input
              value={productForm.name}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, name: event.target.value }))
              }
              className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder="Royal Banarasi Saree"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
            Collection
            <select
              value={productForm.collection}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, collection: event.target.value }))
              }
              className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              required
            >
              {collections.map((collection) => (
                <option key={collection.slug} value={collection.slug}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
            Price in INR
            <input
              type="number"
              min="1"
              step="1"
              value={productForm.price}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, price: event.target.value }))
              }
              className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder="5490"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
            Stock
            <input
              type="number"
              min="0"
              step="1"
              value={productForm.stock}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, stock: event.target.value }))
              }
              className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder="10"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d] md:col-span-2">
            Description
            <textarea
              value={productForm.description}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-28 rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder="Describe the saree fabric, fall, and occasion"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
            Tags
            <textarea
              value={productForm.tags}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, tags: event.target.value }))
              }
              className="min-h-24 rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder="bridal, wedding, new-sale"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
            Product details
            <textarea
              value={productForm.details}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, details: event.target.value }))
              }
              className="min-h-24 rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f]"
              placeholder={"6.2 meter saree\nBlouse included\nHandloom finish"}
            />
          </label>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-[#43242d]">
              Upload Photos (Auto-uploads to Cloudinary)
            </label>
            <div className="rounded-[8px] border-2 border-dashed border-[#d4af37] bg-[#fbf9f6] p-4 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleProductImageUpload}
                className="mx-auto block w-full max-w-xs text-sm text-[#6d6064] file:mr-4 file:rounded-full file:border-0 file:bg-[#8e1f3f] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#6f1730]"
              />
              <p className="mt-2 text-xs text-[#94773c]">
                Select one or multiple images from your computer.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-4">
              {productForm.images
                .split(/\r?\n/)
                .map((item) => item.trim())
                .filter(Boolean)
                .map((url, i) => (
                  <div
                    key={i}
                    className="group relative h-32 w-24 cursor-pointer overflow-hidden rounded-[8px] border border-[#eaddcf] bg-[#fbf9f6] shadow-sm transition hover:shadow-md"
                    onClick={() => handleReCrop(url, i)}
                    title="Click to re-crop"
                  >
                    <img
                      src={url}
                      alt="Preview"
                      loading="lazy"
                      className="h-full w-full object-cover opacity-100"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(i);
                      }}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-[#8e1f3f] shadow-sm transition hover:bg-white"
                      title="Remove image"
                    >
                      x
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-center transition">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">Re-Crop</span>
                    </div>
                  </div>
                ))}
            </div>
            {isUploadingProductImages ? (
              <p className="text-xs text-[#6d6064]">Uploading images to Cloudinary...</p>
            ) : null}
          </div>

          {productError ? (
            <p className="text-sm font-medium text-[#8e1f3f] md:col-span-2">{productError}</p>
          ) : null}
          {productMessage ? (
            <p className="text-sm font-medium text-[#2f6b4f] md:col-span-2">{productMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSavingProduct || isUploadingProductImages}
            className="w-fit rounded-[8px] bg-[#8e1f3f] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#6f1730] disabled:opacity-70"
          >
            {isSavingProduct ? "Saving..." : editingProductSlug ? "Update saree" : "Add saree"}
          </button>
          {editingProductSlug ? (
            <button
              type="button"
              onClick={() => {
                setEditingProductSlug(null);
                setProductForm({
                  ...emptyProductForm,
                  collection: collections[0]?.slug || "",
                });
                setProductMessage("");
              }}
              className="w-fit rounded-[8px] bg-[#f3ead8] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4a3b32] transition hover:bg-[#e7d8bf]"
            >
              Cancel Edit
            </button>
          ) : null}
        </form>
      </section>

      <section className="rounded-[16px] border border-[#efe7dc] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">
              Manage Catalog
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#43242d]">Existing sarees</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {products.map((product) => (
            <div
              key={product.slug}
              className="flex flex-col gap-4 rounded-[8px] border border-[#e7d8bf] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded bg-[#f3ead8]">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[#43242d]">{product.name}</h3>
                  <p className="text-sm text-[#6d6064]">
                    Rs. {product.price} • Stock: {product.stock} • {product.collection}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductSlug(product.slug);
                    setProductForm({
                      name: product.name,
                      price: product.price,
                      description: product.description,
                      collection: product.collection,
                      tags: (product.tags || []).join("\n"),
                      details: (product.details || []).join("\n"),
                      images: (product.images || []).join("\n"),
                      stock: product.stock,
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setProductMessage("Editing mode activated. Scroll down to the Add/Edit form and save when done.");
                  }}
                  className="rounded bg-[#f3ead8] px-3 py-1.5 text-sm font-semibold text-[#4a3b32] transition hover:bg-[#e7d8bf]"
                >
                  Edit Data
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Are you sure you want to delete this saree?")) return;
                    try {
                      const res = await fetch(`/api/admin/products/${product.slug}`, { method: "DELETE" });
                      if (!res.ok) throw new Error("Failed to delete");
                      window.location.reload();
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                  className="rounded bg-[#8e1f3f]/10 px-3 py-1.5 text-sm font-semibold text-[#8e1f3f] transition hover:bg-[#8e1f3f]/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {collectionCropImage && (
        <ImageCropperModal
          imageFile={collectionCropImage}
          onCropComplete={handleCollectionCropComplete}
          onCancel={handleCollectionCropCancel}
          title="Crop Collection Image"
          hint="Free crop. Your selected crop will be the final image."
        />
      )}

      {collectionReCropImage && (
        <ImageCropperModal
          imageFile={collectionReCropImage}
          onCropComplete={handleCollectionCropComplete}
          onCancel={handleCollectionCropCancel}
          title="Re-Crop Collection Image"
          hint="Free crop. Your selected crop will be the final image."
        />
      )}

      {cropQueue.length > 0 && (
        <ImageCropperModal
          imageFile={cropQueue[0]}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          title="Crop Product Image"
          hint="Free crop. Your selected crop will be the final image."
        />
      )}

      {reCropImage && (
        <ImageCropperModal
          imageFile={reCropImage.url}
          onCropComplete={handleReCropComplete}
          onCancel={handleReCropCancel}
          title="Re-Crop Product Image"
          hint="Free crop. Your selected crop will be the final image."
        />
      )}
    </div>
  );
}
