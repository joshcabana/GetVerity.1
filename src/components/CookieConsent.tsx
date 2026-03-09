import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CONSENT_KEY = "verity_cookie_consent";

/**
 * Minimal cookie/privacy consent banner.
 *
 * Shows once per browser until accepted. Stores the consent timestamp
 * in localStorage. Links to the privacy policy for details.
 *
 * Australian Privacy Act requires clear notice of data collection.
 * This satisfies both the APA and GDPR "soft opt-in" for functional cookies.
 */
const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so the banner doesn't flash on page load
    const timer = setTimeout(() => {
      if (!localStorage.getItem(CONSENT_KEY)) {
        setVisible(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-lg rounded-xl border border-border bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We use essential cookies to keep Verity running and analytics to improve your experience.
              No data is sold to third parties.{" "}
              <Link to="/privacy" className="underline text-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={accept}
                className="font-medium"
              >
                Got it
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
