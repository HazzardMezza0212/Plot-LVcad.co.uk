import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import OpenPlanner from "@/components/site/OpenPlanner";

export const metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="v2">
      <div className="wrap">
        <Header />
        <section style={{ padding: "90px 0 60px", textAlign: "center" }}>
          <span className="kicker">404 · Blind spot</span>
          <h1 className="big disp" style={{ fontSize: "clamp(44px,8vw,110px)" }}>
            No camera covers <em className="hl">this page</em>.
          </h1>
          <p className="lede">It&apos;s been moved, renamed, or never existed. Try one of these instead.</p>
          <div className="ctas">
            <OpenPlanner arrow />
            <Link className="btn btn-g" href="/cctv-cameras">Camera library</Link>
            <Link className="btn btn-g" href="/">Home</Link>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
