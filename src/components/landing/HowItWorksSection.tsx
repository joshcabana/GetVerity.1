import { motion } from "framer-motion";
import { CalendarCheck, Video, Sparkles, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: CalendarCheck,
    step: "1",
    title: "RSVP to a Drop",
    description: "Choose a themed, scheduled session that fits your energy — Night Owls, Creatives, Over 35, and more.",
  },
  {
    icon: Video,
    step: "2",
    title: "Join the 45-second anonymous video call",
    description: "No profiles, no photos. Just real eyes and voice with a stranger for 45 seconds.",
  },
  {
    icon: Sparkles,
    step: "3",
    title: "Both choose Spark or Pass",
    description: "Independently and privately. No rejection notifications — ever. Zero ego damage by design.",
  },
  {
    icon: MessageCircle,
    step: "4",
    title: "Mutual sparks unlock chat",
    description: "Only when both choose Spark do identities reveal. Then voice intros and text chat open up.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="container max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-luxury uppercase text-primary/60 mb-4 block">
            How it works
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground">
            Four steps. No games.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative bg-card border border-border rounded-lg p-6 hover:border-primary/20 transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-serif text-primary">{item.step}</span>
                </div>
                <item.icon className="w-5 h-5 text-primary/60" />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
