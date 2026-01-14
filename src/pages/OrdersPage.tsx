import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Order, OrderStatus } from "../types";
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
import { useOrdersStore } from "../stores/ordersStore";
import { useProductsStore } from "../stores/productsStore";
import type { PaymentStatus } from "../types/order";

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const createOrderFormSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(1, "Customer phone is required"),
    email: z.string().email("Invalid email address"),
  }),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

type CreateOrderFormData = z.infer<typeof createOrderFormSchema>;

function OrdersPage() {
  const items = useOrdersStore((state) => state.items);
  const loading = useOrdersStore((state) => state.loading);
  const error = useOrdersStore((state) => state.error);
  const fetchList = useOrdersStore((state) => state.fetchList);
  const createOne = useOrdersStore((state) => state.createOne);
  const deleteOne = useOrdersStore((state) => state.deleteOne);
  const cancelOrder = useOrdersStore((state) => state.cancelOrder);

  const products = useProductsStore((state) => state.items);
  const productsLoading = useProductsStore((state) => state.loading);
  const fetchProducts = useProductsStore((state) => state.fetchList);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [deleteOrderCode, setDeleteOrderCode] = useState<string | null>(null);
  const [cancelOrderCode, setCancelOrderCode] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const currentOrder = useMemo(() => {
    if (viewOrderId) {
      return items.find((o) => o.id === viewOrderId) || null;
    }
    if (editOrderId) {
      return items.find((o) => o.id === editOrderId) || null;
    }
    return null;
  }, [viewOrderId, editOrderId, items]);

  const pagination = usePagination({ items, itemsPerPage: 10 });
  const { paginatedItems } = pagination;

  const createForm = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      customer: {
        name: "",
        phone: "",
        email: "",
      },
      items: [{ productId: "", quantity: 1 }],
    },
  });


  const isCreateMode = !viewOrderId && !editOrderId;
  const isSubmitting = createForm.formState.isSubmitting;

  const createFields = useFieldArray({
    control: createForm.control,
    name: "items",
  });

  useEffect(() => {
    fetchList();
    if (products.length === 0 && !productsLoading) {
      fetchProducts();
    }
  }, [fetchList, fetchProducts, products.length, productsLoading]);

  const handleRefresh = useCallback(() => {
    fetchList();
  }, [fetchList]);

  const handleView = useCallback((orderId: string) => {
    setViewOrderId(orderId);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((orderId: string) => {
    setEditOrderId(orderId);
    setViewOrderId(null);
    setIsModalOpen(true);
    setCancelError(null);
  }, []);

  const handleDelete = async (orderCode: string) => {
    try {
      await deleteOne(orderCode);
      setDeleteOrderCode(null);
      fetchList();
    } catch {
      // Error is handled by store
    }
  };

  const getOrderStatusBadge = useCallback((status: OrderStatus) => {
    const statusConfig: Record<
      OrderStatus,
      {
        variant: "default" | "success" | "warning" | "error" | "info";
        label: string;
      }
    > = {
      PENDING: { variant: "warning", label: "Pending" },
      IN_TRANSIT: { variant: "info", label: "In Transit" },
      OUT_FOR_DELIVERY: { variant: "info", label: "Out for Delivery" },
      DELIVERED: { variant: "success", label: "Delivered" },
      CANCELLED: { variant: "error", label: "Cancelled" },
      RETURNED: { variant: "error", label: "Returned" },
    };
    const config = statusConfig[status] || {
      variant: "default" as const,
      label: status,
    };
    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  }, []);

  const getPaymentStatusBadge = useCallback((status: PaymentStatus) => {
    return (
      <Badge variant="default" size="sm">
        {status}
      </Badge>
    );
  }, []);

  const getShippingStatusBadge = useCallback((status: string | undefined | null) => {
    type ShippingStatusConfig = {
      variant: "default" | "success" | "warning" | "error" | "info";
      label: string;
    };

    const normalized = status?.toUpperCase() ?? "UNKNOWN";

    const statusConfig: Record<string, ShippingStatusConfig> = {
      PENDING: { variant: "warning", label: "Awaiting Pickup" },
      IN_TRANSIT: { variant: "info", label: "On the Way" },
      OUT_FOR_DELIVERY: { variant: "info", label: "Courier Out" },
      DELIVERED: { variant: "success", label: "Shipment Received" },
      RETURNED: { variant: "error", label: "Returned to Sender" },
      CANCELLED: { variant: "error", label: "Shipment Cancelled" },
      UNKNOWN: { variant: "default", label: "Unknown" },
    };

    const config = statusConfig[normalized] ?? statusConfig.UNKNOWN;

    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  }, []);

  const getProductName = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) {
        return `Unknown product (${productId})`;
      }
      return product.name;
    },
    [products]
  );



  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setViewOrderId(null);
    setEditOrderId(null);
    setCancelError(null);
    createForm.reset({
      customer: {
        name: "",
        phone: "",
        email: "",
      },
      items: [{ productId: "", quantity: 1 }],
    });
  }, [createForm]);

  const handleCancelOrder = useCallback(async () => {
    if (!cancelOrderCode) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(cancelOrderCode);
      setCancelOrderCode(null);
      setIsModalOpen(false);
      setViewOrderId(null);
      setEditOrderId(null);
      setCancelError(null);
      createForm.reset({
        customer: {
          name: "",
          phone: "",
          email: "",
        },
        items: [{ productId: "", quantity: 1 }],
      });
      fetchList();
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : "Failed to cancel order"
      );
    } finally {
      setIsCancelling(false);
    }
  }, [cancelOrderCode, cancelOrder, fetchList, createForm]);

  useEffect(() => {
    if (!viewOrderId && !editOrderId) {
      createForm.reset({
        customer: {
          name: "",
          phone: "",
          email: "",
        },
        items: [{ productId: "", quantity: 1 }],
      });
    }
  }, [viewOrderId, editOrderId, createForm]);

  const onCreateSubmit = async (data: CreateOrderFormData) => {
    try {
      const payload = {
        customer: {
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email,
        },
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await createOne(payload);
      handleCloseModal();
      fetchList();
    } catch {
      // Error is handled by store
    }
  };


  const columns: Column<Order>[] = useMemo(
    () => [
      {
        header: "Customer",
        accessor: (order: Order) => `${order.customer.name}`,
      },
      {
        header: "Phone",
        accessor: (order: Order) => `${order.customer.phone}`,
      },
      {
        header: "Items",
        accessor: (order: Order) =>
          `${order.items.length} item${order.items.length !== 1 ? "s" : ""}`,
      },
      {
        header: "Total",
        accessor: (order: Order) => {
          const total = order.items.reduce(
            (sum, item) => sum + item.totalPrice,
            0
          );

          return formatMoney(total);
        },
      },
      {
        header: "Order Status",
        accessor: (order: Order) => getOrderStatusBadge(order.orderStatus),
      },
      {
        header: "Payment Status",
        accessor: (order: Order) => getPaymentStatusBadge(order.paymentStatus),
      },
      {
        header: "Actions",
        accessor: (order: Order) => (
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
              aria-label="View order"
              variant="ghost"
              size="sm"
              onClick={() => handleView(order.id)}
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
              aria-label="Edit order"
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(order.id)}
              disabled={
                order.orderStatus.toUpperCase() !== "PENDING"
              }
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              aria-label="Delete order"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOrderCode(order.orderCode)}
              disabled={
                order.orderStatus.toUpperCase() !== "PENDING" ||
                !order.orderCode
              }
              className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ),
      },
    ],
    [getOrderStatusBadge, getPaymentStatusBadge, handleView, handleEdit]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
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
              setViewOrderId(null);
              setEditOrderId(null);
              setIsModalOpen(true);
            }}
            disabled={loading}
          >
            Create Order
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
          <p className="text-gray-500">Loading orders...</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <DataTable
              columns={columns}
              data={paginatedItems}
              getRowKey={(order) => order.id}
              emptyMessage="No orders found"
            />
          </div>
          <PaginationControls pagination={pagination} />
        </>
      )}

      <Modal
        open={isModalOpen}
        title={
          viewOrderId
            ? "View Order"
            : editOrderId
            ? "Edit Order"
            : "Create Order"
        }
        onClose={handleCloseModal}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              {viewOrderId || editOrderId ? "Close" : "Cancel"}
            </Button>
            {isCreateMode && (
              <Button
                onClick={createForm.handleSubmit(onCreateSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            )}
            {editOrderId && currentOrder && (
              <Button
                variant="primary"
                onClick={() => setCancelOrderCode(currentOrder.orderCode)}
                disabled={isCancelling || !currentOrder.orderCode}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          {(viewOrderId || editOrderId) && currentOrder ? (
            <>
              {cancelError && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{cancelError}</p>
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Order</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">ID</div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentOrder.id}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Order Code
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentOrder.orderCode}
                    </p>
                  </div>
                  {currentOrder.createdAt && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Created At
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDateTime(currentOrder.createdAt)}
                      </p>
                    </div>
                  )}
                  {currentOrder.updatedAt && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Updated At
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDateTime(currentOrder.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Customer Name
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentOrder.customer.name}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Customer Phone
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentOrder.customer.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Customer Email
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentOrder.customer.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrder.items.map((item, index) => (
                        <tr key={`${item.productId}-${index}`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.productName ||
                              getProductName(item.productId)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatMoney(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {currentOrder.pricing && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pricing
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Sub Total
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatMoney(currentOrder.pricing.subTotal)}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Shipping Fee
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatMoney(currentOrder.pricing.shippingFee)}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Discount
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatMoney(currentOrder.pricing.discount)}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Total Amount
                      </div>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatMoney(currentOrder.pricing.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Currency
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {currentOrder.pricing.currency || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentOrder.shipping && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Shipping Info
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {currentOrder.shipping.status && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Shipping Status
                        </div>
                        <div className="mt-1">
                          {getShippingStatusBadge(currentOrder.shipping.status)}
                        </div>
                      </div>
                    )}
                    {currentOrder.shipping.shipper?.name && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Shipper Name
                        </div>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentOrder.shipping.shipper.name}
                        </p>
                      </div>
                    )}
                    {currentOrder.paymentMethod && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Payment Method
                        </div>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentOrder.paymentMethod}
                        </p>
                      </div>
                    )}
                    {currentOrder.shipping.estimatedDeliveryTime && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Estimated Delivery Time
                        </div>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDateTime(
                            currentOrder.shipping.estimatedDeliveryTime
                          )}
                        </p>
                      </div>
                    )}
                    {currentOrder.shipping.address && (
                      <>
                        {currentOrder.shipping.address.receiverName && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Receiver Name
                            </div>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentOrder.shipping.address.receiverName}
                            </p>
                          </div>
                        )}
                        {currentOrder.shipping.address.receiverPhone && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Receiver Phone
                            </div>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentOrder.shipping.address.receiverPhone}
                            </p>
                          </div>
                        )}
                        {currentOrder.shipping.address.fullAddress && (
                          <div className="sm:col-span-2">
                            <div className="text-sm font-medium text-gray-700">
                              Full Address
                            </div>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentOrder.shipping.address.fullAddress}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {currentOrder.shipping.shipper && (
                      <>
                        {currentOrder.shipping.shipper.phone && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Shipper Phone
                            </div>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentOrder.shipping.shipper.phone}
                            </p>
                          </div>
                        )}
                        {currentOrder.shipping.shipper.vehicleType && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Vehicle Type
                            </div>
                            <p className="mt-1 text-sm text-gray-900">
                              {currentOrder.shipping.shipper.vehicleType}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {currentOrder.shipping.deliveredAt && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Delivered At
                        </div>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDateTime(currentOrder.shipping.deliveredAt)}
                        </p>
                      </div>
                    )}
                    {currentOrder.shipping.failedReason && (
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-gray-700">
                          Failed Reason
                        </div>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentOrder.shipping.failedReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Order Status
                    </div>
                    <div className="mt-1">
                      {getOrderStatusBadge(currentOrder.orderStatus)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Payment Status
                    </div>
                    <div className="mt-1">
                      {getPaymentStatusBadge(currentOrder.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : isCreateMode ? (
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Customer Name *"
                    {...createForm.register("customer.name")}
                    error={createForm.formState.errors.customer?.name?.message}
                    type="text"
                  />
                  <Input
                    label="Customer Phone *"
                    {...createForm.register("customer.phone")}
                    error={createForm.formState.errors.customer?.phone?.message}
                    type="text"
                  />
                  <Input
                    label="Customer Email *"
                    {...createForm.register("customer.email")}
                    error={createForm.formState.errors.customer?.email?.message}
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      createFields.append({ productId: "", quantity: 1 })
                    }
                  >
                    Add Item
                  </Button>
                </div>
                {createForm.formState.errors.items && (
                  <p className="text-sm text-red-600">
                    {createForm.formState.errors.items.message}
                  </p>
                )}
                <div className="space-y-4">
                  {createFields.fields.map((field, index) => {
                    const item = createForm.watch(`items.${index}`);
                    const product = item?.productId
                      ? products.find((p) => p.id === item.productId)
                      : null;
                    const price = product?.price ?? 0;
                    const quantity = item?.quantity ?? 0;
                    const subtotal = price * quantity;

                    return (
                      <div
                        key={field.id}
                        className="p-4 border border-gray-200 rounded-lg space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-700">
                            Item {index + 1}
                          </h4>
                          {createFields.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => createFields.remove(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Select
                            label="Product *"
                            {...createForm.register(`items.${index}.productId`)}
                            error={
                              createForm.formState.errors.items?.[index]
                                ?.productId?.message
                            }
                            options={[
                              { value: "", label: "Select a product" },
                              ...products.map((p) => ({
                                value: p.id,
                                label: p.name,
                              })),
                            ]}
                          />
                          <Input
                            label="Quantity *"
                            {...createForm.register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                            error={
                              createForm.formState.errors.items?.[index]
                                ?.quantity?.message
                            }
                            type="number"
                            min="1"
                          />
                        </div>
                        {product && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{product.name}</span>
                            {" - "}
                            <span>{formatMoney(price)}</span>
                            {quantity > 0 && (
                              <>
                                {" × "}
                                <span>{quantity}</span>
                                {" = "}
                                <span className="font-medium">
                                  {formatMoney(subtotal)}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          ):<></>}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOrderCode !== null}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteOrderCode) {
            handleDelete(deleteOrderCode);
          }
        }}
        onCancel={() => setDeleteOrderCode(null)}
      />

      <ConfirmDialog
        open={cancelOrderCode !== null}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        variant="danger"
        onConfirm={handleCancelOrder}
        onCancel={() => {
          setCancelOrderCode(null);
          setCancelError(null);
        }}
      />
    </div>
  );
}

export default OrdersPage;
