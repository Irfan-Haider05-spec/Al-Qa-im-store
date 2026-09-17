import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Shoe Express — premium footwear for movement and style.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <h1 className="font-display text-4xl font-bold">About Shoe Express</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Shoe Express brings together premium footwear designed for movement,
          comfort and everyday style. We curate sneakers, sports shoes and formal
          classics built to last.
        </p>
        <p id="payments">
          <span className="font-medium text-foreground">Payment options.</span> We
          currently accept Cash on Delivery, with card payments coming soon.
        </p>
        <p id="sizes">
          <span className="font-medium text-foreground">Size charts.</span> Our shoes
          follow standard EU/US sizing. If you&apos;re between sizes, we recommend
          sizing up.
        </p>
        <p>
          <span className="font-medium text-foreground">Returns.</span> Enjoy 30-day
          returns on unworn items in original packaging.
        </p>
      </div>
    </div>
  );
}
