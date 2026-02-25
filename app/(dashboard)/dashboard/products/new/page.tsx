import { ProductFormFields } from "../product-form";

export default function NewProductPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Add Product</h2>
      <ProductFormFields mode="create" />
    </div>
  );
}
