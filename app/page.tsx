import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CTASection } from "@/components/homepage/CTASection";
import { Features } from "@/components/homepage/Features";
import { Hero } from "@/components/homepage/Hero";
import { Testimonial } from "@/components/homepage/Testimonial";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function Home() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();
  const isAuthenticated = Boolean(data.user);
  const ctaHref = isAuthenticated ? "/dashboard" : "/login";

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <main className="flex-1">
        <Hero ctaHref={ctaHref} />
        <Features />
        <Testimonial />
        <CTASection ctaHref={ctaHref} />
      </main>
      <Footer />
    </>
  );
}
