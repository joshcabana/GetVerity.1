import { Link } from "react-router-dom";
import VerityLogo from "@/components/VerityLogo";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <VerityLogo className="h-6 w-auto" linkTo="/" />
            <span className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/transparency" className="hover:text-foreground transition-colors">
              Transparency
            </Link>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/auth" className="hover:text-primary transition-colors">
              Get verified
            </Link>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 pt-6 border-t border-border/30">
          <span className="text-xs text-muted-foreground/60">
            18+ verified · Nothing stored until mutual Spark
          </span>
          <span className="text-xs text-muted-foreground/40 hidden sm:inline">·</span>
          <span className="text-xs text-muted-foreground/60">
            🇦🇺 Australian Built
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;