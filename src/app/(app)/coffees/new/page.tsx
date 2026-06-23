import { CoffeeForm } from "@/components/coffee-form";
import { PageHeader } from "@/components/page-header";

export default function NewCoffeePage() {
  return (
    <>
      <PageHeader title="Nuevo café" backHref="/coffees" />
      <CoffeeForm />
    </>
  );
}
