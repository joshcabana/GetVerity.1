import { Helmet } from "react-helmet-async";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Sentry } from "@/lib/sentry";
import VerityLogo from "@/components/VerityLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    Sentry.captureMessage(`404: ${location.pathname}`, "warning");
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <Helmet>
        <title>Page Not Found — Verity</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to Verity's homepage." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Page Not Found — Verity" />
        <meta property="og:description" content="The page you're looking for doesn't exist. Return to Verity's homepage." />
        <meta property="og:image" content="https://getverity.com.au/og-logo.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Page Not Found — Verity" />
        <meta name="twitter:description" content="The page you're looking for doesn't exist. Return to Verity's homepage." />
        <meta name="twitter:image" content="https://getverity.com.au/og-logo.png" />
      </Helmet>
      <div className="text-center max-w-md">
        <VerityLogo className="h-8 w-auto mx-auto mb-8" linkTo="/" />
        <p className="font-mono text-6xl text-primary/20 mb-4">404</p>
        <h1 className="font-serif text-2xl text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground/60 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="gold" size="lg" className="group">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
