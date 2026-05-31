export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "A generous no-login starter plan for everyday tools.",
    features: [
      "45 AI uses per day",
      "No login required",
      "Access to all basic AI tools",
      "Standard processing speed",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹299",
    period: "month",
    description: "More AI capacity for active creators and students.",
    features: [
      "500 AI uses per day",
      "Faster processing",
      "Priority queue",
      "Advanced tools",
    ],
    highlighted: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "₹999",
    period: "month",
    description: "Bulk workflows and export options for teams.",
    features: [
      "Unlimited AI usage",
      "Team workflows",
      "Bulk processing",
      "Export features",
    ],
  },
];
