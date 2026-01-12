import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Product } from "../types";
import { formatMoney, formatDateTime } from "../utils/format";
import { usePagination } from "../hooks";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import IconButton from "../components/ui/IconButton";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import DataTable, { type Column } from "../components/common/DataTable";
import PaginationControls from "../components/common/PaginationControls";
import { useProductsStore } from "../stores/productsStore";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  stock: z.number().int().min(0, "Stock must be greater than or equal to 0"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type ProductFormData = z.infer<typeof productFormSchema>;

function ProductsPage() {
  const items = useProductsStore((state) => state.items);
  const loading = useProductsStore((state) => state.loading);
  const error = useProductsStore((state) => state.error);
  const fetchList = useProductsStore((state) => state.fetchList);
  const createOne = useProductsStore((state) => state.createOne);
  const updateOne = useProductsStore((state) => state.updateOne);
  const deleteOne = useProductsStore((state) => state.deleteOne);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      status: "ACTIVE",
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const pagination = usePagination({ items, itemsPerPage: 10 });
  const { paginatedItems } = pagination;

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleRefresh = useCallback(() => {
    fetchList();
  }, [fetchList]);

  const handleView = useCallback((productId: string) => {
    setViewProductId(productId);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((productId: string) => {
    setEditProductId(productId);
    setIsModalOpen(true);
  }, []);

  const handleDelete = async (productId: string) => {
    try {
      await deleteOne(productId);
      setDeleteProductId(null);
    } catch {
      // Error is handled by store
    }
  };

  const getStatusBadge = useCallback(
    (status: "ACTIVE" | "INACTIVE" | undefined) => {
      if (status === "ACTIVE") {
        return (
          <Badge variant="success" size="sm">
            Active
          </Badge>
        );
      }
      if (status === "INACTIVE") {
        return (
          <Badge variant="error" size="sm">
            Inactive
          </Badge>
        );
      }
      return (
        <Badge variant="default" size="sm">
          Unknown
        </Badge>
      );
    },
    []
  );

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        header: "Name",
        accessor: "name",
      },
      {
        header: "Price",
        accessor: (product) => formatMoney(product.price),
      },
      {
        header: "Stock",
        accessor: "stock",
      },
      {
        header: "Status",
        accessor: (product) => getStatusBadge(product.status),
      },
      {
        header: "Updated",
        accessor: (product) => formatDateTime(product.updated_at),
      },
      {
        header: "Actions",
        accessor: (product) => (
          <div className="flex items-center gap-2">
            <IconButton
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
              aria-label="View product"
              variant="ghost"
              size="sm"
              onClick={() => handleView(product.id)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            />
            <IconButton
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
              aria-label="Edit product"
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(product.id)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            />
            <IconButton
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
              aria-label="Delete product"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteProductId(product.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            />
          </div>
        ),
      },
    ],
    [getStatusBadge, handleView, handleEdit]
  );

  const currentProduct = useMemo(() => {
    if (viewProductId) {
      return items.find((p) => p.id === viewProductId) || null;
    }
    if (editProductId) {
      return items.find((p) => p.id === editProductId) || null;
    }
    return null;
  }, [viewProductId, editProductId, items]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setViewProductId(null);
    setEditProductId(null);
    reset();
  };

  useEffect(() => {
    if (editProductId && currentProduct) {
      setValue("name", currentProduct.name);
      setValue("description", currentProduct.description || "");
      setValue("price", currentProduct.price);
      setValue("stock", currentProduct.stock);
      setValue("status", currentProduct.status || "ACTIVE");
    } else if (!viewProductId && !editProductId) {
      reset({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        status: "ACTIVE",
      });
    }
  }, [editProductId, currentProduct, viewProductId, setValue, reset]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        stock: data.stock,
        status: data.status,
      };

      if (editProductId) {
        await updateOne(editProductId, payload);
      } else {
        await createOne(payload);
      }

      handleCloseModal();
    } catch {
      // Error is handled by store
    }
  };

  const modalTitle = useMemo(() => {
    if (viewProductId) return "View Product";
    if (editProductId) return "Edit Product";
    return "Create Product";
  }, [viewProductId, editProductId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              setViewProductId(null);
              setEditProductId(null);
              setIsModalOpen(true);
            }}
            disabled={loading}
          >
            Create Product
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <DataTable
              columns={columns}
              data={paginatedItems}
              getRowKey={(product) => product.id}
              emptyMessage="No products found"
            />
          </div>
          <PaginationControls pagination={pagination} />
        </>
      )}

      <Modal
        open={isModalOpen}
        title={modalTitle}
        onClose={handleCloseModal}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              {viewProductId ? "Close" : "Cancel"}
            </Button>
            {!viewProductId && (
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          {viewProductId && currentProduct ? (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Product ID
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentProduct.id}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Name
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentProduct.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pricing & Inventory
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Price
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatMoney(currentProduct.price)}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Stock
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentProduct.stock} units
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Status
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(currentProduct.status)}
                    </div>
                  </div>
                </div>
              </div>

              {currentProduct.description && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Additional Details
                  </h3>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Description
                    </div>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {currentProduct.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Metadata
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Created At
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTime(currentProduct.created_at)}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Updated At
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTime(currentProduct.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  label="Name *"
                  {...register("name")}
                  error={errors.name?.message}
                  type="text"
                />
              </div>

              <div>
                <Input
                  label="Description"
                  {...register("description")}
                  error={errors.description?.message}
                  type="text"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Price (VND) *"
                  {...register("price", { valueAsNumber: true })}
                  error={errors.price?.message}
                  type="number"
                  step="0.01"
                  min="0"
                />
                <Input
                  label="Stock *"
                  {...register("stock", { valueAsNumber: true })}
                  error={errors.stock?.message}
                  type="number"
                  min="0"
                />
              </div>

              <div>
                <Select
                  label="Status *"
                  {...register("status")}
                  error={errors.status?.message}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                />
              </div>
            </form>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteProductId !== null}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (deleteProductId) {
            await handleDelete(deleteProductId);
            setDeleteProductId(null);
            fetchList();
          }
        }}
        onCancel={() => setDeleteProductId(null)}
      />
    </div>
  );
}

export default ProductsPage;
